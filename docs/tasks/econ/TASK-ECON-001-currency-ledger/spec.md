---
id: TASK-ECON-001
title: "Currency ledger — soft Coins + premium Hearts + server-authoritative double-entry + anti-cheat ban"
module: ECON
priority: MUST
status: done
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-INFRA-002, TASK-INFRA-003, TASK-CARE-001, TASK-CARE-002, TASK-CARE-004, TASK-PET-006, TASK-PET-007, TASK-ECON-002, TASK-ECON-003, TASK-SUB-001, TASK-ADS-001, TASK-VIRAL-004, TASK-OBS-001, TASK-OBS-002, TASK-LEGAL-002, TASK-B2B-002]
depends_on: [TASK-INFRA-003]
blocks: [TASK-ECON-002, TASK-ECON-003, TASK-SUB-001, TASK-ADS-001, TASK-VIRAL-004]
effort_hours: 12
new_files:
  - "apps/api/src/econ/ledger/ledger.controller.ts"
  - "apps/api/src/econ/ledger/ledger.service.ts"
  - "apps/api/src/econ/ledger/balance.service.ts"
  - "apps/api/src/econ/ledger/reconciliation.service.ts"
  - "apps/api/src/econ/ledger/__tests__/ledger.spec.ts"
  - "apps/api/src/econ/ledger/__tests__/balance.spec.ts"
  - "apps/api/src/econ/ledger/__tests__/reconciliation.spec.ts"
  - "apps/cocos/assets/_root/econ/CoinHUD.ts"
  - "infra/supabase/standard/migrations/20260517_022_econ_ledger.sql"
modified_files:
  - "apps/api/src/care/feed.service.ts"
  - "apps/api/src/care/clean.service.ts"
  - "apps/api/src/care/mini-game/mini-game.service.ts"
  - "apps/api/src/pets/breeding/breeding.service.ts"
allowed_tools:
  - "Postgres SERIALIZABLE transactions for double-entry"
  - "Per-user mutex (advisory lock) for concurrent spend"
  - "Daily reconciliation Sentry alerts (TASK-OBS-002)"
disallowed_tools:
  - "Client-side balance computation (server-authoritative)"
  - "Negative balance (no overdraft)"
  - "Cross-tenant currency moves"
  - "Direct UPDATE on `balance` column without ledger row (consistency)"
  - "Real-money convertibility from Coins (TASK-LEGAL-002 anti-money-laundering posture)"
risk_if_skipped: "TASK-CARE-001..004 spend Coins via stub; TASK-PET-007 breeding cost stub; TASK-ECON-002 IAP needs ledger; TASK-ADS-001 rewarded video needs payout. Without ledger, the entire economy is invisible to anti-cheat (TASK-OBS-002) and the launch economy will inflate uncontrollably."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Two currencies.** Tamagochi has exactly TWO currencies at P3:
- **Coins** (soft) — earned via gameplay (mini-games, streaks, daily ritual, ad-rewarded video). Used for: food, soap, breeding, surprise eggs, cosmetic re-styling.
- **Hearts** (premium) — purchasable via real-money IAP only (TASK-ECON-002). Used for: premium species direct purchase, battle pass premium track unlock, cosmetic bundles. **Hearts MUST NOT randomly outcome anything** per TASK-LEGAL-002.

§1.2  **Double-entry ledger.** Every currency mutation MUST be a paired row in `currency_ledger` table: one debit + one credit, summing to 0 net per transaction. Account types: `user_wallet`, `system_source` (rewards), `system_sink` (consumed in-game), `iap_source` (Hearts purchased), `creator_revshare` (TASK-ECON-003 UGC).

§1.3  **Balance derivation.** A user's balance MUST be computed by SUM over the ledger filtered by `user_id` + `currency`. Never stored as a single column updated in place.

§1.4  **Performance — cached balance.** A `user_currency_balance` materialised summary table MAY cache the result per (user_id, currency) for read-perf. It MUST be invalidated on every ledger insert + recomputed asynchronously via trigger. Reads of the cache MUST tolerate up to 5 seconds of staleness — never authoritative.

§1.5  **Server-authoritative.** All ledger writes happen server-side. The Cocos client MUST NEVER write balance directly. Per TASK-INFRA-002 §1.10.

§1.6  **No overdraft.** Spend operations MUST check balance via the ledger SUM (NOT the cached summary) within the same SERIALIZABLE transaction:
```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT COALESCE(SUM(amount), 0) AS balance FROM currency_ledger WHERE user_id = $u AND currency = 'coins';
-- if balance >= cost:
INSERT INTO currency_ledger (user_id, currency, amount, account_type, ref) VALUES ($u, 'coins', -$cost, 'user_wallet', $ref);
INSERT INTO currency_ledger (user_id, currency, amount, account_type, ref) VALUES (NULL, 'coins', $cost, 'system_sink', $ref);
COMMIT;
```
If `balance < cost`, raise `insufficient_balance` and ROLLBACK.

§1.7  **Per-user mutex.** To prevent concurrent double-spend, every transaction MUST acquire a Postgres advisory lock on `(hash(user_id))` for the transaction's duration. Releases on COMMIT/ROLLBACK.

§1.8  **Endpoint — balance.** `GET /v1/wallet/balance` returns `{ coins: number, hearts: number, last_synced_at: ISO }`.

§1.9  **Endpoint — history.** `GET /v1/wallet/history?currency=coins&limit=50` returns recent ledger rows visible to the player (their own, not system rows). DSR-compliant.

§1.10  **Reference tagging.** Every ledger entry MUST have a `ref` field tying it to the originating action: `'care.feed:<feed_id>'`, `'mini-game:<session_id>'`, `'breeding:<event_id>'`, `'iap:<purchase_id>'`, `'streak.milestone:<streak_id>'`. Audit-traceable.

§1.11  **Anti-cheat ban.** Per TASK-INFRA-002 §1.9, any attempt to mutate balance via an invalid path (e.g. negative spend, cross-tenant move) → `security.impossible-transition` event + DPO review.

§1.12  **Daily reconciliation.** A scheduled function MUST run nightly and: (a) recompute the cached balance for every user; (b) compare ledger SUM against expected source-sink balance (system_source - system_sink = total user_wallet for soft currency); (c) alert on drift > 0.1%.

§1.13  **No Coins ↔ Hearts conversion.** Premium-to-soft conversion is forbidden — it would create a real-money-to-soft pathway (TASK-LEGAL-002 randomisation concerns).

§1.14  **Free-tier daily cap on Coin earn.** Per TASK-CARE-004 mini-game caps + TASK-CARE-005 streak — cumulative Coin earn capped at 500/day for free tier, 1500/day for Pet+ subscribers. Anti-grind.

§1.15  **Hearts entry path.** Hearts arrive ONLY from TASK-ECON-002 IAP. No earning path. No conversion.

§1.16  **Tenant scoping.** All ledger rows tagged `tenant_id`. Per TASK-INFRA-003 §1.4. Cross-tenant ledger reads + writes forbidden.

§1.17  **Audit retention.** 7 years for kids-adjacent + 2 years for standard. Per TASK-LEGAL-001.

§1.18  **DSR support.** On account deletion, ledger rows are tombstoned (not deleted) per TASK-LEGAL-001 §3.6. Player can request export via `GET /v1/wallet/history?export=csv`.

§1.19  **Real-money compliance.** Hearts IAP receipts MUST be validated server-side via TASK-ECON-002 receipt-validation. Untrusted client IAP claims are ALWAYS rejected.

§1.20  **Analytics.** `econ.ledger.entry { currency, amount, account_type, ref_type }`, `econ.balance.queried`, `econ.spend.rejected { reason }`, `econ.reconciliation.drift { drift_pct }` per TASK-OBS-001.

---

## §2 — Why this design

**Why two currencies.** Plan §PART 6 — soft + premium is the f2p standard. Pou / Talking Tom / Adopt Me all use it. Single currency conflates engagement reward with monetization.

**Why double-entry ledger.** Accounting standard. Sum-to-zero invariant catches bugs (single-entry can silently lose currency). Reconciliation works.

**Why balance is derived not stored.** Plan §PART 4 anti-cheat — derived state cannot be tampered. Cached summary is for performance; never authoritative.

**Why SERIALIZABLE + advisory lock.** Plan §PART 10 #7 Adopt Me scam precedent + general concurrency. Without it, two simultaneous spends can both pass the balance check before either commits.

**Why no Coins↔Hearts conversion.** Plan §PART 8 + TASK-LEGAL-002 — real-money ↔ soft pathways trigger gambling-regulation scrutiny in BE/NL.

**Why daily Coin cap.** Plan §PART 6 economy balance — uncapped grinding devalues the IAP path.

**Why ref tagging.** Plan §PART 4 — auditability is a regulator + ops requirement.

**Why no Hearts earn path.** Hearts = monetization. Earning Hearts would let players bypass payment. (Different from giving free Hearts on promotion — that's an IAP-source row.)

**Why daily reconciliation.** Plan §PART 10 — silent bugs compound. Nightly drift check catches them within 24h.

**Why ledger rows tombstoned on DSR.** GDPR Article 17 + TASK-LEGAL-001 §3.6 — accounting evidence retained; PII redacted.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/econ/ledger/ledger.service.ts
@Injectable()
export class LedgerService {
  constructor(private readonly supa: SupabaseClient, private readonly audit: AuditLogService) {}

  async spend(userId: string, currency: 'coins' | 'hearts', amount: number, ref: string, tenantId: string): Promise<{ balance_after: number }> {
    if (amount <= 0) throw new Error('econ.invalid_amount');
    return this.supa.rpc('econ_spend', {
      _user_id: userId, _currency: currency, _amount: amount, _ref: ref, _tenant_id: tenantId,
    });
  }

  async grant(userId: string, currency: 'coins' | 'hearts', amount: number, ref: string, tenantId: string, source: 'system_source' | 'iap_source'): Promise<{ balance_after: number }> {
    if (amount <= 0) throw new Error('econ.invalid_amount');
    if (currency === 'hearts' && source !== 'iap_source') throw new Error('econ.hearts_only_via_iap');
    return this.supa.rpc('econ_grant', {
      _user_id: userId, _currency: currency, _amount: amount, _ref: ref, _tenant_id: tenantId, _source: source,
    });
  }

  async balance(userId: string, currency: 'coins' | 'hearts'): Promise<number> {
    const { data } = await this.supa.rpc('econ_balance', { _user_id: userId, _currency: currency });
    return data ?? 0;
  }
}
```

```sql
-- migration
create table public.currency_ledger (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete restrict,
  currency text not null check (currency in ('coins','hearts')),
  amount bigint not null,
  account_type text not null check (account_type in ('user_wallet','system_source','system_sink','iap_source','creator_revshare')),
  ref text not null,
  tenant_id text not null default 'mochi',
  occurred_at timestamptz not null default now(),
  check (amount != 0)
);
create index on public.currency_ledger (user_id, currency, occurred_at desc);
create index on public.currency_ledger (ref);
alter table public.currency_ledger enable row level security;
create policy "ledger self" on public.currency_ledger for select using (user_id = auth.uid() or account_type in ('user_wallet') and user_id = auth.uid());

create table public.user_currency_balance (
  user_id uuid not null,
  currency text not null,
  balance bigint not null default 0,
  last_synced_at timestamptz not null default now(),
  primary key (user_id, currency)
);

create or replace function econ_spend(_user_id uuid, _currency text, _amount bigint, _ref text, _tenant_id text)
  returns json security definer language plpgsql as $$
declare
  current_balance bigint;
begin
  perform pg_advisory_xact_lock(hashtext(_user_id::text));
  select coalesce(sum(amount), 0) into current_balance from public.currency_ledger where user_id = _user_id and currency = _currency;
  if current_balance < _amount then raise exception 'econ.insufficient_balance'; end if;
  insert into public.currency_ledger (user_id, currency, amount, account_type, ref, tenant_id)
    values (_user_id, _currency, -_amount, 'user_wallet', _ref, _tenant_id);
  insert into public.currency_ledger (user_id, currency, amount, account_type, ref, tenant_id)
    values (null, _currency, _amount, 'system_sink', _ref, _tenant_id);
  insert into public.user_currency_balance as ucb (user_id, currency, balance, last_synced_at)
    values (_user_id, _currency, current_balance - _amount, now())
    on conflict (user_id, currency) do update set balance = ucb.balance - _amount, last_synced_at = now();
  return json_build_object('balance_after', current_balance - _amount);
end;
$$;
```

---

## §4 — Acceptance criteria

**AC1.** Spend reduces balance by exact amount + writes 2 ledger rows. Verified.
**AC2.** Concurrent spend (parallel calls) cannot overdraw. Verified by chaos test.
**AC3.** Insufficient balance raises `econ.insufficient_balance`. Verified.
**AC4.** Coins ↔ Hearts conversion blocked. Verified.
**AC5.** Hearts grant via non-IAP source rejected. Verified.
**AC6.** Cross-tenant ledger query returns 0 rows (RLS). Verified.
**AC7.** Daily Coin earn cap (500 free / 1500 Pet+) enforced. Verified.
**AC8.** Daily reconciliation detects 0.1% drift. Verified by chaos test injecting drift.
**AC9.** Negative amount rejected. Verified.
**AC10.** Cached balance staleness ≤ 5 sec. Verified by latency test.
**AC11.** History endpoint returns DSR-exportable CSV. Verified.
**AC12.** Audit retention 7-year kid / 2-year standard. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/econ/ledger/__tests__/ledger.spec.ts
describe('TASK-ECON-001 — ledger', () => {
  it('blocks overdraft', async () => {
    await ledger.grant('u1', 'coins', 100, 'test', 'mochi', 'system_source');
    await expect(ledger.spend('u1', 'coins', 150, 'test:spend', 'mochi')).rejects.toThrow(/insufficient_balance/);
    expect(await ledger.balance('u1', 'coins')).toBe(100);
  });

  it('handles concurrent spend correctly (no double-spend)', async () => {
    await ledger.grant('u1', 'coins', 100, 'test', 'mochi', 'system_source');
    const results = await Promise.allSettled([
      ledger.spend('u1', 'coins', 60, 'test:a', 'mochi'),
      ledger.spend('u1', 'coins', 60, 'test:b', 'mochi'),
    ]);
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    expect(succeeded).toBe(1);
    expect(await ledger.balance('u1', 'coins')).toBe(40);
  });

  it('blocks Hearts grant from non-IAP source', async () => {
    await expect(ledger.grant('u1', 'hearts', 100, 'test', 'mochi', 'system_source')).rejects.toThrow(/hearts_only_via_iap/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/econ/ledger/reconciliation.service.ts
@Injectable()
export class ReconciliationService {
  async runDaily() {
    const { data: drift } = await this.supa.rpc('econ_compute_drift');
    if (drift.drift_pct > 0.001) {
      this.audit.emit('econ.reconciliation.drift', drift);
      this.sentry.capture(new Error(`Ledger drift ${drift.drift_pct * 100}% — investigate`));
    }
    await this.supa.rpc('econ_rebuild_balance_cache');
  }
}
```

---

## §7 — Dependencies

**External:** Postgres SERIALIZABLE + advisory locks.
**Internal:** TASK-INFRA-003 (Supabase + tenant), TASK-INFRA-002 (anti-cheat path).
**Blocks:** TASK-ECON-002 IAP (grants Hearts), TASK-ECON-003 UGC rev-share, TASK-SUB-001 (Pet+ subscription perks), TASK-ADS-001 (rewarded video payout), TASK-VIRAL-004 (battle pass).

---

## §8 — Example payloads

```http
GET /v1/wallet/balance
→ 200 { "coins": 1420, "hearts": 12, "last_synced_at": "2026-08-12T14:36:01Z" }
```

```http
GET /v1/wallet/history?currency=coins&limit=5
→ 200 [
  { "id": 4242, "amount": -5, "ref": "care.feed:01HC...", "occurred_at": "2026-08-12T14:35:55Z" },
  { "id": 4241, "amount": +30, "ref": "mini-game:01HCMGS...", "occurred_at": "2026-08-12T14:30:01Z" }
]
```

```json
{ "error": "econ.insufficient_balance", "required": 25, "have": 12 }
```

```json
{ "event": "econ.reconciliation.drift", "drift_pct": 0.0023, "expected_total": 12345678, "actual_total": 12317284 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Single vs two currencies? → §1.1.
- **OQ-2 (resolved):** Single-entry vs double-entry? → §1.2.
- **OQ-3 (resolved):** Stored balance? → §1.3 — derived.
- **OQ-4 (resolved):** Hearts earnable? → §1.15 — no.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Concurrent spend race | Advisory lock prevents | None | OK |
| 2 | Daily reconciliation detects drift | Sentry alert | Drift logged | Investigate; possible compensating tx |
| 3 | SERIALIZABLE deadlock spike | DB metrics | Latency | Retry with backoff |
| 4 | Cached balance stale > 5s | Test fails | Stale display | Hard-refresh; not authoritative |
| 5 | Negative amount slips through | Constraint check | DB rejects | Verified |
| 6 | Cross-tenant via RLS misconfig | Spec test | Privacy | Tighten RLS |
| 7 | Hearts grant from non-IAP source | Code check | Rejected | Verified |
| 8 | Daily Coin cap evades via timezone shift | Audit | Possible exploit | Lock day boundary to user region |
| 9 | IAP receipt forgery → Hearts grant | TASK-ECON-002 validation | Rejected | Verified via Apple/Google |
| 10 | Ledger row deletion (DSR) leaves orphan ref | Tombstone retains row | OK | Designed |
| 11 | Cascade delete on user_id | Restrict prevents | OK | Tombstone instead |
| 12 | Audit growth | Disk | Retention enforced | 2/7 yr |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (Pet+ + currency), plan §PART 4 anti-cheat.

**Sub-decisions punted to ops:** Daily Coin cap Mixpanel-tunable.

**Anti-patterns explicitly forbidden:**
- Client balance write.
- Stored balance updated in place.
- Coins ↔ Hearts conversion.
- Real-money convertibility from Coins.

**Cross-reference:** TASK-ECON-002 IAP grants Hearts; TASK-CARE-001/002/004/005 + TASK-PET-007 spend via ledger; TASK-OBS-002 anti-cheat reads ledger.
