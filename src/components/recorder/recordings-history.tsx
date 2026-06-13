"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Mic, Trash2 } from "lucide-react";
import { deleteRecording } from "@/app/(app)/song/[songId]/record/actions";

export interface RecordingItem {
  id: string;
  created_at: string;
  duration_seconds: number | null;
  note: string | null;
  has_backing_mix: boolean;
  storage_path: string;
  url: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDur(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function RecordingsHistory({
  songId,
  recordings,
}: {
  songId: string;
  recordings: RecordingItem[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(rec: RecordingItem) {
    if (!confirm("¿Borrar esta grabación? No se puede deshacer.")) return;
    setDeletingId(rec.id);
    const res = await deleteRecording({
      id: rec.id,
      songId,
      storage_path: rec.storage_path,
    });
    if (res.ok) router.refresh();
    else {
      alert(`No se pudo borrar: ${res.error}`);
      setDeletingId(null);
    }
  }

  if (recordings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Aún no hay grabaciones. Cuando guardes una, aparecerá aquí tu histórico
        cronológico para ver tu evolución.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {recordings.map((rec) => (
        <li
          key={rec.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{fmtDate(rec.created_at)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-mono tabular-nums">
                  {fmtDur(rec.duration_seconds)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5">
                  {rec.has_backing_mix ? (
                    <>
                      <Layers size={12} /> Mezcla
                    </>
                  ) : (
                    <>
                      <Mic size={12} /> Solo micro
                    </>
                  )}
                </span>
              </div>
              {rec.note && (
                <p className="mt-1.5 text-sm text-muted">{rec.note}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(rec)}
              disabled={deletingId === rec.id}
              aria-label="Borrar grabación"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-background hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
          {rec.url && <audio src={rec.url} controls className="w-full" />}
        </li>
      ))}
    </ul>
  );
}
