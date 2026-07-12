---
id: FR-VIRAL-004
title: "Battle pass — $4.99 / 4 weeks · ~40 tiers · free + premium track · daily/weekly objectives · carry-over rules"
module: VIRAL
priority: SHOULD
status: done
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 1
owner: "Tech Lead + designer"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-ECON-001, FR-ECON-002, FR-SUB-001, FR-CARE-005, FR-LEGAL-002, FR-OBS-001, FR-INFRA-003, FR-AUTH-003]
depends_on: [FR-ECON-002, FR-SUB-001, FR-CARE-005]
blocks: []
effort_hours: 12
new_files:
  - "apps/api/src/viral/battle-pass/battle-pass.controller.ts"
  - "apps/api/src/viral/battle-pass/battle-pass.service.ts"
  - "apps/api/src/viral/battle-pass/objective.service.ts"
  - "apps/api/src/viral/battle-pass/__tests__/battle-pass.spec.ts"
  - "apps/cocos/assets/_root/viral/BattlePassUi.ts"
  - "infra/supabase/standard/migrations/20260517_028_battle_pass.sql"
modified_files: []
allowed_tools:
  - "Battle pass season config in code (DPO-reviewed)"
  - "Daily + weekly objectives tracked via care actions, mini-game wins, AR exports"
  - "FR-ECON-001 + FR-ECON-002 for Coins/Hearts grants"
disallowed_tools:
  - "Real-money randomised reward inside any tier (FR-LEGAL-002)"
  - "Mystery tier rewards (deterministic disclosure required)"
  - "Battle pass for kids SKU without parental approval (FR-SUB-002)"
risk_if_skipped: "Plan §PART 6 — battle pass is a documented retention driver in casual mobile (Pokémon GO, Marvel Snap). Without it, the live-ops engagement loop misses a strong recurring monetization wedge."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Battle pass season.** A "season" lasts 4 weeks (28 days). Has ~40 tiers. Free track + premium track (Premium unlock costs $4.99 OR is bundled with Family tier).

§1.2  **Tier rewards — disclosed at season start.** Every tier's reward is known before the player buys premium. Per FR-LEGAL-002 §1.7. NO mystery tiers.

§1.3  **Tier XP.** Each tier = 100 XP. Player earns XP through:
- Daily objectives (3/day, each = 50 XP).
- Weekly objectives (3/week, each = 200 XP).
- Care actions (1 XP per feed/clean/hug).
- Mini-game wins (5 XP per win).

§1.4  **Objective examples.**
- Daily: "Feed any pet 3 times today", "Play a mini-game", "Hug your pet".
- Weekly: "Win 10 mini-games", "Reach a 7-day streak", "Hatch a new pet".

§1.5  **Premium purchase.** Player taps "Unlock Premium" → IAP via FR-ECON-002 (`mochi.battle_pass.season_N`). On valid receipt → premium track unlocked + retroactively grants premium-only rewards for tiers already earned.

§1.6  **Bundle with Family.** Family tier subscribers (FR-SUB-002) get premium track included for all child profiles.

§1.7  **Pet+ NOT included.** Pet+ does NOT include battle pass. Plan §PART 6 — separate revenue surface.

§1.8  **Carry-over rules at season end.**
- Unclaimed rewards: claimable for 7 days post-season, then forfeit.
- XP overflow at tier 40: excess XP discarded (no rollover).
- Reset for next season: full XP 0 + new objectives.

§1.9  **Free track rewards.** ~50% of tiers have free rewards (small Coins, small cosmetic accents). Premium track has higher-value rewards on every tier.

§1.10  **Premium-only rewards.** Exclusive species variants, special outfits, Hearts (one-time grant).

§1.11  **Endpoint — battle pass state.** `GET /v1/battle-pass/state` returns current season + tier + objective progress + claimable rewards.

§1.12  **Endpoint — claim reward.** `POST /v1/battle-pass/claim/:tier`.

§1.13  **Endpoint — daily objectives.** `GET /v1/battle-pass/objectives/daily` returns today's 3 objectives + progress.

§1.14  **Season schedule.** New season auto-starts every 28 days, configurable via cron job. Mid-season pricing change forbidden.

§1.15  **No mid-season premium price increase.** Once a player has bought premium, no surcharge for completing it. Apple/Google policy.

§1.16  **Kids SKU disabled.** Per FR-SUB-002 — kids battle pass via Family tier only. No independent purchase.

§1.17  **Tenant-aware seasons.** B2B tenants (FR-B2B-001) can have their own seasons with own reward tracks.

§1.18  **DPO-reviewed objectives.** All objective copy reviewed for kid-appropriateness + cultural sensitivity.

§1.19  **Localised season copy** per FR-I18N-001.

§1.20  **Analytics.** `viral.bp.season_start`, `viral.bp.tier_progressed`, `viral.bp.premium_purchased`, `viral.bp.reward_claimed`, `viral.bp.season_ended` per FR-OBS-001.

---

## §2 — Why this design

**Why $4.99 / 4 weeks.** Plan §PART 6 — standard battle pass pricing. Pokémon GO, Marvel Snap both around this range.

**Why 40 tiers.** Plan §PART 6 — enough for 28-day engagement (~1.5 tiers/day). More dilutes; fewer feels short.

**Why disclosed rewards.** Plan §PART 8 + FR-LEGAL-002 — mystery rewards are loot-box-adjacent.

**Why XP from many sources.** Plan §PART 3 — funnels back into care + mini-games + streaks (cross-FR engagement).

**Why retroactive grants on premium purchase.** Apple/Google policy + UX expectation — late-buyer shouldn't lose what they earned.

**Why Family bundled but Pet+ not.** Plan §PART 6 — Pet+ + Battle Pass = parallel premium surfaces; bundling both into Pet+ undercuts Pet+ value. Family bundles to make Family tier worth the $9.99.

**Why 7-day claim grace.** UX — players who miss season end have time to claim.

**Why no rollover.** Plan §PART 6 — clean season reset keeps engagement.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/viral/battle-pass/battle-pass.service.ts (excerpt)
async state(u: AuthedUser) {
  const season = await this.currentSeason(u.tenant_id);
  const progress = await this.supa.from('battle_pass_progress').select('*').eq('user_id', u.id).eq('season_id', season.id).maybeSingle();
  const tier = Math.floor((progress.data?.xp ?? 0) / 100);
  return {
    season_id: season.id,
    tier_current: tier,
    xp_current: progress.data?.xp ?? 0,
    xp_required_for_next: 100,
    premium_unlocked: progress.data?.premium_unlocked ?? false,
    claimable: await this.claimable(u.id, season.id, tier),
    objectives_today: await this.objectivesToday(u.id),
  };
}

async claimReward(u: AuthedUser, tier: number) {
  const season = await this.currentSeason(u.tenant_id);
  const progress = await this.supa.from('battle_pass_progress').select('*').eq('user_id', u.id).eq('season_id', season.id).single();
  if (Math.floor(progress.data.xp / 100) < tier) throw new HttpException('bp.tier_not_reached', 422);
  if (await this.alreadyClaimed(u.id, season.id, tier)) throw new HttpException('bp.already_claimed', 422);
  const reward = season.rewards[tier];
  await this.deliverReward(u, reward.free);
  if (progress.data.premium_unlocked) await this.deliverReward(u, reward.premium);
  await this.supa.from('battle_pass_claims').insert({ user_id: u.id, season_id: season.id, tier, claimed_at: new Date() });
}
```

```sql
create table public.battle_pass_seasons (
  id text primary key,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  rewards jsonb not null,
  tenant_id text not null default 'mochi'
);

create table public.battle_pass_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id text not null references public.battle_pass_seasons(id),
  xp int not null default 0,
  premium_unlocked boolean not null default false,
  premium_purchased_at timestamptz,
  primary key (user_id, season_id)
);

create table public.battle_pass_claims (
  user_id uuid not null,
  season_id text not null,
  tier int not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, season_id, tier)
);

create table public.battle_pass_objectives (
  id bigserial primary key,
  user_id uuid not null,
  season_id text not null,
  objective_type text not null,
  scope text not null check (scope in ('daily','weekly')),
  target int not null,
  progress int not null default 0,
  completed boolean not null default false,
  date_assigned date not null
);
```

---

## §4 — Acceptance criteria

**AC1.** Season starts every 28 days. Verified by cron test.
**AC2.** XP from care actions + mini-games + objectives accrues correctly. Verified.
**AC3.** Premium purchase grants retroactive premium rewards. Verified.
**AC4.** Tier rewards disclosed at season start in /state response. Verified.
**AC5.** 7-day claim grace post-season. Verified.
**AC6.** Family tier includes premium. Verified.
**AC7.** Pet+ does NOT include. Verified.
**AC8.** Kids cannot purchase directly. Verified.
**AC9.** Daily 3 objectives + weekly 3 served. Verified.
**AC10.** Mid-season pricing locked. Verified.
**AC11.** No mystery rewards. Verified by config lint.
**AC12.** Tenant seasons isolated. Verified.

---

## §5 — Verification

```typescript
describe('FR-VIRAL-004 — battle pass', () => {
  it('grants XP from care actions', async () => {
    await fund('u1', 100);
    await care.feed(user('u1'), 'pet1', 'basic', 'k1');
    const r = await svc.state(user('u1'));
    expect(r.xp_current).toBe(1);
  });

  it('retroactive premium rewards', async () => {
    await earnXp('u1', 350);  // tier 3
    await iap.validateAndGrant(user('u1'), 'apple', mockReceipt('bp.season_1'));
    const r = await svc.state(user('u1'));
    expect(r.claimable.premium_tiers).toEqual([0, 1, 2, 3]);
  });

  it('forfeits unclaimed rewards after 7 days', async () => {
    await earnXp('u1', 4000);  // all tiers
    await advanceClockDays(36);  // 28 + 8
    const r = await svc.state(user('u1'));
    expect(r.claimable.free_tiers).toEqual([]);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/viral/battle-pass/objective.service.ts
@Injectable()
export class ObjectiveService {
  async hookCareAction(userId: string, action: string) {
    const objectives = await this.supa.from('battle_pass_objectives').select('*').eq('user_id', userId).eq('completed', false);
    for (const obj of objectives.data ?? []) {
      if (this.matches(obj, action)) {
        await this.supa.from('battle_pass_objectives').update({ progress: obj.progress + 1 }).eq('id', obj.id);
        if (obj.progress + 1 >= obj.target) await this.completeObjective(userId, obj);
      }
    }
  }
}
```

---

## §7 — Dependencies

**External:** Apple/Google subscription products for battle pass.
**Internal:** FR-ECON-002 IAP, FR-SUB-001/002 entitlement, FR-CARE-005 streak hooks, FR-ECON-001 ledger.
**Blocks:** none.

---

## §8 — Example payloads

```http
GET /v1/battle-pass/state
→ 200
{
  "season_id": "season-2026-08",
  "tier_current": 12,
  "xp_current": 1234,
  "xp_required_for_next": 100,
  "premium_unlocked": false,
  "claimable": { "free_tiers": [0,1,2,3,4,5,6,7,8,9,10,11,12], "premium_tiers": [] },
  "objectives_today": [
    { "type": "feed_pet", "target": 3, "progress": 2 }, ...
  ]
}
```

```http
POST /v1/battle-pass/claim/5
→ 200 { "tier": 5, "rewards_granted": { "free": { "coins": 50 }, "premium": null } }
```

```json
{ "event": "viral.bp.premium_purchased", "user_id": "01HU...", "season_id": "season-2026-08", "retroactive_tiers": 3 }
```

```json
{ "error": "bp.tier_not_reached", "current_tier": 5, "requested": 10 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Premium price $4.99? → §1.1 + §2.
- **OQ-2 (resolved):** 40 tiers? → §1.1 + §2.
- **OQ-3 (resolved):** Mystery rewards? → §`disallowed_tools` — forbidden.
- **OQ-4 (resolved):** Pet+ includes battle pass? → §1.7 — no.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Season auto-start cron fails | Daily check | Season stuck | Manual restart |
| 2 | XP hook missed on care action | Reconciliation | XP under-credit | Replay from audit |
| 3 | Premium grant fails post-IAP | Atomic tx | Rollback | Manual reconcile |
| 4 | Tier reward config invalid (mystery) | Boot-time validation | Server refuses | Fix config |
| 5 | Daily objective doesn't reset | Cron | Stuck | Force reset |
| 6 | Family tier premium bundle race | Idempotent | OK | Verified |
| 7 | Mid-season pricing changed | Apple/Google block | Submission refused | FR amendment |
| 8 | Tenant season override leaks | RLS | Isolated | Verified |
| 9 | Reward forfeit before grace | Bug | Player complaint | Manual grant + audit |
| 10 | Locale missing | EN fallback | OK | i18n batch |
| 11 | XP race on concurrent care | Mutex | OK | Verified |
| 12 | Cosmetic reward asset missing | Asset bundle | Build blocked | CI catches |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (battle pass).

**Sub-decisions punted to ops:** Per-season reward tracks designer-curated.

**Anti-patterns explicitly forbidden:**
- Mystery rewards.
- Mid-season pricing changes.
- Pet+ bundling battle pass.

**Cross-reference:** FR-ECON-002, FR-SUB-001/002, FR-CARE-005.
