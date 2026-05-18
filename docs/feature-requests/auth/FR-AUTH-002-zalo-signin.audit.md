---
fr_id: FR-AUTH-002
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

Starting 8.4/10 — comprehensive Zalo Sign-In spec covering OA registration, PKCE flow, server-side code exchange, custom Supabase external provider, minimum-scope profile fetch, account linking, kids-SKU disable at binary level, PDPL data-processing addendum, callback security, rate limiting, observability, Zalo OA banner compliance, disconnect flow, and SDK version pinning. Round-1 found two structural gaps (PKCE session TTL not specified, custom-provider JWT signing key management). Round-2 found four refinements (Zalo OA secret rotation breaking exchange, phone-hash rate-limit granularity, Apple Guideline 4.8 ordering on iOS, DPA expiration handling).

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) PKCE session TTL unspecified.** Round-1 noted §1.13(a) required PKCE verifier match but did not specify how long the challenge persists server-side. **RESOLVED §10 row 3 + §1.13** — 5-min TTL on the recorded challenge; expired challenge fails with `zalo.pkce.expired`.

- **ISS-002 (warning) Supabase JWT signing key isolation.** Round-1 noted §1.5 minted a Supabase-compatible JWT but did not specify key management. **RESOLVED §3.3** — `mintSupabaseJwt` uses `SUPABASE_AUTH_SECRET` (Supabase's own secret); regular rotation managed via Supabase Auth admin API.

## §3 — Round-2 findings (resolved)

- **ISS-003 (error) Zalo OA secret rotation breaks server-side exchange.** Round-2 noted §1.1 + §3.3 used `ZALO_APP_SECRET` but no rotation procedure was specified. **RESOLVED §10 row 4** — secret update in Supabase env vars + redeploy; overlap window negotiated with Zalo support.

- **ISS-004 (warning) Phone-hash rate-limit granularity.** Round-2 noted §1.14 said "per phone-number-hash" but the Cocos client doesn't see the phone directly (Zalo never exposes it). **RESOLVED §3.2** — rate-limit keys off IP + a code-prefix hash; phone-correlated detection is server-side only (the Zalo profile fetch may reveal phone-derived ID, used for retrospective ban).

- **ISS-005 (warning) Apple Guideline 4.8 ordering on iOS.** Round-2 noted §1.9 had Zalo-primary on VN but did not address Apple's mandate to offer Apple Sign-In above other providers on iOS. **RESOLVED §1.20** — Apple-first on iOS preserved; Zalo prominence is via labeling inside Apple's row.

- **ISS-006 (info) DPA expiration / Zalo ToS update.** Round-2 noted §1.12 required a DPA but did not address renewal. **RESOLVED §10 row 11** — annual compliance review re-executes DPA + updates privacy policy version.

## §4 — Strengths preserved

- Custom Supabase external provider via `sign_in_with_id_token` is the canonical Supabase pattern for non-Big-Tech providers.
- PKCE protects native-flow auth-code interception (RFC 7636).
- Minimum-scope profile fetch (id + name only) satisfies PDPL data minimisation.
- Binary-level kids-SKU disable (defence in depth beyond runtime feature flag).
- Server-side code exchange keeps OA secret off the client.
- Account-linking is one-direction (no arbitrary unlink-swap attack surface).
- Apple Guideline 4.8 ordering compliance preserved.
- VN-specific primary CTA via locale config (FR-I18N-001 cross-reference).
- PDPL data-processing addendum cited in the public privacy policy — auditor-friendly.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. Completes the consumer-SKU provider trio (FR-AUTH-001 + FR-AUTH-002 + the under-13 path in FR-AUTH-003).
