-- Run this in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'sa',
  regions text[] not null default '{}',
  solutions text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists solutions text[] not null default '{}';
alter table public.profiles alter column role set default 'sa';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'sales', 'sa', 'member'));

create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact text not null,
  phone text not null default '',
  region text not null,
  source text not null default '웹사이트',
  status text not null default 'new' check (status in ('new', 'contacted', 'proposal', 'won', 'lost')),
  note text not null default '',
  assignee uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_leads_assignee_status_idx on public.sales_leads (assignee, status);
create index if not exists sales_leads_created_at_idx on public.sales_leads (created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists sales_leads_set_updated_at on public.sales_leads;
create trigger sales_leads_set_updated_at before update on public.sales_leads
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
create or replace function public.is_sales()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'sales');
$$;

alter table public.profiles enable row level security;
alter table public.sales_leads enable row level security;

drop policy if exists "Signed in users can see team profiles" on public.profiles;
create policy "Signed in users can see team profiles" on public.profiles
  for select to authenticated using (true);
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "SA update own profile" on public.profiles;
create policy "SA update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and role in ('sa', 'member'))
  with check (id = (select auth.uid()) and role in ('sa', 'member'));

drop policy if exists "Members see assigned leads; admins see all" on public.sales_leads;
drop policy if exists "Team sees submitted and assigned leads" on public.sales_leads;
create policy "Team sees submitted and assigned leads" on public.sales_leads
  for select to authenticated using (assignee = (select auth.uid()) or created_by = (select auth.uid()) or public.is_admin());
drop policy if exists "Admins create leads" on public.sales_leads;
drop policy if exists "Sales and admins create leads" on public.sales_leads;
create policy "Sales and admins create leads" on public.sales_leads
  for insert to authenticated with check (public.is_admin() or (public.is_sales() and created_by = (select auth.uid())));
drop policy if exists "Admins update leads; assignees update their own" on public.sales_leads;
drop policy if exists "Team updates submitted or assigned leads" on public.sales_leads;
create policy "Team updates submitted or assigned leads" on public.sales_leads
  for update to authenticated using (assignee = (select auth.uid()) or created_by = (select auth.uid()) or public.is_admin())
  with check (assignee = (select auth.uid()) or created_by = (select auth.uid()) or public.is_admin());
drop policy if exists "Admins delete leads" on public.sales_leads;
create policy "Admins delete leads" on public.sales_leads
  for delete to authenticated using (public.is_admin());

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.sales_leads to authenticated;

-- Create team members under Authentication > Users first. For each Auth user, add
-- exactly one profile row in the Table Editor. Example template:
-- insert into public.profiles (id, full_name, role, regions)
-- values
--   ('AUTH_USER_UUID', '정가영', 'sales', '{}'),
--   ('ANOTHER_AUTH_USER_UUID', '박지호', 'sa', array['강북','인천']);
