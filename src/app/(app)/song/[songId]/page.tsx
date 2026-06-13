import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Play,
  Circle,
  Mic,
  Guitar,
  Youtube,
  Music,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getYouTubeId, youTubeThumb } from "@/lib/youtube";
import { DeleteSongButton } from "@/components/song/delete-song-button";
import type { Song } from "@/types/database";

export default async function SongDetailPage({
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

  const ModuleIcon = song.module === "guitar" ? Guitar : Mic;
  const backHref = song.module === "guitar" ? "/guitarra" : "/voz";
  const ytId = song.backing_youtube ? getYouTubeId(song.backing_youtube) : null;

  // URL firmada del documento adjunto (si lo hay).
  let documentUrl: string | null = null;
  if (song.document_path) {
    const { data: signed } = await supabase.storage
      .from("documents")
      .createSignedUrl(song.document_path, 60 * 60);
    documentUrl = signed?.signedUrl ?? null;
  }
  const docName = song.document_path?.split("/").pop() ?? "Documento";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      {/* Cabecera */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <ModuleIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {song.title}
            </h1>
            <p className="text-muted">{song.artist ?? "Sin artista"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              {song.style && (
                <span className="rounded-full border border-border px-2 py-0.5">
                  {song.style}
                </span>
              )}
              {song.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-surface px-2 py-0.5"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href={`/song/${song.id}/play`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Play size={18} />
          Reproducir
        </Link>
        <Link
          href={`/song/${song.id}/record`}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-surface"
        >
          <Circle size={14} className="fill-red-500 text-red-500" />
          Grabar
        </Link>
        <Link
          href={`/song/${song.id}/edit`}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-surface"
        >
          <Pencil size={16} />
          Editar
        </Link>
        <DeleteSongButton songId={song.id} />
      </div>

      {/* Backing track */}
      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted">Backing track</h2>
        {song.backing_source === "youtube" && ytId ? (
          <a
            href={song.backing_youtube ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youTubeThumb(ytId)}
              alt=""
              className="h-12 w-20 rounded-lg object-cover"
            />
            <span className="flex items-center gap-2 text-sm">
              <Youtube size={16} className="text-red-500" />
              Vídeo de YouTube
            </span>
          </a>
        ) : song.backing_source === "file" ? (
          <div className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
            <Music size={16} className="text-accent" />
            Archivo de audio adjunto
          </div>
        ) : (
          <p className="text-sm text-muted">Sin backing track.</p>
        )}
      </section>

      {/* Acordes (en guitarra es lo principal: va primero) */}
      {song.chords_content && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-muted">
            Acordes (ChordPro)
          </h2>
          <pre className="overflow-x-auto whitespace-pre rounded-xl border border-border bg-surface p-4 font-mono text-sm leading-relaxed">
            {song.chords_content}
          </pre>
        </section>
      )}

      {/* Letra */}
      {song.lyrics_content && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-muted">
            {song.chords_content ? "Voz" : "Letra"}
          </h2>
          <pre className="whitespace-pre-wrap rounded-xl border border-border bg-surface p-4 font-sans text-sm leading-relaxed">
            {song.lyrics_content}
          </pre>
        </section>
      )}

      {/* Información adicional: notas + documento */}
      {(song.notes || documentUrl) && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-muted">
            Información adicional
          </h2>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
            {song.notes && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {song.notes}
              </p>
            )}
            {documentUrl && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                <FileText size={16} />
                {docName}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
