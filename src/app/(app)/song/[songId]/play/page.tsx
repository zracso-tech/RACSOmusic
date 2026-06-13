import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Player } from "@/components/player/player";
import type { Song } from "@/types/database";

export default async function PlaySongPage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .single();

  if (!data) notFound();
  const song = data as Song;

  // URL firmada temporal para el backing track subido (bucket privado).
  let audioUrl: string | null = null;
  if (song.backing_source === "file" && song.backing_path) {
    const { data: signed } = await supabase.storage
      .from("backing-tracks")
      .createSignedUrl(song.backing_path, 60 * 60);
    audioUrl = signed?.signedUrl ?? null;
  }

  return <Player song={song} audioUrl={audioUrl} />;
}
