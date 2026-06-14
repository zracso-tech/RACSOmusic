// Tipos del dominio. En cuanto conectes Supabase puedes regenerarlos con:
//   npm run types   (requiere supabase CLI y `supabase link`)
// De momento, escritos a mano para que el scaffold compile y tenga tipado.

export type Module = "voice" | "guitar";
export type BackingSource = "file" | "youtube";
export type LyricsFormat = "plain" | "lrc";
export type ChordsFormat = "chordpro";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme: "light" | "dark" | "system";
  created_at: string;
}

export interface Song {
  id: string;
  user_id: string;
  module: Module;
  title: string;
  artist: string | null;
  style: string | null;
  tags: string[];
  backing_source: BackingSource | null;
  backing_path: string | null;
  backing_youtube: string | null;
  lyrics_format: LyricsFormat;
  lyrics_content: string | null;
  chords_format: ChordsFormat | null;
  chords_content: string | null;
  notes: string | null;
  document_path: string | null;
  sent_by_name: string | null;
  created_at: string;
  updated_at: string;
  last_practiced_at: string | null;
}

export interface Recording {
  id: string;
  song_id: string;
  user_id: string;
  storage_path: string;
  duration_seconds: number | null;
  note: string | null;
  has_backing_mix: boolean;
  created_at: string;
}

export interface ChordDiagram {
  id: string;
  song_id: string;
  user_id: string;
  chord_name: string;
  image_path: string | null;
  position: number;
  created_at: string;
}
