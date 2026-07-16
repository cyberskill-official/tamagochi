---
id: TASK-PET-002
title: "Pet evolution stages (egg → baby → teen → adult) + wall-clock-resistant age timer + stage-gated unlocks"
module: PET
priority: MUST
status: done
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-PET-001, TASK-PET-003, TASK-INFRA-002, TASK-ART-001, TASK-CARE-001, TASK-CARE-002, TASK-CARE-003, TASK-CARE-005, TASK-PET-007, TASK-PET-008, TASK-AI-001, TASK-VIRAL-001, TASK-OBS-002]
depends_on: [TASK-PET-001, TASK-ART-001]
blocks: [TASK-PET-003, TASK-PET-007, TASK-PET-008, TASK-CARE-005, TASK-VIRAL-001]
effort_hours: 8
new_files:
  - "apps/api/src/pets/evolution/evolution.service.ts"
  - "apps/api/src/pets/evolution/age-clock.ts"
  - "apps/api/src/pets/evolution/stage-gates.ts"
  - "apps/api/src/pets/evolution/__tests__/age-clock.spec.ts"
  - "apps/api/src/pets/evolution/__tests__/evolution.spec.ts"
  - "apps/api/src/pets/evolution/__tests__/stage-gates.spec.ts"
  - "apps/realtime/src/rooms/handlers/evolution.handler.ts"
  - "apps/cocos/assets/_root/pets/EvolutionFlow.ts"
  - "apps/cocos/assets/_root/pets/__tests__/EvolutionFlow.spec.ts"
  - "infra/supabase/standard/migrations/20260517_007_pet_age_events.sql"
modified_files:
  - "apps/api/src/pets/pets.service.ts"
  - "apps/realtime/src/rooms/PetRoom.ts"
allowed_tools:
  - "Postgres + monotonic server timestamps"
  - "Colyseus periodic tick callback (`this.clock.setInterval`)"
  - "Cocos `sp.Skeleton` skin swap (TASK-ART-001 §1.3)"
disallowed_tools:
  - "Client-supplied 'time elapsed' values for ageing (server-authoritative)"
  - "Device wall-clock for ageing (player could jump the clock to advance pet — anti-cheat fail)"
  - "`Math.random()` for stage-gated outcomes — use crypto RNG per TASK-LEGAL-002"
risk_if_skipped: "Without server-authoritative age + evolution, the most-asked-for cheat in Tamagotchi-style games (skip time to evolve) becomes trivial; TASK-PET-007 (breeding) requires `stage='adult'` gate, so breeding economy collapses if evolution is spoofable."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Stage definitions.** A pet's lifecycle MUST progress through five stages: `egg → baby → teen → adult → grandma_house`. `grandma_house` is the Permadeath-Lite state (TASK-PET-008) — neglect, not natural progression. The natural arc is `egg → baby → teen → adult`, irreversible.

§1.2  **Age durations (real-time hours).** Each natural stage MUST have a configurable duration in real-time hours:
- `egg → baby`: 0.5 h (the hatch ceremony — short, completed via TASK-PET-001).
- `baby → teen`: 48 h (≈ 2 days).
- `teen → adult`: 168 h (≈ 7 days).

Durations are read from `apps/api/src/pets/evolution/evolution-config.ts`. A/B tunable per TASK-OBS-001 feature flags (e.g. `evolution.baby_to_teen.duration_h` overrides default for a cohort).

§1.3  **Wall-clock-resistant age timer.** Pet age MUST be computed server-side from the **monotonic UTC timestamp** of `pets.born_at` (TASK-PET-001 §1.1). The client never sends "minutes since X" — it asks `GET /v1/pets/:id` which returns `age_minutes` computed at request time. Client-side rendering displays the server's `age_minutes` only.

§1.4  **Stage advancement check.** Every Colyseus `PetRoom` tick (default 30 s; configurable via `clock.setInterval`) MUST: (a) check every active pet against `age-clock.shouldAdvance(petBornAt, currentStage)`; (b) on `true`, emit `pet.stage.advance` server-side event; (c) update `pets.stage` AND `pets.hatched_at` (if relevant); (d) broadcast new `PetState.stage` via Colyseus state diff.

§1.5  **Care prerequisite for evolution.** A pet MUST NOT advance from `baby → teen` if any stat-bar (hunger / cleanliness / happiness / energy) has been < 30 for > 50% of the prior 24 h. Similarly `teen → adult` requires < 30 hours-below-30 in prior 72 h. This makes care meaningful — neglected pets stall at their current stage instead of auto-evolving. Stage-advancement check MUST evaluate this prerequisite.

§1.6  **Stage-gated unlocks.** Each stage gates feature access:
- `egg`: only `hatch_animation` + naming (TASK-PET-001).
- `baby`: all care actions (TASK-CARE-001/002/003), 1 mini-game (TASK-CARE-004), no AR (TASK-AR-001 disabled), no co-parent invite (TASK-SOCIAL-002 disabled).
- `teen`: AR placement enabled, co-parent invite enabled, mini-games full set.
- `adult`: breeding eligibility (TASK-PET-007), trade eligibility (TASK-SOCIAL-003), wedding-ceremony eligibility (TASK-SOCIAL-004), generative-pet reproduction (TASK-VIRAL-003).
- `grandma_house`: NO actions except the daily-ritual rescue (TASK-PET-008).

Gate enforcement MUST live in `stage-gates.ts` as a single source of truth queried by every action handler.

§1.7  **Spine skin swap on advancement.** Per TASK-ART-001 §1.3, the skeleton has three skin presets (`baby`, `teen`, `adult`). On stage advance, the Cocos `EvolutionFlow.ts` MUST: (a) play the `evolve_baby_to_teen` (or `evolve_teen_to_adult`) contract animation; (b) at the animation's midpoint, swap the Spine skin; (c) play 1 s of confetti particles + `success` haptic; (d) emit `pet.evolution.viewed` analytics.

§1.8  **TikTok-native share moment.** A stage advance is a viral moment — `EvolutionFlow.ts` MUST surface a "Share this milestone?" prompt to the player after the celebration, routing to TASK-VIRAL-001's TikTok export pipeline. The prompt is opt-in; on the kids SKU, it's disabled outright (no out-of-app sharing for under-13 per TASK-LEGAL-003 §1.4).

§1.9  **Idempotent advancement.** Stage-advancement MUST be idempotent: if the server tick processes the same pet twice in rapid succession, the second pass MUST be a no-op (the row already has the new stage). Implementation MUST use Postgres `update ... where stage = $expected_old_stage` returning row count, then act on `row_count == 1`.

§1.10  **Skip-time anti-cheat.** Per TASK-OBS-002 (P4) but with TASK-PET-002's groundwork, any attempt to manipulate `born_at` (e.g. via direct DB write through a leaked service-role key) MUST be detected by a daily reconciliation job that compares `born_at` against the `pet_age_events` audit table: a `born_at` row earlier than the first `pet.hatched` audit event is suspicious + alerts the DPO.

§1.11  **Pet age events audit.** Every stage transition MUST write a row to `pet_age_events` table: `(pet_id, prev_stage, new_stage, observed_at, gating_reason)`. `gating_reason` enumerates why the transition happened or didn't — `'time_reached'`, `'time_reached_care_gated'`, `'time_not_reached'`, `'rescue_from_grandma'`, etc. Retention 7 years for kids, 2 years for standard.

§1.12  **Bulk advancement job.** A Supabase scheduled function MUST run every 5 min and check ALL active pets across both projects for pending stage advancements that haven't been picked up by their PetRoom (e.g. owner offline for the full 48h baby→teen window). This is the catch-up path so offline pets still age correctly.

§1.13  **Sleep-hour respect for advancement notifications.** On stage advance, push notification (TASK-VIRAL-005) is suppressed during the player's local 22:00–07:00 window (or 20:00–08:00 for under-13). The advancement still happens; the notification is delivered the following morning.

§1.14  **Cocos `EvolutionFlow.ts` UI.** The Cocos component MUST: (a) subscribe to `PetState.stage` changes; (b) on change to a new stage, play the TASK-ART-001 contract animation; (c) handle the swap-skin moment cleanly without flicker; (d) preserve the camera framing across the swap; (e) emit `pet.evolution.viewed` even if the player misses the animation (came back later).

§1.15  **Stale-state reconciliation on rejoin.** When a player rejoins a `PetRoom` after offline time, the server MUST: (a) compute the expected stage from `born_at`; (b) compare to `pets.stage`; (c) if different (catch-up not done), update + emit advancement events for each missed stage in chronological order; (d) broadcast to client which queues animations to play in sequence.

§1.16  **Care-gated stall surfaced to player.** When a pet would advance by age but is stalled by §1.5, the client MUST display a "Mochi seems unsure about growing up — make sure they're happy + clean + full!" message + a per-stat progress bar so the player knows what to fix. The UX must NEVER be punitive; it's a soft nudge.

§1.17  **No retrograde stages.** Once a pet reaches `adult`, it MUST NOT return to `teen` or `baby`. The `grandma_house` state is the only "downward" transition + is explicitly Permadeath-Lite (TASK-PET-008) not natural ageing.

§1.18  **Server-side test seam.** `age-clock.ts` MUST expose a `setNowForTest(timestamp)` seam (gated on `NODE_ENV !== 'production'`) for unit tests. Production builds export a frozen `Date.now()` proxy that throws on tampering.

§1.19  **Feature-flag tunability.** Stage durations + care-gate thresholds MUST be readable via Mixpanel feature flags (per TASK-OBS-001 §1.10) so live-ops can tune live without redeploy. Defaults baked into code so the system works even if Mixpanel is down (TASK-OBS-001 §10 row 3).

§1.20  **Analytics events.** `pet.stage.advance`, `pet.stage.stall { reason }`, `pet.evolution.viewed`, `pet.evolution.shared` MUST be emitted per TASK-OBS-001 §1.4 taxonomy. Schema-validated per TASK-OBS-001 §1.5.

---

## §2 — Why this design

**Why server-authoritative age computation.** The single biggest Tamagotchi-style cheat (since 1996) is jumping the device clock to skip pet-care time. Client-supplied "minutes elapsed" is wholly untrusted; only the server's monotonic UTC clock + `pets.born_at` is authoritative. Plan §PART 4 anti-cheat reasoning applies directly.

**Why 0.5 h + 48 h + 168 h durations.** Plan §PART 3 60-second-session loop assumes daily engagement. 48 h baby + 168 h teen gives the player ~9 days from hatch to adult — long enough that retention metrics depend on consistent engagement (D7 ≥ 18% target), short enough that growth feels achievable. Tunable per feature flag for soft-launch tuning.

**Why care-gated evolution.** Plan §PART 3 — "Permadeath-Lite" + "care-gated growth" make care meaningful. If pets auto-evolve regardless of care, players have no reason to feed/clean/hug. The 50% / 30 stat threshold is gentle enough that a forgetful day doesn't stall the pet, but consistent neglect does.

**Why stage gates as a single source of truth.** Every gate ("is this pet adult enough to breed?") will be queried by many action handlers (`POST /v1/breed`, `POST /v1/trade`, etc.). Centralising in `stage-gates.ts` prevents drift where one handler accidentally allows breeding for teens.

**Why Spine skin swap + half-animation timing.** The Spine skin mechanism is bandwidth-cheap (no skeleton reload). Swapping at the midpoint of the evolve animation hides the swap behind a particle burst — feels seamless. A pre-animation swap reveals the new stage too early; post-animation swap looks janky.

**Why TikTok-share prompt on evolution.** Plan §PART 3 viral hooks #5 — stage advance is a documented share-worthy moment. Auto-export with consent prompts is the canonical pattern.

**Why kids SKU disables share.** TASK-LEGAL-003 §1.4 — out-of-app links require parental gate. Stage-share to TikTok is an out-of-app action. Disabling on kids SKU is simpler than gating; the kids version saves the milestone locally for the parent to see in the parental dashboard (TASK-SUB-002).

**Why idempotent advancement.** Colyseus `setInterval` ticks can overlap during reconnection storms; without idempotency, a pet could advance twice from the same `born_at` arithmetic. Postgres `update ... where stage = $expected` is the canonical idempotency primitive.

**Why bulk advancement scheduled function.** A player offline for 60+ hours misses the in-room tick. The 5-min scheduled function catches them up server-side so they see the right pet stage when they return.

**Why sleep-hour push suppression for advancement.** Plan §PART 3 retention mechanics — "local-time push that respects sleep hours." Waking a kid at 02:00 to tell them their pet evolved is a churn signal + a real-world annoyance.

**Why stale-state reconciliation animates sequentially.** A player offline 240 h might miss baby→teen + teen→adult. Animating both in sequence + a 2-second pause between them lets the player experience the progression instead of a single jarring "your pet is now an adult" jump.

**Why care-gated stall surfaced + non-punitive.** Kid-skewing apps must avoid FOMO trauma + shame. Webkinz Next's "your pet is sad" UX has been criticised; tamagochi's care-gated stall surfaces actionable next steps without guilt.

**Why no retrograde stages.** Otherwise a player could "un-age" a pet for breeding eligibility (adult-then-not-adult). Strict forward-only matches biological intuition.

**Why feature-flag tunability.** Soft-launch tuning is the canonical f2p economy lever. Plan §PART 9 phase 2 — "Live-ops cadence weekly."

---

## §3 — API contract & code shape

### 3.1 — Age clock

```typescript
// apps/api/src/pets/evolution/age-clock.ts
import { DurationsByStage } from './evolution-config';

const DURATIONS_MS: DurationsByStage = {
  egg:    0.5 * 3600 * 1000,
  baby:   48  * 3600 * 1000,
  teen:   168 * 3600 * 1000,
  adult:  Infinity,
};

let nowOverride: number | null = null;

export const ageClock = {
  now(): number { return nowOverride ?? Date.now(); },
  setNowForTest(ts: number) {
    if (process.env.NODE_ENV === 'production') throw new Error('setNowForTest forbidden in production');
    nowOverride = ts;
  },
  shouldAdvance(bornAtIso: string, currentStage: 'egg'|'baby'|'teen'|'adult'): { advance: boolean; nextStage?: 'baby'|'teen'|'adult' } {
    if (currentStage === 'adult') return { advance: false };
    const ageMs = this.now() - new Date(bornAtIso).getTime();
    const stages: ('egg'|'baby'|'teen'|'adult')[] = ['egg','baby','teen','adult'];
    const idx = stages.indexOf(currentStage);
    const elapsedThreshold = stages.slice(0, idx + 1).reduce((acc, s) => acc + (DURATIONS_MS[s] === Infinity ? 0 : DURATIONS_MS[s]), 0);
    if (ageMs >= elapsedThreshold) {
      const next = stages[idx + 1];
      return next ? { advance: true, nextStage: next as any } : { advance: false };
    }
    return { advance: false };
  },
};
```

### 3.2 — Evolution service

```typescript
// apps/api/src/pets/evolution/evolution.service.ts
@Injectable()
export class EvolutionService {
  constructor(
    private readonly supa: SupabaseClient,
    private readonly clock: typeof ageClock,
    private readonly stallCheck: CareStallCheckService,
    private readonly audit: AuditLogService,
  ) {}

  async maybeAdvance(petId: string): Promise<{ advanced: boolean; reason: string }> {
    const { data: pet } = await this.supa.from('pets').select('*').eq('id', petId).single();
    if (!pet || pet.stage === 'adult' || pet.stage === 'grandma_house') return { advanced: false, reason: 'no_op' };

    const decision = this.clock.shouldAdvance(pet.born_at, pet.stage);
    if (!decision.advance) return { advanced: false, reason: 'time_not_reached' };

    if (decision.nextStage !== 'baby') {       // baby gate is the hatch ceremony itself
      const stalled = await this.stallCheck.isCareStalled(petId, pet.stage);
      if (stalled) {
        await this.audit.write({ who: pet.owner_id, what: 'pet.stage.stall', what_keys: { pet_id: petId, reason: 'care_threshold' } });
        return { advanced: false, reason: 'time_reached_care_gated' };
      }
    }

    const { data: updated, error } = await this.supa.from('pets').update({
      stage: decision.nextStage,
      hatched_at: decision.nextStage === 'baby' ? new Date().toISOString() : pet.hatched_at,
    }).eq('id', petId).eq('stage', pet.stage).select().single();
    if (error || !updated) return { advanced: false, reason: 'race_lost' };

    await this.supa.from('pet_age_events').insert({
      pet_id: petId, prev_stage: pet.stage, new_stage: decision.nextStage, gating_reason: 'time_reached',
    });
    return { advanced: true, reason: 'time_reached' };
  }
}
```

### 3.3 — Stage gates

```typescript
// apps/api/src/pets/evolution/stage-gates.ts
export type StageGate = 'care_actions' | 'mini_game' | 'ar_placement' | 'co_parent_invite'
                     | 'breeding' | 'trading' | 'wedding' | 'rescue_ritual' | 'generative_repro';

const GATES: Record<StageGate, ('egg'|'baby'|'teen'|'adult')[]> = {
  care_actions:       ['baby','teen','adult'],
  mini_game:          ['baby','teen','adult'],
  ar_placement:       ['teen','adult'],
  co_parent_invite:   ['teen','adult'],
  breeding:           ['adult'],
  trading:            ['adult'],
  wedding:            ['adult'],
  rescue_ritual:      [],                    // grandma_house only, handled separately
  generative_repro:   ['adult'],
};

export function canDo(gate: StageGate, stage: string): boolean {
  return (GATES[gate] as readonly string[]).includes(stage);
}
```

### 3.4 — Pet age events migration

```sql
-- infra/supabase/standard/migrations/20260517_007_pet_age_events.sql
create table public.pet_age_events (
  id bigserial primary key,
  pet_id text not null references public.pets(id) on delete cascade,
  prev_stage text not null,
  new_stage  text not null,
  observed_at timestamptz not null default now(),
  gating_reason text not null
);
create index on public.pet_age_events (pet_id, observed_at);
alter table public.pet_age_events enable row level security;
-- Service role only — analytics + DPO read.
```

---

## §4 — Acceptance criteria

**AC1.** `ageClock.shouldAdvance(bornAt, 'egg')` returns `{advance:true, nextStage:'baby'}` when `bornAt` is 31 min ago. Verified by `__tests__/age-clock.spec.ts`.

**AC2.** `ageClock.shouldAdvance(bornAt, 'baby')` returns `{advance:false}` at 47.99 h ago, `{advance:true, nextStage:'teen'}` at 48.01 h ago. Verified by spec test.

**AC3.** `EvolutionService.maybeAdvance` is idempotent: calling twice in race conditions advances once. Verified by `__tests__/evolution.spec.ts` with parallel calls + asserting `row_count == 1`.

**AC4.** Care-stalled pet does NOT advance baby → teen even though time threshold reached. Verified by spec test with seeded `last_seen_at` + stat history.

**AC5.** Stage-gates: `canDo('breeding', 'teen')` returns false; `canDo('breeding', 'adult')` returns true. Verified by `__tests__/stage-gates.spec.ts`.

**AC6.** Cocos `EvolutionFlow.ts` plays `evolve_baby_to_teen` animation + swaps skin at midpoint. Verified by `__tests__/EvolutionFlow.spec.ts` with mocked Spine player.

**AC7.** Stale-state reconciliation: a pet whose `born_at` is 240 h ago + `stage='baby'` reconciles to `'adult'` on player rejoin with 2 sequential animation broadcasts. Verified by integration test.

**AC8.** Bulk advancement scheduled function picks up offline pets — pets whose owner is not in any PetRoom advance correctly. Verified by `__tests__/bulk-advancement.spec.ts` with a 5-min tick mock.

**AC9.** Push notification on advancement is suppressed during 22:00-07:00 local. Verified by spec test with mocked region + time-of-day.

**AC10.** Kids SKU disables the share prompt on evolution. Verified by `__tests__/EvolutionFlow.spec.ts` with `BUILD_TARGET=kids`.

**AC11.** `pet.stage.advance` analytics event is emitted with the documented schema. Verified by spec test + obs schema validation.

**AC12.** Care-stalled UX surfaces actionable next steps (per-stat progress bar). Verified by Playwright UI test on the stalled state.

---

## §5 — Verification

### 5.1 — Age-clock test

```typescript
// apps/api/src/pets/evolution/__tests__/age-clock.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ageClock } from '../age-clock';

describe('TASK-PET-002 — age clock', () => {
  beforeEach(() => { ageClock.setNowForTest(Date.parse('2026-08-12T14:00:00Z')); });

  it('egg → baby at 31 min', () => {
    const bornAt = new Date(ageClock.now() - 31 * 60 * 1000).toISOString();
    expect(ageClock.shouldAdvance(bornAt, 'egg')).toEqual({ advance: true, nextStage: 'baby' });
  });

  it('baby → teen at 48 h', () => {
    const bornAt = new Date(ageClock.now() - 48.01 * 3600 * 1000).toISOString();
    expect(ageClock.shouldAdvance(bornAt, 'baby')).toEqual({ advance: true, nextStage: 'teen' });
  });

  it('does NOT advance baby at 47.99 h', () => {
    const bornAt = new Date(ageClock.now() - 47.99 * 3600 * 1000).toISOString();
    expect(ageClock.shouldAdvance(bornAt, 'baby').advance).toBe(false);
  });

  it('does not advance adult', () => {
    expect(ageClock.shouldAdvance(new Date(0).toISOString(), 'adult')).toEqual({ advance: false });
  });

  it('setNowForTest forbidden in production', () => {
    const orig = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
    expect(() => ageClock.setNowForTest(0)).toThrow(/forbidden/);
    process.env.NODE_ENV = orig;
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/realtime/src/rooms/handlers/evolution.handler.ts
import { Room } from 'colyseus';
import { EvolutionService } from '@/api-shared/evolution';

export function installEvolutionTick(room: Room<any>, svc: EvolutionService) {
  room.clock.setInterval(async () => {
    for (const [, pet] of room.state.pets) {
      const r = await svc.maybeAdvance(pet.id);
      if (r.advanced) {
        pet.stage = r.nextStage!;            // schema update broadcasts diff to client
        room.broadcast('pet.evolved', { pet_id: pet.id, new_stage: pet.stage });
      }
    }
  }, 30_000);
}
```

---

## §7 — Dependencies

**External:** Postgres scheduled functions (Supabase Edge Functions cron — `pg_cron` extension).

**Internal:** TASK-PET-001 (pets table + born_at column); TASK-ART-001 (Spine contract animations `evolve_baby_to_teen`, `evolve_teen_to_adult` + skin presets); TASK-INFRA-002 (Colyseus tick loop + room broadcast).

**Blocks:** TASK-PET-003 (stat-bar decay uses stage to set decay rates); TASK-PET-007 (breeding requires `stage='adult'`); TASK-PET-008 (Permadeath-Lite reads stage); TASK-CARE-005 (streak system); TASK-VIRAL-001 (share-on-evolution).

---

## §8 — Example payloads

### 8.1 — `pet.stage.advance` event

```json
{
  "event": "pet.stage.advance",
  "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "owner_id": "01HC7QGZK4XN8YA1J3WB6XX99",
  "prev_stage": "baby",
  "new_stage": "teen",
  "born_at": "2026-08-10T14:00:00Z",
  "advanced_at": "2026-08-12T14:00:01Z",
  "gating_reason": "time_reached",
  "tenant_id": "mochi"
}
```

### 8.2 — `pet.stage.stall` event (care-gated)

```json
{
  "event": "pet.stage.stall",
  "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "current_stage": "baby",
  "would_be_stage": "teen",
  "reason": "care_threshold",
  "care_violations": { "hunger_hours_below_30": 16, "happiness_hours_below_30": 12 },
  "occurred_at": "2026-08-12T14:00:01Z"
}
```

### 8.3 — `pet_age_events` row

```json
{
  "id": 42,
  "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "prev_stage": "baby",
  "new_stage": "teen",
  "observed_at": "2026-08-12T14:00:01Z",
  "gating_reason": "time_reached"
}
```

### 8.4 — Stage-gate check at care handler

```typescript
if (!canDo('co_parent_invite', pet.stage)) {
  throw new HttpException('pet.stage.locked', 403);
}
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Real-time hours or game-time accelerated? → §1.2 — real-time hours; tunable via feature flag for events (e.g. "double speed event").
- **OQ-2 (resolved):** Care-stall threshold — 30%? → §1.5 — < 30 for > 50% of window; tunable.
- **OQ-3 (resolved):** Re-evaluate stage on stat recovery? → §1.4 — next tick after recovery picks it up.
- **OQ-4 (resolved):** Bulk advancement frequency — 5 min? → §1.12 — 5 min is the balance between freshness and Supabase scheduled-function cost.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Race condition: in-room tick and bulk job both try to advance simultaneously | DB `update ... where stage = $expected` returns row_count 0 for the second | Second call no-ops | Idempotency by design |
| 2 | `born_at` tampered via direct DB write | Daily reconciliation comparing `born_at` vs first `pet_age_events.observed_at` | DPO alert | Restore from backup; rotate service-role key |
| 3 | Care-stall threshold too aggressive (everyone stalls) | Feature-flag-driven; A/B cohort retention drops | Soft-launch fix | Lower threshold via Mixpanel feature flag |
| 4 | Spine skin swap mid-animation fails (skeleton corrupted) | Cocos error event | Pet renders missing slot | Force a full reload via `loadPetSkeleton`; emit Sentry |
| 5 | Bulk-advancement scheduled function fails (Supabase outage) | Supabase scheduled-task error log | Offline pets don't advance | Re-run on recovery; surface "your pet is catching up" UX on rejoin |
| 6 | Stale-state reconciliation animates wrong sequence | UI test fixture | UX feels off | Re-order broadcast events; pause between |
| 7 | Push notification delivered during sleep hours | OBS alert + user complaints | Churn risk | Tighten time-zone resolution; respect DST |
| 8 | Kids SKU share prompt accidentally enabled | Playwright test fails | COPPA / store-policy hit | Build-target injection bug; patch + hotfix |
| 9 | Feature-flag override accidentally sets baby duration to 0 | Mixpanel audit log | Pets instantly evolve | Revoke flag; manual reconciliation of affected pets |
| 10 | Pets that should be adult are still teen after migration to a new evolution config | Migration script | Stage backlog | Bulk re-run advancement on affected rows |
| 11 | Postgres deadlock on concurrent `update pets set stage = X where stage = Y` | DB error log | Retry storm | Use `for update skip locked` pattern; widen tick interval |
| 12 | Cocos `EvolutionFlow.ts` fails to play if entered mid-animation | UI test | Pet stuck visually | On scene re-enter, snap to terminal frame; emit Sentry |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (evolution arc + retention), plan §PART 4 (anti-cheat — server-authoritative timers).

**Sub-decisions punted to ops:**
- Final stage-duration tuning happens in soft launch — Mixpanel flags `evolution.baby_to_teen.duration_h` + `evolution.teen_to_adult.duration_h`.
- Care-stall threshold tuning via flags `evolution.care_stall.hours_below_30` + `evolution.care_stall.window_pct`.

**Anti-patterns explicitly forbidden:**
- Client-sent `age_minutes` value.
- Device wall-clock for ageing.
- Retrograde stages (adult → teen).
- `Math.random()` for evolution outcomes (although none currently random; rule applied prospectively for TASK-PET-007 breeding traits).

**Cross-reference:** This task is the pet-lifecycle substrate. TASK-PET-003 (stat decay rates by stage), TASK-PET-007 (breeding adult gate), TASK-PET-008 (Permadeath-Lite from any active stage) all depend on stage being trustworthy.
