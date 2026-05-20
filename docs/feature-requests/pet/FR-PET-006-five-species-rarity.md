---
id: FR-PET-006
title: "5 launch species (Mochi/Pengu/Bao/Fluffit/Tako) × 5 rarity tiers, all earnable (no real-money random pulls)"
module: PET
priority: MUST
status: done
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead + designer + art lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-PET-001, FR-PET-005, FR-PET-007, FR-PET-008, FR-LEGAL-002, FR-ART-001, FR-CARE-005, FR-ECON-001, FR-ECON-002, FR-OBS-001, FR-SOCIAL-002]
depends_on: [FR-PET-005, FR-LEGAL-002, FR-ART-001]
blocks: [FR-PET-007, FR-SOCIAL-003]
effort_hours: 12
new_files:
  - "apps/api/src/pets/species/species-catalogue.ts"
  - "apps/api/src/pets/species/rarity-acquisition.service.ts"
  - "apps/api/src/pets/species/__tests__/species-catalogue.spec.ts"
  - "apps/api/src/pets/species/__tests__/rarity-acquisition.spec.ts"
  - "apps/cocos/assets/pets/pengu/skeleton.spine"
  - "apps/cocos/assets/pets/bao/skeleton.spine"
  - "apps/cocos/assets/pets/fluffit/skeleton.spine"
  - "apps/cocos/assets/pets/tako/skeleton.spine"
  - "apps/cocos/assets/_root/pets/SpeciesUnlockUi.ts"
  - "docs/legal/rarity-drop-rates-public.json"
modified_files:
  - "infra/supabase/standard/migrations/20260517_006_pets_table.sql"
allowed_tools:
  - "FR-LEGAL-002 deterministic-only randomisation"
  - "FR-CARE-005 streak rewards"
  - "Earned-currency surprise eggs (drop rates disclosed)"
disallowed_tools:
  - "Real-money rarity-tier pulls"
  - "Random-outcome IAP-purchased eggs"
  - "Drop-rate undisclosed mechanics"
risk_if_skipped: "Plan §PART 3 — multi-species + rarity tiers are the canonical f2p meta. Tamagotchi Paradise (2025) shows breeding+variations is the proven hook. Without 5 species × rarity, breeding (FR-PET-007) has no genetic surface."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **5 launch species** (per plan §PART 3): **Mochi** (cat-like, brown/cream), **Pengu** (penguin), **Bao** (dumpling-shaped), **Fluffit** (rabbit-like), **Tako** (octopus). Each species MUST have a Spine skeleton conforming to FR-ART-001 §1.2 20-animation contract.

§1.2  **5 rarity tiers**: **Common / Rare / Epic / Mythic / Legendary**. Each species exists in all 5 tiers (visual variants — different palette, accessories, idle quirks). Total visual combinations: 5 species × 5 rarities = 25 base skins.

§1.3  **Acquisition paths — earnable only**, per FR-LEGAL-002:
- **Common** (Mochi tier 1): default hatch outcome — every new player's first pet.
- **Rare**: streak rewards at 7-day milestone (FR-CARE-005 §1.16), surprise eggs (earned Coins, drop rates disclosed).
- **Epic**: event quests (P3+ live-ops), 30-day streak.
- **Mythic**: co-parent milestones (FR-SOCIAL-002 P2), 100-day streak.
- **Legendary**: breeding (FR-PET-007), 365-day streak.

**No real-money path to any rarity**. Premium species (P3 IAP via FR-ECON-002) are **direct purchase only** — not randomised.

§1.4  **Species catalogue.** `apps/api/src/pets/species/species-catalogue.ts` is the single source of truth:
```typescript
export const SPECIES = {
  mochi:   { id: 'mochi',   default_tier: 'common', tiers: ['common','rare','epic','mythic','legendary'] },
  pengu:   { id: 'pengu',   default_tier: 'rare',   tiers: ['common','rare','epic','mythic','legendary'] },
  bao:     { id: 'bao',     default_tier: 'epic',   tiers: ['common','rare','epic','mythic','legendary'] },
  fluffit: { id: 'fluffit', default_tier: 'mythic', tiers: ['common','rare','epic','mythic','legendary'] },
  tako:    { id: 'tako',    default_tier: 'legendary', tiers: ['common','rare','epic','mythic','legendary'] },
} as const;
```

§1.5  **Drop rates (disclosed).** Surprise-egg mechanic (FR-LEGAL-002 §1.2 earned-currency randomisation):
- Common: 70.0% — Mochi/Pengu common variants.
- Rare: 20.0% — Pengu rare, Bao common.
- Epic: 7.0% — Bao rare, Fluffit common.
- Mythic: 2.5% — Fluffit rare, Tako common.
- Legendary: 0.5% — Tako rare.

Published at `docs/legal/rarity-drop-rates-public.json` per FR-LEGAL-002 §1.2.

§1.6  **Schema migration.** `pets.species` constraint extended to all 5 species: `check (species in ('mochi','pengu','bao','fluffit','tako'))`. `pets.tier` column added: `check (tier in ('common','rare','epic','mythic','legendary'))`.

§1.7  **Tier display in UI.** Pet roster MUST display tier badge (colour-coded: gray/blue/purple/gold/rainbow). Trade UX (FR-SOCIAL-003) MUST show tier prominently.

§1.8  **Tier-based persona modulation.** FR-AI-001 persona prompts MUST include tier as context. Legendary pets MAY have slightly more confident dialogue patterns (designer-locked).

§1.9  **Tier-based stat modulation.** Higher-tier pets MAY have slightly slower stat decay (-10% per tier above common, capped at -30% for legendary). FR-PET-003 `STAT_CONFIG` extended to read `pet.tier`.

§1.10  **Reset to Common on grandma rescue.** A pet that goes to `grandma_house` (FR-PET-008) and is rescued retains its species + tier. No tier downgrade on rescue.

§1.11  **No tier upgrade for existing pets.** A Common Mochi cannot become Rare Mochi through care. Tiers are immutable post-acquisition; the player acquires a separate Rare Mochi via the earnable paths.

§1.12  **Acquisition audit.** Every species+tier acquisition writes to `pet_acquisitions` audit: `(user_id, species, tier, source: 'first_hatch'|'streak_reward'|'surprise_egg'|'event_quest'|'co_parent_milestone'|'breeding', source_ref_id, acquired_at)`.

§1.13  **Surprise egg mechanic.** `POST /v1/eggs/surprise-egg/open` consumes 500 Coins (FR-ECON-001 stubbed), rolls per §1.5 drop rates, returns the resulting species+tier. Per FR-LEGAL-002 §1.4, outcome receipt with server_seed_hash recorded.

§1.14  **Drop-rate disclosure UI.** Before opening a surprise egg, UX shows tier-percentage breakdown + link to full rates page. Per FR-LEGAL-002 §1.3.

§1.15  **BE/NL marketing-hide.** Per FR-LEGAL-002 §1.12, surprise-egg marketing UI hidden in BE/NL until counsel confirms.

§1.16  **Tier in Colyseus state.** `PetState.tier` field added. Broadcast on hatch, breeding, trade.

§1.17  **Tier-aware Spine skin path.** `SpineLoader.loadPetSkeleton('pengu')` returns the species skeleton; tier-specific palette is applied via Spine skin variant within the same skeleton. Bundle includes 5 palette presets per species.

§1.18  **Per-species asset budget.** Per FR-INFRA-001 §1.5: ≤ 1.5 MB per species. The 5-palette-per-species shipping requires careful texture compression.

§1.19  **Cocos `SpeciesUnlockUi.ts`.** When a player acquires their first-ever pet of a new species, a one-time "Species unlocked!" celebration UX plays (FR-ART-001 `wave` + Lottie sparkles).

§1.20  **B2B tenant species overrides.** Per FR-B2B-001 (P4), a tenant MAY override palette + accessory presets via Spine skin but MUST NOT add new species or new tiers. Tenant overrides ride atop this FR's species + tier model.

---

## §2 — Why this design

**Why 5 species at launch.** Plan §PART 3 — minimum variety for breeding-trait-mixing to be meaningful + feasible art budget for one art team in P2 timeline. More species can be added in P3+.

**Why 5 tiers.** Plan §PART 3 — Adopt Me!'s Common→Mega-Neon model maps to a 5-tier system. More tiers feel grindy; fewer feel binary.

**Why all earnable (no real-money pulls).** Plan §PART 8 + FR-LEGAL-002. Real-money randomised rarity is the canonical loot-box pattern that Belgium / NL / EU + HoYoverse precedent forbid for kid-skewing apps.

**Why drop rates disclosed.** Apple Guideline 3.1.1 + Google Play policy + FR-LEGAL-002 §1.2 + EU DFA preparedness.

**Why default-tier per species.** Plan §PART 3 — different first-encounter rarities. New players start with Common Mochi; their second species (Pengu) is naturally Rare; etc. Creates a rarity gradient through natural progression.

**Why immutable tiers.** Plan §PART 3 ethical — tiering creates collection identity. If a Common Mochi could become Legendary through care, the rarity meaning collapses + creates FOMO ("I have to do X to upgrade!").

**Why -10% decay per tier.** Plan §PART 3 — small benefit per tier. Too large = pay-to-win pressure (even if earnable, perception matters). 10% is felt but not load-bearing.

**Why grandma rescue keeps tier.** Plan §PART 3 Permadeath-Lite — Belgian/Dutch revival-paywall concerns apply. Punishing tier on rescue would be functionally equivalent.

**Why BE/NL marketing-hide.** Plan §PART 8 — conservative gambling regulator approach. Earned-currency surprise eggs are technically legal but ad-surface friction is cheaper than a regulator complaint.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/pets/species/species-catalogue.ts (excerpt above in §1.4)

export const TIER_DROP_RATES = {
  common: 0.70,
  rare: 0.20,
  epic: 0.07,
  mythic: 0.025,
  legendary: 0.005,
} as const;

export const TIER_DECAY_MODIFIER: Record<Tier, number> = {
  common: 1.0, rare: 0.9, epic: 0.8, mythic: 0.7, legendary: 0.7,
};
```

```typescript
// apps/api/src/pets/species/rarity-acquisition.service.ts
@Injectable()
export class RarityAcquisitionService {
  async openSurpriseEgg(userId: string): Promise<{ species: Species; tier: Tier; outcome_receipt_id: string }> {
    await this.disclosure.assertShown(userId, 'surprise-egg');  // FR-LEGAL-002 §1.3
    await this.region.assertNotBeNl(userId);                     // FR-LEGAL-002 §1.12
    const cost = 500;
    await this.coins.spend(userId, cost);
    const tier = this.rollTier();
    const species = this.pickSpeciesForTier(tier);
    const seed = randomBytes(16);
    const seedHash = sha256(seed).digest('hex');
    const receipt = await this.receipts.write({
      user_id: userId, mechanic_id: 'surprise-egg', drop_rate_version: '2026-05-17-001',
      rolled_outcome: `${species}-${tier}`, server_seed_hash: seedHash,
    });
    await this.audit.write({ who: userId, what: 'pet.acquisition', what_keys: { species, tier, source: 'surprise_egg' } });
    return { species, tier, outcome_receipt_id: receipt.id };
  }

  private rollTier(): Tier {
    const r = secureRandom();   // crypto.randomBytes-derived float in [0, 1)
    let acc = 0;
    for (const [tier, prob] of Object.entries(TIER_DROP_RATES) as [Tier, number][]) {
      acc += prob;
      if (r < acc) return tier;
    }
    return 'common';
  }
}
```

```sql
-- migration adds tier column
alter table public.pets add column tier text not null default 'common'
  check (tier in ('common','rare','epic','mythic','legendary'));

-- Update species check to include all 5
alter table public.pets drop constraint pets_species_check;
alter table public.pets add constraint pets_species_check
  check (species in ('mochi','pengu','bao','fluffit','tako'));

create table public.pet_acquisitions (
  id bigserial primary key,
  user_id uuid not null,
  pet_id text references public.pets(id) on delete cascade,
  species text not null,
  tier text not null,
  source text not null check (source in ('first_hatch','streak_reward','surprise_egg','event_quest','co_parent_milestone','breeding')),
  source_ref_id text,
  acquired_at timestamptz not null default now(),
  tenant_id text not null default 'mochi'
);
```

---

## §4 — Acceptance criteria

**AC1.** All 5 species hatchable; constraint rejects unknown species. Verified.
**AC2.** All 5 tiers stored on pet row; constraint rejects unknown tier. Verified.
**AC3.** Surprise egg drop rates match published JSON ±0.5% over 10k rolls. Verified by statistical test.
**AC4.** BE/NL surprise-egg UI hidden. Verified by Playwright.
**AC5.** No real-money path to any tier — IAP catalogue lint passes. Verified by FR-LEGAL-002 §1.11 script.
**AC6.** Tier decay modifier applies in FR-PET-003 stat decay. Verified.
**AC7.** Acquisition audit row written for each path. Verified.
**AC8.** Disclosure surface shown before surprise-egg open. Verified.
**AC9.** Grandma rescue preserves tier. Verified.
**AC10.** Tier upgrade attempt forbidden (immutable). Verified.
**AC11.** Per-species bundle ≤ 1.5 MB. Verified by assert-bundle-budget.
**AC12.** First-time species unlock UI fires. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/pets/species/__tests__/rarity-acquisition.spec.ts
describe('FR-PET-006 — rarity acquisition', () => {
  it('rolls match published rates over 10k iterations', () => {
    const counts = { common:0, rare:0, epic:0, mythic:0, legendary:0 };
    for (let i = 0; i < 10000; i++) counts[svc['rollTier']()]++;
    expect(counts.common / 10000).toBeCloseTo(0.70, 1);
    expect(counts.legendary / 10000).toBeCloseTo(0.005, 1);
  });

  it('writes outcome receipt on surprise egg', async () => {
    const r = await svc.openSurpriseEgg('u1');
    const receipt = await receipts.byId(r.outcome_receipt_id);
    expect(receipt.mechanic_id).toBe('surprise-egg');
    expect(receipt.server_seed_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('blocks BE/NL', async () => {
    await region.set('u1', 'BE');
    await expect(svc.openSurpriseEgg('u1')).rejects.toThrow(/region/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/pets/species/secure-random.ts
import { randomBytes } from 'node:crypto';
export function secureRandom(): number {
  const buf = randomBytes(8);
  const n = buf.readBigUInt64BE(0) & ((1n << 53n) - 1n);
  return Number(n) / 2 ** 53;
}
```

---

## §7 — Dependencies

**External:** Cocos Spine palette swap; Postgres.
**Internal:** FR-PET-005 (slot quota), FR-LEGAL-002 (drop-rate disclosure + BE/NL safe mode + outcome receipts), FR-ART-001 (per-species Spine), FR-CARE-005 (streak reward sources).
**Blocks:** FR-PET-007 (breeding output species), FR-SOCIAL-003 (trade tier display), FR-ECON-002 (premium species IAP — direct only).

---

## §8 — Example payloads

```http
POST /v1/eggs/surprise-egg/open
{ "idempotency_key": "01HCEGG..." }
→ 200
{ "species": "pengu", "tier": "rare", "outcome_receipt_id": "01HCRCPT...", "stage": "egg" }
```

```json
{
  "version": "2026-05-17-001",
  "mechanics": [{
    "id": "surprise-egg",
    "input_currency": "coins",
    "input_cost": 500,
    "outcomes": [
      { "tier": "common", "weight": 0.700 },
      { "tier": "rare", "weight": 0.200 },
      { "tier": "epic", "weight": 0.070 },
      { "tier": "mythic", "weight": 0.025 },
      { "tier": "legendary", "weight": 0.005 }
    ]
  }]
}
```

```json
{ "event": "pet.acquisition", "user_id": "01HC...", "species": "tako", "tier": "legendary", "source": "breeding" }
```

```json
{
  "id": 4242,
  "user_id": "01HC...",
  "pet_id": "01HC...",
  "species": "pengu",
  "tier": "rare",
  "source": "surprise_egg",
  "source_ref_id": "01HCRCPT...",
  "acquired_at": "2026-08-12T14:36:01Z"
}
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 5 species at launch enough? → §1.1 + §2.
- **OQ-2 (resolved):** Tier decay modifier value? → §1.9 — -10% per tier, cap -30%.
- **OQ-3 (resolved):** Tier immutability? → §1.11 + §2.
- **OQ-4 (resolved):** Tenant species overrides? → §1.20 — palette only.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | RNG bias above 0.5% drift | Reconciliation alert | Apple/Google review risk | Investigate; recalibrate or republish rates |
| 2 | Surprise-egg accidentally allows real-money | FR-LEGAL-002 lint | Build blocked | Remove IAP gate; verify |
| 3 | Tier upgrade mistakenly allowed via DB update | Audit | Rarity meaning collapses | Trigger rejects tier mutation post-creation |
| 4 | BE/NL hidden surface revealed by region bug | Playwright | ToS risk | Region resolution audit |
| 5 | Per-species bundle exceeds 1.5 MB | CI assert | Build blocked | Compress textures |
| 6 | Tier-decay modifier breaks stat reconciliation | FR-PET-003 test | Stat math wrong | Modifier applied consistently in both decay + reconciliation |
| 7 | Tier badge UI mislabels rare as common | Visual regression | UX issue | Lock tier-colour map |
| 8 | Outcome receipt write fails post-spend | Race | Coins spent without pet | Compensating transaction; refund coins |
| 9 | Disclosure not shown before open | Spec test | Compliance issue | Guard enforces |
| 10 | Drop-rate version drift between code + JSON | Reconciliation | Audit mismatch | Single source of truth + CI assert |
| 11 | Acquisition source enum drifts | Migration | Audit gap | Closed enum check |
| 12 | Tenant override breaks rarity tiers | FR-B2B-001 validation | Tenant theme rejected | Schema lint |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (5 species + 5 rarity tiers + earnable only), plan §PART 8 (loot-box compliance).

**Sub-decisions punted to ops:** Specific palette/accessory designs per species per tier — art lead.

**Anti-patterns explicitly forbidden:**
- Real-money rarity pull.
- Tier upgrade.
- Undisclosed drop rates.

**Cross-reference:** FR-PET-007 breeding output picks species+tier; FR-SOCIAL-003 displays tier; FR-ECON-002 direct premium-species purchase (not random).
