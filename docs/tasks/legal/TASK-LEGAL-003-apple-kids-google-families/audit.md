---
fr_id: TASK-LEGAL-003
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.4/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.4/10 — a thorough Apple Kids + Google Families spec covering two-SKU build, parental gate, binary inspection, IAP gate, store-listing copy, Bandai-IP exclusion, Family Sharing wiring, geography availability, and annual review. Round-1 found two gaps (Family Sharing API surface vague, parental gate cancellation handling missing). Round-2 found four refinements (locale QA gap on new languages, math-problem rotation cadence not specified, Apple Family Sharing API deprecation contingency, geography review cadence). All 6 resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Apple Family Sharing API surface vague.** Round-1 noted §1.9 mentioned Family Sharing for tier upgrades but did not specify the entitlement-pinning mechanism. **RESOLVED §7 + §1.9** — Family Sharing entitlements-pinning is required; the in-app upgrade button surfaces the parent's Family Sharing approval flow via the platform's standard mechanism.

- **ISS-002 (warning) Parental gate cancellation not handled.** Round-1 noted the test in §5 only covered correct/incorrect, not user-cancelled. **RESOLVED AC4 + §5** test extends to tap-spam path; cancel maps to the same "did not pass" outcome.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Locale QA gap for new I18N language launches.** Round-2 noted §1.11 covered current languages but did not gate adding a new language. **RESOLVED §10 row 11** — new-language launch requires gate translation before release; the I18N task's pre-launch checklist tracks this.

- **ISS-004 (info) Math-problem rotation cadence not specified.** Round-2 noted §1.4 had a static math problem (`7 × 8`) which can be shared online. **RESOLVED §10 row 10** — monthly rotation cadence + gesture+math compound for high-friction surfaces.

- **ISS-005 (warning) Apple Family Sharing API deprecation contingency.** Round-2 noted no plan for Apple deprecating the Family Sharing API. **RESOLVED §10 row 12** — Apple Dev Note watch + hotfix migration plan.

- **ISS-006 (info) Geography quarterly review cadence not codified.** Round-2 noted §1.14 said "re-evaluated quarterly" but no mechanism enforces it. **RESOLVED §10 row 9 + §1.12** — annual + quarterly review reminders both wired via scheduled tasks.

## §4 — Strengths preserved

- Two-bundle / two-package architecture is unambiguous; Fastlane lane example is compilable.
- Binary inspection script (§3.3) is a CI-survivable kids-policy enforcement.
- Math-problem parental gate explicitly rejects Apple-Guideline-5.1.4-forbidden tap-only confirmations.
- Bandai-IP exclusion zone is operationally precise (denylist regex + checklist + alternative brand "Mochi" identified).
- Geography-of-availability is conservative and explicit — China + Russia deliberately deferred.
- Annual review cadence (Jan + Jul) aligns with Apple/Google policy update windows.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. This task completes the LEGAL trio (TASK-LEGAL-001 + 002 + 003) and is the gating substrate for kids-SKU submission. TASK-ADS-002, TASK-SUB-002, TASK-VIRAL-005 can now begin authoring once this is shipped.
