---
id: TASK-SOCIAL-003
title: "Trust-trade window — both-sides-show confirm + server-authoritative atomic swap + rate-limit + no off-platform"
module: SOCIAL
priority: MUST
status: done
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-PET-001, TASK-PET-005, TASK-PET-006, TASK-PET-008, TASK-SOCIAL-001, TASK-INFRA-002, TASK-INFRA-003, TASK-OBS-001, TASK-OBS-002, TASK-LEGAL-001, TASK-LEGAL-002]
depends_on: [TASK-PET-005, TASK-SOCIAL-001]
blocks: []
effort_hours: 12
new_files:
  - "apps/api/src/social/trade/trade.controller.ts"
  - "apps/api/src/social/trade/trade.service.ts"
  - "apps/api/src/social/trade/trade-window.state.ts"
  - "apps/api/src/social/trade/__tests__/trade.spec.ts"
  - "apps/api/src/social/trade/__tests__/atomic-swap.spec.ts"
  - "apps/realtime/src/rooms/TradeRoom.ts"
  - "apps/cocos/assets/_root/social/TradeWindowUi.ts"
  - "infra/supabase/standard/migrations/20260517_019_trades.sql"
modified_files: []
allowed_tools:
  - "Colyseus dedicated TradeRoom"
  - "Postgres trades table with strict state machine"
  - "Trade-window state lifecycle (offer/lock/confirm/swap)"
disallowed_tools:
  - "Real-money trade fees (TASK-LEGAL-002)"
  - "Off-platform trades (security)"
  - "Trading grandma_house pets (TASK-PET-008)"
  - "Trading first-pet ever (anti-throwaway-account abuse)"
  - "Trade involving more than 2 players"
risk_if_skipped: "Plan §PART 3 viral wedge + plan §PART 10 risk #7 Adopt Me scam crisis. Without trust-trade window with both-sides-show + atomic swap, scam-rate skyrockets and community collapses."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Trade definition.** A trade is an atomic exchange of exactly 2 pets between 2 players. Player A offers pet X; player B offers pet Y; on mutual confirmation, ownership swaps in a single Postgres transaction.

§1.2  **Eligibility — pets.** Pets must be: `status='active'` (not grandma, not tombstoned); `stage='adult'` (no baby/teen trading); owned by the offering player; not the player's first-ever-hatched pet (prevents fresh-account fraud); not currently incubating offspring (TASK-PET-007).

§1.3  **Eligibility — players.** Both players must be friends (TASK-SOCIAL-001) AND both on standard SKU (kids cannot trade — defer to parental dashboard P3+). Both must have at least 1 free pet slot (receiver) or be trading equal-count (1-for-1).

§1.4  **Trade window — 4 phases.**
- **Offer**: A proposes pet X for B's pet Y. State `offered`. B has 5 min to lock.
- **Lock**: B locks their side (commits to the trade). State `locked`. A has 60s to confirm.
- **Confirm**: A confirms after seeing B's lock. State `confirmed`.
- **Swap**: Server executes atomic swap. State `completed`.

§1.5  **Both-sides-show UI.** Per plan §PART 3 + plan §PART 10 #7 — at lock + confirm phases, BOTH parties see EXACTLY the same trade summary: their offered pet, the other's offered pet, with full details (species, tier, palette, stat snapshot). No hidden modifiers.

§1.6  **Cancellation.** Any party can cancel before `confirmed` state. After confirm, trade is committed and irreversible.

§1.7  **Timeout.** Any state held > 5 min auto-cancels. Sent as `trade.timeout` event.

§1.8  **Atomic swap.** The actual swap MUST be a single Postgres transaction:
```sql
BEGIN;
UPDATE pets SET owner_id = B WHERE id = X AND owner_id = A;
UPDATE pets SET owner_id = A WHERE id = Y AND owner_id = B;
-- assert both updated:
COMMIT;
```
If either UPDATE returns 0 rows (e.g. pet ownership changed during trade), ROLLBACK + emit `trade.swap.race_detected`.

§1.9  **Endpoint — propose.** `POST /v1/trades` body `{ partner_user_id: string, my_pet_id: string, their_pet_id: string }`.

§1.10  **Endpoint — lock.** `POST /v1/trades/:tradeId/lock`. Only the recipient (B) can lock.

§1.11  **Endpoint — confirm.** `POST /v1/trades/:tradeId/confirm`. Only the proposer (A) can confirm.

§1.12  **Endpoint — cancel.** `DELETE /v1/trades/:tradeId`.

§1.13  **Endpoint — list.** `GET /v1/trades` returns active + recent (7d) trades.

§1.14  **Rate limit.** Per player: 10 trades initiated per day, 30 per week. Beyond → 429.

§1.15  **Per-pair rate-limit.** Per friend-pair: 3 trades per 7 days (anti-laundering).

§1.16  **No real-money fees.** Per TASK-LEGAL-002 §1.1 — trade is free.

§1.17  **Audit.** Every trade state transition + the final swap writes to `trades` table + emits analytics. 7-year retention for kids-adjacent + 2-year standard.

§1.18  **Anti-cheat — impossible-state.** If a player attempts to trade a grandma pet OR a pet they don't own OR a pet currently in a different trade — TASK-INFRA-002 §1.9 impossible-transition path engaged.

§1.19  **TradeRoom Colyseus.** Each active trade has a dedicated Colyseus `TradeRoom` with `maxClients=2`. Real-time state updates (offer / lock / confirm) broadcast to both clients. Disconnect during trade pauses the timeout clock + on rejoin resumes.

§1.20  **Analytics.** `social.trade.proposed`, `social.trade.locked`, `social.trade.confirmed`, `social.trade.completed`, `social.trade.cancelled { trigger }`, `social.trade.timeout`, `social.trade.race_detected` per TASK-OBS-001.

---

## §2 — Why this design

**Why 4-phase state machine.** Plan §PART 10 #7 Adopt Me precedent — single-confirm trades led to bait-and-switch. The lock + confirm sequence forces both parties to see the final state before committing.

**Why both-sides-show.** Plan §PART 3 — every Adopt Me scam exploit involved last-second swap. Mandatory full-detail display closes this.

**Why adult-only.** Plan §PART 3 — adult-stage gating preserves tier identity (baby/teen pets haven't accrued value).

**Why no first-pet trade.** Anti-fraud — fresh accounts traded as throwaway assets.

**Why timeout 5 min.** Long enough to read details; short enough that an abandoned trade releases the involved pets back to the players.

**Why per-pair rate limit.** Anti-laundering — bot rings that trade among themselves to mint rare tiers.

**Why atomic transaction.** Plan §PART 4 anti-cheat — partial-state-failure must be impossible.

**Why no real-money fee.** Plan §PART 8 — fee-gated trade trades is loot-box-adjacent.

**Why standard-SKU only.** TASK-AUTH-003 + COPPA — kid trades require parental dashboard.

**Why Colyseus TradeRoom (not direct API).** Real-time both-sides-show requires sub-second broadcast. Polling would feel laggy.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/social/trade/trade.service.ts (excerpt)
async propose(u: AuthedUser, partnerId: string, myPetId: string, theirPetId: string) {
  await this.rateLimit.assert({ key: `trade:user:${u.id}`, perDay: 10, perWeek: 30 });
  await this.pairRateLimit.assert(u.id, partnerId);
  await this.assertEligibility(u, partnerId, myPetId, theirPetId);
  const tradeId = generateUlid();
  const { data: trade } = await this.supa.from('trades').insert({
    id: tradeId, proposer_id: u.id, recipient_id: partnerId,
    proposer_pet_id: myPetId, recipient_pet_id: theirPetId,
    state: 'offered',
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  }).select().single();
  await this.notify.sendTradeProposal(partnerId, trade);
  return trade;
}

async confirm(u: AuthedUser, tradeId: string) {
  const trade = await this.supa.from('trades').select('*').eq('id', tradeId).single();
  if (trade.data.proposer_id !== u.id) throw new HttpException('forbidden', 403);
  if (trade.data.state !== 'locked') throw new HttpException('trade.state.invalid', 422);
  return this.atomicSwap(trade.data);
}

private async atomicSwap(trade: TradeRow) {
  const { data, error } = await this.supa.rpc('execute_trade_swap', {
    _trade_id: trade.id, _proposer_id: trade.proposer_id, _recipient_id: trade.recipient_id,
    _proposer_pet_id: trade.proposer_pet_id, _recipient_pet_id: trade.recipient_pet_id,
  });
  if (error) { this.audit.emit('social.trade.race_detected', { trade_id: trade.id }); throw error; }
  await this.audit.emit('social.trade.completed', { trade_id: trade.id });
  return { trade_id: trade.id, state: 'completed' };
}
```

```sql
-- migration
create table public.trades (
  id text primary key check (id ~ '^[0-9A-HJKMNPQRSTVWXYZ]{26}$'),
  proposer_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  proposer_pet_id text not null references public.pets(id) on delete cascade,
  recipient_pet_id text not null references public.pets(id) on delete cascade,
  state text not null check (state in ('offered','locked','confirmed','completed','cancelled','timeout')),
  proposed_at timestamptz not null default now(),
  locked_at timestamptz,
  confirmed_at timestamptz,
  expires_at timestamptz not null,
  cancelled_by uuid,
  tenant_id text not null default 'mochi'
);
create index on public.trades (proposer_id, proposed_at desc);
create index on public.trades (recipient_id, proposed_at desc);
create index on public.trades (state) where state in ('offered','locked','confirmed');

create or replace function execute_trade_swap(_trade_id text, _proposer_id uuid, _recipient_id uuid, _proposer_pet_id text, _recipient_pet_id text)
  returns void security definer language plpgsql as $$
begin
  perform 1 from public.trades where id = _trade_id and state = 'locked' for update;
  update public.pets set owner_id = _recipient_id where id = _proposer_pet_id and owner_id = _proposer_id and status = 'active';
  if not found then raise exception 'trade.race'; end if;
  update public.pets set owner_id = _proposer_id where id = _recipient_pet_id and owner_id = _recipient_id and status = 'active';
  if not found then
    -- Roll back the first swap.
    update public.pets set owner_id = _proposer_id where id = _proposer_pet_id;
    raise exception 'trade.race';
  end if;
  update public.trades set state = 'completed', confirmed_at = now() where id = _trade_id;
end;
$$;
```

---

## §4 — Acceptance criteria

**AC1.** Full 4-phase flow (offer → lock → confirm → swap) works. Verified.
**AC2.** Both-sides-show identical content on lock + confirm. Verified by Colyseus state broadcast inspection.
**AC3.** Atomic swap rolls back on race condition. Verified by chaos test forcing ownership change mid-swap.
**AC4.** 5-min timeout on each phase. Verified.
**AC5.** Cross-SKU/tenant rejected. Verified.
**AC6.** Adult-only enforced. Verified.
**AC7.** First-pet trade rejected. Verified.
**AC8.** Per-user 10/day + per-pair 3/7d enforced. Verified.
**AC9.** Cancel before confirm works; after confirm impossible. Verified.
**AC10.** No real-money fees in path. Verified.
**AC11.** Disconnect pauses timeout. Verified.
**AC12.** Audit row + analytics events all emit. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/social/trade/__tests__/atomic-swap.spec.ts
describe('TASK-SOCIAL-003 — atomic swap', () => {
  it('rolls back if pet ownership changed during swap (chaos test)', async () => {
    await proposeAndLock('u1', 'u2', 'petA', 'petB');
    await db.pets.update({ owner_id: 'u3' }).where({ id: 'petA' });  // chaos: third party stole pet
    await expect(svc.confirm(user('u1'), 'trade1')).rejects.toThrow(/trade.race/);
    expect((await db.pets.byId('petB')).owner_id).toBe('u2');  // petB stayed with u2
  });

  it('completes successfully under normal conditions', async () => {
    await proposeAndLock('u1', 'u2', 'petA', 'petB');
    const r = await svc.confirm(user('u1'), 'trade1');
    expect(r.state).toBe('completed');
    expect((await db.pets.byId('petA')).owner_id).toBe('u2');
    expect((await db.pets.byId('petB')).owner_id).toBe('u1');
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/realtime/src/rooms/TradeRoom.ts
export class TradeRoom extends _BaseTenantRoom {
  maxClients = 2;
  override async onCreate(opts: { trade_id: string }) {
    this.setState(new TradeWindowState());
    this.onMessage('lock', (client) => this.handleLock(client));
    this.onMessage('confirm', (client) => this.handleConfirm(client));
    this.clock.setTimeout(() => this.timeout(), 5 * 60 * 1000);
  }
}
```

---

## §7 — Dependencies

**External:** Postgres atomic transaction; Colyseus.
**Internal:** TASK-PET-005 (slot check), TASK-PET-008 (status check), TASK-SOCIAL-001 (friend check), TASK-INFRA-002 (TradeRoom), TASK-INFRA-003 (Supabase).
**Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/trades
{ "partner_user_id": "01HU...", "my_pet_id": "petA", "their_pet_id": "petB" }
→ 201 { "trade_id": "01HTRADE...", "state": "offered", "expires_at": "..." }
```

```json
{ "event": "social.trade.completed", "trade_id": "01HTRADE...", "proposer_id": "u1", "recipient_id": "u2", "pets_swapped": { "to_proposer": "petB", "to_recipient": "petA" } }
```

```json
{ "error": "trade.race", "trade_id": "01HTRADE..." }
```

```json
{ "error": "trade.eligibility", "reason": "first_pet_protected" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 4-phase vs 2-phase? → §1.4 + §2 — 4-phase.
- **OQ-2 (resolved):** Cancel after confirm? → §1.6 — no.
- **OQ-3 (resolved):** Multi-pet trade? → §1.1 — 1-for-1 only.
- **OQ-4 (resolved):** Currency in trade? → §1.16 — no.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Race during atomic swap | `trade.race` exception | Rollback | Audit + UX retry |
| 2 | Disconnect during confirm | Colyseus tolerates | Timeout extended | Resume on rejoin |
| 3 | Per-pair rate-limit bypassed via account swap | Manual review | Limited recourse | DPO escalation |
| 4 | First-pet protection bypassed via cascade | Spec test | Fraud | Validation tightened |
| 5 | Cross-tenant trade attempted | RLS | Blocked | Audit |
| 6 | Timeout clock skew | Server time sync | Trades expire early/late | NTP-locked |
| 7 | Idempotent re-confirm | Idempotency | Same response | Cached |
| 8 | Both lock simultaneously (different rooms) | Per-trade Colyseus room | Each independent | OK |
| 9 | Trade with grandma pet | Eligibility check | 422 | Verified |
| 10 | Pet stolen mid-trade by trade.race | Detected | Rollback | Compensating |
| 11 | Audit retention | DPO | 7-yr kids/2-yr standard | Configured |
| 12 | Both-sides-show mismatched (UI bug) | Visual regression | Trust collapse | Snapshot test |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (trust-trade), plan §PART 10 #7 (Adopt Me scam precedent).

**Sub-decisions punted to ops:** Rate limits Mixpanel-tunable.

**Anti-patterns explicitly forbidden:**
- Real-money fees.
- Off-platform trades.
- Hidden modifiers in trade view.
- First-pet trade.

**Cross-reference:** TASK-PET-005 (slot check), TASK-PET-008 (status check), TASK-SOCIAL-001 (friend check).
