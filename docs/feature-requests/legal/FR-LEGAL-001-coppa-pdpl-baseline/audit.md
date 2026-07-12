---
fr_id: FR-LEGAL-001
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.3/10
score_post_revision_1: 9.4/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 7
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting state: a strong P0 keystone draft (8.3/10) covering DPO appointment, DPIA, TIA, A05 breach-notification automation, COPPA-2025 separate-SKU policy, Safe Harbor vendor, parental consent, DSR controller, age-gate middleware, region-of-record, no-commingling rule, and annual review. Round-1 surfaced four issues (one missing region-of-record signal, RLS scope ambiguity, missing PII-at-rest guard on parent emails, undeclared SKU build configuration in AC). Round-2 surfaced three subtler issues (deterministic CA05 PDF determinism not asserted in test, no scheduled-task wiring for annual review, no explicit treatment of `policy_version` drift on republish). All 7 issues resolved; final score 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) Missing parent-email-at-rest guard.** Round 1 noted that `parental_consent` table stored `parent_email_hash` (sha256), but the FR did not explicitly forbid storing the raw parent email at any layer (it could have leaked via Resend logs or a Webhook payload). **RESOLVED §1.6** with the explicit `parent_email_hash` column shape + §10 row 8 commingling failure-mode + §11 anti-pattern "PII at rest in Resend logs" implicit via Resend's deletion-policy reference in vendor cost snapshot.

- **ISS-002 (error) SKU build config not in acceptance criteria.** Round 1 noted §1.5 declared two distinct bundle IDs but no AC asserted they were actually configured in Cocos build pipeline. **RESOLVED AC6** added — references `apps/cocos/fastlane/Fastfile` and `apps/cocos/gradle.properties` per build target.

- **ISS-003 (warning) RLS role scope unclear.** Round 1 noted the `parental_consent`, `dsr_tickets`, `coppa_age_gate_log` tables had RLS enabled but the policy used `auth.role() = 'dpo'` without defining how that role is provisioned. **RESOLVED §3.4** — the RLS policy now uses a single `dpo` role name that maps to a Supabase role created during P0 (cross-ref FR-INFRA-003 §1.6 RLS templates). DPO appointment FR (§1.1) ties the human DPO to that role.

- **ISS-004 (warning) Region-of-record missing payment-method signal.** Round 1 noted §1.11 chain (explicit → Apple → Google → Zalo → IP) skipped a stronger signal: an active Apple/Google payment-method jurisdiction. **RESOLVED §1.11** — Apple/Google account region is explicitly described as the strongest signal because it requires payment-method verification; clause already weighted at priority 2.

## §3 — Round-2 findings (resolved)

- **ISS-005 (error) CA05 PDF determinism not asserted.** Round 2 noted §1.13 demanded deterministic export but the §5 test only asserted PDF SHA-256 equality across two runs, without locking in the snapshot hash that future regressions would catch. **RESOLVED §5.2** — second test case `'matches the locked-in snapshot hash'` added with an inline-snapshot hex digest.

- **ISS-006 (warning) Annual review depends on human memory.** Round 2 noted §1.14 specified annual review but did not specify the mechanism. **RESOLVED AC12** — a scheduled-task entry is mandated (`mcp__scheduled-tasks__create_scheduled_task` fires on 2027-05-17) with the prompt text spelled out.

- **ISS-007 (warning) Policy version drift on republish.** Round 2 noted §1.8 required a `policy_version` audit field on every consent event but did not specify what happens when the policy is republished (e.g. a typo-fix vs a material clause change). **RESOLVED AC11** — a daily reconciliation job is mandated to emit `policy.version.mismatch` Sentry alerts. The §10 row 9 failure-mode covers the recovery path (re-publish policy + replay consent re-confirmation for affected users).

## §4 — Strengths preserved

- BCP-14-precise normative clauses with no ambiguity in §1.
- Closed enum constraints on every state-transition column in Postgres schema (consent_state, vendor, kind, regulator_jurisdiction, status, decision) prevent silent invalid values.
- The 60-minute breach-draft SLA with explicit P95 measurement gives Ops a concrete monitoring target.
- The kids SKU policy is opinionated and surgical — separate App Store record, separate Supabase project, separate analytics stack. No "we'll figure it out later" wiggle room.
- The PRIVO vs SuperAwesome kWS comparison includes pricing snapshots that age-stamp the decision, which makes annual-review timing concrete.
- The failure-mode inventory at 12 rows covers regulator-rejection, vendor-outage, race conditions (consent revoke vs delete), and silent drift (vendor moves region).
- The forbidden anti-patterns block in §11 captures the negative space — what NOT to do — which is rare in privacy specs and very useful to engineers under deadline pressure.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. Ship verdict: this FR is the foundation for every kid-touching downstream FR (FR-LEGAL-002, FR-LEGAL-003, FR-AUTH-003, FR-AI-002, FR-ADS-002, FR-OBS-001, FR-VIRAL-005). Owner sign-off prerequisite: legal counsel engagement letter on file before FR-INFRA-003 (Supabase) begins implementation, since the kids-SKU Supabase project provisioning depends on the DPO + Safe Harbor vendor decision being locked.
