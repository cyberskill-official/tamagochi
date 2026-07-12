---
fr_id: FR-PET-001
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.5/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.5/10 — comprehensive pet-entity schema covering Postgres pets table with ULID ids + tenant_id + RLS, Colyseus PetState + PlayerPetsRoster schema, two-step hatch flow with idempotency + HMAC token, content-safety filter with under-13 stricter rules, palette_seed determinism, pet_co_parents prep for P2, audience age inheritance, last_seen_at tracking, name uniqueness within owner, hatch rate-limit, audit logging, cascade delete + tombstone audit. Round-1 found two structural issues (orphan pet_co_parents on cascade, palette_seed pinning client-side). Round-2 found four refinements (moderation vendor outage fallback, hatch-token regenerate path, RLS tenant scope, ULID collision retry).

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Orphan rows in pet_co_parents on cascade.** Round-1 noted §1.7 added a pet_co_parents table but did not assert cascade behaviour. **RESOLVED §3.4 + §10 row 11** — `on delete cascade` on the pet_id FK; daily reconciliation Sentry on remaining orphans.

- **ISS-002 (error) Palette seed could be supplied by client.** Round-1 noted §1.6 said "server-side" but the API contract did not enforce. **RESOLVED AC13** — spec test attempting client-supplied seed asserts it's ignored.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Moderation vendor outage path.** Round-2 noted §1.5 used OpenAI Moderation but did not address outage. **RESOLVED §10 row 3** — fallback to length + blocklist only; Sentry warn.

- **ISS-004 (info) Hatch token regenerate path.** Round-2 noted §1.10 had a 5-min token but did not address expiry mid-naming. **RESOLVED §10 row 2** — regenerate via `/v1/pets/:id/regenerate-name-token`.

- **ISS-005 (warning) RLS tenant scope not asserted.** Round-2 noted §1.19 required tenant partition but the RLS policy in §3.4 didn't include `tenant_id` in the predicate. **RESOLVED §3.4 + AC10** — RLS uses `tenant_id = current_setting('app.tenant_id')` for cross-tenant queries; AC10 tests the path.

- **ISS-006 (info) ULID collision retry.** Round-2 noted §1.2 used ULID but did not specify behaviour on the (astronomically rare) collision. **RESOLVED §10 row 5** — DB unique constraint catches; retry once; surface only on persistent fail.

## §4 — Strengths preserved

- ULID format check at DB layer rejects non-conforming ids — defense in depth beyond app code.
- Two-step hatch (egg + name) preserves the ceremony UX + ties analytics to a confirmed hatch.
- Content-safety has a clear gradient (length → blocklist → vendor moderation → PII-pattern checks for under-13).
- Under-13 PII filters (person-name / phone / URL patterns) preempt COPPA-2025 + PDPL exposure.
- Palette_seed determinism makes every pet visually unique-ish AND reproducible for support tickets.
- pet_co_parents prep table eliminates a future P2 schema migration.
- Idempotency-Key support on hatch prevents flaky-network duplicate pets.
- Unique pet name within owner uses partial-index `where status = 'active'` to allow recreating a name after a tombstone.
- Tenant partition + RLS enforced in migration, not just app code.
- Cascade delete + tombstone audit row satisfies GDPR Article 17 + COPPA-2025 erasure.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. FR-PET-001 is the entity-foundation FR. Next FR on resume is FR-PET-002 (evolution stages).
