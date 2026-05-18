---
id: FR-SUB-001
title: "Pet+ subscription — $4.99/mo or $39.99/yr (VN ₫99K/mo or ₫799K/yr) + entitlement service + restore-purchase + grace period"
module: SUB
priority: MUST
status: shipped
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-ECON-001, FR-ECON-002, FR-AUTH-001, FR-PET-005, FR-PET-007, FR-AI-001, FR-CARE-005, FR-AR-001, FR-SUB-002, FR-INFRA-003, FR-OBS-001]
depends_on: [FR-ECON-002, FR-AUTH-001]
blocks: [FR-SUB-002]
effort_hours: 12
new_files:
  - "apps/api/src/sub/pet-plus.controller.ts"
  - "apps/api/src/sub/pet-plus.service.ts"
  - "apps/api/src/sub/entitlement.service.ts"
  - "apps/api/src/sub/grace-period.service.ts"
  - "apps/api/src/sub/__tests__/pet-plus.spec.ts"
  - "apps/api/src/sub/__tests__/entitlement.spec.ts"
  - "apps/cocos/assets/_root/sub/PetPlusUpsellUi.ts"
  - "apps/cocos/assets/_root/sub/RestorePurchaseUi.ts"
  - "infra/supabase/standard/migrations/20260517_025_subscriptions.sql"
modified_files:
  - "apps/api/src/pets/inventory/slot-entitlement.service.ts"
  - "apps/api/src/pets/breeding/breeding.service.ts"
  - "apps/api/src/ai/persona/cost-cap.service.ts"
  - "apps/api/src/care/streak/forgiveness-token.service.ts"
allowed_tools:
  - "Apple StoreKit 2 subscription products"
  - "Google Play Billing subscription products"
  - "Postgres for entitlement state"
disallowed_tools:
  - "Pet+ via VN local-payment direct at P3 (Apple/Google subscriptions only — VN MoR for one-off IAP yes but subscriptions stay in store)"
  - "Pet+ entitlement without verified receipt"
  - "Pet+ pricing >$4.99/mo without explicit FR amendment"
  - "Auto-renewal without RTDN webhook listening"
risk_if_skipped: "Plan §PART 6 — Pet+ subscription is the highest-margin revenue per user. Without it, ARPDAU target ($0.05) likely missed."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Pricing.**
- Monthly: $4.99 globally ($4.99 USD = ~₫119K but VN priced at **₫99K/mo** to match local elasticity).
- Annual: $39.99/yr (VN ₫799K/yr) — ~33% savings vs monthly.

§1.2  **Pet+ benefits.**
- 10 active pet slots (vs 3 free) — FR-PET-005.
- 50% breeding cooldown reduction — FR-PET-007.
- Premium AI persona quota raise (60 calls/pet/day vs 30 free) — FR-AI-001.
- +1 forgiveness token monthly — FR-CARE-005.
- Monthly 100 Hearts grant.
- Exclusive seasonal pet (rotates monthly).
- Cloud save priority (faster cross-device sync).
- Ad-free (no rewarded video required).

§1.3  **Pet+ subscription products.** Two StoreKit 2 + Play Billing products:
- `mochi.subscription.monthly` — $4.99/mo auto-renew.
- `mochi.subscription.annual` — $39.99/yr auto-renew.

§1.4  **Subscription state.** Per user, stored in `user_subscriptions` table: `(user_id pk, tier 'free'|'pet_plus', product_id, current_period_end, status, vendor, original_transaction_id, grace_period_until, tenant_id)`.

§1.5  **Entitlement service.** Replaces the stub at FR-PET-005 §3.3. Returns `tier` based on `user_subscriptions.status` + `current_period_end`. Cached for 60 seconds.

§1.6  **Grace period.** When a subscription fails to renew (Apple/Google billing retry), Pet+ entitlement MUST persist for **16 days** (Apple's recommended grace). During grace, surface "Update billing info" UX. After grace expires, downgrade to free tier.

§1.7  **Restore purchase.** Users on a new device MUST tap "Restore purchase" → triggers Apple StoreKit `Transaction.currentEntitlements` / Google `BillingClient.queryPurchasesAsync` → re-validates active subscription server-side. No double-charging.

§1.8  **Webhook integration.** Apple App Store Server Notifications V2 + Google Real-Time Developer Notifications (RTDN) MUST be wired. Each event type handled:
- `SUBSCRIBED` / `DID_RENEW` → ensure entitlement active.
- `DID_FAIL_TO_RENEW` → start grace.
- `EXPIRED` → downgrade.
- `REFUND` → revoke entitlement.

§1.9  **Annual proration on cancel.** Users who cancel annual mid-cycle KEEP Pet+ until period end (no early refund; Apple/Google handle their own refund policy).

§1.10  **Family Sharing.** Apple Family Sharing + Google Family Library entitlements honoured. Per FR-LEGAL-003 §1.9.

§1.11  **Trial — none at P3.** Plan §PART 6 — defer trial to P4+ after baseline conversion data.

§1.12  **VN pricing rationale.** Plan §PART 6 — local elasticity is steeper than 1:1 USD. ₫99K < ₫119K matches consumer expectations.

§1.13  **Monthly Hearts grant.** On each renewal, the user is granted 100 Hearts via FR-ECON-001 `iap_source` ledger entry. `ref = 'sub.monthly_grant:<period>'`.

§1.14  **Seasonal pet rotation.** Each month, Pet+ subscribers can claim a unique seasonal pet (e.g. "April Mochi", "May Pengu"). Per FR-PET-006 — special-tier outside the 5 launch species (added to catalogue per-season).

§1.15  **Kids SKU + Family tier.** Pet+ on the kids SKU is bridged through FR-SUB-002 Family tier — kids cannot independently subscribe. Per FR-LEGAL-003.

§1.16  **Entitlement RLS.** Subscription state RLS — only user can read own row + DPO for support.

§1.17  **Audit retention.** 7 years.

§1.18  **Webhook replay protection.** Apple/Google webhooks include event IDs; persist + dedupe to prevent re-grant on retried delivery.

§1.19  **Pricing change procedure.** Plan §PART 6 + Apple/Google rules — pricing changes require user opt-in for existing subscribers + 30-day notice. FR amendment required.

§1.20  **Analytics.** `sub.subscribed`, `sub.renewed`, `sub.grace_started`, `sub.expired`, `sub.refunded`, `sub.restored`, `sub.cancelled` per FR-OBS-001.

---

## §2 — Why this design

**Why $4.99/mo.** Plan §PART 6 — industry-standard f2p sub price. Duolingo Super, Calm, etc. land here. Above $4.99 conversion drops sharply.

**Why ₫99K VN.** Plan §PART 6 — local elasticity research. Vietnamese players accept ₫99K (≈$4.00) more readily than ₫119K (≈$4.99 direct conversion).

**Why annual at $39.99.** 33% discount vs 12 × $4.99 = $59.88. Standard sub-discount ratio.

**Why 16-day grace.** Apple's recommended billing retry window. Without grace, players see immediate-downgrade UX which feels punitive.

**Why no Stripe/Antom for subscriptions at P3.** Apple/Google require subscriptions be processed through their stores for in-app digital content. Antom for one-off IAP is allowed; subscription must stay in-store.

**Why no trial at P3.** Plan §PART 6 — establish baseline conversion first; trial adds churn risk.

**Why webhook replay protection.** Apple/Google retry webhooks aggressively; double-grant is a common bug.

**Why Family Sharing.** Apple Guideline 3.1.3(a) — Family Sharing must be honoured.

**Why no kids direct subscribe.** COPPA + FR-LEGAL-001 — parental consent required.

**Why monthly Hearts grant.** Plan §PART 6 — perceived value bump beyond unlocks; creates "I've got 100 Hearts this month" feel.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/sub/entitlement.service.ts
@Injectable()
export class EntitlementService {
  private cache = new Map<string, { tier: 'free' | 'pet_plus'; ts: number }>();

  async tier(userId: string): Promise<'free' | 'pet_plus'> {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.ts < 60_000) return cached.tier;
    const { data } = await this.supa.from('user_subscriptions').select('*').eq('user_id', userId).maybeSingle();
    let tier: 'free' | 'pet_plus' = 'free';
    if (data) {
      const inPeriod = new Date(data.current_period_end).getTime() > Date.now();
      const inGrace = data.grace_period_until && new Date(data.grace_period_until).getTime() > Date.now();
      if ((data.status === 'active' && inPeriod) || (data.status === 'in_grace' && inGrace)) tier = 'pet_plus';
    }
    this.cache.set(userId, { tier, ts: Date.now() });
    return tier;
  }
}
```

```typescript
// apps/api/src/sub/pet-plus.service.ts (excerpt)
async handleAppleWebhook(event: AppleServerNotification) {
  await this.webhookDedupe.assertNotSeen(event.notificationUUID);
  const userId = await this.resolveUserId(event.data.signedTransactionInfo);
  switch (event.notificationType) {
    case 'SUBSCRIBED':
    case 'DID_RENEW':
      await this.upsertSubscription(userId, event);
      if (event.notificationType === 'DID_RENEW') await this.ledger.grant(userId, 'hearts', 100, `sub.monthly_grant:${event.subscriptionGroupIdentifier}`, 'mochi', 'iap_source');
      break;
    case 'DID_FAIL_TO_RENEW':
      await this.startGrace(userId, event);
      break;
    case 'EXPIRED':
      await this.expire(userId);
      break;
    case 'REFUND':
      await this.refund(userId, event);
      break;
  }
  this.entitlement.invalidateCache(userId);
}
```

```sql
-- migration
create table public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free','pet_plus')),
  product_id text,
  vendor text check (vendor in ('apple','google')),
  original_transaction_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  status text not null default 'active' check (status in ('active','in_grace','expired','refunded','cancelled')),
  grace_period_until timestamptz,
  tenant_id text not null default 'mochi',
  updated_at timestamptz not null default now()
);
alter table public.user_subscriptions enable row level security;
create policy "sub self" on public.user_subscriptions for select using (user_id = auth.uid());

create table public.subscription_webhook_dedupe (
  event_id text primary key,
  vendor text not null,
  received_at timestamptz not null default now()
);
```

---

## §4 — Acceptance criteria

**AC1.** Apple subscribe → entitlement active. Verified.
**AC2.** Renewal → 100 Hearts granted via ledger. Verified.
**AC3.** Fail-to-renew → grace started for 16 days. Verified.
**AC4.** After grace → downgrade. Verified.
**AC5.** Restore purchase on new device re-validates. Verified.
**AC6.** Webhook replay no double-grant. Verified.
**AC7.** Pet+ tier unlocks 10 slots in FR-PET-005. Verified.
**AC8.** Pet+ tier reduces breeding cooldown 50%. Verified.
**AC9.** Pet+ tier raises AI quota to 60/pet/day. Verified.
**AC10.** Pet+ tier +1 forgiveness token. Verified.
**AC11.** Family Sharing honoured. Verified.
**AC12.** Kids cannot subscribe directly. Verified.

---

## §5 — Verification

```typescript
describe('FR-SUB-001 — Pet+', () => {
  it('grace period 16 days', async () => {
    await mockSubscribe('u1');
    await mockFailToRenew('u1');
    const tier1 = await entitlement.tier('u1');
    expect(tier1).toBe('pet_plus');  // still in grace
    await advanceClockDays(17);
    const tier2 = await entitlement.tier('u1');
    expect(tier2).toBe('free');
  });

  it('webhook replay no double-grant', async () => {
    const event = mockAppleRenewEvent('uuid-1');
    await svc.handleAppleWebhook(event);
    await svc.handleAppleWebhook(event);   // replay
    expect(await ledger.balance('u1', 'hearts')).toBe(100); // not 200
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/sub/grace-period.service.ts
@Injectable()
export class GracePeriodService {
  async startGrace(userId: string): Promise<void> {
    const until = new Date(Date.now() + 16 * 24 * 3600 * 1000).toISOString();
    await this.supa.from('user_subscriptions').update({ status: 'in_grace', grace_period_until: until }).eq('user_id', userId);
    await this.notify.sendBillingUpdateRequired(userId);
  }
}
```

---

## §7 — Dependencies

**External:** Apple StoreKit 2 + ASSN V2 webhooks; Google Play Billing 6 + RTDN webhooks.
**Internal:** FR-ECON-001 ledger, FR-ECON-002 IAP base, FR-PET-005/007, FR-AI-001 cost cap, FR-CARE-005 forgiveness token, FR-AUTH-001 (Family Sharing tie-in).
**Blocks:** FR-SUB-002 (Family tier extends this).

---

## §8 — Example payloads

```http
POST /v1/sub/restore
→ 200 { "tier": "pet_plus", "expires_at": "2026-09-12T14:36:01Z", "vendor": "apple" }
```

```json
{ "event": "sub.renewed", "user_id": "01HU...", "product_id": "mochi.subscription.monthly", "hearts_granted": 100, "next_renewal_at": "..." }
```

```json
{ "event": "sub.grace_started", "user_id": "01HU...", "grace_until": "2026-08-28T14:36:01Z" }
```

```json
{
  "user_id": "01HU...",
  "tier": "pet_plus",
  "product_id": "mochi.subscription.monthly",
  "current_period_end": "2026-09-12T14:36:01Z",
  "status": "active",
  "vendor": "apple"
}
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Trial at P3? → §1.11 — no.
- **OQ-2 (resolved):** VN local payment? → §`disallowed_tools` — Apple/Google only.
- **OQ-3 (resolved):** Grace period length? → §1.6 — 16 days (Apple).
- **OQ-4 (resolved):** Hearts grant on renewal? → §1.13 — 100/mo.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Webhook never received | Polling fallback | Grace prevents instant downgrade | Periodic state reconciliation |
| 2 | Webhook replay double-grant | Dedupe table | None | Verified |
| 3 | Restore-purchase fails on new device | Vendor SDK error | UX retry | Surface "contact support" |
| 4 | Grace period state machine race | Per-user mutex | None | Serialised updates |
| 5 | Family Sharing partial entitlement | Vendor handling | Honoured | Verified |
| 6 | Refund clawback consumed Hearts | DPO review | No clawback | Per §1.13 |
| 7 | Pricing change without opt-in | Apple/Google reject | Submission blocked | FR amendment |
| 8 | Cache stale | 60s TTL | Brief misstate | Invalidate on webhook |
| 9 | Cross-tenant subscription | RLS | Privacy | Enforced |
| 10 | Audit growth | Disk | 7-yr retention | OK |
| 11 | Trial accidentally enabled in store config | Apple Connect review | Catch | Manual sync |
| 12 | Annual mid-cycle cancel UX confusion | Player support | Education | UX clarifies "stays until X" |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (Pet+ benefits + pricing).

**Sub-decisions punted to ops:** Seasonal pet rotation per-month curated.

**Anti-patterns explicitly forbidden:**
- VN MoR subscriptions (must be in-store).
- Trial at P3.
- Pricing change without opt-in.

**Cross-reference:** FR-SUB-002 Family tier; FR-PET-005/007 entitlement-consuming.
