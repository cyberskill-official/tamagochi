---
id: FR-PET-004
title: "90-second onboarding flow (Hatch → Name → first pat → optional co-parent stub → tutorial dismiss)"
module: PET
priority: MUST
status: shipped
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead + designer"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-PET-001, FR-PET-002, FR-PET-003, FR-ART-001, FR-AUTH-001, FR-AUTH-003, FR-CARE-003, FR-SOCIAL-002, FR-OBS-001, FR-I18N-001, FR-LEGAL-001]
depends_on: [FR-PET-001, FR-PET-002, FR-PET-003, FR-ART-001]
blocks: [FR-CARE-001, FR-CARE-005]
effort_hours: 8
new_files:
  - "apps/cocos/assets/_root/onboarding/OnboardingFlow.ts"
  - "apps/cocos/assets/_root/onboarding/HatchScene.ts"
  - "apps/cocos/assets/_root/onboarding/NameScene.ts"
  - "apps/cocos/assets/_root/onboarding/FirstPatScene.ts"
  - "apps/cocos/assets/_root/onboarding/CoParentInviteStub.ts"
  - "apps/cocos/assets/_root/onboarding/TutorialDismiss.ts"
  - "apps/cocos/assets/_root/onboarding/__tests__/OnboardingFlow.spec.ts"
  - "apps/cocos/assets/_root/onboarding/__tests__/skip-conditions.spec.ts"
  - "apps/api/src/pets/onboarding/onboarding-state.service.ts"
  - "apps/api/src/pets/onboarding/__tests__/onboarding-state.spec.ts"
  - "apps/cocos/assets/i18n/en/onboarding.json"
  - "apps/cocos/assets/i18n/vi/onboarding.json"
  - "infra/supabase/standard/migrations/20260517_009_onboarding_state.sql"
  - "docs/design/onboarding-storyboard.md"
modified_files:
  - "apps/api/src/pets/pets.controller.ts"
  - "apps/cocos/assets/_root/app/AppRouter.ts"
allowed_tools:
  - "Cocos scene loader"
  - "Spine `hatch` + `idle_baby` + `care_pet` animations (FR-ART-001 contract)"
  - "Lottie UI confetti / sparkles"
  - "Howler.js audio (hatch celebrate)"
  - "Haptics tap-light + success (FR-ART-001 HapticsAdapter)"
disallowed_tools:
  - "Modal blocking overlays — onboarding is in-flow, not interruptive"
  - "Skip button before first pat (the haptic moment IS the conversion)"
  - "Onboarding gating IAP / sub purchase (post-onboarding only per Apple Guideline)"
  - "Co-parent invite at P1 — stub only, fully enabled in P2 via FR-SOCIAL-002"
risk_if_skipped: "Plan §PART 5 — ≤ 90 second onboarding is the documented retention lever. Without a tight onboarding flow, the 500-beta-tester D7 ≥ 18% capability gate (P1 exit signal) is unachievable; player drops on signup → first-pet-hatch funnel above 50% (industry norm)."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **90-second target.** The onboarding flow from "user successfully signed in for the first time" to "user dismisses tutorial + sees their pet in idle state" MUST complete in **≤ 90 seconds median, ≤ 150 seconds P95** for a player who follows the happy path. Player-driven pauses (e.g. choosing a name) MUST NOT count against this budget.

§1.2  **Five-step flow.** The onboarding flow MUST present EXACTLY five steps, in order:

1. **Hatch ceremony** — Egg animation (FR-ART-001 `hatch`); ~20 seconds; auto-progresses;
2. **Name** — Text input + content-safety (FR-PET-001 §1.5); player-paced;
3. **First pat** — Single big "tap your pet" cue, haptic + `care_pet` animation + +5 happiness (no stat displayed yet);
4. **Co-parent stub** — "Invite a grown-up / friend to share?" — at P1 this is a stub that records intent only and shows "Coming soon — we'll let you know!"; FR-SOCIAL-002 in P2 wires the real action;
5. **Tutorial dismiss** — A single-screen tutorial card showing the 4 stat-bars + "Tap your pet to interact." Single "Got it" CTA dismisses + reveals the main game scene.

§1.3  **State machine.** Onboarding state MUST be persisted to `public.onboarding_state` (one row per user) so a player who closes mid-onboarding resumes at the same step on next launch. Columns: `(user_id pk, current_step text, hatch_completed_at, name_set_at, first_pat_at, co_parent_intent boolean, tutorial_dismissed_at, started_at)`.

§1.4  **Skip conditions.** A returning user with `tutorial_dismissed_at IS NOT NULL` MUST skip onboarding entirely. A user who completed steps 1-3 but not step 4-5 resumes at step 4 on next launch. There is no "skip all" path — every player MUST complete steps 1-3 (hatch ceremony is the bonding moment).

§1.5  **First pat haptic.** The "first pat" step MUST: (a) display a single oversized tap target on the pet's body; (b) on tap, fire `HapticsAdapter.tap('light')` + play `care_pet` animation; (c) immediately apply `apply(stats, 'hug')` (+25 happiness) via the server; (d) emit `onboarding.first_pat.completed` event; (e) advance to step 4.

§1.6  **Optional co-parent stub at P1.** At P1, the co-parent step records intent only. The UI MUST: (a) show "Want to share Mochi with a friend / grown-up?"; (b) offer "Yes — tell me later" + "No thanks" CTAs; (c) regardless of choice, advance; (d) on "Yes", record `co_parent_intent=true` and queue a re-prompt notification when FR-SOCIAL-002 (P2) ships. NO email or invite code is collected at P1.

§1.7  **No IAP / sub gating during onboarding.** Apple App Store Review Guideline 3.1.3(b) (and Google equivalents) forbid upsells during onboarding for free-with-IAP apps. Onboarding MUST NOT show IAP catalogue or subscription pitches; first IAP pitch MUST be deferred to ≥ 5 minutes after tutorial dismiss.

§1.8  **Step-budget instrumentation.** Each step MUST emit:
- `onboarding.<step>.entered`
- `onboarding.<step>.completed` with `duration_ms`

`duration_ms` is the time from `entered` to `completed` per step. Server-side aggregates per-cohort funnel via FR-OBS-001 pipeline.

§1.9  **Drop-off analytics.** Players who abandon mid-flow (close app, time out, sign out) MUST be recorded: `onboarding.<step>.abandoned { reason }`. `reason` enumerates `app_killed`, `timeout_60s`, `signed_out`, `error_other`.

§1.10  **Localised copy.** Onboarding strings MUST live in `apps/cocos/assets/i18n/<locale>/onboarding.json` (per FR-I18N-001). EN + VI MUST be authored before P1 release. Other locales follow in P4.

§1.11  **Under-13 SKU adaptations.** On the kids SKU, onboarding MUST:
- skip the co-parent step entirely (kids cannot independently invite anyone — parental dashboard controls friend additions in FR-SUB-002);
- show the tutorial-card in larger fonts (1.3× base);
- ensure all CTAs are at least 88×88 pt (Apple Kids Category accessibility minimum);
- play `hatch` audio at 50% default volume (audio default is muted on kids SKU per FR-ART-001 §1.14, so this only applies if the player manually enabled audio).

§1.12  **Hatch ceremony — no skip until midpoint.** The Spine `hatch` animation (~20s) MUST play at least to midpoint (~10s) before any "Skip" CTA appears. This prevents impatient first-time players from blowing past the bonding moment. After midpoint, a "Skip ahead" CTA appears.

§1.13  **A11Y reduce-motion adaptation.** When `prefers-reduced-motion` is enabled (FR-A11Y-001), the hatch ceremony plays the simplified path: fade-in instead of egg-shake; no confetti particles; static `idle_baby` skip directly to step 2.

§1.14  **Name step UX.** The name step MUST: (a) suggest "Mochi" pre-filled (player can clear); (b) accept submission with Enter or "Save" button; (c) show server-side rejection inline ("That name is taken in your roster" / "Please choose a friendlier name" / "Names should be 2-24 characters"); (d) on rejection, focus the input + preserve text.

§1.15  **AC analytics funnel.** A scheduled job MUST query the `onboarding_state` table daily to compute the P0-pipeline funnel: signups → step 1 entered → step 1 completed → step 2 ... → tutorial dismissed. Funnel rendered in the Grafana dashboard `pet-care-funnel.json` (FR-OBS-001 §1.18).

§1.16  **Onboarding-state RLS.** The `onboarding_state` table MUST have RLS — only the player's own row is readable / writable. DPO read for support.

§1.17  **Resume token.** When a player resumes mid-flow, the client MUST: (a) call `GET /v1/onboarding/state`; (b) read `current_step`; (c) navigate to that scene; (d) preserve previously-entered data (e.g. the player's pet ID from hatch).

§1.18  **Onboarding completion grants.** On tutorial dismiss, the player MUST receive: 100 soft Coins + the "First Pat" badge. Badges live in a future FR (FR-VIRAL-004 battle pass scaffold) but the badge slot is reserved here.

§1.19  **Sentry breadcrumbs.** Each onboarding step MUST emit a Sentry breadcrumb with the step name + timestamp. This makes the first-launch crash debugging path traceable.

§1.20  **No third-party data collection during onboarding.** Per FR-OBS-001 §1.17 (PII consent before identify), `Analytics.identify` is deferred to AFTER tutorial dismiss. During onboarding, all analytics are session-scoped (anonymous identifier) until the player has consented to the policy version.

---

## §2 — Why this design

**Why ≤ 90 seconds.** Plan §PART 5 — Onboarding (≤ 90 seconds). This is a documented industry benchmark for casual mobile games. Beyond 90s, drop-off accelerates aggressively (data from Outfit7 + Roblox studios show >50% drop on onboardings over 2 minutes).

**Why exactly 5 steps.** The hatch ceremony + naming are the bonding moments — non-negotiable. First pat is the haptic conversion moment (the player feels the device respond — that's the "I'm in" instant). Co-parent stub is the optional viral hook (set the seed for P2). Tutorial dismiss is the explicit-exit transition. Any more steps inflates duration; any fewer skips a documented retention lever.

**Why a stub for co-parent at P1.** FR-SOCIAL-002 (PetPair co-parent) lands in P2. But the co-parent VIRAL hook is plan §PART 3 #1 — designing the placeholder at P1 ensures the slot exists, the storyboard locks in, AND the data on "what % of players said yes" tells us in advance whether to prioritise P2 PetPair work.

**Why no IAP gating during onboarding.** Apple Guideline 3.1.3(b) — forced subscription / IAP screens during onboarding for free-with-IAP apps is a hard rejection. The 5-minute defer matches Apple Review's empirical pattern.

**Why first-pat haptic is non-skippable until midpoint.** Plan §PART 3 — haptic + animation = the "moment of conversion." Letting impatient players skip it loses the conversion event. Midpoint compromise: bonding ceremony plays, but a "skip ahead" appears if the player genuinely wants to move on.

**Why server-side stat application during onboarding.** Per FR-PET-003 §1.5 server-authoritative. The +25 happiness from first-pat is a real stat mutation, persisted from the start. No special onboarding-only state model — consistency with the production stat system.

**Why drop-off analytics with reasons.** Funnel drop-off without reasons is useless. Knowing "60% drop at step 2 with reason=timeout_60s" vs "60% drop at step 2 with reason=app_killed" suggests different fixes (name UX vs onboarding length).

**Why under-13 SKU larger fonts + bigger CTAs.** Apple Kids Category Guideline + UX research on children 5-12 fine-motor skills + reading speed. 1.3× font + 88×88 pt minimum tap target are Apple's published baselines.

**Why kids SKU skips co-parent step.** Kids cannot independently invite anyone (COPPA + FR-SOCIAL-001 §1 + FR-AUTH-003 design). Surfacing the co-parent invite on kids SKU would be confusing UX + a regulator question.

**Why pre-fill "Mochi" as suggested name.** Plan §PART 3 example pet name. Most players accept defaults; "Mochi" branded as the launch hero + becomes the recognizable franchise mascot. Players CAN change it.

**Why 100 Coins + badge at completion.** Concrete reward = retention reinforcement. 100 Coins is enough to do 1-2 things in the first session but not enough to skip future engagement loops. Badge slot reserved for FR-VIRAL-004 battle pass.

**Why analytics `identify` deferred until after tutorial dismiss.** FR-OBS-001 §1.17 — policy-version stamping happens at sign-in (FR-AUTH-001 §1.7), but `identify` to analytics vendors carries PII context. Deferring until after tutorial dismiss aligns with "first meaningful intent" — the player has demonstrably engaged with the product.

**Why scene-based architecture in Cocos.** Cocos's scene system is the canonical pattern for sequential gameplay flow. Each onboarding step is a scene; navigation between scenes is testable + restorable from `current_step`.

**Why localized copy from day one (EN + VI).** P1 soft-launch is VN-first (plan §PART 7). Without VI copy at P1, the launch market UX is broken. EN is the dev / fallback locale.

---

## §3 — API contract & code shape

### 3.1 — Onboarding state migration

```sql
-- infra/supabase/standard/migrations/20260517_009_onboarding_state.sql
create table public.onboarding_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_step text not null default 'hatch'
                check (current_step in ('hatch','name','first_pat','co_parent_stub','tutorial','done')),
  hatch_completed_at      timestamptz,
  name_set_at             timestamptz,
  first_pat_at            timestamptz,
  co_parent_intent        boolean default false,
  tutorial_dismissed_at   timestamptz,
  started_at              timestamptz not null default now(),
  tenant_id               text not null default 'mochi'
);
alter table public.onboarding_state enable row level security;
create policy "onboarding self" on public.onboarding_state for select using (user_id = auth.uid());
create policy "onboarding self update" on public.onboarding_state for update using (user_id = auth.uid());
```

### 3.2 — Onboarding state service

```typescript
// apps/api/src/pets/onboarding/onboarding-state.service.ts
@Injectable()
export class OnboardingStateService {
  constructor(private readonly supa: SupabaseClient) {}

  async getOrInit(userId: string): Promise<OnboardingState> {
    const { data, error } = await this.supa.from('onboarding_state')
      .select('*').eq('user_id', userId).maybeSingle();
    if (data) return data as OnboardingState;
    const { data: inserted } = await this.supa.from('onboarding_state')
      .insert({ user_id: userId }).select().single();
    return inserted as OnboardingState;
  }

  async markStepCompleted(userId: string, step: OnboardingStep, durationMs: number): Promise<void> {
    const fieldByStep: Record<OnboardingStep, string> = {
      hatch: 'hatch_completed_at',
      name: 'name_set_at',
      first_pat: 'first_pat_at',
      co_parent_stub: 'co_parent_intent',  // boolean
      tutorial: 'tutorial_dismissed_at',
    };
    const field = fieldByStep[step];
    const nextStep = this.computeNextStep(step);
    await this.supa.from('onboarding_state').update({
      [field]: step === 'co_parent_stub' ? true : new Date().toISOString(),
      current_step: nextStep,
    }).eq('user_id', userId);
    await this.audit.write({ who: userId, what: `onboarding.${step}.completed`, what_keys: { duration_ms: durationMs } });
  }

  private computeNextStep(step: OnboardingStep): OnboardingStep {
    const order: OnboardingStep[] = ['hatch','name','first_pat','co_parent_stub','tutorial','done'];
    return order[order.indexOf(step) + 1] as OnboardingStep;
  }
}
```

### 3.3 — Cocos `OnboardingFlow.ts`

```typescript
// apps/cocos/assets/_root/onboarding/OnboardingFlow.ts
import { director, _decorator, Component } from 'cc';
import { OnboardingState } from './types';

const { ccclass } = _decorator;

@ccclass('OnboardingFlow')
export class OnboardingFlow extends Component {
  async start() {
    const state = await this.fetchOnboardingState();
    if (state.current_step === 'done') {
      director.loadScene('Game');
      return;
    }
    director.loadScene(this.sceneForStep(state.current_step), () => this.passContext({ state }));
  }

  private sceneForStep(step: string): string {
    return {
      hatch: 'OnboardingHatch',
      name: 'OnboardingName',
      first_pat: 'OnboardingFirstPat',
      co_parent_stub: 'OnboardingCoParentStub',
      tutorial: 'OnboardingTutorial',
    }[step]!;
  }
}
```

### 3.4 — Cocos `FirstPatScene.ts` excerpt

```typescript
// apps/cocos/assets/_root/onboarding/FirstPatScene.ts
import { _decorator, Component, Node, EventTouch } from 'cc';
import { HapticsAdapter } from '../art/HapticsAdapter';
import { SpineLoader } from '../art/SpineLoader';
import { OnboardingApi } from './api';

@ccclass('FirstPatScene')
export class FirstPatScene extends Component {
  @property(Node) petNode!: Node;
  private entered = Date.now();

  start() {
    OnboardingApi.markEntered('first_pat');
    this.petNode.on(Node.EventType.TOUCH_END, (e: EventTouch) => this.onPat(e));
  }

  private async onPat(_e: EventTouch) {
    HapticsAdapter.tap('light');
    new SpineLoader().playContractAnimation(this.petNode.getComponent('Spine')!, 'care_pet');
    await OnboardingApi.applyFirstPat();
    await OnboardingApi.markCompleted('first_pat', Date.now() - this.entered);
    director.loadScene('OnboardingCoParentStub');
  }
}
```

---

## §4 — Acceptance criteria

**AC1.** Happy-path onboarding completes in ≤ 90 s median across 100 test runs on a 2024 mid-tier device + 4G. Verified by Detox UI test with timing assertions.

**AC2.** Onboarding state persists across app kill: closing app at step 3 + reopen resumes at step 3. Verified by Detox test simulating background → kill → relaunch.

**AC3.** Returning user with `tutorial_dismissed_at` set skips onboarding entirely. Verified by `__tests__/skip-conditions.spec.ts`.

**AC4.** Each step emits `entered` + `completed` + `duration_ms` analytics events with valid schema. Verified by `__tests__/OnboardingFlow.spec.ts` + obs schema validation.

**AC5.** Drop-off events emitted on app kill (`app_killed`) and on 60-second-no-input (`timeout_60s`). Verified by spec test.

**AC6.** First-pat haptic fires + happiness stat increments by 25 server-side. Verified by integration test driving the touch event.

**AC7.** Co-parent stub at P1 records `co_parent_intent` boolean but does NOT collect an email. Verified by spec test.

**AC8.** Under-13 SKU skips the co-parent step. Verified by spec test with `BUILD_TARGET=kids`.

**AC9.** Under-13 SKU renders tutorial in 1.3× font + 88×88 pt minimum tap targets. Verified by Playwright visual regression test.

**AC10.** Hatch ceremony Skip CTA appears at or after midpoint (≥ 10 s), not before. Verified by Detox timing test.

**AC11.** Reduce-motion mode plays simplified hatch (fade-in, no confetti). Verified by Playwright with `prefers-reduced-motion: reduce`.

**AC12.** Localized copy: VI locale renders Vietnamese strings + EN locale renders English. Verified by Detox snapshot tests in both locales.

**AC13.** Onboarding-state RLS — player A cannot read player B's onboarding_state. Verified by `__tests__/onboarding-state.spec.ts` with two seeded users.

**AC14.** `Analytics.identify` is NOT called during onboarding scenes; first identify call happens after tutorial dismiss. Verified by spy on `Analytics.identify`.

---

## §5 — Verification

### 5.1 — Onboarding state spec

```typescript
// apps/api/src/pets/onboarding/__tests__/onboarding-state.spec.ts
import { describe, it, expect } from 'vitest';
import { OnboardingStateService } from '../onboarding-state.service';

describe('FR-PET-004 — onboarding state', () => {
  const svc = new OnboardingStateService(mockSupa);

  it('initializes at step hatch on first call', async () => {
    const state = await svc.getOrInit('u1');
    expect(state.current_step).toBe('hatch');
  });

  it('marks step completed + advances current_step', async () => {
    await svc.markStepCompleted('u1', 'hatch', 18234);
    const state = await svc.getOrInit('u1');
    expect(state.current_step).toBe('name');
    expect(state.hatch_completed_at).toBeTruthy();
  });

  it('co_parent_stub records boolean intent', async () => {
    await svc.markStepCompleted('u1', 'co_parent_stub', 2100);
    const state = await svc.getOrInit('u1');
    expect(state.co_parent_intent).toBe(true);
  });

  it('returning user with tutorial_dismissed skips entire flow', async () => {
    await svc.markStepCompleted('u1', 'tutorial', 1500);
    const state = await svc.getOrInit('u1');
    expect(state.current_step).toBe('done');
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/_root/onboarding/api.ts
import { Analytics } from '../obs/Analytics';

export class OnboardingApi {
  static async markEntered(step: string): Promise<void> {
    Analytics.track(`onboarding.${step}.entered`, { ts: Date.now() });
  }
  static async markCompleted(step: string, durationMs: number): Promise<void> {
    Analytics.track(`onboarding.${step}.completed`, { duration_ms: durationMs });
    await fetch(`${process.env.API_URL}/v1/onboarding/step-completed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${getJwt()}` },
      body: JSON.stringify({ step, duration_ms: durationMs }),
    });
  }
  static async applyFirstPat(): Promise<void> {
    await fetch(`${process.env.API_URL}/v1/pets/first-pat`, {
      method: 'POST', headers: { Authorization: `Bearer ${getJwt()}` },
    });
  }
}
```

---

## §7 — Dependencies

**External:** None (uses internal Supabase + analytics scaffolds).

**Internal:** FR-PET-001 (pet created), FR-PET-002 (stage transitions show in flow), FR-PET-003 (first pat applies happiness), FR-ART-001 (hatch + care_pet animations + haptics), FR-AUTH-001/003 (signed-in player), FR-OBS-001 (analytics + Sentry breadcrumbs), FR-I18N-001 (locale bundles), FR-LEGAL-001 (`identify` deferral).

**Blocks:** FR-CARE-001 (first feed assumes pet is past onboarding), FR-CARE-005 (streak system starts after tutorial dismiss).

---

## §8 — Example payloads

### 8.1 — `onboarding.hatch.completed` event

```json
{
  "event": "onboarding.hatch.completed",
  "duration_ms": 18234,
  "user_id": "01HC7QGZK4XN8YA1J3WB6XX99",
  "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "sku": "standard",
  "build_target": "standard",
  "ts": "2026-08-12T14:36:01Z"
}
```

### 8.2 — Onboarding state row

```json
{
  "user_id": "01HC7QGZK4XN8YA1J3WB6XX99",
  "current_step": "tutorial",
  "hatch_completed_at": "2026-08-12T14:36:01Z",
  "name_set_at":       "2026-08-12T14:36:35Z",
  "first_pat_at":      "2026-08-12T14:36:50Z",
  "co_parent_intent":  true,
  "tutorial_dismissed_at": null,
  "started_at":        "2026-08-12T14:35:00Z",
  "tenant_id": "mochi"
}
```

### 8.3 — Drop-off event

```json
{
  "event": "onboarding.first_pat.abandoned",
  "reason": "timeout_60s",
  "duration_ms": 60001,
  "ts": "2026-08-12T14:37:50Z"
}
```

### 8.4 — Localised string bundle

```jsonc
// apps/cocos/assets/i18n/vi/onboarding.json
{
  "hatch.welcome": "Chào mừng! Hãy nở quả trứng của bạn!",
  "name.placeholder": "Mochi",
  "first_pat.cta": "Chạm vào Mochi để chào nhé!",
  "co_parent.title": "Muốn chia sẻ Mochi với bạn bè/người thân?",
  "tutorial.dismiss_cta": "Hiểu rồi!"
}
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** 90-second target vs 60-second? → §1.1 + §2 — 90 s aligns plan + industry data.
- **OQ-2 (resolved):** Co-parent at P1 vs deferred entirely? → §1.6 + §2 — stub at P1 captures intent + data for P2 prioritisation.
- **OQ-3 (resolved):** Default name pre-fill? → §1.14 + §2 — "Mochi" default; player can clear.
- **OQ-4 (resolved):** Tutorial single-card or carousel? → §1.2 — single card; carousel inflates time + decision fatigue.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Player closes app mid-flow | `app_killed` reason | Onboarding paused | Resume from `current_step` on next launch |
| 2 | Onboarding state row missing on first launch | `getOrInit` returns null | Init created | Auto-insert; emit `onboarding.state.init.fallback` info |
| 3 | First-pat API 500 (stat write fails) | Sentry alert | UX hangs | Retry once; on 2nd fail, advance optimistically + reconcile on next stat tick |
| 4 | Hatch ceremony animation fails to load | Cocos error | UX broken | Fallback to static egg image + auto-advance after 20 s; Sentry alert |
| 5 | Localised string missing | Resource lookup returns key | English fallback | Auto-fallback to EN; report missing-key event |
| 6 | Drop-off analytics not emitted (app killed before send) | Funnel drop unexplained | Bad metric | Use Sentry breadcrumb as secondary signal |
| 7 | Co-parent stub renders on kids SKU | Playwright UI test | Confusing UX | Build-target check in scene init; hotfix |
| 8 | Reduce-motion mode not detected | Hatch animation plays full | A11Y regression | Add an "I have motion sensitivity" toggle in Settings as fallback |
| 9 | Tutorial dismiss CTA tap not registered | UX hang | Player stuck | Add 60 s auto-dismiss as safety net + emit `tutorial.auto_dismissed` |
| 10 | Onboarding-state RLS misconfigured | Spec test fails | Privacy exposure | Re-tighten RLS; audit recent reads |
| 11 | Sentry breadcrumbs not emitted (init failure) | Crash trace empty | Debugging blind | Init Sentry early; surface init failures via console |
| 12 | First pat clamps to existing 100 happiness | No visible stat change | UX disappointment | UX shows "Mochi loves it!" regardless of clamp; stat math correct |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (60-sec session loop), plan §PART 5 (≤ 90 s onboarding), plan §PART 7 (TikTok-shareable hatch moment).

**Sub-decisions punted to ops:**
- Final tutorial card copy + visual design — owned by designer post-soft-launch.
- Coin grant amount (100 default) — Mixpanel feature flag tunable.

**Anti-patterns explicitly forbidden:**
- Modal blocking overlays.
- IAP / sub upsell during onboarding.
- Skip CTA before midpoint of hatch ceremony.
- Collecting email or invite code at the P1 co-parent stub.

**Cross-reference:** This FR completes the PET slice (FR-PET-001..004). With it, every P1 gameplay FR can assume the player has a hatched + named + first-patted pet. FR-CARE-001 picks up from "main game scene" after tutorial dismiss.
