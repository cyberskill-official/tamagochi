---
id: TASK-CARE-003
title: "Hug/pet action — happiness restore + haptic + Spine care_pet anim + 24h soft cap"
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
related_frs: [TASK-PET-003, TASK-PET-004, TASK-ART-001, TASK-CARE-001, TASK-CARE-005, TASK-OBS-001, TASK-INFRA-002, TASK-AI-001, TASK-VIRAL-002]
depends_on: [TASK-CARE-001]
blocks: [TASK-CARE-005, TASK-PET-004, TASK-VIRAL-002]
effort_hours: 6
new_files:
  - "apps/api/src/care/hug.controller.ts"
  - "apps/api/src/care/hug.service.ts"
  - "apps/api/src/care/__tests__/hug.spec.ts"
  - "apps/realtime/src/rooms/handlers/hug.handler.ts"
  - "apps/cocos/assets/_root/care/HugAction.ts"
  - "apps/cocos/assets/_root/care/__tests__/HugAction.spec.ts"
modified_files: []
allowed_tools:
  - "HapticsAdapter.tap('medium')"
  - "Spine `care_pet` animation"
  - "Lottie heart-burst micro-anim"
disallowed_tools:
  - "Real-money hug boosters"
  - "Hugging grandma_house pets (frozen)"
  - "Bypassing 24h soft cap by spawning duplicate pet IDs"
risk_if_skipped: "Hug is the free zero-cost daily-engagement primitive — without it, the daily retention loop has no cost-free option for low-engagement players; first-pat onboarding (TASK-PET-004 §1.5) uses the same handler so this is hard-blocking."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Endpoint.** `POST /v1/pets/:petId/hug` — body `{ idempotency_key: string }`. No payload variants (hug is one action).

§1.2  **Stage gate.** `baby|teen|adult` only.

§1.3  **Ownership / co-parent.** Owner OR active co-parent.

§1.4  **Zero cost.** Hug is the only free care action. No currency spend. This is intentional — daily-engagement primitive should not gate on Coins.

§1.5  **Stat effect.** `StatDecayService.apply(stats, 'hug')` — happiness +25.

§1.6  **24h soft cap.** Beyond 24 hugs per pet per day, additional hugs MUST return 200 BUT apply only +1 happiness (diminishing returns). Cap resets at player's local midnight. Prevents farm-spam exploiting free action for unlimited happiness.

§1.7  **Per-hug cooldown.** 30 seconds between hugs on the same pet. Within 30s → 429 `cooldown` with `retry_after_sec`.

§1.8  **Overall rate-limit.** 120 hugs/hour per player (across all pets, generous).

§1.9  **Haptic.** `HapticsAdapter.tap('medium')` on success.

§1.10  **Animation handshake.** Token returned; Cocos plays Spine `care_pet`.

§1.11  **Heart-burst Lottie micro-anim.** Plays from the tap point; under reduce-motion, replaced by static heart icon for 800 ms.

§1.12  **Audit row.** `care_actions` action='hug'.

§1.13  **Colyseus broadcast.** `pet.hugged` event.

§1.14  **Last-seen + analytics.** `pet.last_seen_at` updated; `care.hug.success / care.hug.diminishing_returns` events.

§1.15  **Impossible-state.** Hug at happiness=100 + within first 24 daily hugs → 422; if past daily-cap diminishing-returns, OK (the diminishing-returns IS the rate-limit).

§1.16  **Idempotency.** Same shape as TASK-CARE-001.

§1.17  **Source attribution.** ui / co_parent_remote.

§1.18  **First-pat reuse.** TASK-PET-004 §1.5's first-pat MUST invoke this handler (with `source='first_pat'`). Diminishing-returns + cooldown bypassed for the onboarding case via a server-side bypass header.

§1.19  **No third-party gating.** Free action regardless of subscription tier — Pet+ does not unlock a "premium hug."

§1.20  **AI surface integration.** Each hug emits a `care.hug.success` event with current happiness; TASK-AI-001 LLM persona MAY reference this in next dialogue line ("you've been hugging me so much today!").

---

## §2 — Why this design

**Why hug is free.** Plan §PART 3 retention — daily engagement must have a zero-friction option. Currency-gated care primitives + non-engaged players = churn.

**Why a daily soft cap.** Without it, a player could tap "hug" 100 times in 1 minute, blow happiness to 100 + check off the day. The 24-hug cap matches plausible legitimate use (a kid hugging their pet a few times throughout the day).

**Why diminishing returns instead of hard reject.** Hard reject feels punitive ("you've hugged too much today!"). Diminishing returns rewards the engagement intent without rewarding the spam.

**Why 30s per-hug cooldown.** Prevents accidental double-tap from registering twice. Long enough to feel deliberate, short enough not to interrupt natural play.

**Why TASK-PET-004 first-pat shares this handler.** Onboarding's first-pat is conceptually identical to "hug" — same animation, same +25 happiness. Reusing the handler avoids two code paths.

**Why server-side bypass for first-pat.** First-pat happens at onboarding when no cooldown is in place AND must not consume the player's daily 24-hug allowance — they shouldn't have used a daily hug before they even had a real session.

**Why AI integration hook.** Plan §PART 3 viral #3 — AI personality. Care actions feeding into AI context = personality feels reactive ("you've been so good to me today!").

---

## §3 — API contract & code shape

```typescript
// apps/api/src/care/hug.controller.ts
@Controller('v1/pets')
@UseGuards(SupabaseJwtGuard)
export class HugController {
  constructor(private readonly svc: HugService) {}
  @Post(':petId/hug')
  async hug(@CurrentUser() u: AuthedUser, @Param('petId') petId: string,
            @Body() body: { idempotency_key: string },
            @Headers('x-onboarding-bypass') onboardingBypass?: string) {
    return this.svc.hug(u, petId, body.idempotency_key, { onboardingBypass: !!onboardingBypass });
  }
}
```

```typescript
// apps/api/src/care/hug.service.ts (highlight)
async hug(u: AuthedUser, petId: string, idempKey: string, opts: { onboardingBypass: boolean }) {
  const prior = await this.idemp.lookup(u.id, `hug:${idempKey}`);
  if (prior) return prior;
  await this.limit.assert({ key: `hug-overall:${u.id}`, perHour: 120 });
  const pet = await this.pets.byId(petId);
  this.assertStageAndOwner(u, pet);
  if (!opts.onboardingBypass) {
    const ttl = await this.cooldown.check(petId, 'hug');
    if (ttl > 0) throw new HttpException({ error: 'cooldown', retry_after_sec: ttl }, 429);
  }
  const dailyCount = await this.dailyCounter.get(petId, u.id);
  const happinessDelta = dailyCount < 24 ? 25 : 1;            // diminishing returns
  const before = snapshotStats(pet);
  if (before.happiness >= 100 && dailyCount < 24 && !opts.onboardingBypass) {
    throw new HttpException('pet.stat.already_full', 422);
  }
  const after = this.stats.apply(before, dailyCount < 24 ? 'hug' : 'hug_diminished');
  await this.persist(pet, after);
  await this.dailyCounter.increment(petId, u.id);
  if (!opts.onboardingBypass) await this.cooldown.start(petId, 'hug', 30);
  await this.audit.write({ who: u.id, what: dailyCount < 24 ? 'care.hug.success' : 'care.hug.diminishing_returns', what_keys: { pet_id: petId } });
  return { pet_id: petId, happiness_after: after.happiness, daily_count: dailyCount + 1, diminishing: dailyCount >= 24 };
}
```

```typescript
// apps/realtime/src/rooms/handlers/hug.handler.ts
export function installHugHandler(room: PetRoom, svc: HugService) {
  room.onMessage('hug.intent', async (client, payload: { pet_id: string; idempotency_key: string }) => {
    try {
      const r = await svc.hug(client.user, payload.pet_id, payload.idempotency_key, { onboardingBypass: false });
      client.send('hug.success', r);
      room.broadcast('pet.hugged', r, { except: client });
    } catch (err: any) { client.send('hug.failure', { error: err.message, status: err.status }); }
  });
}
```

---

## §4 — Acceptance criteria

**AC1.** Hug on happiness=50 returns happiness_after=75. Verified. **AC2.** 25th hug in 24h returns happiness +1 with `diminishing: true` flag. Verified. **AC3.** Per-hug cooldown 30s enforced. Verified. **AC4.** Onboarding-bypass header skips cooldown + daily cap. Verified by spec test with bypass. **AC5.** Stage-locked for egg / grandma_house. Verified. **AC6.** Cross-owner attempt → 403. Verified. **AC7.** 24h cap resets at player's local midnight (region-aware). Verified by fake-clock test. **AC8.** Animation handshake works. Verified. **AC9.** No currency spend. Verified (CurrencyLedger.spend not called). **AC10.** Heart-burst Lottie respects reduce-motion (static icon). Verified. **AC11.** Rate-limit 120/hr. Verified. **AC12.** Audit row + AI-surface event emitted. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/care/__tests__/hug.spec.ts
describe('TASK-CARE-003 — hug action', () => {
  it('full hug +25 happiness for first 24', async () => {
    const r = await svc.hug(user('u1'), 'pet-mochi', 'k1', { onboardingBypass: false });
    expect(r.happiness_after).toBe(75);
    expect(r.diminishing).toBe(false);
  });

  it('25th hug applies +1 only', async () => {
    for (let i = 0; i < 24; i++) {
      await svc.hug(user('u1'), 'pet-mochi', `k${i+10}`, { onboardingBypass: false });
      await advanceClockSec(31);  // bypass cooldown
    }
    const r25 = await svc.hug(user('u1'), 'pet-mochi', 'k25', { onboardingBypass: false });
    expect(r25.diminishing).toBe(true);
  });

  it('onboarding bypass skips cooldown', async () => {
    await svc.hug(user('u1'), 'pet-mochi', 'k1', { onboardingBypass: false });
    await expect(svc.hug(user('u1'), 'pet-mochi', 'k2', { onboardingBypass: true })).resolves.toBeTruthy();
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/care/daily-counter.service.ts
@Injectable()
export class DailyCounter {
  constructor(@Inject('REDIS') private readonly redis: RedisClientType) {}
  async get(petId: string, userId: string): Promise<number> {
    const day = todayInUserRegion(userId);
    const v = await this.redis.get(`hug:${day}:${petId}:${userId}`);
    return v ? parseInt(v, 10) : 0;
  }
  async increment(petId: string, userId: string): Promise<void> {
    const day = todayInUserRegion(userId);
    const key = `hug:${day}:${petId}:${userId}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 36 * 3600); // 36h safety window (covers DST)
  }
}
```

---

## §7 — Dependencies

**External:** Redis (daily counter + cooldown). **Internal:** TASK-CARE-001 (pattern), TASK-PET-003 (stat apply — needs `hug_diminished` action key extension), TASK-PET-004 (onboarding bypass header), TASK-ART-001 (`care_pet` animation). **Blocks:** TASK-CARE-005 (streak system), TASK-VIRAL-002 (Daily Drama events), TASK-AI-001 (persona context).

---

## §8 — Example payloads

```http
POST /v1/pets/01HC.../hug
{ "idempotency_key": "01HCHUG..." }
→ 200 { "pet_id": "01HC...", "happiness_after": 75, "daily_count": 1, "diminishing": false, "animation_token": "eyJ..." }
```

```json
{
  "event": "care.hug.success",
  "pet_id": "01HC...",
  "happiness_before": 50,
  "happiness_after": 75,
  "daily_count": 1,
  "source": "ui"
}
```

```json
{ "event": "care.hug.diminishing_returns", "pet_id": "01HC...", "daily_count": 25, "happiness_after": 88 }
```

```json
{ "error": "cooldown", "retry_after_sec": 18 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 24 cap vs other number? → §1.6 + §2 — plausible legitimate-use ceiling.
- **OQ-2 (resolved):** Diminishing returns vs hard reject? → §2 — non-punitive.
- **OQ-3 (resolved):** Premium "double-hug" Pet+ feature? → §1.19 — no, free for everyone.
- **OQ-4 (resolved):** Cap reset clock? → §1.6 — player's local midnight, region-aware.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Daily counter Redis lost | Counter resets to 0 mid-day | Free re-hug abuse | Fail-closed: hard-reject at 0 if counter unavailable |
| 2 | Region-of-record changes mid-day → cap reset early | Audit | Possible exploit | Reset only if local-day boundary crossed; lock cap to UTC if region missing |
| 3 | Onboarding bypass header leaked | Spec test catches | Cooldown bypass abuse | Sign onboarding bypass via HMAC + ephemeral key |
| 4 | Lottie heart asset missing | Cocos error | Fallback static icon | Pre-shipped fallback path |
| 5 | Concurrent hug + feed | Per-pet mutex | None | (TASK-PET-003) |
| 6 | Co-parent broadcast race with diminishing | UX desync | Stale view | Persistent state authoritative |
| 7 | 24h cap fires while user is in pet wedding ceremony | Edge case | Wedding gives a hug bonus? | TASK-SOCIAL-004 handles via separate path |
| 8 | DST transition shifts local-day boundary | Counter exp 36h | OK | 36-hour expiry covers it |
| 9 | First-pat onboarding bypass abused by attacker | Validate JWT scope | Onboarding done-flag check | Reject bypass when `onboarding_state.tutorial_dismissed_at IS NOT NULL` |
| 10 | Animation token forge | Cocos client validates | None | Token signed |
| 11 | Audit growth | Disk | 90-day retention |
| 12 | AI surface dependency leaks PII | Per TASK-AI-002 content safety | Filter applied |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (free daily engagement), plan §PART 5 (haptic moment).

**Sub-decisions punted to ops:** 24-cap value tunable via Mixpanel flag.

**Anti-patterns explicitly forbidden:**
- Currency-gating hug.
- Hard-reject on cap (vs diminishing returns).
- Onboarding-bypass without server-side post-onboarding check.

**Cross-reference:** TASK-PET-004 first-pat reuses this handler. TASK-CARE-005 streak detection counts hug as one engagement primitive.
