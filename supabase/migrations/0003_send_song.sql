-- ============================================================================
--  0003 — Enviar canciones entre usuarios (copia de la ficha, sin grabaciones)
-- ============================================================================

-- Marca de procedencia en la copia recibida.
alter table songs add column if not exists sent_by_name text;

-- Permitir a usuarios autenticados ver perfiles (para elegir destinatarios).
-- (Insertar/editar/borrar sigue restringido al dueño por la policy own_profile.)
create policy "profiles_read_all" on profiles
  for select to authenticated using (true);

-- Función segura: copia la ficha de una canción propia al perfil de otro usuario.
-- SECURITY DEFINER para poder insertar la fila con user_id = destinatario,
-- validando antes que quien llama es el dueño de la canción origen.
create or replace function public.send_song(p_song_id uuid, p_recipient uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_name   text;
  v_new_id uuid := gen_random_uuid();
  s        public.songs;
begin
  if v_caller is null then
    raise exception 'No autenticado';
  end if;
  if p_recipient = v_caller then
    raise exception 'No puedes enviártela a ti mismo';
  end if;

  select * into s from public.songs where id = p_song_id and user_id = v_caller;
  if not found then
    raise exception 'Canción no encontrada o no autorizada';
  end if;

  select coalesce(display_name, '') into v_name from public.profiles where id = v_caller;

  insert into public.songs (
    id, user_id, module, title, artist, style, tags,
    backing_source, backing_youtube,
    lyrics_format, lyrics_content, chords_format, chords_content,
    notes, sent_by_name
  ) values (
    v_new_id, p_recipient, s.module, s.title, s.artist, s.style, s.tags,
    -- Solo se copia el backing de YouTube; los archivos privados no se transfieren.
    case when s.backing_source = 'youtube' then 'youtube'::backing_source else null end,
    case when s.backing_source = 'youtube' then s.backing_youtube else null end,
    s.lyrics_format, s.lyrics_content, s.chords_format, s.chords_content,
    s.notes, nullif(v_name, '')
  );

  return v_new_id;
end;
$$;

grant execute on function public.send_song(uuid, uuid) to authenticated;
