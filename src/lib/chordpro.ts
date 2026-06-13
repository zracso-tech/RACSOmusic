export interface ChordSegment {
  chord: string | null;
  text: string;
}

export interface ChordLine {
  type: "lyric" | "directive" | "empty";
  segments: ChordSegment[];
  directive?: string; // contenido de {…} si type==='directive'
}

/**
 * Parser ChordPro mínimo: acordes inline entre corchetes [C], directivas {…}.
 * Cada línea de letra se descompone en segmentos {acorde, texto} para poder
 * pintar el acorde encima del texto que le sigue.
 */
export function parseChordPro(content: string): ChordLine[] {
  const lines: ChordLine[] = [];

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");

    if (line.trim() === "") {
      lines.push({ type: "empty", segments: [] });
      continue;
    }

    // Directiva completa en la línea: {title: ...}, {soc}, etc.
    const dir = line.trim().match(/^\{(.+)\}$/);
    if (dir) {
      lines.push({ type: "directive", segments: [], directive: dir[1] });
      continue;
    }

    const segments: ChordSegment[] = [];
    const parts = line.split(/(\[[^\]]+\])/);
    let pending: string | null = null;

    for (const part of parts) {
      if (part === "") continue;
      const chord = part.match(/^\[([^\]]+)\]$/);
      if (chord) {
        // Si había un acorde sin texto, lo emitimos antes del siguiente.
        if (pending !== null) segments.push({ chord: pending, text: "" });
        pending = chord[1];
      } else {
        segments.push({ chord: pending, text: part });
        pending = null;
      }
    }
    if (pending !== null) segments.push({ chord: pending, text: "" });
    if (segments.length === 0) segments.push({ chord: null, text: line });

    lines.push({ type: "lyric", segments });
  }

  return lines;
}

/** ¿El contenido usa acordes ChordPro inline? */
export function hasChords(content: string): boolean {
  return /\[[^\]]+\]/.test(content);
}
