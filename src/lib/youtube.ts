/** Extrae el ID de vídeo de una URL de YouTube en sus formatos habituales. */
export function getYouTubeId(input: string): string | null {
  if (!input) return null;
  const url = input.trim();

  // Si ya es un ID (11 caracteres válidos), lo devolvemos tal cual.
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** URL de embed para el iframe del reproductor. */
export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}

/** Miniatura de un vídeo de YouTube. */
export function youTubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}
