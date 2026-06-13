"use server";
// Iteración 1: CRUD de canciones (crear/editar/borrar) con limpieza de Storage.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Module, BackingSource, LyricsFormat } from "@/types/database";

export interface SongInput {
  id: string; // generado en cliente (para alinear con la ruta de Storage)
  module: Module;
  title: string;
  artist: string | null;
  style: string | null;
  tags: string[];
  backing_source: BackingSource | null;
  backing_path: string | null;
  backing_youtube: string | null;
  lyrics_format: LyricsFormat;
  lyrics_content: string | null;
  chords_content: string | null;
  notes: string | null;
  document_path: string | null;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateLibrary() {
  revalidatePath("/");
  revalidatePath("/biblioteca");
  revalidatePath("/voz");
  revalidatePath("/guitarra");
}

export async function createSong(input: SongInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  if (!input.title.trim()) return { ok: false, error: "El título es obligatorio." };

  const { error } = await supabase.from("songs").insert({
    id: input.id,
    user_id: user.id,
    module: input.module,
    title: input.title.trim(),
    artist: input.artist,
    style: input.style,
    tags: input.tags,
    backing_source: input.backing_source,
    backing_path: input.backing_path,
    backing_youtube: input.backing_youtube,
    lyrics_format: input.lyrics_format,
    lyrics_content: input.lyrics_content,
    chords_format: input.chords_content ? "chordpro" : null,
    chords_content: input.chords_content,
    notes: input.notes,
    document_path: input.document_path,
  });

  if (error) return { ok: false, error: error.message };
  revalidateLibrary();
  return { ok: true };
}

export async function updateSong(input: SongInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  if (!input.title.trim()) return { ok: false, error: "El título es obligatorio." };

  const { error } = await supabase
    .from("songs")
    .update({
      module: input.module,
      title: input.title.trim(),
      artist: input.artist,
      style: input.style,
      tags: input.tags,
      backing_source: input.backing_source,
      backing_path: input.backing_path,
      backing_youtube: input.backing_youtube,
      lyrics_format: input.lyrics_format,
      lyrics_content: input.lyrics_content,
      chords_format: input.chords_content ? "chordpro" : null,
      chords_content: input.chords_content,
      notes: input.notes,
      document_path: input.document_path,
    })
    .eq("id", input.id); // RLS garantiza que solo afecta a canciones del usuario

  if (error) return { ok: false, error: error.message };
  revalidateLibrary();
  revalidatePath(`/song/${input.id}`);
  return { ok: true };
}

export async function deleteSong(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  // Limpia el backing track de Storage (best-effort) antes de borrar la fila.
  // Las filas de recordings se eliminan por cascade en la BD (decisión acordada).
  const prefix = `${user.id}/${id}`;
  const { data: files } = await supabase.storage
    .from("backing-tracks")
    .list(prefix);
  if (files && files.length > 0) {
    await supabase.storage
      .from("backing-tracks")
      .remove(files.map((f) => `${prefix}/${f.name}`));
  }

  const { error } = await supabase.from("songs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateLibrary();
  return { ok: true };
}
