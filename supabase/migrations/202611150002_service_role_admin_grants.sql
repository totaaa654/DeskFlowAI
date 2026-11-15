-- RLS bypass does not replace PostgreSQL table privileges. Grant only the
-- trusted server role the writes needed by the admin-users Edge Function.
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.user_invitations to service_role;
grant select, insert on table public.account_admin_audit to service_role;

-- account_admin_audit uses an identity sequence.
grant usage, select on sequence public.account_admin_audit_id_seq to service_role;

comment on table public.user_invitations is
  'Server-managed invitation intent and lifecycle tracking; authenticated clients have read-only administrator RLS access.';
