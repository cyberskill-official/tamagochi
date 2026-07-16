---
id: TASK-PET-008
title: "Permadeath-Lite — 7-day neglect → grandma_house + free 3-day daily-ritual rescue (no real-money revival)"
module: PET
priority: MUST
status: done
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead + designer"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-PET-001, TASK-PET-002, TASK-PET-003, TASK-PET-005, TASK-CARE-005, TASK-LEGAL-002, TASK-INFRA-003, TASK-OBS-001, TASK-AI-001, TASK-VIRAL-005]
depends_on: [TASK-PET-003, TASK-LEGAL-002]
blocks: []
effort_hours: 10
new_files:
  - "apps/api/src/pets/permadeath/grandma-watch.service.ts"
  - "apps/api/src/pets/permadeath/rescue.controller.ts"
  - "apps/api/src/pets/permadeath/rescue.service.ts"
  - "apps/api/src/pets/permadeath/__tests__/grandma-watch.spec.ts"
  - "apps/api/src/pets/permadeath/__tests__/rescue.spec.ts"
  - "apps/cocos/assets/_root/pets/GrandmaHouseScene.ts"
  - "apps/cocos/assets/_root/pets/RescueRitualUi.ts"
  - "infra/supabase/standard/migrations/20260517_017_grandma_rescues.sql"
modified_files: []
allowed_tools:
  - "Scheduled function (pg_cron) for daily neglect-check"
  - "Postgres `grandma_rescues` table"
  - "TASK-VIRAL-005 push for rescue-available notification"
disallowed_tools:
  - "Real-money revival (Belgium/NL revival-paywall ban)"
  - "Real-money rescue accelerator (HoYoverse precedent)"
  - "Permanent deletion before grace period"
  - "Punitive UX (no shame language)"
risk_if_skipped: "Plan §PART 3 + TASK-LEGAL-002 §1.5 — Permadeath-Lite is the ethical alternative to hard Tamagotchi permadeath. Without it, the neglect signal (TASK-PET-003 §1.8 critical-stat warnings) has no terminal consequence, weakening engagement loop."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Trigger condition.** A pet enters `grandma_house` state when **all four stats** (hunger, cleanliness, happiness, energy) have remained at 0 for **consecutive 168 hours (7 real-time days)**. Single-stat 0 for short period DOES NOT trigger; only full neglect.

§1.2  **Pre-grandma warnings.** At day 3 of full-stat-zero neglect, player receives push: "Mochi is feeling really lonely. Come say hi soon?" (TASK-VIRAL-005 sleep-hour respected). At day 5: "Mochi misses you a lot. We're worried." At day 7: pet enters grandma_house + notification "Mochi has gone to stay with grandma. You can bring them home anytime."

§1.3  **Grandma state.** When `pets.stage = 'grandma_house'`:
- Pet does NOT decay (TASK-PET-003 §1.2).
- Pet is NOT visible in main game scene.
- Pet appears in a special "Grandma's House" UI section.
- Pet does NOT count against slot quota (TASK-PET-005 §1.2).
- AI persona (TASK-AI-001) returns a "missing you" line.

§1.4  **Rescue ritual.** Player can rescue by performing the **daily rescue ritual** for 3 consecutive days. Each day's ritual = 1 care action (feed/clean/hug) performed on the grandma-housed pet via a special UI tap.

§1.5  **Endpoint — daily ritual.** `POST /v1/pets/:petId/grandma-rescue/ritual` — body `{ idempotency_key: string }`. Performs one day's ritual; returns `{ ritual_days_completed: 1|2|3, rescue_complete: boolean }`.

§1.6  **Rescue completion.** After 3 ritual days, pet returns to `pets.stage = <prior stage>` (preserved from `pets.last_active_stage` column added in this task). All stats reset to 50 (mid-range — not punitive, not full).

§1.7  **No real-money revival.** Per TASK-LEGAL-002 §1.5 + Belgium 2018 + Antwerp 2025 — no IAP path to bypass the 3-day ritual. The ritual is the only path.

§1.8  **Per-day cooldown.** Each ritual day MUST be ≥ 18 hours apart from the previous (prevents same-day-multiple-rituals shortcut). Player can complete ritual any time within the day after the cooldown.

§1.9  **Skipped day reset.** If 48+ hours elapse between rituals, the rescue progress resets to day 0. Player must restart. Surface gentle "Let's try again from the start!" UX — no shaming.

§1.10  **Rescue grandfathering.** A pet that has been to grandma_house and back retains its species + tier + palette_seed. TASK-PET-006 §1.10 — no tier downgrade.

§1.11  **Rescue audit.** `grandma_rescues` table: `(pet_id, owner_id, entered_grandma_at, ritual_days, completed_at, source, tenant_id)`. Per TASK-LEGAL-001 audit retention.

§1.12  **Scheduled neglect-check.** A Supabase scheduled function MUST run every 6 hours: queries all active pets where all 4 stats == 0 + `last_seen_at` ≥ 7 days ago → transitions to grandma_house + emits audit.

§1.13  **Stage gate.** Only pets at `stage ∈ {baby, teen, adult}` are eligible for grandma transition. `egg` stage cannot enter grandma (uses the natural hatch flow); already-grandma pets cannot re-enter.

§1.14  **Friendly notifications.** All grandma-related notifications MUST use non-shaming copy. Pre-approved phrases live in `apps/cocos/assets/i18n/<locale>/grandma.json`. DPO-reviewed.

§1.15  **Rescue UI.** Cocos `RescueRitualUi.ts` displays:
- Pet in grandma's house background (cozy fireside scene).
- "Day 1 of 3" progress indicator.
- One care action affordance per day.
- Calendar showing rescue progress.

§1.16  **AI persona during grandma.** Per TASK-AI-001 §1.5, persona prompt context includes "this pet is at grandma's house" — LLM responds accordingly ("I miss you..."). Plan §PART 3 + ethical retention.

§1.17  **No real-money skip cooldown.** The 18-hour cooldown cannot be skipped via IAP. Plan §PART 8.

§1.18  **Trade/breeding eligibility.** Grandma_house pets CANNOT be traded (TASK-SOCIAL-003) or bred (TASK-PET-007). Must rescue first.

§1.19  **Tenant-scoping.** Cross-tenant grandma transitions impossible per TASK-INFRA-003 §1.4.

§1.20  **Analytics.** `pet.grandma.entered`, `pet.grandma.warned { day }`, `pet.grandma.rescue.initiated`, `pet.grandma.rescue.ritual_day { day }`, `pet.grandma.rescued`, `pet.grandma.rescue.expired { ritual_days_completed }` per TASK-OBS-001.

---

## §2 — Why this design

**Why all-4-stats-zero, not single.** Plan §PART 3 + ethical retention — single-stat-0 too aggressive (player misses one feed and pet is gone). All-4-zero requires sustained neglect = clearer signal.

**Why 7-day window.** Plan §PART 3 + Tamagotchi precedent (~7-day care cycle). 7 days = 1 week off-grid = clearly disengaged.

**Why escalating warnings.** Plan §PART 5 + TASK-CARE-005 forgiveness — give the player multiple chances. 3-day warning + 5-day + 7-day forms a clear narrative.

**Why 3-day rescue ritual.** Plan §PART 3 — proportional to the 7-day neglect window. Too easy = no consequence; too hard = punishing.

**Why 18h cooldown between rituals.** Prevents same-day-3x-ritual shortcut. 18h means roughly one-per-day cadence.

**Why 48h reset on skip.** Plan §PART 3 ethical — non-punitive but commits the player. If they skip 2 days, they've effectively lost interest again; restart-from-zero is fair.

**Why grandma doesn't count against slot.** TASK-PET-005 §1.2 — encourages rescue over abandonment. Punishing the slot count would push players to give up.

**Why grandma persists species + tier.** TASK-PET-006 §1.10 — tier identity matters. Tier downgrade would feel like punishment.

**Why no real-money skip.** Plan §PART 8 + TASK-LEGAL-002 — Belgium/NL/EU loot-box-adjacent rules + HoYoverse precedent.

**Why AI says "I miss you" during grandma.** Plan §PART 3 viral hook #3 — emotional thread. Drives player back to rescue.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/pets/permadeath/grandma-watch.service.ts
@Injectable()
export class GrandmaWatchService {
  async runNeglectCheck() {
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: candidates } = await this.supa.from('pets')
      .select('*')
      .eq('status', 'active')
      .in('stage', ['baby','teen','adult'])
      .lte('last_seen_at', cutoff)
      .eq('hunger', 0).eq('cleanliness', 0).eq('happiness', 0).eq('energy', 0);
    for (const pet of candidates ?? []) {
      await this.supa.from('pets').update({
        stage: 'grandma_house', status: 'grandma',
        last_active_stage: pet.stage,
      }).eq('id', pet.id);
      await this.audit.write({ who: pet.owner_id, what: 'pet.grandma.entered', what_keys: { pet_id: pet.id, prev_stage: pet.stage } });
      await this.notify.sendGrandmaNotice(pet.owner_id, pet.display_name);
    }
  }
}
```

```typescript
// apps/api/src/pets/permadeath/rescue.service.ts (excerpt)
async ritual(u: AuthedUser, petId: string, idempKey: string) {
  const prior = await this.idemp.lookup(u.id, `ritual:${idempKey}`);
  if (prior) return prior;
  const pet = await this.pets.byId(petId);
  if (pet.owner_id !== u.id) throw new HttpException('forbidden', 403);
  if (pet.stage !== 'grandma_house') throw new HttpException('pet.grandma.not_in_grandma', 422);
  const last = await this.supa.from('grandma_rescues')
    .select('ritual_days, last_ritual_at').eq('pet_id', petId).is('completed_at', null).maybeSingle();
  if (last.data?.last_ritual_at) {
    const hoursAgo = (Date.now() - new Date(last.data.last_ritual_at).getTime()) / 3600000;
    if (hoursAgo < 18) throw new HttpException({ error: 'ritual.cooldown', retry_after_hours: 18 - hoursAgo }, 429);
    if (hoursAgo >= 48) await this.resetRitualProgress(petId);
  }
  const newCount = (last.data?.ritual_days ?? 0) + 1;
  const isComplete = newCount >= 3;
  if (isComplete) {
    await this.supa.from('pets').update({
      stage: pet.last_active_stage,
      status: 'active',
      hunger: 50, cleanliness: 50, happiness: 50, energy: 50,
      last_seen_at: new Date().toISOString(),
    }).eq('id', petId);
    await this.supa.from('grandma_rescues').update({
      ritual_days: newCount, completed_at: new Date().toISOString(),
    }).eq('pet_id', petId).is('completed_at', null);
  } else {
    await this.supa.from('grandma_rescues').upsert({
      pet_id: petId, owner_id: u.id, ritual_days: newCount,
      last_ritual_at: new Date().toISOString(),
    });
  }
  const result = { ritual_days_completed: newCount, rescue_complete: isComplete };
  await this.idemp.store(u.id, `ritual:${idempKey}`, result);
  return result;
}
```

```sql
-- migration
alter table public.pets add column last_active_stage text;

create table public.grandma_rescues (
  id bigserial primary key,
  pet_id text not null references public.pets(id) on delete cascade,
  owner_id uuid not null,
  entered_grandma_at timestamptz not null default now(),
  ritual_days int not null default 0,
  last_ritual_at timestamptz,
  completed_at timestamptz,
  tenant_id text not null default 'mochi'
);
create index on public.grandma_rescues (pet_id, completed_at);
alter table public.grandma_rescues enable row level security;
create policy "grandma self" on public.grandma_rescues for select using (owner_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** Pet with all 4 stats=0 for 7+ days transitions to grandma. Verified by fake-clock test.
**AC2.** Pet with hunger=0 but other stats >0 does NOT transition. Verified.
**AC3.** Pre-grandma push notifications at day 3, 5, 7. Verified.
**AC4.** Ritual day 1 of 3 advances progress. Verified.
**AC5.** Three rituals (≥18h apart) complete rescue + reset stats to 50. Verified.
**AC6.** 48h skip resets progress to 0. Verified.
**AC7.** Rescued pet retains species + tier. Verified.
**AC8.** No real-money rescue path — IAP catalogue lint pass. Verified.
**AC9.** Grandma pet not in main scene. Verified.
**AC10.** Grandma pet doesn't count against slot. Verified.
**AC11.** Trade/breed blocked for grandma pet. Verified.
**AC12.** AI persona "miss you" line when grandma. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/pets/permadeath/__tests__/grandma-watch.spec.ts
describe('TASK-PET-008 — grandma watch', () => {
  it('transitions pet with all 4 stats=0 + 7d neglect', async () => {
    await seedPet('p1', { hunger: 0, cleanliness: 0, happiness: 0, energy: 0, last_seen_at: daysAgo(8) });
    await svc.runNeglectCheck();
    const p = await getPet('p1');
    expect(p.stage).toBe('grandma_house');
  });

  it('does not transition with single stat=0', async () => {
    await seedPet('p1', { hunger: 0, cleanliness: 50, happiness: 50, energy: 50, last_seen_at: daysAgo(8) });
    await svc.runNeglectCheck();
    const p = await getPet('p1');
    expect(p.stage).not.toBe('grandma_house');
  });

  it('rescue requires 3 rituals 18h apart', async () => {
    await transitionToGrandma('p1');
    await rescue.ritual(user('u1'), 'p1', 'k1');
    await advanceClockH(17);
    await expect(rescue.ritual(user('u1'), 'p1', 'k2')).rejects.toMatchObject({ status: 429 });
    await advanceClockH(2);
    const r2 = await rescue.ritual(user('u1'), 'p1', 'k3');
    expect(r2.rescue_complete).toBe(false);
    await advanceClockH(20);
    const r3 = await rescue.ritual(user('u1'), 'p1', 'k4');
    expect(r3.rescue_complete).toBe(true);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/_root/pets/RescueRitualUi.ts (excerpt)
@ccclass('RescueRitualUi')
export class RescueRitualUi extends Component {
  @property(Label) progressLabel!: Label;
  async refresh() {
    const r = await api.get(`/v1/pets/${this.petId}/grandma-rescue/status`);
    this.progressLabel.string = `Day ${r.ritual_days_completed} of 3`;
  }
  async onTapRitual() {
    const r = await api.post(`/v1/pets/${this.petId}/grandma-rescue/ritual`, { idempotency_key: generateUlid() });
    if (r.rescue_complete) this.playRescueAnimation();
    this.refresh();
  }
}
```

---

## §7 — Dependencies

**External:** pg_cron for neglect-check.
**Internal:** TASK-PET-003 (stat values), TASK-LEGAL-002 (no-real-money policy), TASK-VIRAL-005 (push notification for warnings), TASK-AI-001 (grandma persona line).
**Blocks:** none directly (terminal state); TASK-VIRAL-002 may reference grandma events.

---

## §8 — Example payloads

```http
POST /v1/pets/01HC.../grandma-rescue/ritual
{ "idempotency_key": "01HCRITUAL..." }
→ 200 { "ritual_days_completed": 2, "rescue_complete": false, "next_ritual_after": "2026-08-13T08:00:00Z" }
```

```json
{ "event": "pet.grandma.entered", "pet_id": "01HC...", "owner_id": "01HU...", "prev_stage": "adult", "occurred_at": "2026-08-12T14:36:01Z" }
```

```json
{ "event": "pet.grandma.rescued", "pet_id": "01HC...", "ritual_days": 3, "completed_at": "..." }
```

```json
{ "error": "ritual.cooldown", "retry_after_hours": 4.2 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** All 4 stats vs single? → §1.1 + §2.
- **OQ-2 (resolved):** 7-day window? → §1.1 + §2.
- **OQ-3 (resolved):** Real-money skip? → §1.7 — forbidden.
- **OQ-4 (resolved):** Stat reset values on rescue? → §1.6 — 50 (mid-range, not full).

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Cron neglect-check fails (Supabase outage) | Alert | Grandma transitions delayed | Manual re-run on recovery |
| 2 | Pet missed transition because cron query slow | DB perf | Player support | Composite index on (status, stage, last_seen_at) |
| 3 | Push notifications during sleep hours | TASK-VIRAL-005 catches | Suppressed | Already covered |
| 4 | Cooldown counter Redis lost | Counter resets | Player rescue easier | Acceptable (player-friendly) |
| 5 | 48h reset triggers despite legitimate engagement | UX confusion | Frustration | Surface count clearly |
| 6 | Tenant-mismatch grandma transition | Audit | Privacy issue | Tenant scoping enforced |
| 7 | Real-money rescue accidentally allowed via IAP | TASK-LEGAL-002 lint | Build blocked | Lint catches |
| 8 | Grandma pet visible in main scene | UI bug | UX | Status check in render path |
| 9 | Cooldown 18h timing off (DST) | UX | Cooldown wrong | IANA TZ-aware clock |
| 10 | Rescued pet stage rollback to wrong value | Audit | Stage history wrong | last_active_stage column |
| 11 | Concurrent ritual taps | Per-pet mutex | None | Mutex serialises |
| 12 | Audit retention violates COPPA | DPO review | Compliance | 7-year retention enforced |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (Permadeath-Lite), plan §PART 8 (no revival paywall).

**Sub-decisions punted to ops:** Neglect-detection window tunable via Mixpanel flag.

**Anti-patterns explicitly forbidden:**
- Real-money revival.
- Permanent deletion before grace.
- Punitive UX copy.
- Tier downgrade on rescue.

**Cross-reference:** TASK-PET-005 (grandma excluded from slot count); TASK-PET-006 (tier preserved); TASK-SOCIAL-003 (trade blocked); TASK-PET-007 (breed blocked); TASK-AI-001 (grandma persona).
