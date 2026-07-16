---
id: TASK-CARE-004
title: "Mini-game framework — Cocos scene loader contract + 4 stock games + server-validated soft-currency payout"
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
related_frs: [TASK-INFRA-001, TASK-INFRA-002, TASK-PET-003, TASK-ART-001, TASK-CARE-005, TASK-ECON-001, TASK-OBS-001, TASK-OBS-002, TASK-LEGAL-002, TASK-VIRAL-002, TASK-B2B-004]
depends_on: [TASK-INFRA-001, TASK-INFRA-002, TASK-PET-003]
blocks: [TASK-CARE-005, TASK-VIRAL-002, TASK-B2B-004]
effort_hours: 14
new_files:
  - "apps/api/src/care/mini-game/mini-game.controller.ts"
  - "apps/api/src/care/mini-game/mini-game.service.ts"
  - "apps/api/src/care/mini-game/scoring-rules.ts"
  - "apps/api/src/care/mini-game/anti-cheat.service.ts"
  - "apps/api/src/care/mini-game/__tests__/mini-game.spec.ts"
  - "apps/api/src/care/mini-game/__tests__/anti-cheat.spec.ts"
  - "apps/cocos/assets/mini-games/_framework/MiniGameContract.ts"
  - "apps/cocos/assets/mini-games/_framework/MiniGameLoader.ts"
  - "apps/cocos/assets/mini-games/_framework/SeededRng.ts"
  - "apps/cocos/assets/mini-games/tap-the-mochi/TapTheMochi.scene"
  - "apps/cocos/assets/mini-games/memory-match/MemoryMatch.scene"
  - "apps/cocos/assets/mini-games/catch-snacks/CatchSnacks.scene"
  - "apps/cocos/assets/mini-games/rhythm-tap/RhythmTap.scene"
  - "apps/cocos/assets/mini-games/_framework/__tests__/MiniGameLoader.spec.ts"
  - "infra/supabase/standard/migrations/20260517_011_mini_game_sessions.sql"
modified_files:
  - "apps/api/src/pets/stats/stat-decay.service.ts"
allowed_tools:
  - "Cocos scene loading + asset bundles per mini-game"
  - "Server-seeded RNG for deterministic mini-game runs"
  - "Sentry custom transaction per game session for perf monitoring"
disallowed_tools:
  - "Client-decided score (server scores from input events)"
  - "Mini-game outcomes determining real-money inventory (no IAP gated by win)"
  - "Mini-games on egg / grandma_house pets"
risk_if_skipped: "Mini-game is the canonical soft-currency source (plan §PART 3); without a server-validated framework, currency inflation is trivial via client score forgery. TASK-CARE-005 streak system + TASK-ECON-001 currency ledger both depend on this."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Mini-game contract.** A mini-game MUST implement the `MiniGameContract` interface:
```typescript
interface MiniGameContract {
  id: 'tap-the-mochi'|'memory-match'|'catch-snacks'|'rhythm-tap';
  startWithSeed(seed: string, opts: { difficulty: 1|2|3 }): Promise<void>;
  collectInputEvents(): InputEvent[];          // ordered list, server-replayable
  durationMs: number;                          // fixed, e.g. 30000 for Tap-the-Mochi
}
```
New mini-games (P3+) MUST conform to this contract.

§1.2  **Per-game asset bundle.** Each mini-game lives in its own Cocos asset bundle (per TASK-INFRA-001 §1.5) loaded on demand via `MiniGameLoader`. Bundle budget ≤ 2 MB per game (per TASK-INFRA-001 §1.5 budget table).

§1.3  **Server-seeded RNG.** When the player starts a mini-game, the **server** generates a CSPRNG seed (`crypto.randomBytes(16)`) returned in `POST /v1/mini-games/start`. The Cocos game seeds its RNG from this server seed (deterministic per session). The server replays the same seed when validating scores.

§1.4  **Input event collection.** During a mini-game session, the Cocos client records every meaningful input event (tap timestamp + position; gesture metadata) into an ordered `InputEvent[]`. On finish, the client POSTs the events to `POST /v1/mini-games/finish` for server-side replay scoring.

§1.5  **Server-side scoring.** The server replays the session: starts from the same seed → replays input events → computes the score. If the client-claimed score does not match the server-computed score (within a tolerance for floating-point variance ≤ 1%), reject + record `security.mini-game.score-mismatch` Sentry event.

§1.6  **Payout caps.** Each mini-game has a per-session payout cap + a per-day per-pet aggregate cap:
- Tap-the-Mochi: max 30 Coins/session, 90 Coins/pet/day.
- Memory Match: max 50 Coins/session, 150 Coins/pet/day.
- Catch Snacks: max 40 Coins/session, 120 Coins/pet/day.
- Rhythm Tap: max 60 Coins/session, 180 Coins/pet/day.

§1.7  **Stat side-effects.** Per TASK-PET-003 §1.4, mini-game outcomes affect stats:
- Win: cleanliness -3, happiness +20, energy -10.
- Loss: cleanliness -2, happiness +5, energy -8.

Stats clamped 0-100.

§1.8  **Stage gate.** Mini-games require `baby|teen|adult`. (`baby` is the gating moment for the first mini-game per TASK-PET-002 §1.6.)

§1.9  **Anti-replay.** Each session has a unique `session_id` (ULID). A session id MUST be `finish`-able at most once. Subsequent finish attempts → 409 `session.already_finished`.

§1.10  **Timeout.** A `start`ed session that does not `finish` within `durationMs + 30s` MUST be auto-finished with score 0 + recorded as `incomplete`. Prevents leaving sessions open to retry later with a better score.

§1.11  **Difficulty scaling.** Each mini-game offers difficulty 1/2/3 (selected by player). Higher difficulty = higher max payout. The server-side scoring rule encodes the per-difficulty multiplier.

§1.12  **Audit row.** `mini_game_sessions` table: `(session_id, pet_id, owner_id, game_id, difficulty, seed, started_at, finished_at, raw_input_events_url, server_score, coin_payout, status, tenant_id)`.

§1.13  **Per-session perf monitoring.** Each game session opens a Sentry transaction tagged with `game_id` + `device_class`. Frame-rate samples emit `mini_game.frame_rate` metric.

§1.14  **No real-money outcome.** Per TASK-LEGAL-002 §1.1, mini-game payouts are earned-currency only. No mini-game outcome MAY: (a) determine an IAP-purchasable item; (b) consume an IAP-purchased entry ticket; (c) gate a randomised inventory pull.

§1.15  **Co-parent visibility.** Mini-game completion broadcasts `pet.mini_game.played` to PetRoom (co-parent sees the activity but does not share payout — payout goes to the player who played).

§1.16  **Kids-SKU restrictions.** No leaderboards or social-comparison surfaces on kids SKU. No in-game chat. Standard SKU may surface per-game personal best.

§1.17  **A11Y.** Each mini-game scene MUST: (a) support reduce-motion (slower animations); (b) provide colour-blind-safe palette; (c) be playable with a single tap target (no requirement for multi-touch fine-motor input); (d) include audio cues for primary feedback (alongside visuals).

§1.18  **Cooldown between sessions.** 60 seconds between any two `start` calls on the same pet (prevents replay-spam exploiting the per-session cap multiple times in quick succession).

§1.19  **Idempotent finish.** `finish` accepts an `idempotency_key`; identical retry returns the cached response.

§1.20  **Analytics taxonomy.** `mini_game.start { game_id, difficulty }`, `mini_game.finish { game_id, server_score, coin_payout, status: 'win'|'loss'|'incomplete' }`, `mini_game.score_mismatch` per TASK-OBS-001.

---

## §2 — Why this design

**Why a contract interface.** New mini-games (P3+) need a stable seam; without a contract each new game forks the framework.

**Why server-seeded RNG + replay.** Plan §PART 4 anti-cheat. Client-side RNG + client-claimed score = trivially spoofable. Server-seed + server replay = deterministic auditability.

**Why per-game asset bundle.** Mini-games are heavy assets (~1-2 MB each). Bundling each separately keeps cold-start fast (TASK-INFRA-001 §1.5 budget) — load only the chosen game.

**Why payout caps.** Without caps, a player could grind one mini-game indefinitely for unlimited Coins. Caps preserve economy integrity + force engagement variety.

**Why 60s session cooldown.** A player could `start` then deliberately fail to test the game without consuming a payout slot. The cooldown prevents excessive testing-as-grinding.

**Why timeout on incomplete sessions.** Prevents abandoning a low-scoring session + retrying later. Plus releases server state.

**Why difficulty 1/2/3.** Three tiers covers low-effort / medium / high; granularity beyond 3 confuses players + complicates payout math.

**Why no leaderboard on kids SKU.** COPPA-2025 + social-comparison concerns. Plan §PART 8.

**Why audio cues required.** WCAG-AA compliance + Apple Kids Category accessibility. Players who can't see well still get feedback.

**Why per-session Sentry transaction.** Mini-games are perf-critical (frame-rate sensitive on low-end VN Android). Per-session telemetry lets us spot regressions per-device-class.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/care/mini-game/mini-game.controller.ts
@Controller('v1/mini-games')
@UseGuards(SupabaseJwtGuard)
export class MiniGameController {
  constructor(private readonly svc: MiniGameService) {}

  @Post('start')
  async start(@CurrentUser() u: AuthedUser, @Body() body: { pet_id: string; game_id: 'tap-the-mochi'|'memory-match'|'catch-snacks'|'rhythm-tap'; difficulty: 1|2|3 }) {
    return this.svc.start(u, body.pet_id, body.game_id, body.difficulty);
  }

  @Post('finish')
  async finish(@CurrentUser() u: AuthedUser,
               @Body() body: { session_id: string; client_score: number; input_events: any[]; idempotency_key: string }) {
    return this.svc.finish(u, body);
  }
}
```

```typescript
// apps/cocos/assets/mini-games/_framework/MiniGameContract.ts
export interface MiniGameContract {
  readonly id: 'tap-the-mochi'|'memory-match'|'catch-snacks'|'rhythm-tap';
  readonly durationMs: number;
  startWithSeed(seed: string, opts: { difficulty: 1|2|3 }): Promise<void>;
  collectInputEvents(): InputEvent[];
}

export interface InputEvent {
  type: 'tap'|'gesture'|'frame';
  t_ms: number;       // ms since session start
  x?: number; y?: number;
  meta?: Record<string, unknown>;
}
```

```typescript
// apps/api/src/care/mini-game/scoring-rules.ts
export const SCORING = {
  'tap-the-mochi':  { perCorrectTap: 1, missPenalty: 0, capPerSession: 30, capPerDay: 90 },
  'memory-match':   { perMatch: 10, missPenalty: 2, capPerSession: 50, capPerDay: 150 },
  'catch-snacks':   { perCatch: 3, missPenalty: 1, capPerSession: 40, capPerDay: 120 },
  'rhythm-tap':     { perOnBeat: 4, perPerfect: 6, capPerSession: 60, capPerDay: 180 },
} as const;
```

```sql
-- infra/supabase/standard/migrations/20260517_011_mini_game_sessions.sql
create table public.mini_game_sessions (
  session_id text primary key check (session_id ~ '^[0-9A-HJKMNPQRSTVWXYZ]{26}$'),
  pet_id text not null references public.pets(id) on delete cascade,
  owner_id uuid not null,
  game_id text not null check (game_id in ('tap-the-mochi','memory-match','catch-snacks','rhythm-tap')),
  difficulty int not null check (difficulty between 1 and 3),
  seed text not null,
  raw_input_events_url text,
  server_score int,
  coin_payout int,
  status text not null default 'started' check (status in ('started','finished','incomplete','rejected_score_mismatch')),
  tenant_id text not null default 'mochi',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on public.mini_game_sessions (pet_id, started_at desc);
alter table public.mini_game_sessions enable row level security;
create policy "mini_game_sessions self" on public.mini_game_sessions for select using (owner_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** `POST /v1/mini-games/start` returns `session_id` + `seed` + `started_at`. Verified.
**AC2.** `POST /v1/mini-games/finish` with valid replay matches client_score → 200 with `coin_payout`. Verified.
**AC3.** Score mismatch (client claims 100 but server replay computes 50) → 422 + `security.mini-game.score-mismatch` event. Verified.
**AC4.** Per-session cap enforced — client claims 50 Coins on Tap-the-Mochi (cap 30) → payout capped at 30. Verified.
**AC5.** Per-day per-pet cap enforced (90 Coins/day on Tap-the-Mochi). Verified.
**AC6.** Stage-locked: mini-game on egg/grandma → 403. Verified.
**AC7.** Re-finish of same session_id → 409. Verified.
**AC8.** Timeout: session not finished within durationMs+30s → auto-finished with score 0. Verified.
**AC9.** Stat effects: win → cleanliness -3, happiness +20, energy -10; loss → cleanliness -2, happiness +5, energy -8. Verified.
**AC10.** Cooldown 60s between starts. Verified.
**AC11.** Per-game bundle ≤ 2 MB. Verified via `assert-bundle-budget`.
**AC12.** Co-parent broadcast `pet.mini_game.played` works. Verified.
**AC13.** Kids SKU has no leaderboard surface. Verified by Playwright.
**AC14.** A11Y: each game playable with single-tap + audio cues. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/care/mini-game/__tests__/mini-game.spec.ts
describe('TASK-CARE-004 — mini-game framework', () => {
  it('rejects client_score mismatching server replay', async () => {
    const { session_id, seed } = await svc.start(user('u1'), 'pet', 'tap-the-mochi', 2);
    const fakeEvents = [{ type: 'tap', t_ms: 100, x: 50, y: 50 }];
    await expect(svc.finish(user('u1'), {
      session_id, client_score: 999, input_events: fakeEvents, idempotency_key: 'k1',
    })).rejects.toMatchObject({ status: 422 });
  });

  it('caps payout at session cap', async () => {
    const { session_id } = await svc.start(user('u1'), 'pet', 'tap-the-mochi', 3);
    const events = generatePerfectTapEvents(60);
    const r = await svc.finish(user('u1'), { session_id, client_score: 60, input_events: events, idempotency_key: 'k2' });
    expect(r.coin_payout).toBe(30);  // capped
  });

  it('respects per-day cap', async () => {
    for (let i = 0; i < 3; i++) {
      const { session_id } = await svc.start(user('u1'), 'pet', 'tap-the-mochi', 2);
      await svc.finish(user('u1'), { session_id, client_score: 30, input_events: events30, idempotency_key: `kp${i}` });
    }
    const { session_id } = await svc.start(user('u1'), 'pet', 'tap-the-mochi', 2);
    const r4 = await svc.finish(user('u1'), { session_id, client_score: 30, input_events: events30, idempotency_key: 'kp4' });
    expect(r4.coin_payout).toBe(0);
    expect(r4.daily_capped).toBe(true);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/care/mini-game/anti-cheat.service.ts
@Injectable()
export class MiniGameAntiCheat {
  replayScore(seed: string, gameId: string, difficulty: number, events: InputEvent[]): number {
    const rng = new SeededRng(seed);
    const rules = SCORING[gameId];
    let score = 0;
    let frame = 0;
    for (const ev of events) {
      if (ev.type === 'tap' && this.isCorrectTap(rng, frame, ev)) score += rules.perCorrectTap ?? rules.perMatch ?? rules.perCatch ?? rules.perOnBeat ?? 0;
      frame = ev.t_ms;
    }
    return Math.min(score, rules.capPerSession);
  }

  private isCorrectTap(rng: SeededRng, _t: number, _ev: InputEvent): boolean {
    return rng.next() > 0.3; // simplified scoring rule; per-game implementations override
  }
}
```

---

## §7 — Dependencies

**External:** Cocos asset bundle infra (TASK-INFRA-001).
**Internal:** TASK-INFRA-002 (Colyseus broadcast), TASK-PET-003 (stat apply for win/loss), TASK-ART-001 (per-game assets follow art contract).
**Blocks:** TASK-CARE-005 (streak system reads mini-game wins), TASK-VIRAL-002 (Daily Drama micro-events), TASK-B2B-004 (Techcombank financial-literacy mini-game extends framework).

---

## §8 — Example payloads

```http
POST /v1/mini-games/start
{ "pet_id": "01HC...", "game_id": "tap-the-mochi", "difficulty": 2 }
→ 200
{ "session_id": "01HCMGS...", "seed": "9b3e7d2a5c4f1b8e", "started_at": "2026-08-12T14:36:01Z", "duration_ms": 30000 }
```

```http
POST /v1/mini-games/finish
{ "session_id": "01HCMGS...", "client_score": 25, "input_events": [...], "idempotency_key": "01HCMG..." }
→ 200
{ "server_score": 25, "coin_payout": 25, "status": "win", "daily_capped": false, "stat_after": { "happiness": 95, "energy": 80, "cleanliness": 75 } }
```

```json
{ "error": "score_mismatch", "expected_max": 25, "client_claimed": 999 }
```

```json
{ "session_id": "01HCMGS...", "status": "incomplete", "reason": "timeout" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 4 games at P1? → §1.1 — 4 covers variety without bloating launch scope.
- **OQ-2 (resolved):** Replay all events vs sample? → §1.5 — full replay; events compress well + audit-ready.
- **OQ-3 (resolved):** Difficulty tunable by player? → §1.11 — yes, with higher cap at higher difficulty.
- **OQ-4 (resolved):** Per-game multi-touch? → §1.17 — single-tap minimum for A11Y; multi-touch optional bonus.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Client RNG diverges from server (event-loop timing) | Score-mismatch | Payout rejected | Tighten replay determinism + tolerance |
| 2 | Input event stream corrupted | Replay errors | Session marked rejected | Sentry alert; investigate Cocos serialisation |
| 3 | Session not finished within timeout | Server cron | Auto-finish 0 | Player can start a new session immediately |
| 4 | Per-session cap accidentally bypassed in scoring | Replay test fails | Inflation | Recompute affected sessions; ledger refund |
| 5 | Anti-cheat false-positive | Player support | Frustrated player | Re-score manually; lower tolerance |
| 6 | Per-game bundle exceeds 2 MB | Bundle-budget CI | Build blocked | Compress assets; or split game further |
| 7 | Mini-game crashes mid-session | Cocos error | Session lost | Auto-finish on next session start; analytics |
| 8 | Daily cap counter Redis loss | Cap resets | Possible exploit | Fail-closed: hard-reject when counter unavailable |
| 9 | Co-parent broadcast lost | UX desync | Tolerable | Persistent state authoritative |
| 10 | Mini-game scene asset missing on CDN | Cocos load error | Player blocked | Bundle-budget CI catches; fallback to a different game UX |
| 11 | A11Y audio cue missing for a primary feedback | Audit | A11Y regression | Audio license ledger gate + manual review |
| 12 | Score-mismatch event flood (auto-cheat ring) | Sentry alert | Coordinated exploit | Tighten anti-cheat; investigate source IPs |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (mini-games as soft-currency source), plan §PART 4 (server-authoritative).

**Sub-decisions punted to ops:**
- Per-game-specific scoring rules — locked in `scoring-rules.ts` per-game implementation.
- Difficulty multipliers — Mixpanel-tunable.

**Anti-patterns explicitly forbidden:**
- Client-decided score.
- Mini-game gated by IAP entry.
- Randomised inventory pull as mini-game reward (per TASK-LEGAL-002).
- Mini-games on grandma/egg pets.

**Cross-reference:** TASK-CARE-005 reads mini-game wins for streak detection. TASK-B2B-004 Techcombank tenant extends framework with savings-quest mini-game.
