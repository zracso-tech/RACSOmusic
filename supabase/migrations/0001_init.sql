-- ============================================================================
--  MusicApp — Esquema inicial
--  Módulos voz/guitarra unificados en una sola tabla `songs` discriminada por
--  `module`. Aislamiento total por usuario vía Row Level Security (RLS).
-- ============================================================================

-- ─── ENUMS ──────────────────────────────────────────────────────────────────
create type module_type    as enum ('voice', 'guitar');
create type backing_source as enum ('file', 'youtube');
create type lyrics_format  as enum ('plain', 'lrc');   -- lrc = con marcas de tiempo
create type chords_format  as enum ('chordpro');

-- ─── PROFILES (extiende auth.users) ─────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url   text,
  theme        text default 'system',          -- 'light' | 'dark' | 'system'
  created_at   timestamptz default now()
);

-- Crea automáticamente un perfil al registrarse un usuario nuevo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── SONGS ──────────────────────────────────────────────────────────────────
create table songs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  module            module_type not null,

  -- metadatos base (comunes a ambos módulos)
  title             text not null,
  artist            text,
  style             text,
  tags              text[] default '{}',

  -- backing track: archivo subido O YouTube (excluyentes)
  backing_source    backing_source,
  backing_path      text,                       -- ruta en Storage si source='file'
  backing_youtube   text,                       -- URL/ID si source='youtube'

  -- letra (ambos módulos)
  lyrics_format     lyrics_format default 'plain',
  lyrics_content    text,

  -- acordes (solo guitarra; null en voz)
  chords_format     chords_format,
  chords_content    text,                       -- ChordPro

  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  last_practiced_at timestamptz,

  constraint backing_coherent check (
    backing_source is null
    or (backing_source = 'file'    and backing_path    is not null)
    or (backing_source = 'youtube' and backing_youtube is not null)
  )
);

create index songs_user_idx      on songs (user_id);
create index songs_module_idx    on songs (user_id, module);
create index songs_created_idx   on songs (user_id, created_at desc);
create index songs_practiced_idx on songs (user_id, last_practiced_at desc nulls last);
create index songs_tags_idx      on songs using gin (tags);
create index songs_search_idx    on songs using gin (
  to_tsvector('simple',
    coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(style, ''))
);

-- mantiene updated_at al día
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger songs_touch_updated_at
  before update on songs
  for each row execute function public.touch_updated_at();

-- ─── CHORD DIAGRAMS (opcional, guitarra) ────────────────────────────────────
create table chord_diagrams (
  id         uuid primary key default gen_random_uuid(),
  song_id    uuid not null references songs on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  chord_name text not null,
  image_path text,                              -- Storage; null si se genera por SVG
  position   int default 0,
  created_at timestamptz default now()
);
create index chord_diagrams_song_idx on chord_diagrams (song_id);

-- ─── RECORDINGS (histórico; sin expiración automática) ──────────────────────
create table recordings (
  id               uuid primary key default gen_random_uuid(),
  song_id          uuid not null references songs on delete cascade,
  user_id          uuid not null references auth.users on delete cascade,
  storage_path     text not null,
  duration_seconds int,
  note             text,
  has_backing_mix  boolean default false,       -- true = backing+micro; false = solo micro
  created_at       timestamptz default now()
);
create index recordings_song_idx on recordings (song_id, created_at desc);
create index recordings_user_idx on recordings (user_id);

-- ============================================================================
--  ROW LEVEL SECURITY — cada usuario solo ve y toca lo suyo
-- ============================================================================
alter table profiles       enable row level security;
alter table songs          enable row level security;
alter table chord_diagrams enable row level security;
alter table recordings     enable row level security;

create policy "own_profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own_songs" on songs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_chord_diagrams" on chord_diagrams
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_recordings" on recordings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
--  STORAGE — buckets privados; acceso vía URLs firmadas
--  El path siempre empieza por el id del usuario: {user_id}/...
-- ============================================================================
insert into storage.buckets (id, name, public) values
  ('backing-tracks', 'backing-tracks', false),
  ('recordings',     'recordings',     false)
on conflict (id) do nothing;

-- Política reutilizable: el primer segmento del path debe ser el uid del usuario.
create policy "own_backing_files" on storage.objects
  for all to authenticated
  using (bucket_id = 'backing-tracks' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'backing-tracks' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own_recording_files" on storage.objects
  for all to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
