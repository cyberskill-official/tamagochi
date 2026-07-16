# Tamagochi Software Requirements Specification

**Version:** 1.0.0  
**Date:** 2026-05-17  
**Status:** Executable contract baseline  
**Related documents:** `docs/PRD.md`, `docs/testing/TEST_CASES.md`, `docs/tasks/BACKLOG.md`

## 1. Purpose

This SRS describes the software behavior, interfaces, data models, non-functional requirements, and verification expectations for Tamagochi and PetOS. It converts the 53 shipped tasks into implementation-level requirements that can be tested locally and expanded into production services.

## 2. System Overview

The system is a TypeScript monorepo with these logical layers:

| Layer | Responsibility | Current executable contract |
|---|---|---|
| Client scaffold | Cocos Creator app, build target flags, asset bundles, AR/share surfaces | `apps/cocos/**`, `src/infra.ts`, `src/media.ts` |
| API/domain | Auth, pet lifecycle, care, economy, subscriptions, ads, AI, B2B | `src/*.ts` services |
| Realtime | Tenant-scoped rooms and social interactions | `src/infra.ts`, `src/social.ts` |
| Data/RLS | Supabase-style tables, migrations, tenant partition assumptions | `infra/supabase/**`, `src/b2b.ts` |
| QA | Unit, task acceptance, E2E, task file verification | `tests/**`, `scripts/task-check.mjs` |
| Docs | Product, spec, compliance, testing, tasks | `docs/**` |

## 3. External Interfaces

### 3.1 Authentication Interfaces

| Interface | Input | Output | Error cases |
|---|---|---|---|
| Apple sign-in | Apple OAuth token | 13+ user profile | invalid token |
| Google sign-in | Google OAuth token | 13+ user profile | invalid token |
| Zalo sign-in | Zalo OAuth bearer | 13+ user profile plus privacy URL | invalid token, missing privacy URL |
| Kid invite creation | parent email, Safe Harbor vendor | 8-character invite code | invalid parent email |
| Kid invite verification | invite code | under-13 child profile | missing invite |

### 3.2 Pet Interfaces

| Interface | Input | Output | Notes |
|---|---|---|---|
| Hatch | user, species, timestamp | pet, hatch token | checks quota, consent, debounce |
| Name pet | user, pet id, display name, hatch token | named pet | checks token and content safety |
| Evolve | pet, server time | new stage | server-authoritative |
| Reconcile stats | pet, server time | updated stat bars | handles offline decay |
| Breed | two adult pets | child egg | deterministic inheritance |
| Grandma rescue | grandma pet, ritual days | active pet | no real-money revival |

### 3.3 Care Interfaces

| Interface | Input | Output |
|---|---|---|
| Feed | user, pet | hunger restore and `eat` animation intent |
| Clean | user, pet | cleanliness restore and bubble particle intent |
| Hug | user, pet | happiness restore, haptic intent, daily soft cap |
| Mini-game | user, game id, score | validated coin payout |
| Streak claim | user, server time | streak count, forgiveness tokens, Cozy Hour flag |

### 3.4 Economy Interfaces

| Interface | Input | Output | Invariant |
|---|---|---|---|
| Grant | user, currency, amount, source, ref | balance after | Hearts only from IAP source |
| Spend | user, currency, amount, ref | balance after | no overdraft |
| Balance | user, currency, tenant | derived balance | ledger is authoritative |
| IAP validate | platform, receipt | validation result | client claims not trusted |
| Family dashboard | family manager | controls | max 5 child profiles |
| Rewarded ad | placement, completion | coin reward | no interstitials |

### 3.5 Social Interfaces

| Interface | Input | Output |
|---|---|---|
| Invite code | user | 8-character code |
| Accept invite | inviter, invitee, code | friendship |
| PetPair create | pet, two users | shared pair |
| PetPair care receipt | pair, actor | receipt message |
| Trade | two users, two pets, confirmations | atomic swap |
| Ceremony | two users, two pets | shared room, cosmetic, share clip |

### 3.6 B2B Interfaces

| Interface | Input | Output |
|---|---|---|
| Resolve tenant theme | tenant slug | CDN theme bundle path and mascot count |
| Assert tenant context | user, requested tenant | pass/fail |
| Tenant-scoped select | rows, tenant | filtered rows |
| DPO audit | rows, role | cross-tenant rows only for DPO |
| PetOS console features | none | operator feature list |

## 4. Data Requirements

### 4.1 User Profile

Required fields: `id`, `tenantId`, `audienceAgeGate`. Optional fields: auth provider, parental verification, Pet+ entitlement, family-manager entitlement.

### 4.2 Pet

Required fields: `id`, `tenantId`, `ownerId`, `species`, `rarity`, `displayName`, `stage`, `bornAt`, `lastSeenAt`, `paletteSeed`, `audienceAgeGate`, `status`, `hunger`, `cleanliness`, `happiness`, `energy`, `traits`.

Invariants:

1. `id` must be a 26-character Crockford ULID.
2. `tenantId` must match the owner tenant at creation.
3. Under-13 pets must only be created for parent-verified users.
4. Active pet count must not exceed 3 for free players or 10 for Pet+ players.
5. Cross-tenant pet access is forbidden.

### 4.3 Currency Ledger

Required fields: `id`, `tenantId`, `userId`, `currency`, `amount`, `accountType`, `ref`, `occurredAt`.

Invariants:

1. Ledger entries must be double-entry by reference.
2. User wallet balance must derive from ledger sum.
3. Spend cannot overdraw.
4. Hearts can only enter through IAP source.
5. No Coins-to-Hearts or Hearts-to-Coins conversion exists.

### 4.4 Tenant

Required fields: tenant slug, palette, analytics workspace, rate-limit budget.

Invariants:

1. Tenant context is explicit on user profile and every player-facing row.
2. Cross-tenant reads return zero rows outside DPO audit.
3. DPO audit requires DPO role and must be logged in production.

## 5. Functional Requirements

Functional requirements are represented by the 53 shipped tasks. The authoritative list and shipped status live in `docs/tasks/BACKLOG.md`. The acceptance test suite `tests/task-acceptance.test.ts` must include one test entry for each task ID in `src/registry.ts`.

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | No unauthenticated pet/economy/social mutation; no cross-tenant access; impossible transitions flagged |
| Privacy | Under-13 PII restricted; kid sign-up via parent invite only; no public pet listing by default |
| Compliance | COPPA-2025, Vietnam PDPL, Apple Kids, Google Families, no real-money randomized loot boxes |
| Performance | Initial WebGL bundle budget <= 15 MB compressed; tenant theme bundles lazy-loaded |
| Reliability | Build scripts deterministic; ledger reconciliation detects drift; observability tags tenant/build target |
| Accessibility | WCAG-AA contrast, reduced motion, screen-reader labels, color-blind palette support |
| Localization | 9 launch locales with diacritics-safe font fallback |
| Operability | Sentry/analytics event taxonomy, DPO runbooks, B2B SLA monitoring |

## 7. Architecture Requirements

1. Domain services must be deterministic and directly unit-testable.
2. Generated scaffold files must remain present for every `new_files` and `modified_files` entry in task frontmatter.
3. `scripts/task-check.mjs` must fail if an task is not shipped, lacks a 10/10 audit, or declares a missing file.
4. `scripts/qa-check.mjs` must fail if PRD, SRS, or test-case documentation is missing or no unit/E2E tests exist.
5. Any future production API layer must wrap the same domain invariants rather than duplicating policy checks in controllers.

## 8. Verification Requirements

| Suite | Command | Purpose |
|---|---|---|
| Unit | `npm run test:unit` | Service-level branch and invariant coverage |
| task acceptance | `npm run test:task` | One automated contract per shipped task |
| End-to-end | `npm run test:e2e` | Cross-module product journeys |
| task docs/files | `npm run task:check` | task status, audit, backlog, declared file coverage |
| QA docs | `npm run qa:check` | PRD/SRS/test-case/test-suite presence |
| Full verification | `npm run verify` | All of the above |

## 9. Error Handling Requirements

1. Invalid user input must throw deterministic slug-style errors.
2. Under-13 policy violations must fail closed.
3. Cross-tenant access must fail closed.
4. Economy invalid states must fail before mutating ledger state.
5. Moderation rejects must prevent display/persistence.
6. Unsupported AR devices must gracefully fall back to Photo Studio.
7. Quiet-hour push attempts must be suppressed rather than queued.

## 10. Requirement Traceability

Detailed traceability is maintained in `docs/testing/TEST_CASES.md`. It maps every task to unit, acceptance, E2E, and manual/regression coverage.
