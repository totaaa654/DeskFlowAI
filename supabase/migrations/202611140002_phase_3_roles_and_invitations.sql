-- DeskFlow AI Phase 3: four-tier administration and tracked invitations.
-- This migration upgrades the Phase 2 `admin` role to `it_admin` without
-- allowing clients to write authorization data.

drop policy if exists "profiles_select_self_or_active_admin" on public.profiles;
drop policy if exists "active_admins_read_account_audit" on public.account_admin_audit;
drop function if exists private.current_user_is_active_admin();

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

alter table public.profiles alter column role drop default;
alter type public.app_role rename to app_role_phase2;
create type public.app_role as enum ('employee', 'technician', 'it_admin', 'super_admin');
alter table public.profiles
  alter column role type public.app_role
  using (
    case role::text
      when 'admin' then 'it_admin'
      else role::text
    end
  )::public.app_role;
alter table public.profiles alter column role set default 'employee'::public.app_role;
drop type public.app_role_phase2;

alter table public.profiles
  add column department text,
  add constraint profiles_department_length check (department is null or length(department) <= 120);

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  full_name text not null default '',
  intended_role public.app_role not null,
  department text,
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_email_not_blank check (length(trim(email)) > 3),
  constraint invitations_name_length check (length(full_name) <= 160),
  constraint invitations_department_length check (department is null or length(department) <= 120)
);

create unique index user_invitations_open_email_idx
  on public.user_invitations (lower(email))
  where status = 'pending';
create index user_invitations_status_idx on public.user_invitations (status, created_at desc);

alter table public.user_invitations enable row level security;
revoke all on public.user_invitations from anon, authenticated;
grant select on public.user_invitations to authenticated;

create or replace function private.current_user_is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('it_admin'::public.app_role, 'super_admin'::public.app_role)
      and status = 'active'::public.account_status
  );
$$;

revoke all on function private.current_user_is_active_admin() from public, anon;
grant execute on function private.current_user_is_active_admin() to authenticated;

create policy "profiles_select_self_or_active_admin"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.current_user_is_active_admin()));

create policy "active_admins_read_account_audit"
on public.account_admin_audit for select to authenticated
using ((select private.current_user_is_active_admin()));

create policy "active_admins_read_invitations"
on public.user_invitations for select to authenticated
using ((select private.current_user_is_active_admin()));

drop trigger if exists user_invitations_set_updated_at on public.user_invitations;
create trigger user_invitations_set_updated_at
before update on public.user_invitations
for each row execute function private.set_updated_at();

alter table public.account_admin_audit drop constraint if exists account_admin_audit_action_check;
alter table public.account_admin_audit
  add constraint account_admin_audit_action_check
  check (action in ('invite', 'invite_resend', 'invite_revoke', 'role_change', 'status_change'));
alter table public.account_admin_audit drop constraint if exists account_admin_audit_target_id_fkey;
alter table public.account_admin_audit alter column target_id drop not null;
alter table public.account_admin_audit
  add constraint account_admin_audit_target_id_fkey
  foreign key (target_id) references auth.users(id) on delete set null;

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
  activated boolean := false;
begin
  -- Expired invitations can never activate an account.
  update public.user_invitations
  set status = 'expired'::public.invitation_status
  where auth_user_id = (select auth.uid())
    and status = 'pending'::public.invitation_status
    and expires_at <= now();

  update public.profiles as profile
  set status = 'active'::public.account_status
  where profile.id = (select auth.uid())
    and profile.status = 'invited'::public.account_status
    and exists (
      select 1 from auth.users as auth_user
      where auth_user.id = (select auth.uid())
        and auth_user.email_confirmed_at is not null
    )
    and exists (
      select 1 from public.user_invitations as invitation
      where invitation.auth_user_id = (select auth.uid())
        and invitation.status = 'pending'::public.invitation_status
        and invitation.expires_at > now()
        and invitation.intended_role = profile.role
    );

  activated := found;
  if activated then
    update public.user_invitations
    set status = 'accepted'::public.invitation_status,
        accepted_at = now()
    where auth_user_id = (select auth.uid())
      and status = 'pending'::public.invitation_status;
  end if;
  return activated;
end;
$$;

revoke all on function public.activate_my_invitation() from public, anon;
grant execute on function public.activate_my_invitation() to authenticated;

comment on column public.profiles.role is 'Assigned only by trusted administration; clients cannot self-promote.';
comment on table public.user_invitations is 'Server-managed invitation intent and lifecycle tracking.';
