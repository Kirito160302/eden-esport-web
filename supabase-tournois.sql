-- ============================================================
--  TOURNOIS & ÉVÉNEMENTS — à lancer une fois dans Supabase → SQL Editor.
--  Gestion dans l'espace bureau ; vue publique en direct sur /tournoi/<id>.
--  Lecture publique (même sans compte) des tournois publics ; écriture
--  réservée aux membres du bureau (fonction is_bureau() déjà en place).
-- ============================================================

create table if not exists public.tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  game        text,
  format      text not null default 'single_elim' check (format in ('single_elim','freeplay')),
  team_mode   boolean not null default false,
  status      text not null default 'open' check (status in ('draft','open','running','done')),
  is_public   boolean not null default true,
  event_label text,
  created_at  timestamptz default now()
);

create table if not exists public.tournament_participants (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name          text not null,
  seed          int not null default 0,
  created_at    timestamptz default now()
);

create table if not exists public.tournament_matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round         int not null,
  slot          int not null,
  p1_id         uuid references public.tournament_participants(id) on delete set null,
  p2_id         uuid references public.tournament_participants(id) on delete set null,
  winner_id     uuid references public.tournament_participants(id) on delete set null,
  score         text,
  status        text not null default 'pending' check (status in ('pending','live','done')),
  created_at    timestamptz default now()
);

alter table public.tournaments            enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.tournament_matches      enable row level security;

-- Lecture publique (anon + connecté) des tournois publics non-brouillon
drop policy if exists tournaments_public_read on public.tournaments;
create policy tournaments_public_read on public.tournaments
  for select to anon, authenticated using (is_public and status <> 'draft');

drop policy if exists tparts_public_read on public.tournament_participants;
create policy tparts_public_read on public.tournament_participants
  for select to anon, authenticated using (
    exists (select 1 from public.tournaments t where t.id = tournament_id and t.is_public and t.status <> 'draft'));

drop policy if exists tmatches_public_read on public.tournament_matches;
create policy tmatches_public_read on public.tournament_matches
  for select to anon, authenticated using (
    exists (select 1 from public.tournaments t where t.id = tournament_id and t.is_public and t.status <> 'draft'));

-- Écriture (et lecture des brouillons) réservée au bureau
drop policy if exists tournaments_bureau_all on public.tournaments;
create policy tournaments_bureau_all on public.tournaments
  for all to authenticated using (public.is_bureau()) with check (public.is_bureau());

drop policy if exists tparts_bureau_all on public.tournament_participants;
create policy tparts_bureau_all on public.tournament_participants
  for all to authenticated using (public.is_bureau()) with check (public.is_bureau());

drop policy if exists tmatches_bureau_all on public.tournament_matches;
create policy tmatches_bureau_all on public.tournament_matches
  for all to authenticated using (public.is_bureau()) with check (public.is_bureau());
