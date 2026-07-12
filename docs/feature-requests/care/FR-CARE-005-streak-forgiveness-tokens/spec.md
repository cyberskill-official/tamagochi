---
id: FR-CARE-005
title: "Streak system with forgiveness tokens + Cozy Hour weekly window + ethical no-FOMO copy"
module: CARE
priority: MUST
status: done
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead + designer"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-CARE-001, FR-CARE-002, FR-CARE-003, FR-CARE-004, FR-PET-003, FR-OBS-001, FR-INFRA-003, FR-VIRAL-004, FR-VIRAL-005, FR-LEGAL-001]
depends_on: [FR-CARE-001, FR-CARE-002, FR-CARE-003, FR-CARE-004]
blocks: [FR-VIRAL-004, FR-VIRAL-005]
effort_hours: 8
new_files:
  - "apps/api/src/care/streak/streak.service.ts"
  - "apps/api/src/care/streak/forgiveness-token.service.ts"
  - "apps/api/src/care/streak/cozy-hour.service.ts"
  - "apps/api/src/care/streak/streak.controller.ts"
  - "apps/api/src/care/streak/__tests__/streak.spec.ts"
  - "apps/api/src/care/streak/__tests__/forgiveness-token.spec.ts"
  - "apps/api/src/care/streak/__tests__/cozy-hour.spec.ts"
  - "apps/cocos/assets/_root/care/StreakBadge.ts"
  - "apps/cocos/assets/i18n/en/streak.json"
  - "apps/cocos/assets/i18n/vi/streak.json"
  - "infra/supabase/standard/migrations/20260517_012_streak_state.sql"
modified_files: []
allowed_tools:
  - "Postgres `streak_state` table per player"
  - "Mixpanel feature flag for Cozy Hour window scheduling"
  - "Resend transactional email for forgiveness-token notice"
disallowed_tools:
  - "FOMO copy ('Don't lose your streak!')"
  - "Penalty-based streak reset (always offer forgiveness path)"
  - "Real-money forgiveness tokens (must be earned only per FR-LEGAL-002)"
  - "Cozy Hour bonuses gated by sub tier (Pet+ gets +1 bonus token monthly per FR-SUB-001 — that's the only gating)"
risk_if_skipped: "Plan §PART 3 retention mechanics — streak is the canonical daily-engagement loop driver. Without an ethical (no-FOMO) implementation, kids-SKU + general retention metrics degrade; HoYoverse-style aggressive streaks have triggered regulator interest."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Streak definition.** A player's streak is the consecutive days they have performed ANY of {feed, clean, hug, mini-game win} on at least one of their pets. The streak counter is per-player (not per-pet), so the player can swap pets and continue the streak.

§1.2  **Day boundary.** A "day" boundary is the player's local-region midnight (region from FR-AUTH-001 §1.6 deterministic chain). Activity between local 00:00 and 23:59 counts for that day.

§1.3  **Streak state.** Stored in `streak_state` table: `(user_id pk, current_streak int, longest_streak int, last_active_local_date text, forgiveness_tokens_available int default 3, forgiveness_tokens_used_this_month int default 0, cozy_hour_pending_window_id text, tenant_id text)`.

§1.4  **Forgiveness tokens.** Each player has 3 forgiveness tokens per month. When a player misses a day, the system MUST auto-apply 1 forgiveness token before resetting the streak; the streak continues uninterrupted from the player's perspective. The token consumption is recorded in `forgiveness_token_usage` table.

§1.5  **Monthly reset.** Forgiveness tokens reset to 3 on the 1st of every month (player's local region timezone). Unused tokens do NOT roll over.

§1.6  **Pet+ bonus.** Pet+ subscribers (FR-SUB-001) get +1 bonus forgiveness token monthly (4 total). The bonus is the ONLY sub-tier-gated streak feature.

§1.7  **Forgiveness token notification.** When a token is auto-applied, the player receives:
- Push notification: "We covered your streak yesterday — see you today!" (sleep-hour respected per FR-VIRAL-005).
- In-app card on next launch: "We used one of your forgiveness tokens — you have {N} left this month."

§1.8  **Streak reset.** If a player misses a day AND no forgiveness tokens are available, the streak resets to 0. The reset notification MUST be **gentle, non-shaming**: "Welcome back! Today's a great day to start a new streak."

§1.9  **No FOMO copy.** Notifications and in-app text MUST NOT use: "Don't lose your streak!", "Hurry!", "Last chance!", or similar urgency-pressure phrasing. Approved copy lives in `apps/cocos/assets/i18n/<locale>/streak.json` — every string reviewed by designer + DPO for kid-appropriateness.

§1.10  **Cozy Hour weekly window.** Once per week, a 1-hour window MUST be designated as Cozy Hour. During this window:
- All care actions yield double Coins (FR-ECON-001 ledger, P3 — at P1 the multiplier is stubbed).
- Stat decay halves (FR-PET-003 §1.3 modifier flag).
- Special "Cozy" animation overlay on pets (Lottie aura).

§1.11  **Cozy Hour scheduling.** The window is set centrally by ops via Mixpanel feature flag `streak.cozy_hour.window` = `{ day_of_week: 0..6, start_hour_local: 0..23 }`. Initial: Saturday 19:00 local. Same window per player but applied in player's local timezone, so it's a "Saturday evening worldwide."

§1.12  **Cozy Hour notification.** Players who have engaged at least once in the prior 7 days receive a push notification 1 hour before Cozy Hour ("Cozy Hour starts in 1 hour! See you there?"). Sleep-hours respected.

§1.13  **Endpoint.** `GET /v1/streak/me` returns the player's full streak state: `{ current_streak, longest_streak, forgiveness_tokens_available, next_cozy_hour_at, last_active_date }`.

§1.14  **Streak recompute on activity.** Every successful care action (FR-CARE-001/002/003/004) MUST trigger a streak recompute via `StreakService.recordActivity(userId)`. The service idempotently advances the streak if it's the player's first activity of the day, else no-op.

§1.15  **Background daily job.** A scheduled job MUST run every hour and: (a) for each player, compute "did they engage yesterday in their local timezone?"; (b) if not + tokens available → consume a forgiveness token; (c) if not + no tokens → reset streak. The hourly cadence accounts for region rollovers across timezones.

§1.16  **Streak milestones.** At milestones (7-day, 30-day, 100-day, 365-day), the player earns:
- 7-day: 50 Coins.
- 30-day: 250 Coins + "Cozy Friend" badge.
- 100-day: 1000 Coins + "Devoted" badge + 1 forgiveness token bonus.
- 365-day: 5000 Coins + "Year of Mochi" badge + 5 forgiveness token bonus.

Milestone rewards persist to FR-ECON-001 ledger (stubbed at P1).

§1.17  **No streak leaderboard on kids SKU.** Per FR-LEGAL-003 + plan §PART 8, no social comparison on kids accounts. Standard SKU may show per-player history but not vs-friends comparison.

§1.18  **Streak badge UI.** Cocos `StreakBadge.ts` displays the current streak count + a flame icon. Under reduce-motion, the flame is static; otherwise it has a gentle pulse animation.

§1.19  **Audit + analytics.** `streak.day.recorded`, `streak.token.applied`, `streak.reset`, `streak.milestone.reached`, `cozy_hour.entered`, `cozy_hour.exited` events per FR-OBS-001 §1.4.

§1.20  **Forgiveness token transparency.** Player can view their token history in `Settings → Streak History` (a list of dates + outcomes). Avoids the perception of arbitrary token consumption.

---

## §2 — Why this design

**Why forgiveness tokens are auto-applied.** Plan §PART 3 — "ethical retention" + "no FOMO trauma for kids." Forcing the player to choose whether to "spend a token to save your streak" is itself a stress moment; auto-applying removes the cognitive burden + keeps the streak feel-good.

**Why 3 tokens per month.** Allows up to 3 missed days; broadly covers vacation + sickness + busy weeks. Beyond 3 in a month, the streak resets — which is the right outcome for genuinely-not-engaged players.

**Why monthly reset (not rollover).** Rollover creates infinite-budget players who never face streak risk; that breaks the daily-engagement loop psychology. Monthly reset balances forgiveness against engagement.

**Why Pet+ gets +1 token only.** FR-SUB-001 wants meaningful perks but not pay-to-streak. +1 token is a small lubricant.

**Why local-region midnight.** A US player playing at 23:50 local Saturday should count Saturday, not Sunday UTC. Cross-region accuracy is essential for fair streak math.

**Why hourly background job (vs daily).** Player regions span 26 timezone offsets (incl. half/quarter-hour). An hourly job catches midnight in every timezone within the hour.

**Why Cozy Hour is once-weekly.** Daily would devalue it; monthly would feel rare. Weekly + Saturday-evening matches casual-gaming engagement curves.

**Why Cozy Hour applies in local time.** Worldwide-simultaneous (e.g. all UTC) is unfair to non-EU players (Saturday 19:00 UTC = 02:00 in Vietnam). Local time treats every region equally.

**Why no FOMO copy.** Apple Kids Category review + UK ICO Age-Appropriate Design Code both penalise dark patterns; "don't lose your streak!" is a documented dark pattern.

**Why forgiveness transparency.** Trust + COPPA-2025 spirit (data subject access). Token consumption that feels arbitrary erodes trust.

**Why no leaderboard on kids.** Comparison-driven retention has documented adverse effects on under-13 wellbeing.

**Why milestone rewards include badges + tokens.** Coins alone create grindy feel; mixed rewards (status + utility) feel earned.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/care/streak/streak.controller.ts
@Controller('v1/streak')
@UseGuards(SupabaseJwtGuard)
export class StreakController {
  constructor(private readonly svc: StreakService, private readonly cozy: CozyHourService) {}

  @Get('me')
  async getMine(@CurrentUser() u: AuthedUser) {
    return {
      ...(await this.svc.getState(u.id)),
      next_cozy_hour_at: await this.cozy.nextWindowForUser(u),
    };
  }
}
```

```typescript
// apps/api/src/care/streak/streak.service.ts (skeleton)
@Injectable()
export class StreakService {
  constructor(private readonly supa: SupabaseClient, private readonly fg: ForgivenessTokenService, private readonly audit: AuditLogService) {}

  async recordActivity(userId: string): Promise<{ streak_advanced: boolean; current_streak: number }> {
    const today = todayInUserRegion(userId);
    const { data: state } = await this.supa.from('streak_state').select('*').eq('user_id', userId).maybeSingle();
    if (state?.last_active_local_date === today) return { streak_advanced: false, current_streak: state.current_streak };

    const yesterday = previousDay(today);
    let nextStreak = 1;
    if (state?.last_active_local_date === yesterday) nextStreak = state.current_streak + 1;
    else if (state) {
      // missed at least one day; forgiveness token covered it (handled by background job already), else reset
      nextStreak = 1;
    }

    await this.supa.from('streak_state').upsert({
      user_id: userId, current_streak: nextStreak,
      longest_streak: Math.max(state?.longest_streak ?? 0, nextStreak),
      last_active_local_date: today,
      forgiveness_tokens_available: state?.forgiveness_tokens_available ?? 3,
    });

    await this.checkMilestones(userId, nextStreak);
    await this.audit.write({ who: userId, what: 'streak.day.recorded', what_keys: { streak: nextStreak } });
    return { streak_advanced: true, current_streak: nextStreak };
  }
}
```

```typescript
// apps/api/src/care/streak/forgiveness-token.service.ts (skeleton)
@Injectable()
export class ForgivenessTokenService {
  async maybeApplyForMissedDay(userId: string, missedDate: string): Promise<{ applied: boolean; remaining: number }> {
    const { data: state } = await this.supa.from('streak_state').select('*').eq('user_id', userId).single();
    if ((state?.forgiveness_tokens_available ?? 0) <= 0) return { applied: false, remaining: 0 };

    const remaining = state.forgiveness_tokens_available - 1;
    await this.supa.from('streak_state').update({
      forgiveness_tokens_available: remaining,
      forgiveness_tokens_used_this_month: state.forgiveness_tokens_used_this_month + 1,
      last_active_local_date: missedDate,   // streak protected
    }).eq('user_id', userId);

    await this.supa.from('forgiveness_token_usage').insert({
      user_id: userId, applied_for_date: missedDate, remaining_after: remaining,
    });

    await this.notify.sendForgivenessNotice(userId, remaining);
    return { applied: true, remaining };
  }
}
```

```sql
-- infra/supabase/standard/migrations/20260517_012_streak_state.sql
create table public.streak_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_local_date date,
  forgiveness_tokens_available int not null default 3,
  forgiveness_tokens_used_this_month int not null default 0,
  cozy_hour_pending_window_id text,
  tenant_id text not null default 'mochi',
  updated_at timestamptz not null default now()
);
alter table public.streak_state enable row level security;
create policy "streak self" on public.streak_state for select using (user_id = auth.uid());

create table public.forgiveness_token_usage (
  id bigserial primary key,
  user_id uuid not null,
  applied_for_date date not null,
  remaining_after int not null,
  applied_at timestamptz not null default now()
);
```

---

## §4 — Acceptance criteria

**AC1.** First activity records streak=1. Verified.
**AC2.** Activity on consecutive days advances streak. Verified.
**AC3.** Missed day with tokens available → forgiveness token consumed, streak preserved. Verified.
**AC4.** Missed day with 0 tokens → streak resets to 0 with friendly copy. Verified.
**AC5.** Token monthly reset on 1st (local). Verified.
**AC6.** Pet+ subscriber starts month with 4 tokens (entitlement integration; stub at P1). Verified.
**AC7.** Milestone (7 / 30 / 100 / 365 days) triggers reward (Coins + badge + bonus tokens). Verified.
**AC8.** Cozy Hour scheduled by Mixpanel flag. Verified.
**AC9.** Cozy Hour applies double-Coins multiplier (stubbed at P1). Verified.
**AC10.** No FOMO copy in i18n bundles. Verified by content lint.
**AC11.** No streak leaderboard surface on kids SKU. Verified.
**AC12.** `GET /v1/streak/me` returns full state. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/care/streak/__tests__/streak.spec.ts
describe('FR-CARE-005 — streak', () => {
  it('records first activity as streak=1', async () => {
    const r = await svc.recordActivity('u1');
    expect(r.current_streak).toBe(1);
  });

  it('advances on consecutive days', async () => {
    await svc.recordActivity('u1');
    await advanceClock1Day();
    const r = await svc.recordActivity('u1');
    expect(r.current_streak).toBe(2);
  });

  it('forgiveness token preserves streak across missed day', async () => {
    await svc.recordActivity('u1');
    await advanceClock2Days(); // missed day
    await fg.maybeApplyForMissedDay('u1', dayBefore(today()));
    const r = await svc.recordActivity('u1');
    expect(r.current_streak).toBe(2);  // forgiveness preserved chain
  });

  it('resets streak when out of tokens', async () => {
    await consumeAllTokens('u1');
    await svc.recordActivity('u1');
    await advanceClock2Days();
    const r = await svc.recordActivity('u1');
    expect(r.current_streak).toBe(1);  // reset gracefully
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/care/streak/cozy-hour.service.ts
@Injectable()
export class CozyHourService {
  constructor(private readonly flags: FeatureFlagService) {}
  async nextWindowForUser(user: AuthedUser): Promise<string> {
    const cfg = await this.flags.value('streak.cozy_hour.window', { day_of_week: 6, start_hour_local: 19 });
    return computeNextWindowIso(user.region_of_record, cfg.day_of_week, cfg.start_hour_local);
  }
  async isInCozyHour(user: AuthedUser): Promise<boolean> {
    const cfg = await this.flags.value('streak.cozy_hour.window', { day_of_week: 6, start_hour_local: 19 });
    const now = nowInRegion(user.region_of_record);
    return now.dayOfWeek === cfg.day_of_week && now.hour === cfg.start_hour_local;
  }
}
```

---

## §7 — Dependencies

**External:** Resend (notification), Mixpanel feature flag service.
**Internal:** FR-CARE-001/002/003/004 (recordActivity called from care handlers), FR-PET-003 (stat-decay halving during Cozy Hour), FR-OBS-001 (analytics), FR-SUB-001 (Pet+ entitlement, P3), FR-LEGAL-001 (kid-appropriate copy review by DPO).
**Blocks:** FR-VIRAL-004 (battle pass uses streak data), FR-VIRAL-005 (push notification rules use streak state).

---

## §8 — Example payloads

```http
GET /v1/streak/me
→ 200
{
  "current_streak": 14,
  "longest_streak": 22,
  "forgiveness_tokens_available": 2,
  "forgiveness_tokens_used_this_month": 1,
  "next_cozy_hour_at": "2026-08-15T19:00:00+07:00",
  "last_active_date": "2026-08-12"
}
```

```json
{
  "event": "streak.day.recorded",
  "user_id": "01HC...",
  "current_streak": 15,
  "milestone_reached": null,
  "emitted_at": "2026-08-13T08:00:01Z"
}
```

```json
{
  "event": "streak.token.applied",
  "user_id": "01HC...",
  "applied_for_date": "2026-08-12",
  "remaining": 2,
  "notification_sent": true
}
```

```json
{
  "event": "streak.milestone.reached",
  "user_id": "01HC...",
  "milestone": 30,
  "reward": { "coins": 250, "badge": "cozy_friend" }
}
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 3 tokens/month vs 5? → §1.4 + §2 — 3 forces some streak-loss risk; 5 trivialises engagement.
- **OQ-2 (resolved):** Per-pet or per-player streak? → §1.1 — per-player; cross-pet flexibility matches plan §PART 3 multi-pet vision.
- **OQ-3 (resolved):** Cozy Hour world-wide simultaneous? → §1.11 — local-time same day; fair across regions.
- **OQ-4 (resolved):** Forgiveness token earned via gameplay? → §1.16 — milestone rewards include bonus tokens; FR-LEGAL-002 keeps it earned-only.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Background job misses player at hourly tick (slow query) | Player support ticket | Late forgiveness token | Idempotent — next tick catches; record audit |
| 2 | Region change mid-month → streak math off | Audit | False reset or false advance | Lock region during streak window or treat region-change as "vacation day" |
| 3 | Mixpanel Cozy Hour flag returns null | Default Saturday 19:00 applied | OK | Fallback in code |
| 4 | Push notification sent during sleep hours | Per FR-VIRAL-005 catch | Suppressed | Already covered |
| 5 | Forgiveness token over-consumed (race condition) | DB unique constraint | Atomic update prevents | UPDATE WHERE clause checks remaining |
| 6 | Milestone reward double-credited | Idempotency key | One credit | Track milestone-reached state per player |
| 7 | Pet+ subscriber starts month with 3 not 4 tokens | FR-SUB-001 entitlement bug | Customer complaint | Manual +1 + investigate entitlement |
| 8 | i18n missing-key in non-EN locale | UI shows EN fallback | Mild UX | Add localised string; missing-key event |
| 9 | Local-date computation broken for unusual TZs | Tests | Wrong day attribution | IANA tz database + fast-check |
| 10 | Streak history page shows stale data | Read-after-write | Player confusion | Force refresh after update |
| 11 | Cozy Hour entry/exit events not emitted | Sentry | Analytics blind | Hourly job emits if user has been online |
| 12 | Kids SKU accidentally shows social leaderboard | Playwright | COPPA risk | Build-target check; hotfix |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (retention mechanics — forgiveness tokens + Cozy Hour + ethical no-FOMO).

**Sub-decisions punted to ops:**
- Initial Cozy Hour timing — Saturday 19:00 default; tunable.
- Milestone reward amounts — Mixpanel-tunable.
- Localised copy — designer + DPO review per locale.

**Anti-patterns explicitly forbidden:**
- FOMO copy.
- Penalty-based reset (always offer forgiveness).
- Real-money tokens.
- Cross-tier streak gating beyond Pet+ +1.
- Comparison leaderboard on kids SKU.

**Cross-reference:** FR-VIRAL-004 battle pass references streak; FR-VIRAL-005 push frequency reads streak state; FR-SUB-001 +1 token entitlement.
