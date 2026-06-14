"use client";

import { useState } from "react";
import { Sparkles, Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { segmentsToLrc } from "@/lib/lrc";
import { Button } from "@/components/ui/button";

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Genera letra sincronizada (LRC) a partir de un archivo de audio usando Groq
 * Whisper (vía /api/transcribe). El audio se sube a Storage y la transcripción
 * la hace el servidor, por lo que funciona bien también en móvil.
 */
export function LrcGenerator({
  backingFile,
  onResult,
}: {
  backingFile: File | null;
  onResult: (lrc: string) => void;
}) {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "transcribing"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const file = localFile ?? backingFile;
  const busy = status !== "idle";

  async function generate() {
    if (!file) {
      setError("Elige un archivo de audio primero.");
      return;
    }
    setError(null);
    setStatus("uploading");

    let tempPath: string | null = null;
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no válida.");

      const ext = sanitize(file.name.split(".").pop() ?? "mp3");
      tempPath = `${user.id}/_transcribe/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("backing-tracks")
        .upload(tempPath, file, { upsert: true });
      if (upErr) throw new Error(`Subida fallida: ${upErr.message}`);

      const { data: signed } = await supabase.storage
        .from("backing-tracks")
        .createSignedUrl(tempPath, 600);
      if (!signed?.signedUrl) throw new Error("No se pudo firmar el audio.");

      setStatus("transcribing");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: signed.signedUrl, filename: file.name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al transcribir.");

      const lrc = segmentsToLrc(json.segments ?? []);
      if (!lrc.trim())
        throw new Error("No se detectó voz en el audio.");
      onResult(lrc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      // Limpia el audio temporal (best-effort).
      if (tempPath) {
        supabase.storage.from("backing-tracks").remove([tempPath]).catch(() => {});
      }
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles size={16} className="text-accent" />
        Generar letra sincronizada (LRC)
      </div>
      <p className="text-xs text-muted">
        Transcribe automáticamente un archivo de audio y rellena la letra con
        marcas de tiempo. Revísala después: en canto puede tener fallos.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-surface">
          <Upload size={16} />
          {localFile ? "Cambiar audio" : "Elegir audio"}
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              setLocalFile(e.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </label>

        <Button
          type="button"
          variant="outline"
          onClick={generate}
          disabled={busy || !file}
        >
          {status === "uploading" ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Subiendo…
            </>
          ) : status === "transcribing" ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Transcribiendo…
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generar
            </>
          )}
        </Button>
      </div>

      {file && (
        <p className="truncate text-xs text-muted">
          Audio: {file.name}
          {!localFile && backingFile ? " (del backing track)" : ""}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
