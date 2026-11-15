-- Reflect Supabase Auth email confirmation in the server-managed invitation
-- lifecycle. Password creation remains a separate step that activates the
-- profile; accepting an email link alone never grants application access.

create or replace function private.mark_invitation_email_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.user_invitations
    set status = 'accepted'::public.invitation_status,
        accepted_at = coalesce(accepted_at, now())
    where auth_user_id = new.id
      and status = 'pending'::public.invitation_status
      and expires_at > now();
  end if;

  return new;
end;
$$;

revoke all on function private.mark_invitation_email_accepted() from public, anon, authenticated;

drop trigger if exists auth_user_invitation_email_accepted on auth.users;
create trigger auth_user_invitation_email_accepted
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function private.mark_invitation_email_accepted();

-- Backfill invitations whose confirmation link was accepted before this
-- trigger existed, including the currently affected invitation.
update public.user_invitations as invitation
set status = 'accepted'::public.invitation_status,
    accepted_at = coalesce(invitation.accepted_at, auth_user.email_confirmed_at, now())
from auth.users as auth_user
where invitation.auth_user_id = auth_user.id
  and invitation.status = 'pending'::public.invitation_status
  and invitation.expires_at > now()
  and auth_user.email_confirmed_at is not null;

create or replace function public.activate_my_invitation()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  activated boolean := false;
begin
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
        and invitation.status in (
          'pending'::public.invitation_status,
          'accepted'::public.invitation_status
        )
        and invitation.expires_at > now()
        and invitation.intended_role = profile.role
    );

  activated := found;
  if activated then
    update public.user_invitations
    set status = 'accepted'::public.invitation_status,
        accepted_at = coalesce(accepted_at, now())
    where auth_user_id = (select auth.uid())
      and status in (
        'pending'::public.invitation_status,
        'accepted'::public.invitation_status
      );
  end if;

  return activated;
end;
$$;

revoke all on function public.activate_my_invitation() from public, anon;
grant execute on function public.activate_my_invitation() to authenticated;

comment on function private.mark_invitation_email_accepted() is
  'Marks a tracked invitation accepted when Supabase Auth confirms its email; does not activate the profile.';
