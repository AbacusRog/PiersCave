-- ============================================================================
-- Piers Cave Group — Company Register & Due Dates Tracker
-- Schema mirrors the IFK Company Register design: companies, people,
-- officers/PSC/shareholder relationship tables, plus a due_dates table
-- that powers the tracker screen.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PEOPLE (directors, PSCs, shareholders — one row per real person)
-- ----------------------------------------------------------------------------
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  dob_month_year text,           -- Companies House only ever exposes month/year, e.g. "November 1971"
  nationality text,
  country_of_residence text,
  occupation text,
  correspondence_address text,
  notes text,                    -- e.g. data-confidence / source notes
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- COMPANIES
-- ----------------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  previous_names text,           -- e.g. "formerly Metalla UK Limited"
  company_number text not null unique,
  incorporation_date date,
  registered_office text,
  sic_code text,
  status text not null default 'Active',

  -- identity / compliance fields (mirrors IFK Register)
  utr text,
  vat_number text,
  authentication_code text,      -- ADMIN-ONLY field, see companies_view + trigger below
  vat_stagger text,              -- e.g. 'Mar / Jun / Sep / Dec'

  -- accounting reference dates
  year_end_day int,
  year_end_month int,

  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- OFFICERS (directors / secretaries)
-- ----------------------------------------------------------------------------
create table if not exists company_officers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  role text not null default 'Director',   -- Director | Secretary
  appointed_on date,
  resigned_on date,
  status text not null default 'Active',   -- Active | Resigned
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PERSONS WITH SIGNIFICANT CONTROL (PSC)
-- ----------------------------------------------------------------------------
create table if not exists company_pscs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  nature_of_control text,
  notified_on date,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- SHAREHOLDERS
-- ----------------------------------------------------------------------------
create table if not exists company_shareholders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  share_class text not null default 'Ordinary',
  shares_held int,
  currency text not null default 'GBP',
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- DUE DATES (drives the tracker screen)
-- One row per filing occurrence. Values are entered by hand each cycle —
-- never auto-advanced — matching the IFK Register convention. due_date is
-- the period-end / statement-anniversary / payment date; due_by is the
-- computed deadline.
-- Either company_id or person_id must be set (not both) — e.g. Personal Tax
-- rows hang off a person, everything else off a company.
-- ----------------------------------------------------------------------------
create table if not exists due_dates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  task_type text not null check (task_type in ('VAT', 'Year-End Accounts', 'Confirmation Statement', 'Personal Tax')),
  due_date date not null,        -- period end / statement date / payment date
  due_by date not null,          -- computed deadline shown as "Due By"
  amount text,                   -- optional, e.g. Personal Tax payment amounts
  note text,
  flag text,                     -- optional warning shown on the tracker row
  filed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint due_dates_owner_check check (
    (company_id is not null and person_id is null) or
    (company_id is null and person_id is not null)
  )
);

create index if not exists idx_due_dates_due_by on due_dates (due_by);
create index if not exists idx_officers_company on company_officers (company_id);
create index if not exists idx_officers_person on company_officers (person_id);
create index if not exists idx_pscs_company on company_pscs (company_id);
create index if not exists idx_pscs_person on company_pscs (person_id);
create index if not exists idx_shareholders_company on company_shareholders (company_id);
create index if not exists idx_shareholders_person on company_shareholders (person_id);

-- ----------------------------------------------------------------------------
-- ADMIN ACCESS
-- Controls who can see/change companies.authentication_code, and who can
-- manage this table itself (the in-app "Manage admin access" screen).
-- ----------------------------------------------------------------------------
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from admin_users where user_id = uid);
$$;

-- ----------------------------------------------------------------------------
-- Protect authentication_code from non-admin writes.
-- Non-admin updates silently keep the previous value; everything else on
-- the row is still editable by any signed-in user.
-- ----------------------------------------------------------------------------
create or replace function protect_authentication_code()
returns trigger
language plpgsql
security definer
as $$
begin
  if not is_admin(auth.uid()) then
    new.authentication_code := old.authentication_code;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_auth_code on companies;
create trigger trg_protect_auth_code
  before update on companies
  for each row execute function protect_authentication_code();

-- Also block authentication_code being set on insert by non-admins.
create or replace function protect_authentication_code_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  if not is_admin(auth.uid()) then
    new.authentication_code := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_auth_code_insert on companies;
create trigger trg_protect_auth_code_insert
  before insert on companies
  for each row execute function protect_authentication_code_insert();

-- ----------------------------------------------------------------------------
-- Read-safe view: nulls out authentication_code for non-admins.
-- The app should query this view, not the companies table directly, for
-- any screen a non-admin might see.
-- ----------------------------------------------------------------------------
create or replace view companies_view as
  select
    c.id, c.name, c.previous_names, c.company_number, c.incorporation_date,
    c.registered_office, c.sic_code, c.status, c.utr, c.vat_number,
    case when is_admin(auth.uid()) then c.authentication_code else null end as authentication_code,
    c.vat_stagger, c.year_end_day, c.year_end_month, c.notes, c.created_at
  from companies c;

-- ============================================================================
-- ROW LEVEL SECURITY
-- App is login-gated: any authenticated user can read everything (via the
-- view for companies) and edit most things; only admins manage admin_users
-- and authentication_code (enforced above via trigger, not RLS, since RLS
-- can't do column-level checks).
-- ============================================================================
alter table people enable row level security;
alter table companies enable row level security;
alter table company_officers enable row level security;
alter table company_pscs enable row level security;
alter table company_shareholders enable row level security;
alter table due_dates enable row level security;
alter table admin_users enable row level security;

-- people
create policy "people_select" on people for select to authenticated using (true);
create policy "people_insert" on people for insert to authenticated with check (true);
create policy "people_update" on people for update to authenticated using (true) with check (true);
create policy "people_delete" on people for delete to authenticated using (true);

-- companies (base table — writes allowed to any signed-in user; the trigger
-- above stops non-admins actually changing authentication_code)
create policy "companies_select" on companies for select to authenticated using (true);
create policy "companies_insert" on companies for insert to authenticated with check (true);
create policy "companies_update" on companies for update to authenticated using (true) with check (true);
create policy "companies_delete" on companies for delete to authenticated using (true);

-- officers / pscs / shareholders
create policy "officers_all" on company_officers for all to authenticated using (true) with check (true);
create policy "pscs_all" on company_pscs for all to authenticated using (true) with check (true);
create policy "shareholders_all" on company_shareholders for all to authenticated using (true) with check (true);

-- due_dates
create policy "due_dates_all" on due_dates for all to authenticated using (true) with check (true);

-- admin_users — only admins can see or change the admin list
create policy "admin_users_select" on admin_users for select to authenticated using (is_admin(auth.uid()));
create policy "admin_users_insert" on admin_users for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin_users_delete" on admin_users for delete to authenticated using (is_admin(auth.uid()));

grant select on companies_view to authenticated;

-- ----------------------------------------------------------------------------
-- Admin management RPCs — let the Admin Access screen add/remove admins by
-- email without exposing auth.users to the client directly.
-- ----------------------------------------------------------------------------
create or replace function admin_add_by_email(target_email text)
returns void
language plpgsql
security definer
as $$
declare
  target_id uuid;
begin
  if not is_admin(auth.uid()) then
    raise exception 'Only admins can add admins';
  end if;

  select id into target_id from auth.users where lower(email) = lower(target_email) limit 1;

  if target_id is null then
    raise exception 'No user found with that email — they need a Supabase Auth account first';
  end if;

  insert into admin_users (user_id, email, added_by)
  values (target_id, target_email, auth.uid())
  on conflict (user_id) do nothing;
end;
$$;

create or replace function admin_remove(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not is_admin(auth.uid()) then
    raise exception 'Only admins can remove admins';
  end if;
  delete from admin_users where user_id = target_user_id;
end;
$$;

grant execute on function admin_add_by_email(text) to authenticated;
grant execute on function admin_remove(uuid) to authenticated;
