---
id: TASK-SUB-002
title: "Family tier ($9.99/mo; VN ₫199K/mo) — up to 5 child profiles + parental dashboard + screen-time/spend caps + content filter"
module: SUB
priority: SHOULD
status: done
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 2
owner: "Tech Lead + DPO"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-SUB-001, TASK-AUTH-003, TASK-LEGAL-001, TASK-LEGAL-003, TASK-AI-002, TASK-ADS-002, TASK-VIRAL-005, TASK-INFRA-003, TASK-ECON-002, TASK-OBS-001]
depends_on: [TASK-SUB-001, TASK-AUTH-003]
blocks: []
effort_hours: 10
new_files:
  - "apps/api/src/sub/family/family.controller.ts"
  - "apps/api/src/sub/family/family.service.ts"
  - "apps/api/src/sub/family/child-profile.service.ts"
  - "apps/api/src/sub/family/parental-dashboard.service.ts"
  - "apps/api/src/sub/family/__tests__/family.spec.ts"
  - "apps/cocos/assets/_root/sub/ParentalDashboardUi.ts"
  - "apps/cocos/assets/_root/sub/AddChildProfileUi.ts"
  - "infra/supabase/standard/migrations/20260517_026_family_tier.sql"
modified_files: []
allowed_tools:
  - "Apple Family Sharing API"
  - "Google Family Library API"
  - "TASK-AUTH-003 parental consent flow"
  - "TASK-LEGAL-001 DPO surfaces"
disallowed_tools:
  - "Family tier without parental consent for each child (COPPA)"
  - "Cross-tenant family members"
  - "Family tier purchasable by under-18 (parental account required)"
  - "Real-money spend by child without parental approval"
risk_if_skipped: "Plan §PART 6 + plan §PART 8 — Family tier is the canonical way to monetize under-13 households compliantly. Without it, kids SKU has no path to revenue + the parental dashboard required for COPPA-2025 Family-Sharing compliance is missing."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Family tier pricing.** $9.99/mo (VN ₫199K/mo). 2× Pet+ price for up to 5 child profiles.

§1.2  **Family tier benefits.**
- All Pet+ benefits for up to 5 child profiles + 1 parent profile.
- Parental dashboard for monitoring + controlling.
- Screen-time caps per child (configurable 15min–unlimited).
- Spend caps per child (configurable 0–unlimited Hearts/mo).
- Content filter override (parent can disable AI dialogue per TASK-AI-001 even for 13+ children).
- Friend-request approval queue (parent must approve adds).

§1.3  **Family tier purchasable by adults only.** Verified via `audience_age_gate = '13+'`. Apple Family Sharing membership confirms adult role.

§1.4  **Child profile creation.** Parent in dashboard taps "Add child profile" → flow:
- Enter child's display name (filtered per TASK-PET-001 §1.5).
- Enter child's birth year (used to set `audience_age_gate` correctly).
- Triggers TASK-AUTH-003 parental consent via Safe Harbor vendor — even though the parent IS the parent, COPPA-2025 requires VPC per child.
- On consent grant: child profile created on **kids SKU's Supabase project**.
- Parent's account on standard SKU is linked via `family_links` table.

§1.5  **Parental dashboard.** Browser + in-app view showing per child:
- Time spent today / this week / this month.
- Coins + Hearts spent.
- Friend list + pending requests.
- AI dialogue logs (sanitised — DPO review).
- "Pause this child" button (instant suspend).
- "Delete this child profile" → DSR-erasure path.

§1.6  **Screen-time caps.** Configurable per child by parent. When cap exceeded, child's app launch returns "Time's up — see you tomorrow!" UX. Resets at child's local midnight.

§1.7  **Spend caps.** Per child / per month. Cap defaults to 0 (no real-money spend without parental approval). Each IAP attempt by child triggers a parental-approval push to parent. Approval = transient (15 min).

§1.8  **Content filter override.** Parent can: disable AI dialogue (forces scripted only); restrict friend graph (invite-code only OR fully off); restrict push notifications; restrict ad rewarded-video.

§1.9  **Endpoint — family state.** `GET /v1/sub/family/state` returns full family + per-child summaries.

§1.10  **Endpoint — child action.** `POST /v1/sub/family/child/:childId/pause`, `/unpause`, `/delete`, `/set-cap`.

§1.11  **Endpoint — approve spend.** `POST /v1/sub/family/spend-approval/:requestId/approve` or `/reject`.

§1.12  **Family Sharing OS integration.** Apple Family Sharing / Google Family Library — Apple/Google handle the IAP family approval flow. Our system pre-emptively gates AT the in-app surface (per §1.7) so OS prompt is the second layer.

§1.13  **Cross-SKU family link.** Parent on standard SKU + children on kids SKU. The `family_links` table joins across the 2 Supabase projects. Each parent action MUST authorise across both projects (signed cross-project token).

§1.14  **DSR cascade.** Per TASK-LEGAL-001 §3.6 — deleting parent's account triggers child profile review (parent confirms child's data also deletes). Child data deletion follows kids-SKU 30-day retention rules.

§1.15  **Family tier audit retention.** 7 years (kids).

§1.16  **Family tier vs Pet+ upgrade path.** A Pet+ subscriber can upgrade to Family tier via in-app upgrade. Apple/Google handle proration. Downgrade allowed; existing child profiles enter read-only mode if family tier ends + are deleted within 30 days.

§1.17  **Locale parental copy.** All parental UI strings reviewed by DPO + localised per TASK-I18N-001.

§1.18  **Push notifications to parent.** Spend approvals + friend approvals send push to parent — independent of children's notifications.

§1.19  **No content moderation outsource.** AI dialogue logs reviewed by parent dashboard. T&S team for offensive UGC submitted by child.

§1.20  **Analytics.** `sub.family.subscribed`, `sub.family.child_added`, `sub.family.spend_approved`, `sub.family.spend_rejected`, `sub.family.screen_cap_hit`, `sub.family.child_paused` per TASK-OBS-001.

---

## §2 — Why this design

**Why $9.99 / ~2× Pet+.** Plan §PART 6 — family tiers across competitors land at 2× single-user.

**Why 5 child profiles.** Plan §PART 6 — typical household size + Apple/Google Family Sharing limits.

**Why parental dashboard mandatory.** COPPA-2025 §1.5 + TASK-AUTH-003. Without it, kids SKU has no parental oversight surface beyond Apple/Google level.

**Why VPC per child.** COPPA — even with adult Family Sharing membership, each child needs explicit parental consent (the parent IS the consenter, but legally each child requires its own).

**Why spend cap defaults to 0.** Default-safe. Parent must actively raise.

**Why content filter override.** Plan §PART 8 — some parents want stricter than default (no AI dialogue even for 13+).

**Why pre-emptive approval gate.** Apple's Family Sharing approval is OS-level + sometimes slow. Our pre-emptive approval pushes the decision to parent's notification in our app + OS Family Sharing as second layer.

**Why cross-SKU family link.** Parent is on standard SKU (Apple/Google adult account); children on kids SKU (separate Supabase project). The link table bridges.

**Why DSR cascade.** Parental account deletion typically wants child data also gone.

**Why no content moderation outsource.** Plan §PART 8 — Family tier is too kid-adjacent to outsource trust decisions.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/sub/family/family.controller.ts
@Controller('v1/sub/family')
@UseGuards(SupabaseJwtGuard)
export class FamilyController {
  @Get('state')
  async state(@CurrentUser() u: AuthedUser) { return this.svc.state(u.id); }

  @Post('child')
  async addChild(@CurrentUser() u: AuthedUser, @Body() body: { display_name: string; birth_year: number }) {
    return this.svc.addChild(u, body.display_name, body.birth_year);
  }

  @Post('child/:childId/pause')
  async pause(@CurrentUser() u: AuthedUser, @Param('childId') childId: string) {
    return this.svc.pauseChild(u.id, childId);
  }

  @Post('spend-approval/:requestId/:decision')
  async approve(@CurrentUser() u: AuthedUser, @Param('requestId') reqId: string, @Param('decision') decision: 'approve' | 'reject') {
    return this.svc.handleSpendApproval(u.id, reqId, decision);
  }
}
```

```typescript
// apps/api/src/sub/family/family.service.ts (excerpt)
async addChild(u: AuthedUser, displayName: string, birthYear: number) {
  if (await this.entitlement.tier(u.id) !== 'family') throw new HttpException('family.tier.required', 402);
  if (await this.countChildren(u.id) >= 5) throw new HttpException('family.child_limit', 422);
  const age = new Date().getFullYear() - birthYear;
  const audience = age < 13 ? 'under-13' : '13+';
  // Trigger TASK-AUTH-003 parental consent flow.
  const consentId = await this.parentalConsent.startNewConsentFlow({
    childDisplayName: displayName,
    parentEmail: u.email,
    triggeredByFamilyTier: true,
  });
  // Cross-SKU: child row created on kids Supabase project once consent granted (webhook).
  await this.supa.from('family_links').insert({
    parent_user_id: u.id, child_pending_consent_id: consentId, child_audience: audience, tenant_id: u.tenant_id,
  });
  return { consent_id: consentId, status: 'pending_consent' };
}
```

```sql
-- migration
create table public.family_links (
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  child_user_id uuid,                            -- nullable until consent grants
  child_pending_consent_id text,
  child_audience text check (child_audience in ('under-13', '13+')),
  screen_time_minutes_per_day int,
  monthly_hearts_spend_cap int default 0,
  ai_dialogue_disabled boolean default false,
  friend_requests_require_approval boolean default true,
  ads_disabled boolean default true,
  paused_at timestamptz,
  tenant_id text not null default 'mochi',
  added_at timestamptz not null default now(),
  primary key (parent_user_id, coalesce(child_user_id, child_pending_consent_id))
);
alter table public.family_links enable row level security;
create policy "family self" on public.family_links for select using (parent_user_id = auth.uid());

create table public.spend_approval_requests (
  id text primary key,
  parent_user_id uuid not null,
  child_user_id uuid not null,
  product_id text not null,
  price_hearts int not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now()
);
```

---

## §4 — Acceptance criteria

**AC1.** Family tier subscription ($9.99/mo) via Apple/Google works. Verified.
**AC2.** Adding a child triggers TASK-AUTH-003 consent flow. Verified.
**AC3.** Up to 5 children; 6th rejected. Verified.
**AC4.** Screen-time cap enforced — over-cap launch shows "time's up". Verified.
**AC5.** Spend cap default 0 — IAP attempt triggers parent approval push. Verified.
**AC6.** Content filter (AI dialogue disabled) honoured even for 13+ child. Verified.
**AC7.** Parental dashboard shows per-child summary. Verified.
**AC8.** Pause child instant-suspends app access. Verified.
**AC9.** Delete child triggers DSR-erasure. Verified.
**AC10.** Friend-request approval queue functions. Verified.
**AC11.** Cross-SKU family link works across Supabase projects. Verified.
**AC12.** Spend approval 15-min expiry. Verified.

---

## §5 — Verification

```typescript
describe('TASK-SUB-002 — Family tier', () => {
  it('enforces 5-child limit', async () => {
    for (let i = 0; i < 5; i++) await svc.addChild(parent, `child${i}`, 2018);
    await expect(svc.addChild(parent, 'sixth', 2018)).rejects.toThrow(/child_limit/);
  });

  it('rejects child IAP without approval', async () => {
    await mockChild('c1', { spend_cap_hearts: 0 });
    await expect(iap.validateAndGrant(user('c1'), 'apple', 'tx-hearts')).rejects.toThrow(/parental_approval_required/);
  });

  it('content filter disables AI dialogue', async () => {
    await mockChild('c1', { ai_dialogue_disabled: true, audience: '13+' });
    const r = await ai.speak('petX', user('c1').id, 'idle');
    expect(r.source_model).toBe('scripted_fallback');
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/sub/family/parental-dashboard.service.ts
@Injectable()
export class ParentalDashboardService {
  async childSummary(parentId: string, childId: string) {
    const today = todayInUserRegion(parentId);
    const [timeSpent, spend, friends, dialogueCount] = await Promise.all([
      this.timeSpentMinutes(childId, today),
      this.heartsSpent(childId, currentMonth()),
      this.friendList(childId),
      this.aiDialogueCount(childId, today),
    ]);
    return { childId, time_spent_today_min: timeSpent, hearts_spent_this_month: spend, friend_count: friends.length, ai_dialogues_today: dialogueCount };
  }
}
```

---

## §7 — Dependencies

**External:** Apple Family Sharing API; Google Family Library API; TASK-AUTH-003 Safe Harbor vendor.
**Internal:** TASK-SUB-001 (Pet+ baseline), TASK-AUTH-003 (parental consent), TASK-AI-001/002 (content filter override), TASK-LEGAL-001 (DSR + DPO).
**Blocks:** none.

---

## §8 — Example payloads

```http
GET /v1/sub/family/state
→ 200
{
  "tier": "family",
  "children": [
    { "id": "01HU...", "display_name": "Anh", "audience": "under-13", "screen_time_today_min": 14, "hearts_spent_this_month": 0, "spend_cap": 0, "ai_dialogue_disabled": false, "paused": false },
    ...
  ]
}
```

```json
{ "event": "sub.family.child_added", "parent_id": "01HU...", "child_pending_consent_id": "01HCNST...", "audience": "under-13" }
```

```json
{ "event": "sub.family.spend_approved", "parent_id": "01HU...", "child_id": "01HU...", "product_id": "mochi.hearts.30", "price_hearts": 30 }
```

```http
POST /v1/sub/family/spend-approval/01HSPND.../approve
→ 200 { "request_id": "01HSPND...", "status": "approved", "valid_until": "..." }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 5 vs more children? → §1.1 — 5 + Apple/Google limits.
- **OQ-2 (resolved):** Default spend cap? → §1.7 — 0 (default-safe).
- **OQ-3 (resolved):** AI dialogue override for 13+? → §1.8 — yes, parent's call.
- **OQ-4 (resolved):** Cross-SKU family link? → §1.13 — yes.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Parental consent flow times out | Apple webhook delay | Pending state | Surface "Resend consent email" |
| 2 | Cross-SKU token forge | RLS + token sign | Privacy | Tighten signing |
| 3 | Spend approval push not received | Polling fallback | Approval pending | UX surfaces "Check your other device" |
| 4 | Screen-time cap miscounts via timezone | Region-aware | Wrong cut-off | TZ-locked |
| 5 | Cascade delete on family unsubscribe leaves orphans | Audit | Data lingers | 30-day delete grace |
| 6 | Family tier downgrade with active children | 30-day grace | Children read-only | UX clarifies |
| 7 | AI dialogue filter bypass via direct API | RLS + override check | Blocked | Verified |
| 8 | DSR cascade child without parent confirm | Manual confirm UX | Avoids accidental | Pre-deletion warning |
| 9 | Friend approval queue grows unbounded | Cap notifications | Backlog | Per-child cap |
| 10 | Apple Family Sharing approval skipped | OS-level | Our pre-emptive catches | Two-layer |
| 11 | Audit retention | DPO | 7-yr | Configured |
| 12 | Locale missing parental copy | EN fallback | Mild | i18n batch |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (Family tier), plan §PART 8 (COPPA + parental dashboard).

**Sub-decisions punted to ops:** Specific dashboard UI design + DPO copy review.

**Anti-patterns explicitly forbidden:**
- Family tier without per-child consent.
- Real-money child spend without approval.
- Cross-tenant family.

**Cross-reference:** TASK-SUB-001 baseline; TASK-AUTH-003 consent; TASK-AI-002 filter; TASK-VIRAL-005 push.
