---
id: TASK-ADS-001
title: "Rewarded video — LevelPlay (IronSource) + AppLovin MAX waterfall + no interstitials + daily cap"
module: ADS
priority: MUST
status: done
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 1
owner: "Tech Lead + UA"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-LEGAL-003, TASK-ECON-001, TASK-CARE-005, TASK-AUTH-003, TASK-SUB-001, TASK-ADS-002, TASK-INFRA-003, TASK-OBS-001, TASK-LEGAL-001]
depends_on: [TASK-ECON-001, TASK-LEGAL-003]
blocks: [TASK-ADS-002]
effort_hours: 8
new_files:
  - "apps/api/src/ads/rewarded.controller.ts"
  - "apps/api/src/ads/rewarded.service.ts"
  - "apps/api/src/ads/levelplay-validator.ts"
  - "apps/api/src/ads/applovin-validator.ts"
  - "apps/api/src/ads/__tests__/rewarded.spec.ts"
  - "apps/cocos/native/ios/LevelPlayBridge.swift"
  - "apps/cocos/native/android/LevelPlayBridge.kt"
  - "apps/cocos/assets/_root/ads/RewardedVideoUi.ts"
  - "infra/supabase/standard/migrations/20260517_027_ad_views.sql"
modified_files: []
allowed_tools:
  - "LevelPlay (IronSource) SDK"
  - "AppLovin MAX SDK"
  - "Server-side reward validation (SSV)"
disallowed_tools:
  - "Interstitial ads (TASK-LEGAL-003 + kid-retention damage)"
  - "Behavioural ads on kids SKU (TASK-ADS-002 contextual-only)"
  - "Ads for Pet+ subscribers (TASK-SUB-001 ad-free benefit)"
  - "Client-claimed reward without server-side validation"
risk_if_skipped: "Plan §PART 6 — rewarded video is the monetization path for non-paying users + the canonical Coin earn surface beyond mini-games. Without it, free-tier ARPDAU collapses."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Only rewarded video.** No interstitials (per TASK-LEGAL-003 + kid-app guideline). No banners. No native ads. Only rewarded video.

§1.2  **Mediation waterfall.** **LevelPlay (IronSource) primary** + **AppLovin MAX fallback**. Per TASK-LEGAL-001 §1.5(a) — only on standard SKU.

§1.3  **Reward.** Each completed rewarded view grants 50 Coins via TASK-ECON-001 ledger (`ref = 'ads.rewarded:<view_id>'`).

§1.4  **Daily cap.** 8 rewarded views per player per day. Anti-grind + UX-protective. Configurable via Mixpanel flag.

§1.5  **Per-session cap.** Max 3 views per app-session (avoids ad-spam UX).

§1.6  **Cooldown.** 5 minutes between rewarded views. Player taps "Watch ad" → if within cooldown → 429 with `retry_after_sec`.

§1.7  **Server-side validation (SSV).** SDK's SSV callback hits our API. The reward IS granted only after SSV confirms.

§1.8  **No Pet+ ads.** Pet+ subscribers (TASK-SUB-001 §1.2) have "ad-free" benefit. Endpoint returns 403 `ads.pet_plus_disabled` if attempted.

§1.9  **Kids SKU forbidden.** This task is 13+ only. Kids contextual-only ads via TASK-ADS-002.

§1.10  **Endpoint — request rewarded.** `POST /v1/ads/rewarded/request` returns SDK config + view_id. Then SDK plays ad.

§1.11  **SSV webhook.** `POST /webhook/ads/levelplay/ssv` and `/webhook/ads/applovin/ssv` — validates SDK signature + matches view_id → grants Coins.

§1.12  **Anti-fraud.** SSV signature verification mandatory. Replay protection via view_id uniqueness.

§1.13  **Latency budget.** Ad load < 5s; reward grant after SSV < 1s. UX shows loading state.

§1.14  **No personalised ads.** Plan §PART 8 — even on standard SKU, default to contextual ads (non-personalised) for additional regulator margin. Player can opt-in to personalised via Settings → Ad preferences.

§1.15  **Ad-units configured per region.** VN-specific ad units (LevelPlay supports VN inventory).

§1.16  **EEA + UK consent flow.** Per GDPR — collect ad consent via OS-native UX (App Tracking Transparency on iOS; ConsentInformation on Android). Without consent → contextual ads only.

§1.17  **Audit.** Every ad view + grant audited. 7-year retention (kids) / 2-year (standard).

§1.18  **Sentry on ad SDK error.** Catch SDK loading / playback errors.

§1.19  **No ad before onboarding.** Per TASK-PET-004 §1.7 — no ads during onboarding flow.

§1.20  **Analytics.** `ads.rewarded.requested`, `ads.rewarded.shown`, `ads.rewarded.completed`, `ads.rewarded.skipped`, `ads.rewarded.cap_hit`, `ads.rewarded.failed { reason }` per TASK-OBS-001.

---

## §2 — Why this design

**Why rewarded-only.** Plan §PART 6 — interstitials destroy retention especially for kid-skewing apps. Banners feel low-rent.

**Why LevelPlay + AppLovin.** Plan §PART 6 — LevelPlay has VN inventory; AppLovin MAX is the fallback giant. Mediation maximises fill rate.

**Why daily 8 cap.** Anti-grind. 8 × 50 = 400 Coins/day from ads ≈ same as 2 surprise-egg openings. Coherent with the TASK-PET-006 economy.

**Why SSV.** Plan §PART 4 — client-claimed rewards are forged trivially.

**Why no Pet+ ads.** Plan §PART 6 — ad-free is a key subscription perk.

**Why contextual default.** Plan §PART 8 — GDPR + Apple ATT + Google Privacy Sandbox. Personalised has higher fill but compliance cost.

**Why no onboarding ads.** Plan §PART 5 + Apple Guideline.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/ads/rewarded.service.ts (excerpt)
async requestRewarded(u: AuthedUser) {
  if (await this.sub.tier(u.id) === 'pet_plus') throw new HttpException('ads.pet_plus_disabled', 403);
  if (await this.sku(u) === 'kids') throw new HttpException('ads.kids_forbidden', 403);
  await this.cooldown.assertNotInCooldown(u.id);
  if (await this.dailyCount(u.id) >= 8) throw new HttpException('ads.daily_cap', 429);
  if (await this.sessionCount(u.id) >= 3) throw new HttpException('ads.session_cap', 429);
  const viewId = generateUlid();
  await this.supa.from('ad_views').insert({ id: viewId, user_id: u.id, requested_at: new Date(), tenant_id: u.tenant_id });
  return { view_id: viewId, sdk_config: this.sdkConfig(u) };
}

async handleSsv(req: Request, vendor: 'levelplay' | 'applovin') {
  const validator = vendor === 'levelplay' ? this.lpValidator : this.alValidator;
  const result = await validator.verify(req);
  if (!result.valid) { this.audit.emit('ads.ssv.invalid', { vendor }); throw new HttpException('invalid', 401); }
  const view = await this.supa.from('ad_views').select('*').eq('id', result.view_id).single();
  if (view.data.completed) return;  // idempotent
  if (view.data.user_id !== result.user_id) throw new HttpException('mismatched', 422);
  await this.ledger.grant(view.data.user_id, 'coins', 50, `ads.rewarded:${result.view_id}`, view.data.tenant_id, 'system_source');
  await this.supa.from('ad_views').update({ completed: true, completed_at: new Date(), vendor }).eq('id', result.view_id);
  this.audit.emit('ads.rewarded.completed', { view_id: result.view_id });
}
```

```sql
create table public.ad_views (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  vendor text check (vendor in ('levelplay','applovin')),
  requested_at timestamptz not null,
  completed boolean not null default false,
  completed_at timestamptz,
  reward_coins int not null default 50,
  ssv_signature text,
  tenant_id text not null default 'mochi'
);
create index on public.ad_views (user_id, requested_at desc);
alter table public.ad_views enable row level security;
create policy "ad_views self" on public.ad_views for select using (user_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** Rewarded view request returns view_id. Verified.
**AC2.** SSV validates + grants Coins. Verified.
**AC3.** Pet+ user request returns 403. Verified.
**AC4.** Kids SKU returns 403. Verified.
**AC5.** Daily cap 8 enforced. Verified.
**AC6.** Session cap 3 enforced. Verified.
**AC7.** 5-min cooldown enforced. Verified.
**AC8.** SSV signature forgery rejected. Verified.
**AC9.** Replay of same view_id no double-grant. Verified.
**AC10.** No personalised ads by default (consent default contextual). Verified.
**AC11.** No ads during onboarding. Verified.
**AC12.** AppLovin fallback on LevelPlay failure. Verified.

---

## §5 — Verification

```typescript
describe('TASK-ADS-001 — rewarded', () => {
  it('grants 50 Coins on valid SSV', async () => {
    const { view_id } = await svc.requestRewarded(user('u1'));
    await svc.handleSsv(mockSsvRequest({ view_id, user_id: user('u1').id }), 'levelplay');
    expect(await ledger.balance('u1', 'coins')).toBe(50);
  });

  it('idempotent on duplicate SSV', async () => {
    const { view_id } = await svc.requestRewarded(user('u1'));
    await svc.handleSsv(mockSsvRequest({ view_id, user_id: user('u1').id }), 'levelplay');
    await svc.handleSsv(mockSsvRequest({ view_id, user_id: user('u1').id }), 'levelplay');
    expect(await ledger.balance('u1', 'coins')).toBe(50); // not 100
  });

  it('blocks Pet+ users', async () => {
    await mockPetPlus('u1');
    await expect(svc.requestRewarded(user('u1'))).rejects.toMatchObject({ status: 403 });
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/ads/levelplay-validator.ts
@Injectable()
export class LevelPlayValidator {
  async verify(req: Request): Promise<{ valid: boolean; view_id?: string; user_id?: string }> {
    const sig = req.headers['x-ironsrc-signature'] as string;
    const body = await req.text();
    const expected = createHmac('sha256', process.env.LEVELPLAY_SECRET!).update(body).digest('hex');
    if (sig !== expected) return { valid: false };
    const j = JSON.parse(body);
    return { valid: true, view_id: j.customParameters?.view_id, user_id: j.customParameters?.user_id };
  }
}
```

---

## §7 — Dependencies

**External:** LevelPlay (IronSource); AppLovin MAX SDK.
**Internal:** TASK-ECON-001 ledger, TASK-LEGAL-003 SKU + ad policy, TASK-SUB-001 (Pet+ ad-free).
**Blocks:** TASK-ADS-002 (kids contextual gate).

---

## §8 — Example payloads

```http
POST /v1/ads/rewarded/request
→ 200 { "view_id": "01HAD...", "sdk_config": {...}, "expected_reward_coins": 50 }
```

```http
POST /webhook/ads/levelplay/ssv
X-IronSrc-Signature: ...
{ "customParameters": { "view_id": "01HAD...", "user_id": "01HU..." }, ... }
→ 200 ok
```

```json
{ "event": "ads.rewarded.completed", "view_id": "01HAD...", "user_id": "01HU...", "vendor": "levelplay", "reward_coins": 50 }
```

```json
{ "error": "ads.daily_cap", "current": 8, "limit": 8 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Interstitials? → §`disallowed_tools` — never.
- **OQ-2 (resolved):** Daily cap 8? → §1.4 + §2.
- **OQ-3 (resolved):** Personalised default? → §1.14 — no.
- **OQ-4 (resolved):** Pet+ exclusion? → §1.8 — yes.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | LevelPlay fill rate low | Metric | Fallback to AppLovin | Mediation handles |
| 2 | SSV signature mismatch | Validator | Reject + audit | Investigate vendor secret rotation |
| 3 | SSV not received | Polling | Reward not granted | Manual reconciliation; ledger drift OK if user re-watches |
| 4 | Pet+ entitlement stub returns wrong | TASK-SUB-001 wired | Ads to Pet+ accidentally | Cache invalidation |
| 5 | Kids SKU bypass | RLS | Blocked | Verified |
| 6 | Daily cap counter Redis lost | Conservative | Cap holds | Reset on recovery |
| 7 | Onboarding ad shown | UI test | Apple/Google review risk | Build-target gate |
| 8 | Behavioural ad on kids accidentally | TASK-ADS-002 catches | COPPA risk | Audit |
| 9 | Consent flow not invoked in EEA | Apple ATT | Personalised data leaked | Pre-launch QA |
| 10 | Ad unit ID misconfig | Vendor monitor | No ads served | Rotate config |
| 11 | Audit growth | Disk | 7-yr / 2-yr retention | Configured |
| 12 | Reward exceeds cap via timezone drift | TZ-aware | Bounded | Locked |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (rewarded video + LevelPlay + AppLovin).

**Sub-decisions punted to ops:** Per-ad-unit pricing + per-region waterfall.

**Anti-patterns explicitly forbidden:**
- Interstitials.
- Banners.
- Client-claimed reward.
- Ads on Pet+.

**Cross-reference:** TASK-ADS-002 contextual kid gate; TASK-SUB-001 ad-free benefit.
