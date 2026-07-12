---
id: FR-ADS-002
title: "Under-13 SKU SuperAwesome kWS contextual-only ad gate — no behavioural ads ever"
module: ADS
priority: MUST
status: done
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 1
owner: "Tech Lead + DPO"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-ADS-001, FR-AUTH-003, FR-LEGAL-001, FR-LEGAL-003, FR-ECON-001, FR-OBS-001, FR-INFRA-003]
depends_on: [FR-ADS-001, FR-AUTH-003, FR-LEGAL-001]
blocks: []
effort_hours: 8
new_files:
  - "apps/api/src/ads/kws/kws.controller.ts"
  - "apps/api/src/ads/kws/kws.service.ts"
  - "apps/api/src/ads/kws/__tests__/kws.spec.ts"
  - "apps/cocos/native/ios/KwsBridge.swift"
  - "apps/cocos/native/android/KwsBridge.kt"
  - "apps/cocos/assets/_root/ads/KidContextualAdUi.ts"
modified_files: []
allowed_tools:
  - "SuperAwesome kWS Ad SDK (kid-safe contextual)"
  - "Server-side reward callback"
disallowed_tools:
  - "LevelPlay / AppLovin / Adjust / AppsFlyer / Adjust on kids SKU (FR-LEGAL-001 §1.5(a))"
  - "Behavioural tracking on under-13"
  - "Cross-app device identifiers"
  - "Ad-frequency above 3/day on kids SKU (more conservative than 13+ cap of 8)"
risk_if_skipped: "FR-LEGAL-001 §1.5(d) — kids SKU MUST use only kWS contextual ads. Without this FR, kids SKU has no compliant monetization path."
audience_age_gate: "under-13"
---

## §1 — Description (BCP-14 normative)

§1.1  **kWS only.** Under-13 SKU MUST use ONLY SuperAwesome kWS contextual-only ad SDK. No LevelPlay / AppLovin / behavioural mediation.

§1.2  **Lower cap than 13+.** Kids SKU max 3 rewarded views per day (vs 8 for 13+ per FR-ADS-001). Plan §PART 6 + kid-app guidelines.

§1.3  **Contextual only.** Ads MUST be served based on app context (children's pet game) NOT user behavioural profile. kWS SDK is purpose-built for this.

§1.4  **Reward.** 30 Coins per rewarded view on kids SKU (vs 50 on 13+). Lower to reflect:
- Lower ad fill rate (kid-safe inventory smaller).
- Anti-grind for kids.

§1.5  **Per-session cap.** 2 per session (vs 3 on 13+).

§1.6  **Cooldown.** 10 minutes between views (vs 5 min on 13+).

§1.7  **Parental override.** Per FR-SUB-002 §1.8, parent can fully disable ads via Family tier dashboard. When disabled → 403 `ads.parental_disabled`.

§1.8  **Endpoint — kid rewarded request.** `POST /v1/ads/kids/rewarded/request` — separate from FR-ADS-001 endpoint. Validates kids-SKU + parental override.

§1.9  **kWS SSV.** Similar to FR-ADS-001 §1.11 — kWS server-side validation callback.

§1.10  **No personalised pre-roll EVER.** kWS handles this by default; build configuration locks personalised-disabled.

§1.11  **Audit retention.** 7 years (COPPA).

§1.12  **No ad before onboarding** (FR-PET-004) + no ads in first 10 minutes of any session (kids-app industry pattern).

§1.13  **Ad content review.** kWS pre-filters all served ads through their COPPA-2025-compliant content review. Tamagochi's responsibility is to invoke the SDK correctly + log reward properly.

§1.14  **Reward delivery.** Per FR-ECON-001 — 30 Coins granted via ledger after kWS SSV.

§1.15  **No social-comparison surfaces.** Per FR-LEGAL-003 + kid-app guideline. No "X friends watched ads today" UX.

§1.16  **Replay protection.** Same as FR-ADS-001 §1.12 + extended view_id uniqueness.

§1.17  **kWS account separation.** Kids ad inventory + analytics live in separate kWS workspace (vs 13+). No cross-workspace data sharing.

§1.18  **Tenant scoping.** Per FR-INFRA-003 tenant model — B2B tenant kids ads use tenant's kWS sub-workspace if configured.

§1.19  **Sentry monitoring.** SDK errors + SSV mismatches alert immediately.

§1.20  **Analytics.** `ads.kids.rewarded.requested`, `ads.kids.rewarded.completed`, `ads.kids.cap_hit`, `ads.kids.parental_disabled` per FR-OBS-001.

---

## §2 — Why this design

**Why kWS.** Plan §PART 6 + plan §PART 8 — only ad SDK certified contextual-only for under-13. Required by FR-LEGAL-001 §1.5(d).

**Why lower cap.** Plan §PART 6 + kid-app guidelines — kids' attention spans + retention are more fragile.

**Why 30 Coins not 50.** Plan §PART 6 — kid ad fill rate is lower; lower Coin reward stays economically coherent.

**Why parental override.** Plan §PART 8 FR-SUB-002 — Family tier offers full ad disable.

**Why first-10-min ad-free.** Industry convention — kids need to engage with the content before any ads.

**Why kWS account separation.** COPPA-2025 — data segregation between under-13 + 13+ at the vendor level.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/ads/kws/kws.service.ts (excerpt)
async requestKidRewarded(u: AuthedUser) {
  if (await this.sku(u) !== 'kids') throw new HttpException('ads.kids_only', 403);
  const family = await this.family.linkFor(u.id);
  if (family?.ads_disabled) throw new HttpException('ads.parental_disabled', 403);
  if (await this.sessionMinutes(u.id) < 10) throw new HttpException('ads.warmup_required', 422);
  await this.cooldown.assertNotInCooldown(u.id, 'kids', 10 * 60);
  if (await this.dailyCount(u.id) >= 3) throw new HttpException('ads.daily_cap', 429);
  if (await this.sessionCount(u.id) >= 2) throw new HttpException('ads.session_cap', 429);
  const viewId = generateUlid();
  await this.supa.from('kids_ad_views').insert({
    id: viewId, user_id: u.id, requested_at: new Date(), tenant_id: u.tenant_id,
  });
  return { view_id: viewId, kws_sdk_config: this.kwsConfig(u) };
}

async handleKwsSsv(req: Request) {
  const result = await this.kwsValidator.verify(req);
  if (!result.valid) throw new HttpException('invalid', 401);
  const view = await this.supa.from('kids_ad_views').select('*').eq('id', result.view_id).single();
  if (view.data.completed) return;
  await this.ledger.grant(view.data.user_id, 'coins', 30, `ads.kids.rewarded:${result.view_id}`, view.data.tenant_id, 'system_source');
  await this.supa.from('kids_ad_views').update({ completed: true, completed_at: new Date() }).eq('id', result.view_id);
}
```

```sql
create table public.kids_ad_views (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null,
  completed boolean not null default false,
  completed_at timestamptz,
  reward_coins int not null default 30,
  tenant_id text not null default 'mochi'
);
create index on public.kids_ad_views (user_id, requested_at desc);
alter table public.kids_ad_views enable row level security;
create policy "kids ad self" on public.kids_ad_views for select using (user_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** Kids SKU rewarded works via kWS. Verified.
**AC2.** 13+ SKU request to kid endpoint returns 403. Verified.
**AC3.** Parental ad-disabled returns 403. Verified.
**AC4.** First 10 min of session ad-free. Verified.
**AC5.** Cap 3/day enforced. Verified.
**AC6.** Cap 2/session enforced. Verified.
**AC7.** Cooldown 10 min enforced. Verified.
**AC8.** kWS SSV grants 30 Coins. Verified.
**AC9.** No LevelPlay/AppLovin SDK in kids binary (FR-LEGAL-003 §1.10 inspection). Verified.
**AC10.** kWS account separated from 13+. Verified.
**AC11.** Replay protection. Verified.
**AC12.** Audit retention 7-year. Verified.

---

## §5 — Verification

```typescript
describe('FR-ADS-002 — kids contextual', () => {
  it('grants 30 Coins on kWS SSV', async () => {
    await mockKid('u1');
    const { view_id } = await svc.requestKidRewarded(user('u1'));
    await svc.handleKwsSsv(mockKwsSsv({ view_id }));
    expect(await ledger.balance('u1', 'coins')).toBe(30);
  });

  it('parent can disable kids ads', async () => {
    await mockFamilyLink('u1', { ads_disabled: true });
    await expect(svc.requestKidRewarded(user('u1'))).rejects.toMatchObject({ status: 403 });
  });

  it('warmup-required in first 10 min', async () => {
    await mockKid('u1', { session_start: 'now' });
    await expect(svc.requestKidRewarded(user('u1'))).rejects.toMatchObject({ status: 422 });
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/ads/kws/kws.controller.ts
@Controller('v1/ads/kids')
@UseGuards(SupabaseJwtGuard)
export class KwsController {
  @Post('rewarded/request')
  async request(@CurrentUser() u: AuthedUser) {
    return this.svc.requestKidRewarded(u);
  }
}

@Controller('webhook/ads/kws')
export class KwsWebhookController {
  @Post('ssv')
  async ssv(@Req() req: Request) { return this.svc.handleKwsSsv(req); }
}
```

---

## §7 — Dependencies

**External:** SuperAwesome kWS SDK + Ad Network.
**Internal:** FR-ADS-001 (template), FR-AUTH-003 (kids SKU detection), FR-ECON-001 (ledger), FR-SUB-002 (parental disable).
**Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/ads/kids/rewarded/request
→ 200 { "view_id": "01HAD...", "kws_sdk_config": {...}, "expected_reward_coins": 30 }
```

```json
{ "error": "ads.parental_disabled" }
```

```json
{ "event": "ads.kids.rewarded.completed", "view_id": "01HAD...", "user_id": "01HU...", "reward_coins": 30 }
```

```json
{ "error": "ads.warmup_required", "session_minutes_so_far": 4, "required": 10 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** kWS-only? → §1.1.
- **OQ-2 (resolved):** Lower cap rationale? → §1.2 + §2.
- **OQ-3 (resolved):** Parental override? → §1.7.
- **OQ-4 (resolved):** Warmup period? → §1.12 + §2.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | kWS down | Vendor monitor | No kid ads | Surface "Try later" UX |
| 2 | SDK accidentally bundled for 13+ | Build inspection | OK on kids; harmless on 13+ | Binary scrub |
| 3 | LevelPlay SDK on kids binary | FR-LEGAL-003 §1.10 inspection | Build blocked | Verified |
| 4 | SSV mismatch | Validator | Reject | Investigate |
| 5 | Warmup gate evaded by app restart | Session-id reset | Race | Server-tracked session_start |
| 6 | Parent disables via dashboard race | Idempotent setting | Last wins | OK |
| 7 | Cross-tenant kWS workspace mixup | Account config | Privacy | Audit |
| 8 | Audit retention 7-year | DPO | Configured | OK |
| 9 | kid clicks ad CTA → outside app | OS-handled | Acceptable | App returns kid to game on resume |
| 10 | Ad content offensive (kWS filter miss) | Player report | Vendor review | Escalate to kWS support |
| 11 | Coins not granted post-SSV | Reconciliation | Manual grant | DPO |
| 12 | Ad replay across sessions | view_id uniqueness | Blocked | Verified |

---

## §11 — Notes

**Plan refs:** plan §PART 6 + plan §PART 8 (kWS contextual).

**Sub-decisions punted to ops:** kWS account setup + per-region ad units.

**Anti-patterns explicitly forbidden:**
- Behavioural ads on kids.
- Personalised pre-roll.
- LevelPlay / AppLovin SDK in kids binary.
- Cross-workspace data mixing.

**Cross-reference:** FR-ADS-001 13+ rewarded; FR-SUB-002 parental override.
