-- Gooseneck — Storage setup for recipe photos (bean + grind).
-- Run after setup.sql:  node scripts/apply-sql.mjs supabase/storage.sql
--
-- Public bucket (photos are shown on the public feed later), but writes are
-- restricted to authenticated users, and only within a folder named after their
-- own user id: e.g.  <user_id>/<uuid>.webp

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-photos',
  'recipe-photos',
  true,
  5242880, -- 5 MB (we compress client-side well below this)
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Anyone can read (bucket is public).
drop policy if exists "recipe_photos_read" on storage.objects;
create policy "recipe_photos_read" on storage.objects
  for select using (bucket_id = 'recipe-photos');

-- Authenticated users may write only inside their own <user_id>/ folder.
drop policy if exists "recipe_photos_insert" on storage.objects;
create policy "recipe_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recipe_photos_update" on storage.objects;
create policy "recipe_photos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recipe_photos_delete" on storage.objects;
create policy "recipe_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
