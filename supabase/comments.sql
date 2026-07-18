-- Gooseneck — Comments RLS (apply on its own to avoid re-running full setup.sql)
--   node scripts/apply-sql.mjs supabase/comments.sql

alter table public.comments enable row level security;

drop policy if exists "comments_read" on public.comments;
create policy "comments_read" on public.comments
  for select using (
    comments.user_id = auth.uid()
    or exists (
      select 1 from public.recipes r
      where r.id = comments.recipe_id
        and (r.visibility = 'public' or r.owner_id = auth.uid())
    )
  );

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "comments_update" on public.comments;
create policy "comments_update" on public.comments
  for update using (
    comments.user_id = auth.uid()
    or exists (
      select 1 from public.recipes r
      where r.id = comments.recipe_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments
  for delete using (
    comments.user_id = auth.uid()
    or exists (
      select 1 from public.recipes r
      where r.id = comments.recipe_id and r.owner_id = auth.uid()
    )
  );
