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

-- ============================================================
--  AJOUT — DISPOS DE LA SEMAINE (grille récurrente jour × créneau)
--  À exécuter dans SQL Editor si tu ajoutes cette fonctionnalité.
-- ============================================================
create table if not exists public.weekly_slots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  weekday    int  not null check (weekday between 0 and 6),   -- 0=Lundi … 6=Dimanche
  slot       text not null check (slot in ('aprem','soir','nuit')),
  status     text not null check (status in ('yes','maybe')),
  updated_at timestamptz default now(),
  unique (user_id, weekday, slot)
);
alter table public.weekly_slots enable row level security;
drop policy if exists "weekly_read"       on public.weekly_slots;
drop policy if exists "weekly_insert_own" on public.weekly_slots;
drop policy if exists "weekly_update_own" on public.weekly_slots;
drop policy if exists "weekly_delete_own" on public.weekly_slots;
create policy "weekly_read"       on public.weekly_slots for select to authenticated using (true);
create policy "weekly_insert_own" on public.weekly_slots for insert to authenticated with check (user_id = auth.uid());
create policy "weekly_update_own" on public.weekly_slots for update to authenticated using (user_id = auth.uid());
create policy "weekly_delete_own" on public.weekly_slots for delete to authenticated using (user_id = auth.uid());

-- ============================================================
--  AJOUT — Accueil/Annonces + Profils enrichis (self-service)
-- ============================================================
-- Colonnes profil enrichi
alter table public.profiles
  add column if not exists poste     text,
  add column if not exists rank      text,
  add column if not exists photo_url text,
  add column if not exists socials   text,
  add column if not exists bio       text;

-- Annonces internes
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  team       text,                         -- null = toutes les équipes
  title      text not null default '',
  body       text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.announcements enable row level security;
drop policy if exists "ann_read"      on public.announcements;
drop policy if exists "ann_staff_ins" on public.announcements;
drop policy if exists "ann_staff_upd" on public.announcements;
drop policy if exists "ann_staff_del" on public.announcements;
create policy "ann_read"      on public.announcements for select to authenticated using (true);
create policy "ann_staff_ins" on public.announcements for insert to authenticated with check (public.is_staff());
create policy "ann_staff_upd" on public.announcements for update to authenticated using (public.is_staff());
create policy "ann_staff_del" on public.announcements for delete to authenticated using (public.is_staff());

-- Sécurité : un joueur ne modifie QUE les champs "profil" (jamais role/team via le site)
revoke update on public.profiles from authenticated;
grant  update (pseudo, poste, rank, photo_url, socials, bio) on public.profiles to authenticated;

-- ============================================================
--  AJOUT — Feuilles de match : résultat + composition
-- ============================================================
alter table public.sessions
  add column if not exists score_us   int,
  add column if not exists score_them int,
  add column if not exists maps       text,
  add column if not exists vod        text;

create table if not exists public.match_lineup (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text,
  pick       text,                 -- agent / champion
  starter    boolean not null default true,
  ordre      int not null default 0,
  unique (session_id, user_id)
);
alter table public.match_lineup enable row level security;
drop policy if exists "lineup_read"      on public.match_lineup;
drop policy if exists "lineup_staff_ins" on public.match_lineup;
drop policy if exists "lineup_staff_upd" on public.match_lineup;
drop policy if exists "lineup_staff_del" on public.match_lineup;
create policy "lineup_read"      on public.match_lineup for select to authenticated using (true);
create policy "lineup_staff_ins" on public.match_lineup for insert to authenticated with check (public.is_staff());
create policy "lineup_staff_upd" on public.match_lineup for update to authenticated using (public.is_staff());
create policy "lineup_staff_del" on public.match_lineup for delete to authenticated using (public.is_staff());

-- ============================================================
--  ESPACE BUREAU (back-office association) — accès réservé
-- ============================================================
-- Accès bureau (indépendant des rôles joueur/staff de l'espace équipe)
alter table public.profiles add column if not exists is_bureau boolean not null default false;

create or replace function public.is_bureau() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and coalesce(is_bureau,false) = true);
$$;

-- Attribuer / retirer l'accès bureau (réservé aux membres du bureau)
create or replace function public.set_bureau(target uuid, val boolean) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.is_bureau() then raise exception 'Réservé au bureau'; end if;
  update public.profiles set is_bureau = val where id = target;
end; $$;
grant execute on function public.set_bureau(uuid, boolean) to authenticated;

-- Tables du back-office
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  last_name text, first_name text, email text, phone text,
  status text, notes text, created_at timestamptz default now()
);
create table if not exists public.dues (
  id uuid primary key default gen_random_uuid(),
  member text, season text, amount numeric, paid boolean default false, method text,
  created_at timestamptz default now()
);
create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date, kind text, label text, category text, amount numeric, notes text,
  created_at timestamptz default now()
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text, link text, doc_date date, category text, notes text,
  created_at timestamptz default now()
);
create table if not exists public.partner_contacts (
  id uuid primary key default gen_random_uuid(),
  name text, contact_name text, email text, phone text, status text, notes text,
  created_at timestamptz default now()
);
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text, category text, quantity int, status text, notes text,
  created_at timestamptz default now()
);
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  item text, borrower text, out_date date, due_date date, returned boolean default false, notes text,
  created_at timestamptz default now()
);

-- RLS : tout est réservé aux membres du bureau (lecture + écriture)
do $$
declare t text;
begin
  foreach t in array array['members','dues','finance_entries','documents','partner_contacts','equipment','loans'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_bureau_all" on public.%I', t, t);
    execute format('create policy "%s_bureau_all" on public.%I for all to authenticated using (public.is_bureau()) with check (public.is_bureau())', t, t);
  end loop;
end $$;

-- ============================================================
--  BUREAU — Priorité 1 : Finance détaillée + statuts cotisation
-- ============================================================
alter table public.dues
  add column if not exists status text,
  add column if not exists due_date date,
  add column if not exists paid_date date;
alter table public.finance_entries
  add column if not exists counterparty text,
  add column if not exists justificatif text,
  add column if not exists linked text;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text, inv_date date, party text, amount numeric, status text,
  due_date date, file text, notes text, created_at timestamptz default now()
);
create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  category text, event text, planned numeric, notes text, created_at timestamptz default now()
);
do $$ declare t text; begin
  foreach t in array array['invoices','budget_lines'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_bureau_all" on public.%I', t, t);
    execute format('create policy "%s_bureau_all" on public.%I for all to authenticated using (public.is_bureau()) with check (public.is_bureau())', t, t);
  end loop;
end $$;

-- ============================================================
--  BUREAU — Priorité 2 : Événements, Partenaires (contrats/suivi), Matériel
-- ============================================================
create table if not exists public.org_events (
  id uuid primary key default gen_random_uuid(),
  name text, event_date date, event_time text, place text, type text, responsible text, notes text,
  created_at timestamptz default now()
);
create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event text, name text, role text, present boolean default false, notes text,
  created_at timestamptz default now()
);
create table if not exists public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  event text, task text, responsible text, done boolean default false, notes text,
  created_at timestamptz default now()
);
create table if not exists public.partner_contracts (
  id uuid primary key default gen_random_uuid(),
  partner text, start_date date, end_date date, amount numeric, status text, file text, counterparts text, notes text,
  created_at timestamptz default now()
);
create table if not exists public.partner_followups (
  id uuid primary key default gen_random_uuid(),
  partner text, action text, due_date date, done boolean default false, notes text,
  created_at timestamptz default now()
);
alter table public.equipment
  add column if not exists inv_number text,
  add column if not exists location text,
  add column if not exists responsible text,
  add column if not exists purchase_date date,
  add column if not exists invoice text;
alter table public.loans
  add column if not exists return_date date,
  add column if not exists condition text;

do $$ declare t text; begin
  foreach t in array array['org_events','event_participants','event_tasks','partner_contracts','partner_followups'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_bureau_all" on public.%I', t, t);
    execute format('create policy "%s_bureau_all" on public.%I for all to authenticated using (public.is_bureau()) with check (public.is_bureau())', t, t);
  end loop;
end $$;

-- ============================================================
--  BUREAU — Priorité 3 : Équipes, Rôles, Journal des actions
-- ============================================================
alter table public.profiles add column if not exists bureau_role text;

create or replace function public.set_bureau_role(target uuid, role_val text) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.is_bureau() then raise exception 'Réservé au bureau'; end if;
  update public.profiles set bureau_role = role_val where id = target;
end; $$;
grant execute on function public.set_bureau_role(uuid, text) to authenticated;

create table if not exists public.bu_players (
  id uuid primary key default gen_random_uuid(),
  pseudo text, real_name text, team text, game text, poste text, status text, notes text,
  created_at timestamptz default now()
);
create table if not exists public.bu_staff (
  id uuid primary key default gen_random_uuid(),
  name text, role text, team text, notes text, created_at timestamptz default now()
);
create table if not exists public.bu_competitions (
  id uuid primary key default gen_random_uuid(),
  name text, team text, game text, comp_date date, opponent text, result text, ranking text, notes text,
  created_at timestamptz default now()
);
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid default auth.uid(),
  action text, entity text, detail text,
  at timestamptz default now()
);

do $$ declare t text; begin
  foreach t in array array['bu_players','bu_staff','bu_competitions','activity_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_bureau_all" on public.%I', t, t);
    execute format('create policy "%s_bureau_all" on public.%I for all to authenticated using (public.is_bureau()) with check (public.is_bureau())', t, t);
  end loop;
end $$;

-- ============================================================
--  BUREAU — MESSAGERIE INTERNE (canaux + messages directs, temps réel)
-- ============================================================

-- Canaux publics (visibles par tout le bureau)
create table if not exists public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);

-- Conversations privées entre deux membres du bureau (paire ordonnée user_a < user_b)
create table if not exists public.chat_dms (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null,
  user_b uuid not null,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

-- Messages : rattachés à un canal OU à un DM
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.chat_channels(id) on delete cascade,
  dm_id uuid references public.chat_dms(id) on delete cascade,
  sender uuid default auth.uid(),
  body text not null,
  created_at timestamptz default now()
);
create index if not exists chat_messages_channel_idx on public.chat_messages(channel_id, created_at);
create index if not exists chat_messages_dm_idx on public.chat_messages(dm_id, created_at);

alter table public.chat_channels enable row level security;
alter table public.chat_dms      enable row level security;
alter table public.chat_messages enable row level security;

-- Canaux : lecture + écriture pour le bureau
drop policy if exists "chat_channels_bureau" on public.chat_channels;
create policy "chat_channels_bureau" on public.chat_channels
  for all to authenticated using (public.is_bureau()) with check (public.is_bureau());

-- DM : seuls les deux participants (et membres du bureau)
drop policy if exists "chat_dms_parts" on public.chat_dms;
create policy "chat_dms_parts" on public.chat_dms
  for all to authenticated
  using (public.is_bureau() and auth.uid() in (user_a, user_b))
  with check (public.is_bureau() and auth.uid() in (user_a, user_b));

-- Messages : canal -> tout le bureau ; DM -> uniquement les participants
drop policy if exists "chat_messages_select" on public.chat_messages;
create policy "chat_messages_select" on public.chat_messages
  for select to authenticated using (
    public.is_bureau() and (
      channel_id is not null
      or exists (select 1 from public.chat_dms d where d.id = chat_messages.dm_id and auth.uid() in (d.user_a, d.user_b))
    )
  );

drop policy if exists "chat_messages_insert" on public.chat_messages;
create policy "chat_messages_insert" on public.chat_messages
  for insert to authenticated with check (
    public.is_bureau() and sender = auth.uid() and (
      channel_id is not null
      or exists (select 1 from public.chat_dms d where d.id = chat_messages.dm_id and auth.uid() in (d.user_a, d.user_b))
    )
  );

-- Chacun peut supprimer ses propres messages
drop policy if exists "chat_messages_delete" on public.chat_messages;
create policy "chat_messages_delete" on public.chat_messages
  for delete to authenticated using (public.is_bureau() and sender = auth.uid());

-- Ouvrir/retrouver une conversation directe (ordonne la paire, vérifie que la cible est bien bureau)
create or replace function public.get_or_create_dm(other uuid)
  returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a uuid; b uuid; found uuid;
begin
  if not public.is_bureau() then raise exception 'Réservé au bureau'; end if;
  if other = me then raise exception 'Conversation avec soi-même impossible'; end if;
  if not exists (select 1 from public.profiles p where p.id = other and coalesce(p.is_bureau,false)) then
    raise exception 'Le destinataire n''est pas membre du bureau';
  end if;
  if me < other then a := me; b := other; else a := other; b := me; end if;
  select id into found from public.chat_dms where user_a = a and user_b = b;
  if found is null then
    insert into public.chat_dms(user_a, user_b) values (a, b) returning id into found;
  end if;
  return found;
end; $$;
grant execute on function public.get_or_create_dm(uuid) to authenticated;

-- Temps réel : diffuser les changements de chat_messages (respecte la RLS ci-dessus)
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when others then null; end $$;

-- Canal général par défaut
insert into public.chat_channels(name, description)
select 'général', 'Canal général du bureau'
where not exists (select 1 from public.chat_channels);

-- ============================================================
--  BUREAU — PIÈCES JOINTES (Storage) + MESSAGES NON LUS
-- ============================================================

-- Bucket privé pour tous les fichiers du bureau (justificatifs, factures, docs, pièces jointes chat)
insert into storage.buckets (id, name, public) values ('bureau', 'bureau', false)
on conflict (id) do nothing;

-- Accès au bucket réservé aux membres du bureau (lecture via URL signée, écriture, remplacement, suppression)
drop policy if exists "bureau_storage_all" on storage.objects;
create policy "bureau_storage_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'bureau' and public.is_bureau())
  with check (bucket_id = 'bureau' and public.is_bureau());

-- Pièces jointes des messages
alter table public.chat_messages add column if not exists attachment_path text;
alter table public.chat_messages add column if not exists attachment_name text;
alter table public.chat_messages alter column body drop not null;

-- Suivi de lecture (messages non lus) : une ligne par (utilisateur, conversation)
create table if not exists public.chat_reads (
  user_id uuid not null default auth.uid(),
  scope text not null,               -- 'channel' | 'dm'
  ref_id uuid not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, scope, ref_id)
);
alter table public.chat_reads enable row level security;
drop policy if exists "chat_reads_own" on public.chat_reads;
create policy "chat_reads_own" on public.chat_reads
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
--  BUREAU — CONFORMITÉ CHAMPS (fiches sous-rubriques) 02/09/2026
-- ============================================================
-- Adhérents / Liste des membres
alter table public.members add column if not exists join_date date;
alter table public.members add column if not exists season text;
alter table public.members add column if not exists member_role text;
-- Adhérents / Cotisations
alter table public.dues add column if not exists justificatif text;
alter table public.dues add column if not exists notes text;
-- Documents (membre associé / type / version)
alter table public.documents add column if not exists member text;
alter table public.documents add column if not exists doc_type text;
alter table public.documents add column if not exists version text;
-- Finance / Budget
alter table public.budget_lines add column if not exists exercice text;
-- Événements / Organisation
alter table public.event_tasks add column if not exists due_date date;
alter table public.event_tasks add column if not exists material text;
alter table public.event_tasks add column if not exists bilan text;
-- Partenaires / Contacts
alter table public.partner_contacts add column if not exists role_contact text;
alter table public.partner_contacts add column if not exists address text;
-- Partenaires / Suivi
alter table public.partner_followups add column if not exists responsible text;
-- Équipes / Compétitions
alter table public.bu_competitions add column if not exists comp_time text;
alter table public.bu_competitions add column if not exists file text;

-- Documents / Subventions : table dédiée
create table if not exists public.subventions (
  id uuid primary key default gen_random_uuid(),
  organisme text, dispositif text, amount numeric,
  request_date date, due_date date, status text, file text, notes text,
  created_at timestamptz default now()
);
alter table public.subventions enable row level security;
drop policy if exists "subventions_bureau_all" on public.subventions;
create policy "subventions_bureau_all" on public.subventions
  for all to authenticated using (public.is_bureau()) with check (public.is_bureau());

-- ============================================================
--  BUREAU — PERMISSIONS FINES PAR RÔLE (RLS serveur) 02/09/2026
--  Président ou sans rôle = accès complet (anti-blocage).
-- ============================================================
create or replace function public.bu_can(dom text) returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select is_bureau from public.profiles where id = auth.uid()), false)
    and (
      coalesce((select bureau_role from public.profiles where id = auth.uid()), '') in ('', 'Président')
      or case (select bureau_role from public.profiles where id = auth.uid())
           when 'Trésorier'                then dom in ('finance','adherents')
           when 'Secrétaire'               then dom in ('docs')
           when 'Responsable esport'       then dom in ('teams')
           when 'Responsable événements'   then dom in ('events','material')
           when 'Bénévole'                 then dom in ('events')
           else false
         end
    );
$$;
grant execute on function public.bu_can(text) to authenticated;

-- Remplace les politiques « accès à tout le bureau » par des politiques par domaine.
-- (documents, subventions, chat_*, activity_log, profiles restent inchangés : accès bureau commun.)
do $$
declare rec record;
begin
  for rec in select * from (values
    ('members','adherents'), ('dues','adherents'),
    ('finance_entries','finance'), ('invoices','finance'), ('budget_lines','finance'),
    ('org_events','events'), ('event_participants','events'), ('event_tasks','events'),
    ('partner_contacts','partners'), ('partner_contracts','partners'), ('partner_followups','partners'),
    ('bu_players','teams'), ('bu_staff','teams'), ('bu_competitions','teams'),
    ('equipment','material'), ('loans','material')
  ) as t(tbl, dom)
  loop
    execute format('alter table public.%I enable row level security', rec.tbl);
    execute format('drop policy if exists "%s_bureau_all" on public.%I', rec.tbl, rec.tbl);
    execute format('drop policy if exists "%s_role" on public.%I', rec.tbl, rec.tbl);
    execute format('create policy "%s_role" on public.%I for all to authenticated using (public.bu_can(%L)) with check (public.bu_can(%L))', rec.tbl, rec.tbl, rec.dom, rec.dom);
  end loop;
end $$;
