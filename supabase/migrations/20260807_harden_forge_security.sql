-- FORGE production hardening.
-- The RLS auto-enable event-trigger function should not be callable through
-- the exposed API by anonymous or normal authenticated users.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

grant execute on function public.rls_auto_enable() to postgres;
grant execute on function public.rls_auto_enable() to service_role;
