---
fr_id: TASK-INFRA-003
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.5/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 7
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.5/10 — a thorough Supabase scaffold covering two projects (kids + standard), Postgres 15 pin, RLS default-on, tenant_id partition column, `app.tenant_id` propagation via `set_config`, service_role/anon split with CI grep, KMS BYOK backups + offsite, pgcrypto column-level encryption for restricted PII, PgBouncer transaction pooling, migrations as code, audit log table, graduation flow, Edge Functions for consent webhook + breach flush, storage buckets, Supabase Realtime opt-out, deterministic seeds, CI migrate workflow, and quarterly restore drill. Round-1 found three gaps (KMS key rotation overlap, pgcrypto key rotation, schema-lint enforcement not in CI). Round-2 found four refinements (audit log read-only enforcement, restricted-PII parameterised reads, pool-exhaustion recovery, graduation signature divergence). All 7 resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) KMS key rotation breaks backup decryption.** Round-1 noted §1.8 mandated KMS BYOK but did not address the rotation case where a backup was encrypted under the prior key. **RESOLVED §10 row 5** — overlap window during rotation + documented restore procedure.

- **ISS-002 (warning) pgcrypto key rotation forgotten.** Round-1 noted §1.9 used pgcrypto but did not require key rotation. **RESOLVED §10 row 11** — annual key rotation with re-encryption window.

- **ISS-003 (warning) Schema-lint enforcement not in CI.** Round-1 noted §1.3 mandated RLS default-on but the lint rule was not wired in CI. **RESOLVED AC2 + §10 rows 1/2** — schema lint rules `rls-required` and `tenant-id-required` block PRs.

## §3 — Round-2 findings (resolved)

- **ISS-004 (warning) Audit log read-only not enforced.** Round-2 noted §1.12 said "read-only after insert" but did not enforce it at DB level. **RESOLVED §3** (implicit in migration template) — `audit_log` table has only `insert` permission for non-DPO roles via RLS policy; deletes/updates forbidden via `revoke update, delete from public.audit_log`.

- **ISS-005 (warning) Restricted-PII parameterised reads ambiguity.** Round-2 noted §1.9 said "reads via parameterised functions" but did not name them. **RESOLVED §8.2 + §3** — `pgp_sym_decrypt()` wrapped in security-definer functions, named explicitly (e.g. `parental_consent_pii.read_parent_email(child_id)`).

- **ISS-006 (warning) Pool-exhaustion recovery path.** Round-2 noted §1.10 emitted an alert on pool-exhaustion but did not say what auto-recovery occurs. **RESOLVED §10 row 6** — increase pool + investigate leaking long-running tx.

- **ISS-007 (warning) Graduation signature divergence handling.** Round-2 noted §1.13 mentioned signed blob but did not address signature mismatch (e.g. HMAC key rotation between projects). **RESOLVED §10 row 9** — manual DPO intervention path + signature-debugging surface.

## §4 — Strengths preserved

- Two-project isolation is unambiguous: kids and standard never share a database.
- RLS + tenant partition designed in from migration 000 — no retrofitting risk.
- service_role / anon discipline backed by CI grep — accidental client-side leak caught at build time.
- KMS BYOK + Singapore + Tokyo offsite satisfies Vietnam PDPL Decree 356/2025 cross-border-transfer "supplementary measures" requirement.
- Column-level pgcrypto for `restricted` PII layered on top of disk encryption.
- Audit log captures SELECTs, not just writes — COPPA + PDPL audit-ready.
- Graduation flow is the only kids→standard data path — auditable + signature-verifiable.
- Quarterly restore drill prevents "backups untested" pathology.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. This task completes the P0 INFRA trio. Combined with INFRA-001 (Cocos) + INFRA-002 (Colyseus), the project has a reproducible, COPPA + PDPL-compliant, tenant-partitioned foundation. AUTH tasks (001/002/003) can now proceed.
