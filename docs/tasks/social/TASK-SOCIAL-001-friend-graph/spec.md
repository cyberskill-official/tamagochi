---
id: TASK-SOCIAL-001
title: "Friend graph — invite codes + accept/reject + blocklist + Colyseus presence (kids: invite-only, no name search)"
module: SOCIAL
priority: MUST
status: done
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-AUTH-001, TASK-AUTH-003, TASK-INFRA-002, TASK-INFRA-003, TASK-LEGAL-001, TASK-SOCIAL-002, TASK-SOCIAL-003, TASK-SOCIAL-004, TASK-OBS-001, TASK-SUB-002]
depends_on: [TASK-AUTH-003, TASK-INFRA-002]
blocks: [TASK-SOCIAL-002, TASK-SOCIAL-003, TASK-SOCIAL-004]
effort_hours: 10
new_files:
  - "apps/api/src/social/friends/friends.controller.ts"
  - "apps/api/src/social/friends/friends.service.ts"
  - "apps/api/src/social/friends/invite-code.service.ts"
  - "apps/api/src/social/friends/blocklist.service.ts"
  - "apps/api/src/social/friends/__tests__/friends.spec.ts"
  - "apps/api/src/social/friends/__tests__/invite-code.spec.ts"
  - "apps/cocos/assets/_root/social/FriendsListUi.ts"
  - "apps/cocos/assets/_root/social/InviteCodeUi.ts"
  - "infra/supabase/standard/migrations/20260517_018_friends.sql"
modified_files:
  - "apps/realtime/src/presence/redisPresence.ts"
allowed_tools:
  - "Crockford base32 invite codes with checksum (TASK-AUTH-003 pattern)"
  - "Colyseus RedisPresence for online status"
  - "Postgres `friends` join table"
disallowed_tools:
  - "Name search on kids SKU (TASK-LEGAL-001 + TASK-AUTH-003 invite-code-only)"
  - "Public friend lists exposing identity"
  - "Auto-friend on any signal (always explicit accept)"
  - "Friend-of-friend recommendation surfaces at P2 (deferred — privacy review needed)"
risk_if_skipped: "Plan §PART 3 social hook + plan §PART 7 viral loops. TASK-SOCIAL-002 PetPair / TASK-SOCIAL-003 trade / TASK-SOCIAL-004 wedding ALL require a friend graph. Without it, the social P2 slice collapses."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Friend representation.** A friendship is an asymmetric pair `(user_a, user_b)` with `status ∈ {pending, accepted, removed}`. Both directions must accept independently — if A invites B, B's record is `pending` until B accepts.

§1.2  **Invite codes.** Per TASK-AUTH-003 §1.2, invite codes are 8-char Crockford base32 with checksum. Each player generates a personal invite code on demand (regenerable). Active code is one-per-player; regenerating invalidates the prior.

§1.3  **Code redemption.** `POST /v1/friends/redeem-code` — body `{ code: string }`. Resolves to the code-owner's user_id; creates a pending friendship in both directions; sends an in-app notification to the code-owner ("X wants to be your friend").

§1.4  **Accept / reject.** `POST /v1/friends/:friendUserId/accept` and `/reject` endpoints. On accept, both rows transition to `accepted`. On reject, the request is silently dropped (no notification — anti-harassment).

§1.5  **Remove friend.** `DELETE /v1/friends/:friendUserId` removes the friendship from both sides. No notification sent. Once removed, the same pair cannot create a new pending friendship for 7 days (anti-spam).

§1.6  **Block.** `POST /v1/friends/:userId/block` adds to blocklist. Blocked users cannot send invite codes that resolve to your account; existing friendship is removed; any pending breeding (TASK-PET-007 will allow cross-player in P3+) is cancelled.

§1.7  **No name search on kids SKU.** Per TASK-LEGAL-001 §1.5 + TASK-AUTH-003, kids SKU MUST only allow invite-code addition. No "find friends by username." Standard SKU may surface "people you may know" only via co-parent introduction (P3+).

§1.8  **Friend list query.** `GET /v1/friends` — returns `{ friends: [{ user_id, display_name, presence: 'online'|'offline', last_seen_at, friendship_started_at }], pending_outgoing: [...], pending_incoming: [...] }`.

§1.9  **Presence via Colyseus.** Online status MUST come from Colyseus RedisPresence (TASK-INFRA-002 §1.4). Updated in real-time as friends connect/disconnect from their PetRoom.

§1.10  **Friendship limit.** 100 friends per player. Beyond → 422 `friend.limit.exceeded`. Pet+ raises to 500.

§1.11  **Pending limit.** 20 outstanding pending requests per player (anti-spam).

§1.12  **Cross-tenant scoping.** Friends must share `tenant_id`. Consumer Mochi cannot friend a B2B tenant player.

§1.13  **Cross-SKU scoping.** A 13+ player CANNOT friend an under-13 player directly. Under-13 friends only other under-13 players via invite code (kids SKU). TASK-AUTH-001 §1.9 cross-SKU isolation extends here.

§1.14  **Friend display_name privacy.** Standard SKU shares display_name with friends. Kids SKU restricts display to a kid-friendly alias (player's first 6 chars of player_id by default) — no real display_name exposed.

§1.15  **Audit + analytics.** `social.friend.code_generated`, `social.friend.invite_redeemed`, `social.friend.accepted`, `social.friend.rejected`, `social.friend.removed`, `social.friend.blocked`, `social.friend.limit_reached` per TASK-OBS-001.

§1.16  **Real-time friend updates.** When a friend's presence changes, Colyseus broadcasts `friend.presence.changed { friend_user_id, online }` to the connected player.

§1.17  **Idempotency.** Code redemption + accept/reject all support idempotency keys.

§1.18  **DSR.** Per TASK-LEGAL-001, friend list deletion is part of account-deletion cascade.

§1.19  **Performance.** Friend list query P95 ≤ 200ms with 100 friends. Composite index on `(user_a, status)`.

§1.20  **Blocklist visibility.** Player can see their own blocklist via `GET /v1/friends/blocked` and unblock with `DELETE /v1/friends/blocked/:userId`.

---

## §2 — Why this design

**Why asymmetric friendship rows.** Allows independent unfriend without race conditions on the other side's state.

**Why invite code over username search on kids.** TASK-AUTH-003 + TASK-LEGAL-001 §1.5 — under-13 + COPPA. Invite code requires explicit out-of-band sharing.

**Why no rejection notification.** Anti-harassment. Receiving "X rejected your request" can be hurtful, especially for kids.

**Why 7-day cooldown on re-add.** Anti-spam after remove. Prevents harassment loops.

**Why 100 limit / 500 Pet+.** Plan §PART 3 — most players have <50 active friends; 100 is generous. 500 Pet+ is "you actively maintain a network" tier.

**Why kid display_name aliased.** COPPA-2025 — minimizing identifying info to peers. The alias is enough to recognize without disclosing real identity.

**Why no friend-of-friend at P2.** Privacy review needed for the recommendation surface; defer to P3+ with explicit gate.

**Why presence in Colyseus, not Postgres.** Real-time + ephemeral. Postgres roundtrip would block scalability.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/social/friends/friends.controller.ts
@Controller('v1/friends')
@UseGuards(SupabaseJwtGuard)
export class FriendsController {
  constructor(private readonly svc: FriendsService, private readonly inv: InviteCodeService) {}

  @Get() async list(@CurrentUser() u: AuthedUser) { return this.svc.list(u.id); }

  @Post('redeem-code')
  async redeem(@CurrentUser() u: AuthedUser, @Body() body: { code: string }) {
    return this.inv.redeem(u, body.code);
  }

  @Post(':friendUserId/accept')
  async accept(@CurrentUser() u: AuthedUser, @Param('friendUserId') friendId: string) {
    return this.svc.accept(u.id, friendId);
  }

  @Delete(':friendUserId')
  async remove(@CurrentUser() u: AuthedUser, @Param('friendUserId') friendId: string) {
    return this.svc.remove(u.id, friendId);
  }

  @Post(':userId/block')
  async block(@CurrentUser() u: AuthedUser, @Param('userId') uid: string) {
    return this.svc.block(u.id, uid);
  }
}
```

```typescript
// apps/api/src/social/friends/invite-code.service.ts
@Injectable()
export class InviteCodeService {
  async generate(userId: string): Promise<string> {
    let code: string;
    do { code = generateCrockford32WithChecksum(8); }
    while (await this.exists(code));
    await this.supa.from('friend_invite_codes').upsert({ user_id: userId, code, created_at: new Date().toISOString() });
    return code;
  }

  async redeem(u: AuthedUser, code: string): Promise<{ pending_with_user_id: string }> {
    const { data: target } = await this.supa.from('friend_invite_codes').select('user_id').eq('code', code).maybeSingle();
    if (!target) throw new HttpException('friend.code.invalid', 404);
    if (target.user_id === u.id) throw new HttpException('friend.code.self', 422);
    if (await this.blocklist.isBlocked(target.user_id, u.id)) throw new HttpException('friend.code.blocked', 403);
    if (await this.crossSku(u.id, target.user_id)) throw new HttpException('friend.cross_sku', 403);
    await this.friends.createPending(u.id, target.user_id);
    return { pending_with_user_id: target.user_id };
  }
}
```

```sql
-- migration
create table public.friends (
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','accepted','removed')),
  initiated_by uuid not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  removed_at timestamptz,
  tenant_id text not null default 'mochi',
  primary key (user_a, user_b),
  check (user_a != user_b)
);
create index on public.friends (user_a, status);
create index on public.friends (user_b, status);
alter table public.friends enable row level security;
create policy "friends self" on public.friends for select using (user_a = auth.uid() or user_b = auth.uid());

create table public.friend_invite_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[0-9A-HJKMNPQRSTVWXYZ]{8}$'),
  created_at timestamptz not null default now()
);

create table public.friend_blocklist (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.friend_blocklist enable row level security;
create policy "blocklist self" on public.friend_blocklist for select using (blocker_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** Code generation + redemption flow end-to-end. Verified. **AC2.** Self-redemption returns 422. Verified. **AC3.** Cross-SKU redemption returns 403. Verified. **AC4.** Cross-tenant blocked. Verified. **AC5.** Accept flips both rows to accepted. Verified. **AC6.** Reject silently drops (no notification). Verified by spy on notification. **AC7.** 100-friend limit + Pet+ 500 enforced. Verified. **AC8.** 7-day re-add cooldown after remove. Verified. **AC9.** Kids SKU no name search — endpoint returns 403. Verified. **AC10.** Display_name alias on kids SKU. Verified. **AC11.** Presence broadcast via Colyseus. Verified by integration test. **AC12.** Blocklist prevents redemption. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/social/friends/__tests__/friends.spec.ts
describe('TASK-SOCIAL-001 — friends', () => {
  it('redeem creates pending in both directions', async () => {
    const code = await inv.generate(user('u1'));
    const r = await inv.redeem(user('u2'), code);
    expect(r.pending_with_user_id).toBe(user('u1').id);
    const list1 = await svc.list(user('u1').id);
    const list2 = await svc.list(user('u2').id);
    expect(list1.pending_incoming.length).toBe(1);
    expect(list2.pending_outgoing.length).toBe(1);
  });

  it('blocks cross-SKU redemption', async () => {
    const kidUser = user('kid', { audience: 'under-13' });
    const adultUser = user('adult', { audience: '13+' });
    const code = await inv.generate(kidUser);
    await expect(inv.redeem(adultUser, code)).rejects.toMatchObject({ status: 403 });
  });

  it('enforces 100 friend limit', async () => {
    await seedFriends('u1', 100);
    await expect(svc.createPending('u1', 'u-new')).rejects.toMatchObject({ status: 422 });
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/social/friends/friends.service.ts
@Injectable()
export class FriendsService {
  async createPending(userA: string, userB: string) {
    if (await this.countFriends(userA) >= this.limitFor(userA)) throw new HttpException('friend.limit.exceeded', 422);
    if (await this.countPending(userA) >= 20) throw new HttpException('friend.pending.limit', 422);
    await this.supa.from('friends').insert([
      { user_a: userA, user_b: userB, status: 'pending', initiated_by: userA },
      { user_a: userB, user_b: userA, status: 'pending', initiated_by: userA },
    ]);
  }

  async accept(userA: string, userB: string) {
    await this.supa.from('friends').update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .or(`and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`)
      .eq('status', 'pending');
  }
}
```

---

## §7 — Dependencies

**External:** Colyseus RedisPresence (TASK-INFRA-002). **Internal:** TASK-AUTH-003 (kid SKU separation), TASK-LEGAL-001 (DSR + alias), TASK-SUB-002 (Pet+ limit raise). **Blocks:** TASK-SOCIAL-002/003/004.

---

## §8 — Example payloads

```http
POST /v1/friends/redeem-code
{ "code": "K7QGZK4X" }
→ 200 { "pending_with_user_id": "01HU..." }
```

```http
GET /v1/friends
→ 200
{
  "friends": [{ "user_id": "01HU...", "display_name": "Linh", "presence": "online", "last_seen_at": "...", "friendship_started_at": "..." }],
  "pending_incoming": [], "pending_outgoing": [{ "user_id": "01HU...", "code_used": "K7QGZK4X" }]
}
```

```json
{ "event": "social.friend.accepted", "user_a": "01HU...", "user_b": "01HU...", "occurred_at": "..." }
```

```json
{ "error": "friend.limit.exceeded", "current": 100, "limit": 100, "tier": "free" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Asymmetric rows? → §1.1 + §2.
- **OQ-2 (resolved):** Rejection notification? → §1.4 — silent.
- **OQ-3 (resolved):** Friend-of-friend recs? → §`disallowed_tools` — defer.
- **OQ-4 (resolved):** Kid display_name policy? → §1.14.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Code collision (Crockford space) | DB unique constraint | Retry generate | New code |
| 2 | Race on accept (concurrent) | Audit | Idempotent SQL | Mutex via SQL `WHERE status=pending` |
| 3 | Cross-SKU bypass via code | Spec test | COPPA risk | Validation enforced |
| 4 | Cross-tenant friend | RLS audit | Privacy | RLS denies query |
| 5 | Blocklist evasion via account swap | Manual review | Limited recourse | DPO escalation |
| 6 | Friend limit Pet+ entitlement bug | Stub returns wrong | TASK-SUB-001 wired later | Conservative cap until then |
| 7 | Presence stale | Colyseus replica issue | UX desync | Refresh on focus |
| 8 | Code redemption replay attack | Idempotency catches | None | Cached response |
| 9 | Display_name alias not applied on kids | UI bug | COPPA risk | Build-target check |
| 10 | DSR cascade leaves friend row orphans | Foreign-key cascade | OK | Cascade defined |
| 11 | Pending limit exceeded by spam | 422 returned | Anti-spam works | User can reject pending |
| 12 | RLS misconfig exposing friends list | Spec test | Privacy | Audit tight |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (friend graph), §PART 8 (kids COPPA invite-only).

**Sub-decisions punted to ops:** Friend limit (100/500) tunable.

**Anti-patterns explicitly forbidden:**
- Name search on kids SKU.
- Auto-friend on any signal.
- Rejection notification.

**Cross-reference:** TASK-SOCIAL-002 PetPair / TASK-SOCIAL-003 trade / TASK-SOCIAL-004 wedding all consume this graph.
