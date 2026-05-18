---
id: FR-LEGAL-003
title: "Apple Kids Category + Google Play Families declarations + contextual-ad gate + parental external-link gate"
module: LEGAL
priority: MUST
status: shipped
verify: I
phase: P0
milestone: "Foundation Gate"
slice: 1
owner: "Founder + retained legal counsel"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-LEGAL-001, FR-LEGAL-002, FR-AUTH-003, FR-ADS-002, FR-AI-002, FR-OBS-001, FR-SUB-002]
depends_on: [FR-LEGAL-001, FR-LEGAL-002]
blocks: [FR-ADS-002, FR-SUB-002, FR-VIRAL-005]
effort_hours: 6
new_files:
  - "docs/legal/apple-kids-category-checklist.md"
  - "docs/legal/google-play-families-checklist.md"
  - "docs/legal/store-listing-kids-sku-en.md"
  - "docs/legal/store-listing-kids-sku-vi.md"
  - "docs/legal/external-link-gate-policy.md"
  - "apps/cocos/src/legal/external-link-gate.ts"
  - "apps/cocos/src/legal/__tests__/external-link-gate.spec.ts"
  - "apps/cocos/src/legal/contextual-ad-gate.ts"
modified_files:
  - "apps/cocos/fastlane/Fastfile"
  - "apps/cocos/gradle.properties"
allowed_tools:
  - "Apple App Store Connect (Kids category submission flow)"
  - "Google Play Console (Families program enrolment + Designed for Families program)"
  - "SuperAwesome kWS contextual-ad gate (depends on FR-ADS-002)"
disallowed_tools:
  - "Out-of-app web links presented to under-13 users without a parental gate"
  - "External-payment-link presentation to under-13 users (Apple/Google policy compliance)"
risk_if_skipped: "Apple Kids Category and Google Play Families both reject submissions that fail their kid-safety checklists; the under-13 SKU cannot ship without these declarations being complete and verified."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Apple Kids Category submission.** The kids SKU bundle (`world.cyberskill.tamagochi.kids`) MUST be submitted to Apple App Store Connect with the **"Kids" category** selected and the appropriate age band (5-8 OR 9-11) declared. Per Apple App Store Review Guideline 1.3 and 5.1.4, the submission MUST include: (a) a written parental-gate disclosure; (b) no behavioural advertising; (c) no out-of-app web links accessible without a parental gate; (d) no in-app purchases accessible without a parental gate; (e) no third-party analytics SDKs that are not certified by Apple for kids-category apps; (f) data-collection minimum per COPPA-2025. The submission checklist is maintained at `docs/legal/apple-kids-category-checklist.md` and MUST be re-verified before every submission.

§1.2  **Google Play Families program enrolment.** The kids SKU package MUST be enrolled in Google Play's **Families program** with a target age group of 5-8 or 9-12 declared, AND opt-in to the **Designed for Families** program for the additional curation surface. Per the Families Policy, the submission MUST include: (a) Families self-certification questionnaire complete; (b) no behavioural ads SDK; (c) per-AdMob certified content rating "General audiences"; (d) IAPs gated behind Play's Parental Approval; (e) data-safety section complete with all data-collection disclosures. Checklist at `docs/legal/google-play-families-checklist.md`.

§1.3  **Two bundle IDs / two packages.** Per FR-LEGAL-001 §1.5, the kids SKU and 13+ SKU MUST ship as separate App Store records and separate Play packages. Fastlane / Gradle MUST build two binaries from one Cocos codebase using a `build_target=kids` or `build_target=standard` flag. The flag MUST drive: bundle ID, app name (`Tamagochi Kids` vs `Tamagochi`), icon, splash screen, in-app feature flags, and SDK include list.

§1.4  **External-link gate.** Any in-app affordance that opens a URL outside the app MUST be wrapped in a parental gate when `audience_age_gate == "under-13"` is in effect. The gate MUST be a verifiable interaction (≥ 4-digit math problem, NOT a tap-to-confirm — Apple Guideline 5.1.4 specifically forbids tap-only "are you over 13?" prompts). Acceptable verification flows: (a) "What is 7 × 8?" math problem; (b) gesture-pinch + multi-second hold; (c) parental email link verification (asynchronous). Tap-only confirmations are forbidden.

§1.5  **Contextual-ad gate.** Per FR-LEGAL-001 §1.5 + this FR, the kids SKU MUST route ad requests exclusively through **SuperAwesome kWS contextual-only** mediation (see FR-ADS-002 for implementation). At the SDK level: AppLovin MAX, IronSource, AdMob, Unity Ads, and any other behavioural-mediation SDK MUST NOT be linked into the kids binary. A static analysis step (`apple-kids-category-checklist.md` §4) MUST grep the kids binary for these SDK strings as a final pre-submission gate.

§1.6  **IAP parental gate.** Every IAP-purchase confirmation surface in the kids SKU MUST display the parental-gate challenge before invoking the IAP receipt-confirmation flow. The Apple `StoreKit` purchase prompt is itself an Apple-controlled flow and may not be modified; the gate MUST appear in our app's pre-purchase screen, before the StoreKit prompt triggers. The Google Play purchase flow already has a built-in Parental Approval feature when the Families program is enrolled — the in-app gate MUST be redundant to that, not a replacement for it.

§1.7  **Store listing copy.** The kids SKU store listings (App Store + Play) MUST be authored in both English and Vietnamese at `docs/legal/store-listing-kids-sku-en.md` and `docs/legal/store-listing-kids-sku-vi.md`. The listings MUST: (a) disclose the SuperAwesome kWS contextual-ads partnership; (b) disclose the Safe Harbor certification (PRIVO or kWS, per FR-LEGAL-001); (c) NOT contain any text resembling Bandai trademarks (per AGENTS.md §8.3 denylist); (d) include a screenshot of the parental-gate flow as one of the required store screenshots.

§1.8  **Bandai IP exclusion zone.** The store listing copy + in-app marketing copy + all promotional materials MUST NOT use: the word "Tamagotchi" (or any obvious phonetic variant like "Tamagochi" — yes, despite this being the project's working directory name internally); the egg-shaped silhouette in any branding asset; the Bandai-licensed term "digital pet" in branding fields. (The project's internal codename "tamagochi" is permitted in source code and internal docs only; never in store listings or marketing. The public brand is **Mochi** — the launch hero pet's name — per plan §PART 3 examples.)

§1.9  **Subscription parental approval (Family tier).** The Family tier subscription (FR-SUB-002) MUST be wired through Apple's Family Sharing approval flow + Google Play's Family Library approval flow. If a child profile under a Family tier attempts to upgrade their tier independently, the child MUST be blocked at the in-app surface, and the parent MUST receive a notification via the Family Sharing channel.

§1.10  **Pre-submission inspection script.** A `scripts/legal/inspect-kids-binary.mjs` script MUST run as a pre-submission CI step. It MUST: (a) grep the kids binary archive for forbidden SDK strings (`AppLovin`, `IronSource`, `Adjust`, `AppsFlyer`, `Firebase` for non-essentials, `Mixpanel`, `Amplitude`); (b) verify the bundle ID matches `world.cyberskill.tamagochi.kids`; (c) verify the build flag `build_target=kids` was set; (d) emit a Slack message to `#legal-kids-submission` on PASS, blocker on FAIL.

§1.11  **Family Sharing and Restricted Mode UI test.** A Playwright + Detox UI test MUST verify: (a) parental gate appears before any external link; (b) parental gate appears before any IAP confirmation; (c) parental gate cannot be bypassed by repeated taps; (d) parental gate succeeds with a correct math answer and fails with an incorrect one; (e) Apple's Family Sharing approval flow is correctly triggered for the Family tier subscription.

§1.12  **Annual store-policy review.** Apple and Google update their kids/families policies roughly twice a year. A scheduled-task reminder MUST fire on the 1st of January and 1st of July annually to re-verify both checklists against the current policy text. The reminder is wired via `mcp__scheduled-tasks__create_scheduled_task` with a cron of `0 9 1 1,7 *`.

§1.13  **Store-review escalation contact.** A dedicated escalation contact MUST be recorded in App Store Connect AND Google Play Console: a partner-relations-level email at the retained legal counsel (Tilleke / Rouse) for use when Apple/Google reviewers raise a kids/families flag. Surface the contact at `docs/legal/apple-kids-category-checklist.md` §6.

§1.14  **Geography-of-availability.** The kids SKU MUST initially be made available in: VN, PH, ID, US, EU member states, UK, JP, KR, AU, NZ. Markets where Safe Harbor coverage is unclear (e.g. China — defer per plan §PART 8; Russia — defer for sanctions risk) MUST be **excluded** at submission time and re-evaluated quarterly.

---

## §2 — Why this design

**Why two bundle IDs is the right architecture.** Apple Kids and Google Families both run their certifications at the **app submission** level, not the runtime level. A single app with a runtime kids-mode flag fails both submissions' checklists — Apple specifically asks "is this app designed primarily for kids?" and the answer must be yes-or-no. Two SKUs is the only architecture that passes.

**Why the math-problem parental gate.** Apple Guideline 5.1.4 has been enforced increasingly strictly since 2024: "tap to confirm you are over 13" is no longer accepted as a parental gate. The math-problem alternative is the lowest-friction acceptable form. The pinch-and-hold gesture is the alternative for kids 5-8 who may not have the math skills yet.

**Why both Apple Family Sharing + in-app gate.** Apple Family Sharing handles the *legal* parental consent flow. The in-app gate handles the *UX* "are you sure?" friction. The two are complementary, not redundant — Apple's flow happens at OS level outside our app; our gate handles the in-app affordance that would otherwise leak to a paid surface.

**Why the SDK static-analysis is in the binary inspection script and not just in CI lint.** Some SDKs are dynamically linked at runtime via plugin packages (e.g. Cocos plugin marketplace). A source-code lint will miss those. Inspecting the final binary archive is the catch-all.

**Why Bandai IP is excluded so aggressively.** Bandai is litigious about the Tamagotchi mark (the working-directory misspelling "tamagochi" is internal-only). A store listing that says "Tamagotchi-style" or shows an egg silhouette risks a takedown letter and store removal during dispute. The launch brand "Mochi" avoids all this and is independently memorable.

**Why annual review on Jan/Jul.** Apple's policy update cadence is roughly aligned with WWDC (June) + holiday season prep (October), so a January + July review window catches both.

**Why VN+PH+ID first.** Per plan §PART 7 soft-launch markets — CPI is low, regulator engagement on kids apps is well-understood, and PRIVO/kWS both have coverage. China (PIPL + Cyberspace Administration approval) and Russia (sanctions risk) are deferred deliberately.

---

## §3 — API contract & code shape

### 3.1 — External-link gate (Cocos client)

```typescript
// apps/cocos/src/legal/external-link-gate.ts
import { audienceAgeGate, openParentalGateModal } from './audience';

export async function openExternalLink(url: string): Promise<{ opened: boolean; reason?: string }> {
  if (audienceAgeGate() !== 'under-13') {
    // 13+ SKU — open directly (still subject to platform's standard sheet)
    return openSystemBrowser(url);
  }
  const passed = await openParentalGateModal({ challenge: 'math-7x8', acceptable: ['56'] });
  if (!passed) return { opened: false, reason: 'parental_gate_failed' };
  return openSystemBrowser(url);
}
```

### 3.2 — Build-target switching (Fastlane)

```ruby
# apps/cocos/fastlane/Fastfile
lane :build_kids do
  ENV['BUILD_TARGET'] = 'kids'
  ENV['BUNDLE_ID']    = 'world.cyberskill.tamagochi.kids'
  ENV['APP_NAME']     = 'Tamagochi Kids'
  cocos_compile(target: 'kids')  # custom action sets feature flags + omits behavioural SDKs
  sh "node ../scripts/legal/inspect-kids-binary.mjs ../build/kids/ios.ipa"
  build_ios_app(scheme: "TamagochiKids")
end

lane :build_standard do
  ENV['BUILD_TARGET'] = 'standard'
  ENV['BUNDLE_ID']    = 'world.cyberskill.tamagochi'
  ENV['APP_NAME']     = 'Tamagochi'
  cocos_compile(target: 'standard')
  build_ios_app(scheme: "Tamagochi")
end
```

### 3.3 — Binary inspection script

```javascript
// scripts/legal/inspect-kids-binary.mjs
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const FORBIDDEN_STRINGS = [
  'AppLovin', 'com.applovin', 'IronSource', 'is.unity.advertisements',
  'Adjust', 'com.adjust.sdk', 'AppsFlyer', 'com.appsflyer',
  'Mixpanel', 'com.mixpanel', 'Amplitude', 'com.amplitude',
];

const archive = process.argv[2];
if (!archive) { console.error('usage: inspect-kids-binary.mjs <archive>'); process.exit(2); }

const strings = execSync(`strings "${archive}"`, { encoding: 'utf8' });
const hits = FORBIDDEN_STRINGS.filter(s => strings.includes(s));
if (hits.length > 0) {
  console.error(`FR-LEGAL-003 §1.5 fail — forbidden SDK strings in kids binary: ${hits.join(', ')}`);
  process.exit(1);
}
console.log('kids binary inspection PASS — no forbidden SDK strings found');
```

### 3.4 — Contextual-ad gate Cocos component

```typescript
// apps/cocos/src/legal/contextual-ad-gate.ts
import { audienceAgeGate } from './audience';
import { kwsShowRewardedAd } from '../ads/kws';
import { levelPlayShowRewardedAd } from '../ads/level-play';

export async function showRewardedAd(): Promise<{ rewarded: boolean }> {
  if (audienceAgeGate() === 'under-13') {
    return kwsShowRewardedAd({ context: 'pet-care', forceContextual: true });
  }
  return levelPlayShowRewardedAd({ unit: 'rewarded-pet-care' });
}
```

---

## §4 — Acceptance criteria

**AC1.** `fastlane build_kids` produces an `.ipa` whose bundle ID matches `world.cyberskill.tamagochi.kids` and an `.aab` whose package matches the same. Verified by parsing the `Info.plist` and `AndroidManifest.xml` post-build.

**AC2.** `fastlane build_standard` produces an `.ipa` whose bundle ID matches `world.cyberskill.tamagochi`. Verified similarly.

**AC3.** `scripts/legal/inspect-kids-binary.mjs` exits non-zero when fed a fixture binary containing any forbidden SDK string. Wired into CI as a kids-build post-step.

**AC4.** External-link parental gate UI test (`tests/e2e/parental-gate.spec.ts`) covers: math-problem correct → opens; math-problem incorrect → does not open; pinch-and-hold success path; tap-spam does not bypass.

**AC5.** IAP parental gate UI test: the in-app gate appears before the StoreKit / PlayBilling sheet on the kids SKU. (StoreKit / PlayBilling sheets themselves are platform-controlled and not asserted by our tests beyond presence.)

**AC6.** `docs/legal/apple-kids-category-checklist.md` and `docs/legal/google-play-families-checklist.md` exist with every required field complete (verified by `pnpm legal:check`). The Apple checklist references Apple's most recent Kids policy version; the Google checklist references the most recent Families Policy version.

**AC7.** Bandai-IP linter (a regex sweep over store listings + marketing copy) flags `Tamagotchi`, the egg-silhouette descriptor, and "digital pet" Bandai-trademark variants. Wired into `pnpm legal:check`.

**AC8.** Store listings exist in both EN and VI for the kids SKU (`store-listing-kids-sku-en.md` and `store-listing-kids-sku-vi.md`).

**AC9.** Geography-of-availability matches §1.14 exactly. Verified by reading the App Store Connect "Pricing and Availability" + Play Console "Countries / regions" CSV exports as a manual checklist item (not automatable today).

**AC10.** Annual scheduled task `legal-store-policy-review-yearly` is created on 2027-01-01 and 2027-07-01 with the prompt "Re-verify Apple Kids + Google Families checklists against current policy text." Verified by inspecting the scheduled-tasks list.

**AC11.** A test fixture asserting `audienceAgeGate() === 'under-13'` blocks `levelPlayShowRewardedAd` and routes to `kwsShowRewardedAd`. Test in `apps/cocos/src/legal/__tests__/contextual-ad-gate.spec.ts`.

---

## §5 — Verification

```typescript
// apps/cocos/src/legal/__tests__/external-link-gate.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { openExternalLink } from '../external-link-gate';
import * as audience from '../audience';

describe('FR-LEGAL-003 §1.4 — external-link gate', () => {
  it('opens directly for 13+ SKU', async () => {
    vi.spyOn(audience, 'audienceAgeGate').mockReturnValue('13+');
    const result = await openExternalLink('https://tamagochi.app/help');
    expect(result.opened).toBe(true);
  });

  it('requires correct math answer for under-13 SKU', async () => {
    vi.spyOn(audience, 'audienceAgeGate').mockReturnValue('under-13');
    vi.spyOn(audience, 'openParentalGateModal').mockResolvedValueOnce(false);
    const r1 = await openExternalLink('https://tamagochi.app/help');
    expect(r1.opened).toBe(false);
    expect(r1.reason).toBe('parental_gate_failed');

    vi.spyOn(audience, 'openParentalGateModal').mockResolvedValueOnce(true);
    const r2 = await openExternalLink('https://tamagochi.app/help');
    expect(r2.opened).toBe(true);
  });

  it('cannot be bypassed by tap-spam', async () => {
    vi.spyOn(audience, 'audienceAgeGate').mockReturnValue('under-13');
    const spy = vi.spyOn(audience, 'openParentalGateModal').mockResolvedValue(false);
    for (let i = 0; i < 20; i++) await openExternalLink('https://x');
    expect(spy).toHaveBeenCalledTimes(20);   // each invocation re-prompts; no implicit pass
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/src/legal/audience.ts
export type Audience = '13+' | 'under-13';

export function audienceAgeGate(): Audience {
  // BUILD_TARGET is baked into the binary at build time (Fastfile + Gradle property).
  return (process.env.BUILD_TARGET === 'kids') ? 'under-13' : '13+';
}

export async function openParentalGateModal(opts: {
  challenge: 'math-7x8' | 'pinch-hold';
  acceptable?: string[];
}): Promise<boolean> {
  if (opts.challenge === 'math-7x8') {
    const ans = await promptString({ label: 'What is 7 × 8?' });
    return (opts.acceptable ?? []).includes(ans.trim());
  }
  return awaitPinchHold({ minSeconds: 3 });
}
```

---

## §7 — Dependencies

**External:** App Store Connect submission (manual), Google Play Console submission (manual), Apple Family Sharing API (entitlements-pinning required), Google Play Family Library (Families program enrolment).

**Internal:**
- FR-LEGAL-001 (compliance baseline; DPO + Safe Harbor must already be in place).
- FR-LEGAL-002 (loot-box-free posture must already be in place to satisfy Apple/Google kids-policy IAP requirements).

**Blocks:** FR-ADS-002 (kWS contextual-only gate implementation), FR-SUB-002 (Family tier — Family Sharing wiring), FR-VIRAL-005 (push under-13 quiet-hours expansion).

---

## §8 — Example payloads

### 8.1 — Forbidden-SDK inspection failure output

```text
$ node scripts/legal/inspect-kids-binary.mjs build/kids/ios.ipa
FR-LEGAL-003 §1.5 fail — forbidden SDK strings in kids binary: AppLovin, AppsFlyer
exit 1
```

### 8.2 — Store-listing Bandai-IP linter hit

```text
$ pnpm legal:check
docs/legal/store-listing-kids-sku-en.md
  line 14: "Tamagotchi-style pet care" — FR-LEGAL-003 §1.8 forbids the word "Tamagotchi" (Bandai trademark).
exit 1
```

### 8.3 — Parental gate analytics event

```json
{
  "event": "parental_gate.attempt",
  "challenge": "math-7x8",
  "context": "external_link",
  "url_intent": "https://tamagochi.app/help",
  "result": "passed",
  "occurred_at": "2026-08-12T14:36:01Z",
  "audience": "under-13",
  "build_target": "kids"
}
```

### 8.4 — Apple Kids Category checklist row (excerpt)

```yaml
- requirement: "Apple App Store Review Guideline 1.3 — Kids Category"
  status: "ready_for_submission"
  evidence_file: "docs/legal/apple-kids-category-checklist.md#guideline-1-3"
  verified_by: "DPO"
  verified_on: "2026-05-17"
- requirement: "Apple App Store Review Guideline 5.1.4 — Parental Gate"
  status: "ready_for_submission"
  evidence_file: "apps/cocos/src/legal/external-link-gate.ts"
  verified_by: "Tech Lead"
  verified_on: "2026-05-17"
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Math problem too hard for 5-8? → §1.4 offers the gesture-pinch alternative for the lower age band; Apple accepts it.
- **OQ-2 (resolved):** Public brand name to avoid Bandai? → §1.8 + §2 lock the brand as "Mochi" (the launch hero pet's name). Internal codename stays "tamagochi".
- **OQ-3 (resolved):** Apple Family Sharing redundant with our in-app gate? → §2 settles — Apple handles legal; we handle UX.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Kids SKU rejected by Apple Kids Category review | App Store Connect rejection email | Submission delayed | Read rejection reason; update checklist; re-submit within 1 week |
| 2 | Kids SKU rejected by Google Play Families | Play Console alert | Submission delayed | Read rejection; update Families self-cert; re-submit |
| 3 | Forbidden SDK leaks into kids binary | Inspection script CI failure | Build blocked | Identify the SDK source (transitive Cocos dependency); replace or rebuild Cocos plugin manifest |
| 4 | External-link gate bypassed via deep link from another app | UI test fixture | COPPA exposure | Patch deep-link router to also gate; pre-submission re-inspection |
| 5 | IAP gate not shown before StoreKit/PlayBilling | UI test fixture | Apple/Google policy hit | Insert gate; ship hotfix; re-submit if necessary |
| 6 | Bandai sends a cease-and-desist over store listing | Email from Bandai counsel | Store removal risk | Legal counsel response within 7 days; rebrand if substantiated; AGENTS.md §8.3 denylist tightened |
| 7 | Apple/Google updates kids policy and our checklist drifts | Annual scheduled-task reminder + manual quarterly news watch | Future submission risk | Update checklist; re-verify before next submission |
| 8 | Family tier child upgrade attempt not blocked | UI test fixture | Family Sharing policy hit | Patch upgrade button; verify Family Sharing API call surfaces the upgrade for parental approval |
| 9 | Geography-of-availability includes a Safe-Harbor-uncovered market | Quarterly review missed | COPPA/PDPL/etc. exposure | Pull market availability; file rectification |
| 10 | Math-problem too easy after a child shares the answer in a TikTok | Anecdotal community report | Gate effectiveness weakened | Rotate the problem set monthly; add gesture+math compound for high-friction surfaces |
| 11 | Parental gate locale missing for new launch language | Locale QA gap | Gate falls through | Block release of the new locale until gate translated; add to the I18N FR's pre-launch checklist |
| 12 | Apple Family Sharing API deprecation | Apple Dev Note watch | Family tier broken | Migrate to new API; ship hotfix; coordinate with Apple Dev Relations |

---

## §11 — Notes

**Plan refs:** plan §PART 8 (Legal & Compliance) — Apple Kids Category, Google Play Families, COPPA-2025, Apple Guideline 5.1.4, Google Play Real-Money Gambling and Games policy. The "no Bandai-mark" stance is from plan §PART 8 IP paragraph.

**Sub-decisions punted to ops:**
- Specific Apple Kids policy version at submission time will be locked in the checklist file annex.
- The "pinch-and-hold minimum seconds" is set to 3 in §6 skeleton but may be tuned post-soft-launch based on parent-frustration feedback.

**Anti-patterns explicitly forbidden:**
- "Tap-to-confirm-over-13" gate — Apple Guideline 5.1.4 rejects this.
- Single binary with a kids-mode flag — submission-time category cannot be conditional.
- Allowing behavioural SDKs in the kids binary "just for crash reporting" — Sentry is the only error tracker permitted (no Firebase Crashlytics unless certified for kids).
- Marketing copy that references "Tamagotchi" or "digital pet" Bandai-licensed term anywhere consumer-facing.

**Cross-reference:** This FR is the gating substrate for submission of the kids SKU. Without all checklists complete + binary inspection green + parental gate working + store listing Bandai-clean, the kids SKU cannot ship and FR-AUTH-003 / FR-AI-002 / FR-ADS-002 / FR-SUB-002 / FR-VIRAL-005 cannot land in production.
