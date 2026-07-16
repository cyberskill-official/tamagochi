---
fr_id: TASK-AUTH-001
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.4/10
score_post_revision_1: 9.4/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.4/10 — comprehensive Apple/Google sign-in spec covering Supabase ID-token exchange, native bridges (iOS Swift + Android Kotlin + web Identity Services), region-of-record derivation, policy version stamping, audience age gate, no-commingling, multi-device concurrent sessions, token refresh, account deletion (Apple Guideline 5.1.1(v)), and observability. Round-1 surfaced two structural gaps (nonce flow incomplete on Apple, account-deletion grace window enforcement). Round-2 found four refinements (relay email lifecycle, bridge versioning auto-recovery, multi-device sync handoff, sign-in latency budget testability). All 6 resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Apple nonce flow incomplete.** Round-1 noted §1.5 mentioned nonce but the Swift bridge in §3.2 did not show `sha256(nonce)` hashing (Apple requires the sent nonce to be `sha256` hashed of the verifier). **RESOLVED §3.2** — `req.nonce = sha256(nonce)` in Swift bridge; CSPRNG nonce passed unhashed to Supabase per the documented flow.

- **ISS-002 (warning) Account-deletion grace window enforcement.** Round-1 noted §1.19 opened a 30-day grace but did not specify hard-delete enforcement at expiry. **RESOLVED §10 row 8 + AC7** — daily cron asserts grace expiry; manual DPO escalation if cron stalls.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Apple relay-email lifecycle.** Round-2 noted §1.16 said "treat as canonical" but did not address relay invalidation (Apple can revoke the relay if the user disconnects the app). **RESOLVED §10 row 7** — UI test detects merged-account scenario; manual DPO repartition path documented.

- **ISS-004 (info) Bridge-version mismatch auto-recovery vague.** Round-2 noted §1.12 forced an update prompt but did not clear local Auth state. **RESOLVED §10 row 4** — reinstall flow + clear local Auth state on next launch.

- **ISS-005 (warning) Multi-device sync handoff under outage.** Round-2 noted §1.20 said concurrent sessions but did not address divergence during a Supabase outage. **RESOLVED §10 row 3** — in-memory session cache for already-signed-in users + maintenance splash for new sign-ins.

- **ISS-006 (info) Sign-in latency budget testable in CI?** Round-2 noted AC10 cited Sentry transaction sampling but did not provide a CI-deterministic test. **RESOLVED §10 row 11** — Sentry metric review path; CI-deterministic test deferred to load-test deliverable.

## §4 — Strengths preserved

- Apple + Google + web all reach the same Supabase session via `signInWithIdToken` — uniform server-side surface.
- Native bridge versioning is forward-compatible — a future bridge change is a known migration.
- Apple relay-email handled explicitly — common Apple Review rejection avoided.
- Cross-SKU sign-in refusal + graduation flow upholds TASK-LEGAL-001 §1.12 (no commingling).
- Token refresh at 5 min prevents mid-session WebSocket drop.
- Account deletion compliant with Apple Guideline 5.1.1(v).
- Region of record fully integrated with TASK-LEGAL-001 §1.11 deterministic chain.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. AUTH-001 unlocks TASK-AUTH-002 (Zalo) and TASK-AUTH-003 (kid invite-code) which together complete the AUTH slice. TASK-SUB-001 (Pet+) + TASK-B2B-003 (PetOS console SSO) build on this scaffold.
