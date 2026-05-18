---
id: FR-PET-005
title: "Multi-pet inventory — 3 slots free, 10 slots Pet+ with entitlement check stubs"
module: PET
priority: MUST
status: shipped
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-PET-001, FR-PET-003, FR-PET-006, FR-PET-007, FR-PET-008, FR-SUB-001, FR-SOCIAL-002, FR-SOCIAL-003, FR-ECON-001, FR-OBS-001, FR-INFRA-002, FR-INFRA-003]
depends_on: [FR-PET-001, FR-PET-003]
blocks: [FR-PET-006, FR-PET-007, FR-SOCIAL-003]
effort_hours: 8
new_files:
  - "apps/api/src/pets/inventory/inventory.controller.ts"
  - "apps/api/src/pets/inventory/inventory.service.ts"
  - "apps/api/src/pets/inventory/slot-entitlement.service.ts"
  - "apps/api/src/pets/inventory/__tests__/inventory.spec.ts"
  - "apps/api/src/pets/inventory/__tests__/slot-entitlement.spec.ts"
  - "apps/cocos/assets/_root/pets/PetRosterUi.ts"
  - "apps/cocos/assets/_root/pets/__tests__/PetRosterUi.spec.ts"
modified_files:
  - "apps/api/src/pets/pets.service.ts"
  - "apps/realtime/src/state/PlayerPetsRoster.ts"
allowed_tools:
  - "Postgres for slot quota state"
  - "Colyseus PlayerPetsRoster schema"
  - "Mixpanel feature flag for slot counts (tunability)"
disallowed_tools:
  - "Real-money slot expansion (slots come bundled with Pet+ subscription per FR-LEGAL-002 — no individual-slot IAP)"
  - "Slot count gating breeding (FR-PET-007 has its own adult-stage gate)"
  - "Allowing the player to delete a tombstoned pet from their inventory (deletion is hard via DSR per FR-LEGAL-001)"
risk_if_skipped: "Plan §PART 3 multi-pet system is the foundational P2 capability. Without slot inventory, FR-PET-006 (5 species), FR-PET-007 (breeding), FR-SOCIAL-003 (trade) all break — they assume the player has multiple pet records they can manage."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Slot counts.** A free-tier player MUST be limited to **3** active pets. A Pet+ subscriber MUST be limited to **10** active pets. (FR-SUB-001 implements the subscription; this FR's `SlotEntitlementService` stubs the entitlement check until then — returning "free tier always" at P1/P2.)

§1.2  **Active vs total.** "Active" = `pets.status = 'active'`. Pets in `grandma_house` (Permadeath-Lite per FR-PET-008) DO NOT count against the slot limit; the player can have unlimited grandma-house pets but only the slot count's worth of active ones.

§1.3  **`tombstoned` pets MUST NOT count** against the slot quota either. Tombstoned pets are post-DSR-erasure markers; they are effectively soft-deleted.

§1.4  **Endpoint — list roster.** `GET /v1/pets/roster` MUST return `{ slot_limit, active_count, grandma_count, pets: PetSummary[] }`. Players see their full roster grouped by status.

§1.5  **Endpoint — slot quota check.** `GET /v1/pets/slot-quota` MUST return `{ slot_limit, current_active, remaining, tier: 'free' | 'pet_plus' }` so the client can render UX hints ("You have 2 slots left").

§1.6  **Hatch enforcement.** `POST /v1/pets/hatch` (FR-PET-001 §1.4) MUST check slot quota via this FR's `InventoryService.canHatchNew(userId)`. On exceeded: HTTP 402 `{ error: 'pet_slot_full', current_count, slot_limit, suggest_upgrade: true }`.

§1.7  **Pet+ downgrade handling.** If a Pet+ subscriber lapses to free tier WHILE having more than 3 active pets, the over-quota pets MUST NOT be automatically deleted. Instead: (a) the player can keep all current pets; (b) cannot hatch new ones until count drops below 3; (c) on next hatch attempt, surface a "Choose your free-tier 3 pets" UX where the player explicitly archives extras to `grandma_house` (which then cannot be rescued until they re-subscribe).

§1.8  **Audit row on slot change.** Slot-quota changes (subscribe / unsubscribe / hatch / archive) MUST emit `pet.slot.change` events: `{user_id, prev_active_count, new_active_count, tier_change?, source}`.

§1.9  **Colyseus broadcast.** When a player's roster changes (hatch, archive, rescue), broadcast `roster.changed` to all of their connected sessions (multi-device sync).

§1.10  **Real-time slot-counter widget.** Cocos `PetRosterUi.ts` displays the slot counter "X / Y pets" with a colour-coded indicator (green if remaining ≥ 1, yellow if 0/full).

§1.11  **No silent slot expansion.** A bug that mistakenly issues more slots than the tier allows MUST be caught by a Postgres CHECK constraint: `count(pets where status='active' group by owner_id) <= 10` enforced via a TRIGGER (not a column constraint — Postgres doesn't support cross-row CHECKs).

§1.12  **Migration of legacy single-pet players.** Existing P1 players who have exactly 1 pet at the time FR-PET-005 ships MUST be migrated to the new model:
- `pets.status = 'active'` confirmed for their single pet;
- Slot quota established at 3 (free tier by default).

A migration script `scripts/migrations/p1-to-p2-roster.mjs` MUST run idempotently.

§1.13  **Rate limit for hatch.** Per FR-PET-001 §1.13, 3 hatches per 24h per player. This rule remains regardless of slot quota — even Pet+ players with empty slots can only hatch 3/day.

§1.14  **Inventory query performance.** `GET /v1/pets/roster` MUST return in P95 ≤ 200ms. Composite index `(owner_id, status)` on `pets` table ensures this.

§1.15  **Cross-tenant scoping.** Inventory queries MUST respect `tenant_id` per FR-INFRA-003 §1.4 — a Mochi (consumer) player's roster MUST NOT include B2B tenant pets, and vice versa. RLS policy `pets self read` (FR-PET-001 §3.4) handles this when `app.tenant_id` is set.

§1.16  **Trade impact.** FR-SOCIAL-003 (trade) MUST validate the receiving player has slot capacity BEFORE accepting a trade. The trade handler will call `canHatchNew(receiverId)` equivalent.

§1.17  **Breeding impact.** FR-PET-007 (breeding) produces offspring pets. The parent's player MUST have slot capacity for the offspring; on hatching (post-24h incubation per FR-PET-007), if slots are full, the egg is held in a "pending hatch" queue (24h grace period) before being lost.

§1.18  **Pet+ marketing surface — non-FOMO.** When a free-tier player tries to hatch beyond 3, the UX MUST: surface "Upgrade to Pet+ for 10 slots + premium AI + cloud save" in a non-shaming way (no urgency, no countdown). Plan §PART 6 + FR-CARE-005 ethical retention principles.

§1.19  **Analytics.** `pet.slot.hatch_blocked`, `pet.slot.archive_to_grandma`, `pet.slot.upgrade_prompt_shown` per FR-OBS-001.

§1.20  **DPO transparency.** `GET /v1/me/data` (a future DSR feature) MUST include slot history. Implementation slot here for FR-LEGAL-001 §1.9 integration.

---

## §2 — Why this design

**Why 3 / 10 split.** Plan §PART 6 — free tier offers enough to engage; Pet+ offers enough to feel substantively expanded. Industry comparison: Adopt Me! offers ~6 active pets free; Pou is single-pet only; Talking Tom is single-pet. 3 free / 10 Pet+ is differentiated.

**Why grandma_house doesn't count.** Plan §PART 3 — Permadeath-Lite is a "your pet is parked, you can rescue them" path, not deletion. Punishing slot quota on grandma'd pets would discourage rescue and create FOMO.

**Why downgrade keeps existing pets but blocks new.** Apple/Google subscription guidelines strongly discourage "loss of access on downgrade" patterns. The compromise (keep what you have but can't grow) is standard f2p practice.

**Why no individual-slot IAP.** Plan §PART 6 + FR-LEGAL-002 — randomised or atomic IAP undermines the subscription value proposition + creates regulator-questioned "pay to expand" surfaces. Slots come bundled with Pet+ only.

**Why server-side enforcement via TRIGGER.** Plan §PART 4 — defense in depth. Application-layer checks can have bugs; a DB trigger is the final line.

**Why offspring egg has 24h grace period when slot full.** Plan §PART 3 ethical retention — losing your breed offspring instantly to "no slot" is punishing.

**Why no real-time slot counter on multi-device.** Plan §PART 3 PetPair co-parent — multi-device IS the canonical case. Broadcast roster changes via Colyseus is correct architecture.

**Why no FOMO upgrade prompt.** Plan §PART 3 ethical retention + plan §PART 8 ICO AADC compliance for kids. Same principles apply to all users (consistent UX); shame doesn't differentiate by audience.

**Why hatch rate-limit independent of slots.** Plan §PART 3 — 3 hatches/day is anti-spam, separate from quota. A Pet+ player with 10 empty slots still rate-limited to 3/day so they engage with each new pet meaningfully.

---

## §3 — API contract & code shape

### 3.1 — Inventory controller

```typescript
// apps/api/src/pets/inventory/inventory.controller.ts
@Controller('v1/pets')
@UseGuards(SupabaseJwtGuard)
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  @Get('roster')
  async roster(@CurrentUser() u: AuthedUser) {
    return this.svc.roster(u.id);
  }

  @Get('slot-quota')
  async slotQuota(@CurrentUser() u: AuthedUser) {
    return this.svc.slotQuota(u.id);
  }
}
```

### 3.2 — Inventory service

```typescript
// apps/api/src/pets/inventory/inventory.service.ts
@Injectable()
export class InventoryService {
  constructor(
    private readonly supa: SupabaseClient,
    private readonly entitlement: SlotEntitlementService,
    private readonly audit: AuditLogService,
  ) {}

  async slotQuota(userId: string) {
    const tier = await this.entitlement.tier(userId);
    const slotLimit = tier === 'pet_plus' ? 10 : 3;
    const { count } = await this.supa.from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId).eq('status', 'active');
    return { slot_limit: slotLimit, current_active: count ?? 0, remaining: slotLimit - (count ?? 0), tier };
  }

  async canHatchNew(userId: string): Promise<{ allowed: boolean; reason?: string; slot_info: SlotInfo }> {
    const q = await this.slotQuota(userId);
    if (q.remaining <= 0) {
      this.audit.emit('pet.slot.hatch_blocked', { userId, ...q });
      return { allowed: false, reason: 'pet_slot_full', slot_info: q };
    }
    return { allowed: true, slot_info: q };
  }

  async roster(userId: string) {
    const [active, grandma] = await Promise.all([
      this.supa.from('pets').select('id, species, display_name, stage').eq('owner_id', userId).eq('status', 'active'),
      this.supa.from('pets').select('id, species, display_name, stage').eq('owner_id', userId).eq('status', 'grandma'),
    ]);
    const tier = await this.entitlement.tier(userId);
    return {
      slot_limit: tier === 'pet_plus' ? 10 : 3,
      active_count: active.data?.length ?? 0,
      grandma_count: grandma.data?.length ?? 0,
      tier,
      pets: { active: active.data, grandma: grandma.data },
    };
  }
}
```

### 3.3 — Slot entitlement (stub at P2)

```typescript
// apps/api/src/pets/inventory/slot-entitlement.service.ts
@Injectable()
export class SlotEntitlementService {
  // P2 stub: always returns 'free'. FR-SUB-001 (P3) wires real subscription state.
  async tier(_userId: string): Promise<'free' | 'pet_plus'> {
    if (process.env.SLOT_ENTITLEMENT_STUB === 'pet_plus') return 'pet_plus';
    return 'free';
  }
}
```

### 3.4 — DB trigger

```sql
-- migration excerpt
create or replace function enforce_slot_quota() returns trigger as $$
declare
  active_count int;
  slot_limit int := 10; -- conservative cap; app enforces actual tier
begin
  select count(*) into active_count from public.pets where owner_id = new.owner_id and status = 'active';
  if active_count > slot_limit then
    raise exception 'FR-PET-005 §1.11 slot quota exceeded for owner %', new.owner_id;
  end if;
  return new;
end;
$$ language plpgsql;
create trigger trg_slot_quota after insert or update of status on public.pets
  for each row execute procedure enforce_slot_quota();
```

---

## §4 — Acceptance criteria

**AC1.** Free-tier player with 0 active pets has `slot_limit=3, remaining=3`. Verified.
**AC2.** Free-tier player with 3 active pets hits 402 on 4th hatch. Verified.
**AC3.** Pet+ stub player can have 10 active pets. Verified.
**AC4.** Grandma pet does NOT count against slot. Verified.
**AC5.** Downgrade from Pet+ with 7 pets does NOT auto-delete; player blocked from hatching until count drops. Verified.
**AC6.** Trigger rejects bypassing 10 cap at DB layer. Verified by direct SQL test.
**AC7.** `GET /v1/pets/roster` returns grouped by status. Verified.
**AC8.** Roster query P95 ≤ 200ms with seeded 10-pet roster. Verified.
**AC9.** Multi-device `roster.changed` broadcast fires on hatch. Verified.
**AC10.** Non-FOMO upgrade prompt copy verified by content lint.
**AC11.** Migration script idempotent + handles 0/1/2/3 pet starting states. Verified.
**AC12.** Cross-tenant pet not visible in roster. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/pets/inventory/__tests__/inventory.spec.ts
describe('FR-PET-005 — inventory', () => {
  it('blocks 4th hatch on free tier', async () => {
    await seedPets('u1', 3);
    const r = await svc.canHatchNew('u1');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('pet_slot_full');
  });

  it('grandma does not count', async () => {
    await seedPets('u1', 3);
    await archiveToGrandma('u1', 'p1');
    const r = await svc.canHatchNew('u1');
    expect(r.allowed).toBe(true);
  });

  it('downgrade keeps over-quota pets', async () => {
    await mockTier('u1', 'pet_plus');
    await seedPets('u1', 7);
    await mockTier('u1', 'free');
    const roster = await svc.roster('u1');
    expect(roster.active_count).toBe(7);
    const r = await svc.canHatchNew('u1');
    expect(r.allowed).toBe(false);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/_root/pets/PetRosterUi.ts
@ccclass('PetRosterUi')
export class PetRosterUi extends Component {
  @property(Label) slotCounterLabel!: Label;

  async refresh() {
    const q = await api.get('/v1/pets/slot-quota');
    this.slotCounterLabel.string = `${q.current_active} / ${q.slot_limit}`;
    this.slotCounterLabel.color = q.remaining > 0 ? GREEN : YELLOW;
  }
}
```

---

## §7 — Dependencies

**External:** none new.
**Internal:** FR-PET-001 (pets table), FR-PET-003 (status field), FR-SUB-001 (entitlement — stubbed here), FR-INFRA-002 (broadcast), FR-INFRA-003 (Postgres + RLS + tenant).
**Blocks:** FR-PET-006 (5 species hatching), FR-PET-007 (breeding offspring slot check), FR-SOCIAL-003 (trade slot check).

---

## §8 — Example payloads

```http
GET /v1/pets/slot-quota
→ 200 { "slot_limit": 3, "current_active": 2, "remaining": 1, "tier": "free" }
```

```http
GET /v1/pets/roster
→ 200 {
  "slot_limit": 3, "active_count": 2, "grandma_count": 1, "tier": "free",
  "pets": {
    "active": [{ "id": "01HC...", "species": "mochi", "display_name": "Mochi", "stage": "adult" }, ...],
    "grandma": [{ "id": "01HC...", "species": "pengu", "display_name": "Pingu", "stage": "grandma_house" }]
  }
}
```

```http
POST /v1/pets/hatch (4th on free tier)
→ 402 { "error": "pet_slot_full", "current_count": 3, "slot_limit": 3, "suggest_upgrade": true }
```

```json
{ "event": "pet.slot.hatch_blocked", "user_id": "01HC...", "current_active": 3, "slot_limit": 3, "tier": "free" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 3/10 vs other split? → §1.1 + §2.
- **OQ-2 (resolved):** Grandma count? → §1.2 — no.
- **OQ-3 (resolved):** Downgrade behaviour? → §1.7 — keep + block.
- **OQ-4 (resolved):** Individual-slot IAP? → §`disallowed_tools` — never.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | DB trigger fires on legitimate Pet+ user (race with entitlement) | Player support | Hatch blocked | Trigger uses 10 cap (conservative); app-layer reconciles |
| 2 | Migration script fails idempotency on retry | CI test | Migration broken | Script reads existing state; retries safe |
| 3 | Stub entitlement returns wrong tier | Player report | Slots wrong | FR-SUB-001 lands; until then env var override |
| 4 | Tombstoned pets accidentally counted | Audit | Slot quota wrong | Status check explicit in queries |
| 5 | Cross-tenant pet visible in roster | RLS test | Privacy issue | Tighten RLS; audit recent reads |
| 6 | Roster query >200ms P95 | Sentry metric | UX latency | Composite index check; query plan review |
| 7 | Downgrade race with hatch attempt | Concurrent ops | Inconsistent state | Per-user mutex on slot ops |
| 8 | Offspring egg lost despite grace period | FR-PET-007 audit | Player frustration | Cron job moves pending eggs |
| 9 | Multi-device roster sync lag | UX desync | Stale data | Authoritative refresh on focus |
| 10 | Upgrade prompt deemed manipulative | DPO review | Copy revision | Pre-approved copy library |
| 11 | Slot trigger overhead on bulk migration | DB perf | Slow migration | Disable trigger during bulk insert; verify after |
| 12 | Player accumulates many grandma pets | DB growth | Disk pressure | Quarterly DPO sweep + bulk archive |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (multi-pet), plan §PART 6 (Pet+ value props).

**Sub-decisions punted to ops:** Slot counts (3/10) tunable via Mixpanel flag.

**Anti-patterns explicitly forbidden:**
- Real-money individual slot purchase.
- Auto-delete on downgrade.
- FOMO upgrade copy.

**Cross-reference:** FR-PET-006 (5 species), FR-PET-007 (breeding offspring slot check), FR-PET-008 (grandma_house archival), FR-SOCIAL-003 (trade slot check), FR-SUB-001 (entitlement).
