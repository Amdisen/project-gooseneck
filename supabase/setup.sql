-- Gooseneck — Supabase setup
-- Run this in the Supabase SQL Editor AFTER the Drizzle tables exist
-- (i.e. after `npm run db:push`). It wires up two things Drizzle can't:
--   1) auto-creating a public.profiles row when a user signs up
--   2) Row Level Security policies (defense-in-depth authz)
--
-- NOTE ON AUTHZ MODEL:
-- Our server code talks to Postgres via DATABASE_URL as a trusted role and
-- enforces authorization in Server Actions. These RLS policies are the second
-- line of defense for any access made through supabase-js (anon/authenticated
-- keys), e.g. direct reads from the browser.

-- 0) Tie profiles to auth.users so deleting a user cascades to their profile
--    (and onward to their recipes/versions/logs via our own FKs). Important for
--    GDPR account deletion. Drizzle can't declare this because it can't see the
--    auth schema, so we add it here.
alter table public.profiles
  drop constraint if exists profiles_id_auth_users_fk;
alter table public.profiles
  add constraint profiles_id_auth_users_fk
  foreign key (id) references auth.users (id) on delete cascade;

-- 1) Auto-create a profile on signup ----------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Row Level Security ------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_versions enable row level security;
alter table public.brew_logs enable row level security;

-- profiles: readable by anyone (needed for attribution); editable only by self.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- recipes: public ones are world-readable; owners see their own (incl. private).
drop policy if exists "recipes_select_public_or_own" on public.recipes;
create policy "recipes_select_public_or_own" on public.recipes
  for select using (visibility = 'public' or owner_id = auth.uid());

drop policy if exists "recipes_write_own" on public.recipes;
create policy "recipes_write_own" on public.recipes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- recipe_versions: owners see all their versions (incl. drafts). Non-owners see
-- only published (non-draft) versions of public recipes.
drop policy if exists "recipe_versions_select" on public.recipe_versions;
create policy "recipe_versions_select" on public.recipe_versions
  for select using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_versions.recipe_id
        and (
          r.owner_id = auth.uid()
          or (r.visibility = 'public' and recipe_versions.is_draft = false)
        )
    )
  );

drop policy if exists "recipe_versions_write_own" on public.recipe_versions;
create policy "recipe_versions_write_own" on public.recipe_versions
  for all using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_versions.recipe_id and r.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_versions.recipe_id and r.owner_id = auth.uid()
    )
  );

-- brew_logs: private to their owner (revisit if we expose logs on public feed).
drop policy if exists "brew_logs_own" on public.brew_logs;
create policy "brew_logs_own" on public.brew_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3) Library tables (coffees / grinders / brewers) — owner-only --------------

alter table public.coffees enable row level security;
alter table public.grinders enable row level security;
alter table public.brewers enable row level security;

drop policy if exists "coffees_own" on public.coffees;
create policy "coffees_own" on public.coffees
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "grinders_own" on public.grinders;
create policy "grinders_own" on public.grinders
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "brewers_own" on public.brewers;
create policy "brewers_own" on public.brewers
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 4) Comments — readable on public recipes; author or recipe owner manage -----

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
