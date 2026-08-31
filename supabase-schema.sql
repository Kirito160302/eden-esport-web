-- ============================================================
--  EDEN ESPORT — Espace membre (Supabase)
--  À exécuter UNE FOIS dans : Supabase → SQL Editor → New query → Run
--  Crée les tables, la sécurité (RLS) et la création auto du profil.
-- ============================================================

-- 1) PROFILS (un par utilisateur ; rôle joueur ou staff)
create table if not exists public.profiles (
  id     uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null default '',
  role   text not null default 'player' check (role in ('player','staff')),
  team   text
);

-- 2) SÉANCES (entraînements & matchs)
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('training','match')),
  title      text not null default '',
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  team       text,
  opponent   text,
  location   text,
  notes      text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 3) DISPONIBILITÉS (une réponse par joueur et par séance)
create table if not exists public.availabilities (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  status     text not null check (status in ('yes','no','maybe')),
  updated_at timestamptz default now(),
  unique (session_id, user_id)
);

-- 4) Fonction : l'utilisateur courant est-il staff ?
create or replace function public.is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'staff');
$$;

-- 5) Création automatique du profil à l'inscription
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data->>'pseudo', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 6) Sécurité au niveau des lignes (RLS)
alter table public.profiles       enable row level security;
alter table public.sessions       enable row level security;
alter table public.availabilities enable row level security;

-- Profils : tout membre connecté lit ; chacun modifie le sien ; le staff modifie tout
drop policy if exists "profiles_read"        on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_staff_update" on public.profiles;
create policy "profiles_read"        on public.profiles for select to authenticated using (true);
create policy "profiles_update_own"  on public.profiles for update to authenticated using (id = auth.uid());
create policy "profiles_staff_update" on public.profiles for update to authenticated using (public.is_staff());

-- Séances : tout membre lit ; seul le staff crée / modifie / supprime
drop policy if exists "sessions_read"         on public.sessions;
drop policy if exists "sessions_staff_insert" on public.sessions;
drop policy if exists "sessions_staff_update" on public.sessions;
drop policy if exists "sessions_staff_delete" on public.sessions;
create policy "sessions_read"         on public.sessions for select to authenticated using (true);
create policy "sessions_staff_insert" on public.sessions for insert to authenticated with check (public.is_staff());
create policy "sessions_staff_update" on public.sessions for update to authenticated using (public.is_staff());
create policy "sessions_staff_delete" on public.sessions for delete to authenticated using (public.is_staff());

-- Disponibilités : tout membre lit ; chacun gère UNIQUEMENT les siennes
drop policy if exists "avail_read"       on public.availabilities;
drop policy if exists "avail_insert_own" on public.availabilities;
drop policy if exists "avail_update_own" on public.availabilities;
drop policy if exists "avail_delete_own" on public.availabilities;
create policy "avail_read"       on public.availabilities for select to authenticated using (true);
create policy "avail_insert_own" on public.availabilities for insert to authenticated with check (user_id = auth.uid());
create policy "avail_update_own" on public.availabilities for update to authenticated using (user_id = auth.uid());
create policy "avail_delete_own" on public.availabilities for delete to authenticated using (user_id = auth.uid());
