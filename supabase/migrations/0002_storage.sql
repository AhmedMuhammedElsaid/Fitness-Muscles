-- Storage buckets. Only `avatars` — exercise clips live on YouTube (unlisted),
-- keeping us under the Supabase Storage free-tier ceiling indefinitely.
-- Path convention: {user_id}/avatar.{ext}. Max 2 MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Public read; owner-only write. Ownership = first path segment is the uid.
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );
