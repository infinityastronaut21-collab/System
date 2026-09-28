-- ============================================================================
-- SYSTEM — Schéma PostgreSQL / Supabase (Document 2, section 3)
-- À exécuter dans le SQL Editor de Supabase (un seul passage, idempotent).
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Types énumérés
-- --------------------------------------------------------------------------
do $$ begin
  create type activity_type as enum ('chrono', 'count', 'check');
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------------------------
-- 2. Tables
-- --------------------------------------------------------------------------

-- Profil utilisateur (lié à Supabase Auth)
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text not null default 'Infinity',
  created_at timestamptz not null default now()
);

-- Super-projet : contient des projets
create table if not exists super_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Projet : suite d'activités vers un but
create table if not exists projects (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  super_project_id uuid references super_projects(id) on delete set null,
  title            text not null,
  description      text,
  status           text not null default 'active' check (status in ('active', 'termine', 'archive')),
  start_date       date,
  end_date         date,
  deadline         date,
  reminder_days    int not null default 3,
  created_at       timestamptz not null default now()
);

-- Activité : tâche précise
create table if not exists activities (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  project_id         uuid references projects(id) on delete set null,
  title              text not null,
  type               activity_type not null default 'check',
  target_value       int,          -- count : répétitions cibles
  target_duration    int,          -- chrono : durée cible (secondes)
  estimated_duration int,          -- estimation (secondes)
  difficulty         smallint check (difficulty between 1 and 5),
  recurrence         text not null default 'none'
                     check (recurrence in ('none', 'daily', 'weekdays', 'weekly', 'custom')),
  recurrence_days    int[],        -- custom : 0=dim … 6=sam
  reminder_time      time,         -- rappel push quotidien
  deadline           date,
  tags               text[],
  notes              text,
  archived           boolean not null default false,
  created_at         timestamptz not null default now()
);

-- Sessions chrono (un seul chrono ouvert à la fois)
create table if not exists sessions (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references activities(id) on delete cascade,
  started_at   timestamptz not null,
  ended_at     timestamptz,        -- null = chrono en cours
  duration_sec int
);

-- Cases cochées du calendrier (par jour)
create table if not exists completions (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  day         date not null,
  value       int not null default 1,
  done        boolean not null default true,
  unique (activity_id, day)
);

-- Citations
create table if not exists quotes (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  author     text not null,
  source     text,
  created_at timestamptz not null default now()
);

-- Abonnements push navigateur
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  endpoint   text not null unique,
  keys       jsonb not null,
  created_at timestamptz not null default now()
);

-- Index utiles
create index if not exists idx_activities_user     on activities(user_id) where not archived;
create index if not exists idx_activities_project  on activities(project_id);
create index if not exists idx_sessions_activity   on sessions(activity_id);
create index if not exists idx_sessions_open       on sessions(activity_id) where ended_at is null;
create index if not exists idx_completions_day     on completions(day);
create index if not exists idx_projects_user       on projects(user_id);

-- --------------------------------------------------------------------------
-- 3. Compte unique + création automatique du profil
-- --------------------------------------------------------------------------

-- Bloque la création d'un second compte (Document 3, section 2)
create or replace function public.prevent_second_account()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select count(*) from auth.users) >= 1 then
    raise exception 'System est une application à compte unique : inscription refusée.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_second_account on auth.users;
create trigger prevent_second_account
  before insert on auth.users
  for each row execute function public.prevent_second_account();

-- Crée le profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'Infinity')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- 4. Row Level Security (Document 3, section 3)
-- --------------------------------------------------------------------------

alter table profiles           enable row level security;
alter table super_projects     enable row level security;
alter table projects           enable row level security;
alter table activities         enable row level security;
alter table sessions           enable row level security;
alter table completions        enable row level security;
alter table quotes             enable row level security;
alter table push_subscriptions enable row level security;

-- Macro manuelle : même motif partout pour les tables avec user_id ----------
-- profiles
drop policy if exists "lecture propre profil"      on profiles;
drop policy if exists "modification propre profil" on profiles;
create policy "lecture propre profil"      on profiles for select using (id = auth.uid());
create policy "modification propre profil" on profiles for update using (id = auth.uid());

-- super_projects
drop policy if exists "lecture propres super-projets"      on super_projects;
drop policy if exists "création propre super-projet"       on super_projects;
drop policy if exists "modification propre super-projet"   on super_projects;
drop policy if exists "suppression propre super-projet"    on super_projects;
create policy "lecture propres super-projets"    on super_projects for select using (user_id = auth.uid());
create policy "création propre super-projet"     on super_projects for insert with check (user_id = auth.uid());
create policy "modification propre super-projet" on super_projects for update using (user_id = auth.uid());
create policy "suppression propre super-projet"  on super_projects for delete using (user_id = auth.uid());

-- projects
drop policy if exists "lecture propres projets"      on projects;
drop policy if exists "création propre projet"       on projects;
drop policy if exists "modification propre projet"   on projects;
drop policy if exists "suppression propre projet"    on projects;
create policy "lecture propres projets"    on projects for select using (user_id = auth.uid());
create policy "création propre projet"     on projects for insert with check (user_id = auth.uid());
create policy "modification propre projet" on projects for update using (user_id = auth.uid());
create policy "suppression propre projet"  on projects for delete using (user_id = auth.uid());

-- activities
drop policy if exists "lecture propre activité"      on activities;
drop policy if exists "création propre activité"     on activities;
drop policy if exists "modification propre activité" on activities;
drop policy if exists "suppression propre activité"  on activities;
create policy "lecture propre activité"      on activities for select using (user_id = auth.uid());
create policy "création propre activité"     on activities for insert with check (user_id = auth.uid());
create policy "modification propre activité" on activities for update using (user_id = auth.uid());
create policy "suppression propre activité"  on activities for delete using (user_id = auth.uid());

-- sessions : sécurité héritée de l'activité propriétaire
drop policy if exists "lecture propres sessions"      on sessions;
drop policy if exists "création propre session"       on sessions;
drop policy if exists "modification propre session"   on sessions;
drop policy if exists "suppression propre session"    on sessions;
create policy "lecture propres sessions" on sessions for select
  using (exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid()));
create policy "création propre session" on sessions for insert
  with check (exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid()));
create policy "modification propre session" on sessions for update
  using (exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid()));
create policy "suppression propre session" on sessions for delete
  using (exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid()));

-- completions : sécurité héritée de l'activité propriétaire
drop policy if exists "lecture propres completions"      on completions;
drop policy if exists "création propre completion"       on completions;
drop policy if exists "modification propre completion"   on completions;
drop policy if exists "suppression propre completion"    on completions;
create policy "lecture propres completions" on completions for select
  using (exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid()));
create policy "création propre completion" on completions for insert
  with check (exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid()));
create policy "modification propre completion" on completions for update
  using (exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid()));
create policy "suppression propre completion" on completions for delete
  using (exists (select 1 from activities a where a.id = activity_id and a.user_id = auth.uid()));

-- quotes : collection personnelle du compte connecté (compte unique)
drop policy if exists "lecture citations"      on quotes;
drop policy if exists "ajout citation"         on quotes;
drop policy if exists "modification citation"  on quotes;
drop policy if exists "suppression citation"   on quotes;
create policy "lecture citations"     on quotes for select to authenticated using (true);
create policy "ajout citation"        on quotes for insert to authenticated with check (true);
create policy "modification citation" on quotes for update to authenticated using (true);
create policy "suppression citation"  on quotes for delete to authenticated using (true);

-- push_subscriptions
drop policy if exists "lecture propres abonnements push"      on push_subscriptions;
drop policy if exists "création propre abonnement push"       on push_subscriptions;
drop policy if exists "suppression propre abonnement push"    on push_subscriptions;
create policy "lecture propres abonnements push"   on push_subscriptions for select using (user_id = auth.uid());
create policy "création propre abonnement push"    on push_subscriptions for insert with check (user_id = auth.uid());
create policy "suppression propre abonnement push" on push_subscriptions for delete using (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 5. Citation du jour (Document 5, section 2) — rotation déterministe
-- --------------------------------------------------------------------------
create or replace function public.quote_of_the_day()
returns setof quotes
language sql
stable
security definer set search_path = public
as $$
  select * from quotes
  order by author, text
  offset (extract(doy from current_date)::int % greatest((select count(*) from quotes), 1))
  limit 1;
$$;
