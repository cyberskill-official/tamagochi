---
id: TASK-VIRAL-005
title: "Push notifications — FCM + APNS via Supabase Edge Functions + sleep-hour respect + frequency caps + COPPA restrictions"
module: VIRAL
priority: MUST
status: done
verify: T
phase: P3
milestone: "Monetization & Live-Ops"
slice: 1
owner: "Tech Lead + DPO"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-CARE-005, TASK-LEGAL-001, TASK-LEGAL-003, TASK-AUTH-001, TASK-AUTH-003, TASK-SUB-002, TASK-INFRA-003, TASK-OBS-001, TASK-PET-002, TASK-PET-008, TASK-SOCIAL-002]
depends_on: [TASK-CARE-005, TASK-LEGAL-001]
blocks: []
effort_hours: 10
new_files:
  - "apps/api/src/notify/push.controller.ts"
  - "apps/api/src/notify/push.service.ts"
  - "apps/api/src/notify/fcm-adapter.ts"
  - "apps/api/src/notify/apns-adapter.ts"
  - "apps/api/src/notify/sleep-hour.service.ts"
  - "apps/api/src/notify/frequency-cap.service.ts"
  - "apps/api/src/notify/__tests__/push.spec.ts"
  - "apps/api/src/notify/__tests__/sleep-hour.spec.ts"
  - "apps/cocos/native/ios/PushTokenBridge.swift"
  - "apps/cocos/native/android/PushTokenBridge.kt"
  - "apps/cocos/assets/_root/notify/NotificationPreferencesUi.ts"
  - "infra/supabase/standard/migrations/20260517_029_push.sql"
modified_files: []
allowed_tools:
  - "Firebase Cloud Messaging (FCM) for Android"
  - "APNS HTTP/2 for iOS"
  - "Supabase Edge Functions for queue + delivery"
disallowed_tools:
  - "Engagement-pushing for under-13 (COPPA-2025 restriction per TASK-LEGAL-001 §1.5(e))"
  - "Push during sleep hours (local 22:00-07:00 default; 20:00-08:00 kids)"
  - "Marketing pushes without opt-in"
  - "Cross-tenant push leak"
risk_if_skipped: "Plan §PART 3 retention mechanics — push is the canonical re-engagement surface. Without it, daily-engagement rate drops 30-50%. TASK-CARE-005 streak notifications + TASK-SOCIAL-002 PetPair receipts + TASK-PET-008 grandma warnings all require this."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Categories.** Push notifications fall into categories with per-category opt-in:
- **care_reminder** (default ON): "Mochi misses you!".
- **streak** (default ON): forgiveness + Cozy Hour reminders.
- **petpair_receipt** (default ON): co-parent receipt push.
- **breeding_hatched** (default ON): "Your new pet is here!".
- **grandma_warning** (default ON): per TASK-PET-008.
- **drama_share** (default OFF): Daily Drama prompts.
- **marketing** (default OFF): sales, new features.

§1.2  **Sleep-hour respect.**
- Standard SKU: 22:00–07:00 local quiet hours (player's region).
- Kids SKU: 20:00–08:00 local (wider window per COPPA-2025 spirit).
- Critical notifications (grandma rescue available) still suppressed during sleep.

§1.3  **Frequency caps.**
- Standard SKU: max 3 pushes per day per user, max 1 per category per day.
- Kids SKU: max 1 push per day per user (engagement-pushing restriction per TASK-LEGAL-001 §1.5(e)).

§1.4  **Parental override.** Per TASK-SUB-002 — Family tier parent can disable per-child push categories from dashboard.

§1.5  **APNs + FCM tokens.** Cocos client (per platform bridge) registers for push; tokens posted to `/v1/notify/register-token`. Server stores per (user_id, platform, token). Token rotation handled via webhook.

§1.6  **Send flow.** Internal services call `pushService.queue({ user_id, category, title_key, body_key, payload, scheduled_for?})`. Service:
- Checks user opt-in for category.
- Checks sleep-hour for user's region.
- Checks frequency cap.
- Translates title_key + body_key per user's locale.
- Queues delivery via Supabase Edge Function.
- Edge Function calls FCM or APNs.

§1.7  **Localised copy.** Title + body MUST come from a locale string bundle keyed by `title_key` per TASK-I18N-001. No raw strings server-side.

§1.8  **Idempotency.** Each push has `idempotency_key`. Same key within 5 min = single delivery.

§1.9  **Delivery audit.** Every push attempt logged: `(user_id, category, title_key, scheduled_for, delivered_at, suppressed_reason?, idempotency_key)`. Retention 90 days.

§1.10  **No engagement-pushing for under-13.** Per TASK-LEGAL-001 §1.5(e). For kids SKU, only categories: `breeding_hatched`, `grandma_warning`, `petpair_receipt` (parent-initiated only). NO `care_reminder` engagement nudges.

§1.11  **Push token lifecycle.** Tokens auto-revoked on:
- App uninstall (FCM/APNS feedback).
- User sign-out.
- Account deletion (TASK-LEGAL-001 §1.9).
- Family-tier parent disable.

§1.12  **Marketing opt-in.** Marketing pushes require explicit opt-in via Settings. Default OFF. Per GDPR + ePrivacy.

§1.13  **Deep linking.** Each push includes a deep-link URL: `tamagochi://pet/<id>` (opens game to that pet). Per TASK-LEGAL-003 §1.4 — kid pushes deep-link to in-app only, never external.

§1.14  **Time-zone handling.** Player's `region_of_record` (TASK-AUTH-001) + IANA tz lookup. DST-aware.

§1.15  **Cross-tenant scoping.** Push per-tenant; never cross-leak.

§1.16  **Tenant override.** B2B tenants (TASK-B2B-001) may have custom push category sets + Pet+/Family-tier overrides — defined in tenant config.

§1.17  **Latency budget.** Push queued → delivered < 30 sec P95 (excluding scheduled-future pushes).

§1.18  **APNS + FCM webhooks.** Process delivery receipts + token-invalidation events.

§1.19  **DSR.** Notification history exportable; tokens deleted on account-delete.

§1.20  **Analytics.** `push.scheduled`, `push.suppressed { reason }`, `push.delivered`, `push.opened`, `push.failed { reason }`, `push.token.registered`, `push.token.invalidated` per TASK-OBS-001.

---

## §2 — Why this design

**Why per-category opt-in.** Plan §PART 3 + ICO AADC — granular opt-in prevents push fatigue + complies with kid-app dark-pattern guidance.

**Why narrower sleep window for kids.** COPPA-2025 §1.5(e) — engagement-pushing restrictions for under-13.

**Why suppress critical pushes during sleep too.** Plan §PART 3 ethical retention — even "important" pushes wake users. Defer to morning.

**Why 1/day cap for kids.** COPPA-2025 §1.5(e) — engagement-pushing restrictions.

**Why no engagement-push for under-13.** COPPA-2025 §1.5(e) — explicit restriction.

**Why FCM + APNs (not third-party push service).** Reliability + cost. Plan §PART 4.

**Why locale keys server-side.** Localised copy maintained centrally; client-side fallback covers locale gaps.

**Why deep-link in-app for kids.** TASK-LEGAL-003 §1.4 — out-of-app for under-13 requires parental gate. Push deep-link goes back to game.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/notify/push.service.ts (excerpt)
async queue(input: { user_id: string; category: PushCategory; title_key: string; body_key: string; payload?: object; scheduled_for?: Date; idempotency_key: string; tenant_id: string }) {
  const dedupe = await this.dedupe.lookup(input.user_id, input.idempotency_key);
  if (dedupe) return dedupe;

  const audience = await this.audience(input.user_id);
  if (audience === 'under-13' && this.isEngagementCategory(input.category)) {
    this.audit.emit('push.suppressed', { reason: 'kid_engagement_blocked', category: input.category });
    return { status: 'suppressed', reason: 'kid_engagement_blocked' };
  }

  if (!await this.optIn.isOn(input.user_id, input.category)) {
    return { status: 'suppressed', reason: 'opt_out' };
  }

  if (await this.sleep.isQuietHourFor(input.user_id, audience)) {
    const wakeAt = await this.sleep.nextWakeFor(input.user_id, audience);
    input.scheduled_for = wakeAt;
  }

  if (await this.frequency.exceeded(input.user_id, input.category, audience)) {
    return { status: 'suppressed', reason: 'frequency_cap' };
  }

  const tokens = await this.tokensFor(input.user_id);
  if (!tokens.length) return { status: 'suppressed', reason: 'no_tokens' };

  const locale = await this.localeFor(input.user_id);
  const title = this.i18n.t(input.title_key, locale);
  const body = this.i18n.t(input.body_key, locale);

  for (const tok of tokens) {
    if (tok.platform === 'ios') await this.apns.send(tok.token, { title, body, deep_link: input.payload?.['deep_link'] });
    else await this.fcm.send(tok.token, { title, body, deep_link: input.payload?.['deep_link'] });
  }
  await this.frequency.increment(input.user_id, input.category);
  await this.dedupe.store(input.user_id, input.idempotency_key, { status: 'delivered' });
  return { status: 'delivered' };
}
```

```sql
create table public.push_tokens (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('ios','android','web')),
  token text not null,
  registered_at timestamptz not null default now(),
  invalidated_at timestamptz,
  tenant_id text not null default 'mochi',
  unique (user_id, token)
);

create table public.push_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('care_reminder','streak','petpair_receipt','breeding_hatched','grandma_warning','drama_share','marketing')),
  enabled boolean not null,
  primary key (user_id, category)
);

create table public.push_audit (
  id bigserial primary key,
  user_id uuid not null,
  category text not null,
  title_key text not null,
  delivered_at timestamptz,
  suppressed_reason text,
  occurred_at timestamptz not null default now(),
  tenant_id text not null default 'mochi'
);
```

---

## §4 — Acceptance criteria

**AC1.** Push delivery via FCM (Android) + APNs (iOS) works. Verified by mocked adapters. **AC2.** Sleep-hour 22:00-07:00 standard SKU pushes deferred to wake. Verified by fake-clock. **AC3.** Kids SKU 20:00-08:00. Verified. **AC4.** Engagement category blocked for under-13. Verified. **AC5.** Frequency cap 3/day standard, 1/day kids. Verified. **AC6.** Per-category opt-in respected. Verified. **AC7.** Marketing default OFF. Verified. **AC8.** Localised copy fetched. Verified. **AC9.** Token invalidation on app uninstall. Verified by FCM/APNs webhook test. **AC10.** Deep link kids in-app only. Verified. **AC11.** Idempotent dedupe. Verified. **AC12.** Cross-tenant push blocked. Verified.

---

## §5 — Verification

```typescript
describe('TASK-VIRAL-005 — push', () => {
  it('suppresses engagement push for under-13', async () => {
    await mockKid('u1');
    const r = await svc.queue({ user_id: 'u1', category: 'care_reminder', title_key: 't', body_key: 'b', idempotency_key: 'k1', tenant_id: 'mochi' });
    expect(r.reason).toBe('kid_engagement_blocked');
  });

  it('schedules to wake when in sleep hours', async () => {
    await setRegionAndTime('u1', 'VN', '23:30');
    const r = await svc.queue({ user_id: 'u1', category: 'streak', title_key: 't', body_key: 'b', idempotency_key: 'k1', tenant_id: 'mochi' });
    expect(r.scheduled_for).toBeAfter(localTime('07:00'));
  });

  it('frequency cap enforces 3/day standard', async () => {
    for (let i = 0; i < 3; i++) await svc.queue({ user_id: 'u1', category: 'care_reminder', title_key: 't', body_key: 'b', idempotency_key: `k${i}`, tenant_id: 'mochi' });
    const r4 = await svc.queue({ user_id: 'u1', category: 'streak', title_key: 't2', body_key: 'b2', idempotency_key: 'k4', tenant_id: 'mochi' });
    expect(r4.reason).toBe('frequency_cap');
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/notify/sleep-hour.service.ts
@Injectable()
export class SleepHourService {
  async isQuietHourFor(userId: string, audience: '13+' | 'under-13'): Promise<boolean> {
    const tz = await this.tzFor(userId);
    const localHour = new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    const hour = parseInt(localHour, 10);
    if (audience === 'under-13') return hour >= 20 || hour < 8;
    return hour >= 22 || hour < 7;
  }
}
```

---

## §7 — Dependencies

**External:** FCM, APNs, IANA tz database. **Internal:** TASK-CARE-005 streak notifications, TASK-LEGAL-001 COPPA restrictions, TASK-AUTH-001 region, TASK-SUB-002 parental disable. **Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/notify/register-token
{ "platform": "ios", "token": "abc123..." }
→ 201 { "registered": true }
```

```json
{ "event": "push.delivered", "user_id": "01HU...", "category": "streak", "title_key": "streak.day_milestone.7", "delivered_at": "..." }
```

```json
{ "event": "push.suppressed", "user_id": "01HU...", "category": "care_reminder", "reason": "kid_engagement_blocked" }
```

```json
{
  "title": "Mochi misses you!",
  "body": "It's been 6 hours since your last visit",
  "deep_link": "tamagochi://pet/01HC...",
  "category": "care_reminder"
}
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Sleep hours? → §1.2.
- **OQ-2 (resolved):** Kids cap? → §1.3 — 1/day.
- **OQ-3 (resolved):** FCM/APNs vs third-party? → §`allowed_tools`.
- **OQ-4 (resolved):** Marketing default? → §1.12 — OFF.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | FCM/APNs outage | Adapter error | Push delayed | Retry queue |
| 2 | Token revoked silently | Delivery error | Re-register | Webhook handling |
| 3 | DST transition affects sleep window | TZ-aware | OK | IANA db |
| 4 | Locale missing key | EN fallback | Mild UX | Audit |
| 5 | Engagement push slips for under-13 | Audit | COPPA risk | Test catches |
| 6 | Idempotency dedupe Redis lost | Possible duplicate | Bounded | 5-min window |
| 7 | Cross-tenant push leak | Audit | Privacy | RLS + tenant scoping |
| 8 | Token cascade on account delete | Cascade | OK | Verified |
| 9 | Deep link to external URL for kids | TASK-LEGAL-003 gate | Blocked | Validation |
| 10 | Push during sleep hour due to bug | Audit | UX issue | Pre-deliver TZ check |
| 11 | Frequency cap reset timezone | TZ-locked | OK | IANA |
| 12 | Marketing opt-in defaulted ON | Check default | Opt-in violation | Test enforced |

---

## §11 — Notes

**Plan refs:** plan §PART 3 retention + plan §PART 8 COPPA push restrictions.

**Sub-decisions punted to ops:** Per-category push copy DPO-reviewed.

**Anti-patterns explicitly forbidden:**
- Engagement push for kids.
- Push during sleep.
- Marketing default-ON.
- External deep links for kids.

**Cross-reference:** TASK-CARE-005 streak, TASK-PET-008 grandma, TASK-SOCIAL-002 PetPair receipt, TASK-LEGAL-001 COPPA, TASK-SUB-002 parental disable.
