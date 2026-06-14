"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
} from "lucide-react";
import { getYouTubeId } from "@/lib/youtube";
import { hasLrcTimestamps } from "@/lib/lrc";
import { useYouTube } from "./use-youtube";
import { PracticeStage, songHasStage, type Clock } from "./practice-stage";
import { SpeedControl } from "./speed-control";
import type { Song } from "@/types/database";

type Source = "audio" | "youtube" | "none";

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Player({
  song,
  audioUrl,
}: {
  song: Song;
  audioUrl: string | null;
}) {
  const ytId = song.backing_youtube ? getYouTubeId(song.backing_youtube) : null;
  const source: Source =
    song.backing_source === "file" && audioUrl
      ? "audio"
      : song.backing_source === "youtube" && ytId
        ? "youtube"
        : "none";

  // El velocímetro se muestra en todo scroll que no sea LRC (en LRC el scroll
  // va sincronizado por las marcas de tiempo).
  const lrcMode = !!song.lyrics_content && hasLrcTimestamps(song.lyrics_content);
  const chordMode =
    song.module === "guitar" && !!song.chords_content?.trim();
  const speedScroll = !lrcMode && (chordMode || !!song.lyrics_content);

  const audioRef = useRef<HTMLAudioElement>(null);
  const yt = useYouTube("yt-player", source === "youtube" ? ytId : null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(40);
  const [perf, setPerf] = useState(false);
  // En guitarra (acordes) usamos el mismo tamaño que la ficha; en voz, grande.
  const [fontScale, setFontScale] = useState(chordMode ? 0.875 : 1.4);

  const virtual = useRef({ t: 0, playing: false, lastTs: 0 });

  // Reloj unificado leído por el PracticeStage (y por el readout de abajo).
  function getClock(): Clock {
    if (source === "audio") {
      const a = audioRef.current;
      return {
        time: a?.currentTime ?? 0,
        duration: a?.duration || 0,
        playing: a ? !a.paused : false,
      };
    }
    if (source === "youtube") {
      return { time: yt.getTime(), duration: yt.getDuration(), playing: yt.isPlaying };
    }
    const now = performance.now();
    if (virtual.current.lastTs === 0) virtual.current.lastTs = now;
    if (virtual.current.playing) {
      virtual.current.t += (now - virtual.current.lastTs) / 1000;
    }
    virtual.current.lastTs = now;
    return { time: virtual.current.t, duration: 0, playing: virtual.current.playing };
  }

  // Refresca el readout de tiempo + estado de YouTube.
  useEffect(() => {
    const id = setInterval(() => {
      const c = getClock();
      setCurrentTime(c.time);
      if (c.duration) setDuration(c.duration);
      if (source === "youtube") setIsPlaying(yt.isPlaying);
    }, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, yt.isPlaying]);

  function toggle() {
    if (source === "audio") {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) a.play();
      else a.pause();
    } else if (source === "youtube") {
      yt.toggle();
    } else {
      virtual.current.lastTs = performance.now();
      virtual.current.playing = !virtual.current.playing;
      setIsPlaying(virtual.current.playing);
    }
  }

  const hasStage = songHasStage(song);

  const stage = (
    <PracticeStage
      song={song}
      getClock={getClock}
      fontScale={fontScale}
      speed={speed}
      heightClass={perf ? "h-[calc(100dvh-9rem)]" : "h-[55vh]"}
    />
  );

  const transport = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground transition-opacity hover:opacity-90"
          aria-label={isPlaying ? "Pausa" : "Reproducir"}
        >
          {isPlaying ? (
            <Pause size={22} />
          ) : (
            <Play size={22} className="ml-0.5" />
          )}
        </button>

        {duration > 0 && (
          <span className="font-mono text-xs text-muted tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {perf && (
            <>
              <button
                onClick={() => setFontScale((s) => Math.max(0.8, s - 0.2))}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                aria-label="Reducir letra"
              >
                <Minus size={18} />
              </button>
              <button
                onClick={() => setFontScale((s) => Math.min(3, s + 0.2))}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                aria-label="Aumentar letra"
              >
                <Plus size={18} />
              </button>
            </>
          )}
          {hasStage && (
            <button
              onClick={() => setPerf((p) => !p)}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
              aria-label={
                perf ? "Salir de pantalla completa" : "Pantalla completa"
              }
            >
              {perf ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Velocímetro de scroll en su propia fila */}
      {speedScroll && <SpeedControl value={speed} onChange={setSpeed} />}
    </div>
  );

  const audioEl =
    source === "audio" && audioUrl ? (
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        hidden
      />
    ) : null;

  if (perf) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {audioEl}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="truncate font-medium">{song.title}</span>
        </div>
        {source === "youtube" && (
          <div className="aspect-video max-h-[28vh] w-full bg-black">
            <div id="yt-player" className="h-full w-full" />
          </div>
        )}
        <div className="min-h-0 flex-1 px-4">{stage}</div>
        <div className="border-t border-border px-4 py-3">{transport}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      {audioEl}
      <Link
        href={`/song/${song.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{song.title}</h1>
        <p className="text-muted">{song.artist ?? "Sin artista"}</p>
      </div>

      {source === "youtube" && (
        <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl bg-black">
          <div id="yt-player" className="h-full w-full" />
        </div>
      )}

      <div className="mb-4 rounded-xl border border-border bg-surface p-3">
        {transport}
      </div>

      {stage}
    </div>
  );
}
