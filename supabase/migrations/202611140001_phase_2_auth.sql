-- DeskFlow AI Phase 2: authentication profiles and database authorization.
-- Public sign-ups must also be disabled in Supabase Auth settings. Accounts are
-- provisioned by the admin-users Edge Function and begin with a safe role.

create type public.app_role as enum ('employee', 'technician', 'admin');
create type public.account_status as enum ('pending', 'invited', 'active', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null default 'employee',
  status public.account_status not null default 'pending',
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (length(trim(email)) > 3),
  constraint profiles_name_length check (length(full_name) <= 160)
);

create unique index profiles_email_unique_idx on public.profiles (lower(email));
create index profiles_role_status_idx on public.profiles (role, status);

create table public.account_admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  target_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('invite', 'role_change', 'status_change')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index account_admin_audit_actor_idx on public.account_admin_audit (actor_id, created_at desc);
create index account_admin_audit_target_idx on public.account_admin_audit (target_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.account_admin_audit enable row level security;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_user_is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'::public.app_role
      and status = 'active'::public.account_status
  );
$$;

revoke all on function private.current_user_is_active_admin() from public, anon;
grant execute on function private.current_user_is_active_admin() to authenticated;

create policy "profiles_select_self_or_active_admin"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_is_active_admin())
);

-- The table grant below limits self-service changes to full_name. Even if a
-- client crafts its own request, role and status columns remain non-writable.
create policy "profiles_update_own_name"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "active_admins_read_account_audit"
on public.account_admin_audit for select
to authenticated
using ((select private.current_user_is_active_admin()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

revoke all on public.account_admin_audit from anon, authenticated;
grant select on public.account_admin_audit to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'employee'::public.app_role,
    'pending'::public.account_status
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.activate_my_invitation()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  activated boolean;
begin
  update public.profiles as profile
  set status = 'active'::public.account_status
  where profile.id = (select auth.uid())
    and profile.status = 'invited'::public.account_status
    and exists (
      select 1 from auth.users as auth_user
      where auth_user.id = (select auth.uid())
        and auth_user.email_confirmed_at is not null
    );
  activated := found;
  return activated;
end;
$$;

revoke all on function public.activate_my_invitation() from public, anon;
grant execute on function public.activate_my_invitation() to authenticated;

comment on table public.profiles is 'Application authorization profile linked one-to-one with auth.users.';
comment on column public.profiles.role is 'Managed only by the trusted admin-users function; never writable by clients.';
comment on column public.profiles.status is 'Managed by trusted administration, except one-way invited-to-active self activation.';
