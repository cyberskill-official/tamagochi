---
fr_id: FR-INFRA-002
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.4/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 7
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.4/10 — comprehensive Colyseus + AWS Singapore + Redis presence scaffold with JWT verification, tenant-id partition, HMAC-signed messages, rate limiting, impossible-state-transition guard, idle disposal, graceful shutdown, healthz/readyz, Terraform IaC, and a custom ESLint rule against `Math.random()` in rooms. Round-1 found three structural gaps (JWKS endpoint outage not handled, presence Redis fallback unclear, tenant-id partition forgotten on new rooms). Round-2 found four refinements (HMAC leak via Sentry breadcrumb, impossible-transition false positives, ALB cookie compatibility with old clients, Redis cluster split-brain). All 7 resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) JWKS endpoint outage breaks all new joins.** Round-1 noted §1.5 verified against Supabase JWKS but did not specify caching or fallback. **RESOLVED §10 row 1** — 10-min TTL cache; fall back to last-known JWKS within the TTL on outage.

- **ISS-002 (warning) Presence Redis quota fallback unspecified.** Round-1 noted §1.4 used Upstash Redis but did not describe behaviour at quota. **RESOLVED §10 row 2** — auto-fallback to in-memory presence (single-instance) + alert `infra.presence.fallback`.

- **ISS-003 (warning) Tenant-id partition enforcement on new room classes.** Round-1 noted §1.6 enforced tenant_id in `_BaseTenantRoom` but did not enforce that new room subclasses actually call into `_BaseTenantRoom.onJoin`. **RESOLVED §10 row 9** — ESLint rule `tenant-id-required-on-room` blocks PR if a Room subclass doesn't extend `_BaseTenantRoom`.

## §3 — Round-2 findings (resolved)

- **ISS-004 (error) HMAC session secret could leak via Sentry breadcrumb.** Round-2 noted §1.16 emits Sentry breadcrumbs on lifecycle but did not scrub session secrets. **RESOLVED §10 row 4** — PII scrubber strips `sessionSecret` field from breadcrumbs; rotate all secrets if detected.

- **ISS-005 (warning) Impossible-transition auto-ban could fire on edge cases.** Round-2 noted §1.9 banned after 3 events without considering legitimate edge cases (e.g. concurrent feed from co-parent). **RESOLVED §10 row 5** — tunable threshold via `limits.yaml`; manual review queue; ban reversible.

- **ISS-006 (warning) ALB sticky-session cookie may not be honoured by old client builds.** Round-2 noted §1.3 used ALB sticky sessions but did not gate this on client version. **RESOLVED §10 row 3** — Cocos client minimum-version gate; force-update flow when bouncing detected.

- **ISS-007 (warning) Redis cluster fail-over split-brain.** Round-2 noted no plan for Upstash regional fail-over splitting presence. **RESOLVED §10 row 10** — auto-rebalance on rejoin + persist last-known-good state to Postgres every 30 s.

## §4 — Strengths preserved

- Defence-in-depth anti-cheat: rate limit + HMAC signature + impossible-transition guard, with metrics for each layer.
- JWT-against-JWKS rather than shared-secret keeps the realtime server's blast radius small.
- Tenant-id partition designed in from day one — B2B in P4 becomes a config, not a refactor.
- `crypto.randomBytes()` for state-affecting RNG enforced via ESLint (FR-LEGAL-002 compliance survives team turnover).
- Terraform IaC + weekly drift detection — no console-edit surprises.
- Graceful shutdown with player-visible warning preserves trust during deploys.
- Health probes (`/healthz` + `/readyz`) distinguish liveness from readiness — ALB integration correct.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. This FR + FR-INFRA-001 + FR-INFRA-003 form the P0 INFRA trio. PetRoom in §6 is the substrate for every state-affecting gameplay FR (FR-CARE-001..005, FR-SOCIAL-001..004, FR-AI-001, FR-VIRAL-002).
