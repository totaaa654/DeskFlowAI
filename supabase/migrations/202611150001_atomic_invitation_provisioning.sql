-- Provision the invited profile and bind its tracked invitation in one
-- database transaction. Only the service role may call this function.
create or replace function public.provision_invited_user(
  p_invitation_id uuid,
  p_auth_user_id uuid,
  p_email text,
  p_full_name text,
  p_role public.app_role,
  p_department text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.user_invitations as invitation
    where invitation.id = p_invitation_id
      and invitation.status = 'pending'::public.invitation_status
      and lower(invitation.email) = lower(trim(p_email))
      and invitation.full_name = trim(p_full_name)
      and invitation.intended_role = p_role
      and invitation.department is not distinct from nullif(trim(p_department), '')
      and invitation.expires_at > now()
  ) then
    raise exception 'Invitation intent is missing, expired, or does not match.'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (
    id, email, full_name, role, status, department
  ) values (
    p_auth_user_id,
    lower(trim(p_email)),
    trim(p_full_name),
    p_role,
    'invited'::public.account_status,
    nullif(trim(p_department), '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      status = excluded.status,
      department = excluded.department;

  update public.user_invitations
  set auth_user_id = p_auth_user_id
  where id = p_invitation_id
    and status = 'pending'::public.invitation_status;

  if not found then
    raise exception 'Invitation could not be bound to the Auth user.'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.provision_invited_user(
  uuid, uuid, text, text, public.app_role, text
) from public, anon, authenticated;
grant execute on function public.provision_invited_user(
  uuid, uuid, text, text, public.app_role, text
) to service_role;

comment on function public.provision_invited_user(
  uuid, uuid, text, text, public.app_role, text
) is 'Atomically provisions an invited profile from server-stored invitation intent; service role only.';
