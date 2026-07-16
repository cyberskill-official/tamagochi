---
id: TASK-CARE-002
title: "Clean/bath action — soap consumable + cleanliness restore + bubble particle + analytics"
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
related_frs: [TASK-PET-003, TASK-ART-001, TASK-CARE-001, TASK-CARE-005, TASK-ECON-001, TASK-OBS-001, TASK-INFRA-002, TASK-VIRAL-002]
depends_on: [TASK-CARE-001]
blocks: [TASK-CARE-005, TASK-VIRAL-002]
effort_hours: 6
new_files:
  - "apps/api/src/care/clean.controller.ts"
  - "apps/api/src/care/clean.service.ts"
  - "apps/api/src/care/soap-catalogue.ts"
  - "apps/api/src/care/__tests__/clean.spec.ts"
  - "apps/realtime/src/rooms/handlers/clean.handler.ts"
  - "apps/cocos/assets/_root/care/CleanAction.ts"
  - "apps/cocos/assets/_root/care/BubbleParticle.ts"
  - "apps/cocos/assets/_root/care/__tests__/CleanAction.spec.ts"
modified_files:
  - "infra/supabase/standard/migrations/20260517_010_care_actions.sql"
allowed_tools:
  - "Server-authoritative care handler"
  - "Cocos Particle2D for bubble VFX"
  - "Spine `care_clean` + `clean` animations"
  - "HapticsAdapter.tap('light')"
disallowed_tools:
  - "Real-money soap"
  - "Cleaning grandma_house / egg pets"
  - "Particle bursts without reduce-motion respect (TASK-A11Y-001)"
risk_if_skipped: "Cleanliness is one of four stats — without a clean action, the stat decays unmitigated, TASK-PET-002 care-gated stalls trigger constantly, and TASK-CARE-005 streak system loses a daily-engagement primitive."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Endpoint.** `POST /v1/pets/:petId/clean` — body `{ soap_id: 'basic'|'premium', idempotency_key: string }`. JWT required.

§1.2  **Stage gate.** Permitted only in `baby|teen|adult` per TASK-PET-002 §1.6.

§1.3  **Ownership / co-parent check.** Owner OR `active` co-parent (TASK-SOCIAL-002 P2). Else 403.

§1.4  **Soap catalogue.**
- `basic`: 5 Coins, cleanliness +60, cooldown 10 min.
- `premium` (fragrant): 20 Coins, cleanliness +85 + happiness +3, cooldown 20 min.

§1.5  **Currency spend.** Stub at P1 via TASK-ECON-001 ledger.

§1.6  **Cooldown.** Per (pet, soap) Redis sliding-window; 429 with `retry_after_sec` on miss.

§1.7  **Stat apply.** `StatDecayService.apply(stats, 'clean')` per TASK-PET-003 §3.1 (cleanliness +60 baseline) for `basic`; premium adds +25 cleanliness + 3 happiness via extended action key `clean_premium`.

§1.8  **Energy cost.** Clean costs energy -5 per TASK-PET-003 §1.4. Energy can drop to 0; pet "sleepy" UX when energy < 20.

§1.9  **Last-seen update.** Per TASK-PET-001 §1.11.

§1.10  **Audit + broadcast.** `care_actions` row with action='clean' + `pet.cleaned` broadcast.

§1.11  **Animation handshake.** 5-sec HMAC token returned; Cocos plays `care_clean` Spine animation.

§1.12  **Bubble particle.** `BubbleParticle.ts` spawns 30 Particle2D bubble emitters at the bath origin point. Particle count cap = 30; under reduce-motion, count drops to 6 + fade. Particle pool reused.

§1.13  **Haptic.** `HapticsAdapter.tap('light')` on success.

§1.14  **Rate limit.** Overall 30 cleans/hr per player.

§1.15  **Analytics.** `care.clean.success / failure { reason }`.

§1.16  **Impossible-state.** Cleaning at cleanliness=100 → 422 `pet.stat.already_full` + `security.impossible-transition`.

§1.17  **Idempotency.** Same shape as TASK-CARE-001 §1.10.

§1.18  **Source attribution.** `ui` / `co_parent_remote`.

§1.19  **No real-money soap** per TASK-LEGAL-002.

§1.20  **A11Y reduce-motion.** Particle count + animation duration respect `prefers-reduced-motion`.

---

## §2 — Why this design

Mirrors TASK-CARE-001 pattern (server-authoritative + cooldown + idempotent + audit). Differences:

- **Energy cost on clean.** Plan §PART 3 — real-world "bathing takes energy." Slight penalty differentiates clean from other actions; player learns "don't bath at 0 energy."
- **Lower cooldown ceiling than feed.** Cleanliness decays slower (TASK-PET-003 §1.2) so the player legitimately cleans less; 10-20 min cooldowns match the natural cadence.
- **Bubble particles.** Plan §PART 5 visual delight + plan §PART 3 "haptic moments." The particle pool is reused (no GC churn) and capped (no perf cliff on low-end devices).
- **Reduce-motion cap.** TASK-A11Y-001 — particle bursts can trigger vestibular symptoms; reduce to 6 with fade.
- **30/hr rate-limit (vs feed 60).** Cleanliness has lower replay potential; tighter cap is fine.

Cross-references to CARE-001 are explicit so the implementer can follow the proven pattern.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/care/clean.controller.ts
@Controller('v1/pets')
@UseGuards(SupabaseJwtGuard)
export class CleanController {
  constructor(private readonly svc: CleanService) {}
  @Post(':petId/clean')
  async clean(@CurrentUser() u: AuthedUser, @Param('petId') petId: string,
              @Body() body: { soap_id: 'basic'|'premium'; idempotency_key: string }) {
    return this.svc.clean(u, petId, body.soap_id, body.idempotency_key);
  }
}
```

```typescript
// apps/api/src/care/soap-catalogue.ts
export const SOAP_CATALOGUE = {
  basic:   { cost: 5,  cooldown_sec: 10 * 60, cleanliness_delta: 60, energy_delta: -5 },
  premium: { cost: 20, cooldown_sec: 20 * 60, cleanliness_delta: 85, happiness_delta: 3, energy_delta: -5 },
} as const;
```

```typescript
// apps/cocos/assets/_root/care/BubbleParticle.ts
import { _decorator, Component, ParticleSystem2D } from 'cc';
import { prefersReducedMotion } from '../a11y/preferences';
const { ccclass, property } = _decorator;

@ccclass('BubbleParticle')
export class BubbleParticle extends Component {
  @property(ParticleSystem2D) emitter!: ParticleSystem2D;
  burst() {
    const count = prefersReducedMotion() ? 6 : 30;
    this.emitter.totalParticles = count;
    this.emitter.duration = prefersReducedMotion() ? 0.4 : 1.0;
    this.emitter.resetSystem();
  }
}
```

```typescript
// apps/api/src/care/clean.service.ts (skeleton highlight)
async clean(u: AuthedUser, petId: string, soapId: 'basic'|'premium', idempKey: string) {
  // ... idempotency / rate-limit / ownership / stage / cleanliness=100 / cooldown / currency / stat apply ...
  const action = soapId === 'basic' ? 'clean' : 'clean_premium';
  const after = this.stats.apply(before, action as any);
  // ... persist + audit + broadcast ...
}
```

---

## §4 — Acceptance criteria

**AC1.** Clean basic on cleanliness=20 returns 200 with cleanliness_after=80.
**AC2.** Stage-locked for egg / grandma_house → 403.
**AC3.** Clean at cleanliness=100 → 422.
**AC4.** Cooldown enforced (10 min basic / 20 min premium).
**AC5.** Energy decrement on clean: -5.
**AC6.** Rate-limit 30/hr.
**AC7.** Cross-owner attempt → 403.
**AC8.** Idempotent on repeat key.
**AC9.** Bubble particles cap at 30 (6 under reduce-motion). Verified by Cocos test.
**AC10.** `pet.cleaned` broadcast over PetRoom.
**AC11.** Animation handshake — Cocos rejects unsigned token.
**AC12.** Audit row written with action='clean' + correct deltas.

---

## §5 — Verification

```typescript
// apps/api/src/care/__tests__/clean.spec.ts
import { describe, it, expect } from 'vitest';
import { CleanService } from '../clean.service';

describe('TASK-CARE-002 — clean', () => {
  it('basic +60 cleanliness, -5 energy', async () => {
    const r = await svc.clean(user('u1'), 'pet-mochi', 'basic', 'k1');
    expect(r.cleanliness_after).toBe(80);
    expect(r.energy_after).toBe(95);
  });

  it('clamps at 100', async () => {
    const r = await svc.clean(user('u1'), 'pet-mostly-clean', 'premium', 'k2');
    expect(r.cleanliness_after).toBe(100);
  });

  it('rejects at cleanliness=100', async () => {
    await expect(svc.clean(user('u1'), 'pet-clean', 'basic', 'k3')).rejects.toMatchObject({ status: 422 });
  });
});
```

```typescript
// apps/cocos/assets/_root/care/__tests__/CleanAction.spec.ts
describe('TASK-CARE-002 §1.12 — bubble particle reduce-motion', () => {
  it('caps at 6 particles under reduce-motion', () => {
    vi.spyOn(a11y, 'prefersReducedMotion').mockReturnValue(true);
    const b = new BubbleParticle();
    b.emitter = { totalParticles: 0, duration: 0, resetSystem: vi.fn() } as any;
    b.burst();
    expect(b.emitter.totalParticles).toBe(6);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/realtime/src/rooms/handlers/clean.handler.ts
export function installCleanHandler(room: PetRoom, svc: CleanService) {
  room.onMessage('clean.intent', async (client, payload: { pet_id: string; soap_id: 'basic'|'premium'; idempotency_key: string }) => {
    try {
      const result = await svc.clean(client.user, payload.pet_id, payload.soap_id, payload.idempotency_key);
      client.send('clean.success', result);
      room.broadcast('pet.cleaned', result, { except: client });
    } catch (err: any) {
      client.send('clean.failure', { error: err.message, status: err.status });
    }
  });
}
```

---

## §7 — Dependencies

**External:** Redis (cooldown); Cocos Particle2D runtime.
**Internal:** TASK-CARE-001 (template), TASK-PET-003 (stat apply + clean_premium action key needs adding to TASK-PET-003 §3.2 stat-config), TASK-ART-001 (care_clean animation), TASK-INFRA-002 (Colyseus broadcast).
**Blocks:** TASK-CARE-005 (streak detection reads care_actions), TASK-VIRAL-002 (Daily Drama can reference clean events).

---

## §8 — Example payloads

```http
POST /v1/pets/01HC.../clean
{ "soap_id": "basic", "idempotency_key": "01HCCLEAN..." }

→ 200 OK
{ "pet_id": "01HC...", "soap_id": "basic", "cleanliness_after": 80, "energy_after": 95, "animation_token": "eyJ..." }
```

```json
{
  "event": "care.clean.success",
  "pet_id": "01HC...",
  "soap_id": "basic",
  "cleanliness_before": 20,
  "cleanliness_after": 80,
  "energy_delta": -5,
  "source": "ui"
}
```

```json
{
  "id": 4243,
  "action": "clean",
  "cleanliness_before": 20, "cleanliness_after": 80,
  "energy_before": 100, "energy_after": 95,
  "source": "ui"
}
```

```json
{ "error": "cooldown", "retry_after_sec": 540 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Premium soap stat shape? → §1.4 — +85 cleanliness + 3 happiness.
- **OQ-2 (resolved):** Particle count cap? → §1.12 — 30 default, 6 reduced-motion.
- **OQ-3 (resolved):** Energy cost reasonable? → §1.8 + §2 — slight penalty creates intuition.
- **OQ-4 (resolved):** Co-parent visibility same as feed? → §1.10 — same broadcast pattern.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Redis cooldown fail-closed | Cooldown service errors | All cleans rejected | Service-degraded UX |
| 2 | Particle pool exhausted on rapid clean spam | Cocos warning | Bubbles missing | Pool extension or cap visual |
| 3 | Reduce-motion check fails to read OS pref | a11y service errors | Full 30 particles even under preference | Default to reduced count on uncertainty |
| 4 | Energy clamps to 0 mid-clean → frustrated user | Stat audit | UX cue surfaces "Mochi too tired" | Pre-action energy check + warning |
| 5 | Concurrent clean + feed mutate stats out-of-order | Per-pet mutex catches | Race avoided | (covered by TASK-PET-003 §10 row 12) |
| 6 | Premium soap accidentally surfaced as IAP | TASK-LEGAL-002 lint | Build blocked | Catalogue field guarded by lint |
| 7 | Bubble particle texture missing | Cocos error | Fallback shape | Lottie fallback or text "✨" |
| 8 | Rate-limit collides with multi-pet user | Support ticket | Player blocked | Raise to 60/hr for Pet+ |
| 9 | Co-parent broadcast lost | UX desync | Receipt notification missed | Persistent state on rejoin |
| 10 | Animation token expires before client plays | UX hang | Animation skipped | Static end-pose snap; Sentry warn |
| 11 | Audit growth from frequent cleans | Disk | 90-day retention policy |
| 12 | Stage transition mid-clean (rare) | OK — cooldown survives | None | Cooldown is stage-agnostic |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (clean as one of 4 care primitives), plan §PART 5 (haptic moments + particles), plan §PART 8 (no real-money soap).

**Sub-decisions punted to ops:** Soap costs (5/20) Mixpanel-tunable; cleanliness deltas (60/85) tunable.

**Anti-patterns explicitly forbidden:** Real-money soap; cleaning grandma_house; particle bursts ignoring reduce-motion.

**Cross-reference:** TASK-CARE-003/004 follow same pattern. TASK-PET-003 §3.2 needs an extension `clean_premium` action key (-5 energy, +85 cleanliness, +3 happiness) — flagged in §7.
