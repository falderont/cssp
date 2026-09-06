-- FORCE ROW LEVEL SECURITY also restricts the table *owner* (`cssp`), which is
-- the role `prisma migrate` and the seed script run as — that's not what we want.
-- Standard practice (and what Supabase et al. document for service-role vs. a
-- restricted app role) is: the owner/migration role bypasses RLS entirely, and
-- isolation is enforced only for the non-owner runtime role. `cssp_app` has no
-- BYPASSRLS and is not an owner, so it remains fully subject to every policy
-- below regardless of FORCE — dropping FORCE only restores the owner's normal
-- bypass, it does not weaken isolation for the application.

ALTER TABLE organizations NO FORCE ROW LEVEL SECURITY;
ALTER TABLE regions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE facilities NO FORCE ROW LEVEL SECURITY;
ALTER TABLE buildings NO FORCE ROW LEVEL SECURITY;
ALTER TABLE enterprise_accounts NO FORCE ROW LEVEL SECURITY;
ALTER TABLE site_enrollments NO FORCE ROW LEVEL SECURITY;
ALTER TABLE users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE visitors NO FORCE ROW LEVEL SECURITY;
ALTER TABLE incidents_and_maintenance NO FORCE ROW LEVEL SECURITY;
ALTER TABLE documents NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tickets NO FORCE ROW LEVEL SECURITY;
ALTER TABLE remote_hands_tasks NO FORCE ROW LEVEL SECURITY;
ALTER TABLE engagement_logs NO FORCE ROW LEVEL SECURITY;
ALTER TABLE invoices NO FORCE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items NO FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_telemetry_readings NO FORCE ROW LEVEL SECURITY;
ALTER TABLE integration_configs NO FORCE ROW LEVEL SECURITY;
