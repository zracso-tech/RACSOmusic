import { parseChordPro } from "@/lib/chordpro";
import { cn } from "@/lib/utils/cn";

/** Renderiza ChordPro: acordes (en color de acento) encima de cada sílaba. */
export function ChordSheet({
  content,
  fontScale = 1,
}: {
  content: string;
  fontScale?: number;
}) {
  const lines = parseChordPro(content);

  return (
    <div
      className="font-mono leading-relaxed"
      style={{ fontSize: `${fontScale}rem` }}
    >
      {lines.map((line, i) => {
        if (line.type === "empty") return <div key={i} className="h-4" />;

        if (line.type === "directive") {
          const d = line.directive ?? "";
          const m = d.match(/^(title|t|subtitle|st|comment|c)\s*:\s*(.*)$/i);
          const text = m ? m[2] : null;
          if (!text) return <div key={i} className="h-2" />;
          const isTitle = /^(title|t)$/i.test(m![1]);
          return (
            <p
              key={i}
              className={cn(
                "py-1",
                isTitle
                  ? "text-lg font-semibold"
                  : "text-sm italic text-muted",
              )}
            >
              {text}
            </p>
          );
        }

        return (
          <div key={i} className="flex flex-wrap py-1">
            {line.segments.map((seg, j) => (
              <span key={j} className="flex flex-col">
                <span className="h-5 font-semibold text-accent">
                  {seg.chord ?? " "}
                </span>
                <span className="whitespace-pre">{seg.text || " "}</span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
