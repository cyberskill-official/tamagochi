---
id: FR-CARE-001
title: "Feed action — server-authoritative consumable spend + hunger restore + Spine eat anim + cooldown"
module: CARE
priority: MUST
status: done
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-PET-001, FR-PET-002, FR-PET-003, FR-ART-001, FR-INFRA-002, FR-INFRA-003, FR-CARE-005, FR-ECON-001, FR-OBS-001, FR-LEGAL-002, FR-VIRAL-002, FR-B2B-005]
depends_on: [FR-PET-003, FR-ART-001]
blocks: [FR-CARE-005, FR-VIRAL-002, FR-B2B-005]
effort_hours: 8
new_files:
  - "apps/api/src/care/feed.controller.ts"
  - "apps/api/src/care/feed.service.ts"
  - "apps/api/src/care/food-catalogue.ts"
  - "apps/api/src/care/cooldown.service.ts"
  - "apps/api/src/care/__tests__/feed.spec.ts"
  - "apps/api/src/care/__tests__/cooldown.spec.ts"
  - "apps/realtime/src/rooms/handlers/feed.handler.ts"
  - "apps/cocos/assets/_root/care/FeedAction.ts"
  - "apps/cocos/assets/_root/care/__tests__/FeedAction.spec.ts"
  - "infra/supabase/standard/migrations/20260517_010_care_actions.sql"
modified_files:
  - "apps/api/src/pets/stats/stat-decay.service.ts"
  - "apps/realtime/src/rooms/PetRoom.ts"
allowed_tools:
  - "Server-authoritative care handler (FR-INFRA-002 §1.10)"
  - "Postgres care_actions audit table"
  - "Spine `eat` animation (FR-ART-001 contract)"
  - "HapticsAdapter.tap('light') on feed"
disallowed_tools:
  - "Client-driven stat mutation"
  - "Real-money food (food is earned currency only per FR-LEGAL-002)"
  - "Feeding pets in `egg` or `grandma_house` stages"
risk_if_skipped: "Without server-authoritative feed, the core care loop has no anti-cheat foundation; hunger is the highest-decay stat (FR-PET-003 §1.2) so its mutation path is the most-attacked surface; FR-CARE-005 streak system reads care-action audit log."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Endpoint.** `POST /v1/pets/:petId/feed` MUST execute server-authoritative feed. Body: `{ food_id: 'basic' | 'premium', idempotency_key: string }`. Header `Authorization: Bearer <JWT>` required.

§1.2  **Stage gate.** Per FR-PET-002 §1.6, feeding MUST be permitted only when `stage ∈ {baby, teen, adult}`. Eggs and grandma_house pets reject with HTTP 403 `{ error: 'pet.stage.locked', current_stage }`.

§1.3  **Ownership check.** Only the pet's `owner_id` OR an `active` co-parent (FR-SOCIAL-002 P2 wiring) MAY feed. Cross-tenant + non-owner attempts return HTTP 403.

§1.4  **Food catalogue.** Two food items at P1:
- `basic`: cost 5 Coins, hunger +30, no other stat effect, cooldown 5 min.
- `premium`: cost 25 Coins, hunger +50 + happiness +5, cooldown 15 min.

Catalogue in `apps/api/src/care/food-catalogue.ts` is a single source of truth; FR-ECON-002 (P3) extends with cosmetic-tied food but the schema is locked here.

§1.5  **Currency spend.** Server MUST deduct Coins via FR-ECON-001 (P3) ledger. At P1, the ledger is stubbed to "always succeed" with infinite Coins — FR-ECON-001 wires the real ledger. The contract MUST allow rejection with `{ error: 'insufficient_coins', required, have }` for forward-compatibility.

§1.6  **Cooldown.** Per food, per pet, per player. Cooldown windows enforced via Redis sliding window keyed by `(pet_id, food_id)`. Within-cooldown reject: HTTP 429 `{ error: 'cooldown', retry_after_sec }`.

§1.7  **Stat apply.** Apply via `StatDecayService.apply(stats, 'feed_basic' | 'feed_premium')` per FR-PET-003 §3.1. Result clamped 0-100.

§1.8  **`last_seen_at` update.** Each feed MUST update `pets.last_seen_at` so decay (FR-PET-003) restarts from now.

§1.9  **Audit row.** Each feed writes to `care_actions` table: `(id, pet_id, owner_id, action='feed', food_id, hunger_before, hunger_after, occurred_at, source='ui'|'co_parent', tenant_id)`. Retention 90 days for analytics + 7 years for kids (COPPA audit).

§1.10  **Idempotency.** `idempotency_key` MUST be a client-generated 16-char ULID-prefix. Server MUST cache the first response per (player, key) for 60 seconds and return identical response on retry. Prevents network-flake double-feeds.

§1.11  **Colyseus broadcast.** Successful feed broadcasts `pet.fed { pet_id, food_id, hunger_after }` to all clients in the PetRoom (so co-parents see it live).

§1.12  **Animation handshake.** Server response includes `animation_token` (5-sec HMAC) that the Cocos client surrenders to play the `eat` Spine animation. Without the token, client SHOULD NOT play the animation (defense against client-only stat displays).

§1.13  **Haptic.** Client fires `HapticsAdapter.tap('light')` on successful response.

§1.14  **Rate limit (anti-spam).** Beyond cooldown, a per-player overall feed rate-limit of 60 feeds/hour MUST apply (catches multi-pet spam). Exceeds → HTTP 429 with `retry_after_sec`.

§1.15  **Analytics.** Emit `care.feed.success { food_id, hunger_before, hunger_after, source }` + `care.feed.failure { reason }` per FR-OBS-001 §1.4.

§1.16  **Impossible-state detection.** Feeding when hunger=100 triggers FR-INFRA-002 §1.9 impossible-transition path; this FR's handler MUST call `recordImpossibleTransition` and reject with HTTP 422 `{ error: 'pet.stat.already_full' }`.

§1.17  **Source attribution.** The `source` field distinguishes `ui` (the owner-tapped feed) from `co_parent_remote` (the co-parent fed in FR-SOCIAL-002). This is the substrate for the PetPair receipt notification ("Linh fed Mochi while you were asleep").

§1.18  **No real-money food.** Per FR-LEGAL-002 §1.2, food is earned-currency only. The catalogue MUST NOT include any `iap_sku` field; FR-ECON-002's IAP catalogue cannot reference food items.

§1.19  **Server clock for cooldown.** Cooldowns MUST be enforced server-side using monotonic clock (`Date.now()`); client-supplied "I last fed at T" is ignored.

§1.20  **Failure observability.** Each failure category (cooldown, stage_locked, insufficient_coins, stat_already_full, rate_limit) MUST emit a separately-labelled Prometheus metric to enable per-category alerting.

---

## §2 — Why this design

**Why server-authoritative.** Plan §PART 4 anti-cheat. Feed is the single most common care action; if client-spoofable, the entire stat economy collapses + breeding eligibility (FR-PET-007) becomes free.

**Why two foods at P1.** Plan §PART 3 economy basics. Two tiers give a meaningful currency-to-effectiveness gradient without overwhelming the player; FR-ECON-002 expands the catalogue in P3.

**Why short cooldown.** Plan §PART 3 60-second session loop. 5 min basic / 15 min premium balances "don't feed-spam to 100" against "let the player actually engage."

**Why idempotency-key not full request-deduplication.** A flaky network producing two POSTs is the dominant case; key-based dedup handles it cheaply. Full request-hash dedup is overkill for a side-effect-light action.

**Why broadcast over PetRoom.** Co-parent presence (FR-SOCIAL-002) needs to see live state. Broadcasting the action explicitly (rather than relying solely on schema diff) gives a notification surface ("Linh fed Mochi!") + an analytics seam.

**Why animation token.** Without it, a tampered client could play the eat animation without an actual server-side feed, producing a UI lie. Token ties animation playback to a real server-validated event.

**Why 60/hour overall rate-limit.** With 3 pets free-tier and 5-min cooldown per pet, the theoretical max is 36/hr. 60 is generous headroom for legitimate Pet+ players with 10 pets without permitting clear abuse.

**Why no real-money food.** EU Digital Fairness Act + Belgium 2018 ban + plan §PART 8 — real-money randomised outcomes forbidden. Food has no randomness but real-money currency that converts to stat changes treads near "pay to skip care." Earned-currency only sidesteps this entirely.

---

## §3 — API contract & code shape

### 3.1 — Controller

```typescript
// apps/api/src/care/feed.controller.ts
@Controller('v1/pets')
@UseGuards(SupabaseJwtGuard)
export class FeedController {
  constructor(private readonly svc: FeedService) {}

  @Post(':petId/feed')
  async feed(@CurrentUser() u: AuthedUser, @Param('petId') petId: string,
             @Body() body: { food_id: 'basic'|'premium'; idempotency_key: string }) {
    return this.svc.feed(u, petId, body.food_id, body.idempotency_key);
  }
}
```

### 3.2 — Service

```typescript
// apps/api/src/care/feed.service.ts
@Injectable()
export class FeedService {
  constructor(
    private readonly supa: SupabaseClient,
    private readonly cooldown: CooldownService,
    private readonly stats: StatDecayService,
    private readonly econ: CurrencyLedger,
    private readonly limit: RateLimit,
    private readonly idemp: IdempotencyStore,
    private readonly audit: AuditLogService,
    private readonly broadcast: RoomBroadcast,
  ) {}

  async feed(u: AuthedUser, petId: string, foodId: 'basic'|'premium', idempKey: string) {
    const prior = await this.idemp.lookup(u.id, `feed:${idempKey}`);
    if (prior) return prior;
    await this.limit.assert({ key: `feed-overall:${u.id}`, perHour: 60 });
    const { data: pet } = await this.supa.from('pets').select('*').eq('id', petId).single();
    if (!pet) throw new HttpException('not_found', 404);
    if (pet.owner_id !== u.id) throw new HttpException('forbidden', 403);
    if (!['baby','teen','adult'].includes(pet.stage)) throw new HttpException({ error: 'pet.stage.locked', current_stage: pet.stage }, 403);
    if (pet.hunger >= 100) { recordImpossibleTransition({ player: u.id, kind: 'feed-at-max' }); throw new HttpException('pet.stat.already_full', 422); }
    const ttlSec = await this.cooldown.check(petId, foodId);
    if (ttlSec > 0) throw new HttpException({ error: 'cooldown', retry_after_sec: ttlSec }, 429);
    const food = FOOD_CATALOGUE[foodId];
    await this.econ.spend(u.id, food.cost);
    const before = { hunger: pet.hunger, cleanliness: pet.cleanliness, happiness: pet.happiness, energy: pet.energy };
    const after = this.stats.apply(before, foodId === 'basic' ? 'feed_basic' : 'feed_premium');
    await this.supa.from('pets').update({ ...after, last_seen_at: new Date().toISOString() }).eq('id', petId);
    await this.supa.from('care_actions').insert({
      pet_id: petId, owner_id: u.id, action: 'feed', food_id: foodId,
      hunger_before: before.hunger, hunger_after: after.hunger, source: 'ui', tenant_id: u.tenant_id,
    });
    await this.cooldown.start(petId, foodId, food.cooldown_sec);
    await this.broadcast.toPetRoom(petId, 'pet.fed', { pet_id: petId, food_id: foodId, hunger_after: after.hunger });
    const result = {
      pet_id: petId, food_id: foodId, hunger_after: after.hunger,
      animation_token: signAnimationToken({ pet_id: petId, action: 'eat', ttl_sec: 5 }),
    };
    await this.idemp.store(u.id, `feed:${idempKey}`, result);
    await this.audit.write({ who: u.id, what: 'care.feed.success', what_keys: { pet_id: petId, food_id: foodId } });
    return result;
  }
}
```

### 3.3 — Food catalogue

```typescript
// apps/api/src/care/food-catalogue.ts
export const FOOD_CATALOGUE = {
  basic:   { cost: 5,  cooldown_sec: 5 * 60,  hunger_delta: 30 },
  premium: { cost: 25, cooldown_sec: 15 * 60, hunger_delta: 50, happiness_delta: 5 },
} as const;
```

### 3.4 — Migration

```sql
-- infra/supabase/standard/migrations/20260517_010_care_actions.sql
create table public.care_actions (
  id bigserial primary key,
  pet_id text not null references public.pets(id) on delete cascade,
  owner_id uuid not null,
  action text not null check (action in ('feed','clean','hug','mini_game','sleep')),
  food_id text,
  hunger_before int, hunger_after int,
  cleanliness_before int, cleanliness_after int,
  happiness_before int, happiness_after int,
  energy_before int, energy_after int,
  source text not null default 'ui' check (source in ('ui','co_parent_remote','offline_reconciled')),
  occurred_at timestamptz not null default now(),
  tenant_id text not null default 'mochi'
);
create index on public.care_actions (pet_id, occurred_at desc);
create index on public.care_actions (owner_id, occurred_at desc);
alter table public.care_actions enable row level security;
create policy "care_actions self" on public.care_actions for select using (owner_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** `POST /v1/pets/:id/feed` with `food_id=basic` on a baby pet at hunger=50 returns 200 with `hunger_after=80`. Verified by `__tests__/feed.spec.ts`.

**AC2.** Feeding an egg returns 403 `pet.stage.locked`. Verified by spec test.

**AC3.** Feeding with hunger=100 returns 422 `pet.stat.already_full` + emits `security.impossible-transition`. Verified.

**AC4.** Cooldown enforcement: second feed within 5 min returns 429 with `retry_after_sec ≤ 300`. Verified by spec test using fake timers.

**AC5.** Idempotency: identical request with same key returns cached response without applying stat twice. Verified by spec test.

**AC6.** Insufficient coins (when FR-ECON-001 wires real ledger) returns 402 `insufficient_coins`. Verified by spec test with stub ledger throwing.

**AC7.** Rate-limit 60/hour enforced. Verified by spec test pumping 61 requests.

**AC8.** Cross-owner attempt returns 403. Verified by spec test with two seeded users.

**AC9.** Audit row written with correct before/after values. Verified by spec test querying `care_actions`.

**AC10.** Colyseus broadcast emits `pet.fed` to all room clients. Verified by integration test with 2 Colyseus clients.

**AC11.** Animation token validated: feeding without token client cannot play `eat`. Verified by Cocos `__tests__/FeedAction.spec.ts`.

**AC12.** Stage transition mid-feed (e.g. baby → teen mid-cooldown) does not break cooldown semantics. Verified by spec test.

---

## §5 — Verification

```typescript
// apps/api/src/care/__tests__/feed.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { FeedService } from '../feed.service';

describe('FR-CARE-001 — feed action', () => {
  const svc = new FeedService(/*mocks*/);

  it('feeds baby basic +30 hunger', async () => {
    const r = await svc.feed(user('u1'), 'pet-mochi', 'basic', 'k1');
    expect(r.hunger_after).toBe(80);
    expect(r.animation_token).toBeTruthy();
  });

  it('rejects feed at hunger=100', async () => {
    await expect(svc.feed(user('u1'), 'pet-full', 'basic', 'k2')).rejects.toMatchObject({ status: 422 });
  });

  it('enforces cooldown', async () => {
    await svc.feed(user('u1'), 'pet-mochi', 'basic', 'k3');
    await expect(svc.feed(user('u1'), 'pet-mochi', 'basic', 'k4')).rejects.toMatchObject({ status: 429 });
  });

  it('is idempotent', async () => {
    const r1 = await svc.feed(user('u1'), 'pet-mochi', 'basic', 'k5');
    const r2 = await svc.feed(user('u1'), 'pet-mochi', 'basic', 'k5');
    expect(r1).toEqual(r2);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/care/cooldown.service.ts
@Injectable()
export class CooldownService {
  constructor(@Inject('REDIS') private readonly redis: RedisClientType) {}
  async check(petId: string, foodId: string): Promise<number> {
    const ttl = await this.redis.ttl(`cd:feed:${petId}:${foodId}`);
    return ttl > 0 ? ttl : 0;
  }
  async start(petId: string, foodId: string, seconds: number): Promise<void> {
    await this.redis.set(`cd:feed:${petId}:${foodId}`, '1', { EX: seconds });
  }
}
```

---

## §7 — Dependencies

**External:** Redis (cooldown + idempotency store).

**Internal:** FR-PET-001 (pets table), FR-PET-002 (stage gate), FR-PET-003 (StatDecayService.apply), FR-ART-001 (`eat` animation), FR-INFRA-002 (Colyseus broadcast), FR-INFRA-003 (care_actions table + RLS).

**Blocks:** FR-CARE-005 (streak system reads care_actions log), FR-VIRAL-002 (Daily Drama event types include feed), FR-B2B-005 (Viettel tenant feed-with-topup uses this contract).

---

## §8 — Example payloads

```http
POST /v1/pets/01HC7QG.../feed
Authorization: Bearer eyJ...
Content-Type: application/json
{ "food_id": "basic", "idempotency_key": "01HCFEED7QG..." }

→ 200 OK
{ "pet_id": "01HC7QG...", "food_id": "basic", "hunger_after": 80, "animation_token": "eyJ..." }
```

```json
{
  "event": "care.feed.success",
  "pet_id": "01HC7QG...",
  "food_id": "basic",
  "hunger_before": 50,
  "hunger_after": 80,
  "source": "ui",
  "stage": "baby",
  "emitted_at": "2026-08-12T14:36:01Z"
}
```

```json
{ "error": "cooldown", "retry_after_sec": 240 }
```

```json
{
  "id": 4242,
  "pet_id": "01HC7QG...",
  "owner_id": "01HC7QGZK4XN8YA1J3WB6XX99",
  "action": "feed",
  "food_id": "premium",
  "hunger_before": 40,
  "hunger_after": 90,
  "source": "ui",
  "occurred_at": "2026-08-12T14:36:01Z"
}
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Two foods vs more? → §1.4 — two at P1; FR-ECON-002 expands.
- **OQ-2 (resolved):** Per-pet cooldown or per-player? → §1.6 — per-pet-per-food + overall rate limit.
- **OQ-3 (resolved):** Animation token vs trust the client? → §1.12 + §2 — token ties animation to real event.
- **OQ-4 (resolved):** Where does insufficient_coins come from at P1? → §1.5 — stub ledger; contract preserves rejection shape.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Redis cooldown unreachable | `redis.ttl` errors | Cooldown bypass-safe (fail-closed: reject all feeds) | Surface "service degraded" UX; restore Redis |
| 2 | Idempotency cache miss after restart | Same key returns 200 twice | Double feed | 60s cache TTL bounds the blast radius |
| 3 | Currency ledger stub returns success when real ledger would reject | E2E test in FR-ECON-001 | Pet over-fed for free | Acceptable at P1; tightens when ledger lands |
| 4 | Concurrent feed (owner + co-parent simultaneously) | Race on `pets` update | One feed lost | Per-pet mutex in PetRoom serialises (FR-PET-003 §10 row 12) |
| 5 | Cooldown disclaimer + UX hint missing | Player support tickets | Frustration | Surface `retry_after_sec` to UI countdown |
| 6 | Premium food shipped without IAP path expectation | Audit | Soft-launch confusion | FR-ECON-001 ledger clarifies — food is Coin-only |
| 7 | care_actions audit grows unbounded | Disk pressure | Migration risk | 90-day retention policy + cold archive |
| 8 | RLS misconfigured exposing other player's feeds | Spec test fails | Privacy issue | Tighten RLS; audit |
| 9 | Animation token forged by tampered client | Token signature fails | UI lie | Cocos rejects unsigned tokens |
| 10 | Stage transition mid-cooldown lingers stale cooldown | UX confusion | Player can't feed | Cooldown is per-pet, stage-agnostic — OK |
| 11 | Colyseus broadcast lost (room not yet created) | Co-parent doesn't see feed | UX desync | Persistent state in DB authoritative on rejoin |
| 12 | Rate-limit triggers on legitimate Pet+ owner with 10 pets | Support ticket | Frustration | Raise to 120/hour for Pet+ via FR-SUB-001 entitlement |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (care loop), plan §PART 4 (server-authoritative), plan §PART 8 (no real-money food).

**Sub-decisions punted to ops:** Coin costs (5/25) tunable via Mixpanel flags. Cooldown durations tunable.

**Anti-patterns explicitly forbidden:**
- Client-side stat write.
- Real-money food.
- Feeding pets in egg / grandma_house.

**Cross-reference:** FR-CARE-002/003/004 follow this pattern. FR-CARE-005 reads `care_actions` for streak detection.
