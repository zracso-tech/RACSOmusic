-- ============================================================================
--  0002 — Notas + documento por canción · buckets de avatars y documentos
-- ============================================================================

-- ─── Canciones: bloque de información adicional ──────────────────────────────
alter table songs add column if not exists notes         text;
alter table songs add column if not exists document_path text;

-- ─── Bucket AVATARS (lectura pública; escritura solo del dueño) ──────────────
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Bucket DOCUMENTS (privado; acceso por URL firmada) ──────────────────────
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_own" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
