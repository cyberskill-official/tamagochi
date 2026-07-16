---
id: TASK-SOCIAL-002
title: "PetPair co-parent mode — two phones share one pet + receipt push + break-up screen on one-sided care"
module: SOCIAL
priority: MUST
status: done
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead + designer"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-SOCIAL-001, TASK-PET-001, TASK-CARE-001, TASK-CARE-002, TASK-CARE-003, TASK-INFRA-002, TASK-VIRAL-005, TASK-OBS-001, TASK-LEGAL-001, TASK-AUTH-003]
depends_on: [TASK-SOCIAL-001, TASK-CARE-001, TASK-CARE-002, TASK-CARE-003]
blocks: [TASK-SOCIAL-003, TASK-SOCIAL-004]
effort_hours: 14
new_files:
  - "apps/api/src/social/coparent/coparent.controller.ts"
  - "apps/api/src/social/coparent/coparent.service.ts"
  - "apps/api/src/social/coparent/coparent-invite.service.ts"
  - "apps/api/src/social/coparent/breakup-watch.service.ts"
  - "apps/api/src/social/coparent/__tests__/coparent.spec.ts"
  - "apps/api/src/social/coparent/__tests__/breakup-watch.spec.ts"
  - "apps/cocos/assets/_root/social/PetPairInviteUi.ts"
  - "apps/cocos/assets/_root/social/PetPairDashboardUi.ts"
  - "apps/cocos/assets/_root/social/BreakupScreenUi.ts"
modified_files:
  - "apps/api/src/care/feed.service.ts"
  - "apps/api/src/care/clean.service.ts"
  - "apps/api/src/care/hug.service.ts"
  - "apps/realtime/src/rooms/PetRoom.ts"
allowed_tools:
  - "TASK-PET-001 pet_co_parents table (provisioned at P1)"
  - "Colyseus PetRoom maxClients=2"
  - "TASK-VIRAL-005 push notifications"
disallowed_tools:
  - "Co-parent for under-13 SKU without parental dashboard approval (TASK-AUTH-003)"
  - "Permanent co-parent ownership transfer (always invitee-can-leave)"
  - "Co-parent across SKU boundary"
  - "Real-money co-parent slot expansion"
risk_if_skipped: "Plan §PART 3 viral hook #1 — PetPair is THE differentiation wedge from Pou/Talking Tom (Widgetable / Pengu / Pokipet pattern). Without it, the consumer game collapses to a more polished Pou-clone."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **PetPair definition.** A PetPair is a pet co-parented by **exactly 2 players**: the original owner + 1 co-parent. Both can feed/clean/hug/play; both see live state.

§1.2  **Eligibility.** Initial owner must be at `stage ∈ {teen, adult}` per TASK-PET-002 §1.6. Both players must be **friends** per TASK-SOCIAL-001. Both must be on the standard SKU (no kid co-parenting at P1/P2; parental-dashboard-controlled in P3 via TASK-SUB-002).

§1.3  **Invite flow.** Owner taps "Invite a co-parent" → selects a friend → API `POST /v1/pets/:petId/coparent/invite` body `{ friend_user_id: string }`. Creates a row in `pet_co_parents` with `status='pending'`.

§1.4  **Accept flow.** Friend receives push + in-app card "X wants to co-parent Mochi with you!". Friend taps Accept → `POST /v1/pets/:petId/coparent/:friendUserId/accept`. Row transitions to `active`.

§1.5  **Co-parent permissions.** Active co-parent can: feed/clean/hug/play; trigger AI dialogue; place in AR (their own device's AR session); take photos. CANNOT: rename, breed, trade, archive to grandma, remove the original owner.

§1.6  **Owner privileges.** Owner can remove co-parent at any time via `DELETE /v1/pets/:petId/coparent/:userId`. Co-parent receives gentle notification.

§1.7  **Co-parent leaves.** Co-parent can leave voluntarily via `DELETE /v1/pets/:petId/coparent/self`. Owner notified.

§1.8  **One co-parent per pet at P2.** Multi-co-parent (3+) is deferred to P3+.

§1.9  **Pets per player as co-parent.** A player can be co-parent on up to **3 pets** (free) or **10 pets** (Pet+). Owned pets + co-parented pets count separately against their respective limits.

§1.10  **Receipt push.** When a co-parent performs a care action, the OTHER party receives a push notification (TASK-VIRAL-005 sleep-hour respected): "Linh fed Mochi while you were asleep ❤️" — copy locked in `apps/cocos/assets/i18n/<locale>/petpair.json`.

§1.11  **Receipt push throttling.** Max 4 receipt pushes per pet per day per recipient. Beyond → aggregated daily digest at next non-quiet-hour.

§1.12  **Live presence in PetRoom.** Colyseus PetRoom `maxClients = 2` (owner + co-parent). When both connected simultaneously, see real-time care actions. When one disconnected, the other plays solo + receives receipts.

§1.13  **Source attribution.** Care actions performed by co-parent tagged `source='co_parent_remote'` per TASK-CARE-001 §1.17. Audit + analytics distinguishable.

§1.14  **Break-up screen.** A `breakup-watch.service.ts` MUST monitor: when ONLY ONE party has performed care for **3 consecutive days**, surface "break-up screen" UX to BOTH parties: "Linh hasn't fed Mochi in 3 days. Are you still co-parenting together?". CTAs: "Yes, keep going" / "End PetPair" / "Talk to Linh".

§1.15  **End PetPair on choose.** If either chooses "End PetPair", co-parent row transitions to `removed`. Both notified.

§1.16  **Pet stays with owner.** When PetPair ends (any path), the pet remains with the original owner. Co-parent loses access. (Designed-in non-disputable ownership.)

§1.17  **Cross-SKU + cross-tenant locked.** Cross-SKU forbidden per §1.2. Cross-tenant forbidden per TASK-INFRA-003.

§1.18  **Audit + analytics.** `social.coparent.invite_sent`, `social.coparent.accepted`, `social.coparent.declined`, `social.coparent.action { source }`, `social.coparent.breakup_warned`, `social.coparent.ended { trigger: 'owner' | 'coparent' | 'breakup' }` per TASK-OBS-001.

§1.19  **TikTok share moments.** Per TASK-VIRAL-001, breakup-warning moment is a documented share-worthy beat (sad/dramatic). Opt-in share button surfaces.

§1.20  **Pet-pair limit per owner.** An owner can have at most **1 active co-parent per pet** at P2. Trying to add a 2nd → 409 `coparent.already_active`.

---

## §2 — Why this design

**Why exactly 2 at P2.** Plan §PART 3 Widgetable/Pengu pattern — co-parent is 1-to-1 intimacy. 3+ dilutes the emotional thread.

**Why limited co-parent permissions.** Owner retains identity. Renaming / breeding / trading affect long-term inventory; co-parent only does daily care.

**Why owner can remove unilaterally.** Anti-abuse — prevents extortion ("give me Coins or I'll grief your pet").

**Why both standard SKU only at P2.** TASK-AUTH-003 + COPPA — kids social interactions go through parental dashboard. P3 TASK-SUB-002 wires the parental gate.

**Why 4 daily receipt pushes max.** Plan §PART 3 retention + plan §PART 5 ethical UX — anti-spam on notification.

**Why break-up screen on 3-day asymmetry.** Plan §PART 3 — "creates Reddit drama screenshots." Designed-in tension.

**Why pet stays with owner on end.** Conflict avoidance. Disputed-ownership scenarios collapse to "owner wins."

**Why share break-up moment.** Plan §PART 3 — sad-relatable beats are organically viral.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/social/coparent/coparent.controller.ts
@Controller('v1/pets')
@UseGuards(SupabaseJwtGuard)
export class CoparentController {
  @Post(':petId/coparent/invite')
  async invite(@CurrentUser() u: AuthedUser, @Param('petId') petId: string, @Body() body: { friend_user_id: string }) {
    return this.svc.invite(u, petId, body.friend_user_id);
  }
  @Post(':petId/coparent/:friendUserId/accept')
  async accept(@CurrentUser() u: AuthedUser, @Param('petId') petId: string, @Param('friendUserId') friendId: string) {
    return this.svc.accept(u, petId, friendId);
  }
  @Delete(':petId/coparent/:userId')
  async remove(@CurrentUser() u: AuthedUser, @Param('petId') petId: string, @Param('userId') uid: string) {
    return this.svc.remove(u, petId, uid);
  }
}
```

```typescript
// apps/api/src/social/coparent/coparent.service.ts (excerpt)
async invite(u: AuthedUser, petId: string, friendId: string) {
  const pet = await this.pets.byId(petId);
  if (pet.owner_id !== u.id) throw new HttpException('forbidden', 403);
  if (!['teen','adult'].includes(pet.stage)) throw new HttpException('pet.stage.locked', 422);
  if (!await this.friends.isAccepted(u.id, friendId)) throw new HttpException('coparent.not_friend', 422);
  if (await this.crossSku(u.id, friendId)) throw new HttpException('coparent.cross_sku', 403);
  const existing = await this.supa.from('pet_co_parents').select('status').eq('pet_id', petId).eq('status', 'active').maybeSingle();
  if (existing.data) throw new HttpException('coparent.already_active', 409);
  await this.supa.from('pet_co_parents').insert({ pet_id: petId, co_parent_user_id: friendId, status: 'pending' });
  await this.notify.sendCoparentInvite(friendId, pet.display_name, u.id);
}
```

```typescript
// apps/api/src/social/coparent/breakup-watch.service.ts
@Injectable()
export class BreakupWatchService {
  async runDailyCheck() {
    const { data: pairs } = await this.supa.from('pet_co_parents').select('*').eq('status', 'active');
    for (const pair of pairs ?? []) {
      const since = daysAgo(3);
      const { data: actions } = await this.supa.from('care_actions')
        .select('owner_id, source').eq('pet_id', pair.pet_id).gte('occurred_at', since);
      const distinctActors = new Set(actions?.map(a => a.source === 'co_parent_remote' ? pair.co_parent_user_id : a.owner_id));
      if (distinctActors.size === 1 && actions && actions.length > 0) {
        await this.notify.sendBreakupWarning(pair, [...distinctActors][0]);
        await this.audit.emit('social.coparent.breakup_warned', { pet_id: pair.pet_id });
      }
    }
  }
}
```

---

## §4 — Acceptance criteria

**AC1.** Invite → accept flow end-to-end. Verified.
**AC2.** Cross-SKU invite returns 403. Verified.
**AC3.** Co-parent feed action emits `source=co_parent_remote`. Verified.
**AC4.** Both clients receive receipt push (sleep-respected). Verified.
**AC5.** Break-up screen surfaces on 3-day one-sided care. Verified by fake-clock.
**AC6.** Owner remove unilateral. Verified.
**AC7.** Pet stays with owner on end. Verified.
**AC8.** Co-parent cannot rename/breed/trade. Verified.
**AC9.** Receipt push 4/day cap → digest. Verified.
**AC10.** PetRoom maxClients=2 enforced. Verified.
**AC11.** Cross-tenant rejected. Verified.
**AC12.** TikTok share button surfaces on break-up moment. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/social/coparent/__tests__/breakup-watch.spec.ts
describe('TASK-SOCIAL-002 — breakup watch', () => {
  it('warns on 3-day one-sided care', async () => {
    await setupCoPair('owner', 'coparent', 'pet1');
    for (let i = 0; i < 3; i++) {
      await advanceClockDay();
      await seedCareAction('pet1', 'owner', 'ui');
    }
    await svc.runDailyCheck();
    expect(await notifications.lastFor('owner')).toMatch(/breakup_warning/);
    expect(await notifications.lastFor('coparent')).toMatch(/breakup_warning/);
  });

  it('does not warn when both have acted', async () => {
    await setupCoPair('owner', 'coparent', 'pet1');
    for (let i = 0; i < 3; i++) {
      await seedCareAction('pet1', i % 2 === 0 ? 'owner' : 'coparent', i % 2 === 0 ? 'ui' : 'co_parent_remote');
      await advanceClockDay();
    }
    await svc.runDailyCheck();
    expect(await notifications.lastFor('owner')).toBeUndefined();
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/_root/social/BreakupScreenUi.ts
@ccclass('BreakupScreenUi')
export class BreakupScreenUi extends Component {
  async show(pairInfo: { other_party_name: string; pet_name: string; days_silent: number }) {
    this.titleLabel.string = `${pairInfo.other_party_name} hasn't fed ${pairInfo.pet_name} in ${pairInfo.days_silent} days`;
    this.continueBtn.onClick = () => this.dismiss();
    this.endBtn.onClick = () => this.endPair();
    this.talkBtn.onClick = () => this.openShareIntent({ source: 'breakup', message: 'Hey, are we still co-parenting Mochi?' });
  }
}
```

---

## §7 — Dependencies

**External:** Push notification system (TASK-VIRAL-005).
**Internal:** TASK-SOCIAL-001 (friend graph), TASK-CARE-001/002/003 (care actions with source attribution), TASK-INFRA-002 (Colyseus PetRoom maxClients=2), TASK-VIRAL-001 (break-up share moment).
**Blocks:** TASK-SOCIAL-003 (trade needs co-parent presence model), TASK-SOCIAL-004 (wedding builds on co-parent).

---

## §8 — Example payloads

```http
POST /v1/pets/01HC.../coparent/invite
{ "friend_user_id": "01HU..." }
→ 200 { "pet_id": "01HC...", "co_parent_user_id": "01HU...", "status": "pending" }
```

```json
{ "event": "social.coparent.action", "pet_id": "01HC...", "actor": "co_parent_remote", "kind": "feed" }
```

```json
{
  "type": "push.coparent.receipt",
  "title": "Linh fed Mochi while you were asleep ❤️",
  "body": "Mochi's hunger is back up to 80%"
}
```

```json
{ "event": "social.coparent.breakup_warned", "pet_id": "01HC...", "owner_id": "01HU...", "co_parent_user_id": "01HU...", "days_silent": 3 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 1 vs N co-parents at P2? → §1.8 — 1.
- **OQ-2 (resolved):** Co-parent permissions scope? → §1.5 + §2.
- **OQ-3 (resolved):** Dispute resolution? → §1.16 — owner wins.
- **OQ-4 (resolved):** Kids co-parent? → §1.2 — defer.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Concurrent care from owner + co-parent | Per-pet mutex | None | Already covered by TASK-PET-003 |
| 2 | Receipt push during sleep hours | TASK-VIRAL-005 | Suppressed | OK |
| 3 | Co-parent count miscounts on cancellation | Audit | Limit wrong | Status-aware query |
| 4 | Receipt spam 5+/day | Throttle catches | Digest only | Verified by test |
| 5 | Break-up warning misfires (timezone off) | Spec test | False positive | TZ-aware day computation |
| 6 | Cross-SKU through bypass | Spec test | COPPA risk | Validation enforced |
| 7 | Owner removes during invite acceptance race | Atomic SQL | Last-write wins | Conservative reject |
| 8 | Co-parent disconnects mid-action | Colyseus tolerates | Action persists | Eventual consistency |
| 9 | TikTok share break-up creates negativity loops | DPO review | UX risk | Optional share + locale-tuned copy |
| 10 | PetPair across tenant via misconfig | RLS | Privacy | Enforced |
| 11 | Push spam to recipient (4+/day) | Aggregation | Digest | OK |
| 12 | Audit retention COPPA gap | DPO | 7-yr kept | Configured |

---

## §11 — Notes

**Plan refs:** plan §PART 3 viral hook #1 (PetPair co-parent), plan §PART 3 break-up screen / Reddit drama.

**Sub-decisions punted to ops:** Receipt copy + break-up copy DPO-reviewed.

**Anti-patterns explicitly forbidden:**
- 3+ co-parents.
- Real-money slot expansion.
- Co-parent renaming/breeding/trading.
- Permanent ownership transfer.

**Cross-reference:** TASK-SOCIAL-003 trade window uses presence model. TASK-SOCIAL-004 wedding builds on co-parent intimacy.
