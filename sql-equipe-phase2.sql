-- ============================================================
--  ESPACE ÉQUIPE — PHASE 2 : types de séance étendus
--  À lancer une fois dans Supabase → SQL Editor.
--  Ajoute les types « scrim » et « competition » aux séances
--  (en plus de « training » = pracc et « match »).
-- ============================================================
alter table public.sessions drop constraint if exists sessions_type_check;
alter table public.sessions add constraint sessions_type_check
  check (type in ('training','scrim','match','competition'));
