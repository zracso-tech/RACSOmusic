import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SongForm } from "@/components/song/song-form";
import type { Song } from "@/types/database";

export default async function EditSongPage({
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href={`/song/${songId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Editar canción
      </h1>

      <SongForm mode="edit" song={song} />
    </div>
  );
}
