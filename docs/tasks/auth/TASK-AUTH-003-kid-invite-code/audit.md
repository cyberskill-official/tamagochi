---
fr_id: TASK-AUTH-003
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.6/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 7
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.6/10 — extensive kid-account spec covering no-public-social-sign-in policy, invite-code lifecycle, 3-button first-launch UX, parental-consent registration flow, Safe Harbor adapter abstraction (PRIVO + kWS), state-transition Postgres trigger, revoke URL, color/animal PIN, no persistent device IDs pre-consent, Resend templates, Cloudflare Turnstile, audit logging, 7-year evidence retention, graduation re-verification, throttling, friend-graph restriction, and no-third-party-icons rule. Round-1 found two structural issues (state-machine forward-only enforcement, invite code uniqueness). Round-2 found five refinements (PIN grid entropy quantification, sandbox session expiry, parental email throttle key, graduation signing handover, vendor switching mid-flight).

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) State-machine forward-only.** Round-1 noted §1.9 listed valid transitions but did not encode them at DB level. **RESOLVED §3.4** — Postgres trigger `enforce_consent_transition` REJECTS regressions (granted→pending, revoked→anything) with `consent.state.invalid_transition`.

- **ISS-002 (warning) Invite-code uniqueness collision risk.** Round-1 noted §1.2 said unique but with 8 chars Crockford base32 (~1 trillion possible codes), birthday collisions arise around 1M codes. **RESOLVED §3.3** — `primary key` constraint on `code` column rejects duplicates at insert; CSPRNG retry on insert error.

## §3 — Round-2 findings (resolved)

- **ISS-003 (info) PIN grid entropy.** Round-2 noted §1.11 said "4-element grid" but didn't quantify entropy. **RESOLVED §2** — explicit 256k-2M entropy range across grid sizes; sufficient given invite-code gating layer.

- **ISS-004 (warning) Sandbox session expiry.** Round-2 noted §1.4 said "session-scoped" but did not say what happens on app close. **RESOLVED §1.4 + §10 row 1** — local-only session-scoped state; cleared on app close; no PII server-side.

- **ISS-005 (warning) Parental email throttle key.** Round-2 noted §1.18 said "3 per 24h per email" but did not say if it was email-hash or plain email. **RESOLVED §3** — `parent_email_hash` (sha256, stored canonically) is the throttle key — privacy-preserving + identical to consent table column.

- **ISS-006 (warning) Graduation signing handover.** Round-2 noted §1.17 mentioned graduation but did not address the signing-key gap between kids and standard projects. **RESOLVED §10 row 9** — manual DPO + signature debugging; signing-key sharing documented in graduation flow.

- **ISS-007 (info) Vendor switching mid-flight.** Round-2 noted §1.6 said vendor swap is config change but didn't address mid-flight consent rows. **RESOLVED §11 cross-reference** — sub-decision: vendor swap requires migration script for in-flight pending rows; documented as ops procedure.

## §4 — Strengths preserved

- "No public social sign-in" rule + binary-level enforcement (TASK-LEGAL-003 §1.10) make the kids SKU defensibly COPPA-compliant.
- 3-button first-launch screen handles the three real user pathways (already-invited, getting-parental-help, just-curious).
- Sandbox "Maybe later" mode preserves UX without breaking COPPA — kid gets hooked, parent gets the upgrade pitch later.
- Safe Harbor adapter abstraction lets the vendor decision be deferred without code refactor.
- Crockford base32 invite codes are kid-friendlier than UUIDs.
- Color/animal PIN is age-appropriate.
- State-machine forward-only at DB layer eliminates a whole class of state-corruption bugs.
- 7-year evidence retention matches COPPA-2025 audit expectations.
- Graduation flow keeps the kids→standard transfer auditable.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. This task completes the AUTH slice. Combined with TASK-AUTH-001 + TASK-AUTH-002, every authentication scenario is covered: consumer adults (Apple/Google/Zalo), VN adults (Zalo-primary), and under-13 children (invite code + Safe Harbor parental consent + color/animal PIN).
