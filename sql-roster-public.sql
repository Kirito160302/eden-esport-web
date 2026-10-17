-- ============================================================
--  ROSTERS PUBLICS — joueurs/équipes gérés depuis le bureau,
--  affichés sur le site public (avec photos).
--  À lancer dans Supabase → SQL Editor.
--  Réutilise bu_players (ajout de colonnes) + nouvelle table bu_teams
--  (bannière/slogan d'équipe) + bucket de stockage public « roster ».
-- ============================================================

-- 1) Colonnes supplémentaires sur bu_players
alter table public.bu_players add column if not exists photo_url text;
alter table public.bu_players add column if not exists social    text;
alter table public.bu_players add column if not exists is_public boolean not null default true;
alter table public.bu_players add column if not exists sort      int not null default 0;

-- 2) Lecture publique des joueurs marqués « visibles » (le bureau garde l'écriture)
drop policy if exists bu_players_public_read on public.bu_players;
create policy bu_players_public_read on public.bu_players
  for select to anon, authenticated using (is_public = true);

-- 3) Vitrine d'équipe (slogan + bannière) — une ligne par équipe publique
create table if not exists public.bu_teams (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  tagline    text,
  banner_url text,
  sort       int not null default 0,
  updated_at timestamptz default now()
);
alter table public.bu_teams enable row level security;
drop policy if exists bu_teams_public_read on public.bu_teams;
create policy bu_teams_public_read on public.bu_teams for select to anon, authenticated using (true);
drop policy if exists bu_teams_bureau_all on public.bu_teams;
create policy bu_teams_bureau_all on public.bu_teams for all to authenticated
  using (public.is_bureau()) with check (public.is_bureau());

insert into public.bu_teams (slug, sort) values
  ('Valorant Pro', 1), ('Valorant Rising', 2),
  ('League of Legends Pro', 3), ('League of Legends Two', 4), ('TFT', 5)
on conflict (slug) do nothing;

-- 4) Bucket de stockage PUBLIC pour les photos de joueurs / bannières
insert into storage.buckets (id, name, public) values ('roster', 'roster', true)
on conflict (id) do nothing;

-- Lecture publique du bucket ; écriture réservée au bureau
drop policy if exists roster_public_read on storage.objects;
create policy roster_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'roster');
drop policy if exists roster_bureau_write on storage.objects;
create policy roster_bureau_write on storage.objects
  for insert to authenticated with check (bucket_id = 'roster' and public.is_bureau());
drop policy if exists roster_bureau_update on storage.objects;
create policy roster_bureau_update on storage.objects
  for update to authenticated using (bucket_id = 'roster' and public.is_bureau());
drop policy if exists roster_bureau_delete on storage.objects;
create policy roster_bureau_delete on storage.objects
  for delete to authenticated using (bucket_id = 'roster' and public.is_bureau());
