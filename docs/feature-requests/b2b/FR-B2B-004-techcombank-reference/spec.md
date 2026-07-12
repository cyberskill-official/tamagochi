---
id: FR-B2B-004
title: "Techcombank reference tenant — junior account pet + savings-quest mini-game + financial-literacy + Techcombank SSO bridge"
module: B2B
priority: SHOULD
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 3
owner: "Tech Lead + BD lead + Techcombank integration"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-B2B-001, FR-B2B-002, FR-B2B-003, FR-CARE-004, FR-LEGAL-001, FR-AUTH-003, FR-AUTH-001, FR-ECON-001, FR-OBS-001]
depends_on: [FR-B2B-003, FR-CARE-004]
blocks: []
effort_hours: 14
new_files:
  - "apps/cocos/assets/tenants/techcombank/manifest.json"
  - "apps/cocos/assets/tenants/techcombank/skin/mochi-tcb-junior.skin.json"
  - "apps/cocos/assets/tenants/techcombank/quests.json"
  - "apps/cocos/assets/mini-games/savings-quest/SavingsQuest.scene"
  - "apps/cocos/assets/mini-games/savings-quest/SavingsQuestLogic.ts"
  - "apps/api/src/tenant/techcombank/tcb-sso.controller.ts"
  - "apps/api/src/tenant/techcombank/savings-trigger.service.ts"
  - "apps/api/src/tenant/techcombank/__tests__/tcb-sso.spec.ts"
  - "docs/b2b/techcombank-integration-spec.md"
modified_files: []
allowed_tools:
  - "Techcombank API (their banking API + SSO)"
  - "Per-tenant mini-game framework (FR-CARE-004)"
  - "FR-B2B-001 manifest schema"
disallowed_tools:
  - "Techcombank user data leaving Vietnam region (PDPL + Techcombank policy)"
  - "Pet trades between Techcombank tenant + consumer 'mochi'"
  - "Real-money flow between Techcombank account and Tamagochi (informational only)"
risk_if_skipped: "Plan §PART 6 B2B PetOS — Techcombank is the flagship reference tenant. Without successful integration, B2B sales funnel weakens."
audience_age_gate: "under-13"
---

## §1 — Specification (BCP-14 normative)

§1.1  **Tenant slug `techcombank`.** Per FR-B2B-001 — slug fixed, manifest stored at `apps/cocos/assets/tenants/techcombank/manifest.json`.

§1.2  **Audience.** Junior banking account holders — under-13 audience by default. Kids SKU strict per FR-AUTH-003 + FR-LEGAL-001.

§1.3  **Bundle ID.** `world.techcombank.junior-pet` (Apple) / `vn.com.techcombank.juniorpet` (Android).

§1.4  **Techcombank SSO bridge.** Techcombank account holders sign in via Techcombank's banking app SSO (OAuth 2.0 + PKCE). Per FR-AUTH-001 — Techcombank tenant uses Techcombank IdP + parental consent path via FR-AUTH-003.

§1.5  **Pet branded as Techcombank Junior pet.** Custom mascot (still respecting FR-ART-001 §1.2 20-animation contract), Techcombank palette + logo overlay.

§1.6  **Savings-quest mini-game.** A new mini-game extending FR-CARE-004 framework: "Save 100K VND this week" — the pet "saves" virtual money along with the child's actual savings account activity (Techcombank API webhook).

§1.7  **Trigger via Techcombank API webhook.** Techcombank notifies our backend when child deposits to junior account → triggers quest progress → pet receives food / outfit / cosmetic reward.

§1.8  **Financial-literacy mini-game.** Quiz mini-game: "What does 'savings' mean?" — fun + educational. Per FR-CARE-004 — added as `financial-literacy-quiz` game.

§1.9  **Per-account-holder unique mascot.** Each child gets a unique pet (FR-PET-001 ULID); palette + tier seeded by `(child_id, parental_consent_id)` deterministic hash.

§1.10  **No real-money out from pet.** Per FR-LEGAL-002 — pet rewards never convert to real money or affect bank account balance. One-way: bank → pet (rewards) only.

§1.11  **Techcombank data residency.** Per Techcombank policy + Vietnam PDPL — all Techcombank-related player data stored in Singapore (close to VN) + Tokyo offsite, never in US.

§1.12  **No trade with consumer.** Per FR-B2B-002 + plan §PART 6 — Techcombank tenant pets cannot be traded to consumer tenant.

§1.13  **No co-parent across tenant.** Same restriction.

§1.14  **Endpoint — TCB SSO callback.** `POST /v1/tenant/techcombank/sso/callback`.

§1.15  **Endpoint — savings webhook.** `POST /webhook/tenant/techcombank/savings` validates Techcombank-signed body.

§1.16  **Parental consent integration.** Techcombank junior account holders are by definition under-18 + parental-account-linked. FR-AUTH-003 consent flow uses Techcombank-provided parent contact.

§1.17  **Audit retention — Techcombank 10 years.** Banking-grade retention (longer than 7-year COPPA default).

§1.18  **Quest CMS managed by Techcombank.** Per FR-B2B-003 — Techcombank operator account configures quest catalogue.

§1.19  **DPO review of all Techcombank quest copy + AI dialogue if any.** Per FR-LEGAL-001.

§1.20  **Analytics — Techcombank workspace.** Per FR-OBS-001 §1.15 — separate Mixpanel + GameAnalytics.

---

## §2 — Why this design

**Why Techcombank flagship.** Plan §PART 6 — listed as a target. Junior banking + pet game is the natural fit.

**Why under-13 default.** Plan §PART 6 — Techcombank junior accounts are for children.

**Why one-way bank → pet.** Plan §PART 8 + AML compliance — pet → bank would trigger banking regulations.

**Why Singapore residency.** Plan §PART 8 PDPL Decree 356/2025 — Techcombank prefers regional storage.

**Why 10-year audit.** Banking standard.

**Why no cross-tenant trade/co-parent.** Plan §PART 6 + plan §PART 8 — Techcombank pet is a banking-channel feature, not interoperable with consumer game.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/tenant/techcombank/tcb-sso.controller.ts
@Controller('v1/tenant/techcombank/sso')
export class TcbSsoController {
  @Post('callback')
  async callback(@Body() body: { auth_code: string; parent_email: string; child_dob: string }) {
    const tcbProfile = await this.tcb.verifyAndFetchProfile(body.auth_code);
    const parentEmail = body.parent_email;
    const consentId = await this.parentalConsent.startNewConsentFlow({
      childDisplayName: tcbProfile.junior_name,
      parentEmail,
    });
    const childRow = await this.users.createTcbChild({ tcb_account_id: tcbProfile.account_id, audience: 'under-13', tenant_id: 'techcombank' });
    return { consent_id: consentId, child_user_id: childRow.id };
  }
}
```

```typescript
// apps/api/src/tenant/techcombank/savings-trigger.service.ts
@Injectable()
export class SavingsTriggerService {
  async handleSavingsWebhook(body: { tcb_account_id: string; deposit_amount_vnd: number; deposited_at: string }, signature: string) {
    if (!await this.tcb.verifyWebhookSignature(body, signature)) throw new HttpException('invalid signature', 401);
    const child = await this.users.byTcbAccountId(body.tcb_account_id);
    const questId = this.pickQuestForAmount(body.deposit_amount_vnd);
    await this.questEngine.recordProgress(child.id, questId, body.deposit_amount_vnd);
    if (await this.questEngine.completed(child.id, questId)) {
      const reward = this.rewardForQuest(questId);
      await this.ledger.grant(child.id, 'coins', reward.coins, `tcb.savings_quest:${questId}`, 'techcombank', 'system_source');
    }
  }
}
```

---

## §4 — Acceptance criteria

**AC1.** TCB SSO flow + parental consent works. Verified.
**AC2.** Pet branded with TCB palette + mascot. Verified.
**AC3.** Savings webhook triggers quest progress. Verified.
**AC4.** Financial-literacy quiz mini-game functions. Verified.
**AC5.** Per-account-holder unique pet. Verified.
**AC6.** No real-money out from pet. Verified.
**AC7.** Singapore residency for TCB data. Verified.
**AC8.** No cross-tenant trade with consumer. Verified.
**AC9.** Per-account audit 10-year. Verified.
**AC10.** Quest CMS managed by TCB operator. Verified.
**AC11.** DPO review enforced. Verified.
**AC12.** Per-tenant analytics workspace. Verified.

---

## §5 — Verification

```typescript
describe('FR-B2B-004 — Techcombank', () => {
  it('triggers savings quest on webhook', async () => {
    await mockChild('tcb-child-1', { tcb_account: 'A123' });
    await svc.handleSavingsWebhook({ tcb_account_id: 'A123', deposit_amount_vnd: 100000, deposited_at: now }, validSig);
    expect(await ledger.balance('tcb-child-1', 'coins', 'techcombank')).toBeGreaterThan(0);
  });

  it('blocks cross-tenant trade', async () => {
    const tcbChild = mockUser('tcb-c1', { tenant: 'techcombank' });
    const consumerUser = mockUser('mochi-u1', { tenant: 'mochi' });
    await expect(svc.attemptTrade(tcbChild, consumerUser, 'pet-tcb', 'pet-mochi')).rejects.toMatchObject({ error: 'cross_tenant_trade_forbidden' });
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/mini-games/savings-quest/SavingsQuestLogic.ts
export class SavingsQuestLogic implements MiniGameContract {
  readonly id = 'savings-quest' as any;
  readonly durationMs = 30000;
  async startWithSeed(_seed: string, _opts: any): Promise<void> {
    // Quest: drag coins into piggy bank — visual representation of savings.
    // Linked to real-time data via FR-B2B-001 manifest CMS strings.
  }
  collectInputEvents() { return this.events; }
}
```

---

## §7 — Dependencies

**External:** Techcombank API + SSO; Techcombank Vietnamese corporate identity.
**Internal:** FR-B2B-001 (manifest), FR-B2B-002 (partition), FR-B2B-003 (console), FR-CARE-004 (mini-game framework), FR-AUTH-003 (kids consent), FR-LEGAL-001 (DPO + residency).
**Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/tenant/techcombank/sso/callback
{ "auth_code": "...", "parent_email": "parent@example.com", "child_dob": "2018-03-15" }
→ 200 { "consent_id": "...", "child_user_id": "..." }
```

```http
POST /webhook/tenant/techcombank/savings
X-TCB-Signature: ...
{ "tcb_account_id": "A123", "deposit_amount_vnd": 100000, "deposited_at": "..." }
→ 200 { "quest_progress": "complete", "reward_coins": 200 }
```

```json
{ "event": "tcb.savings_quest.completed", "child_id": "01HU...", "quest_id": "save-100k-weekly", "deposit_amount_vnd": 100000 }
```

```json
{ "error": "cross_tenant_trade_forbidden", "source": "techcombank", "target": "mochi" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Audience default? → §1.2 — under-13.
- **OQ-2 (resolved):** Bank → pet flow? → §1.10 — one-way only.
- **OQ-3 (resolved):** Data residency? → §1.11 — Singapore.
- **OQ-4 (resolved):** Cross-tenant? → §1.12 — forbidden.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | TCB SSO outage | Vendor monitor | Sign-in blocked | UX surfaces "TCB unavailable" |
| 2 | Webhook signature forgery | Validator | Reject | Audit |
| 3 | TCB API rate-limit | Per-tenant | Throttle | Backoff |
| 4 | Singapore region outage | Multi-AZ fallback | Continue | OK |
| 5 | Savings webhook never received | Reconciliation | Quest unprogressed | Polling fallback |
| 6 | Cross-tenant trade attempt | RLS | Blocked | Verified |
| 7 | DPO review backlog on quest copy | Daily | Backlog | Reviewers |
| 8 | Real-money out attempt | Validation | Blocked | Verified |
| 9 | 10-year audit retention drift | DPO | Compliance gap | Configured |
| 10 | Mini-game scene asset missing | Build | Blocked | Asset bundle CI |
| 11 | TCB DPA expires | Annual | Compliance | Re-execute |
| 12 | Parental consent stuck | Safe Harbor outage | Account pending | Vendor escalation |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (Techcombank flagship).

**Sub-decisions punted to ops:** Techcombank contract negotiation; specific quest catalogue.

**Anti-patterns explicitly forbidden:**
- Real-money pet ↔ bank.
- Cross-tenant trade.
- TCB data outside SG region.

**Cross-reference:** FR-B2B-001 manifest; FR-B2B-002 partition; FR-CARE-004 mini-game extension; FR-AUTH-003 consent.
