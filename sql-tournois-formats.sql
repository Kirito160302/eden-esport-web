-- ============================================================
--  TOURNOIS — formats additionnels (double élim, championnat, poules)
--  À lancer dans Supabase → SQL Editor (après supabase-tournois.sql).
-- ============================================================
alter table public.tournaments drop constraint if exists tournaments_format_check;
alter table public.tournaments add constraint tournaments_format_check
  check (format in ('single_elim','double_elim','round_robin','groups_knockout','freeplay'));

alter table public.tournament_participants add column if not exists group_no int;

alter table public.tournament_matches add column if not exists bracket text;
alter table public.tournament_matches add column if not exists win_to  text;
alter table public.tournament_matches add column if not exists lose_to text;
