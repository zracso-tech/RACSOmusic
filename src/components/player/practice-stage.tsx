"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasLrcTimestamps, parseLrc, stripLrc } from "@/lib/lrc";
import { cn } from "@/lib/utils/cn";
import { LrcLyrics } from "./lrc-lyrics";
import { ChordSheet } from "./chord-sheet";
import type { Song } from "@/types/database";

export interface Clock {
  time: number;
  duration: number;
  playing: boolean;
}

/** ¿La canción tiene algo que mostrar/scrollear (letra o acordes)? */
export function songHasStage(song: Song): boolean {
  return !!(
    (song.module === "guitar" && song.chords_content?.trim()) ||
    song.lyrics_content
  );
}

/**
 * Escenario de práctica compartido por los modos Reproducir y Grabar.
 * Renderiza letra/acordes y hace autoscroll leyendo un "reloj" externo
 * (getClock), de modo que la fuente (audio/YouTube/mic) la controla el padre.
 */
export function PracticeStage({
  song,
  getClock,
  fontScale = 1.4,
  speed = 40,
  heightClass = "h-[55vh]",
}: {
  song: Song;
  getClock: () => Clock;
  fontScale?: number;
  speed?: number;
  heightClass?: string;
}) {
  // En guitarra, cualquier contenido en el campo de acordes manda (va arriba),
  // lleve o no corchetes ChordPro.
  const chordMode =
    song.module === "guitar" && !!song.chords_content?.trim();
  const lrcMode =
    !chordMode && !!song.lyrics_content && hasLrcTimestamps(song.lyrics_content);
  const plainMode = !chordMode && !lrcMode && !!song.lyrics_content;
  const lrcLines = useMemo(
    () => (lrcMode ? parseLrc(song.lyrics_content!) : []),
    [lrcMode, song.lyrics_content],
  );

  const [currentTime, setCurrentTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef(getClock);
  clockRef.current = getClock;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const { time, playing } = clockRef.current();
      setCurrentTime(time);
      // Autoscroll por velocímetro en todo lo que no sea LRC (LRC se centra solo).
      const el = scrollRef.current;
      if (el && !lrcMode && playing) {
        const max = el.scrollHeight - el.clientHeight;
        if (max > 0) {
          el.scrollTop = Math.min(max, el.scrollTop + speedRef.current * dt);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lrcMode]);

  return (
    <div
      ref={scrollRef}
      className={cn("overflow-y-auto", heightClass, !lrcMode && "px-1")}
    >
      {chordMode ? (
        <>
          {/* En guitarra, los acordes son lo principal: van arriba. */}
          <ChordSheet content={song.chords_content!} fontScale={fontScale} />
          {song.lyrics_content && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Voz
              </p>
              <pre
                className="whitespace-pre-wrap font-sans leading-relaxed"
                style={{ fontSize: `${fontScale}rem` }}
              >
                {stripLrc(song.lyrics_content)}
              </pre>
            </div>
          )}
        </>
      ) : lrcMode ? (
        <LrcLyrics
          lines={lrcLines}
          currentTime={currentTime}
          fontScale={fontScale}
        />
      ) : plainMode ? (
        <pre
          className="whitespace-pre-wrap font-sans leading-relaxed"
          style={{ fontSize: `${fontScale}rem` }}
        >
          {song.lyrics_content}
        </pre>
      ) : (
        <p className="py-16 text-center text-sm text-muted">
          Esta canción no tiene letra ni acordes. Añádelos desde Editar.
        </p>
      )}
    </div>
  );
}
