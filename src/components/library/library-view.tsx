"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SongCard } from "./song-card";
import type { Song } from "@/types/database";

type SortKey = "created" | "practiced" | "alpha";
type View = "grid" | "list";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "created", label: "Fecha de creación" },
  { key: "practiced", label: "Última práctica" },
  { key: "alpha", label: "Alfabético" },
];

export function LibraryView({
  title,
  songs,
  newHref,
}: {
  title: string;
  songs: Song[];
  newHref: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("created");
  const [view, setView] = useState<View>("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = songs;
    if (q) {
      list = songs.filter((s) =>
        [s.title, s.artist, s.style, ...s.tags]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "alpha") return a.title.localeCompare(b.title, "es");
      if (sort === "practiced") {
        return (
          new Date(b.last_practiced_at ?? 0).getTime() -
          new Date(a.last_practiced_at ?? 0).getTime()
        );
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    return sorted;
  }, [songs, query, sort]);

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted">
            {songs.length} {songs.length === 1 ? "canción" : "canciones"}
          </p>
        </div>
        <Link
          href={newHref}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nueva canción</span>
        </Link>
      </div>

      {/* Controles */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, artista, estilo o etiqueta…"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {sortOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="flex h-11 items-center rounded-xl border border-border bg-surface p-1">
            {(
              [
                { key: "grid", icon: LayoutGrid },
                { key: "list", icon: List },
              ] as const
            ).map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                aria-label={key === "grid" ? "Vista cuadrícula" : "Vista lista"}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg transition-colors",
                  view === key
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground",
                )}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          No hay canciones que coincidan con “{query}”.
        </p>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.id}>
              <SongCard song={s} view="grid" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((s) => (
            <li key={s.id}>
              <SongCard song={s} view="list" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
