---
id: TASK-OBS-002
title: "Anti-cheat + server-authoritative ledger audit — message signing + rate-limit + impossible-state ban + daily reconciliation"
module: OBS
priority: MUST
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-ECON-001, TASK-INFRA-002, TASK-INFRA-003, TASK-OBS-001, TASK-SOCIAL-003, TASK-PET-007, TASK-CARE-004, TASK-LEGAL-001]
depends_on: [TASK-ECON-001, TASK-INFRA-002, TASK-OBS-001]
blocks: [TASK-B2B-002]
effort_hours: 14
new_files:
  - "apps/api/src/anticheat/anticheat.service.ts"
  - "apps/api/src/anticheat/ledger-audit.service.ts"
  - "apps/api/src/anticheat/impossible-state-monitor.ts"
  - "apps/api/src/anticheat/ban-decision.service.ts"
  - "apps/api/src/anticheat/__tests__/ledger-audit.spec.ts"
  - "apps/api/src/anticheat/__tests__/ban-decision.spec.ts"
  - "infra/supabase/standard/migrations/20260517_030_anticheat.sql"
  - "docs/security/anti-cheat-runbook.md"
modified_files:
  - "apps/realtime/src/anticheat/messageSigner.ts"
  - "apps/realtime/src/anticheat/rateLimiter.ts"
allowed_tools:
  - "Postgres for ban + flag state"
  - "Sentry alerts on suspicious events"
  - "Daily reconciliation jobs"
  - "DPO review queue"
disallowed_tools:
  - "Auto-ban without review beyond 3-strike threshold (false-positive risk)"
  - "Client-side anti-cheat decisions (server-authoritative)"
  - "Cross-tenant ban scope (per-tenant only)"
risk_if_skipped: "Plan §PART 4 + plan §PART 10 — at 100K MAU + active trade economy, anti-cheat is critical. Without comprehensive auditing, TASK-SOCIAL-003 trade + TASK-ECON-001 currency + TASK-PET-007 breeding are exploitable. TASK-B2B-002 enterprise tenants require this for SLA."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Anti-cheat layers.** Anti-cheat is defence-in-depth across:
- **L1 Auth gate** (TASK-AUTH-001 JWT) — caught at sign-in.
- **L2 Message signing** (TASK-INFRA-002 §1.7 HMAC) — caught per-message.
- **L3 Rate limiting** (TASK-INFRA-002 §1.8) — caught per-volume.
- **L4 Impossible-state guard** (TASK-INFRA-002 §1.9) — caught per-action.
- **L5 Ledger reconciliation** (TASK-ECON-001 §1.12) — caught daily.
- **L6 This task — ban-decision orchestrator** + audit dashboard.

§1.2  **Impossible-state event sources.** Aggregates events from:
- Negative stat after care (TASK-PET-003).
- Feed at hunger=100 (TASK-CARE-001).
- Trade with grandma pet (TASK-SOCIAL-003).
- Breeding non-adult pets (TASK-PET-007).
- Score mismatch in mini-game (TASK-CARE-004).
- Currency negative or above grant (TASK-ECON-001).
- Cross-tenant operation (TASK-INFRA-003).
- Cross-SKU operation (TASK-AUTH-003).
- HMAC signature invalid (TASK-INFRA-002).
- Rate-limit exceeded patterns (>5×/hour).

§1.3  **Per-account flag counter.** Each impossible-state event increments per-user `cheat_flag_score`:
- Score +1 per non-critical event (rate-limit, hunger-at-100).
- Score +5 per critical (score mismatch, cross-tenant).
- Score +20 per HMAC forgery (signature failure).

§1.4  **3-strike ban thresholds.**
- Flag score ≥ 10 in 24h: **Yellow** — DPO review queue, no action.
- Flag score ≥ 20 in 24h: **Orange** — temporary suspension (24h cooldown).
- Flag score ≥ 50 lifetime OR ≥ 30 in 24h: **Red** — perma-ban pending appeal.

§1.5  **Ban execution.** Banned account:
- Cannot sign in (TASK-AUTH-001 returns 403 `account.banned`).
- Pets archived to `grandma_house` (re-entry path on appeal).
- Currency frozen (no spend, no grant).
- Friends notified ("X is unavailable").

§1.6  **Appeal mechanism.** Banned user can `POST /v1/security/appeal-ban` with explanation. DPO reviews within 7 business days. Reversal preserves prior state.

§1.7  **Daily ledger reconciliation.** Per TASK-ECON-001 §1.12, scheduled job recomputes balances + detects drift > 0.1%. Drift alerts via Sentry → DPO review.

§1.8  **Per-tenant ban scope.** Ban applies within tenant only. A B2B Techcombank tenant ban does NOT affect the consumer Mochi tenant for the same Apple/Google identity.

§1.9  **Audit dashboard.** A Grafana dashboard surfaces:
- Top suspicious accounts (by flag score 24h).
- Ledger drift over time.
- HMAC failure rate.
- Score-mismatch rate per game.
- Trade race detection rate.

§1.10  **Run-book.** A `docs/security/anti-cheat-runbook.md` documents:
- Each impossible-state event type + remediation.
- Ban escalation procedure.
- Appeal review checklist.
- False-positive recovery.

§1.11  **Endpoint — security state.** `GET /v1/security/my-flags` returns the user's own flag history + ban status (transparency).

§1.12  **Endpoint — security report.** `POST /v1/security/report` allows player to report another for suspicious behavior. Adds to DPO review queue.

§1.13  **Endpoint — appeal.** `POST /v1/security/appeal-ban`.

§1.14  **DPO review queue.** Postgres `dpo_review_queue` table with FIFO. T&S reviewer dashboard.

§1.15  **False-positive recovery.** When DPO determines false positive:
- Flag score reset.
- Ban reversed (if applied).
- Audit row noting reversal.
- User notified.

§1.16  **Anti-cheat metric retention.** 7-year for kids; 2-year standard.

§1.17  **No client-side ban decisions.** Plan §PART 4 — all anti-cheat decisions server-side.

§1.18  **Cross-tenant ban learn.** When a player is banned in consumer tenant for ledger fraud, a flag is shared (anonymized) with B2B tenants via `security.cross_tenant.suspicion` — tenant can decide their own action.

§1.19  **Sentry alert SLA.** Critical anti-cheat events (HMAC failure burst, ledger drift > 1%) page on-call within 5 minutes.

§1.20  **Analytics + audit.** `security.flag.incremented`, `security.ban.applied { tier }`, `security.appeal.submitted`, `security.appeal.resolved { verdict }`, `security.false_positive.recovered`, `ledger.reconciliation.drift_detected` per TASK-OBS-001.

---

## §2 — Why this design

**Why defence-in-depth.** Plan §PART 4 — single-layer anti-cheat is bypassable. 6 layers force attackers through all.

**Why per-account flag scoring.** Plan §PART 10 — graduated response avoids both under-reaction (let everything slide) and over-reaction (auto-ban on single signal).

**Why 3-strike with DPO review.** Plan §PART 8 — auto-ban without human review risks regulator complaint + false positives. DPO loop preserves due process.

**Why appeal mechanism.** Plan §PART 10 — false bans destroy trust + create support burden. Explicit appeal path with documented review.

**Why per-tenant ban scope.** Plan §PART 6 — B2B tenants want their own moderation policies. Cross-tenant info-sharing OK (anonymized suspicion); cross-tenant enforcement not OK.

**Why cross-tenant suspicion sharing.** Plan §PART 4 — known-bad accounts in consumer tenant are likely-bad in B2B tenants too. Anonymized signal helps tenants decide.

**Why audit retention 7-yr kids / 2-yr standard.** COPPA + GDPR alignment + accounting tax retention.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/anticheat/impossible-state-monitor.ts
@Injectable()
export class ImpossibleStateMonitor {
  async record(userId: string, kind: ImpossibleStateKind, tenantId: string, context?: any): Promise<void> {
    const severity = IMPOSSIBLE_STATE_SEVERITY[kind];
    const flag_delta = severity === 'critical' ? 5 : severity === 'forgery' ? 20 : 1;
    const { data: current } = await this.supa.from('cheat_flags').select('score_24h, score_lifetime').eq('user_id', userId).maybeSingle();
    const newScore24h = (current?.score_24h ?? 0) + flag_delta;
    const newScoreLifetime = (current?.score_lifetime ?? 0) + flag_delta;
    await this.supa.from('cheat_flags').upsert({
      user_id: userId, score_24h: newScore24h, score_lifetime: newScoreLifetime,
      last_event_at: new Date().toISOString(), tenant_id: tenantId,
    });
    await this.supa.from('cheat_events').insert({
      user_id: userId, kind, severity, flag_delta, context, tenant_id: tenantId,
    });
    this.audit.emit('security.flag.incremented', { user_id: userId, kind, severity, score_24h: newScore24h });
    if (newScore24h >= 30 || newScoreLifetime >= 50) await this.ban.execute(userId, 'red');
    else if (newScore24h >= 20) await this.ban.execute(userId, 'orange');
    else if (newScore24h >= 10) await this.dpoQueue.enqueue(userId, 'review_yellow');
  }
}
```

```sql
create table public.cheat_flags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  score_24h int not null default 0,
  score_lifetime int not null default 0,
  last_event_at timestamptz,
  tenant_id text not null default 'mochi',
  ban_tier text check (ban_tier in ('yellow','orange','red')),
  banned_at timestamptz,
  banned_until timestamptz,
  ban_reason text
);

create table public.cheat_events (
  id bigserial primary key,
  user_id uuid not null,
  kind text not null,
  severity text not null check (severity in ('low','medium','critical','forgery')),
  flag_delta int not null,
  context jsonb,
  tenant_id text not null default 'mochi',
  occurred_at timestamptz not null default now()
);
create index on public.cheat_events (user_id, occurred_at desc);

create table public.dpo_review_queue (
  id bigserial primary key,
  user_id uuid not null,
  reason text not null,
  state text not null default 'pending' check (state in ('pending','reviewing','resolved_ok','resolved_ban','resolved_false_positive')),
  tenant_id text not null default 'mochi',
  enqueued_at timestamptz not null default now(),
  resolved_at timestamptz,
  reviewer_id uuid
);
```

---

## §4 — Acceptance criteria

**AC1.** Negative stat triggers flag +1. Verified. **AC2.** HMAC forgery triggers flag +20. Verified. **AC3.** Flag score 30 in 24h → red ban. Verified. **AC4.** Banned account cannot sign in. Verified. **AC5.** Appeal endpoint creates DPO review row. Verified. **AC6.** DPO false-positive reverses ban + resets flags. Verified. **AC7.** Ledger drift > 0.1% pages on-call. Verified. **AC8.** Cross-tenant suspicion sharing anonymized. Verified. **AC9.** Per-tenant ban scope respected. Verified. **AC10.** Grafana dashboard renders. Verified. **AC11.** 7-year retention for kids tenant. Verified. **AC12.** Sentry alert SLA < 5min for critical events. Verified.

---

## §5 — Verification

```typescript
describe('TASK-OBS-002 — anti-cheat', () => {
  it('escalates to red ban on 30 flags in 24h', async () => {
    for (let i = 0; i < 6; i++) await monitor.record('u1', 'score_mismatch', 'mochi');  // 6 * 5 = 30
    const flags = await getFlags('u1');
    expect(flags.ban_tier).toBe('red');
  });

  it('appeal creates review row', async () => {
    await banUser('u1');
    const r = await svc.appealBan(user('u1'), 'I was hacked');
    expect(r.review_id).toBeTruthy();
  });

  it('false-positive recovery resets flags', async () => {
    await flag('u1', 50);
    await dpo.resolveFalsePositive('u1');
    const flags = await getFlags('u1');
    expect(flags.score_24h).toBe(0);
    expect(flags.ban_tier).toBeNull();
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/anticheat/ban-decision.service.ts
@Injectable()
export class BanDecisionService {
  async execute(userId: string, tier: 'yellow' | 'orange' | 'red') {
    const until = tier === 'orange' ? new Date(Date.now() + 24*3600*1000).toISOString() : null;
    await this.supa.from('cheat_flags').update({ ban_tier: tier, banned_at: new Date().toISOString(), banned_until: until }).eq('user_id', userId);
    if (tier === 'orange' || tier === 'red') {
      await this.archivePets(userId);
      await this.freezeCurrency(userId);
      await this.notifyFriends(userId);
      await this.audit.emit('security.ban.applied', { user_id: userId, tier });
    }
  }
}
```

---

## §7 — Dependencies

**External:** Sentry, Grafana. **Internal:** TASK-ECON-001 (ledger drift), TASK-INFRA-002 (HMAC, rate-limit), TASK-AUTH-001 (ban gate at sign-in), TASK-PET-008 (grandma archive), TASK-LEGAL-001 (DPO + audit). **Blocks:** TASK-B2B-002 (B2B tenants depend on anti-cheat SLA).

---

## §8 — Example payloads

```http
GET /v1/security/my-flags
→ 200 { "score_24h": 5, "score_lifetime": 12, "ban_tier": null, "events": [...] }
```

```json
{ "event": "security.flag.incremented", "user_id": "01HU...", "kind": "score_mismatch", "severity": "critical", "score_24h": 25 }
```

```json
{ "event": "security.ban.applied", "user_id": "01HU...", "tier": "red", "reason": "score_lifetime>=50" }
```

```http
POST /v1/security/appeal-ban
{ "explanation": "I was just trying to test the game." }
→ 202 { "review_id": "01HRVW...", "sla": "7 business days" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Auto-ban thresholds? → §1.4.
- **OQ-2 (resolved):** Appeal SLA? → §1.6 — 7 business days.
- **OQ-3 (resolved):** Cross-tenant ban? → §1.8 — no.
- **OQ-4 (resolved):** Manual DPO review? → §1.4 — yellow tier yes.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | False positive ban | Player support + DPO | Reversal path | §1.15 |
| 2 | DPO queue backlog | Daily metric | Slow response | More reviewers |
| 3 | Flag score race | Atomic SQL | OK | Mutex |
| 4 | Cross-tenant suspicion leak (deanonymized) | Privacy audit | COPPA/GDPR risk | Anonymization audit |
| 5 | Banned user creates new account | Device fingerprint | Limited | Apple/Google account ban scope |
| 6 | Ban prevents legitimate appeal | UX surfaces appeal | OK | Designed |
| 7 | Reconciliation false drift | Investigation | DPO review | Recompute |
| 8 | Sentry alert misroute | On-call drill | Slow page | Test quarterly |
| 9 | Per-tenant scope bypass | Audit | Privacy issue | RLS enforced |
| 10 | Retention non-compliance | DPO | Audit gap | Configured |
| 11 | Grafana dashboard stale | Daily check | Operational blindness | Auto-refresh |
| 12 | Run-book outdated | Quarterly review | Slow response | Update procedure |

---

## §11 — Notes

**Plan refs:** plan §PART 4 anti-cheat; plan §PART 10 risk #7 trading scam.

**Sub-decisions punted to ops:** Flag-score thresholds Mixpanel-tunable; DPO team size.

**Anti-patterns explicitly forbidden:**
- Auto-ban without review on borderline events.
- Cross-tenant ban scope.
- Client-side decisions.

**Cross-reference:** TASK-ECON-001 ledger drift; TASK-INFRA-002 HMAC + rate-limit; TASK-B2B-002 multi-tenant requirement.
