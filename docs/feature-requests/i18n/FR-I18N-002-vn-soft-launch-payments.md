---
id: FR-I18N-002
title: "VN soft-launch payment rails — MoMo/ZaloPay/VNPay/ViettelPay via Antom + PH GCash + ID DANA via Xsolla"
module: I18N
priority: MUST
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 2
owner: "Tech Lead + UA + DPO"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-ECON-002, FR-I18N-001, FR-LEGAL-001, FR-LEGAL-002, FR-AUTH-001, FR-AUTH-002, FR-OBS-001]
depends_on: [FR-ECON-002, FR-I18N-001]
blocks: []
effort_hours: 10
new_files:
  - "apps/api/src/econ/iap/antom-adapter.ts"
  - "apps/api/src/econ/iap/xsolla-adapter.ts"
  - "apps/api/src/econ/iap/region-pricing.ts"
  - "apps/api/src/econ/iap/__tests__/antom.spec.ts"
  - "apps/api/src/econ/iap/__tests__/region-pricing.spec.ts"
  - "apps/cocos/assets/_root/econ/VnPaymentMethodPickerUi.ts"
  - "infra/supabase/standard/migrations/20260517_031_payment_methods.sql"
  - "docs/legal/payment-mor-agreements.md"
modified_files:
  - "apps/api/src/econ/iap/iap.service.ts"
  - "apps/api/src/econ/iap/iap-catalogue.ts"
allowed_tools:
  - "Antom Merchant-of-Record (Ant Group) for VN MoMo/ZaloPay/VNPay/ViettelPay"
  - "Xsolla MoR for PH (GCash) + ID (DANA)"
  - "FR-ECON-002 ledger atomic grant"
disallowed_tools:
  - "Direct PSP integration without MoR at P4 (compliance complexity)"
  - "Apple/Google subscriptions via Antom (must stay in-store per §1.6 FR-SUB-001 alignment)"
  - "Cross-region payment fallback (each region has dedicated rail)"
risk_if_skipped: "Plan §PART 7 — VN soft launch needs MoMo + ZaloPay + VNPay + ViettelPay rails. PH + ID local payment rails needed for the soft-launch 3-market wave (VN + PH + ID)."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Antom for VN.** MoMo, ZaloPay, VNPay, ViettelPay — all routed through Antom (Ant Group) as Merchant-of-Record. Antom handles VN tax + invoice + dispute on our behalf.

§1.2  **Xsolla for PH + ID.** GCash (PH) + DANA (ID) routed through Xsolla MoR.

§1.3  **One-off IAP only.** VN/PH/ID local payment for one-off IAP (currency packs, outfits, premium species). Subscriptions remain Apple/Google only per FR-SUB-001 §`disallowed_tools`.

§1.4  **Region-aware payment picker.** When user is in VN/PH/ID region:
- iOS/Android: surface Apple/Google IAP first + "Other payment methods" expanding to local rails.
- Web: surface local rails primarily.

§1.5  **Pricing localisation.** Catalogue prices localised per FR-ECON-002 §1.2 catalogue + FR-I18N-001 currency formatting:
- VN: ₫29K-₫999K range.
- PH: ₱60-₱2,000 range.
- ID: Rp 15K-Rp 500K range.

§1.6  **Tax-inclusive display.** Per VN PDPL + local consumer law — all VN prices DISPLAY tax-inclusive. Same for PH/ID.

§1.7  **Antom webhook.** Antom signs webhook with HMAC; receipt validation via Antom Server API. Per FR-ECON-002 §1.7 server-side validation.

§1.8  **Xsolla webhook.** Same pattern; Xsolla-signed webhooks.

§1.9  **Refund handling.** Antom + Xsolla refund webhooks trigger entitlement revocation per FR-ECON-002 §1.13.

§1.10  **Anti-fraud — Antom region match.** Per FR-AUTH-001 §1.6 region-of-record — Antom payment must come from VN-region card/wallet. Mismatch flagged for review (potential fraud).

§1.11  **Payment method failover.** If Antom is down, surface "MoMo / ZaloPay etc. unavailable — try Apple/Google" message. UX: never silent-fail.

§1.12  **DPO data processing addendum.** Antom + Xsolla DPAs filed at `docs/legal/payment-mor-agreements.md`. Per FR-LEGAL-001 §1.3 cross-border-TIA.

§1.13  **Currency conversion.** Antom + Xsolla handle conversion. Our catalogue stores both USD reference + local-currency display.

§1.14  **Min-purchase compliance.** VN PDPL minor purchase rules: payments by under-18 disallowed via local rails. Antom MoR enforces.

§1.15  **Endpoint — payment options.** `GET /v1/iap/payment-options?region=VN` returns available rails.

§1.16  **Endpoint — initiate Antom.** `POST /v1/iap/antom/initiate` returns Antom-hosted checkout URL.

§1.17  **DLT (Indonesia) compliance.** Indonesia digital-tax registration required for transactions > IDR 600M/year. Xsolla MoR handles.

§1.18  **PH BIR compliance.** Philippines tax registration via Xsolla.

§1.19  **Audit retention.** 7-year per accounting + COPPA.

§1.20  **Analytics.** `iap.region.payment_initiated`, `iap.region.payment_completed`, `iap.region.payment_failed { reason }` per FR-OBS-001.

---

## §2 — Why this design

**Why Antom for VN.** Plan §PART 6 + plan §PART 7 — Antom MoR handles VN tax + dispute + fraud at 1.5-2% MDR vs direct PSP at 3.4%+. Apple/Google take 30% globally.

**Why one-off IAP only via local rails.** FR-SUB-001 — Apple/Google policy enforces subscription must be in-store.

**Why region-match anti-fraud.** Plan §PART 4 — payment region mismatch is a known fraud signal.

**Why Xsolla for PH + ID.** Plan §PART 7 — Xsolla has GCash + DANA coverage. Cheaper than two-vendor integration.

**Why tax-inclusive display.** Plan §PART 8 — VN consumer law requires it.

**Why min-purchase compliance.** PDPL minor laws + Apple/Google Family Sharing.

**Why DLT + BIR via Xsolla.** Compliance overhead delegated to MoR.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/econ/iap/antom-adapter.ts
@Injectable()
export class AntomAdapter {
  async initiateCheckout(input: { user_id: string; product_id: string; vnd_amount: number; payment_method: 'momo' | 'zalopay' | 'vnpay' | 'viettelpay' }) {
    const checkout = await fetch('https://api.antom.com/v1/checkouts', {
      method: 'POST',
      headers: { 'X-Antom-Key': process.env.ANTOM_API_KEY!, 'content-type': 'application/json' },
      body: JSON.stringify({
        merchant_reference: `tamagochi:${input.user_id}:${input.product_id}:${Date.now()}`,
        amount: { value: input.vnd_amount, currency: 'VND' },
        payment_method: input.payment_method,
        return_url: process.env.IAP_RETURN_URL,
      }),
    });
    if (!checkout.ok) throw new HttpException('antom.initiate.failed', 502);
    const j = await checkout.json();
    return { checkout_url: j.checkout_url, reference: j.reference };
  }

  async verifyWebhook(req: Request): Promise<{ valid: boolean; reference: string; product_id: string; user_id: string }> {
    const sig = req.headers['x-antom-signature'] as string;
    const body = await req.text();
    const expected = createHmac('sha256', process.env.ANTOM_WEBHOOK_SECRET!).update(body).digest('hex');
    if (sig !== expected) return { valid: false } as any;
    const j = JSON.parse(body);
    const parts = j.merchant_reference.split(':');
    return { valid: true, reference: j.reference, product_id: parts[2], user_id: parts[1] };
  }
}
```

```sql
create table public.regional_payments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  product_id text not null,
  vendor text not null check (vendor in ('antom','xsolla')),
  payment_method text not null,
  amount_local numeric(12,2) not null,
  currency text not null,
  status text not null default 'initiated' check (status in ('initiated','completed','failed','refunded')),
  initiated_at timestamptz not null default now(),
  completed_at timestamptz,
  refunded_at timestamptz,
  tenant_id text not null default 'mochi'
);
alter table public.regional_payments enable row level security;
create policy "regional self" on public.regional_payments for select using (user_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** VN MoMo payment flow end-to-end. Verified.
**AC2.** ZaloPay flow works. Verified.
**AC3.** PH GCash flow works. Verified.
**AC4.** ID DANA flow works. Verified.
**AC5.** Antom webhook validation. Verified.
**AC6.** Refund webhook revokes entitlement. Verified.
**AC7.** Tax-inclusive price display VN. Verified.
**AC8.** Region-mismatch flagged. Verified.
**AC9.** Pricing localised correctly. Verified.
**AC10.** Subscriptions blocked via local rails. Verified.
**AC11.** Antom outage falls back to Apple/Google. Verified.
**AC12.** DPA on file for Antom + Xsolla. Verified.

---

## §5 — Verification

```typescript
describe('FR-I18N-002 — VN payment rails', () => {
  it('initiates MoMo checkout', async () => {
    const r = await antom.initiateCheckout({ user_id: 'u1', product_id: 'mochi.hearts.100', vnd_amount: 119000, payment_method: 'momo' });
    expect(r.checkout_url).toMatch(/antom\.com/);
  });

  it('rejects subscription product via Antom', async () => {
    await expect(antom.initiateCheckout({ user_id: 'u1', product_id: 'mochi.subscription.monthly', vnd_amount: 99000, payment_method: 'momo' })).rejects.toMatchObject({ status: 422 });
  });

  it('region mismatch flags', async () => {
    await setRegion('u1', 'US');
    const r = await iap.handleAntomWebhook(mockAntomWebhook({ user_id: 'u1', payment_country: 'VN' }));
    expect(r.flagged_for_review).toBe(true);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/econ/iap/region-pricing.ts
export function pickPriceForRegion(productId: string, region: string): { amount: number; currency: string; display: string } {
  const catalogue = IAP_CATALOGUE[productId];
  switch (region) {
    case 'VN': return { amount: catalogue.vn_price_vnd, currency: 'VND', display: `₫${catalogue.vn_price_vnd.toLocaleString('vi-VN')}` };
    case 'PH': return { amount: catalogue.ph_price_php ?? Math.round(catalogue.price_usd * 56), currency: 'PHP', display: `₱${catalogue.ph_price_php}` };
    case 'ID': return { amount: catalogue.id_price_idr ?? Math.round(catalogue.price_usd * 16000), currency: 'IDR', display: `Rp ${catalogue.id_price_idr?.toLocaleString('id-ID')}` };
    default: return { amount: Math.round(catalogue.price_usd * 100), currency: 'USD', display: `$${catalogue.price_usd}` };
  }
}
```

---

## §7 — Dependencies

**External:** Antom + Xsolla account setup; per-region tax registrations.
**Internal:** FR-ECON-002 (IAP base + atomic grant), FR-AUTH-001 (region detection), FR-I18N-001 (currency formatting), FR-LEGAL-001 (DPA filing).
**Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/iap/antom/initiate
{ "product_id": "mochi.hearts.100", "payment_method": "momo" }
→ 200 { "checkout_url": "https://antom.com/checkout/abc...", "reference": "tamagochi:u1:..." }
```

```http
POST /webhook/iap/antom
{ "merchant_reference": "tamagochi:u1:mochi.hearts.100:...", "status": "completed", "amount": { "value": 119000, "currency": "VND" } }
X-Antom-Signature: ...
→ 200 { "granted": true, "hearts": 100 }
```

```json
{ "event": "iap.region.payment_completed", "user_id": "01HU...", "vendor": "antom", "payment_method": "momo", "amount_local": 119000, "currency": "VND" }
```

```json
{ "error": "antom.subscription_blocked", "reason": "subscriptions must be in-store" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** MoR vs direct PSP? → §1.1 + §2.
- **OQ-2 (resolved):** PH+ID via Xsolla? → §1.2.
- **OQ-3 (resolved):** Subscriptions local? → §1.3 — no.
- **OQ-4 (resolved):** Region anti-fraud? → §1.10.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Antom down | Synthetic | Apple/Google fallback | Surface UX |
| 2 | Xsolla down | Vendor monitor | UX fallback | Surface |
| 3 | Webhook signature invalid | Validator | Reject | Investigate |
| 4 | Tax-inclusive display wrong | Spec test | Customer complaint | Hot-fix |
| 5 | Region-mismatch false positive | DPO review | Reverse | Tune detection |
| 6 | DLT/BIR compliance gap | Annual audit | Tax risk | Xsolla MoR handles |
| 7 | DPA expires | Annual review | Compliance gap | Re-execute |
| 8 | Cross-region payment slip | Audit | Privacy | Region scope enforced |
| 9 | Pricing wrong for new product | Catalogue review | Customer impact | Hot-fix |
| 10 | Subscriptions via Antom slip | Spec test | Apple/Google rejection | Validation enforced |
| 11 | Refund not propagated | Reconciliation | Audit gap | Daily check |
| 12 | Currency formatting wrong | I18N test | UX issue | ICU correction |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (VN payment rails); plan §PART 7 (soft-launch VN+PH+ID).

**Sub-decisions punted to ops:** Antom + Xsolla contract negotiation + DPO sign-off.

**Anti-patterns explicitly forbidden:**
- Direct PSP at P4.
- Local subscription rails.
- Cross-region payment.

**Cross-reference:** FR-ECON-002 IAP base; FR-AUTH-001 region; FR-LEGAL-001 DPA.
