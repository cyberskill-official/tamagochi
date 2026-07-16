# Tamagochi Product Requirements Document

**Version:** 1.0.0  
**Date:** 2026-05-17  
**Owner:** Stephen Cheng, CyberSkill  
**Status:** Shipped requirements baseline for 53 tasks  
**Source of truth:** `docs/tasks/BACKLOG.md` and individual `TASK-*.md` files

## 1. Product Summary

Tamagochi is a cross-platform 2D animated companion game for iOS, Android, and WebGL. Players hatch, name, care for, evolve, share, and socially co-parent virtual pets. The same codebase also powers PetOS by CyberSkill, a multi-tenant B2B white-label engine for banks, telcos, and loyalty programs.

The product has two audience SKUs:

| SKU | Audience | Product posture |
|---|---|---|
| Standard | 13+ | Full game loop: AI dialogue, social graph, trading, IAP, rewarded ads, push, viral sharing |
| Kids | Under 13 | COPPA-safe experience: parental consent, no LLM chat, no behavioral ads, restricted analytics, invite-code-only social |

The game must feel warm, expressive, and safe. The business must remain regulator-safe: no real-money randomized loot boxes, no under-13 behavioral ads, no under-13 generative chat, and strong tenant isolation for PetOS.

## 2. Goals

1. Deliver a playable pet MVP where a player can hatch a pet, name it safely, feed it, clean it, hug it, play mini-games, and see stat/evolution changes.
2. Build retention loops that are ethical for children and families: streaks use forgiveness tokens and quiet hours rather than punitive FOMO.
3. Enable social growth through friend invite codes, co-parenting, trust-safe trading, ceremonies, and shareable 9:16 clips.
4. Monetize with transparent direct purchases, subscriptions, rewarded video, and battle pass mechanics without any real-money randomized outcomes.
5. Ship a compliance-first foundation for COPPA-2025, Vietnam PDPL 2026, Apple Kids Category, Google Play Families, and B2B tenant data isolation.
6. Prove the PetOS white-label engine can support separate tenant themes, RLS-backed tenant partitions, tenant dashboards, and reference bank/telco integrations.

## 3. Non-Goals

1. No real-money randomized loot boxes or paid revival mechanics.
2. No public pet directory without a separate privacy review.
3. No under-13 LLM chat, behavioral advertising, name search, or unrestricted social discovery.
4. No cross-tenant admin superuser path outside audited DPO views.
5. No native Cocos/Colyseus/Supabase production deployment in this repository snapshot; this baseline provides executable contracts and scaffolds that downstream implementation teams can harden into production services.

## 4. Personas

| Persona | Needs | Success signal |
|---|---|---|
| Teen player | Cute companion, expressive care loop, social sharing, collection progress | D7 retention, pet care actions/day, shares/week |
| Parent | Child-safe account creation, spend caps, screen-time controls, no behavioral ads | Consent completion, Family dashboard use, low refund/complaint rate |
| Under-13 player | Safe invite-code-only play with scripted dialogue and friendly reminders | No blocked policy events, low churn after parental gate |
| Live-ops designer | Events, streaks, battle pass, catalog tuning | Event completion and ARPDAU uplift |
| B2B tenant operator | Branded pet loyalty engine, theme upload, KPI dashboard, tenant isolation | Tenant onboarding time, SLA, no cross-tenant incidents |
| Compliance/DPO | Audit logs, DSR support, DPIA/TIA proof, breach notification workflow | Audit readiness and incident response within 72 hours |

## 5. Product Scope By Phase

| Phase | Capability gate | Included modules |
|---|---|---|
| P0 Foundation | Compliance, scaffold, auth, observability | LEGAL, INFRA, AUTH, OBS |
| P1 Core Pet MVP | One complete care loop with AI, AR, share | ART, PET, CARE, AI, AR, VIRAL |
| P2 Social & Multi-Pet | Multi-pet inventory, species, breeding, friend/co-parent/trade | PET, SOCIAL, VIRAL |
| P3 Monetization & Live-Ops | Currency, IAP, subscriptions, ads, battle pass, push | ECON, SUB, ADS, VIRAL |
| P4 Scale & PetOS B2B | Localization, accessibility, AI v2, multi-tenant PetOS | OBS, I18N, A11Y, AI, B2B |

## 6. Functional Requirements

### 6.1 Legal And Compliance

1. The product must maintain COPPA-2025 and Vietnam PDPL 2026 readiness: DPO appointment, DPIA, cross-border TIA, A05 breach template, and Safe Harbor vendor decision.
2. The product must reject Bandai-confusing branding terms in branding fields.
3. The product must guarantee no real-money randomized loot boxes and must disclose drop rates for earned random outcomes.
4. The kids SKU must include only approved analytics/error SDKs and must parental-gate external links and purchase flows.

### 6.2 Infrastructure

1. The client must be structured as a Cocos Creator 3.x TypeScript app with pinned build-target constants for `kids` and `standard`.
2. The runtime must expose deterministic build settings, bundle-budget checks, tenant-aware asset-bundle loading, and source-map protection.
3. The backend contract must include Colyseus-style tenant rooms, Redis presence/sticky-session assumptions, and Supabase-style RLS baseline.

### 6.3 Authentication

1. Standard players must sign in with Apple, Google, or Zalo.
2. Zalo sign-in must include privacy-policy surfaces for Vietnam.
3. Under-13 players must enter via verified parent invite code with no child email collection.

### 6.4 Observability And Anti-Cheat

1. The standard SKU must support GameAnalytics, Mixpanel, AppsFlyer, Sentry, and Better Stack event plans.
2. The kids SKU must be limited to GameAnalytics and Sentry.
3. Security events must detect invalid signatures, rate-limit hits, impossible transitions, and ledger drift.
4. Sentry and analytics events must carry tenant tags.

### 6.5 Pet Lifecycle

1. Players must hatch a server-authoritative pet with ULID identity, tenant scope, audience gate, and deterministic palette seed.
2. Pet names must pass length, charset, blocklist, moderation, and stricter under-13 PII filters.
3. Pets must evolve through egg, baby, teen, adult, and grandma-house states using server time.
4. Pet stats must decay offline and reconcile on rejoin.
5. Free players must have 3 active pet slots; Pet+ players must have 10.
6. Five species and five rarity tiers must be represented without paid random pulls.
7. Breeding must use deterministic inheritance.
8. Neglected pets must move to grandma's house and have a free rescue path.

### 6.6 Care Loop

1. Feed, clean, and hug actions must update stats, trigger animation/particle/haptic intent, and emit analytics.
2. Hugging must have a soft daily cap to reduce farming.
3. Mini-games must validate payouts server-side and enforce daily coin caps.
4. Streaks must include forgiveness tokens, Cozy Hour support, and quiet-hour protections.

### 6.7 AI And Safety

1. Standard accounts may use cached LLM pet replies with cost caps and persona YAML.
2. All LLM input/output must pass content safety.
3. Under-13 accounts must use scripted dialogue only.
4. AI v2 may react to selfie/name/multi-pet context for 13+ only.

### 6.8 AR And Sharing

1. Bedroom Cam must use AR placement when device support exists and fall back to Photo Studio otherwise.
2. Share exports must produce 1080x1920, 6-second clips with watermark and hashtag metadata.
3. Daily Drama must generate one micro-event per pet per day.
4. Generative palette prompts must run through a denylist.

### 6.9 Social

1. Friend graph must use 8-character invite codes.
2. Under-13 social must be invite-code-only.
3. PetPair co-parenting must allow two users to care for one pet and send receipt-style notifications.
4. Trades must show both sides, require both confirmations, reject off-platform paths, and swap atomically.
5. Wedding/best-friend ceremonies must produce a synchronous event and share clip.

### 6.10 Monetization

1. Currency must use double-entry ledger semantics for Coins and Hearts.
2. Hearts must enter only via validated IAP receipts.
3. Coins and Hearts must not convert between each other.
4. IAP catalog entries must be direct purchase and non-randomized.
5. Pet+ and Family tiers must expose entitlements, restore purchase, child profiles, screen-time caps, spend caps, and content filter controls.
6. Rewarded video must never use interstitials.
7. Under-13 ads must be contextual only.
8. Battle pass must support 4-week cycles, 40 tiers, free/premium tracks, and entitlement gates.
9. Push must respect local quiet hours and frequency caps.

### 6.11 Localization And Accessibility

1. The product must support the nine launch locales: English, Vietnamese, Indonesian, Thai, Brazilian Portuguese, LATAM Spanish, Japanese, Korean, Traditional Chinese.
2. Vietnamese and Thai diacritics must have font fallback support.
3. All text must meet WCAG-AA contrast, reduced-motion mode must exist, and interactive controls must have VoiceOver/TalkBack labels.

### 6.12 PetOS B2B

1. Tenant slug must resolve at boot and lazy-load tenant theme bundles.
2. Every player-facing data table must include `tenant_id`.
3. RLS and runtime checks must prevent cross-tenant reads/writes.
4. DPO cross-tenant access must be audit-only.
5. PetOS console must include theme upload, quest CMS, KPI dashboard, and entitlement tier management.
6. Techcombank and Viettel reference tenants must demonstrate bank/telco loyalty use cases.

## 7. Success Metrics

| Area | Metric | Target |
|---|---:|---:|
| Core retention | D7 retention | >= 18% beta cohort |
| Long-term retention | D30 retention | >= 7% |
| Social growth | k-factor | >= 0.4 |
| Monetization | Subscription conversion | >= 3% mature cohort |
| Monetization | ARPDAU | >= $0.05 |
| Safety | Trade scam-rate | < 0.5% |
| Compliance | Loot-box complaints | 0 |
| Operations | B2B tenant isolation incidents | 0 |
| Scale | Anchor B2B tenants | 2 signed |

## 8. Release Gates

1. `npm run verify` must pass.
2. All tasks in `docs/tasks/BACKLOG.md` must be `shipped (10/10)`.
3. `docs/testing/TEST_CASES.md` must cover every task in `src/registry.ts`.
4. Unit tests must cover every domain service.
5. End-to-end tests must cover adult, kid, social, monetization, and B2B tenant flows.
6. Compliance documents in `docs/legal/` must remain present.
7. Any future native/mobile/web deployment must add device/browser coverage before production release.

## 9. Traceability

Detailed requirement-to-test mapping lives in `docs/testing/TEST_CASES.md`. The implementation log lives in `docs/tasks/IMPLEMENTATION_LOG.md`. Automated task status and file-reference verification lives in `scripts/task-check.mjs`.
