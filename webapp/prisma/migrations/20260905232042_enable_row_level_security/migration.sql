-- Multi-tenant isolation, enforced by Postgres itself (docs/prd-v3.md Section 3:
-- "enforce isolation at the database layer, not just in application code").
--
-- The `cssp` role (owner, used only for `prisma migrate`/`prisma db seed`) bypasses
-- RLS as table owner — that's expected and fine, since nothing serving a live
-- request ever connects as `cssp`. The application (lib/db.ts) always connects as
-- `cssp_app`, a non-owner role with no BYPASSRLS, so every one of these policies
-- actually applies to every query the running app makes. Session-scoped
-- `app.organization_id` is set per-request by lib/tenant.ts via `SET LOCAL` inside
-- a transaction — if it's never set, `current_setting(..., true)` returns NULL and
-- every policy below denies all rows, which is the correct fail-closed default.

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON organizations
  USING (id::text = current_setting('app.organization_id', true))
  WITH CHECK (id::text = current_setting('app.organization_id', true));

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON regions
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON facilities
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON buildings
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE enterprise_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_accounts FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON enterprise_accounts
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE site_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_enrollments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON site_enrollments
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON visitors
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE incidents_and_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents_and_maintenance FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON incidents_and_maintenance
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON documents
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tickets
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE remote_hands_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE remote_hands_tasks FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON remote_hands_tasks
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE engagement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON engagement_logs
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoice_line_items
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE bms_telemetry_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_telemetry_readings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON bms_telemetry_readings
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON integration_configs
  USING ("organizationId"::text = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId"::text = current_setting('app.organization_id', true));
