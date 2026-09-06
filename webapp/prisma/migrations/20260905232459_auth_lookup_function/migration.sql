-- Login has a chicken-and-egg problem under RLS: `cssp_app` can only read a
-- table once `app.organization_id` is set (see prisma/rls.sql), but at login
-- time we don't know which organization the email belongs to yet — that's
-- exactly what this lookup is for. Rather than weaken the `users` RLS policy
-- (which would mean *any* unscoped query could list every tenant's users), we
-- expose one narrow, parameterized, SECURITY DEFINER function: it runs with
-- the owner's (`cssp`) privileges, so it bypasses RLS same as the owner does,
-- but the only thing `cssp_app` can do with that bypass is fetch the single
-- row matching one exact email — never a listing, never a filter Postgres
-- didn't write itself.
CREATE FUNCTION auth_lookup_user(p_email text)
RETURNS TABLE (
  id text,
  organization_id text,
  password_hash text,
  role text,
  name text,
  email text,
  enterprise_account_id text,
  site_enrollment_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, "organizationId", "passwordHash", role::text, name, email, "enterpriseAccountId", "siteEnrollmentId"
  FROM users
  WHERE email = p_email;
$$;

GRANT EXECUTE ON FUNCTION auth_lookup_user(text) TO cssp_app;
