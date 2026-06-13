"use client";

import { useEffect, useRef } from "react";
import { activeLineIndex, type LrcLine } from "@/lib/lrc";
import { cn } from "@/lib/utils/cn";

/** Letra con marcas LRC: resalta y centra la línea activa según el tiempo. */
export function LrcLyrics({
  lines,
  currentTime,
  fontScale = 1,
}: {
  lines: LrcLine[];
  currentTime: number;
  fontScale?: number;
}) {
  const active = activeLineIndex(lines, currentTime);
  const activeRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);

  return (
    <div
      className="flex flex-col gap-3 py-[40vh] text-center"
      style={{ fontSize: `${fontScale}rem` }}
    >
      {lines.map((line, i) => (
        <p
          key={i}
          ref={i === active ? activeRef : null}
          className={cn(
            "transition-all duration-300",
            i === active
              ? "font-semibold text-foreground"
              : "text-muted opacity-50",
          )}
        >
          {line.text || " "}
        </p>
      ))}
    </div>
  );
}
