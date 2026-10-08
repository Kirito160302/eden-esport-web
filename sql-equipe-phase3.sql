-- ============================================================
--  ESPACE ÉQUIPE — PHASE 3 : convocations
--  À lancer une fois dans Supabase → SQL Editor.
--  Le staff désigne les joueurs appelés pour une séance ; le joueur
--  confirme sa présence avec les boutons Présent/Peut-être/Absent habituels.
-- ============================================================
create table if not exists public.convocations (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (session_id, user_id)
);
alter table public.convocations enable row level security;

-- Tout le monde (connecté) peut voir les convocations ; seul le staff les gère.
drop policy if exists convocations_read on public.convocations;
create policy convocations_read on public.convocations
  for select to authenticated using (true);

drop policy if exists convocations_staff_write on public.convocations;
create policy convocations_staff_write on public.convocations
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
