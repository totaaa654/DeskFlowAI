-- Preserve the authority of the original Phase 2 administrator after the
-- four-tier role migration. This runs only when no Super Admin exists.
update public.profiles
set role = 'super_admin'::public.app_role
where id = (
  select id
  from public.profiles
  where role = 'it_admin'::public.app_role
    and status = 'active'::public.account_status
  order by created_at asc
  limit 1
)
and not exists (
  select 1 from public.profiles
  where role = 'super_admin'::public.app_role
);
