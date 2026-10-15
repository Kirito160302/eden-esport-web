-- ============================================================
--  TOURNOIS — format Clash Royale 1v1 (suisse + poules + arbre)
--  À lancer dans Supabase → SQL Editor (après les SQL tournois précédents).
--  Réutilise tournament_matches : bracket "S"=suisse · "P0..P3"=poules A..D
--  · "K"=arbre · "B"=petite finale. Aucune nouvelle table.
-- ============================================================
alter table public.tournaments drop constraint if exists tournaments_format_check;
alter table public.tournaments add constraint tournaments_format_check
  check (format in ('single_elim','double_elim','round_robin','groups_knockout','freeplay','battle_royale','clash_1v1'));

-- (déjà présentes via les SQL précédents, rappelées ici par sécurité)
alter table public.tournaments add column if not exists config jsonb;
alter table public.tournament_participants add column if not exists group_no int;
alter table public.tournament_matches add column if not exists win_to  text;
alter table public.tournament_matches add column if not exists lose_to text;
