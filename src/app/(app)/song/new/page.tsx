import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SongForm } from "@/components/song/song-form";
import type { Module } from "@/types/database";

export default async function NewSongPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const { module } = await searchParams;
  const initialModule: Module = module === "guitar" ? "guitar" : "voice";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Nueva canción
      </h1>

      <SongForm mode="create" initialModule={initialModule} />
    </div>
  );
}
