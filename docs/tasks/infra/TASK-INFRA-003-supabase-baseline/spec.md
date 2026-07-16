---
id: TASK-INFRA-003
title: "Supabase Postgres + Auth + Storage + Edge Functions baseline (RLS + tenant partition + KMS backups)"
module: INFRA
priority: MUST
status: done
verify: T
phase: P0
milestone: "Foundation Gate"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-LEGAL-001, TASK-INFRA-001, TASK-INFRA-002, TASK-AUTH-001, TASK-AUTH-002, TASK-AUTH-003, TASK-OBS-001, TASK-PET-001, TASK-ECON-001, TASK-B2B-002]
depends_on: [TASK-INFRA-001, TASK-LEGAL-001]
blocks: [TASK-AUTH-001, TASK-AUTH-002, TASK-AUTH-003, TASK-PET-001, TASK-OBS-001, TASK-ECON-001]
effort_hours: 12
new_files:
  - "infra/supabase/standard/config.toml"
  - "infra/supabase/standard/migrations/20260517_000_baseline.sql"
  - "infra/supabase/standard/migrations/20260517_001_rls_templates.sql"
  - "infra/supabase/standard/migrations/20260517_002_tenant_partition.sql"
  - "infra/supabase/standard/migrations/20260517_003_audit_log.sql"
  - "infra/supabase/kids/config.toml"
  - "infra/supabase/kids/migrations/20260517_000_kids_baseline.sql"
  - "infra/supabase/edge-functions/parental-consent-webhook/index.ts"
  - "infra/supabase/edge-functions/breach-draft-flush/index.ts"
  - "infra/supabase/edge-functions/_shared/cors.ts"
  - "infra/supabase/edge-functions/_shared/tenant-resolver.ts"
  - "apps/api/src/supabase/client.ts"
  - "apps/api/src/supabase/__tests__/rls.spec.ts"
  - "apps/api/src/supabase/__tests__/tenant-partition.spec.ts"
  - "scripts/supabase/restore-from-backup.mjs"
  - "scripts/supabase/verify-kms-encryption.mjs"
modified_files:
  - "package.json"
  - "turbo.json"
  - ".github/workflows/supabase-migrate.yml"
allowed_tools:
  - "Supabase 2.x (managed Postgres 15 + Auth + Storage + Edge Functions)"
  - "supabase CLI 1.x (migrations + local dev)"
  - "AWS KMS (BYOK for managed-key encryption — Supabase Pro+ feature)"
  - "pgcrypto extension (column-level encryption for restricted PII)"
  - "Row Level Security (RLS)"
disallowed_tools:
  - "Direct Postgres SUPERUSER credentials in application code (use `anon` + `service_role` only)"
  - "Single Supabase project for both kids and standard SKU (TASK-LEGAL-001 §1.12 forbids commingling)"
  - "Plain text storage of restricted-classification columns (parent_email, persistent device IDs)"
  - "Cross-tenant SELECT without `tenant_id` filter (defence in depth: RLS + WHERE clause)"
  - "Backups stored only in Supabase region without offsite copy"
risk_if_skipped: "Without RLS templates + tenant partition + KMS-encrypted backups + dedicated kids project, the data layer fails COPPA-2025 + PDPL audit on day one; B2B PetOS (TASK-B2B-002) would require a database refactor at P4."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Two Supabase projects.** Per TASK-LEGAL-001 §1.12, the kids SKU and 13+ SKU MUST use **two dedicated Supabase projects**: `tamagochi-standard` and `tamagochi-kids`. Each has its own Postgres instance, Storage bucket, Auth users table, Edge Functions deployment. Cross-project data sharing is forbidden except via the explicit graduation flow (§1.13). Project IDs MUST be recorded in `infra/supabase/standard/config.toml` and `infra/supabase/kids/config.toml`.

§1.2  **Postgres pin.** Both projects MUST run **Postgres 15** managed by Supabase. Version upgrades are deliberate task amendments.

§1.3  **Row Level Security default on.** Every table created in either project MUST have RLS enabled at creation time. A migration-time lint MUST reject `create table` without an accompanying `alter table ... enable row level security`. The template policies (§3.3) MUST cover the four canonical access patterns: `self-only`, `tenant-scoped`, `dpo-only`, `public-read-with-rate-limit`.

§1.4  **Tenant partition column.** Every table that holds player-facing data MUST have a `tenant_id text not null default 'mochi'` column with a `check (tenant_id ~ '^[a-z0-9-]{2,32}$')` constraint. Indexes on player-scoped queries MUST be composite `(tenant_id, ...)`. RLS templates MUST add a `using (tenant_id = current_setting('app.tenant_id'))` clause when applicable.

§1.5  **Tenant-id propagation.** `app.tenant_id` MUST be set on every Postgres connection via `SELECT set_config('app.tenant_id', $1, true)` before any RLS-gated query. The Nest API's Supabase client MUST do this in a request-scoped middleware; the realtime server (TASK-INFRA-002) MUST do it in its Postgres pool's `connect` hook.

§1.6  **Service-role keys never client-side.** The Supabase `service_role` keys MUST be stored only in server-side environment variables (Nest API + realtime server + Edge Functions). They MUST NEVER be embedded in Cocos client bundles. CI MUST grep build outputs for the key prefix and fail-close on detection.

§1.7  **Anon key with RLS-enforced read scope.** The Supabase `anon` key MAY be embedded in the Cocos client and is used by unauthenticated affordances (public drop-rate JSON read per TASK-LEGAL-002, public privacy policy read). RLS templates MUST ensure the `anon` role cannot read any player or parental-consent data.

§1.8  **KMS-encrypted backups.** Supabase Pro plan or higher MUST be selected on both projects to enable AWS KMS BYOK (bring-your-own-key) for backup encryption. The KMS keys MUST live in the CyberSkill AWS account (not Supabase's account), with key-rotation enabled. Monthly backups MUST be exported off-region to AWS S3 Glacier (Singapore primary + Tokyo offsite).

§1.9  **Column-level encryption for restricted PII.** Any column classified `restricted` per AGENTS.md §15 (parent_email, persistent device identifiers, biometric data) MUST be encrypted at rest via `pgcrypto`'s `pgp_sym_encrypt()` with a key sourced from the AWS KMS-resolved Postgres setting. Reads MUST occur only via parameterised functions, not raw column SELECT.

§1.10  **Connection pooling.** Both API + realtime servers MUST connect via Supabase's PgBouncer (transaction pooling mode, port 6543) for non-LISTEN queries, and via direct port 5432 only for `LISTEN/NOTIFY` use cases. Connection limits: api ≤ 25 pooled; realtime ≤ 25 pooled. Pool exhaustion MUST emit `db.pool.exhausted` Sentry event.

§1.11  **Migrations as code.** Every schema change MUST land via a numbered SQL file in `infra/supabase/<project>/migrations/`. Migrations MUST: (a) be idempotent or guarded; (b) include a reverse migration where reversal is feasible; (c) pass a CI dry-run on a fresh Supabase shadow DB; (d) be applied via `supabase db push` in the `supabase-migrate.yml` workflow.

§1.12  **Audit log table.** A `audit_log` table MUST capture every privileged data access: SELECTs of `parental_consent`, `dsr_tickets`, `breach_drafts`, `coppa_age_gate_log` (per TASK-LEGAL-001). Logged columns: `who, when, what_table, what_keys, tenant_id, source_request_id`. Retention 7 years. Read-only after insert.

§1.13  **Graduation flow.** When a child user crosses 13 with parental approval, a one-shot import row MUST be writable from `tamagochi-kids` Postgres → `tamagochi-standard` Postgres via a documented stored procedure pair: `kids.export_graduate(child_id, parent_approval_token)` returns a signed export blob; `standard.import_graduate(blob)` validates the signature and inserts. The flow MUST be the only kids→standard data path; ad-hoc copies are forbidden.

§1.14  **Edge Functions for parental-consent webhook.** A Deno-runtime Edge Function `parental-consent-webhook` MUST accept Safe Harbor vendor callbacks (PRIVO / SuperAwesome kWS per TASK-LEGAL-001 §1.6), verify signature, and update `parental_consent` rows. The function MUST be deployed in the kids project only.

§1.15  **Breach-draft flush Edge Function.** A `breach-draft-flush` Edge Function MUST nightly snapshot the `breach_drafts` table to a regulator-accessible read-only mirror table for audit replay. This satisfies TASK-LEGAL-001 §1.4's 72-hour-window audit requirement.

§1.16  **Storage buckets.** Storage buckets MUST be created with documented policies: `pets/` (avatar + custom-design uploads — public-read-after-moderation), `legal/` (DSR evidence + breach drafts — DPO-only-read), `tenants/<slug>/` (B2B theme assets per TASK-B2B-001 — anon-read-by-slug). Per-bucket file-size limits enforced.

§1.17  **Realtime feature opt-out.** Supabase's built-in Realtime is **disabled by default** — tamagochi uses Colyseus (TASK-INFRA-002) for stateful real-time. Supabase Realtime MAY be enabled per-table for non-state propagation (e.g. tenant-config push to clients) with explicit task amendment.

§1.18  **Test seeding.** `scripts/supabase/seed.mjs` MUST provide reproducible fixtures for local + CI: 5 pets, 2 players, 1 parental-consent row, 1 DSR ticket, 1 audit-log row. Seeds MUST be deterministic (same git rev → same row ids).

§1.19  **CI migrate workflow.** `.github/workflows/supabase-migrate.yml` MUST: (a) on PR open against `main`, run migrations against a shadow Supabase project; (b) run RLS tests + tenant-partition tests; (c) on merge to `main`, apply migrations to staging; (d) require manual approval for production apply.

§1.20  **Restore drill.** A `scripts/supabase/restore-from-backup.mjs` script MUST exist and be tested quarterly via a CI scheduled task that restores a recent backup into a shadow project and asserts schema integrity. Restore RPO ≤ 24h; RTO ≤ 4h.

---

## §2 — Why this design

**Why two Supabase projects.** Plan §PART 8 + TASK-LEGAL-001 §1.12 demand no commingling between kids and standard data. Two projects is the only architecture that survives a COPPA-2025 audit because compliance regimes differ (PII categories, retention, consent flows). The operational cost (~$50/month extra for the kids tier Pro plan) is trivial vs the audit risk.

**Why RLS-default-on and tenant-partition-from-day-one.** Retrofitting RLS to a database after rows exist is a multi-week migration project with downtime risk. Designing it in at scaffold time costs an extra day. Same logic for `tenant_id` — adding it after TASK-PET-001 is shipped means rebuilding every index. B2B (TASK-B2B-002, P4) becomes a config change because the column already exists.

**Why `set_config('app.tenant_id', ...)` rather than baking tenant into queries.** Some endpoints (DPO-only read paths) need to override tenant scope; a session variable lets RLS conditionally relax. Baking it into every query duplicates the constraint and gives developers a foot-gun.

**Why service_role + anon split.** The Supabase model assumes you ship the `anon` key to clients (it has restricted scope per RLS) and keep `service_role` server-only (it bypasses RLS). Mixing them is the most common Supabase footgun; the CI grep guard catches accidental leakage.

**Why KMS BYOK for backups.** Supabase managed backups are AES-256 by default but Supabase holds the key. For Vietnam PDPL cross-border-transfer compliance, holding the key in the CyberSkill AWS account demonstrates "supplementary measures" per Decree 356/2025/ND-CP. Singapore primary + Tokyo offsite is a recognised regional-redundancy pattern that satisfies AWS BAA expectations.

**Why pgcrypto for restricted PII.** Disk encryption (Supabase default) protects against backup-leak. Column-level pgp_sym_encrypt protects against accidental SELECT in a log or replication stream. For parent_email (highest-stakes column under COPPA-2025 — its leak is the breach), column-level is the right layer.

**Why PgBouncer transaction pooling.** Direct connections to Postgres at Supabase's free tier (~60 connections) get exhausted quickly. PgBouncer in transaction mode multiplexes thousands of clients onto dozens of pooled connections. The exceptions (LISTEN/NOTIFY) require direct port 5432 because PgBouncer in transaction mode breaks LISTEN.

**Why an audit_log table even for SELECTs.** Most teams audit only writes. For COPPA + PDPL, *reads* of sensitive data (parental_consent, dsr_tickets) are also audit-relevant — a regulator may ask "who read this child's data on what date." 7-year retention parallels TASK-LEGAL-002 §1.4 receipts.

**Why migrations are gated through PRs.** A schema change is a production-changing operation; running `psql` directly bypasses review. CI shadow-DB apply catches breakage before it hits staging.

**Why a graduation flow rather than copy-paste.** When a child crosses 13, COPPA-2025 prescribes a clear "transition out" procedure. A single signed-blob path makes the transfer auditable (the blob is the evidence); ad-hoc kids→standard SQL would be a regulator-questioned surface.

**Why disable Supabase Realtime by default.** Colyseus is the canonical real-time channel. Two real-time systems doubles the failure modes; using Supabase Realtime for incidental push (tenant-config) is fine, but only with explicit task.

**Why quarterly restore drill.** Backups untested are backups unowned. A scheduled-task restoring a backup quarterly catches subtle breakage (e.g. a Supabase format change) before an actual incident.

---

## §3 — API contract & code shape

### 3.1 — Baseline migration

```sql
-- infra/supabase/standard/migrations/20260517_000_baseline.sql
-- TASK-INFRA-003 §1.2/§1.3/§1.4
create extension if not exists pgcrypto;

-- All tables created hereafter MUST follow the §1.3/§1.4 rules.
-- The first table (`users` extension) demonstrates the shape.

create table public.app_users (
  id            uuid primary key references auth.users(id) on delete cascade,
  tenant_id     text not null default 'mochi'
                check (tenant_id ~ '^[a-z0-9-]{2,32}$'),
  display_name  text not null check (length(display_name) <= 32),
  region_of_record text not null default 'unknown',
  audience_age_gate text not null default '13+' check (audience_age_gate in ('13+', 'under-13')),
  policy_version text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.app_users (tenant_id);
alter table public.app_users enable row level security;
```

### 3.2 — RLS template migration

```sql
-- infra/supabase/standard/migrations/20260517_001_rls_templates.sql
-- §1.3 templates: self-only, tenant-scoped, dpo-only, public-read-with-rate-limit.

-- self-only
create policy "app_users self-only read"
  on public.app_users for select
  using (auth.uid() = id);
create policy "app_users self-only update"
  on public.app_users for update
  using (auth.uid() = id);

-- tenant-scoped read (e.g. pets-of-my-tenant only — used by TASK-PET-001)
-- example application:
-- create policy "pets tenant-scoped read"
--   on public.pets for select
--   using (tenant_id = current_setting('app.tenant_id', true));

-- dpo-only (per TASK-LEGAL-001 §3.4)
-- create role dpo nologin;
-- create policy "parental_consent dpo-only" on public.parental_consent
--   for select using (auth.role() = 'dpo');
```

### 3.3 — Tenant partition migration

```sql
-- infra/supabase/standard/migrations/20260517_002_tenant_partition.sql
create or replace function require_tenant_id() returns trigger as $$
begin
  if new.tenant_id is null or new.tenant_id = '' then
    raise exception 'TASK-INFRA-003 §1.4 — tenant_id is required';
  end if;
  return new;
end;
$$ language plpgsql;

-- Applied per-table via:
-- create trigger trg_require_tenant before insert on public.<table>
--   for each row execute procedure require_tenant_id();
```

### 3.4 — Supabase client wiring (Nest API)

```typescript
// apps/api/src/supabase/client.ts
import { Injectable, Scope } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ scope: Scope.REQUEST })
export class TenantSupabase {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }

  async forTenant(tenantId: string): Promise<SupabaseClient> {
    // Set the session variable so RLS sees the tenant.
    await this.client.rpc('set_app_tenant_id', { _tenant_id: tenantId });
    return this.client;
  }
}
```

### 3.5 — `set_app_tenant_id` RPC

```sql
create or replace function set_app_tenant_id(_tenant_id text)
  returns void security definer language plpgsql as $$
begin
  if _tenant_id !~ '^[a-z0-9-]{2,32}$' then
    raise exception 'invalid tenant_id';
  end if;
  perform set_config('app.tenant_id', _tenant_id, true);
end;
$$;
```

---

## §4 — Acceptance criteria

**AC1.** Two Supabase projects exist: `tamagochi-standard` and `tamagochi-kids`. Project IDs recorded in `infra/supabase/<sku>/config.toml`. Verified by reading the toml file in `__tests__/projects.spec.ts`.

**AC2.** Every table in either project has RLS enabled. Verified by a SQL test: `select count(*) from pg_tables join pg_class on ... where rowsecurity = false and schemaname = 'public'` returns 0.

**AC3.** Every player-facing table has a `tenant_id` column with the documented check constraint. Verified by `__tests__/tenant-partition.spec.ts` querying `information_schema.columns`.

**AC4.** `app.tenant_id` is set on every request-scoped Supabase client + every realtime-server Postgres connection. Verified by `__tests__/rls.spec.ts` asserting that without setting it, RLS-gated queries return 0 rows.

**AC5.** A CI grep over Cocos build output (`apps/cocos/build/**`) finds zero occurrences of the `service_role` key prefix. Wired into `.github/workflows/cocos-build.yml`.

**AC6.** AWS KMS BYOK is configured on both projects. Verified by `scripts/supabase/verify-kms-encryption.mjs` calling the Supabase Management API + AWS KMS DescribeKey.

**AC7.** Restricted-PII columns (parent_email, etc.) are pgcrypto-encrypted. Verified by `__tests__/restricted-pii.spec.ts` asserting raw SELECT returns ciphertext + the parameterised function returns plaintext.

**AC8.** PgBouncer transaction pooling configured; connection limits enforced. Verified by `__tests__/connection-pool.spec.ts` exhausting the pool and asserting the `db.pool.exhausted` Sentry event.

**AC9.** Audit log records every SELECT on the sensitive tables. Verified by `__tests__/audit-log.spec.ts` performing reads + asserting rows appear.

**AC10.** Graduation flow signed-blob round-trips: `kids.export_graduate` → `standard.import_graduate` succeeds on a valid token; fails on invalid signature. Verified by `__tests__/graduation.spec.ts`.

**AC11.** CI migrate workflow runs migrations on shadow DB on every PR; production apply requires manual approval. Verified by inspecting the workflow YAML.

**AC12.** Quarterly restore drill scheduled task fires and restores a recent backup into a shadow project. Verified by inspecting the scheduled-task list.

---

## §5 — Verification

### 5.1 — RLS test

```typescript
// apps/api/src/supabase/__tests__/rls.spec.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('TASK-INFRA-003 — RLS', () => {
  const anon = createClient(URL, ANON_KEY);

  it('anon cannot read another user\'s row', async () => {
    const { data } = await anon.from('app_users').select('*').eq('id', OTHER_USER_ID);
    expect(data?.length ?? 0).toBe(0);
  });

  it('service_role with tenant_id set respects tenant scope', async () => {
    const svc = createClient(URL, SERVICE_KEY);
    await svc.rpc('set_app_tenant_id', { _tenant_id: 'techcombank' });
    const { data } = await svc.from('app_users').select('*').eq('tenant_id', 'mochi');
    expect(data?.length ?? 0).toBe(0);  // no Mochi tenant rows visible
  });
});
```

### 5.2 — Tenant partition test

```typescript
// apps/api/src/supabase/__tests__/tenant-partition.spec.ts
import { describe, it, expect } from 'vitest';
import { Pool } from 'pg';

describe('TASK-INFRA-003 §1.4 — tenant partition', () => {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

  it('every public table has tenant_id column', async () => {
    const { rows } = await pool.query(`
      select t.table_name
      from information_schema.tables t
      left join information_schema.columns c
        on c.table_name = t.table_name and c.column_name = 'tenant_id'
      where t.table_schema = 'public' and c.column_name is null
        and t.table_name not in ('schema_migrations','audit_log')
    `);
    expect(rows).toEqual([]);
  });

  it('rejects inserts with empty tenant_id', async () => {
    await expect(pool.query(`insert into app_users (id, tenant_id, display_name, policy_version) values (gen_random_uuid(), '', 'x', 'v1')`))
      .rejects.toThrow(/tenant_id/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// infra/supabase/edge-functions/parental-consent-webhook/index.ts
// Deno runtime. Receives Safe Harbor vendor webhook → updates parental_consent row.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyVendorSignature } from '../_shared/vendor-signature.ts';

Deno.serve(async (req) => {
  const sig = req.headers.get('x-vendor-signature') ?? '';
  const body = await req.text();
  if (!verifyVendorSignature(body, sig, Deno.env.get('VENDOR_HMAC_SECRET')!)) {
    return new Response('invalid signature', { status: 401 });
  }
  const payload = JSON.parse(body) as {
    child_id: string; consent_state: 'granted' | 'revoked'; evidence_url: string;
  };
  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error } = await supa.from('parental_consent').update({
    consent_state: payload.consent_state,
    evidence_blob_url: payload.evidence_url,
    granted_at: payload.consent_state === 'granted' ? new Date().toISOString() : null,
    revoked_at: payload.consent_state === 'revoked' ? new Date().toISOString() : null,
  }).eq('child_id', payload.child_id);
  if (error) return new Response(error.message, { status: 500 });
  return new Response('ok');
});
```

---

## §7 — Dependencies

**External:** Supabase Pro plan on both projects (BYOK + multiple Edge Functions + paid). AWS KMS in CyberSkill account (Singapore primary + Tokyo offsite). AWS S3 Glacier for off-region monthly backups. supabase CLI for migrations.

**Internal:**
- TASK-INFRA-001 (TurboRepo workspace exists).
- TASK-LEGAL-001 (DPO + Safe Harbor + audit tables drive the schema).

**Blocks:** TASK-AUTH-001, TASK-AUTH-002, TASK-AUTH-003, TASK-PET-001 (pets table), TASK-OBS-001 (analytics tables), TASK-ECON-001 (currency ledger), TASK-B2B-002 (tenant partition consumer).

---

## §8 — Example payloads

### 8.1 — `set_app_tenant_id` invocation

```sql
select set_app_tenant_id('mochi');
-- subsequent queries within same connection see RLS tenant scope
select * from public.app_users;
```

### 8.2 — Restricted-PII column write

```sql
-- parental_consent.parent_email_hash is sha256 (cheap lookup).
-- The actual parent email is stored encrypted in a sibling table.
insert into parental_consent_pii (child_id, parent_email_encrypted)
values ('01HC7...', pgp_sym_encrypt('parent@example.com', current_setting('app.pii_key')));
```

### 8.3 — Graduation export blob

```json
{
  "blob_version": "1",
  "child_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "parent_approval_token": "kws_evidence_abc123",
  "graduated_at": "2026-08-12T14:36:01Z",
  "blob_hmac": "9b3e7d2a5c4f1b8e6d3a2c9f7b5d3a1c9e1f8b6d4c2a3e5f9b7d5a3c1e9f7b5d",
  "carry_forward": {
    "display_name": "Mochi-fan",
    "owned_pets": ["01HC7QG..."],
    "soft_currency_balance": 1450
  }
}
```

### 8.4 — Migration CI workflow excerpt

```yaml
# .github/workflows/supabase-migrate.yml
name: supabase migrate
on:
  pull_request: { paths: ['infra/supabase/**'] }
jobs:
  shadow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --project-ref ${{ vars.SHADOW_PROJECT_REF }}
      - run: pnpm test --filter @cyberskill/api -- rls.spec.ts tenant-partition.spec.ts
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Single project with schema-per-SKU vs two projects? → §1.1 + §2 — two projects (audit-friendly).
- **OQ-2 (resolved):** Why pin Postgres 15 and not 16? → §1.2 — Supabase managed track; 15 is the LTS at scaffold time.
- **OQ-3 (resolved):** PgBouncer transaction mode vs session mode? → §1.10 + §2 — transaction for general queries, direct port for LISTEN.
- **OQ-4 (resolved):** Where to host the KMS key? → §1.8 — CyberSkill AWS account; Supabase project never holds the key directly.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | RLS forgotten on a new table | Schema lint `rls-required` blocks PR | PR blocked | Add `enable row level security` + policy; re-PR |
| 2 | tenant_id column forgotten on a new table | Schema lint `tenant-id-required` blocks PR | PR blocked | Add column + index + RLS clause; re-PR |
| 3 | `app.tenant_id` not set on a request | RLS returns 0 rows surfacing as "no data" UX | API returns empty | Middleware fix; integration test added |
| 4 | service_role key leaks into Cocos bundle | CI grep | Build blocked | Remove key; rotate it; CI test re-runs |
| 5 | KMS key rotation breaks backup decryption | Restore drill fails | Backup unreadable | Keep prior-key overlap window during rotation; documented restore procedure |
| 6 | PgBouncer pool exhausted | `db.pool.exhausted` Sentry alert | API 5xx | Increase pool; investigate leaking connections (long-running tx) |
| 7 | Migration fails on shadow DB | CI step exit non-zero | PR blocked | Fix migration; re-PR |
| 8 | Supabase Pro plan downgraded by mistake → BYOK lost | Monthly billing review + Supabase API check | Backups unencrypted under our key | Restore plan; cycle KMS encryption |
| 9 | Graduation flow signed-blob signature divergence | Import fails | Child stuck mid-graduation | Manual DPO intervention; signature debugging |
| 10 | Restore drill fails | Scheduled task alerts | Backup confidence drops | Investigate backup format / Supabase upgrade; restore RPO/RTO commitment revisited |
| 11 | pgcrypto key rotation forgotten | Annual security audit catches stale ciphertext | Restricted PII at risk | Re-encrypt rows with new key during low-traffic window |
| 12 | Supabase Realtime accidentally enabled on a sensitive table | Code review + audit | Push to clients leaks data | Disable per-table; review which tables opted in |

---

## §11 — Notes

**Plan refs:** plan §PART 4 — Supabase reasoning (open-source, self-hostable fallback, generous free tier, Postgres + RLS); plan §PART 4 anti-cheat (server-authoritative); plan §PART 8 (PDPL + COPPA-2025 + cross-border-transfer compliance).

**Sub-decisions punted to ops:**
- Specific Supabase project regions — Standard project: US-East; Kids project: US-West for COPPA assurance. Singapore primary for cross-border-TIA proof + Tokyo offsite. Locked in `config.toml`.
- Specific KMS key alias name — `cyberskill/tamagochi-backup` for standard, `cyberskill/tamagochi-kids-backup` for kids.
- Quarterly restore-drill calendar — owned by DPO.

**Anti-patterns explicitly forbidden:**
- `service_role` key in client code.
- Disabling RLS for a "temporary" backfill (always use service_role server-side instead).
- Querying without `set_app_tenant_id` from a tenant-aware endpoint.
- Plain-text storage of `parent_email`.
- Cross-project SELECT bypassing the graduation flow.
- Supabase Realtime on a sensitive table without task amendment.

**Cross-reference:** This task completes the P0 INFRA trio (INFRA-001 + 002 + 003) and unblocks AUTH (which depends on Supabase Auth) + every gameplay task that persists state.
