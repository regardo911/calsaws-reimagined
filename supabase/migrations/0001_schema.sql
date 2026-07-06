-- ============================================================================
-- CalSAWS Reimagined — schema (dedicated `calsaws` Supabase project, public schema)
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type user_role as enum ('applicant','worker','supervisor','admin');
create type case_status as enum ('pending','yellow_banner','pending_authorization','approved','denied','renewal_due');
create type task_status as enum ('open','done');

-- ---------- profiles (1:1 with auth.users) ----------
create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  role user_role not null default 'applicant',
  full_name text not null,
  county text not null default 'Los Angeles',
  worker_id text,
  title text,
  created_at timestamptz not null default now()
);

-- New auth signups become applicant profiles automatically.
-- Role is trusted ONLY from app_metadata (server-set); user_metadata cannot escalate.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (auth_user_id, role, full_name, county, worker_id, title)
  values (
    new.id,
    coalesce((new.raw_app_meta_data->>'calsaws_role')::user_role, 'applicant'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data->>'calsaws_county', 'Los Angeles'),
    new.raw_app_meta_data->>'calsaws_worker_id',
    new.raw_app_meta_data->>'calsaws_title'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- case number sequence ----------
create sequence case_number_seq start 200001;
create or replace function next_case_number() returns text
language sql volatile as $$ select 'C-' || nextval('case_number_seq')::text $$;

-- ---------- cases ----------
create table cases (
  id uuid primary key default gen_random_uuid(),
  case_number text unique not null default next_case_number(),
  county text not null,
  status case_status not null default 'pending',
  programs text[] not null,
  application_date date not null default current_date,
  source text not null default 'BenefitsCal e-Application',
  intake_mode text not null default 'Regular Intake',
  expedited boolean not null default false,
  assigned_to uuid references profiles(id),
  applicant_profile_id uuid references profiles(id),
  golden_tag text,
  expected_note text,
  flags jsonb not null default '{}'::jsonb,
  address text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on cases (status);
create index on cases (assigned_to);
create index on cases (applicant_profile_id);

create or replace function touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger cases_touch before update on cases for each row execute function touch_updated_at();

-- ---------- case children ----------
create table persons (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  person_key text not null,           -- p1, p2… (stable key used by engine traces)
  name text not null,
  dob date,
  age int not null,
  ssn text,                           -- synthetic
  role text not null default 'member',-- primary | member
  citizen boolean not null default true,
  immigration_status text,
  aged boolean not null default false,
  disabled boolean not null default false,
  blind boolean not null default false,
  pregnant boolean not null default false,
  refugee boolean not null default false,
  arrival_months_ago int,
  ssi_ineligible_immigration boolean not null default false,
  employed boolean not null default false
);
create index on persons (case_id);

create table income_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  person_key text not null default 'p1',
  kind text not null,                 -- earned | unearned
  subtype text not null default 'Wages',
  amount numeric not null
);
create index on income_records (case_id);

create table resource_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  kind text not null default 'liquid',
  label text,
  value numeric not null
);
create index on resource_records (case_id);

create table expense_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  kind text not null,                 -- rent | mortgage | utilities | dependent_care | medical | child_support
  amount numeric not null
);
create index on expense_records (case_id);

create table data_matches (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  source text not null,
  field text not null,
  reported numeric not null default 0,
  matched numeric not null default 0,
  resolved boolean not null default false,
  resolution_note text
);
create index on data_matches (case_id);

-- ---------- EDBC ----------
create table edbc_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  benefit_month text not null,
  run_by uuid references profiles(id),
  blocked boolean not null default false,
  accepted boolean not null default false,
  accepted_by uuid references profiles(id),
  accepted_at timestamptz,
  authorized_by uuid references profiles(id),
  authorized_at timestamptz,
  created_at timestamptz not null default now()
);
create index on edbc_runs (case_id);

create table edbc_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references edbc_runs(id) on delete cascade,
  program text not null,
  status text not null,               -- Eligible | Ineligible
  amount numeric not null default 0,
  aid_code text,
  expedited boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  trace jsonb not null default '[]'::jsonb,
  members jsonb
);
create index on edbc_results (run_id);

-- ---------- downstream ----------
create table notices (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  program text not null,
  type text not null,                 -- Approval NOA | Denial NOA
  amount numeric not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  date date not null default current_date,
  language text not null default 'en'
);
create index on notices (case_id);

create table issuances (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  program text not null,
  amount numeric not null,
  method text not null default 'EBT',
  date date not null default current_date
);
create index on issuances (case_id);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  type text not null,
  priority text not null default 'Normal', -- Critical | High | Normal
  due_date date not null,
  assigned_to uuid references profiles(id),
  status task_status not null default 'open',
  completed_by uuid references profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on tasks (status, assigned_to);
create index on tasks (case_id);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  kind text not null,
  text text not null,
  author_name text not null default 'System',
  author_profile_id uuid references profiles(id),
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index on journal_entries (case_id);

-- ---------- rules ----------
create table rule_params (
  path text primary key,
  value numeric not null,
  label text not null,
  grp text not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- ---------- meta ----------
create table app_meta (
  key text primary key,
  value text not null
);
insert into app_meta (key, value) values ('schema_version', '1');
