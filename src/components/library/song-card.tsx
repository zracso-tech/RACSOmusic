import Link from "next/link";
import { Mic, Guitar, Youtube, Music } from "lucide-react";
import type { Song } from "@/types/database";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SongCard({ song, view }: { song: Song; view: "grid" | "list" }) {
  const ModuleIcon = song.module === "guitar" ? Guitar : Mic;
  const BackingIcon =
    song.backing_source === "youtube"
      ? Youtube
      : song.backing_source === "file"
        ? Music
        : null;

  if (view === "list") {
    return (
      <Link
        href={`/song/${song.id}`}
        className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/50"
      >
        <ModuleIcon size={18} className="shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{song.title}</p>
          <p className="truncate text-sm text-muted">
            {song.artist ?? "—"}
            {song.style ? ` · ${song.style}` : ""}
          </p>
        </div>
        {BackingIcon && <BackingIcon size={16} className="shrink-0 text-muted" />}
        <span className="hidden shrink-0 text-xs text-muted sm:block">
          {formatDate(song.created_at)}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/song/${song.id}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <div className="flex items-center justify-between">
        <ModuleIcon size={18} className="text-accent" />
        {BackingIcon && <BackingIcon size={16} className="text-muted" />}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{song.title}</p>
        <p className="truncate text-sm text-muted">{song.artist ?? "—"}</p>
      </div>
      {song.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {song.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-background px-2 py-0.5 text-xs text-muted"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
      <span className="mt-auto text-xs text-muted">
        {formatDate(song.created_at)}
      </span>
    </Link>
  );
}
