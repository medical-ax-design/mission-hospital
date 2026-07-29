create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.user_role as enum ('ADMIN', 'STAFF', 'PATIENT');
create type public.procedure_type as enum ('EXAM', 'SURGERY');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id),
  organization_id uuid not null references public.organizations(id),
  role public.user_role not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.procedure_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  procedure_type public.procedure_type not null,
  name text not null,
  normalized_name text not null,
  external_code text,
  department text not null,
  description text,
  is_active boolean not null default true,
  row_version integer not null default 1,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint procedure_name_not_blank check (length(trim(name)) > 0),
  constraint procedure_department_not_blank
    check (length(trim(department)) > 0)
);

create unique index procedure_external_code_unique
  on public.procedure_catalog (organization_id, external_code)
  where external_code is not null;

create index procedure_name_trgm_idx
  on public.procedure_catalog
  using gin (normalized_name gin_trgm_ops);

create index procedure_department_idx
  on public.procedure_catalog (organization_id, department)
  where is_active = true;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.procedure_catalog enable row level security;

create policy organization_self_access
on public.organizations
using (
  id = current_setting('app.organization_id', true)::uuid
)
with check (
  id = current_setting('app.organization_id', true)::uuid
);

create policy profile_organization_isolation
on public.profiles
using (
  organization_id = current_setting('app.organization_id', true)::uuid
)
with check (
  organization_id = current_setting('app.organization_id', true)::uuid
);

create policy procedure_organization_isolation
on public.procedure_catalog
using (
  organization_id = current_setting('app.organization_id', true)::uuid
)
with check (
  organization_id = current_setting('app.organization_id', true)::uuid
);
