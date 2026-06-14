"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Guitar, Upload, Youtube, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSong, updateSong, type SongInput } from "@/app/(app)/song/actions";
import { getYouTubeId } from "@/lib/youtube";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { LrcGenerator } from "./lrc-generator";
import type { Module, Song } from "@/types/database";

type BackingChoice = "none" | "file" | "youtube";

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export function SongForm({
  mode,
  initialModule = "voice",
  song,
}: {
  mode: "create" | "edit";
  initialModule?: Module;
  song?: Song;
}) {
  const router = useRouter();

  const [module, setModule] = useState<Module>(song?.module ?? initialModule);
  const [title, setTitle] = useState(song?.title ?? "");
  const [artist, setArtist] = useState(song?.artist ?? "");
  const [style, setStyle] = useState(song?.style ?? "");
  const [tags, setTags] = useState((song?.tags ?? []).join(", "));
  const [lyricsContent, setLyricsContent] = useState(song?.lyrics_content ?? "");
  const [lyricsFormat, setLyricsFormat] = useState(song?.lyrics_format ?? "plain");
  const [chordsContent, setChordsContent] = useState(song?.chords_content ?? "");

  const [backing, setBacking] = useState<BackingChoice>(
    song?.backing_source ?? "none",
  );
  const [youtubeUrl, setYoutubeUrl] = useState(song?.backing_youtube ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [existingFileName] = useState(
    song?.backing_path?.split("/").pop() ?? null,
  );

  // Información adicional
  const [notes, setNotes] = useState(song?.notes ?? "");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [existingDocName] = useState(
    song?.document_path?.split("/").pop()?.replace(/^doc_/, "") ?? null,
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("El título es obligatorio.");

    setSaving(true);
    try {
      const id = song?.id ?? crypto.randomUUID();
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaving(false);
        return setError("Sesión no válida. Vuelve a entrar.");
      }

      // Resolver el backing track según la elección.
      let backing_source: SongInput["backing_source"] = null;
      let backing_path = song?.backing_path ?? null;
      let backing_youtube: string | null = null;

      if (backing === "youtube") {
        if (!getYouTubeId(youtubeUrl)) {
          setSaving(false);
          return setError("La URL de YouTube no es válida.");
        }
        backing_source = "youtube";
        backing_youtube = youtubeUrl.trim();
        backing_path = null;
      } else if (backing === "file") {
        if (file) {
          const path = `${user.id}/${id}/${sanitize(file.name)}`;
          const { error: upErr } = await supabase.storage
            .from("backing-tracks")
            .upload(path, file, { upsert: true });
          if (upErr) {
            setSaving(false);
            return setError(`Error al subir el audio: ${upErr.message}`);
          }
          backing_path = path;
        }
        if (!backing_path) {
          setSaving(false);
          return setError("Selecciona un archivo de audio.");
        }
        backing_source = "file";
        backing_youtube = null;
      } else {
        backing_source = null;
        backing_path = null;
        backing_youtube = null;
      }

      // Documento adjunto (opcional): doc/pdf al bucket privado 'documents'.
      let document_path = song?.document_path ?? null;
      if (docFile) {
        const dpath = `${user.id}/${id}/doc_${sanitize(docFile.name)}`;
        const { error: dErr } = await supabase.storage
          .from("documents")
          .upload(dpath, docFile, { upsert: true });
        if (dErr) {
          setSaving(false);
          return setError(`Error al subir el documento: ${dErr.message}`);
        }
        document_path = dpath;
      }

      const input: SongInput = {
        id,
        module,
        title,
        artist: artist.trim() || null,
        style: style.trim() || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        backing_source,
        backing_path,
        backing_youtube,
        lyrics_format: lyricsFormat,
        lyrics_content: lyricsContent.trim() || null,
        chords_content:
          module === "guitar" ? chordsContent.trim() || null : null,
        notes: notes.trim() || null,
        document_path,
      };

      const result =
        mode === "create" ? await createSong(input) : await updateSong(input);

      if (!result.ok) {
        setSaving(false);
        return setError(result.error);
      }

      router.push(`/song/${id}`);
      router.refresh();
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Error inesperado.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Módulo */}
      <div className="flex gap-2">
        {(
          [
            { key: "voice", label: "Voz", icon: Mic },
            { key: "guitar", label: "Guitarra", icon: Guitar },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setModule(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              module === key
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-surface",
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      <Field label="Título">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Artista">
          <Input value={artist} onChange={(e) => setArtist(e.target.value)} />
        </Field>
        <Field label="Estilo">
          <Input value={style} onChange={(e) => setStyle(e.target.value)} />
        </Field>
      </div>

      <Field label="Etiquetas" hint="Separadas por comas (ej: balada, inglés, fácil)">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>

      {/* Backing track */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">Backing track</span>
        <div className="flex gap-2">
          {(
            [
              { key: "none", label: "Ninguno", icon: X },
              { key: "file", label: "Archivo", icon: Upload },
              { key: "youtube", label: "YouTube", icon: Youtube },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setBacking(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                backing === key
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:bg-surface",
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {backing === "file" && (
          <div className="flex flex-col gap-1.5">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:opacity-90"
            />
            {existingFileName && !file && (
              <span className="text-xs text-muted">
                Actual: {existingFileName} (sube otro para reemplazar)
              </span>
            )}
            <span className="text-xs text-muted">
              mp3/wav. Necesario para grabación mezclada (voz/guitarra + backing).
            </span>
          </div>
        )}

        {backing === "youtube" && (
          <div className="flex flex-col gap-1.5">
            <Input
              placeholder="https://youtube.com/watch?v=…"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <span className="text-xs text-muted">
              Sirve para reproducir y tocar/cantar encima. No se puede grabar el
              audio de YouTube (solo el micrófono).
            </span>
          </div>
        )}
      </div>

      {/* Letra */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Letra</span>
          <select
            value={lyricsFormat}
            onChange={(e) =>
              setLyricsFormat(e.target.value as "plain" | "lrc")
            }
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="plain">Texto plano</option>
            <option value="lrc">LRC (con marcas de tiempo)</option>
          </select>
        </div>
        <Textarea
          rows={8}
          value={lyricsContent}
          onChange={(e) => setLyricsContent(e.target.value)}
          placeholder={
            lyricsFormat === "lrc"
              ? "[00:12.50] Primera línea\n[00:18.20] Segunda línea"
              : "Escribe aquí la letra…"
          }
        />
        <LrcGenerator
          backingFile={backing === "file" ? file : null}
          onResult={(lrc) => {
            setLyricsContent(lrc);
            setLyricsFormat("lrc");
          }}
        />
      </div>

      {/* Acordes (solo guitarra) */}
      {module === "guitar" && (
        <Field label="Acordes (ChordPro)" hint="Acordes entre corchetes: Hoy [C]canto una [G]canción">
          <Textarea
            rows={8}
            value={chordsContent}
            onChange={(e) => setChordsContent(e.target.value)}
            placeholder={"[C]Hoy es un [G]día de [Am]sol\n[F]Sale el [C]mar"}
          />
        </Field>
      )}

      {/* Información adicional: notas + documento (doc/pdf) */}
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <span className="text-sm font-medium">Información adicional</span>
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas: tono, capo, cosas a mejorar, recordatorios…"
          className="font-sans"
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Documento (PDF o Word)</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:opacity-90"
          />
          {existingDocName && !docFile && (
            <span className="text-xs text-muted">
              Actual: {existingDocName} (sube otro para reemplazar)
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving
            ? "Guardando…"
            : mode === "create"
              ? "Crear canción"
              : "Guardar cambios"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
