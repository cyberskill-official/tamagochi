---
id: TASK-INFRA-002
title: "Colyseus Node/TS stateful real-time room server (AWS Singapore + presence + handler scaffold)"
module: INFRA
priority: MUST
status: done
verify: T
phase: P0
milestone: "Foundation Gate"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-INFRA-001, TASK-INFRA-003, TASK-AUTH-001, TASK-PET-001, TASK-CARE-001, TASK-CARE-002, TASK-CARE-003, TASK-CARE-004, TASK-SOCIAL-001, TASK-SOCIAL-002, TASK-SOCIAL-003, TASK-SOCIAL-004, TASK-AI-001, TASK-VIRAL-002, TASK-OBS-002, TASK-B2B-002]
depends_on: [TASK-INFRA-001]
blocks: [TASK-PET-001, TASK-CARE-001, TASK-CARE-002, TASK-CARE-003, TASK-CARE-004, TASK-SOCIAL-001, TASK-SOCIAL-002, TASK-SOCIAL-003, TASK-SOCIAL-004, TASK-AI-001, TASK-VIRAL-002, TASK-OBS-002]
effort_hours: 12
new_files:
  - "apps/realtime/package.json"
  - "apps/realtime/tsconfig.json"
  - "apps/realtime/src/index.ts"
  - "apps/realtime/src/server.ts"
  - "apps/realtime/src/rooms/PetRoom.ts"
  - "apps/realtime/src/rooms/_BaseTenantRoom.ts"
  - "apps/realtime/src/state/PetState.ts"
  - "apps/realtime/src/state/PlayerState.ts"
  - "apps/realtime/src/auth/jwtVerifier.ts"
  - "apps/realtime/src/presence/redisPresence.ts"
  - "apps/realtime/src/anticheat/messageSigner.ts"
  - "apps/realtime/src/anticheat/rateLimiter.ts"
  - "apps/realtime/src/obs/sentry.ts"
  - "apps/realtime/src/obs/metrics.ts"
  - "apps/realtime/src/health/liveness.ts"
  - "apps/realtime/src/__tests__/PetRoom.spec.ts"
  - "apps/realtime/src/__tests__/rateLimiter.spec.ts"
  - "apps/realtime/src/__tests__/messageSigner.spec.ts"
  - "apps/realtime/Dockerfile"
  - "infra/terraform/realtime/main.tf"
  - "infra/terraform/realtime/variables.tf"
  - ".github/workflows/realtime-deploy.yml"
modified_files:
  - "package.json"
  - "turbo.json"
allowed_tools:
  - "Colyseus 0.16.x (Node.js / TypeScript)"
  - "Node 22 LTS"
  - "Redis 7.x (Upstash global Redis for presence)"
  - "AWS Singapore (ap-southeast-1) — ECS Fargate OR EC2 ARM Graviton"
  - "AWS Application Load Balancer with sticky sessions"
  - "Sentry Node SDK"
  - "OpenTelemetry / Prometheus client"
  - "Zod (message validation)"
  - "JWT verification (jose library)"
  - "Terraform for infra-as-code"
disallowed_tools:
  - "Socket.IO directly (Colyseus encapsulates and provides typed schema; bypassing forfeits its anti-cheat hooks)"
  - "Client → client direct WS (all messages route through Colyseus room)"
  - "Unauthenticated room joins (every join MUST verify Supabase JWT)"
  - "Server-side `Math.random()` for state-affecting outcomes — use crypto RNG only with audit trail (TASK-LEGAL-002 §1)"
  - "Cross-tenant room joining (tenant_id partition enforced server-side per TASK-B2B-002)"
risk_if_skipped: "Without server-authoritative stateful state, every care action, every social action, every economy action becomes spoofable from the client. Anti-cheat impossible → trade scams + currency duplication + permadeath bypass → regulator complaints + community collapse (Adopt Me scam-crisis precedent)."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Colyseus pin.** The real-time server MUST use **Colyseus 0.16.x** (locked to a specific patch in `apps/realtime/package.json`). Colyseus is chosen over raw Socket.IO + Redis because its schema-based delta sync + room lifecycle + presence integration significantly reduce boilerplate and supply built-in anti-cheat seams.

§1.2  **Node + TypeScript pin.** Runtime MUST be **Node 22 LTS** with **TypeScript 5.4.x** matching `apps/cocos/`. `strict: true` and `noUncheckedIndexedAccess: true` apply identically to this app.

§1.3  **Deployment target.** Production MUST deploy to **AWS Singapore (ap-southeast-1)** behind an **Application Load Balancer with sticky sessions** (target group cookie + `lb_cookie` stickiness). Deployment runtime SHOULD be **ECS Fargate** (managed, ARM Graviton) for P0–P2 scale; the Terraform module MUST expose a switch to EC2 ARM Graviton autoscaling group at P3+ once concurrent rooms exceed Fargate's per-task socket limits.

§1.4  **Presence in Redis.** Player presence (online / offline / which room) MUST live in **Upstash global Redis 7.x** (free tier sufficient through P1). Colyseus's built-in `RedisPresence` adapter MUST be wired, not a homegrown adapter.

§1.5  **JWT verification on every join.** Every Colyseus `onAuth` hook MUST verify a Supabase-issued JWT against the project's JWKS URL (`https://<supabase-project>.supabase.co/auth/v1/.well-known/jwks.json`). Tokens MUST be verified for: signature, expiry, audience (`authenticated`), and `sub` claim shape. Unauthenticated joins MUST be rejected with `4001 unauthenticated`.

§1.6  **Tenant-id partition.** Every room handler MUST extract `tenant_id` from the JWT claims (TASK-B2B-002 will populate this in P4; consumer tenant `mochi` is the default at P0). The room MUST refuse a join whose `tenant_id` does not match the room's tenant. A cross-tenant join attempt MUST emit a `security.cross-tenant.join.refused` Sentry event.

§1.7  **Signed messages.** Every client→server message MUST carry an HMAC signature over `{message_id, room_id, message_body, session_seq}` using a session secret negotiated at join time. The `messageSigner.ts` module MUST: (a) generate session secret at `onAuth` (32 random bytes); (b) verify each incoming message's HMAC before dispatching; (c) reject invalid signatures with `4002 signature_invalid` and record to `security.signature.invalid` metric.

§1.8  **Rate limiting.** Per-account + per-IP rate limits MUST be enforced server-side. Defaults: 60 messages/minute per account; 600 messages/minute per IP; burst of 10 in 1 second. Per-message-type granular limits MUST be supported via a `limits.yaml` config. Exceeding limits MUST emit `security.rate-limit.exceeded` event and disconnect with `4003 rate_limit_exceeded`.

§1.9  **Impossible-state-transition ban.** When a message would transition state in a way that's impossible given current state (e.g. feeding a pet that's already at 100% hunger; trading with a non-friend; spawning a 6th pet on a 3-slot free tier), the room MUST: (a) refuse the transition; (b) emit `security.impossible-transition` Sentry event with the player_id + attempted transition; (c) flag the account for review; (d) after 3 such events in 24h, auto-ban the account pending manual review.

§1.10  **Server-authoritative care actions.** Every state-affecting action (feed, clean, hug, mini-game payout, breed, trade-confirm, wedding-vow, daily-drama-roll) MUST be executed server-side. The client MUST only render server-broadcast state. The client MAY perform predictive rendering for ≤ 100ms before server reconciliation but MUST roll back visual state to server truth on conflict.

§1.11  **Schema-based state sync.** All synced state MUST use Colyseus's `@colyseus/schema` decorators. `PetState`, `PlayerState`, `RoomState`, and tenant-extension shapes MUST live under `apps/realtime/src/state/` and be re-exportable to the Cocos client via a published `@cyberskill/tamagochi-shared-state` package.

§1.12  **Room lifecycle.** The base room class `_BaseTenantRoom.ts` MUST: (a) validate JWT in `onAuth`; (b) enforce tenant partition in `onJoin`; (c) start an idle disposal timer (15 min of zero clients → dispose); (d) on `onDispose`, flush any unsaved state to Supabase Postgres; (e) wire Sentry breadcrumbs on every lifecycle transition.

§1.13  **Health probe.** A `GET /healthz` endpoint MUST return 200 with payload `{ ok: true, rooms_active: <int>, presence_connected: <bool>, ts: <ISO> }`. ALB health checks point at this. A `GET /readyz` MUST additionally verify Redis presence + JWKS reachability.

§1.14  **Graceful shutdown.** On `SIGTERM`, the server MUST: (a) stop accepting new joins; (b) broadcast a `server.shutdown.imminent` message to all rooms with `expected_seconds: 30`; (c) wait up to 30 s for rooms to dispose naturally; (d) force-dispose remaining rooms; (e) flush state. ECS / Kubernetes drain hooks MUST be configured to allow 60 s total.

§1.15  **Per-tenant rate-limit budget.** Per TASK-B2B-002, each tenant MUST have its own rate-limit budget; consumer tenant `mochi` budget separate from any B2B tenant. Budgets configurable via `limits.yaml` at deploy time.

§1.16  **Observability.** Sentry Node SDK + OpenTelemetry / Prometheus metrics MUST emit: room count, concurrent players, message-per-second rate, p95 message-handle latency, error count, JWT-rejection count, rate-limit-exceed count, impossible-transition count.

§1.17  **No `Math.random()` for state outcomes.** Per TASK-LEGAL-002, all randomised state-affecting outcomes MUST use `crypto.randomBytes()` seeded calls routed through the `DropRateService` (TASK-LEGAL-002 §6 implementation). A custom ESLint rule MUST flag `Math.random()` in `apps/realtime/src/rooms/` + `apps/realtime/src/state/`.

§1.18  **Reproducible Docker image.** `apps/realtime/Dockerfile` MUST produce a reproducible image: `npm ci --omit=dev` with a frozen lockfile; deterministic copy order; no wall-clock metadata leaking; multi-stage build for slim final image. CI MUST tag images by both `git rev` and a content hash, and the two MUST be stable across rebuilds.

§1.19  **Terraform infra-as-code.** All AWS resources (ECS service, ALB, target group, security groups, Redis allowlist) MUST be declared in `infra/terraform/realtime/main.tf`. Manual console edits are forbidden post-launch — drift is detected via `terraform plan` in CI weekly.

§1.20  **Local development parity.** A `docker compose up` recipe at `apps/realtime/docker-compose.yml` MUST start the realtime server + a local Redis + a JWKS mock, so developers can run end-to-end without AWS.

---

## §2 — Why this design

**Why Colyseus over Nakama / PlayFab / raw Socket.IO.** Plan §PART 4 lays out the case: Colyseus shares the language (TypeScript) with the Cocos client and the rest of the stack; it has a focused room-based model that maps directly to pet-care sessions, co-parent rooms, and trade windows; its schema-based delta sync is more bandwidth-efficient than custom JSON shapes; and migration to Nakama is documented as the P3+ option if needed. Nakama is overkill for P0 (it ships chat, matchmaking, leaderboards we don't need yet). PlayFab is Microsoft-stack lock-in we don't want.

**Why AWS Singapore (ap-southeast-1).** Latency to VN / PH / ID is sub-30ms; latency to Tokyo / Seoul is sub-80ms; latency to US West is ~180ms (acceptable for soft launch). Singapore is also where the Supabase US region is colocated for the backend.

**Why ECS Fargate at P0.** Fargate eliminates ops overhead for a 6-8 person team. The per-task socket limit (~1000 sockets per task) is fine at P0/P1 scale. The switch to EC2 ARM Graviton ASG at P3+ is documented but not required at P0.

**Why JWT verification against Supabase JWKS rather than a shared secret.** A shared secret means the realtime server stores the Supabase service-role key, which is over-broad and a compromise vector. JWKS verification is read-only and decouples key rotation from this codebase.

**Why HMAC-signed messages.** A pure JWT-at-join model is vulnerable to mid-session message tampering (e.g. a client modifies its outgoing JSON before the WS frame). The HMAC per-message check tightens this surface and is cheap (HMAC-SHA256 of a small payload is sub-microsecond).

**Why rate-limit + impossible-state-transition + signature checks as three layers.** Anti-cheat is defence-in-depth: the rate limiter catches volume attacks; the signature check catches tampering; the impossible-transition check catches logic-level cheats. A breach of any single layer is contained.

**Why disposal at 15 min idle.** Fargate task-per-room consumes resources even with zero clients. 15 min idle balances "don't churn rooms when a player closes their app for 5 min" against "don't pay for ghost rooms."

**Why Sentry breadcrumbs on every lifecycle.** Debugging room state divergence post-incident requires the full lifecycle trace. Breadcrumbs are cheap (<1 KB per room) and pay off enormously on the first incident.

**Why `crypto.randomBytes()` not `Math.random()`.** `Math.random()` is not cryptographically random and on Node 16+ the PRNG seed is shared across worker threads. For randomised state outcomes that affect monetised inventory (per TASK-LEGAL-002 audit trail), `crypto.randomBytes()` is the only acceptable source.

**Why a published shared-state package.** Sharing `PetState` etc. between the Cocos client and the server through file-system imports breaks Cocos's bundler. A published npm package (`@cyberskill/tamagochi-shared-state`) gives both clients a clean version-pinned dependency.

**Why Terraform for IaC.** AWS console edits drift. Terraform produces a `plan` diff that's reviewable in a PR. Weekly drift detection catches manual interventions.

**Why graceful shutdown windows.** ECS / K8s send SIGTERM with a 30-second drain by default. Rooms need to flush state to Supabase before disposal, which can take 5–15 seconds on a Postgres hiccup. The 30 s broadcast + 30 s shutdown gives players a visible warning ("game saving — back in a moment") and avoids lost progress.

---

## §3 — API contract & code shape

### 3.1 — Server entrypoint

```typescript
// apps/realtime/src/index.ts
import { Server } from 'colyseus';
import { createServer } from 'node:http';
import express from 'express';
import { RedisPresence } from '@colyseus/redis-presence';
import { PetRoom } from './rooms/PetRoom';
import { initSentry } from './obs/sentry';
import { livenessRouter } from './health/liveness';

initSentry(process.env.SENTRY_DSN!);

const app = express();
app.use(livenessRouter);

const server = new Server({
  server: createServer(app),
  presence: new RedisPresence({ url: process.env.REDIS_URL! }),
});
server.define('pet-room', PetRoom);

server.listen(parseInt(process.env.PORT ?? '2567', 10));
```

### 3.2 — Base tenant room

```typescript
// apps/realtime/src/rooms/_BaseTenantRoom.ts
import { Room, Client } from 'colyseus';
import { verifyJwt } from '../auth/jwtVerifier';
import { newSessionSecret, verifyHmac } from '../anticheat/messageSigner';
import { withinLimit } from '../anticheat/rateLimiter';

export abstract class _BaseTenantRoom<State extends object = any> extends Room<State> {
  protected tenantId!: string;
  protected sessionSecrets = new Map<string, Buffer>();

  override async onAuth(_client: Client, options: { token?: string }) {
    const payload = await verifyJwt(options.token);
    if (!payload) throw new Error('4001 unauthenticated');
    return payload;
  }

  override async onJoin(client: Client, _options: unknown, payload: { sub: string; tenant_id?: string }) {
    const tenant = payload.tenant_id ?? 'mochi';
    if (this.tenantId && tenant !== this.tenantId) {
      throw new Error('4004 cross_tenant');
    }
    this.tenantId = tenant;
    this.sessionSecrets.set(client.sessionId, newSessionSecret());
  }

  override async onMessage<T>(client: Client, type: string, msg: T) {
    if (!withinLimit({ accountId: (client as any).userId, ip: (client as any).address })) {
      throw new Error('4003 rate_limit_exceeded');
    }
    if (!verifyHmac(msg, this.sessionSecrets.get(client.sessionId)!)) {
      throw new Error('4002 signature_invalid');
    }
    return super.onMessage(client, type, msg);
  }
}
```

### 3.3 — PetState schema

```typescript
// apps/realtime/src/state/PetState.ts
import { Schema, type } from '@colyseus/schema';

export class PetState extends Schema {
  @type('string')  id           = '';
  @type('string')  ownerId      = '';
  @type('string')  species      = 'mochi';
  @type('string')  stage        = 'baby';   // egg | baby | teen | adult
  @type('number')  hunger       = 100;
  @type('number')  cleanliness  = 100;
  @type('number')  happiness    = 100;
  @type('number')  energy       = 100;
  @type('number')  ageMinutes   = 0;
  @type('string')  lastActionId = '';      // server-authoritative; client uses for reconciliation
}
```

### 3.4 — Anti-cheat rate limiter

```typescript
// apps/realtime/src/anticheat/rateLimiter.ts
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
client.connect();

const LIMITS = {
  perAccountPerMinute: 60,
  perIpPerMinute: 600,
  burstPerSecond: 10,
};

export async function withinLimit(ctx: { accountId: string; ip: string }): Promise<boolean> {
  const minute = Math.floor(Date.now() / 60_000);
  const second = Math.floor(Date.now() / 1_000);
  const [acct, ip, burst] = await Promise.all([
    client.incr(`rl:acct:${ctx.accountId}:${minute}`),
    client.incr(`rl:ip:${ctx.ip}:${minute}`),
    client.incr(`rl:burst:${ctx.accountId}:${second}`),
  ]);
  client.expire(`rl:acct:${ctx.accountId}:${minute}`, 90);
  client.expire(`rl:ip:${ctx.ip}:${minute}`, 90);
  client.expire(`rl:burst:${ctx.accountId}:${second}`, 5);
  return acct <= LIMITS.perAccountPerMinute
      && ip   <= LIMITS.perIpPerMinute
      && burst <= LIMITS.burstPerSecond;
}
```

---

## §4 — Acceptance criteria

**AC1.** `pnpm realtime:dev` starts the server locally with Redis + JWKS mock; a Colyseus client can connect and join a `pet-room`. Verified by `apps/realtime/src/__tests__/PetRoom.spec.ts`.

**AC2.** Joining without a JWT returns Colyseus error code `4001 unauthenticated`. Verified by integration test fixture.

**AC3.** Joining with a JWT whose `tenant_id != room.tenantId` returns `4004 cross_tenant` AND emits `security.cross-tenant.join.refused` Sentry event. Verified by `__tests__/PetRoom.spec.ts`.

**AC4.** A tampered message (HMAC fails to verify) is rejected with `4002 signature_invalid` AND increments `security.signature.invalid` metric. Verified by `__tests__/messageSigner.spec.ts`.

**AC5.** Exceeding rate limit returns `4003 rate_limit_exceeded` AND emits metric. Verified by `__tests__/rateLimiter.spec.ts` driving Redis-backed counters.

**AC6.** Impossible state transition (`feed` a pet at hunger=100) is refused, emits `security.impossible-transition` Sentry event, and increments the account's flag counter. Three such events in 24h trigger auto-ban. Verified by `__tests__/PetRoom.spec.ts`.

**AC7.** Idle room disposes after 15 min of zero clients. State is flushed to Supabase Postgres. Verified by a fast-forward test (`vi.useFakeTimers()`).

**AC8.** Graceful shutdown — on SIGTERM, server broadcasts `server.shutdown.imminent`, waits ≤ 30 s, force-disposes, exits 0. Verified by a Node child-process test that sends `SIGTERM` and asserts the lifecycle.

**AC9.** `GET /healthz` returns 200 with the documented payload. `GET /readyz` returns 503 when Redis is unreachable. Verified by integration test.

**AC10.** Dockerfile produces a reproducible image — two `docker build` runs against the same git rev produce identical `docker images --digests` SHA. Verified by `__tests__/dockerfile-reproducible.spec.ts`.

**AC11.** `terraform plan -detailed-exitcode` in `infra/terraform/realtime/` returns exit code 0 (no drift) after deployment, AND a weekly GitHub Action re-runs `terraform plan` and alerts Slack on exit 2 (drift detected).

**AC12.** Custom ESLint rule `no-math-random-in-rooms` flags `Math.random()` usage in `apps/realtime/src/rooms/` and `apps/realtime/src/state/`. Verified by ESLint fixture suite.

---

## §5 — Verification

### 5.1 — PetRoom integration test

```typescript
// apps/realtime/src/__tests__/PetRoom.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'colyseus';
import { Client } from 'colyseus.js';
import { PetRoom } from '../rooms/PetRoom';
import { startMockJwks, mintJwt } from './_helpers/jwks';

describe('TASK-INFRA-002 — PetRoom', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    port = await getFreePort();
    server = new Server({ presence: undefined as any });
    server.define('pet-room', PetRoom);
    await server.listen(port);
    await startMockJwks();
  });

  afterAll(async () => { await server.gracefullyShutdown(false); });

  it('rejects unauthenticated joins with 4001', async () => {
    const client = new Client(`ws://localhost:${port}`);
    await expect(client.joinOrCreate('pet-room')).rejects.toThrow(/4001/);
  });

  it('refuses cross-tenant joins with 4004', async () => {
    const tokenA = await mintJwt({ sub: 'u1', tenant_id: 'mochi' });
    const tokenB = await mintJwt({ sub: 'u2', tenant_id: 'techcombank' });
    const client = new Client(`ws://localhost:${port}`);
    const roomA = await client.joinOrCreate('pet-room', { token: tokenA });
    await expect(client.joinById(roomA.id, { token: tokenB }))
      .rejects.toThrow(/4004/);
  });

  it('rejects impossible state transition (feed at hunger=100)', async () => {
    const token = await mintJwt({ sub: 'u1', tenant_id: 'mochi' });
    const client = new Client(`ws://localhost:${port}`);
    const room = await client.joinOrCreate('pet-room', { token });
    // Force state into hunger=100 (test seam).
    (room as any).setStateForTest({ hunger: 100 });
    const beforeFlag = await getImpossibleTransitionFlag('u1');
    room.send('feed', { signedPayload: signHmac({ message_id: '1', body: {} }) });
    await waitMs(50);
    const afterFlag = await getImpossibleTransitionFlag('u1');
    expect(afterFlag).toBe(beforeFlag + 1);
  });
});
```

### 5.2 — Rate-limiter test

```typescript
// apps/realtime/src/__tests__/rateLimiter.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { withinLimit } from '../anticheat/rateLimiter';
import { flushRedis } from './_helpers/redis';

describe('TASK-INFRA-002 §1.8 — rate limiter', () => {
  beforeEach(flushRedis);

  it('allows up to 60 per account per minute', async () => {
    for (let i = 0; i < 60; i++) {
      expect(await withinLimit({ accountId: 'a', ip: '1.1.1.1' })).toBe(true);
    }
    expect(await withinLimit({ accountId: 'a', ip: '1.1.1.1' })).toBe(false);
  });

  it('blocks burst >10 in 1 sec', async () => {
    for (let i = 0; i < 10; i++) {
      expect(await withinLimit({ accountId: 'a', ip: '1.1.1.1' })).toBe(true);
    }
    expect(await withinLimit({ accountId: 'a', ip: '1.1.1.1' })).toBe(false);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/realtime/src/rooms/PetRoom.ts
import { _BaseTenantRoom } from './_BaseTenantRoom';
import { PetState } from '../state/PetState';
import { PlayerState } from '../state/PlayerState';
import { RoomState } from '../state/RoomState';
import { recordImpossibleTransition } from '../anticheat/impossibleTransition';

export class PetRoom extends _BaseTenantRoom<RoomState> {
  maxClients = 2;        // 1 owner + 1 co-parent per TASK-SOCIAL-002

  override async onCreate(_opts: { tenantId?: string }) {
    this.setState(new RoomState());
    this.onMessage('feed', (client, payload: { signedPayload: string }) => this.handleFeed(client, payload));
  }

  private async handleFeed(client: any, _payload: any) {
    const pet = this.state.pets.get(client.userId);
    if (!pet) return;
    if (pet.hunger >= 100) {
      recordImpossibleTransition({ playerId: client.userId, kind: 'feed-at-max' });
      return;
    }
    pet.hunger = Math.min(100, pet.hunger + 20);
    pet.lastActionId = `feed:${Date.now()}`;
    // Persist via Supabase in the dispose flush (§1.12).
  }
}
```

---

## §7 — Dependencies

**External:**
- Upstash global Redis (free tier OK at P0/P1; paid tier at P2+).
- AWS Singapore (ap-southeast-1) — ECS Fargate cluster + ALB + ECR.
- Supabase JWKS endpoint reachability.
- Sentry Node SDK + OpenTelemetry collector (P1+).

**Internal:**
- TASK-INFRA-001 (TurboRepo + TypeScript baseline).
- TASK-INFRA-003 (Supabase Postgres for state flush, lands next).

**Blocks:** TASK-PET-001, TASK-CARE-001..005, TASK-SOCIAL-001..004, TASK-AI-001, TASK-VIRAL-002, TASK-OBS-002.

---

## §8 — Example payloads

### 8.1 — Successful join handshake

```text
C → S  WS upgrade Authorization: Bearer eyJ...   (Supabase JWT)
S → C  4xx if invalid OR connect + emit {sessionSecret, roomId}
```

### 8.2 — Signed message

```json
{
  "type": "feed",
  "signedPayload": {
    "body": { "petId": "01HC7QG..." },
    "message_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
    "session_seq": 42,
    "hmac": "9b3e7d2a5c4f1b8e6d3a2c9f7b5d3a1c9e1f8b6d4c2a3e5f9b7d5a3c1e9f7b5d"
  }
}
```

### 8.3 — Cross-tenant refusal Sentry event

```json
{
  "event": "security.cross-tenant.join.refused",
  "player_id": "01HC7QG...",
  "attempted_tenant": "techcombank",
  "room_tenant": "mochi",
  "occurred_at": "2026-08-12T14:36:01Z"
}
```

### 8.4 — Healthz payload

```json
{
  "ok": true,
  "rooms_active": 142,
  "presence_connected": true,
  "ts": "2026-08-12T14:36:01.234Z"
}
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Fargate vs EC2 ASG at P0? → §1.3 — Fargate at P0/P1, ASG at P3+; switch documented in Terraform.
- **OQ-2 (resolved):** Redis Upstash global vs regional? → §1.4 — global for cross-region future tenants; free tier acceptable through P1.
- **OQ-3 (resolved):** Per-message HMAC or per-batch? → §1.7 + §2 — per-message; the latency cost is negligible.
- **OQ-4 (resolved):** What's a "session"? → bound to a single Colyseus client; secret rotates on rejoin.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Supabase JWKS endpoint down | `onAuth` fails for all joins; Sentry alert burst | New users can't join | Cache JWKS at server start with 10-min TTL; raise alert; fall back to last-known JWKS for the TTL window |
| 2 | Redis Upstash quota hit | Presence ops error; `RedisPresence` falls back to in-memory (single-instance only) | Multi-instance presence stale | Auto-scale Upstash tier; emit `infra.presence.fallback` alert |
| 3 | ALB sticky-session cookie not honoured by old Cocos client builds | Players bounced between Fargate tasks; rooms desync | UX broken | Cocos client minimum-version gate; force-update flow |
| 4 | HMAC session secret leaks via Sentry breadcrumb | Sentry security review | Anti-cheat bypassed | Strip `sessionSecret` from breadcrumbs via PII scrubber; rotate all secrets on detection |
| 5 | Impossible-transition auto-ban triggers on legitimate edge case | Player support ticket spike | False positives | Tunable threshold via `limits.yaml`; manual review queue; ban reversible |
| 6 | Fargate task hits 1000-socket limit | ECS metric `ActiveConnectionCount` | New joins refused | Switch to ASG (Terraform variable); scale horizontally |
| 7 | Colyseus 0.16.x → 0.17.x major upgrade breaks schema | Vendor changelog | Future tech debt | Upgrade task with regression test; pin until then |
| 8 | Graceful-shutdown drain time exceeded | `server.shutdown.timeout` Sentry event | Players see disconnect without warning | Lengthen drain window; investigate slow Postgres |
| 9 | Tenant-id partition forgotten on a new room class | Lint rule `tenant-id-required-on-room` | Cross-tenant data leak | ESLint rule blocks PR; runtime check in `_BaseTenantRoom` catches the test fixture |
| 10 | Redis cluster fail-over splits room state | Sentry + presence-state drift detected | Players see ghost-pet state | Auto-rebalance on rejoin; persist last-known-good state to Postgres every 30 s |
| 11 | `Math.random()` slips into a new room class | ESLint rule `no-math-random-in-rooms` | PR blocked | Refactor to `crypto.randomBytes()` via DropRateService |
| 12 | Terraform drift discovered weekly | `terraform plan` exit code 2 | Manual console edit happened | Slack alert; identify operator; either revert or codify the change |

---

## §11 — Notes

**Plan refs:** plan §PART 4 — Colyseus reasoning (same language as client, room-based, schema delta sync, AWS Singapore latency, Nakama as P3+ upgrade path).

**Sub-decisions punted to ops:**
- ECS task CPU/memory sizing — start at 0.5 vCPU / 1 GB; tune after first soft-launch load test.
- ALB target-group cookie name + duration — locked in Terraform.

**Anti-patterns explicitly forbidden:**
- Client → client direct WebSocket (everything routes through Colyseus).
- Trust-the-client state for monetised outcomes.
- `Math.random()` in `rooms/` or `state/`.
- AWS console edits without Terraform reconciliation.
- Shipping Colyseus 0.17.x mid-phase without a regression pass.

**Cross-reference:** This task is the substrate for every multi-actor gameplay task. TASK-SOCIAL-002 (PetPair co-parent), TASK-SOCIAL-003 (trade), TASK-SOCIAL-004 (wedding) all require this room scaffold.
