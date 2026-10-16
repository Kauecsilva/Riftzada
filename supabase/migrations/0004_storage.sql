-- Riftzada — fotos (Supabase Storage)
-- Bucket público para leitura (as URLs são longas e aleatórias), até 5 MB, só imagens.
-- Cada usuário grava apenas na própria pasta: media/{user_id}/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "media: logado lê" on storage.objects for select to authenticated
  using (bucket_id = 'media');

create policy "media: envia na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media: apaga da própria pasta" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
