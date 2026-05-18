---
id: FR-ECON-002
title: "IAP catalogue — outfits + room decor + premium species (direct purchase only) + VN MoMo/ZaloPay/VNPay/ViettelPay via Antom"
module: ECON
priority: MUST
status: shipped
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 1
owner: "Tech Lead + UA"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-ECON-001, FR-ECON-003, FR-LEGAL-002, FR-LEGAL-003, FR-PET-006, FR-SUB-001, FR-AUTH-001, FR-AUTH-003, FR-INFRA-003, FR-I18N-002, FR-OBS-001]
depends_on: [FR-ECON-001, FR-LEGAL-002]
blocks: [FR-ECON-003, FR-SUB-001, FR-VIRAL-004]
effort_hours: 14
new_files:
  - "apps/api/src/econ/iap/iap.controller.ts"
  - "apps/api/src/econ/iap/iap.service.ts"
  - "apps/api/src/econ/iap/apple-receipt-validator.ts"
  - "apps/api/src/econ/iap/google-receipt-validator.ts"
  - "apps/api/src/econ/iap/antom-vn-validator.ts"
  - "apps/api/src/econ/iap/iap-catalogue.ts"
  - "apps/api/src/econ/iap/__tests__/iap.spec.ts"
  - "apps/api/src/econ/iap/__tests__/receipt-validation.spec.ts"
  - "apps/cocos/native/ios/StoreKitBridge.swift"
  - "apps/cocos/native/android/PlayBillingBridge.kt"
  - "apps/cocos/assets/_root/econ/IapStoreUi.ts"
  - "infra/supabase/standard/migrations/20260517_023_iap_purchases.sql"
modified_files: []
allowed_tools:
  - "Apple StoreKit 2"
  - "Google Play Billing Library 6+"
  - "Antom (Ant Group) Merchant-of-Record for VN payments"
  - "Stripe + Paddle for web B2B (FR-B2B-003 path)"
disallowed_tools:
  - "Random-outcome IAP (no loot boxes per FR-LEGAL-002 §1.1)"
  - "Bundle IAP with randomised pet pulls"
  - "IAP gating during onboarding (Apple Guideline 3.1.3(b) per FR-PET-004 §1.7)"
  - "Surprise eggs sold for real money"
  - "Client-validated receipts (server-side validation only)"
risk_if_skipped: "Plan §PART 6 + plan §PART 7 VN soft launch — without IAP catalogue with VN-payment rails, the consumer game cannot monetize. FR-SUB-001 + FR-VIRAL-004 + FR-ECON-003 all depend on this."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **IAP catalogue — direct purchase only.** Every IAP product MUST have a deterministic outcome. NO randomised inventory pulls. Per FR-LEGAL-002 §1.1.

§1.2  **Catalogue items at P3 launch.**
- Outfits: $0.99 – $4.99 (VN ₫29K–₫119K) — specific cosmetic, named.
- Room decor: $2.99 (VN ₫69K) — specific decor bundle.
- Premium pet species: $4.99 – $9.99 (VN ₫119K–₫229K) — direct species + tier purchase.
- Currency packs (Hearts): $1.99/$4.99/$9.99/$19.99/$49.99 — fixed Heart quantities (avoid $99.99 whale-only).

§1.3  **VN payment rails.** Per plan §PART 6 — MoMo, ZaloPay, VNPay, ViettelPay. Routed via **Antom** (Ant Group) as Merchant-of-Record. Tax-inclusive pricing displayed.

§1.4  **iOS StoreKit 2.** All standard-SKU iOS purchases go through Apple's IAP. Receipt validation server-side via App Store Server API.

§1.5  **Android Play Billing.** Standard-SKU Android via Play Billing Library 6+. Server-side receipt validation via Google Play Developer API.

§1.6  **Web purchases.** WebGL build uses **Antom** (VN-friendly) or **Stripe** (global). MoR handling.

§1.7  **Server-side receipt validation.** Every purchase MUST be validated server-side BEFORE granting Hearts/items. Client-claimed receipts always rejected.

§1.8  **Validation flow.**
- Client receives receipt from StoreKit / Play Billing / Antom.
- Client POSTs `/v1/iap/validate` with the receipt.
- Server calls vendor API to validate receipt.
- On valid: grants entitlement via FR-ECON-001 ledger (`iap_source` account type).
- On invalid: rejects + emits `iap.validation.failed`.

§1.9  **Duplicate receipt protection.** Every validated receipt's transaction_id MUST be stored in `iap_purchases` table with UNIQUE constraint. Re-validation of same id returns the prior granted entitlement (idempotent).

§1.10  **Sandbox / production environment switching.** Apple sandbox + Play test track + Antom sandbox MUST be detected by receipt. Sandbox grants entitlement in test-tenant only — never crosses to production.

§1.11  **No IAP during onboarding.** Per FR-PET-004 §1.7 + Apple Guideline 3.1.3(b), IAP store UI MUST NOT surface until 5+ minutes after onboarding tutorial dismiss.

§1.12  **Catalogue endpoint.** `GET /v1/iap/catalogue?locale=vi` returns localised catalogue with pricing per region. Apple/Google return their own pricing; Antom MUST be configured per-VND amount.

§1.13  **Refund handling.** Apple/Google customer-initiated refunds MUST trigger:
- Webhook from Apple ASC / Google RTDN.
- Server processes refund: revokes entitlement (per FR-ECON-001 ledger `iap_source` reversal).
- If the player has already used the Hearts → flag for DPO review (no clawback if used).

§1.14  **Family Sharing approval (Apple) + Family Library (Google).** Per FR-LEGAL-003 §1.6 — IAP for under-13 needs parental approval. Kids SKU + FR-SUB-002 Family tier wires this.

§1.15  **Audit retention.** 7-year retention on iap_purchases per accounting/tax + COPPA.

§1.16  **No 99-tier whale-only.** Plan §PART 6 — avoid $99 whale-only currency packs. Max is $49.99.

§1.17  **Item delivery atomicity.** Validated receipt + Hearts grant + (if applicable) outfit/pet/decor grant MUST happen in a single Postgres transaction. Partial grant on failure forbidden.

§1.18  **Anti-fraud — receipt replay.** Apple/Google have known receipt-replay vulnerabilities. Antom has VN-specific patterns. Per FR-OBS-002 anti-cheat — flag receipts older than 7 days as suspicious + DPO review.

§1.19  **BE/NL safe mode.** Per FR-LEGAL-002 §1.12 — even though no real-money randomisation exists, IAP marketing UI hidden if "surprise" language present in copy. Surprise-egg UI (Coins-only) already hidden per FR-LEGAL-002.

§1.20  **Analytics.** `iap.purchase.initiated`, `iap.receipt.validated { vendor }`, `iap.purchase.completed { product_id, price_usd, vendor }`, `iap.refund.processed`, `iap.validation.failed { reason }` per FR-OBS-001.

---

## §2 — Why this design

**Why direct-purchase only.** Plan §PART 8 + FR-LEGAL-002 — Belgium/NL/EU loot-box compliance + HoYoverse precedent.

**Why VN payment rails via Antom.** Plan §PART 6 + plan §PART 7 — VN soft launch requires native payment options. Apple/Google take 30%; Antom-routed local payments ~1.5-2% MDR is cheaper. Apple/Google still the global default.

**Why server-side receipt validation.** Plan §PART 4 — client receipts can be forged. Server-side via vendor API is the canonical pattern.

**Why no IAP during onboarding.** Apple Guideline 3.1.3(b) + plan §PART 5.

**Why no $99 whale-only.** Plan §PART 6 — predatory monetization risks regulator action + harms brand.

**Why duplicate-receipt protection.** Replay attacks are the most common IAP fraud vector.

**Why refund-no-clawback if used.** Apple/Google policy expectation — clawback of already-consumed virtual goods is forbidden. Logged for DPO review.

**Why Family Sharing for kids.** FR-LEGAL-003 §1.6 — parental approval required.

**Why item-delivery atomic.** Partial-delivery (Hearts but no item) is the worst customer-service ticket.

**Why 7-day receipt freshness.** Tax/accounting + anti-fraud. Older receipts indicate replay attempts.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/econ/iap/iap.controller.ts
@Controller('v1/iap')
@UseGuards(SupabaseJwtGuard)
export class IapController {
  @Get('catalogue')
  async catalogue(@CurrentUser() u: AuthedUser, @Query('locale') locale: string) {
    return this.svc.catalogue(locale, u.region_of_record);
  }

  @Post('validate')
  async validate(@CurrentUser() u: AuthedUser, @Body() body: { vendor: 'apple' | 'google' | 'antom', receipt: string }) {
    return this.svc.validateAndGrant(u, body.vendor, body.receipt);
  }
}
```

```typescript
// apps/api/src/econ/iap/iap.service.ts (excerpt)
async validateAndGrant(u: AuthedUser, vendor: 'apple' | 'google' | 'antom', receipt: string) {
  const validator = this.validators[vendor];
  const result = await validator.validate(receipt);
  if (!result.valid) {
    this.audit.emit('iap.validation.failed', { vendor, reason: result.reason });
    throw new HttpException({ error: 'iap.validation.failed', reason: result.reason }, 422);
  }
  // Duplicate check
  const existing = await this.supa.from('iap_purchases').select('id').eq('transaction_id', result.transaction_id).maybeSingle();
  if (existing.data) {
    this.audit.emit('iap.purchase.replay_blocked', { transaction_id: result.transaction_id });
    return { idempotent: true, transaction_id: result.transaction_id };
  }
  // Freshness check
  const ageDays = (Date.now() - result.purchased_at.getTime()) / (24 * 3600 * 1000);
  if (ageDays > 7) {
    this.audit.emit('iap.validation.stale', { ageDays });
    throw new HttpException('iap.receipt.stale', 422);
  }
  const product = IAP_CATALOGUE[result.product_id];
  if (!product) throw new HttpException('iap.product.unknown', 422);
  return this.supa.rpc('iap_grant_atomic', {
    _user_id: u.id, _product_id: result.product_id, _transaction_id: result.transaction_id,
    _vendor: vendor, _price_usd: result.price_usd, _tenant_id: u.tenant_id,
    _hearts_amount: product.hearts ?? 0, _items: product.items ?? [],
  });
}
```

```typescript
// apps/api/src/econ/iap/iap-catalogue.ts
export const IAP_CATALOGUE = {
  'mochi.outfit.basic_a':       { type: 'outfit', price_usd: 0.99, vn_price_vnd: 29000, items: ['outfit:basic_a'] },
  'mochi.outfit.premium_a':     { type: 'outfit', price_usd: 4.99, vn_price_vnd: 119000, items: ['outfit:premium_a'] },
  'mochi.decor.cozy_bundle':    { type: 'decor', price_usd: 2.99, vn_price_vnd: 69000, items: ['decor:cozy_bundle'] },
  'mochi.species.tako_legend':  { type: 'species', price_usd: 9.99, vn_price_vnd: 229000, items: ['species:tako:legendary'] },
  'mochi.hearts.30':            { type: 'currency', price_usd: 1.99, vn_price_vnd: 49000, hearts: 30 },
  'mochi.hearts.100':           { type: 'currency', price_usd: 4.99, vn_price_vnd: 119000, hearts: 100 },
  'mochi.hearts.250':           { type: 'currency', price_usd: 9.99, vn_price_vnd: 229000, hearts: 250 },
  'mochi.hearts.600':           { type: 'currency', price_usd: 19.99, vn_price_vnd: 459000, hearts: 600 },
  'mochi.hearts.1500':          { type: 'currency', price_usd: 49.99, vn_price_vnd: 1149000, hearts: 1500 },
} as const;
```

```sql
-- migration
create table public.iap_purchases (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  product_id text not null,
  transaction_id text not null unique,
  vendor text not null check (vendor in ('apple','google','antom','stripe','paddle')),
  price_usd numeric(10,2) not null,
  granted_hearts int not null default 0,
  granted_items text[] not null default '{}',
  refunded_at timestamptz,
  tenant_id text not null default 'mochi',
  purchased_at timestamptz not null,
  validated_at timestamptz not null default now()
);
create index on public.iap_purchases (user_id, purchased_at desc);
alter table public.iap_purchases enable row level security;
create policy "iap self" on public.iap_purchases for select using (user_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** Apple receipt validation works (mocked App Store Server API). Verified.
**AC2.** Google receipt validation works. Verified.
**AC3.** Antom VN receipt validation. Verified.
**AC4.** Duplicate transaction_id idempotent. Verified.
**AC5.** Stale receipt (>7 days) rejected. Verified.
**AC6.** Hearts grant on successful purchase. Verified.
**AC7.** Item grant atomic with Hearts. Verified.
**AC8.** Refund webhook revokes entitlement. Verified.
**AC9.** IAP UI suppressed during onboarding (Apple guideline). Verified.
**AC10.** No randomised pulls in catalogue. Verified by `lint-iap-catalogue` (FR-LEGAL-002 §1.11).
**AC11.** Family Sharing approval honoured. Verified.
**AC12.** VN localised pricing. Verified.

---

## §5 — Verification

```typescript
describe('FR-ECON-002 — IAP', () => {
  it('rejects duplicate transaction_id', async () => {
    await svc.validateAndGrant(user('u1'), 'apple', validReceipt('tx1'));
    const r = await svc.validateAndGrant(user('u1'), 'apple', validReceipt('tx1'));
    expect(r.idempotent).toBe(true);
  });

  it('rejects stale receipt', async () => {
    await expect(svc.validateAndGrant(user('u1'), 'apple', validReceipt('tx_stale', { age_days: 8 }))).rejects.toMatchObject({ status: 422 });
  });

  it('grants Hearts atomically', async () => {
    const before = await ledger.balance(user('u1').id, 'hearts');
    await svc.validateAndGrant(user('u1'), 'apple', validReceipt('tx_hearts100', { product_id: 'mochi.hearts.100' }));
    expect(await ledger.balance(user('u1').id, 'hearts')).toBe(before + 100);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/econ/iap/apple-receipt-validator.ts
@Injectable()
export class AppleReceiptValidator {
  async validate(receipt: string): Promise<{ valid: boolean; reason?: string; transaction_id?: string; product_id?: string; price_usd?: number; purchased_at?: Date }> {
    // Use App Store Server API per Apple's documented flow
    const res = await fetch('https://api.storekit.itunes.apple.com/inApps/v1/transactions/' + receipt, {
      headers: { Authorization: `Bearer ${process.env.APPLE_JWT}` },
    });
    if (!res.ok) return { valid: false, reason: `apple_api_${res.status}` };
    const j = await res.json();
    return {
      valid: true,
      transaction_id: j.transactionId,
      product_id: j.productId,
      price_usd: j.price ? j.price / 1000 : 0,
      purchased_at: new Date(j.purchaseDate),
    };
  }
}
```

---

## §7 — Dependencies

**External:** Apple App Store Server API; Google Play Developer API; Antom MoR; Stripe (B2B web).
**Internal:** FR-ECON-001 (ledger), FR-LEGAL-002 (catalogue lint), FR-PET-006 (premium species), FR-LEGAL-003 (Family Sharing), FR-INFRA-003 (Postgres).
**Blocks:** FR-ECON-003 (UGC rev-share), FR-SUB-001 (Pet+ subscription), FR-VIRAL-004 (battle pass).

---

## §8 — Example payloads

```http
POST /v1/iap/validate
{ "vendor": "apple", "receipt": "MIIA..." }
→ 200 { "transaction_id": "200000123456", "product_id": "mochi.hearts.100", "hearts_granted": 100, "items_granted": [], "idempotent": false }
```

```http
GET /v1/iap/catalogue?locale=vi
→ 200 {
  "products": [
    { "id": "mochi.outfit.basic_a", "type": "outfit", "vn_price_vnd": 29000, "display_price": "29.000₫" },
    ...
  ]
}
```

```json
{ "error": "iap.validation.failed", "reason": "apple_api_400" }
```

```json
{ "event": "iap.purchase.completed", "user_id": "01HU...", "product_id": "mochi.hearts.100", "vendor": "apple", "price_usd": 4.99 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Antom vs direct MoMo? → §1.3 — Antom MoR is cheaper than per-PSP integration.
- **OQ-2 (resolved):** Whale-only $99? → §1.16 — excluded.
- **OQ-3 (resolved):** Clawback on refund? → §1.13 — no for used Hearts.
- **OQ-4 (resolved):** Family Sharing? → §1.14 — wired via FR-LEGAL-003.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Apple Server API down | Vendor 5xx | Validation deferred | Retry with backoff |
| 2 | Google Play API rate-limit | 429 | Backoff | Tune retry |
| 3 | Antom integration outage | Vendor monitor | VN purchases blocked | Fallback to Stripe (international) |
| 4 | Refund webhook never received | Audit gap | Entitlement stays | Daily reconciliation catches |
| 5 | Receipt replay (cross-account) | Unique constraint | Replay rejected | Verified |
| 6 | Stale receipt fraud | 7-day freshness check | Rejected | Verified |
| 7 | Hearts grant fails mid-tx | Postgres rollback | None granted | Atomic |
| 8 | Localised pricing wrong | Manual review | Customer impact | Hot-fix |
| 9 | Family Sharing approval bypass | Vendor handling | Honoured | OS-level enforcement |
| 10 | Sandbox receipt crosses to prod | Receipt envt detection | Prevented | Verified |
| 11 | IAP shown during onboarding | Playwright | Apple rejection | UX gate |
| 12 | Audit retention COPPA | DPO | 7-yr | Configured |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (catalogue + pricing), plan §PART 7 (VN payment rails).

**Sub-decisions punted to ops:** Antom integration details + per-country pricing localisation locked in `iap-catalogue.ts` annex.

**Anti-patterns explicitly forbidden:**
- Random-outcome IAP.
- IAP during onboarding.
- $99 whale-only pack.
- Client-validated receipts.

**Cross-reference:** FR-ECON-001 ledger, FR-SUB-001 subscription, FR-VIRAL-004 battle pass, FR-PET-006 premium species.
