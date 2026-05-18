# Tamagochi Test Cases And Coverage Matrix

**Version:** 1.0.0  
**Date:** 2026-05-17  
**Scope:** All 53 shipped FRs plus cross-module product journeys  
**Primary command:** `npm run verify`

## 1. Test Strategy

Tamagochi uses a layered verification strategy:

| Layer | Purpose | Location | Command |
|---|---|---|---|
| Unit tests | Validate service-level invariants, edge cases, and failure modes | `tests/unit/*.test.ts` | `npm run test:unit` |
| FR acceptance tests | Ensure every shipped FR has an executable acceptance contract | `tests/fr-acceptance.test.ts` | `npm run test:fr` |
| End-to-end tests | Validate realistic player, parent, social, economy, and B2B flows | `tests/e2e/*.test.ts` | `npm run test:e2e` |
| FR consistency checks | Validate shipped status, audits, declared file paths, backlog/manifest sync | `scripts/fr-check.mjs` | `npm run fr:check` |
| QA artifact checks | Validate PRD, SRS, test cases, unit suite, and E2E suite exist | `scripts/qa-check.mjs` | `npm run qa:check` |

## 2. Test Data Standards

1. Use deterministic dates for lifecycle tests.
2. Use separate service instances per test group to avoid hidden state coupling.
3. Use explicit tenant slugs: `mochi`, `techcombank`, `viettel`.
4. Use under-13 users only through parent invite verification.
5. Use direct purchase examples only; no paid randomized purchase fixture is allowed.
6. Use slug-style error assertions so policy failures stay stable.

## 3. Release Coverage Requirements

1. Every FR in `src/registry.ts` must have an FR acceptance case.
2. Every domain service exported from `src/index.ts` must have unit coverage.
3. At least five E2E journeys must pass: adult core loop, kid compliance, social/trade, monetization/live-ops, and B2B tenant isolation.
4. Documentation and QA checks must be included in `npm run verify`.

## 4. Coverage Matrix

| Test ID | FR-ID | Area | Primary automated coverage | Required assertions |
|---|---|---|---|---|
| TC-001 | FR-LEGAL-001 | Compliance baseline | FR acceptance, unit legal | DPO/DPIA/TIA/Safe Harbor ready; 72h breach window |
| TC-002 | FR-LEGAL-002 | Loot-box policy | FR acceptance, unit legal | Real-money randomized purchase rejected; earned random outcomes disclosed |
| TC-003 | FR-LEGAL-003 | Store kids/families | FR acceptance, unit legal | Kids SDK allow-list, parental gates, no behavioral ads |
| TC-004 | FR-INFRA-001 | Cocos scaffold | FR acceptance, unit infra | Build target config, tenant bundle URL, compressed budget |
| TC-005 | FR-INFRA-002 | Realtime server | FR acceptance, unit infra | Sticky sessions, Redis presence, tenant room metadata |
| TC-006 | FR-INFRA-003 | Supabase baseline | FR acceptance, unit infra/B2B | Standard/kids projects, RLS templates, tenant assumptions |
| TC-007 | FR-AUTH-001 | Apple/Google auth | FR acceptance, unit auth | Valid provider token creates 13+ profile |
| TC-008 | FR-AUTH-002 | Zalo auth | FR acceptance, unit auth | Zalo provider and privacy URL present |
| TC-009 | FR-AUTH-003 | Kid invite | FR acceptance, unit auth, E2E kid | Invite code length, parent verification, no child email |
| TC-010 | FR-OBS-001 | Analytics/errors | FR acceptance, unit obs | Kids SDK subset, tenant-tagged events |
| TC-011 | FR-ART-001 | Spine/audio contract | FR acceptance, unit media | 20-animation contract includes key gameplay animations |
| TC-012 | FR-PET-001 | Hatch/entity/name | FR acceptance, unit pet, E2E adult | ULID, hatch audit, safe name persistence |
| TC-013 | FR-PET-002 | Evolution | FR acceptance, unit pet, E2E adult | Egg to teen/adult by server time |
| TC-014 | FR-PET-003 | Stats/decay | FR acceptance, unit pet, E2E adult | Offline decay lowers needs and clamps values |
| TC-015 | FR-PET-004 | Onboarding | FR acceptance, E2E adult | Hatch, name, first care action, tutorial path |
| TC-016 | FR-CARE-001 | Feed | FR acceptance, unit care | Hunger restore and `eat` animation intent |
| TC-017 | FR-CARE-002 | Clean | FR acceptance, unit care | Cleanliness restore and bubble particle intent |
| TC-018 | FR-CARE-003 | Hug | FR acceptance, unit care | Happiness restore, haptic intent, daily cap |
| TC-019 | FR-CARE-004 | Mini-games | FR acceptance, unit care | Score payout and daily cap enforcement |
| TC-020 | FR-CARE-005 | Streaks | FR acceptance, unit care, E2E monetization | Forgiveness tokens and quiet-hour behavior |
| TC-021 | FR-AI-001 | LLM personality | FR acceptance, unit AI, E2E adult | Persona YAML, cache/cost behavior, response text |
| TC-022 | FR-AI-002 | Content safety | FR acceptance, unit AI, E2E kid | Unsafe text rejected; under-13 scripted dialogue |
| TC-023 | FR-AR-001 | Bedroom Cam | FR acceptance, unit media, E2E adult | AR when supported, Photo Studio fallback |
| TC-024 | FR-VIRAL-001 | TikTok export | FR acceptance, unit media | 1080x1920, 6 sec, watermark, hashtags |
| TC-025 | FR-PET-005 | Multi-pet inventory | FR acceptance, unit pet | Free/Pet+ slot behavior |
| TC-026 | FR-PET-006 | Species/rarity | FR acceptance, unit legal/pet | Five species, earned rarity, no paid random pull |
| TC-027 | FR-PET-007 | Breeding | FR acceptance, unit pet, E2E social | Two adult pets produce deterministic legendary child |
| TC-028 | FR-PET-008 | Grandma rescue | FR acceptance, unit pet | 7-day neglect moves pet; free 3-day rescue |
| TC-029 | FR-SOCIAL-001 | Friend graph | FR acceptance, unit social, E2E social | Invite code friendship; under-13 search disabled |
| TC-030 | FR-SOCIAL-002 | PetPair | FR acceptance, unit social, E2E social | Co-parent pair, receipt, one-sided care detection |
| TC-031 | FR-SOCIAL-003 | Trust trade | FR acceptance, unit social, E2E social | Both confirmations required; atomic owner swap |
| TC-032 | FR-SOCIAL-004 | Ceremony | FR acceptance, unit social, E2E social | Shared room, married cosmetic, share clip flag |
| TC-033 | FR-VIRAL-002 | Daily Drama | FR acceptance, unit media | One event/day/pet and 6-sec share clip |
| TC-034 | FR-VIRAL-003 | Generative pet | FR acceptance, unit media | One-of-one palette; offensive prompt rejection |
| TC-035 | FR-ECON-001 | Currency ledger | FR acceptance, unit economy, E2E monetization | Double-entry balance, no overdraft, reconciliation |
| TC-036 | FR-ECON-002 | IAP catalog | FR acceptance, unit economy | Direct non-random catalog; receipt validation |
| TC-037 | FR-ECON-003 | UGC couture | FR acceptance, unit economy | Creator rev-share ledger entry |
| TC-038 | FR-SUB-001 | Pet+ | FR acceptance, unit economy | Restore purchase toggles entitlement |
| TC-039 | FR-SUB-002 | Family tier | FR acceptance, unit economy, E2E kid | Family dashboard, 5 child profiles, controls |
| TC-040 | FR-ADS-001 | Rewarded video | FR acceptance, unit economy | Reward completion grants coins; interstitial rejected |
| TC-041 | FR-ADS-002 | Kid ad gate | FR acceptance, unit economy, E2E kid | Under-13 contextual-only enforcement |
| TC-042 | FR-VIRAL-004 | Battle pass | FR acceptance, unit economy | 4 weeks, 40 tiers, premium entitlement |
| TC-043 | FR-VIRAL-005 | Push | FR acceptance, unit media | Quiet hours and frequency caps |
| TC-044 | FR-OBS-002 | Anti-cheat audit | FR acceptance, unit obs, E2E B2B | Invalid signature goes to ban review; ledger drift alert |
| TC-045 | FR-I18N-001 | Localization | FR acceptance, unit i18n | 9 locales and Vietnamese font fallback |
| TC-046 | FR-I18N-002 | Payment rails | FR acceptance, unit i18n | VN rails, tax-inclusive display |
| TC-047 | FR-A11Y-001 | Accessibility | FR acceptance, unit a11y | Contrast, reduced motion, labels |
| TC-048 | FR-AI-003 | AI v2 | FR acceptance, unit AI | 13+ contextual reaction; kids scripted only |
| TC-049 | FR-B2B-001 | Tenant client | FR acceptance, unit B2B, E2E B2B | Tenant theme resolution and mascot count |
| TC-050 | FR-B2B-002 | Tenant partition | FR acceptance, unit B2B, E2E B2B | RLS select filters rows; tenant mismatch rejected |
| TC-051 | FR-B2B-003 | PetOS console | FR acceptance, unit B2B | Theme upload, quest CMS, KPI dashboard features |
| TC-052 | FR-B2B-004 | Techcombank tenant | FR acceptance, unit B2B, E2E B2B | Savings quest, SSO, financial quiz |
| TC-053 | FR-B2B-005 | Viettel tenant | FR acceptance, unit B2B, E2E B2B | Top-up quest, SSO, SIM binding |

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
2. No FR row remains in `accepted` state.
3. All 53 FR acceptance tests exist.
4. Unit tests cover every exported domain service.
5. E2E tests cover the five product journeys above.
6. Manual regression checklist is assigned before app-store submission.
