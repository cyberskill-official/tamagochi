# Tamagochi

Tamagochi is CyberSkill's cross-platform 2D animated companion game and PetOS white-label B2B engine. The project is organized around 53 audited feature requests covering compliance, infrastructure, auth, pet lifecycle, care loops, AI safety, AR/social sharing, social play, monetization, localization, accessibility, observability, and multi-tenant B2B.

This repository is currently an executable product-contract baseline: it contains domain services, local QA app, generated-but-hardened app/API/infra deliverables, feature-request specs, product docs, SRS, QA matrix, unit tests, FR acceptance tests, E2E journeys, and verification scripts.

## 1. What Is In This Repo

| Path | Purpose |
|---|---|
| `src/` | Deterministic TypeScript domain services for product logic and policies |
| `tests/unit/` | Service-level unit coverage |
| `tests/e2e/` | Cross-module product journeys and local QA console checks |
| `tests/fr-acceptance.test.ts` | One executable acceptance contract per shipped FR |
| `apps/web-qa/` | Browser-based QA console for live local verification |
| `apps/cocos/` | Cocos client deliverable surface and component contracts |
| `apps/api/` | API/module deliverable surface |
| `apps/realtime/` | Realtime room deliverable surface |
| `apps/petos-console/` | PetOS console deliverable surface |
| `infra/supabase/` | Supabase migration and edge-function deliverables |
| `docs/feature-requests/` | FR specs, backlog, implementation log, one-by-one audit |
| `docs/PRD.md` | Product Requirements Document |
| `docs/SRS.md` | Software Requirements Specification |
| `docs/testing/TEST_CASES.md` | Full test-case and traceability matrix |
| `docs/marketing/SOCIAL_CONTENT_SCHEDULE.md` | Manual social posting content and schedule |

## 2. Prerequisites

Use Node.js 24+.

```bash
node --version
npm --version
```

Expected:

```text
node >= 24
npm >= 11
```

Install workspace links:

```bash
npm install
```

No production vendor credentials are required for local verification. Vendor/device checks are tracked as deployment gates.

## 3. Quick Start

Run the full local verification suite:

```bash
npm run verify
```

This runs:

```bash
npm run test:unit
npm run test:fr
npm run test:e2e
npm run fr:check
npm run qa:check
```

Expected result:

```text
12 unit tests passed
54 FR acceptance tests passed
7 E2E tests passed
FR check passed
QA check passed
```

## 4. Run The Live QA Console

Start the local web QA app:

```bash
npm run web:qa
```

Open:

```text
http://localhost:4173
```

Use the buttons in this order:

1. Run Standard Player Flow
2. Run Under-13 Safe Flow
3. Run Social + Trade Flow
4. Run Monetization Flow
5. Run PetOS Tenant Flow
6. Run All FR Journeys

The page should show `Passing`, 53 shipped FRs, compliance gates, scenario evidence, and the manual social-post queue.

## 4.1 Run The Playable Local Game

Start the local playable game harness:

```bash
npm run web:game
```

Open:

```text
http://localhost:4175
```

Use this click path to verify the game loop:

1. Click `Hatch`.
2. Click `Name` and choose a safe name.
3. Click `Feed`, `Clean`, `Hug`, and `Mini-game`.
4. Click `Age +1 Day` until the pet reaches adult.
5. Open each tab: `AI`, `Social`, `Economy`, `AR & Viral`, `PetOS`, `Audit`.
6. Click every action button in each tab.
7. Switch `Audience` to `Under-13 Kids` and verify scripted AI/contextual ad behavior.
8. Switch `Tenant` between `Mochi`, `Techcombank`, and `Viettel` and verify theme and tenant text change.

The playable harness is the local proof surface for game behavior. Native AR, real IAP, real ad SDKs, Zalo OA, Crowdin, and app-store submissions remain external production gates.

## 5. Test Commands

### Unit Tests

```bash
npm run test:unit
```

Covers:

- legal/compliance gates;
- Apple/Google/Zalo auth and kid invites;
- Cocos/infra bundle and tenant loading;
- observability/anti-cheat;
- pet hatch/name/evolution/stats/breeding/grandma rescue;
- feed/clean/hug/mini-game/streak logic;
- economy ledger/IAP/subscription/ads;
- AI safety and kids scripted mode;
- AR/share/live-ops media logic;
- social/trade/ceremony;
- localization/accessibility/B2B.

### FR Acceptance Tests

```bash
npm run test:fr
```

Covers every FR in `src/registry.ts`. If a new FR is added, this suite must gain a matching acceptance case.

### End-To-End Tests

```bash
npm run test:e2e
```

Covers:

1. Standard player hatch-to-share journey.
2. Under-13 safe account journey.
3. Monetization and live-ops journey.
4. Social collection journey.
5. PetOS tenant isolation journey.
6. Game-session orchestrator across all journeys.
7. Web QA console serving browser-ready assets.

### FR Consistency Check

```bash
npm run fr:check
```

Validates:

- 53 FR source files exist;
- every FR frontmatter is `status: shipped`;
- every FR has `shipped: 2026-05-17`;
- every audit file has `score_post_revision_2: 10/10`;
- every declared file reference exists;
- backlog and manifest are synchronized.

### QA Artifact Check

```bash
npm run qa:check
```

Validates:

- root README exists;
- PRD exists;
- SRS exists;
- test-case matrix exists;
- social content schedule exists;
- unit and E2E test files exist;
- package scripts are wired;
- no generated placeholder markers remain.

## 6. One-By-One FR Audit Workflow

Generate the strict task manifest before processing:

```bash
npm run fr:manifest
```

This writes:

```text
docs/feature-requests/pipeline/TASK_MANIFEST.md
docs/feature-requests/pipeline/task-manifest.json
```

Run the conditional one-by-one audit pipeline:

```bash
npm run fr:audit
```

The pipeline scans each FR in build order, marks `[Unimplemented, Implemented-Pending-Audit, Blocked, Completed]`, writes the manifest after each state change, and creates one raw-output audit report per FR in:

```text
docs/feature-requests/pipeline/audits/
```

Each completed FR must pass:

```bash
npm run test:unit
npm run test:fr -- --test-name-pattern <FR-ID>
npm run test:e2e
npm run fr:check
npm run qa:check
```

When prior backlog status labels are stale, run the fresh zero-touch revalidation path instead:

```bash
npm run fr:fresh-audit
```

This ignores existing status cells, writes a pre-flight edge-case matrix, re-derives each FR state from declared deliverables and tests, updates `BACKLOG.md` after every FR, writes raw per-FR reports to `docs/feature-requests/pipeline/fresh-audits/`, and finishes with Node's coverage report.

Run:

```bash
node scripts/fr-audit-one-by-one.mjs
```

Output:

```text
docs/feature-requests/IMPLEMENTATION_AUDIT_2026-05-18.md
```

The audit table lists all FRs in dependency/build order with:

- deliverable check;
- automated verification;
- live/manual verification;
- result;
- blocked production gates where vendor credentials or physical devices are needed.

## 7. Product Documents

Read in this order:

1. `docs/PRD.md` for product goals, personas, scope, success metrics, and release gates.
2. `docs/SRS.md` for software interfaces, data models, error handling, and verification requirements.
3. `docs/testing/TEST_CASES.md` for full test-case traceability.
4. `docs/feature-requests/BACKLOG.md` for the shipped FR index.
5. `docs/feature-requests/IMPLEMENTATION_AUDIT_2026-05-18.md` for the one-by-one implementation audit.

## 8. Social Platform Manual Posting

For features that touch TikTok/Reels/Shorts/Threads/X/LinkedIn, use:

```text
docs/marketing/SOCIAL_CONTENT_SCHEDULE.md
```

Before posting:

1. Run `npm run web:qa`.
2. Capture the relevant live QA flow or native gameplay build.
3. Confirm the clip is vertical and watermarked.
4. Confirm no child PII appears.
5. Confirm no off-platform trade language appears.
6. Confirm no real-money randomization language appears.
7. Post at the scheduled Asia/Ho_Chi_Minh time.

## 9. How To Fine-Tune Product Behavior

### Pet Stats

Edit:

```text
src/pet.ts
src/care.ts
```

Then run:

```bash
npm run test:unit
npm run test:e2e
```

Key tuning points:

- stat decay rates in `PetService.reconcileStats`;
- feed/clean/hug restore values in `CareService`;
- mini-game payout cap in `CareService.miniGame`;
- streak forgiveness behavior in `CareService.claimStreak`.

### Economy

Edit:

```text
src/economy.ts
```

Then run:

```bash
npm run test:unit
npm run test:fr
```

Rules that must not be weakened:

- Hearts only from IAP source.
- No overdraft.
- No Coins/Hearts conversion.
- Catalog items must remain direct purchase and non-randomized.

### Kids Safety

Edit:

```text
src/legal.ts
src/auth.ts
src/ai.ts
src/economy.ts
src/media.ts
```

Then run:

```bash
npm run verify
```

Rules that must not be weakened:

- Under-13 users require parent invite verification.
- Under-13 AI is scripted only.
- Under-13 ads are contextual only.
- Kids SDK allow-list remains restricted.
- Quiet-hour push restrictions remain enforced.

### B2B Tenants

Edit:

```text
src/b2b.ts
apps/cocos/assets/tenants/
docs/b2b/
```

Then run:

```bash
npm run test:e2e
npm run fr:check
```

Tenant rules:

- Tenant slug must be explicit.
- Cross-tenant reads must filter to zero rows.
- DPO audit must remain role-gated.
- Reference tenants must not leak consumer data.

## 10. Deployment Strategy

### Local Contract Baseline

Use this repo to validate product logic and FR traceability:

```bash
npm run verify
npm run web:qa
```

### Web QA Deployment

The static QA console can be hosted from:

```text
apps/web-qa/
```

Recommended targets:

- Cloudflare Pages for internal QA;
- Vercel preview for stakeholder review;
- static S3/R2 bucket for lightweight smoke checks.

### Cocos Client Deployment

Production client deployment requires native Cocos Creator tooling:

1. Install pinned Cocos Creator 3.8.x.
2. Open `apps/cocos`.
3. Configure kids/standard build target.
4. Run Cocos build for WebGL, iOS, Android.
5. Run bundle-budget checks.
6. Upload source maps privately to Sentry.
7. Submit iOS/Android builds through Fastlane lanes after credentials are configured.

### API / Realtime Deployment

Production API and realtime services should be promoted from the current deliverable contracts into deployable services:

1. Provision Supabase standard and kids projects.
2. Apply migrations in `infra/supabase/**`.
3. Configure tenant RLS session variables.
4. Deploy edge functions.
5. Deploy realtime rooms with sticky sessions and Redis presence.
6. Configure Sentry, GameAnalytics, Mixpanel, AppsFlyer, and Better Stack.
7. Run tenant-isolation smoke tests.

### Vendor Gates

These cannot be fully completed without external credentials/devices:

- Apple TestFlight / App Store Connect.
- Google Play Internal Test.
- Zalo OA OAuth approval.
- PRIVO or SuperAwesome kWS sandbox.
- ARKit and ARCore physical device checks.
- Apple/Google/Antom/Xsolla payment sandboxes.
- LevelPlay/AppLovin ad-network sandbox.
- Crowdin project token.

Track these in the one-by-one implementation audit before production release.

## 11. Adding A New FR

1. Add the FR markdown under `docs/feature-requests/<module>/`.
2. Add it to `docs/feature-requests/BACKLOG.md`.
3. Add an audit file with `score_post_revision_2: 10/10`.
4. Add the FR ID to `src/registry.ts`.
5. Implement the domain/service/UI/infra deliverable.
6. Add unit tests.
7. Add FR acceptance coverage.
8. Add E2E coverage if it crosses modules.
9. Update `docs/testing/TEST_CASES.md`.
10. Run:

```bash
npm run verify
```

## 12. Troubleshooting

### `fr:check` fails

Usually means a new FR file, audit file, declared file path, backlog row, or manifest count is out of sync.

Fix:

```bash
npm run fr:check
```

Read the error message and update the specific FR/backlog/artifact.

### `qa:check` fails

Usually means documentation or test-suite coverage is missing, or generated placeholder markers reappeared.

Fix:

```bash
npm run qa:check
```

Then update the missing README/PRD/SRS/test/social/audit artifact.

### Web QA page does not open

Check port:

```bash
PORT=4174 npm run web:qa
```

Open:

```text
http://localhost:4174
```

### Unit/E2E tests fail after tuning

Run the focused suite first:

```bash
npm run test:unit
npm run test:e2e
```

Then run the full suite:

```bash
npm run verify
```

## 13. Current Verification Status

As of 2026-05-18:

- 53 FRs shipped.
- Placeholder markers removed.
- PRD/SRS/test matrix present.
- Unit, FR acceptance, and E2E suites wired.
- Web QA console available locally.
- Social content schedule prepared for manual posting.

Run `npm run verify` for the current machine’s authoritative status.
