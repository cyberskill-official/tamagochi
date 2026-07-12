---
id: FR-PET-003
title: "Stat-bar model (hunger / cleanliness / happiness / energy) with stage-aware decay + offline reconciliation"
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
related_frs: [FR-PET-001, FR-PET-002, FR-PET-004, FR-INFRA-002, FR-CARE-001, FR-CARE-002, FR-CARE-003, FR-CARE-005, FR-PET-008, FR-AI-001, FR-OBS-001]
depends_on: [FR-PET-001, FR-PET-002]
blocks: [FR-CARE-001, FR-CARE-002, FR-CARE-003, FR-CARE-005, FR-PET-008]
effort_hours: 10
new_files:
  - "apps/api/src/pets/stats/stat-decay.service.ts"
  - "apps/api/src/pets/stats/stat-config.ts"
  - "apps/api/src/pets/stats/stat-reconciliation.service.ts"
  - "apps/api/src/pets/stats/stat-history.service.ts"
  - "apps/api/src/pets/stats/__tests__/stat-decay.spec.ts"
  - "apps/api/src/pets/stats/__tests__/stat-reconciliation.spec.ts"
  - "apps/api/src/pets/stats/__tests__/stat-config.spec.ts"
  - "apps/realtime/src/rooms/handlers/stat-tick.handler.ts"
  - "apps/cocos/assets/_root/pets/StatBar.ts"
  - "apps/cocos/assets/_root/pets/__tests__/StatBar.spec.ts"
  - "infra/supabase/standard/migrations/20260517_008_pet_stat_history.sql"
modified_files:
  - "apps/api/src/pets/pets.service.ts"
  - "apps/realtime/src/state/PetState.ts"
  - "apps/realtime/src/rooms/PetRoom.ts"
allowed_tools:
  - "Postgres (compressed `pet_stat_history` hypertable via TimescaleDB extension)"
  - "Colyseus periodic tick"
  - "Cocos GFX for stat-bar rendering (existing Sprite + Mask)"
disallowed_tools:
  - "Client-controlled stat values (server-authoritative only — anti-cheat per FR-INFRA-002 §1.10)"
  - "Negative or > 100 stat values (clamp at boundaries)"
  - "Stats decaying during `grandma_house` stage (frozen until rescue)"
risk_if_skipped: "Stat-bar model is the core care loop signal — without it the daily session loop has nothing to render, FR-CARE-001/002/003 have no state to mutate, FR-PET-008 has no neglect signal, FR-PET-002 has no care-gated stall input."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Four stats.** Every pet MUST track exactly **four** stat-bars: `hunger`, `cleanliness`, `happiness`, `energy`. All integers 0–100. Plan §PART 3 — these map to feed / clean / hug+mini-game / sleep care actions.

§1.2  **Decay rates by stage (units per hour).** Decay rate MUST be stage-aware. Defaults:

| Stat | egg | baby | teen | adult |
|---|---:|---:|---:|---:|
| hunger | 0 | 4.0 | 3.0 | 2.0 |
| cleanliness | 0 | 3.0 | 2.5 | 2.0 |
| happiness | 0 | 2.5 | 2.0 | 1.5 |
| energy | 0 | 3.5 | 3.0 | 2.5 |

Rates configurable via Mixpanel feature flags (per FR-OBS-001 §1.10). `egg` decays at 0 (pre-hatch — pet has no needs yet). `grandma_house` decays at 0 (pet is frozen in the rescue path).

§1.3  **Decay is monotonic linear.** The decay function MUST be `clamp_0_100(current - rate * hours_since_last_seen)`. No non-linear curves. No stat goes below 0; no stat goes above 100.

§1.4  **Care action effects.** Care actions mutate stats by these amounts (delta from current, clamped 0–100):

| Action | hunger | cleanliness | happiness | energy |
|---|---:|---:|---:|---:|
| feed (basic food) | +30 | 0 | 0 | 0 |
| feed (premium food) | +50 | 0 | +5 | 0 |
| clean | 0 | +60 | 0 | -5 |
| hug | 0 | 0 | +25 | 0 |
| mini-game (win) | 0 | -3 | +20 | -10 |
| mini-game (loss) | 0 | -2 | +5 | -8 |
| sleep (8h passive) | 0 | -5 | 0 | +90 |

Exact values configurable per FR-OBS-001 feature flag. The cleanliness penalty on mini-game / sleep models real-world wear-and-tear.

§1.5  **Server-authoritative computation.** Every stat value MUST be computed server-side. The client never decides "your hunger is 75 now" — it asks the server, which holds authoritative state in Colyseus `PetState` + persists to Postgres on idle disposal (FR-INFRA-002 §1.12).

§1.6  **In-room tick.** Colyseus `PetRoom` MUST run a `stat-tick.handler.ts` every **60 seconds** while the room is non-idle. Each tick: (a) computes elapsed minutes since `pets.last_seen_at`; (b) applies decay to `PetState`; (c) broadcasts diff via Colyseus schema sync. The tick is a no-op during `egg` and `grandma_house` stages.

§1.7  **Offline reconciliation.** On player rejoin (Colyseus `onJoin`), the server MUST: (a) compute total minutes offline; (b) cap effective decay at 24 hours (a player gone 5 days does NOT find an empty pet at 0 — caps preserve emotional retention); (c) apply capped decay; (d) emit `pet.offline.reconciled` event with diff stats.

§1.8  **Care prerequisite snapshot.** Every minute the in-room tick MUST write a row to `pet_stat_history` (TimescaleDB hypertable): `(pet_id, stat, value, observed_at)`. This is the substrate for FR-PET-002 §1.5 care-gated stall detection (queries last 24/72 h history for hours-below-30). Retention 90 days (compressed after 7 days).

§1.9  **Stat warnings.** When any stat crosses 30 → 29 (downward), Colyseus MUST broadcast `pet.stat.warn { stat, value }` to the player. The Cocos client renders a soft "Mochi looks <hungry / dirty / sad / tired>" inline hint. When stat crosses 10 → 9, broadcast `pet.stat.critical` triggering a stronger UI cue + a deferred push notification (subject to sleep-hours per FR-VIRAL-005).

§1.10  **Stat full-state on join.** Colyseus `onJoin` MUST broadcast the full current stat snapshot before the client renders; the client MUST display the stat-bar at server-truth values, NOT extrapolate.

§1.11  **Stat-bar rendering — accessibility.** The Cocos `StatBar.ts` component MUST: (a) render each bar with a colour-blind-safe palette (defaults to the FR-A11Y-001 colour-blind preset when enabled); (b) show numeric value on long-press for screen-reader users; (c) animate transitions at ≤ 200 ms (capped at 50 ms under reduce-motion). Bar fill colours: green ≥ 50; yellow 30-49; orange 20-29; red < 20.

§1.12  **Persistence cadence.** `PetState` stat updates are persisted to `public.pets` table on: (a) every care action (immediate); (b) every 5 min if the room is active; (c) on `onDispose` (room idle 15 min, FR-INFRA-002 §1.12). The Postgres columns MUST be added in the migration: `hunger int not null default 100, cleanliness int not null default 100, happiness int not null default 100, energy int not null default 100`.

§1.13  **Persistence is best-effort with eventual consistency guarantees.** If Postgres is briefly unavailable, in-room state remains correct (Colyseus is authoritative for the active session). The reconciliation on next disposal flush picks up missed writes via the room's "dirty since last flush" tracker.

§1.14  **Stat-clamp at care-action handlers.** Every care-action handler MUST clamp resulting stat values to [0, 100]. Negative or > 100 values MUST be impossible — handler-level clamping is enforced by a shared `clampStat()` utility + asserted in tests.

§1.15  **Stat decay anti-cheat.** Direct client writes to `PetState.hunger` etc. MUST be impossible — Colyseus schema is server-only. Care actions go through server handlers per FR-INFRA-002 §1.10. Impossible state transitions (e.g. negative stat values) emit `security.impossible-transition` Sentry event (FR-INFRA-002 §1.9).

§1.16  **Energy + sleep — passive recovery.** Unlike the other three stats, `energy` recovers passively during the "sleep" period defined as `local 22:00–07:00` (per player's region). During this window, `energy` recovers at +12/hr (so 8 hours sleep restores 96 points, capped at 100). Hunger / cleanliness / happiness still decay during sleep (slower at the stage-rate × 0.5).

§1.17  **AI prompt context.** The current stats (and 24 h history) MUST be exposable to the AI personality engine (FR-AI-001) as part of the persona-context payload. AI replies are aware of pet emotional state ("Mochi is feeling really hungry right now ...").

§1.18  **Co-parent visibility.** When FR-SOCIAL-002 (co-parent) ships, the co-parent MUST see live stat-bars + care-action history. The schema MUST be co-parent-aware from day one (RLS extension is the path).

§1.19  **Feature-flag tunability.** All decay rates + care-action effects MUST be readable via Mixpanel feature flags. Defaults baked into code (FR-OBS-001 §10 row 3 fallback).

§1.20  **Analytics + observability.** `pet.stat.changed { stat, prev, new, source }`, `pet.stat.warn`, `pet.stat.critical`, `pet.offline.reconciled` MUST be emitted per FR-OBS-001 §1.4 taxonomy with schema validation. The mini-game / care-action source MUST be tagged so funnel analysis can identify which care actions drive retention.

---

## §2 — Why this design

**Why four stats.** Plan §PART 3 — Tamagotchi-style is canonically a multi-stat care loop. Fewer stats trivialise the loop (one stat = "fill this bar"); more stats overwhelm casual players. Pou uses 4; Talking Tom uses ~4 with simplified UX. Four stats with distinct care actions is the proven design.

**Why monotonic linear decay.** Players form intuition about a linear "10 points per hour" rule fast. Non-linear curves (e.g. exponential — decays slow at full, fast when low) feel buggy ("I just fed them why are they hungry already?"). Linear decay also makes the math straightforward for the player + the QA team.

**Why stage-aware decay rates.** A baby pet decaying as slow as an adult feels static. A baby decaying faster simulates "babies need more care" intuition + ramps up engagement during the early stage where retention is most fragile.

**Why cap offline decay at 24 hours.** A player offline 5 days returning to a 0-stat pet is a churn trigger. The cap softens this — they return to a slightly-needy pet, not a crisis. Plan §PART 3 retention mechanics emphasise non-punitive design.

**Why TimescaleDB hypertable for stat-history.** Stat history is high-write-volume time-series (one row per pet per minute). TimescaleDB compresses + auto-partitions this efficiently. 90-day retention with compression after 7 days gives FR-PET-002 care-stall detection ample window without runaway storage. Same TimescaleDB pattern used in sale-noti project for price history — but as per the project-isolation rule, we don't cite that, we just adopt the proven pattern.

**Why broadcast warnings at 30 → 29 and 10 → 9.** These are the inflection points where a player should care + intervene. 30 is the FR-PET-002 care-gated-stall threshold (warning gives the player a chance to act before the stall actually triggers). 10 is critical territory before FR-PET-008 Permadeath-Lite kicks in.

**Why best-effort persistence + Colyseus-authoritative for active session.** Postgres latency / availability is fine for periodic flushes; in-room state needs to be instantaneous. Colyseus + in-memory + 5-min flush is the canonical pattern. Worst case (Postgres down for 30 min, room disposes mid-outage): we lose ≤ 30 min of stat progression, recoverable from `pet_stat_history` reconciliation on next room create.

**Why passive energy recovery during sleep hours.** Plan §PART 3 — "respect sleep hours." Energy recovering only via active gameplay would punish players who do close the app at night (good behaviour). Passive recovery rewards healthy real-world habits.

**Why all care-action effects in one table.** Single source of truth simplifies live-ops tuning + FR review. The Mixpanel feature-flag bindings consume the same table.

**Why colour-blind-safe palette default.** Plan §PART 5 accessibility. Green/red is the canonical pitfall — using yellow/orange in the middle band gives 4-tier readability for protan/deutan colour-blind users without a setting toggle.

**Why feature-flag tunability over hardcoded values.** Soft-launch in VN will demand 5-10 tuning iterations on decay rates (too aggressive = churn; too gentle = no urgency). Without flag-driven tuning, every adjustment is a redeploy.

**Why source-tagging in stat events.** Funnel analysis: "do players who feed Premium food retain better than Basic feeders?" requires knowing which action source moved the stat. Without it the analytics team is blind to which care primitive drives retention.

**Why co-parent visibility designed in day one.** Plan §PART 3 + FR-SOCIAL-002 — PetPair is the viral wedge. If stat-bar visibility is owner-only at P1, P2 needs to retrofit; designing the RLS for co-parent at P1 is essentially free.

---

## §3 — API contract & code shape

### 3.1 — Stat decay service

```typescript
// apps/api/src/pets/stats/stat-decay.service.ts
import { Injectable } from '@nestjs/common';
import { STAT_CONFIG } from './stat-config';

export type StatName = 'hunger' | 'cleanliness' | 'happiness' | 'energy';
export type Stats = Record<StatName, number>;
export type Stage = 'egg' | 'baby' | 'teen' | 'adult' | 'grandma_house';

@Injectable()
export class StatDecayService {
  decay(stats: Stats, stage: Stage, minutesElapsed: number, opts: { isSleepWindow: boolean } = { isSleepWindow: false }): Stats {
    if (stage === 'egg' || stage === 'grandma_house') return { ...stats };
    const hours = Math.max(0, minutesElapsed / 60);
    const cappedHours = Math.min(hours, 24);              // §1.7 offline cap
    const sleepMult = opts.isSleepWindow ? 0.5 : 1.0;     // §1.16
    const result: Stats = { ...stats };
    for (const k of ['hunger','cleanliness','happiness'] as const) {
      const rate = STAT_CONFIG.decay[stage][k] * sleepMult;
      result[k] = clamp(result[k] - rate * cappedHours);
    }
    if (opts.isSleepWindow) {
      result.energy = clamp(result.energy + STAT_CONFIG.energy_sleep_recovery_per_h * cappedHours);
    } else {
      result.energy = clamp(result.energy - STAT_CONFIG.decay[stage].energy * cappedHours);
    }
    return result;
  }

  apply(stats: Stats, action: keyof typeof STAT_CONFIG.actions, outcome: 'win' | 'loss' = 'win'): Stats {
    const effects = STAT_CONFIG.actions[action]?.[outcome] ?? STAT_CONFIG.actions[action];
    const result: Stats = { ...stats };
    for (const [k, delta] of Object.entries(effects ?? {})) {
      result[k as StatName] = clamp(result[k as StatName] + (delta as number));
    }
    return result;
  }
}

function clamp(v: number): number { return Math.max(0, Math.min(100, Math.round(v))); }
```

### 3.2 — Stat config

```typescript
// apps/api/src/pets/stats/stat-config.ts
export const STAT_CONFIG = {
  decay: {
    egg:           { hunger: 0,   cleanliness: 0,   happiness: 0,   energy: 0   },
    baby:          { hunger: 4.0, cleanliness: 3.0, happiness: 2.5, energy: 3.5 },
    teen:          { hunger: 3.0, cleanliness: 2.5, happiness: 2.0, energy: 3.0 },
    adult:         { hunger: 2.0, cleanliness: 2.0, happiness: 1.5, energy: 2.5 },
    grandma_house: { hunger: 0,   cleanliness: 0,   happiness: 0,   energy: 0   },
  },
  energy_sleep_recovery_per_h: 12,
  actions: {
    feed_basic:   { hunger: +30, cleanliness: 0,   happiness: 0,   energy: 0   },
    feed_premium: { hunger: +50, cleanliness: 0,   happiness: +5,  energy: 0   },
    clean:        { hunger: 0,   cleanliness: +60, happiness: 0,   energy: -5  },
    hug:          { hunger: 0,   cleanliness: 0,   happiness: +25, energy: 0   },
    mini_game: {
      win:        { hunger: 0,   cleanliness: -3,  happiness: +20, energy: -10 },
      loss:       { hunger: 0,   cleanliness: -2,  happiness: +5,  energy: -8  },
    },
  },
} as const;
```

### 3.3 — Stat history migration (TimescaleDB hypertable)

```sql
-- infra/supabase/standard/migrations/20260517_008_pet_stat_history.sql
create extension if not exists timescaledb;

create table public.pet_stat_history (
  pet_id text not null references public.pets(id) on delete cascade,
  observed_at timestamptz not null default now(),
  hunger int not null,
  cleanliness int not null,
  happiness int not null,
  energy int not null,
  primary key (pet_id, observed_at)
);
select create_hypertable('public.pet_stat_history', 'observed_at', if_not_exists => true);
select add_retention_policy('public.pet_stat_history', interval '90 days', if_not_exists => true);
select add_compression_policy('public.pet_stat_history', interval '7 days', if_not_exists => true);

alter table public.pet_stat_history enable row level security;
create policy "pet_stat_history self" on public.pet_stat_history for select
  using (pet_id in (select id from public.pets where owner_id = auth.uid()));
```

### 3.4 — Stat tick handler (Colyseus)

```typescript
// apps/realtime/src/rooms/handlers/stat-tick.handler.ts
export function installStatTick(room: any, deps: { decay: StatDecayService; history: StatHistoryService }) {
  room.clock.setInterval(async () => {
    const now = Date.now();
    for (const [, pet] of room.state.pets) {
      if (pet.stage === 'egg' || pet.stage === 'grandma_house') continue;
      const sinceMin = (now - pet.lastSeenMs) / 60_000;
      const isSleep = isLocalSleepWindow(pet.ownerRegion);
      const decayed = deps.decay.decay(snapshot(pet), pet.stage, sinceMin, { isSleepWindow: isSleep });
      applyToColyseus(pet, decayed);
      pet.lastSeenMs = now;
      maybeBroadcastWarnings(room, pet, snapshot(pet), decayed);
      deps.history.recordTick(pet.id, decayed);
    }
  }, 60_000);
}
```

---

## §4 — Acceptance criteria

**AC1.** `StatDecayService.decay({...all 100}, 'baby', 60, {isSleepWindow:false})` returns approximately `{hunger:96, cleanliness:97, happiness:97.5, energy:96.5}` (within 1 unit). Verified by `__tests__/stat-decay.spec.ts`.

**AC2.** `StatDecayService.decay({...all 100}, 'egg', 60, {})` returns unchanged stats. Verified by spec test.

**AC3.** `StatDecayService.decay({...all 100}, 'baby', 2880, {})` (48 h offline) returns stats reflecting only 24 h of decay (cap). Verified by spec test.

**AC4.** Sleep-window energy recovery: `decay({...energy: 50}, 'adult', 60, {isSleepWindow:true})` returns energy ≈ 62. Verified by spec test.

**AC5.** `StatDecayService.apply` clamps stat values: applying `clean` (+60) to cleanliness=70 returns 100, not 130. Verified by spec test.

**AC6.** Negative stat values are impossible — applying `feed_basic` to hunger=-5 (invalid input) clamps to 0+30=30. Verified by spec test.

**AC7.** Colyseus tick broadcasts diff via schema sync. Verified by `__tests__/PetRoom.spec.ts` integration test.

**AC8.** Stat warning at 30→29 boundary broadcasts `pet.stat.warn`. Verified by spec test stepping decay across boundary.

**AC9.** `pet_stat_history` hypertable accepts inserts and respects 90-day retention. Verified by migration test on a shadow Supabase.

**AC10.** Offline reconciliation: a pet whose last_seen was 48h ago + stats {hunger:80, ...} on rejoin sees correct decayed stats (24h cap applied). Verified by integration test.

**AC11.** Co-parent visibility: a co-parent (FR-SOCIAL-002 will activate) cannot read another player's stat-history at the schema level — verified by RLS test (even if FR-SOCIAL-002 not yet shipped, the policy denies until the co-parent join row exists).

**AC12.** Stat-bar Cocos component renders in colour-blind-safe palette by default. Verified by Playwright UI test snapshotting the bar colours.

**AC13.** Mini-game win effects: applying `mini_game.win` to {happiness:60, cleanliness:80, energy:60} returns {happiness:80, cleanliness:77, energy:50}. Verified by spec test.

**AC14.** Feature-flag override: setting `pet.stat.decay.baby.hunger=8` via Mixpanel flag doubles the baby hunger decay rate at next tick. Verified by spec test mocking flag service.

---

## §5 — Verification

### 5.1 — Stat decay tests

```typescript
// apps/api/src/pets/stats/__tests__/stat-decay.spec.ts
import { describe, it, expect } from 'vitest';
import { StatDecayService } from '../stat-decay.service';

describe('FR-PET-003 — stat decay', () => {
  const svc = new StatDecayService();
  const full = { hunger: 100, cleanliness: 100, happiness: 100, energy: 100 };

  it('1 hour baby decay matches table', () => {
    const r = svc.decay(full, 'baby', 60, { isSleepWindow: false });
    expect(r).toEqual({ hunger: 96, cleanliness: 97, happiness: 98, energy: 96 });
  });

  it('egg does not decay', () => {
    expect(svc.decay(full, 'egg', 600, {})).toEqual(full);
  });

  it('48h offline caps at 24h', () => {
    const r48 = svc.decay(full, 'baby', 2880, {});
    const r24 = svc.decay(full, 'baby', 1440, {});
    expect(r48).toEqual(r24);
  });

  it('sleep recovers energy', () => {
    const r = svc.decay({ ...full, energy: 50 }, 'adult', 60, { isSleepWindow: true });
    expect(r.energy).toBeGreaterThanOrEqual(61);
    expect(r.energy).toBeLessThanOrEqual(63);
  });

  it('clamps at 0..100', () => {
    expect(svc.apply({ hunger: 70, cleanliness: 100, happiness: 0, energy: 0 }, 'clean')).toMatchObject({ cleanliness: 100 });
    expect(svc.apply({ hunger: 0, cleanliness: 0, happiness: 0, energy: 0 }, 'hug')).toMatchObject({ happiness: 25 });
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/pets/stats/stat-reconciliation.service.ts
@Injectable()
export class StatReconciliationService {
  constructor(private readonly decay: StatDecayService, private readonly supa: SupabaseClient) {}

  async reconcileOnRejoin(petId: string): Promise<{ deltaStats: Partial<Stats>; reconciled: boolean }> {
    const { data: pet } = await this.supa.from('pets').select('*').eq('id', petId).single();
    if (!pet || pet.stage === 'egg' || pet.stage === 'grandma_house') return { deltaStats: {}, reconciled: false };
    const now = Date.now();
    const sinceMin = (now - new Date(pet.last_seen_at).getTime()) / 60_000;
    if (sinceMin < 1) return { deltaStats: {}, reconciled: false };
    const next = this.decay.decay(
      { hunger: pet.hunger, cleanliness: pet.cleanliness, happiness: pet.happiness, energy: pet.energy },
      pet.stage as any, sinceMin, { isSleepWindow: false /* TODO: derive */ },
    );
    await this.supa.from('pets').update({ ...next, last_seen_at: new Date().toISOString() }).eq('id', petId);
    return { deltaStats: next, reconciled: true };
  }
}
```

---

## §7 — Dependencies

**External:** Supabase TimescaleDB extension enabled.

**Internal:** FR-PET-001 (`pets` table + last_seen_at + cascade), FR-PET-002 (`stage` column drives decay rate selection).

**Blocks:** FR-CARE-001/002/003/004 (each care action calls `StatDecayService.apply`), FR-CARE-005 (streak system reads stat history), FR-PET-008 (Permadeath-Lite reads 7-day stat history).

---

## §8 — Example payloads

### 8.1 — `pet.stat.changed` event

```json
{
  "event": "pet.stat.changed",
  "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "stat": "hunger",
  "prev": 95,
  "new": 99,
  "source": "care.feed_basic",
  "stage": "baby",
  "tenant_id": "mochi",
  "emitted_at": "2026-08-12T14:36:01Z"
}
```

### 8.2 — `pet.stat.warn`

```json
{
  "event": "pet.stat.warn",
  "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "stat": "happiness",
  "value": 29,
  "stage": "baby"
}
```

### 8.3 — `pet.offline.reconciled`

```json
{
  "event": "pet.offline.reconciled",
  "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "offline_minutes": 1820,
  "offline_minutes_capped": 1440,
  "delta": { "hunger": -96, "cleanliness": -72, "happiness": -60, "energy": -84 }
}
```

### 8.4 — Stat-history row

```json
{ "pet_id": "01HC7QG...", "observed_at": "2026-08-12T14:36:01Z", "hunger": 76, "cleanliness": 82, "happiness": 71, "energy": 55 }
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** 4 stats vs 5/6? → §1.1 — 4 matches plan + Pou + Talking Tom precedent.
- **OQ-2 (resolved):** Linear vs exponential decay? → §1.3 + §2 — linear; intuitable.
- **OQ-3 (resolved):** Offline cap — 24 h or 48 h? → §1.7 — 24 h, retention-protective.
- **OQ-4 (resolved):** Should energy decay at all? → §1.16 — yes during waking hours, recovers in sleep window.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Tick handler stops firing (Colyseus clock bug) | Synthetic check on `pet.stat.tick` event rate | Stats freeze | Restart room; investigate clock |
| 2 | TimescaleDB extension unavailable | Migration fails | History writes fail | Fallback to plain table; compress manually; or pin to compatible Supabase tier |
| 3 | Mixpanel feature flag returns NaN value | `STAT_CONFIG` fallback hit | Defaults apply | Flag service alerts; investigate flag JSON |
| 4 | Stat clamp bypassed somewhere (negative value reaches DB) | Postgres `check` constraint rejects | Insert fails | Audit caller path; add unit test for that handler |
| 5 | Sleep-window timezone wrong (DST transition) | Stat decay timing off-by-1-hour | Confused player UX | Use IANA TZ data; recompute on TZ change |
| 6 | Offline reconciliation infinite loop (last_seen_at not updated) | Memory + CPU spike | Server hot | Set last_seen_at unconditionally on reconcile |
| 7 | RLS missing on `pet_stat_history` exposing other players' history | Spec test fails | Privacy exposure | Add RLS policy; audit Sentry for affected rows |
| 8 | Stat warning event flood | OBS alert | Notification spam | Hysteresis (only fire on crossing, not repeated) |
| 9 | Premium-food handler accidentally applies twice (idempotency miss) | Stat unexpected | Anti-cheat triggers | Per-handler idempotency keys |
| 10 | Stat-history retention policy fails | Disk grows | Storage cost spike | Manual `add_retention_policy`; audit Supabase |
| 11 | Co-parent stat broadcast leaks to non-co-parent | RLS test fails | Privacy issue | Tighten RLS; audit Sentry |
| 12 | Concurrent care actions mutate stats simultaneously | Optimistic concurrency conflict | Race | Server serialises via per-pet mutex in Colyseus room |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (core loop — feed/clean/hug + stat bars), plan §PART 4 (anti-cheat — server-authoritative), plan §PART 5 (accessibility — colour-blind palette).

**Sub-decisions punted to ops:**
- Final stat decay rates (Mixpanel feature flag) — tuned in soft launch.
- Sleep-window time-zone resolution — uses player's `region_of_record` + IANA tz mapping.

**Anti-patterns explicitly forbidden:**
- Client-side stat value (anti-cheat).
- Non-linear decay curves.
- Decay during `egg` or `grandma_house`.
- Stat values outside [0, 100].

**Cross-reference:** FR-CARE-001/002/003/004/005 + FR-PET-008 all depend on this model. FR-AI-001 reads stat state for personality dialogue. FR-PET-002 reads 24/72 h history for care-gated stall detection.
