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

-- ============================================================
--  ESPACE ÉQUIPE — COMPOS / DRAFT (compositions + pools joueurs) 02/09/2026
-- ============================================================
create table if not exists public.team_comps (
  id uuid primary key default gen_random_uuid(),
  team text, game text, name text, opponent text, map text, side text,
  picks jsonb default '[]'::jsonb, bans jsonb default '[]'::jsonb, notes text,
  author uuid default auth.uid(), created_at timestamptz default now()
);
alter table public.team_comps enable row level security;
drop policy if exists "team_comps_read"   on public.team_comps;
drop policy if exists "team_comps_write"  on public.team_comps;
drop policy if exists "team_comps_modify" on public.team_comps;
drop policy if exists "team_comps_del"    on public.team_comps;
create policy "team_comps_read"   on public.team_comps for select to authenticated using (true);
create policy "team_comps_write"  on public.team_comps for insert to authenticated with check (author = auth.uid());
create policy "team_comps_modify" on public.team_comps for update to authenticated using (public.is_staff() or author = auth.uid()) with check (public.is_staff() or author = auth.uid());
create policy "team_comps_del"    on public.team_comps for delete to authenticated using (public.is_staff() or author = auth.uid());

create table if not exists public.player_pool (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  game text, champ_key text, champ_name text, icon text, role text,
  created_at timestamptz default now(),
  unique (user_id, game, champ_key)
);
alter table public.player_pool enable row level security;
drop policy if exists "player_pool_read" on public.player_pool;
drop policy if exists "player_pool_own"  on public.player_pool;
create policy "player_pool_read" on public.player_pool for select to authenticated using (true);
create policy "player_pool_own"  on public.player_pool for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

-- ============================================================
--  PLATEFORME MULTI-CLUBS — Phase 1a (fondations + effectifs) 07/09/2026
-- ============================================================
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null, sport text, logo text,
  invite_code text unique,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'parent' check (role in ('dirigeant','educateur','joueur','parent')),
  status text not null default 'en_attente' check (status in ('en_attente','actif')),
  created_at timestamptz default now(),
  unique (club_id, user_id)
);
create table if not exists public.club_teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null, season text, notes text, created_at timestamptz default now()
);
create table if not exists public.team_staff (
  team_id uuid not null references public.club_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (team_id, user_id)
);
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  team_id uuid references public.club_teams(id) on delete set null,
  first_name text, last_name text, birthdate date, licence_no text,
  status text default 'Actif', notes text, created_at timestamptz default now()
);
create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(), unique (player_id, user_id)
);

-- Helpers (cloisonnement multi-tenant)
create or replace function public.is_club_member(cid uuid) returns boolean
  language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.club_members m where m.club_id=cid and m.user_id=auth.uid() and m.status='actif'); $$;
create or replace function public.is_club_admin(cid uuid) returns boolean
  language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.club_members m where m.club_id=cid and m.user_id=auth.uid() and m.status='actif' and m.role='dirigeant'); $$;
create or replace function public.is_team_staff(tid uuid) returns boolean
  language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.team_staff s where s.team_id=tid and s.user_id=auth.uid()); $$;
grant execute on function public.is_club_member(uuid) to authenticated;
grant execute on function public.is_club_admin(uuid) to authenticated;
grant execute on function public.is_team_staff(uuid) to authenticated;

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_teams enable row level security;
alter table public.team_staff enable row level security;
alter table public.players enable row level security;
alter table public.guardians enable row level security;

-- clubs : lisible par ses membres (actifs ou en attente) ; modifiable par le dirigeant
drop policy if exists "clubs_read" on public.clubs;
create policy "clubs_read" on public.clubs for select to authenticated using (exists(select 1 from public.club_members m where m.club_id=clubs.id and m.user_id=auth.uid()));
drop policy if exists "clubs_admin" on public.clubs;
create policy "clubs_admin" on public.clubs for update to authenticated using (public.is_club_admin(id)) with check (public.is_club_admin(id));

-- club_members : chacun voit sa/ses adhésion(s) + les membres actifs voient tout le club ; dirigeant gère
drop policy if exists "cm_read" on public.club_members;
create policy "cm_read" on public.club_members for select to authenticated using (user_id = auth.uid() or public.is_club_member(club_id));
drop policy if exists "cm_admin" on public.club_members;
create policy "cm_admin" on public.club_members for update to authenticated using (public.is_club_admin(club_id)) with check (public.is_club_admin(club_id));
drop policy if exists "cm_del" on public.club_members;
create policy "cm_del" on public.club_members for delete to authenticated using (public.is_club_admin(club_id) or user_id = auth.uid());

-- club_teams (catégories)
drop policy if exists "ct_read" on public.club_teams;
create policy "ct_read" on public.club_teams for select to authenticated using (public.is_club_member(club_id));
drop policy if exists "ct_write" on public.club_teams;
create policy "ct_write" on public.club_teams for all to authenticated using (public.is_club_admin(club_id)) with check (public.is_club_admin(club_id));

-- team_staff (éducateurs d'une catégorie)
drop policy if exists "ts_read" on public.team_staff;
create policy "ts_read" on public.team_staff for select to authenticated using (exists(select 1 from public.club_teams t where t.id=team_staff.team_id and public.is_club_member(t.club_id)));
drop policy if exists "ts_write" on public.team_staff;
create policy "ts_write" on public.team_staff for all to authenticated using (exists(select 1 from public.club_teams t where t.id=team_staff.team_id and public.is_club_admin(t.club_id))) with check (exists(select 1 from public.club_teams t where t.id=team_staff.team_id and public.is_club_admin(t.club_id)));

-- players : dirigeant + éducateur de la catégorie + parent de l'enfant
drop policy if exists "pl_read" on public.players;
create policy "pl_read" on public.players for select to authenticated using (
  public.is_club_admin(club_id) or public.is_team_staff(team_id)
  or exists(select 1 from public.guardians g where g.player_id=players.id and g.user_id=auth.uid()));
drop policy if exists "pl_write" on public.players;
create policy "pl_write" on public.players for all to authenticated using (
  public.is_club_admin(club_id) or public.is_team_staff(team_id)
) with check (public.is_club_admin(club_id) or public.is_team_staff(team_id));

-- guardians : le parent voit ses liens ; dirigeant/éducateur gèrent les rattachements
drop policy if exists "gu_read" on public.guardians;
create policy "gu_read" on public.guardians for select to authenticated using (
  user_id = auth.uid()
  or exists(select 1 from public.players p where p.id=guardians.player_id and (public.is_club_admin(p.club_id) or public.is_team_staff(p.team_id))));
drop policy if exists "gu_write" on public.guardians;
create policy "gu_write" on public.guardians for all to authenticated using (
  exists(select 1 from public.players p where p.id=guardians.player_id and (public.is_club_admin(p.club_id) or public.is_team_staff(p.team_id)))
) with check (exists(select 1 from public.players p where p.id=guardians.player_id and (public.is_club_admin(p.club_id) or public.is_team_staff(p.team_id))));

-- RPC : créer un club (le créateur devient dirigeant actif) + code d'invitation
create or replace function public.create_club(p_name text, p_sport text) returns public.clubs
  language plpgsql security definer set search_path=public as $$
declare c public.clubs;
begin
  insert into public.clubs(name, sport, invite_code, created_by)
  values (p_name, p_sport, upper(substr(md5(random()::text),1,6)), auth.uid()) returning * into c;
  insert into public.club_members(club_id, user_id, role, status) values (c.id, auth.uid(), 'dirigeant', 'actif');
  return c;
end; $$;
grant execute on function public.create_club(text,text) to authenticated;

-- RPC : rejoindre un club par code (statut en attente, à valider par le dirigeant)
create or replace function public.join_club(p_code text, p_role text) returns public.club_members
  language plpgsql security definer set search_path=public as $$
declare cid uuid; r text; m public.club_members;
begin
  select id into cid from public.clubs where invite_code = upper(p_code);
  if cid is null then raise exception 'Code club invalide'; end if;
  r := coalesce(nullif(p_role,''),'parent');
  if r not in ('educateur','parent','joueur') then r := 'parent'; end if;
  select * into m from public.club_members where club_id=cid and user_id=auth.uid();
  if m.id is not null then return m; end if;
  insert into public.club_members(club_id, user_id, role, status) values (cid, auth.uid(), r, 'en_attente') returning * into m;
  return m;
end; $$;
grant execute on function public.join_club(text,text) to authenticated;

-- ============================================================
--  PLATEFORME CLUBS — Phase 1b : calendrier + convocations/présences 07/09/2026
-- ============================================================
create table if not exists public.club_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  team_id uuid references public.club_teams(id) on delete cascade,
  type text not null default 'entrainement' check (type in ('match','entrainement','plateau')),
  starts_at timestamptz not null, place text, opponent text, notes text,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create table if not exists public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.club_events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'present' check (status in ('present','absent','peutetre')),
  responded_by uuid default auth.uid(), updated_at timestamptz default now(),
  unique (event_id, player_id)
);
alter table public.club_events enable row level security;
alter table public.event_attendance enable row level security;

-- Événements : dirigeant + éducateur de la catégorie + parent d'un enfant de la catégorie
drop policy if exists "ce_read" on public.club_events;
create policy "ce_read" on public.club_events for select to authenticated using (
  public.is_club_admin(club_id) or public.is_team_staff(team_id)
  or exists(select 1 from public.players p join public.guardians g on g.player_id=p.id where p.team_id=club_events.team_id and g.user_id=auth.uid()));
drop policy if exists "ce_write" on public.club_events;
create policy "ce_write" on public.club_events for all to authenticated using (
  public.is_club_admin(club_id) or public.is_team_staff(team_id)
) with check (public.is_club_admin(club_id) or public.is_team_staff(team_id));

-- Présences : staff de l'événement + parent de l'enfant concerné
drop policy if exists "ea_read" on public.event_attendance;
create policy "ea_read" on public.event_attendance for select to authenticated using (
  exists(select 1 from public.club_events e where e.id=event_attendance.event_id and (public.is_club_admin(e.club_id) or public.is_team_staff(e.team_id)))
  or exists(select 1 from public.guardians g where g.player_id=event_attendance.player_id and g.user_id=auth.uid()));
drop policy if exists "ea_write" on public.event_attendance;
create policy "ea_write" on public.event_attendance for all to authenticated using (
  exists(select 1 from public.guardians g where g.player_id=event_attendance.player_id and g.user_id=auth.uid())
  or exists(select 1 from public.club_events e where e.id=event_attendance.event_id and (public.is_club_admin(e.club_id) or public.is_team_staff(e.team_id)))
) with check (
  exists(select 1 from public.guardians g where g.player_id=event_attendance.player_id and g.user_id=auth.uid())
  or exists(select 1 from public.club_events e where e.id=event_attendance.event_id and (public.is_club_admin(e.club_id) or public.is_team_staff(e.team_id))));

-- ============================================================
--  PLATEFORME CLUBS — Phase 1c : messagerie par catégorie + documents 07/09/2026
-- ============================================================
-- Accès à un "canal" catégorie : dirigeant, éducateur de la catégorie, ou parent d'un enfant de la catégorie
create or replace function public.club_team_access(cid uuid, tid uuid) returns boolean
  language sql stable security definer set search_path=public as $$
  select public.is_club_admin(cid) or public.is_team_staff(tid)
    or exists(select 1 from public.players p join public.guardians g on g.player_id=p.id where p.team_id=tid and g.user_id=auth.uid()); $$;
grant execute on function public.club_team_access(uuid,uuid) to authenticated;

create table if not exists public.club_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  team_id uuid not null references public.club_teams(id) on delete cascade,
  sender uuid default auth.uid(), body text not null, created_at timestamptz default now()
);
create index if not exists club_messages_team_idx on public.club_messages(team_id, created_at);
alter table public.club_messages enable row level security;
drop policy if exists "cmsg_read" on public.club_messages;
create policy "cmsg_read" on public.club_messages for select to authenticated using (public.club_team_access(club_id, team_id));
drop policy if exists "cmsg_write" on public.club_messages;
create policy "cmsg_write" on public.club_messages for insert to authenticated with check (sender = auth.uid() and public.club_team_access(club_id, team_id));
drop policy if exists "cmsg_del" on public.club_messages;
create policy "cmsg_del" on public.club_messages for delete to authenticated using (sender = auth.uid() or public.is_club_admin(club_id));
do $$ begin alter publication supabase_realtime add table public.club_messages; exception when others then null; end $$;

create table if not exists public.club_documents (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  team_id uuid references public.club_teams(id) on delete set null,
  player_id uuid references public.players(id) on delete cascade,
  category text, file text, name text, notes text,
  uploaded_by uuid default auth.uid(), created_at timestamptz default now()
);
alter table public.club_documents enable row level security;
drop policy if exists "cdoc_all" on public.club_documents;
create policy "cdoc_all" on public.club_documents for all to authenticated using (
  public.is_club_admin(club_id) or public.is_team_staff(team_id)
  or exists(select 1 from public.guardians g where g.player_id=club_documents.player_id and g.user_id=auth.uid())
) with check (
  public.is_club_admin(club_id) or public.is_team_staff(team_id)
  or exists(select 1 from public.guardians g where g.player_id=club_documents.player_id and g.user_id=auth.uid()));

-- Stockage privé cloisonné : chemin = <club_id>/<player_id>/<fichier>
insert into storage.buckets (id, name, public) values ('club','club', false) on conflict (id) do nothing;
create or replace function public.club_file_ok(p_name text) returns boolean
  language plpgsql stable security definer set search_path=public as $$
  declare pid uuid;
  begin
    begin pid := ((storage.foldername(p_name))[2])::uuid; exception when others then return false; end;
    return exists(select 1 from public.players p where p.id=pid and (
      public.is_club_admin(p.club_id) or public.is_team_staff(p.team_id)
      or exists(select 1 from public.guardians g where g.player_id=p.id and g.user_id=auth.uid())));
  end; $$;
grant execute on function public.club_file_ok(text) to authenticated;
drop policy if exists "club_storage_all" on storage.objects;
create policy "club_storage_all" on storage.objects for all to authenticated
  using (bucket_id='club' and public.club_file_ok(name))
  with check (bucket_id='club' and public.club_file_ok(name));
