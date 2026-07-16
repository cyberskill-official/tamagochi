---
id: TASK-ECON-003
title: "Pet Couture UGC — in-app outfit designer + Trust & Safety review + 30% creator rev-share (Roblox UGC playbook)"
module: ECON
priority: COULD
status: done
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 2
owner: "Tech Lead + designer + DPO"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-ECON-001, TASK-ECON-002, TASK-ART-001, TASK-AI-002, TASK-LEGAL-001, TASK-LEGAL-002, TASK-PET-001, TASK-OBS-001, TASK-AUTH-003]
depends_on: [TASK-ECON-002, TASK-AI-002]
blocks: []
effort_hours: 12
new_files:
  - "apps/api/src/econ/ugc/ugc.controller.ts"
  - "apps/api/src/econ/ugc/ugc.service.ts"
  - "apps/api/src/econ/ugc/ts-review-queue.service.ts"
  - "apps/api/src/econ/ugc/revshare.service.ts"
  - "apps/api/src/econ/ugc/__tests__/ugc.spec.ts"
  - "apps/api/src/econ/ugc/__tests__/revshare.spec.ts"
  - "apps/cocos/assets/_root/econ/CoutureDesignerUi.ts"
  - "infra/supabase/standard/migrations/20260517_024_ugc_submissions.sql"
modified_files: []
allowed_tools:
  - "Spine slot recolour for accessory_head/accessory_body"
  - "TASK-AI-002 content safety on UGC name + description"
  - "Manual T&S review queue (Trust & Safety team)"
disallowed_tools:
  - "UGC on kids SKU (no submission, no purchase)"
  - "Auto-approval (manual T&S review required)"
  - "UGC replacing body or face slots (only accessory_head/accessory_body per TASK-ART-001 §1.4)"
  - "UGC purchase via Hearts (Coins only — keeps UGC-economy soft-currency)"
risk_if_skipped: "Plan §PART 3 + plan §PART 6 Pet Couture UGC = Roblox UGC playbook scaled. Long-tail content engine; without it, content production is capped at internal art budget."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **UGC scope.** Users design outfits for the `accessory_head` + `accessory_body` slots only (per TASK-ART-001 §1.4 — body/face are off-limits). Each design has palette + simple Spine attachment shape.

§1.2  **Cocos designer UI.** `CoutureDesignerUi.ts` exposes:
- Slot picker (head/body).
- Palette picker (RGBA grid).
- Pattern picker (8 built-in patterns: stripes/dots/etc.).
- Preview on player's current pet.

No free-form image upload. Pattern + palette only at P3.

§1.3  **Submission flow.** Submitter pays 50 Coins (Coin sink) → designer-output JSON serialised → submission row created with `status='pending_review'`.

§1.4  **Manual T&S review.** A T&S team member reviews each submission within 7 business days. Reviewer checks: appropriate visual content; no copyrighted patterns; no offensive imagery. Approved → status `approved`; rejected → status `rejected` with reason.

§1.5  **Name + description content safety.** Submitter provides name (max 30 chars) + description (max 100 chars). Both pass through TASK-AI-002 content safety + PII regex.

§1.6  **Marketplace listing.** Approved UGC listed at `/v1/ugc/marketplace?slot=head&order=popular`. Pricing set by creator within range 5–500 Coins.

§1.7  **Purchase flow.** Buyer spends Coins (via TASK-ECON-001 ledger). Coins split:
- 70% to system sink (kept by platform / fund operations).
- 30% to creator's account (also Coins — held in creator's `revshare_balance` separate ledger account).

§1.8  **Creator payout.** Creator can convert Coins from `revshare_balance` to Hearts at a 100:1 ratio after accumulating 10,000 Coins. Hearts then usable on IAP-equivalent items. No real-money payout to creators at P3 (defer to P4+).

§1.9  **Endpoint — submit.** `POST /v1/ugc/submit` body `{ slot, palette, pattern_id, name, description, price_coins }`.

§1.10  **Endpoint — buy.** `POST /v1/ugc/marketplace/:itemId/buy`.

§1.11  **Endpoint — list creator earnings.** `GET /v1/ugc/me/earnings` returns earned Coins + sale count.

§1.12  **Per-creator earning cap.** 50,000 Coins / month per creator (anti-farming via socks).

§1.13  **Kids SKU disabled.** Per TASK-AUTH-003 — no submission, no purchase on kids SKU.

§1.14  **No real-money payout at P3.** Defer to a future regulatory + compliance review (creator monetization may trigger Anti-Money-Laundering compliance).

§1.15  **Approved UGC tenant scoping.** UGC submitted on consumer tenant (Mochi) is consumer-only. B2B tenants (TASK-B2B-001) have their own UGC pool or none.

§1.16  **Audit + DSR.** Every submission + sale row retained 7 years. Creator can DSR-export.

§1.17  **Rejection feedback.** Creator receives rejection reason notification. Up to 3 resubmissions per design (then permanent block).

§1.18  **Revenue receipts.** Each sale writes ledger rows: -<price> buyer wallet → +<70%> system_sink + +<30%> creator_revshare.

§1.19  **Featured rotation.** Editorial team can feature UGC items in marketplace. Featured items get boosted visibility for 7 days.

§1.20  **Analytics.** `ugc.submitted`, `ugc.reviewed { verdict }`, `ugc.purchased`, `ugc.creator.payout`, `ugc.featured` per TASK-OBS-001.

---

## §2 — Why this design

**Why pattern + palette (no image upload).** Plan §PART 8 + IP risk — free image upload would let users submit copyrighted/inappropriate art. Pattern + palette is creative-but-bounded.

**Why manual T&S review.** Plan §PART 8 + Roblox UGC issues — auto-approval leads to abusive content. Manual review prevents.

**Why 70/30 split.** Plan §PART 6 + Roblox precedent — 30% creator share is industry standard.

**Why no real-money payout at P3.** Anti-Money-Laundering compliance is non-trivial. Cap to in-game value first.

**Why 100:1 Coin→Heart ratio.** Plan §PART 6 — Coins are easier to earn (mini-games etc.); 100:1 keeps Hearts genuinely premium.

**Why 50,000 Coin monthly cap.** Anti-sock-farm — prevents creator alts buying their own UGC.

**Why 3 resubmissions then block.** Anti-spam.

**Why kids SKU disabled.** COPPA — UGC market involves payments + creator interactions.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/econ/ugc/ugc.service.ts (excerpt)
async submit(u: AuthedUser, design: UgcDesign) {
  if (await this.sku(u) === 'kids') throw new HttpException('ugc.kids_forbidden', 403);
  await this.safety.assertSafe(design.name, { audience: '13+' });
  await this.safety.assertSafe(design.description ?? '', { audience: '13+' });
  await this.ledger.spend(u.id, 'coins', 50, `ugc.submit:${design.client_id}`, u.tenant_id);
  const { data: submission } = await this.supa.from('ugc_submissions').insert({
    id: generateUlid(),
    creator_id: u.id, slot: design.slot,
    palette: design.palette, pattern_id: design.pattern_id,
    name: design.name, description: design.description ?? '',
    price_coins: design.price_coins,
    status: 'pending_review',
    tenant_id: u.tenant_id,
  }).select().single();
  await this.tsQueue.enqueue(submission.id);
  return { submission_id: submission.id, status: 'pending_review' };
}

async buy(u: AuthedUser, itemId: string) {
  const item = await this.fetchApprovedItem(itemId);
  await this.ledger.spend(u.id, 'coins', item.price_coins, `ugc.buy:${itemId}`, u.tenant_id);
  const creatorShare = Math.floor(item.price_coins * 0.30);
  await this.ledger.grant(item.creator_id, 'coins', creatorShare, `ugc.revshare:${itemId}`, item.tenant_id, 'creator_revshare');
  await this.supa.from('ugc_sales').insert({ ugc_item_id: itemId, buyer_id: u.id, creator_id: item.creator_id, price_coins: item.price_coins });
  return { item_id: itemId, granted: true };
}
```

```sql
-- migration
create table public.ugc_submissions (
  id text primary key,
  creator_id uuid not null references auth.users(id) on delete restrict,
  slot text not null check (slot in ('accessory_head','accessory_body')),
  palette jsonb not null,
  pattern_id text not null,
  name text not null check (length(name) <= 30),
  description text not null check (length(description) <= 100),
  price_coins int not null check (price_coins between 5 and 500),
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected')),
  rejection_reason text,
  resubmission_count int not null default 0,
  tenant_id text not null default 'mochi',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.ugc_sales (
  id bigserial primary key,
  ugc_item_id text not null references public.ugc_submissions(id) on delete restrict,
  buyer_id uuid not null,
  creator_id uuid not null,
  price_coins int not null,
  sold_at timestamptz not null default now(),
  tenant_id text not null default 'mochi'
);
```

---

## §4 — Acceptance criteria

**AC1.** Submission flow: 50 Coins debit, row inserted with pending_review. Verified.
**AC2.** Content safety on name + description. Verified.
**AC3.** T&S review approves/rejects. Verified by mock review.
**AC4.** Marketplace lists approved items only. Verified.
**AC5.** Buy: 70% to platform sink, 30% to creator revshare. Verified.
**AC6.** Creator payout requires 10,000 Coin minimum + 100:1 conversion. Verified.
**AC7.** 50,000/month creator cap enforced. Verified.
**AC8.** Kids SKU forbidden. Verified.
**AC9.** Body/face slots forbidden. Verified.
**AC10.** Rejection: 3 resubmission cap. Verified.
**AC11.** DSR export works. Verified.
**AC12.** Audit retention 7-year. Verified.

---

## §5 — Verification

```typescript
describe('TASK-ECON-003 — UGC', () => {
  it('splits revenue 70/30', async () => {
    await fund('buyer', 1000);
    await mockApprovedUgc({ creator: 'creator1', price: 100 });
    await svc.buy(user('buyer'), 'ugc1');
    expect(await ledger.balance('creator1', 'coins', 'creator_revshare')).toBe(30);
  });

  it('blocks kids', async () => {
    const u = user('kid', { audience: 'under-13' });
    await expect(svc.submit(u, mockDesign)).rejects.toMatchObject({ status: 403 });
  });

  it('enforces 3-resubmission cap', async () => {
    for (let i = 0; i < 3; i++) await rejectAndResubmit('design1');
    await expect(rejectAndResubmit('design1')).rejects.toThrow(/blocked/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/econ/ugc/revshare.service.ts
@Injectable()
export class RevshareService {
  async creatorPayout(userId: string): Promise<{ hearts_credited: number; remaining_coins: number }> {
    const balance = await this.ledger.balanceInAccount(userId, 'coins', 'creator_revshare');
    if (balance < 10000) throw new HttpException('revshare.below_threshold', 422);
    const hearts = Math.floor(balance / 100);
    const coinsConsumed = hearts * 100;
    await this.ledger.spendFromAccount(userId, 'coins', coinsConsumed, 'creator_revshare', 'revshare.payout');
    await this.ledger.grant(userId, 'hearts', hearts, `revshare.payout:${userId}`, 'mochi', 'iap_source');
    return { hearts_credited: hearts, remaining_coins: balance - coinsConsumed };
  }
}
```

---

## §7 — Dependencies

**External:** Manual T&S review process (post-launch hire).
**Internal:** TASK-ECON-001 (ledger with creator_revshare account), TASK-ECON-002 (Hearts grants), TASK-AI-002 (content safety), TASK-ART-001 (Spine slot system), TASK-AUTH-003 (kids SKU).
**Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/ugc/submit
{ "slot": "accessory_head", "palette": {...}, "pattern_id": "stripes_a", "name": "Cozy Beanie", "description": "Warm and stylish", "price_coins": 50 }
→ 201 { "submission_id": "01HUGC...", "status": "pending_review" }
```

```http
POST /v1/ugc/marketplace/01HUGC.../buy
→ 200 { "item_id": "01HUGC...", "granted": true, "creator_revshare_to": "01HU..." }
```

```json
{ "event": "ugc.purchased", "item_id": "01HUGC...", "buyer_id": "01HU...", "creator_id": "01HU...", "price_coins": 50, "creator_share_coins": 15 }
```

```json
{
  "id": "01HUGC...",
  "creator_id": "01HU...",
  "slot": "accessory_head",
  "status": "approved",
  "price_coins": 50,
  "total_sales": 42,
  "creator_earnings_coins": 630
}
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Pattern+palette vs image? → §1.2 — pattern+palette only.
- **OQ-2 (resolved):** Real-money payout? → §1.14 — defer to P4+.
- **OQ-3 (resolved):** 70/30 split? → §1.7.
- **OQ-4 (resolved):** Kids UGC? → §1.13 — disabled.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | T&S review queue backlog >7 days | SLA breach | Creator frustration | Hire more reviewers + auto-approve simple palette swaps after 3 days if no flags |
| 2 | Inappropriate UGC slips through | User report | Brand risk | Immediate removal + retroactive credit to buyers |
| 3 | Sock-farm creator earning cap | Per-month cap | Verified | OK |
| 4 | Body/face slot bypass via API | Constraint catches | Rejected | Validated |
| 5 | Kids buy UGC via SKU bypass | RLS + SKU gate | Verified | Audit |
| 6 | Spine slot integrity broken by malformed palette | Validation | Reject | Schema check |
| 7 | Revshare ledger drift | Daily reconciliation | Alert | Investigate + reconcile |
| 8 | Creator payout exceeds threshold but blocked | Bug | Frustration | Manual review |
| 9 | Rejection feedback unclear | Player support | UX issue | Standardise reason codes |
| 10 | Featured rotation favouritism | Editorial guidelines | Brand risk | Public editorial policy |
| 11 | DSR export PII leak | Audit | Privacy | Schema lint |
| 12 | Audit growth | Disk | 7-year retention | Configured |

---

## §11 — Notes

**Plan refs:** plan §PART 3 Pet Couture UGC; plan §PART 6 Roblox UGC playbook.

**Sub-decisions punted to ops:** T&S team size + review SLA + featured-rotation editorial policy.

**Anti-patterns explicitly forbidden:**
- Auto-approval.
- Body/face slot UGC.
- Real-money payout at P3.
- Kids UGC.

**Cross-reference:** TASK-AI-002 content safety, TASK-ART-001 slot system, TASK-ECON-001 ledger.
