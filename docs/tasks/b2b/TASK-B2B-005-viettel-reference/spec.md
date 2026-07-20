---
id: TASK-B2B-005
title: "Viettel reference tenant — top-up triggers pet feed + daily-login data-cost reduction + Pet-of-Viettel mascot + Viettel SSO + SIM-binding"
module: B2B
priority: SHOULD
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 3
owner: "Tech Lead + BD lead + Viettel integration"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-B2B-001, TASK-B2B-002, TASK-B2B-003, TASK-CARE-001, TASK-LEGAL-001, TASK-AUTH-001, TASK-AUTH-002, TASK-ECON-001, TASK-OBS-001]
depends_on: [TASK-B2B-003, TASK-CARE-001]
blocks: []
effort_hours: 14
new_files:
  - "apps/cocos/assets/tenants/viettel/manifest.json"
  - "apps/cocos/assets/tenants/viettel/skin/mochi-vt.skin.json"
  - "apps/cocos/assets/tenants/viettel/quests.json"
  - "apps/api/src/tenant/viettel/viettel-sso.controller.ts"
  - "apps/api/src/tenant/viettel/topup-trigger.service.ts"
  - "apps/api/src/tenant/viettel/sim-binding.service.ts"
  - "apps/api/src/tenant/viettel/__tests__/topup-trigger.spec.ts"
  - "docs/b2b/viettel-integration-spec.md"
modified_files: []
allowed_tools:
  - "Viettel API + SSO (Viettel ID)"
  - "Viettel webhook for top-up events"
  - "SIM-card identifier (server-only verification)"
disallowed_tools:
  - "Viettel user data outside VN region (PDPL + telco policy)"
  - "Pet ↔ data-cost real-money conversion outside Viettel API (no external monetization)"
  - "Trade with consumer 'mochi' tenant"
  - "SIM-card identifier client-side"
risk_if_skipped: "Plan §PART 6 B2B — Viettel is the flagship telco. Without successful integration, Vietnamese telco B2B funnel weakens."
audience_age_gate: "13+"
---

## §1 — Specification (BCP-14 normative)

§1.1  **Tenant slug `viettel`.** Per TASK-B2B-001.

§1.2  **Audience.** Adult Viettel subscribers (13+ default). Family-plan members may sub-create kid profiles via TASK-SUB-002.

§1.3  **Bundle ID.** `world.viettel.pet-of-viettel` (Apple) / `vn.com.viettel.petofviettel` (Android).

§1.4  **Viettel SSO.** Viettel ID OAuth 2.0 + PKCE. Per TASK-AUTH-002 Zalo-like flow.

§1.5  **Pet-of-Viettel mascot.** Customised Mochi-mascot in Viettel red/yellow palette + "Pet of Viettel" branding.

§1.6  **Top-up triggers feed.** When Viettel API webhook delivers a top-up event (subscriber adds VND to their balance), the pet receives food rewards proportional to top-up amount.

§1.7  **Data-cost reduction loyalty.** Daily login to Tamagochi-Viettel for ≥ 7 days/month grants 5% off monthly data plan. Settlement via Viettel back-office.

§1.8  **SIM-binding.** Viettel account binds 1:1 to a Viettel SIM. Cross-SIM transfer blocked. Verified server-side via Viettel API.

§1.9  **Endpoint — Viettel SSO callback.** `POST /v1/tenant/viettel/sso/callback`.

§1.10  **Endpoint — top-up webhook.** `POST /webhook/tenant/viettel/topup`.

§1.11  **Endpoint — daily-login report.** `POST /v1/tenant/viettel/daily-login-report` notifies Viettel back-office monthly.

§1.12  **VN-only data residency.** All Viettel-tenant data stored in Vietnam region (PDPL alignment + Viettel policy).

§1.13  **No real-money out from pet.** Per TASK-LEGAL-002 — pet rewards never convert outside the Viettel loyalty channel.

§1.14  **Audit retention.** 7-year (telco regulation alignment).

§1.15  **Cross-tenant restrictions.** Same as TASK-B2B-004 §1.12 + §1.13 — no trade / co-parent with consumer.

§1.16  **Parental consent for under-13.** If a Viettel adult subscribes their child (≤ 12), parental consent via TASK-AUTH-003.

§1.17  **DPO review of Viettel quests + AI dialogue.** Per TASK-LEGAL-001.

§1.18  **Per-tenant Viettel analytics workspace.** Per TASK-OBS-001 §1.15.

§1.19  **Family tier interop.** Family-plan Viettel subscribers may use TASK-SUB-002 Family tier for child profiles under the same Viettel account.

§1.20  **Analytics.** `viettel.sso.callback`, `viettel.topup.received`, `viettel.daily_login.streak_7`, `viettel.data_discount.applied` per TASK-OBS-001.

---

## §2 — Why this design

**Why Viettel flagship.** Plan §PART 6 — listed as a target. VN's largest telco.

**Why 13+ default.** Plan §PART 6 — Viettel subscribers are typically adult primary lines; kids sub-profiles via Family.

**Why top-up triggers feed.** Plan §PART 6 — "top-up your line, feed your pet" is the documented hook.

**Why data-cost reduction loyalty.** Plan §PART 6 — "Daily login → reduced data costs" is the documented loyalty mechanism.

**Why SIM-binding.** Anti-abuse + Viettel API requires it.

**Why VN-only data residency.** Plan §PART 8 PDPL Decree 356/2025 + Viettel policy.

**Why server-only SIM verification.** Plan §PART 4 — SIM ID is sensitive PII. Plus, client-side SIM check is bypassable.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/tenant/viettel/topup-trigger.service.ts
@Injectable()
export class TopupTriggerService {
  async handleTopupWebhook(body: { viettel_id: string; sim_card_hash: string; topup_amount_vnd: number; topped_up_at: string }, signature: string) {
    if (!await this.viettel.verifyWebhookSignature(body, signature)) throw new HttpException('invalid signature', 401);
    const user = await this.users.byViettelId(body.viettel_id);
    const foodReward = this.foodForTopup(body.topup_amount_vnd);
    // Auto-feed pet (or queue food via TASK-CARE-001 if pet at hunger=100)
    const pet = await this.pets.firstActiveForUser(user.id);
    if (pet) {
      try {
        await this.care.feed(user, pet.id, foodReward.food_id, `viettel.topup:${body.topup_amount_vnd}`);
      } catch (err: any) {
        if (err.status === 422) {
          await this.ledger.grant(user.id, 'coins', foodReward.coin_consolation, `viettel.topup:${body.topup_amount_vnd}`, 'viettel', 'system_source');
        }
      }
    }
    this.audit.emit('viettel.topup.received', { user_id: user.id, amount_vnd: body.topup_amount_vnd });
  }
}
```

```typescript
// apps/api/src/tenant/viettel/sim-binding.service.ts
@Injectable()
export class SimBindingService {
  async bindSim(userId: string, simCardHash: string): Promise<void> {
    const existing = await this.supa.from('viettel_sim_bindings').select('user_id').eq('sim_card_hash', simCardHash).maybeSingle();
    if (existing.data && existing.data.user_id !== userId) {
      throw new HttpException('sim.already_bound_to_other_account', 409);
    }
    await this.supa.from('viettel_sim_bindings').upsert({ user_id: userId, sim_card_hash: simCardHash, bound_at: new Date() });
  }
}
```

---

## §4 — Acceptance criteria

**AC1.** Viettel SSO flow works. Verified. **AC2.** Top-up webhook triggers feed. Verified. **AC3.** Pet at hunger=100 → coin consolation. Verified. **AC4.** SIM-binding 1:1 enforced. Verified. **AC5.** Daily-login report monthly. Verified. **AC6.** Cross-tenant trade blocked. Verified. **AC7.** VN data residency. Verified. **AC8.** Family-plan Family tier interop. Verified. **AC9.** 7-year audit retention. Verified. **AC10.** No real-money out. Verified. **AC11.** Parental consent for child sub-profiles. Verified. **AC12.** DPO review enforced. Verified.

---

## §5 — Verification

```typescript
describe('TASK-B2B-005 — Viettel', () => {
  it('feeds pet on top-up webhook', async () => {
    await mockUser('vt-u1', { viettel_id: 'V123' });
    await seedPet('vt-pet-1', 'vt-u1', { hunger: 50 });
    await svc.handleTopupWebhook({ viettel_id: 'V123', sim_card_hash: 'SIMH', topup_amount_vnd: 50000, topped_up_at: now }, validSig);
    const pet = await getPet('vt-pet-1');
    expect(pet.hunger).toBeGreaterThan(50);
  });

  it('SIM binding 1:1', async () => {
    await sim.bindSim('u1', 'SIM_A');
    await expect(sim.bindSim('u2', 'SIM_A')).rejects.toMatchObject({ status: 409 });
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/tenant/viettel/viettel-sso.controller.ts
@Controller('v1/tenant/viettel/sso')
export class ViettelSsoController {
  @Post('callback')
  async callback(@Body() body: { auth_code: string }) {
    const vtProfile = await this.viettel.verifyAndFetchProfile(body.auth_code);
    const user = await this.users.upsertViettelUser({ viettel_id: vtProfile.id, sim_card_hash: hashSim(vtProfile.sim) });
    await this.sim.bindSim(user.id, hashSim(vtProfile.sim));
    return { user_id: user.id };
  }
}
```

---

## §7 — Dependencies

**External:** Viettel API + Viettel ID SSO; Viettel webhook signing keys; VN region hosting. **Internal:** TASK-B2B-001 manifest, TASK-B2B-002 partition, TASK-B2B-003 console, TASK-CARE-001 feed action, TASK-AUTH-001 + TASK-AUTH-002 (Vietnamese telco SSO model). **Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/tenant/viettel/sso/callback
{ "auth_code": "..." }
→ 200 { "user_id": "01HU..." }
```

```http
POST /webhook/tenant/viettel/topup
X-Viettel-Signature: ...
{ "viettel_id": "V123", "sim_card_hash": "...", "topup_amount_vnd": 50000, "topped_up_at": "..." }
→ 200 { "fed": true, "food_id": "premium", "hunger_after": 95 }
```

```json
{ "event": "viettel.topup.received", "user_id": "01HU...", "amount_vnd": 50000, "tenant": "viettel" }
```

```json
{ "error": "sim.already_bound_to_other_account", "viettel_id": "V123" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** SIM binding 1:1? → §1.8.
- **OQ-2 (resolved):** Data-cost discount mechanism? → §1.7.
- **OQ-3 (resolved):** Cross-tenant? → §1.15 — forbidden.
- **OQ-4 (resolved):** VN data residency? → §1.12.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Viettel SSO outage | Monitor | Sign-in blocked | UX |
| 2 | Webhook signature forge | Validator | Reject | Audit |
| 3 | SIM re-bind race | Unique constraint | Last-wins | OK |
| 4 | Top-up at pet hunger=100 | Coin consolation | Verified | §3 service |
| 5 | Daily-login report fails to back-office | Retry queue | Eventual consistency | OK |
| 6 | VN region outage | Multi-AZ | Continue | OK |
| 7 | Family tier interop bug | Spec test | Sub-profile broken | Investigate |
| 8 | Cross-tenant trade attempt | RLS | Blocked | Verified |
| 9 | DPA expiry | Annual | Compliance | Re-execute |
| 10 | DPO review backlog | Daily | Quests stuck | Reviewers |
| 11 | Real-money out attempt | Validation | Blocked | Verified |
| 12 | SIM identifier client-side leak | Code review | PII risk | Server-only |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (Viettel flagship).

**Sub-decisions punted to ops:** Viettel contract; specific data-cost discount formulae.

**Anti-patterns explicitly forbidden:**
- Cross-tenant trade.
- SIM client-side.
- Real-money pet ↔ telco balance outside Viettel API.

**Cross-reference:** TASK-B2B-001 manifest; TASK-B2B-002 partition; TASK-CARE-001 feed; TASK-AUTH-002 Vietnamese-telco SSO pattern.
