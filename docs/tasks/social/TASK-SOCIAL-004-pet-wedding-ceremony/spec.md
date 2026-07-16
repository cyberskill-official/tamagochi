---
id: TASK-SOCIAL-004
title: "Pet Wedding / Best Friend Ceremony — synchronous 2-player mini-event + married cosmetic + auto-rendered share clip"
module: SOCIAL
priority: SHOULD
status: done
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead + designer"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-SOCIAL-001, TASK-SOCIAL-002, TASK-PET-002, TASK-CARE-003, TASK-INFRA-002, TASK-ART-001, TASK-VIRAL-001, TASK-OBS-001]
depends_on: [TASK-SOCIAL-002, TASK-VIRAL-001]
blocks: []
effort_hours: 10
new_files:
  - "apps/api/src/social/wedding/wedding.controller.ts"
  - "apps/api/src/social/wedding/wedding.service.ts"
  - "apps/api/src/social/wedding/__tests__/wedding.spec.ts"
  - "apps/realtime/src/rooms/WeddingRoom.ts"
  - "apps/cocos/assets/_root/social/WeddingCeremonyScene.ts"
  - "apps/cocos/assets/_root/social/MarriedCosmeticBadge.ts"
  - "infra/supabase/standard/migrations/20260517_020_pet_weddings.sql"
modified_files: []
allowed_tools:
  - "Colyseus WeddingRoom"
  - "TASK-ART-001 wedding_pose contract animation"
  - "TASK-VIRAL-001 share-clip export"
disallowed_tools:
  - "Real-money wedding fee (TASK-LEGAL-002)"
  - "Wedding of grandma_house pets"
  - "Cross-SKU wedding"
  - "Polygamous wedding (one wedding per pet)"
risk_if_skipped: "Plan §PART 3 viral hook #7 — sharable wedding ceremony is the share-worthy emotional moment. Without it, the social-share pipeline misses its highest-value moment."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Wedding definition.** A ceremony involving 2 adult pets owned by 2 different players who are friends. Wedding produces: a permanent "married" cosmetic badge on both pets + a 12-second auto-rendered share clip.

§1.2  **Eligibility.** Both pets `stage='adult'`; both players friends (TASK-SOCIAL-001); both standard SKU; neither pet currently in another wedding; cross-tenant blocked.

§1.3  **Naming.** Ceremony can be "Pet Wedding" (romantic) or "Best Friend Ceremony" (platonic). Player selects framing on proposal. Both produce same mechanics; locale-tuned copy.

§1.4  **Proposal flow.** Player A's pet "proposes" to player B's pet via `POST /v1/weddings/propose`. Player B receives invite + 24h to accept.

§1.5  **Synchronous ceremony.** When both accept, a dedicated Colyseus `WeddingRoom` is created. Both players must be online + present in the room. Ceremony lasts 90 seconds with synchronized Spine `wedding_pose` animation + Lottie sparkle overlay.

§1.6  **Ceremony script.** Pre-rendered 90s sequence: pets meet → exchange "vows" (scripted text or AI-generated if both pets are 13+ owner consented) → kiss/high-five → fade to married badge reveal. Synchronized across both clients via Colyseus state.

§1.7  **Auto-rendered share clip.** During ceremony, the server renders a 12-second highlight reel. Per TASK-VIRAL-001, exported as 1080×1920 H.264 with watermark + locale-aware hashtag prefill `#mochiwedding #virtualpet`.

§1.8  **Married badge.** Both pets receive a permanent `married_to` field referencing the other pet. Visible as a small badge in roster + AR.

§1.9  **Divorce.** Either party can `POST /v1/weddings/:weddingId/end` to dissolve. Badge removed. Audit row.

§1.10  **One marriage per pet.** A pet currently `married_to` another cannot enter a new wedding. Must divorce first.

§1.11  **No real-money wedding fee.** Per TASK-LEGAL-002 §1.1. Cost is 100 Coins (earned only).

§1.12  **Wedding cooldown.** 30-day cooldown between weddings for the same pet (prevents shotgun-wedding spam).

§1.13  **AI vows (optional opt-in).** If both players consent, TASK-AI-001 LLM generates personalized vows. Goes through TASK-AI-002 safety. Both pets' personas referenced. Kids SKU forbidden per TASK-AI-001 §1.1 (but kids SKU already blocked from wedding entirely).

§1.14  **Asynchronous fallback.** If one party disconnects mid-ceremony, the other can wait up to 5 minutes; if reconnection fails, ceremony is paused + can resume within 24h.

§1.15  **Spine wedding pose.** Uses TASK-ART-001 contract `wedding_pose` animation. Both pets visible in same scene.

§1.16  **Cocos UI.** `WeddingCeremonyScene.ts` displays both pets, animated camera, ambient music (Howler.js), confetti particles (reduce-motion respected).

§1.17  **Cross-tenant + cross-SKU locked.** Per TASK-INFRA-003 + TASK-AUTH-003.

§1.18  **Audit.** `social.wedding.proposed`, `social.wedding.accepted`, `social.wedding.completed { wedding_id }`, `social.wedding.ended { trigger }` per TASK-OBS-001.

§1.19  **DSR + delete cascade.** Wedding rows cascade-delete on account deletion. Married badge removed from surviving pet.

§1.20  **Wedding gallery.** Player can view their pets' wedding history in `Settings → Wedding gallery`.

---

## §2 — Why this design

**Why romantic + platonic framing.** Plan §PART 3 — viral content + kid-appropriate language gradient. Different player audiences want different framings.

**Why synchronous.** Plan §PART 3 viral hook #7 — co-presence is the share moment. Async would feel like a stat update.

**Why 90s ceremony length.** Long enough to feel like an event; short enough not to drag.

**Why 12s share clip.** TikTok-native short-form (vs TASK-VIRAL-001 6-default). Wedding warrants longer.

**Why optional AI vows.** Plan §PART 3 #3 + personalisation pinnacle. Opt-in respects TASK-AI-002 cost/safety.

**Why 30-day cooldown.** Prevents marriage-spam exploiting share clips.

**Why one marriage per pet.** Identity preservation. Polygamous would confuse semantic of "married_to".

**Why pause-resume on disconnect.** Plan §PART 7 emerging-market flaky-network reality.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/social/wedding/wedding.service.ts (excerpt)
async propose(u: AuthedUser, myPetId: string, partnerPetId: string, framing: 'romantic' | 'platonic') {
  await this.assertEligibility(u, myPetId, partnerPetId);
  await this.coins.spend(u.id, 100);
  const weddingId = generateUlid();
  await this.supa.from('pet_weddings').insert({
    id: weddingId, proposer_pet_id: myPetId, recipient_pet_id: partnerPetId,
    framing, state: 'proposed', expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
  await this.notify.sendWeddingInvite(partnerPetId, weddingId, framing);
  return { wedding_id: weddingId, state: 'proposed' };
}

async startCeremony(weddingId: string) {
  const wedding = await this.supa.from('pet_weddings').select('*').eq('id', weddingId).single();
  // Create WeddingRoom in Colyseus
  const roomId = await this.realtime.matchMaker.createRoom('wedding-room', { wedding_id: weddingId });
  await this.supa.from('pet_weddings').update({ state: 'ceremony_active', room_id: roomId }).eq('id', weddingId);
  return { room_id: roomId };
}

async completeCeremony(weddingId: string, shareClipUri: string) {
  const wedding = await this.fetchWedding(weddingId);
  await this.supa.rpc('apply_wedding_badges', { _wedding_id: weddingId });
  await this.audit.emit('social.wedding.completed', { wedding_id: weddingId });
  return { wedding_id: weddingId, share_clip_uri: shareClipUri };
}
```

```sql
create table public.pet_weddings (
  id text primary key,
  proposer_pet_id text not null references public.pets(id) on delete cascade,
  recipient_pet_id text not null references public.pets(id) on delete cascade,
  framing text not null check (framing in ('romantic','platonic')),
  state text not null check (state in ('proposed','accepted','ceremony_active','completed','ended','expired')),
  proposed_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz not null,
  room_id text,
  share_clip_uri text,
  tenant_id text not null default 'mochi'
);

alter table public.pets add column married_to text references public.pets(id) on delete set null;
create index on public.pets (married_to);
```

---

## §4 — Acceptance criteria

**AC1.** Propose → accept → ceremony → complete end-to-end. Verified.
**AC2.** Both pets receive married_to. Verified.
**AC3.** 12s share clip rendered with watermark + hashtag. Verified.
**AC4.** Cross-SKU rejected. Verified.
**AC5.** Adult-only enforced. Verified.
**AC6.** 30-day cooldown enforced. Verified.
**AC7.** Disconnect mid-ceremony pauses; resumable within 24h. Verified.
**AC8.** Divorce removes badges. Verified.
**AC9.** No real-money fee. Verified.
**AC10.** AI vows opt-in respects TASK-AI-002. Verified.
**AC11.** Reduce-motion mode caps confetti. Verified.
**AC12.** Audit + analytics emit. Verified.

---

## §5 — Verification

```typescript
describe('TASK-SOCIAL-004 — wedding', () => {
  it('completes with both pets married_to each other', async () => {
    await proposeAndAccept('petA', 'petB');
    await runCeremony('petA', 'petB');
    expect((await db.pets.byId('petA')).married_to).toBe('petB');
    expect((await db.pets.byId('petB')).married_to).toBe('petA');
  });

  it('blocks polygamy', async () => {
    await marry('petA', 'petB');
    await expect(svc.propose(user('u1'), 'petA', 'petC', 'romantic')).rejects.toThrow(/already_married/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/realtime/src/rooms/WeddingRoom.ts
export class WeddingRoom extends _BaseTenantRoom {
  maxClients = 2;
  override async onCreate(opts: { wedding_id: string }) {
    this.setState(new WeddingCeremonyState());
    this.clock.setInterval(() => this.advanceScript(), 1000);
  }
  private advanceScript() {
    this.state.elapsed_sec += 1;
    if (this.state.elapsed_sec === 90) this.complete();
  }
}
```

---

## §7 — Dependencies

**External:** None new.
**Internal:** TASK-SOCIAL-002 (presence model), TASK-VIRAL-001 (export pipeline), TASK-ART-001 (wedding_pose), TASK-AI-001+002 (optional vows).
**Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/weddings/propose
{ "my_pet_id": "petA", "partner_pet_id": "petB", "framing": "romantic" }
→ 201 { "wedding_id": "01HWED...", "state": "proposed", "expires_at": "..." }
```

```json
{ "event": "social.wedding.completed", "wedding_id": "01HWED...", "petA": "...", "petB": "...", "framing": "romantic", "share_clip_uri": "..." }
```

```json
{ "error": "wedding.already_married", "pet_id": "petA", "married_to": "petX" }
```

```json
{ "id": "01HWED...", "framing": "platonic", "state": "ceremony_active", "room_id": "wd-..." }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Romantic vs platonic? → §1.3 — both.
- **OQ-2 (resolved):** AI vows? → §1.13 — opt-in.
- **OQ-3 (resolved):** Cooldown? → §1.12 — 30 days.
- **OQ-4 (resolved):** Cost? → §1.11 — 100 Coins.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Disconnect mid-ceremony | Colyseus detects | Pause + resume | 24h grace |
| 2 | Share clip render fails | Server error | Wedding still completes | UX retry on share |
| 3 | Both proposals to same pet | Concurrency | First wins | Locked |
| 4 | Cross-SKU bypass | Audit | Blocked | Validation |
| 5 | Divorce race | Atomic SQL | Last wins | OK |
| 6 | AI vows safety block | TASK-AI-002 | Fallback scripted | Standard vows |
| 7 | Married_to cascade orphans | TASK-LEGAL-001 cascade | Auto-null | Set null on delete |
| 8 | Confetti perf on low-end | Reduce-motion | Capped | OK |
| 9 | 24h grace pause expires | Auto-cancel | Refund coins | Compensating tx |
| 10 | Cross-tenant attempted | RLS | Blocked | Audit |
| 11 | Polygamy via race | First-wins SQL | Blocked | Lock |
| 12 | Spamming proposals | Rate limit | Throttled | Per-day cap |

---

## §11 — Notes

**Plan refs:** plan §PART 3 viral hook #7 (Pet Wedding / Best Friend Ceremony).

**Sub-decisions punted to ops:** Locale-tuned ceremony scripts DPO-reviewed.

**Anti-patterns explicitly forbidden:**
- Real-money fee.
- Polygamy.
- Cross-SKU.
- Wedding of grandma pets.

**Cross-reference:** TASK-VIRAL-001 share path. Plan §PART 3 viral hooks.
