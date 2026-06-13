import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RecordStudio } from "@/components/recorder/record-studio";
import {
  RecordingsHistory,
  type RecordingItem,
} from "@/components/recorder/recordings-history";
import type { Song, Recording } from "@/types/database";

export default async function RecordSongPage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = await params;
  const supabase = await createClient();

  const { data: songData } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .single();
  if (!songData) notFound();
  const song = songData as Song;

  // URL firmada del backing (para la mezcla, si es archivo).
  let audioUrl: string | null = null;
  if (song.backing_source === "file" && song.backing_path) {
    const { data: signed } = await supabase.storage
      .from("backing-tracks")
      .createSignedUrl(song.backing_path, 60 * 60);
    audioUrl = signed?.signedUrl ?? null;
  }

  // Histórico de grabaciones (más recientes primero) con URLs firmadas.
  const { data: recData } = await supabase
    .from("recordings")
    .select("*")
    .eq("song_id", songId)
    .order("created_at", { ascending: false });
  const recs = (recData ?? []) as Recording[];

  let recordings: RecordingItem[] = [];
  if (recs.length > 0) {
    const { data: signedList } = await supabase.storage
      .from("recordings")
      .createSignedUrls(
        recs.map((r) => r.storage_path),
        60 * 60,
      );
    recordings = recs.map((r, i) => ({
      id: r.id,
      created_at: r.created_at,
      duration_seconds: r.duration_seconds,
      note: r.note,
      has_backing_mix: r.has_backing_mix,
      storage_path: r.storage_path,
      url: signedList?.[i]?.signedUrl ?? null,
    }));
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href={`/song/${songId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Grabar</h1>
        <p className="text-muted">
          {song.title}
          {song.artist ? ` · ${song.artist}` : ""}
        </p>
      </div>

      <RecordStudio song={song} audioUrl={audioUrl} />

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-muted">
          Histórico de grabaciones
        </h2>
        <RecordingsHistory songId={songId} recordings={recordings} />
      </div>
    </div>
  );
}
