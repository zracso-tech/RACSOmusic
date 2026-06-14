import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Song } from "@/types/database";

const basename = (p: string) => p.split("/").pop() ?? "file";

/**
 * Envía (copia) la ficha COMPLETA de una canción propia a otros usuarios,
 * incluyendo el audio subido y el documento. Usa la clave de servicio para
 * copiar los archivos a la carpeta del destinatario (cruza el RLS de Storage).
 * No se copian las grabaciones.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." },
      { status: 500 },
    );
  }

  let songId: string;
  let recipientIds: string[];
  try {
    const body = await req.json();
    songId = body.songId;
    recipientIds = Array.isArray(body.recipientIds) ? body.recipientIds : [];
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }
  if (!songId || recipientIds.length === 0) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }

  // Verificar propiedad de la canción origen.
  const { data: songData } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .eq("user_id", user.id)
    .single();
  if (!songData) {
    return NextResponse.json({ error: "Canción no encontrada." }, { status: 404 });
  }
  const song = songData as Song;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const senderName = profile?.display_name || user.email?.split("@")[0] || null;

  const admin = createAdminClient();
  let sent = 0;

  for (const recipientId of recipientIds) {
    if (!recipientId || recipientId === user.id) continue;
    const newId = crypto.randomUUID();

    // Copiar audio subido (si lo hay) a la carpeta del destinatario.
    let backing_path: string | null = null;
    let backing_source = song.backing_source;
    if (song.backing_source === "file" && song.backing_path) {
      const dest = `${recipientId}/${newId}/${basename(song.backing_path)}`;
      const { error } = await admin.storage
        .from("backing-tracks")
        .copy(song.backing_path, dest);
      if (error) backing_source = null; // si falla, queda sin backing
      else backing_path = dest;
    }

    // Copiar documento (si lo hay).
    let document_path: string | null = null;
    if (song.document_path) {
      const dest = `${recipientId}/${newId}/${basename(song.document_path)}`;
      const { error } = await admin.storage
        .from("documents")
        .copy(song.document_path, dest);
      if (!error) document_path = dest;
    }

    const { error: insErr } = await admin.from("songs").insert({
      id: newId,
      user_id: recipientId,
      module: song.module,
      title: song.title,
      artist: song.artist,
      style: song.style,
      tags: song.tags,
      backing_source,
      backing_path,
      backing_youtube:
        song.backing_source === "youtube" ? song.backing_youtube : null,
      lyrics_format: song.lyrics_format,
      lyrics_content: song.lyrics_content,
      chords_format: song.chords_format,
      chords_content: song.chords_content,
      notes: song.notes,
      document_path,
      sent_by_name: senderName,
    });
    if (!insErr) sent++;
  }

  return NextResponse.json({ sent });
}
