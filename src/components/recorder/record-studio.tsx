"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Save, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveRecording } from "@/app/(app)/song/[songId]/record/actions";
import { getYouTubeId } from "@/lib/youtube";
import { hasLrcTimestamps } from "@/lib/lrc";
import { hasChords } from "@/lib/chordpro";
import { useYouTube } from "@/components/player/use-youtube";
import { PracticeStage, type Clock } from "@/components/player/practice-stage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Song } from "@/types/database";

type State = "idle" | "recording" | "recorded" | "saving";
type Source = "mix" | "youtube" | "none";

function pickMime(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c))
      return c;
  }
  return undefined;
}

function extFor(mime: string) {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function RecordStudio({
  song,
  audioUrl,
}: {
  song: Song;
  audioUrl: string | null;
}) {
  const router = useRouter();
  const ytId = song.backing_youtube ? getYouTubeId(song.backing_youtube) : null;
  const source: Source =
    song.backing_source === "file" && audioUrl
      ? "mix"
      : song.backing_source === "youtube" && ytId
        ? "youtube"
        : "none";

  const lrcMode = !!song.lyrics_content && hasLrcTimestamps(song.lyrics_content);
  const chordMode =
    song.module === "guitar" &&
    !!song.chords_content &&
    hasChords(song.chords_content);
  const speedScroll = source === "none" && !lrcMode && (chordMode || !!song.lyrics_content);

  const yt = useYouTube("yt-rec-player", source === "youtube" ? ytId : null);

  const [state, setState] = useState<State>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [speed, setSpeed] = useState(40);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const recAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const objUrlRef = useRef<string | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef("audio/webm");
  const virtual = useRef({ t: 0, playing: false, lastTs: 0 });
  const stateRef = useRef<State>("idle");
  stateRef.current = state;

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      cleanupAudio();
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanupAudio() {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    recAudioRef.current?.pause();
    recAudioRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close().catch(() => {});
    }
    ctxRef.current = null;
  }

  // Reloj para el escenario: durante la grabación sigue la fuente activa;
  // durante la revisión sigue el reproductor del preview.
  function getClock(): Clock {
    if (stateRef.current === "recording") {
      if (source === "mix") {
        const a = recAudioRef.current;
        return { time: a?.currentTime ?? 0, duration: a?.duration || 0, playing: true };
      }
      if (source === "youtube") {
        return { time: yt.getTime(), duration: yt.getDuration(), playing: true };
      }
      const now = performance.now();
      if (virtual.current.lastTs === 0) virtual.current.lastTs = now;
      if (virtual.current.playing) {
        virtual.current.t += (now - virtual.current.lastTs) / 1000;
      }
      virtual.current.lastTs = now;
      return { time: virtual.current.t, duration: 0, playing: true };
    }
    if (stateRef.current === "recorded") {
      const p = previewRef.current;
      return {
        time: p?.currentTime ?? 0,
        duration: p?.duration || 0,
        playing: p ? !p.paused : false,
      };
    }
    return { time: 0, duration: 0, playing: false };
  }

  async function startRecording() {
    setError(null);
    setBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = micStream;

      let recordStream: MediaStream;

      if (source === "mix") {
        const res = await fetch(audioUrl!);
        const backingBlob = await res.blob();
        const objUrl = URL.createObjectURL(backingBlob);
        objUrlRef.current = objUrl;

        const audioEl = new Audio(objUrl);
        recAudioRef.current = audioEl;

        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new Ctx();
        ctxRef.current = ctx;

        const dest = ctx.createMediaStreamDestination();
        ctx.createMediaStreamSource(micStream).connect(dest);
        const elSrc = ctx.createMediaElementSource(audioEl);
        elSrc.connect(dest);
        elSrc.connect(ctx.destination);

        await ctx.resume();
        audioEl.currentTime = 0;
        await audioEl.play();
        recordStream = dest.stream;
      } else {
        recordStream = micStream;
        if (source === "youtube") {
          yt.seekTo(0);
          yt.play();
        } else {
          virtual.current = { t: 0, playing: true, lastTs: performance.now() };
        }
      }

      const mime = pickMime();
      mimeRef.current = mime ?? "audio/webm";
      const rec = new MediaRecorder(
        recordStream,
        mime ? { mimeType: mime } : undefined,
      );
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mimeRef.current });
        setBlob(b);
        setPreviewUrl(URL.createObjectURL(b));
        setState("recorded");
        if (source === "youtube") yt.pause();
        virtual.current.playing = false;
        cleanupAudio();
      };

      rec.start();
      recRef.current = rec;
      startRef.current = Date.now();
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startRef.current) / 1000);
      }, 200);
    } catch (err) {
      cleanupAudio();
      setError(
        err instanceof Error
          ? err.name === "NotAllowedError"
            ? "Permiso de micrófono denegado."
            : err.message
          : "No se pudo iniciar la grabación.",
      );
      setState("idle");
    }
  }

  function stopRecording() {
    timerRef.current && clearInterval(timerRef.current);
    recRef.current?.stop();
  }

  function discard() {
    setBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setNote("");
    setElapsed(0);
    setState("idle");
  }

  async function save() {
    if (!blob) return;
    setState("saving");
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState("recorded");
        return setError("Sesión no válida.");
      }

      const recId = crypto.randomUUID();
      const ext = extFor(mimeRef.current);
      const path = `${user.id}/${song.id}/${recId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("recordings")
        .upload(path, blob, { contentType: blob.type });
      if (upErr) {
        setState("recorded");
        return setError(`Error al subir: ${upErr.message}`);
      }

      const res = await saveRecording({
        songId: song.id,
        storage_path: path,
        duration_seconds: Math.round(elapsed),
        note: note.trim() || null,
        has_backing_mix: source === "mix",
      });
      if (!res.ok) {
        setState("recorded");
        return setError(res.error);
      }

      discard();
      router.refresh();
    } catch (err) {
      setState("recorded");
      setError(err instanceof Error ? err.message : "Error al guardar.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Vídeo de YouTube (si aplica) */}
      {source === "youtube" && (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <div id="yt-rec-player" className="h-full w-full" />
        </div>
      )}

      {/* Escenario: misma letra/acordes con scroll que en Reproducir */}
      <div className="rounded-xl border border-border bg-surface">
        <PracticeStage
          song={song}
          getClock={getClock}
          fontScale={1.25}
          speed={speed}
          heightClass="h-[42vh]"
        />
      </div>

      {/* Aviso del modo de grabación */}
      <p className="text-sm text-muted">
        {source === "mix"
          ? "Se graba el backing + tu micrófono. Usa auriculares para que el backing no se cuele por el micro."
          : source === "youtube"
            ? "Se graba solo tu micrófono (el audio de YouTube no puede capturarse). El vídeo suena para que cantes/toques encima."
            : "Se graba solo tu micrófono."}
      </p>

      {/* Controles */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        {state === "idle" && (
          <div className="flex flex-col gap-3">
            {speedScroll && (
              <label className="flex items-center gap-2 text-xs text-muted">
                Velocidad de scroll
                <input
                  type="range"
                  min={10}
                  max={160}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent)]"
                />
              </label>
            )}
            <Button size="lg" onClick={startRecording} className="w-full">
              <Mic size={20} />
              Empezar a grabar
            </Button>
          </div>
        )}

        {state === "recording" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-red-500">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="font-mono text-lg tabular-nums">
                {fmt(elapsed)}
              </span>
            </div>
            <Button
              size="lg"
              onClick={stopRecording}
              className="w-full bg-red-500 text-white"
            >
              <Square size={18} />
              Detener
            </Button>
          </div>
        )}

        {(state === "recorded" || state === "saving") && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Duración</span>
              <span className="font-mono tabular-nums">{fmt(elapsed)}</span>
            </div>
            {previewUrl && (
              <audio ref={previewRef} src={previewUrl} controls className="w-full" />
            )}
            <Input
              placeholder="Nota (opcional): qué practicabas, cómo salió…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={save}
                disabled={state === "saving"}
                className="flex-1"
              >
                {state === "saving" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar grabación
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={discard}
                disabled={state === "saving"}
              >
                <Trash2 size={18} />
                Descartar
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
