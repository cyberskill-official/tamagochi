# Tamagochi Test Cases And Coverage Matrix

**Version:** 1.0.0  
**Date:** 2026-05-17  
**Scope:** All 53 shipped tasks plus cross-module product journeys  
**Primary command:** `npm run verify`

## 1. Test Strategy

Tamagochi uses a layered verification strategy:

| Layer | Purpose | Location | Command |
|---|---|---|---|
| Unit tests | Validate service-level invariants, edge cases, and failure modes | `tests/unit/*.test.ts` | `npm run test:unit` |
| task acceptance tests | Ensure every shipped task has an executable acceptance contract | `tests/task-acceptance.test.ts` | `npm run test:task` |
| End-to-end tests | Validate realistic player, parent, social, economy, and B2B flows | `tests/e2e/*.test.ts` | `npm run test:e2e` |
| task consistency checks | Validate shipped status, audits, declared file paths, backlog/manifest sync | `scripts/task-check.mjs` | `npm run task:check` |
| QA artifact checks | Validate PRD, SRS, test cases, unit suite, and E2E suite exist | `scripts/qa-check.mjs` | `npm run qa:check` |

## 2. Test Data Standards

1. Use deterministic dates for lifecycle tests.
2. Use separate service instances per test group to avoid hidden state coupling.
3. Use explicit tenant slugs: `mochi`, `techcombank`, `viettel`.
4. Use under-13 users only through parent invite verification.
5. Use direct purchase examples only; no paid randomized purchase fixture is allowed.
6. Use slug-style error assertions so policy failures stay stable.

## 3. Release Coverage Requirements

1. Every task in `src/registry.ts` must have an task acceptance case.
2. Every domain service exported from `src/index.ts` must have unit coverage.
3. At least five E2E journeys must pass: adult core loop, kid compliance, social/trade, monetization/live-ops, and B2B tenant isolation.
4. Documentation and QA checks must be included in `npm run verify`.

## 4. Coverage Matrix

| Test ID | TASK-ID | Area | Primary automated coverage | Required assertions |
|---|---|---|---|---|
| TC-001 | TASK-LEGAL-001 | Compliance baseline | task acceptance, unit legal | DPO/DPIA/TIA/Safe Harbor ready; 72h breach window |
| TC-002 | TASK-LEGAL-002 | Loot-box policy | task acceptance, unit legal | Real-money randomized purchase rejected; earned random outcomes disclosed |
| TC-003 | TASK-LEGAL-003 | Store kids/families | task acceptance, unit legal | Kids SDK allow-list, parental gates, no behavioral ads |
| TC-004 | TASK-INFRA-001 | Cocos scaffold | task acceptance, unit infra | Build target config, tenant bundle URL, compressed budget |
| TC-005 | TASK-INFRA-002 | Realtime server | task acceptance, unit infra | Sticky sessions, Redis presence, tenant room metadata |
| TC-006 | TASK-INFRA-003 | Supabase baseline | task acceptance, unit infra/B2B | Standard/kids projects, RLS templates, tenant assumptions |
| TC-007 | TASK-AUTH-001 | Apple/Google auth | task acceptance, unit auth | Valid provider token creates 13+ profile |
| TC-008 | TASK-AUTH-002 | Zalo auth | task acceptance, unit auth | Zalo provider and privacy URL present |
| TC-009 | TASK-AUTH-003 | Kid invite | task acceptance, unit auth, E2E kid | Invite code length, parent verification, no child email |
| TC-010 | TASK-OBS-001 | Analytics/errors | task acceptance, unit obs | Kids SDK subset, tenant-tagged events |
| TC-011 | TASK-ART-001 | Spine/audio contract | task acceptance, unit media | 20-animation contract includes key gameplay animations |
| TC-012 | TASK-PET-001 | Hatch/entity/name | task acceptance, unit pet, E2E adult | ULID, hatch audit, safe name persistence |
| TC-013 | TASK-PET-002 | Evolution | task acceptance, unit pet, E2E adult | Egg to teen/adult by server time |
| TC-014 | TASK-PET-003 | Stats/decay | task acceptance, unit pet, E2E adult | Offline decay lowers needs and clamps values |
| TC-015 | TASK-PET-004 | Onboarding | task acceptance, E2E adult | Hatch, name, first care action, tutorial path |
| TC-016 | TASK-CARE-001 | Feed | task acceptance, unit care | Hunger restore and `eat` animation intent |
| TC-017 | TASK-CARE-002 | Clean | task acceptance, unit care | Cleanliness restore and bubble particle intent |
| TC-018 | TASK-CARE-003 | Hug | task acceptance, unit care | Happiness restore, haptic intent, daily cap |
| TC-019 | TASK-CARE-004 | Mini-games | task acceptance, unit care | Score payout and daily cap enforcement |
| TC-020 | TASK-CARE-005 | Streaks | task acceptance, unit care, E2E monetization | Forgiveness tokens and quiet-hour behavior |
| TC-021 | TASK-AI-001 | LLM personality | task acceptance, unit AI, E2E adult | Persona YAML, cache/cost behavior, response text |
| TC-022 | TASK-AI-002 | Content safety | task acceptance, unit AI, E2E kid | Unsafe text rejected; under-13 scripted dialogue |
| TC-023 | TASK-AR-001 | Bedroom Cam | task acceptance, unit media, E2E adult | AR when supported, Photo Studio fallback |
| TC-024 | TASK-VIRAL-001 | TikTok export | task acceptance, unit media | 1080x1920, 6 sec, watermark, hashtags |
| TC-025 | TASK-PET-005 | Multi-pet inventory | task acceptance, unit pet | Free/Pet+ slot behavior |
| TC-026 | TASK-PET-006 | Species/rarity | task acceptance, unit legal/pet | Five species, earned rarity, no paid random pull |
| TC-027 | TASK-PET-007 | Breeding | task acceptance, unit pet, E2E social | Two adult pets produce deterministic legendary child |
| TC-028 | TASK-PET-008 | Grandma rescue | task acceptance, unit pet | 7-day neglect moves pet; free 3-day rescue |
| TC-029 | TASK-SOCIAL-001 | Friend graph | task acceptance, unit social, E2E social | Invite code friendship; under-13 search disabled |
| TC-030 | TASK-SOCIAL-002 | PetPair | task acceptance, unit social, E2E social | Co-parent pair, receipt, one-sided care detection |
| TC-031 | TASK-SOCIAL-003 | Trust trade | task acceptance, unit social, E2E social | Both confirmations required; atomic owner swap |
| TC-032 | TASK-SOCIAL-004 | Ceremony | task acceptance, unit social, E2E social | Shared room, married cosmetic, share clip flag |
| TC-033 | TASK-VIRAL-002 | Daily Drama | task acceptance, unit media | One event/day/pet and 6-sec share clip |
| TC-034 | TASK-VIRAL-003 | Generative pet | task acceptance, unit media | One-of-one palette; offensive prompt rejection |
| TC-035 | TASK-ECON-001 | Currency ledger | task acceptance, unit economy, E2E monetization | Double-entry balance, no overdraft, reconciliation |
| TC-036 | TASK-ECON-002 | IAP catalog | task acceptance, unit economy | Direct non-random catalog; receipt validation |
| TC-037 | TASK-ECON-003 | UGC couture | task acceptance, unit economy | Creator rev-share ledger entry |
| TC-038 | TASK-SUB-001 | Pet+ | task acceptance, unit economy | Restore purchase toggles entitlement |
| TC-039 | TASK-SUB-002 | Family tier | task acceptance, unit economy, E2E kid | Family dashboard, 5 child profiles, controls |
| TC-040 | TASK-ADS-001 | Rewarded video | task acceptance, unit economy | Reward completion grants coins; interstitial rejected |
| TC-041 | TASK-ADS-002 | Kid ad gate | task acceptance, unit economy, E2E kid | Under-13 contextual-only enforcement |
| TC-042 | TASK-VIRAL-004 | Battle pass | task acceptance, unit economy | 4 weeks, 40 tiers, premium entitlement |
| TC-043 | TASK-VIRAL-005 | Push | task acceptance, unit media | Quiet hours and frequency caps |
| TC-044 | TASK-OBS-002 | Anti-cheat audit | task acceptance, unit obs, E2E B2B | Invalid signature goes to ban review; ledger drift alert |
| TC-045 | TASK-I18N-001 | Localization | task acceptance, unit i18n | 9 locales and Vietnamese font fallback |
| TC-046 | TASK-I18N-002 | Payment rails | task acceptance, unit i18n | VN rails, tax-inclusive display |
| TC-047 | TASK-A11Y-001 | Accessibility | task acceptance, unit a11y | Contrast, reduced motion, labels |
| TC-048 | TASK-AI-003 | AI v2 | task acceptance, unit AI | 13+ contextual reaction; kids scripted only |
| TC-049 | TASK-B2B-001 | Tenant client | task acceptance, unit B2B, E2E B2B | Tenant theme resolution and mascot count |
| TC-050 | TASK-B2B-002 | Tenant partition | task acceptance, unit B2B, E2E B2B | RLS select filters rows; tenant mismatch rejected |
| TC-051 | TASK-B2B-003 | PetOS console | task acceptance, unit B2B | Theme upload, quest CMS, KPI dashboard features |
| TC-052 | TASK-B2B-004 | Techcombank tenant | task acceptance, unit B2B, E2E B2B | Savings quest, SSO, financial quiz |
| TC-053 | TASK-B2B-005 | Viettel tenant | task acceptance, unit B2B, E2E B2B | Top-up quest, SSO, SIM binding |

## 5. End-To-End Journey Cases

| E2E ID | Name | Coverage | Pass criteria |
|---|---|---|---|
| E2E-001 | Standard player hatch-to-share | Auth, hatch, naming, care, evolution, AI, AR/share, observability | Player completes core loop and gets valid vertical clip |
| E2E-002 | Under-13 safe account journey | Parent invite, kids SDK rules, scripted AI, contextual ads, quiet push | No prohibited kids surface is reachable |
| E2E-003 | Social collection journey | Friend invite, PetPair, breeding, trade, ceremony | Shared care and trade require correct confirmations |
| E2E-004 | Monetization and live-ops journey | Ledger, IAP, Pet+, Family, rewarded video, battle pass | Direct purchase and subscription work; no random paid outcome |
| E2E-005 | PetOS tenant isolation journey | Tenant theme, RLS-style row filtering, tenant mismatch, DPO audit, reference tenants | Tenant data is isolated and reference tenants are configured |
| E2E-006 | Game-session orchestrator | All five journeys through `TamagochiGameSession` | All scenario results return `passed: true` with evidence |
| E2E-007 | Web QA console | Browser-ready QA artifact | Static console serves HTML/JS and exposes all journey controls |

## 6. Manual Regression Checklist

These items require real device or vendor accounts once the native implementation is connected:

1. iOS TestFlight build and Apple Sign-In entitlement.
2. Android Internal Test build and Google Sign-In entitlement.
3. Zalo OA approval and OAuth callback.
4. ARKit device placement and camera-roll export.
5. ARCore device placement and Android share intent.
6. Apple/Google IAP receipt sandbox validation.
7. SuperAwesome kWS integration in kids SKU.
8. LevelPlay/AppLovin rewarded-video SDK behavior.
9. VoiceOver and TalkBack real-device traversal.
10. Crowdin sync and locale QA with native fonts.

## 7. Exit Criteria

1. `npm run verify` passes locally.
2. No task row remains in `accepted` state.
3. All 53 task acceptance tests exist.
4. Unit tests cover every exported domain service.
5. E2E tests cover the five product journeys above.
6. Manual regression checklist is assigned before app-store submission.
