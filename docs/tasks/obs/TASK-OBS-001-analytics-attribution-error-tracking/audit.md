---
fr_id: TASK-OBS-001
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.5/10
score_post_revision_1: 9.4/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.5/10 — comprehensive observability scaffold covering standard-SKU + kids-SKU SDK stacks, SDK allow-list with CI enforcement, event taxonomy + schema validation, server-side-first events, PII scrubbing, Sentry release tagging + sampling, Mixpanel feature flags, AppsFlyer attribution with server postback, GameAnalytics economy, Better Stack uptime + logs, PostHog as alternative, cross-SKU workspace separation, Cocos `Analytics.ts` API, PII consent gating, Grafana dashboards, critical-incident alerts, and quarterly review. Round-1 surfaced two gaps (server-vs-client dedup unclear, no feature-flag-fallback test). Round-2 found four refinements (PII scrubber unit-test discipline, AppsFlyer postback verification, alert false-positive handling, cross-SKU event leakage detection).

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Server-vs-client dedup mechanism.** Round-1 noted §1.6 said "server is source of truth" but did not specify how the analytics pipeline dedupes. **RESOLVED §1.6** + `client_emitted_at` tag — analytics pipeline dedupes by `(event_name, user_id, server.emitted_at, client.emitted_at)` key.

- **ISS-002 (warning) Feature-flag fallback not tested.** Round-1 noted §1.10 said "default value when service unavailable" but no AC tested it. **RESOLVED AC10** — `__tests__/feature-flag-fallback.spec.ts` asserts default returned when Mixpanel mock throws.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) PII scrubber unit-test discipline.** Round-2 noted §1.7 said scrubber MUST be unit-tested but did not enforce that the test covers every PII field. **RESOLVED AC4 + §3.3** — explicit test for each scrubbed field (parent_email, parental_consent, device_id) + Sentry SDK-upgrade regression test.

- **ISS-004 (warning) AppsFlyer postback fraud surface.** Round-2 noted §1.11 said "server-driven" but did not specify how attribution-side validates. **RESOLVED §10 row 4 + §1.11** — postback ties to verified IAP receipt; manual UA reconciliation path documented.

- **ISS-005 (info) Alert false-positive handling.** Round-2 noted §1.19 specified alert thresholds but did not address on-call pager fatigue. **RESOLVED §10 row 11** — tune thresholds; rate-limit pages; runbook references.

- **ISS-006 (warning) Cross-SKU event leakage detection.** Round-2 noted §1.15 required workspace separation but did not specify drift detection. **RESOLVED §10 row 9 + AC12** — manual workspace volume review post soft-launch.

## §4 — Strengths preserved

- Per-SKU SDK allow-list is CI-survivable.
- Event taxonomy + schema validation prevents naming chaos.
- Server-emitted = source of truth eliminates client-tampering for business-critical events.
- PII scrubbers are unit-tested (catches Sentry SDK upgrade regressions).
- Sentry release tagging makes incident bisection trivial.
- Mixpanel feature flags from day one — economy + retention experiments unblocked.
- AppsFlyer server-side postback prevents UA fraud.
- Cross-SKU workspace separation is a B2B sales-ready architecture.
- Grafana dashboards JSON-versioned — re-importable on a fresh stack.
- Quarterly review keeps the system from drifting silently.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. This task completes P0 (10/10 tasks at 10/10). The foundation is now: legal (3 tasks), infra (3 tasks), auth (3 tasks), and observability (1 task) — every downstream gameplay/feature task has a baseline to lean on.
