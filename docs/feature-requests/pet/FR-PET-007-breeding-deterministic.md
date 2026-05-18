---
id: FR-PET-007
title: "Breeding system — two adult pets → child with deterministic trait inheritance + 24h incubation + revealed appearance"
module: PET
priority: MUST
status: shipped
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead + designer"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-PET-001, FR-PET-002, FR-PET-005, FR-PET-006, FR-LEGAL-002, FR-INFRA-002, FR-INFRA-003, FR-OBS-001, FR-SOCIAL-002, FR-ECON-001, FR-VIRAL-003]
depends_on: [FR-PET-005, FR-PET-006, FR-LEGAL-002]
blocks: [FR-VIRAL-003]
effort_hours: 12
new_files:
  - "apps/api/src/pets/breeding/breeding.controller.ts"
  - "apps/api/src/pets/breeding/breeding.service.ts"
  - "apps/api/src/pets/breeding/trait-inheritance.ts"
  - "apps/api/src/pets/breeding/incubator.service.ts"
  - "apps/api/src/pets/breeding/__tests__/breeding.spec.ts"
  - "apps/api/src/pets/breeding/__tests__/trait-inheritance.spec.ts"
  - "apps/cocos/assets/_root/pets/BreedingScene.ts"
  - "apps/cocos/assets/_root/pets/EggIncubator.ts"
  - "infra/supabase/standard/migrations/20260517_016_breeding.sql"
modified_files: []
allowed_tools:
  - "Deterministic trait function (palette XOR + stat-bias bitwise blend)"
  - "Postgres pending_breeding_offspring table"
  - "FR-LEGAL-002 receipts (mechanic_id: 'breeding')"
disallowed_tools:
  - "Real-money breeding fees (free + Coin cost only)"
  - "Random breeding outcomes (deterministic only per FR-LEGAL-002 §1.6)"
  - "Breeding non-adult pets"
  - "Self-breeding (a pet with itself)"
risk_if_skipped: "Plan §PART 3 breeding mechanic is the canonical Tamagotchi Paradise (2025) hook. Without it, FR-VIRAL-003 generative pet has no parallel; multi-pet meta-game stalls."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Eligibility.** Breeding requires:
- Both parent pets at `stage='adult'` per FR-PET-002 §1.6.
- Both pets owned by SAME player (cross-player breeding deferred to a future FR).
- Both pets `status='active'` (not grandma_house, not tombstoned).
- Cooldown 7 days between breedings for the same parent.
- Owner has at least 1 free pet slot (FR-PET-005).

§1.2  **Cost.** Breeding costs 500 Coins (earned, no IAP path — FR-LEGAL-002). Stub at P2 via FR-ECON-001.

§1.3  **Endpoint.** `POST /v1/pets/breed` — body `{ parent_a_id: string, parent_b_id: string, idempotency_key: string }`. JWT required.

§1.4  **Deterministic trait inheritance.** Per FR-LEGAL-002 §1.6, breeding MUST be a pure function of parent inputs:
```
inheritTraits(parentA, parentB, seed = SHA256(parentA.id + parentB.id + breeding_event_id)) → offspring
```
- **Species**: 50/50 from parent A or B species (selected by `seed.bit[0]`).
- **Tier**: tier of LOWER-tier parent + occasionally upgrade. Specifically: 80% same as lower parent, 15% lower+1, 5% lower+2 (capped at legendary). Per FR-LEGAL-002 §1.6 the 80/15/5 is deterministic-by-seed (not random).
- **Palette seed**: XOR of parents' palette seeds.
- **Stat bias** (small initial stat boosts): bitwise blend.

§1.5  **24h incubation.** After breeding, the offspring egg is in `pending_breeding_offspring` table for 24 real-time hours. Player sees the egg in a special "Incubator" UI section. Can be tapped to inspect a vague silhouette (no full reveal until hatch).

§1.6  **Reveal at hatch.** After 24h, the egg auto-hatches into a new pet row in `pets` table. The player gets a notification + an opportunity to name it (per FR-PET-001 §1.5 content-safety filter applies).

§1.7  **24h grace if slot full at hatch.** Per FR-PET-005 §1.17, if player has 0 slots when egg hatches, egg stays in incubator another 24h. After total 48h with full slots, the player MUST choose: (a) archive an existing pet to grandma_house; (b) abandon the new offspring (one-time confirmation).

§1.8  **Cooldown enforcement.** Per-parent 7-day cooldown via Redis TTL. Attempting breeding within cooldown → 429 `cooldown` with `retry_after_sec`.

§1.9  **Cross-tenant scoping.** Both parents MUST be same `tenant_id`. Cross-tenant breeding forbidden.

§1.10  **Audit + receipt.** Per FR-LEGAL-002 §1.4, breeding writes a `randomisation_receipts` row even though outcome is deterministic (audit trail). `mechanic_id = 'breeding'`, `drop_rate_version` reflects the 80/15/5 tier-up formula.

§1.11  **Offspring acquisition source.** `pet_acquisitions.source = 'breeding'` per FR-PET-006 §1.12. `source_ref_id` = breeding_event_id.

§1.12  **Idempotency.** `idempotency_key` MUST be a ULID-prefix; identical retry returns cached response.

§1.13  **No self-breeding.** Validation: `parent_a_id != parent_b_id`.

§1.14  **Pet+ benefit.** Pet+ subscribers (FR-SUB-001 stub) get -50% cooldown (3.5 days vs 7).

§1.15  **Surprise reveal animation.** At hatch reveal, Cocos plays a Spine "hatch" sequence (FR-ART-001 contract animation) with palette set to the inherited seed. Player sees offspring for first time.

§1.16  **Co-parent breeding (P3+).** Cross-player breeding (FR-SOCIAL-002 co-parented pets) is **deferred** to a future FR. At P2, breeding remains same-player only.

§1.17  **Stat reset on hatch.** New offspring starts at stage='egg' with default stats (100/100/100/100). Tier-based decay modifier applies per FR-PET-006 §1.9.

§1.18  **Trait test seam.** `trait-inheritance.ts` MUST be a pure function testable with property-based tests (fast-check). Same parents + same seed = same offspring.

§1.19  **Persona seed inheritance.** Per FR-AI-001, persona YAML for offspring uses species default + parent palette XOR — no chat-personality inheritance complexity at P2.

§1.20  **Analytics.** `pet.breeding.initiated`, `pet.breeding.completed { offspring_species, offspring_tier, parent_cooldown_remaining }`, `pet.breeding.aborted { reason }` per FR-OBS-001.

---

## §2 — Why this design

**Why adult-only.** Plan §PART 3 — biological intuition + makes evolution → adult feel rewarding.

**Why same-player at P2.** Cross-player breeding adds trade-window-like complexity + abuse vectors (free pet farming). Defer to P3+ once economy matures.

**Why 7-day cooldown.** Prevents farm-spam. Pet+ -50% is a meaningful subscription perk.

**Why 24h incubation.** Plan §PART 3 — anticipation builds engagement (Tamagotchi Paradise pattern). Player checks back. Short enough to not feel punishing.

**Why deterministic by SHA256 seed.** FR-LEGAL-002 §1.6 mandates deterministic breeding for audit-replay + EU compliance. The seed = `SHA256(parentA + parentB + event_id)` ensures every breeding is reproducible from inputs.

**Why 80/15/5 tier-up split.** Plan §PART 3 — players want a hint of rarity surprise without RNG-grind. 80% same-tier feels predictable; 15% +1 is exciting; 5% +2 is rare-but-possible. All deterministic-by-seed.

**Why species 50/50 random.** Simpler than weighted; encourages variety.

**Why no self-breeding.** Biological intuition + abuse prevention.

**Why receipt despite deterministic.** FR-LEGAL-002 §1.4 audit-trail requirement; consistent with other randomised-feeling mechanics.

**Why 48h grace at hatch slot-full.** Plan §PART 3 ethical retention — losing offspring instantly is punishing.

**Why no chat-personality inheritance.** Plan §PART 4 LLM cost cap — variable persona inheritance bloats prompt context.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/pets/breeding/trait-inheritance.ts
import { createHash } from 'node:crypto';

export function inheritTraits(input: {
  parentA: { id: string; species: Species; tier: Tier; palette_seed: string };
  parentB: { id: string; species: Species; tier: Tier; palette_seed: string };
  breedingEventId: string;
}): { species: Species; tier: Tier; palette_seed: string; stat_bias: { hunger: number; cleanliness: number; happiness: number; energy: number } } {
  const seed = createHash('sha256').update(input.parentA.id + input.parentB.id + input.breedingEventId).digest();

  // Species: bit 0 picks parentA or parentB
  const species = (seed[0] & 1) === 0 ? input.parentA.species : input.parentB.species;

  // Tier: lower of two; then 80/15/5 upgrade based on seed[1]
  const tierOrder = ['common','rare','epic','mythic','legendary'] as const;
  const lower = Math.min(tierOrder.indexOf(input.parentA.tier), tierOrder.indexOf(input.parentB.tier));
  const upgradeRoll = seed[1] / 255;
  let upgrade = 0;
  if (upgradeRoll >= 0.95) upgrade = 2;
  else if (upgradeRoll >= 0.80) upgrade = 1;
  const tier = tierOrder[Math.min(lower + upgrade, 4)];

  // Palette seed: XOR
  const paletteA = Buffer.from(input.parentA.palette_seed, 'hex');
  const paletteB = Buffer.from(input.parentB.palette_seed, 'hex');
  const palette = Buffer.alloc(paletteA.length);
  for (let i = 0; i < paletteA.length; i++) palette[i] = paletteA[i] ^ paletteB[i];

  // Stat bias: -3 to +3 per stat from seed bytes
  const statBias = {
    hunger: (seed[2] % 7) - 3,
    cleanliness: (seed[3] % 7) - 3,
    happiness: (seed[4] % 7) - 3,
    energy: (seed[5] % 7) - 3,
  };

  return { species, tier, palette_seed: palette.toString('hex'), stat_bias: statBias };
}
```

```typescript
// apps/api/src/pets/breeding/breeding.service.ts (excerpt)
async breed(u: AuthedUser, parentAId: string, parentBId: string, idempKey: string) {
  if (parentAId === parentBId) throw new HttpException('pet.breeding.self_forbidden', 422);
  const prior = await this.idemp.lookup(u.id, `breed:${idempKey}`);
  if (prior) return prior;
  const [parentA, parentB] = await Promise.all([this.pets.byId(parentAId), this.pets.byId(parentBId)]);
  this.assertEligible(u, parentA);
  this.assertEligible(u, parentB);
  if (parentA.tenant_id !== parentB.tenant_id) throw new HttpException('pet.breeding.cross_tenant', 403);
  await this.assertCooldown(parentA.id, parentB.id, u);
  const slot = await this.inventory.canHatchNew(u.id);
  if (!slot.allowed) throw new HttpException({ error: 'pet_slot_full' }, 402);
  await this.coins.spend(u.id, this.pet_plus(u) ? 250 : 500);
  const breedingEventId = generateUlid();
  const offspring = inheritTraits({ parentA, parentB, breedingEventId });
  const eggHatchAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  await this.supa.from('pending_breeding_offspring').insert({
    id: breedingEventId, parent_a_id: parentAId, parent_b_id: parentBId,
    owner_id: u.id, offspring_species: offspring.species, offspring_tier: offspring.tier,
    offspring_palette_seed: offspring.palette_seed, hatch_at: eggHatchAt,
  });
  await this.startCooldown(parentA.id, parentB.id, u);
  await this.audit.write({ who: u.id, what: 'pet.breeding.initiated', what_keys: { event_id: breedingEventId } });
  return { breeding_event_id: breedingEventId, hatch_at: eggHatchAt, offspring_silhouette: offspring.species };
}
```

```sql
-- migration
create table public.pending_breeding_offspring (
  id text primary key check (id ~ '^[0-9A-HJKMNPQRSTVWXYZ]{26}$'),
  parent_a_id text not null references public.pets(id) on delete cascade,
  parent_b_id text not null references public.pets(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  offspring_species text not null,
  offspring_tier text not null,
  offspring_palette_seed text not null,
  hatch_at timestamptz not null,
  hatched_pet_id text,
  status text not null default 'incubating' check (status in ('incubating','hatched','expired','abandoned')),
  tenant_id text not null default 'mochi',
  created_at timestamptz not null default now()
);
create index on public.pending_breeding_offspring (owner_id, status);
create index on public.pending_breeding_offspring (hatch_at) where status = 'incubating';
alter table public.pending_breeding_offspring enable row level security;
create policy "breeding self" on public.pending_breeding_offspring for select using (owner_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** Breeding two adult Mochi pets produces deterministic offspring (same inputs = same output). Verified by property-test.
**AC2.** Self-breeding rejected. Verified.
**AC3.** Non-adult breeding rejected. Verified.
**AC4.** 7-day cooldown enforced. Verified by fake-clock test.
**AC5.** Pet+ -50% cooldown. Verified.
**AC6.** Cross-tenant blocked. Verified.
**AC7.** 24h incubation honoured; auto-hatch fires via scheduled task. Verified.
**AC8.** Slot-full grace 48h applied. Verified.
**AC9.** Idempotent breeding. Verified.
**AC10.** Receipt written per FR-LEGAL-002. Verified.
**AC11.** Tier inheritance 80/15/5 distribution over 10k iterations. Verified by statistical test.
**AC12.** Palette XOR computed correctly. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/pets/breeding/__tests__/trait-inheritance.spec.ts
import fc from 'fast-check';

describe('FR-PET-007 — trait inheritance', () => {
  it('is deterministic: same inputs → same output', () => {
    fc.assert(fc.property(fc.tuple(fc.constantFrom('mochi','pengu','bao','fluffit','tako'), fc.constantFrom('mochi','pengu','bao','fluffit','tako')), ([sA, sB]) => {
      const inputA = { id: 'A', species: sA as any, tier: 'rare' as const, palette_seed: '0123456789abcdef' };
      const inputB = { id: 'B', species: sB as any, tier: 'epic' as const, palette_seed: 'fedcba9876543210' };
      const event = 'EVT123';
      const r1 = inheritTraits({ parentA: inputA, parentB: inputB, breedingEventId: event });
      const r2 = inheritTraits({ parentA: inputA, parentB: inputB, breedingEventId: event });
      expect(r1).toEqual(r2);
    }));
  });

  it('tier inheritance follows 80/15/5 distribution', () => {
    const counts = { same: 0, up1: 0, up2: 0 };
    for (let i = 0; i < 10000; i++) {
      const r = inheritTraits({
        parentA: { id: `A${i}`, species: 'mochi', tier: 'common', palette_seed: '0'.repeat(16) },
        parentB: { id: `B${i}`, species: 'mochi', tier: 'common', palette_seed: '0'.repeat(16) },
        breedingEventId: `EVT${i}`,
      });
      if (r.tier === 'common') counts.same++;
      if (r.tier === 'rare') counts.up1++;
      if (r.tier === 'epic') counts.up2++;
    }
    expect(counts.same / 10000).toBeCloseTo(0.80, 1);
    expect(counts.up1 / 10000).toBeCloseTo(0.15, 1);
    expect(counts.up2 / 10000).toBeCloseTo(0.05, 1);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/pets/breeding/incubator.service.ts
@Injectable()
export class IncubatorService {
  async hatchPendingEggs() {
    const now = new Date().toISOString();
    const { data: pending } = await this.supa.from('pending_breeding_offspring').select('*').lte('hatch_at', now).eq('status', 'incubating');
    for (const egg of pending ?? []) {
      const slot = await this.inventory.canHatchNew(egg.owner_id);
      if (!slot.allowed) { await this.extendGrace(egg.id); continue; }
      const petId = generateUlid();
      await this.supa.from('pets').insert({
        id: petId, owner_id: egg.owner_id, tenant_id: egg.tenant_id,
        species: egg.offspring_species, tier: egg.offspring_tier,
        display_name: 'Egg', stage: 'egg', palette_seed: egg.offspring_palette_seed,
      });
      await this.supa.from('pet_acquisitions').insert({
        user_id: egg.owner_id, pet_id: petId, species: egg.offspring_species, tier: egg.offspring_tier,
        source: 'breeding', source_ref_id: egg.id,
      });
      await this.supa.from('pending_breeding_offspring').update({ status: 'hatched', hatched_pet_id: petId }).eq('id', egg.id);
      await this.notify.sendBreedingHatchedNotice(egg.owner_id, petId);
    }
  }
}
```

---

## §7 — Dependencies

**External:** Scheduled function (pg_cron) for incubator tick.
**Internal:** FR-PET-005 (slot check), FR-PET-006 (species + tier model), FR-LEGAL-002 (receipts), FR-ECON-001 (Coin spend), FR-AUTH-001 (JWT).
**Blocks:** FR-VIRAL-003 (generative pet at adoption — parallel path).

---

## §8 — Example payloads

```http
POST /v1/pets/breed
{ "parent_a_id": "01HC...", "parent_b_id": "01HD...", "idempotency_key": "01HCBREED..." }
→ 200
{ "breeding_event_id": "01HCEVT...", "hatch_at": "2026-08-13T14:36:01Z", "offspring_silhouette": "pengu" }
```

```json
{
  "id": "01HCEVT...",
  "parent_a_id": "01HC...", "parent_b_id": "01HD...",
  "owner_id": "01HU...",
  "offspring_species": "pengu", "offspring_tier": "rare",
  "offspring_palette_seed": "f0d3b5a78c4e1928",
  "hatch_at": "2026-08-13T14:36:01Z",
  "status": "incubating"
}
```

```json
{ "event": "pet.breeding.completed", "owner_id": "01HU...", "offspring_pet_id": "01HC...", "offspring_species": "pengu", "offspring_tier": "rare" }
```

```json
{ "error": "cooldown", "retry_after_sec": 432000 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Cross-player breeding at P2? → §1.16 — deferred.
- **OQ-2 (resolved):** Tier upgrade distribution? → §1.4 + §2 — 80/15/5.
- **OQ-3 (resolved):** Self-breeding? → §1.13 — forbidden.
- **OQ-4 (resolved):** Cost? → §1.2 — 500 Coins (250 Pet+).

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Trait inheritance non-deterministic (e.g. Node version bug in SHA256) | Property test | Audit broken | Pin Node version; CI test |
| 2 | Incubator scheduled function fails | Cron alert | Eggs stuck | Manual re-run; alert DPO |
| 3 | Slot-full grace expires while player tries to choose | UX hang | Frustration | Surface clear choice UI; 1h soft warning before expiry |
| 4 | Cooldown counter Redis lost | Counter resets | Back-to-back breeding | Conservative fallback: assume cooldown active |
| 5 | Both parents same pet via API replay | Validation catches | None | §1.13 enforced |
| 6 | Palette XOR collision (rare visual sameness) | Player report | Visual dup | Acceptable — deterministic by design |
| 7 | Statistical test fails | Code change | Distribution drift | Investigate; pin SHA256 |
| 8 | Receipt write fails after coin spend | Audit | Compensating refund | Saga pattern |
| 9 | Tenant-mismatch undetected | RLS test | Audit issue | Tenant scoping enforced |
| 10 | Cross-tenant breeding via B2B race | B2B audit | Privacy issue | Pre-check tenant_id |
| 11 | 24h incubation race with stage advancement | Edge case | Bizarre state | Lock pet stage during incubation |
| 12 | Breeding event id collision | Cosmic ray | Audit corrupt | ULID retry |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (breeding mechanic — Tamagotchi Paradise + Adopt Me precedent), plan §PART 8 (deterministic per FR-LEGAL-002 §1.6).

**Sub-decisions punted to ops:** Cooldown duration (7d default) Mixpanel-tunable.

**Anti-patterns explicitly forbidden:**
- Real-money breeding fee.
- Randomised (non-deterministic) outcomes.
- Self-breeding.
- Cross-tenant breeding.

**Cross-reference:** FR-VIRAL-003 generative pet is parallel — both produce new pets via deterministic functions of inputs.
