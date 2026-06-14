export interface LrcLine {
  time: number; // segundos
  text: string;
}

const TS = /\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g;

/** ¿El texto contiene marcas de tiempo LRC ([mm:ss.xx])? */
export function hasLrcTimestamps(content: string): boolean {
  TS.lastIndex = 0;
  return TS.test(content);
}

/**
 * Convierte texto LRC en líneas ordenadas por tiempo. Una línea puede tener
 * varias marcas; se genera una entrada por cada marca.
 */
export function parseLrc(content: string): LrcLine[] {
  const out: LrcLine[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const times: number[] = [];
    let m: RegExpExecArray | null;
    TS.lastIndex = 0;
    while ((m = TS.exec(raw)) !== null) {
      const min = parseInt(m[1], 10);
      const sec = parseFloat(m[2].replace(":", "."));
      times.push(min * 60 + sec);
    }
    const text = raw.replace(TS, "").trim();
    for (const t of times) out.push({ time: t, text });
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}

/** Construye texto LRC a partir de segmentos {start, text} de transcripción. */
export function segmentsToLrc(
  segments: { start: number; text: string }[],
): string {
  return segments
    .filter((s) => s.text.trim())
    .map((s) => {
      const t = Math.max(0, s.start);
      const m = Math.floor(t / 60);
      const sec = (t % 60).toFixed(2).padStart(5, "0"); // ss.xx
      return `[${String(m).padStart(2, "0")}:${sec}] ${s.text.trim()}`;
    })
    .join("\n");
}

/** Quita las marcas de tiempo LRC, dejando solo el texto. */
export function stripLrc(content: string): string {
  return content.replace(TS, "");
}

/** Índice de la línea activa para un tiempo dado (la última cuyo time <= t). */
export function activeLineIndex(lines: LrcLine[], t: number): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= t) idx = i;
    else break;
  }
  return idx;
}
