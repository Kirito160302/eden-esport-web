-- ============================================================
--  TOURNOIS — format Battle Royale / points par manche
--  À lancer dans Supabase → SQL Editor (après les SQL tournois précédents).
-- ============================================================
alter table public.tournaments drop constraint if exists tournaments_format_check;
alter table public.tournaments add constraint tournaments_format_check
  check (format in ('single_elim','double_elim','round_robin','groups_knockout','freeplay','battle_royale'));
alter table public.tournaments add column if not exists config jsonb;
alter table public.tournament_participants add column if not exists br_phase text default 'qualif';

create table if not exists public.br_results (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  phase          text not null default 'qualif',
  round_no       int not null,
  lobby_no       int not null,
  participant_id uuid not null references public.tournament_participants(id) on delete cascade,
  placement      int,
  points         int,
  created_at     timestamptz default now()
);
alter table public.br_results enable row level security;

drop policy if exists br_public_read on public.br_results;
create policy br_public_read on public.br_results for select to anon, authenticated
  using (exists (select 1 from public.tournaments t where t.id = tournament_id and t.is_public and t.status <> 'draft'));

drop policy if exists br_bureau_all on public.br_results;
create policy br_bureau_all on public.br_results for all to authenticated
  using (public.is_bureau()) with check (public.is_bureau());
