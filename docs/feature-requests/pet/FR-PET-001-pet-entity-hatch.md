---
id: FR-PET-001
title: "Pet entity schema (Postgres + Colyseus state) + hatch flow + naming with content-safety filter"
module: PET
priority: MUST
status: shipped
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-INFRA-002, FR-INFRA-003, FR-ART-001, FR-AUTH-001, FR-AUTH-003, FR-PET-002, FR-PET-003, FR-PET-004, FR-PET-005, FR-PET-006, FR-CARE-001, FR-AI-002, FR-OBS-001, FR-B2B-002]
depends_on: [FR-INFRA-003, FR-INFRA-002, FR-ART-001]
blocks: [FR-PET-002, FR-PET-003, FR-PET-004, FR-CARE-001, FR-CARE-002, FR-CARE-003, FR-CARE-004, FR-AR-001]
effort_hours: 10
new_files:
  - "apps/realtime/src/state/PetState.ts"
  - "apps/realtime/src/state/PlayerPetsRoster.ts"
  - "apps/realtime/src/rooms/HatchRoom.ts"
  - "apps/api/src/pets/pets.controller.ts"
  - "apps/api/src/pets/pets.service.ts"
  - "apps/api/src/pets/hatch.service.ts"
  - "apps/api/src/pets/naming/name-content-safety.service.ts"
  - "apps/api/src/pets/naming/__tests__/name-content-safety.spec.ts"
  - "apps/api/src/pets/__tests__/pets.spec.ts"
  - "apps/api/src/pets/__tests__/hatch.spec.ts"
  - "apps/cocos/assets/_root/pets/PetController.ts"
  - "apps/cocos/assets/_root/pets/HatchScene.ts"
  - "apps/cocos/assets/_root/pets/__tests__/PetController.spec.ts"
  - "infra/supabase/standard/migrations/20260517_006_pets_table.sql"
  - "infra/supabase/kids/migrations/20260517_003_pets_table.sql"
  - "docs/data/pet-entity-erd.md"
modified_files:
  - "apps/api/src/app.module.ts"
  - "apps/realtime/src/index.ts"
allowed_tools:
  - "Supabase Postgres + RLS (FR-INFRA-003)"
  - "Colyseus 0.16 + @colyseus/schema"
  - "OpenAI Moderation API (content-safety for names — FR-AI-002 wires the under-13 stricter mode)"
  - "Bad-words VN list (curated list at `apps/api/src/pets/naming/vi-blocklist.txt`)"
  - "ULID for pet IDs (sortable, time-encoding, 26-char Crockford base32 — kid-readable)"
disallowed_tools:
  - "Client-side ID generation (server-authoritative)"
  - "Auto-incrementing integer pet IDs (exposes count + race condition vulnerable)"
  - "Free-form names without content-safety filter"
  - "Hatching a pet on the kids SKU without verified parental consent (FR-AUTH-003 gate)"
risk_if_skipped: "Without a server-authoritative pet entity, every care action becomes a spoofable client write; the entire economy + permadeath + breeding stack (P2 / P3) sits on this schema; ID + naming choices made here are nearly impossible to migrate later."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Pet entity schema (Postgres).** Pets MUST persist in a `public.pets` table on the appropriate Supabase project (per FR-INFRA-003 §1.1, kids pets live in the kids project, standard pets in the standard project). Columns:
```
id            text  primary key check (id ~ '^[0-9A-HJKMNPQRSTVWXYZ]{26}$')
tenant_id     text  not null default 'mochi' check (tenant_id ~ '^[a-z0-9-]{2,32}$')
owner_id      uuid  not null references auth.users(id) on delete cascade
species       text  not null check (species in ('mochi','pengu','bao','fluffit','tako'))
display_name  text  not null check (length(display_name) <= 24)
stage         text  not null default 'egg'
              check (stage in ('egg','baby','teen','adult','grandma_house'))
born_at       timestamptz not null default now()
hatched_at    timestamptz
last_seen_at  timestamptz not null default now()
palette_seed  text  not null  -- deterministic palette derivation
audience_age_gate text not null default '13+' check (audience_age_gate in ('13+','under-13'))
status        text  not null default 'active'
              check (status in ('active','grandma','tombstoned'))
created_at    timestamptz not null default now()
```
Composite indexes on `(tenant_id, owner_id)` and `(tenant_id, status)`. RLS policy `pets self+co-parent read` allows `owner_id = auth.uid()` OR co-parent join (FR-SOCIAL-002 will extend).

§1.2  **ULID for pet IDs.** Pet IDs MUST be ULIDs (Universally Unique Lexicographically Sortable Identifiers) — 26 chars Crockford base32. ULIDs are time-encoding (first 10 chars = ms timestamp) which gives a free chronological sort and remains kid-readable for support tickets.

§1.3  **Colyseus PetState schema.** The Colyseus room state shape (per FR-INFRA-002 §1.11) MUST include a `PetState` decorated with `@type` schema fields matching the Postgres columns the client needs to render: `id, ownerId, species, stage, displayName, palette_seed, hunger, cleanliness, happiness, energy, lastActionId`. Stats (hunger / cleanliness / happiness / energy) live in `PetState` but their persistence to Postgres is FR-PET-003.

§1.4  **Hatch flow — initial pet creation.** A new player's first pet MUST be created via a dedicated hatch flow:
- `POST /v1/pets/hatch` with body `{ species: 'mochi' }` (only 'mochi' at P1 launch);
- Server validates: player has < 3 pets (free-tier cap from FR-PET-005), audience age gate matches, no recent hatch within 1 hour (debounce);
- Server creates the pet row with `stage: 'egg'`;
- Server returns `{ pet_id, hatch_animation_token }`;
- Client plays the hatch Spine animation;
- Client posts `/v1/pets/{id}/name` with the chosen display_name + content-safety token returned by the server.

§1.5  **Naming content-safety.** Display names MUST pass content-safety BEFORE being persisted:
- Length: 2–24 characters (post-trim); allowed Unicode categories: Letter, Number, Mark, plus space + hyphen + apostrophe;
- VN-specific block list at `apps/api/src/pets/naming/vi-blocklist.txt`;
- OpenAI Moderation API call (with retry + cache by name hash);
- Under-13 SKU additionally rejects: ANY person's full name pattern (basic regex), any URL pattern, any phone-number pattern (PDPL + COPPA-2025 §1.5 spirit).

Failed names return 422 `{ error: "name_rejected", reason: <slug>, suggestion?: <string> }`.

§1.6  **Palette seed.** `palette_seed` MUST be a deterministic random 16-char string generated server-side at hatch. The Spine palette (per FR-ART-001 §1.4 accessory slots) is derived from the seed via a published palette-generator function `derivePalette(seed)`. This makes every pet visually unique-ish at hatch, and reproducible (a support ticket can recover what the player saw). For FR-VIRAL-003 (generative pet from prompt/selfie), the palette_seed is overridden by the generator output.

§1.7  **Co-parent prep.** The schema MUST support a future co-parent relationship (FR-SOCIAL-002). A `pet_co_parents` join table is provisioned at this FR with columns `(pet_id, co_parent_user_id, added_at, status check in ('pending','active','removed'))`. The table is empty at P1 but its schema + RLS policy MUST be authored now to avoid migration thrash in P2.

§1.8  **Audience gate inheritance.** A pet's `audience_age_gate` MUST inherit from its owner's `app_users.audience_age_gate` at creation time. The COPPA age-gate middleware (FR-LEGAL-001 §1.10) MUST allow a pet's owner to access their own pet regardless of state (so a child whose parent revoked consent can still see "your pet has gone to grandma's" UX during the 30-day deletion grace).

§1.9  **`PlayerPetsRoster` state.** The Colyseus `PlayerPetsRoster` schema MUST hold a `MapSchema<string, PetState>` keyed by pet id, with operations: `addPet(pet)`, `removePet(petId)`, `evolvePet(petId, newStage)`. The roster is loaded from Postgres on player join (FR-INFRA-002 `onJoin`) and persisted back on idle disposal (FR-INFRA-002 §1.12).

§1.10  **Hatch animation token.** The `hatch_animation_token` returned by `/v1/pets/hatch` is a short-lived (5 min) HMAC token that the client surrenders when posting the name. This prevents a client from skipping the hatch animation + naming immediately, which would create a UX exploit (instant pet hatch + immediate trade) — and also ties analytics events to a confirmed hatch ceremony.

§1.11  **Last-seen tracking.** `last_seen_at` MUST be updated on every meaningful interaction (feed, clean, hug, mini-game, AR, name change). Decay timers (FR-PET-003) read from this column; FR-PET-008 (Permadeath-Lite) uses it as the 7-day-neglect signal.

§1.12  **Pet name uniqueness within owner.** A player's pets MUST have unique display names within their roster (case-insensitive). Cross-player duplicates are allowed (millions of "Mochi" pets is fine). Unique index on `(owner_id, lower(display_name)) where status = 'active'`.

§1.13  **Hatch rate-limit + debounce.** `/v1/pets/hatch` MUST: (a) be idempotent given an `Idempotency-Key` header; (b) be rate-limited at 3 hatches per player per 24 hours; (c) emit `pet.hatch.success` + `pet.hatch.failure { reason }` events.

§1.14  **Pet entity audit.** Every pet state transition (`hatch`, `name_changed`, `stage_changed`, `grandma`, `tombstoned`) MUST emit a row in `pet_audit_log` table (FR-INFRA-003 §1.12). Retention 7 years for kids project (COPPA), 2 years for standard.

§1.15  **Postgres → Colyseus reconciliation.** On player rejoin of a PetRoom, the server MUST: (a) fetch all `active` pets for the player from Postgres; (b) populate the Colyseus `PlayerPetsRoster`; (c) reconcile stat-bar decay (FR-PET-003) by computing time since `last_seen_at` and applying decay; (d) broadcast updated state to the client.

§1.16  **Pet deletion on owner deletion.** `pets.owner_id` has `on delete cascade`. When a player's account is deleted (FR-AUTH-001 §1.19 or FR-LEGAL-001 §1.9), all their pets are cascade-deleted, AND a tombstone row is added to `pet_audit_log` recording the deletion reason.

§1.17  **No public pet listings without privacy review.** A pet's `display_name` MUST NOT appear in any public/anonymous endpoint without explicit consent (a "make my pet public" toggle, deferred to a future FR). Trade window (FR-SOCIAL-003) is in-game and consent-gated.

§1.18  **Pet quota soft-cap.** Free tier allows 3 active pets per player; Pet+ subscription extends to 10 (FR-PET-005 final). At this FR's P1 scope, the cap is hard-coded at 3 with the entitlement check stubbed (returns "always free tier"). FR-SUB-001 wires the real entitlement.

§1.19  **Tenant partition.** Per FR-INFRA-003 §1.4, the `tenant_id` column MUST be populated at pet creation. Consumer pets get `tenant_id = 'mochi'`; PetOS B2B tenants (P4) get their own slug. Cross-tenant pet visibility is forbidden by RLS.

§1.20  **Cocos PetController component.** A Cocos component `PetController.ts` MUST attach to the rendered pet node and: (a) subscribe to the Colyseus `PetState` schema changes; (b) drive `SpineLoader.playContractAnimation` (FR-ART-001) based on state transitions; (c) emit `pet.rendered.frame` analytics every 10 seconds for performance monitoring. The component MUST gracefully no-op when state is `egg` or `grandma_house`.

---

## §2 — Why this design

**Why ULIDs over UUIDs.** ULIDs are 26 chars vs UUID-v4 36 chars — 28% shorter, slightly easier on URL bars + support-ticket inputs. Time-encoding gives chronological sort for free (useful in roster UIs). Crockford base32 character set is kid-readable (no `I/L/O/U`). UUIDv7 is functionally similar but library support is weaker.

**Why two-step hatch (egg → name).** A single `POST /v1/pets/hatch` that both creates the pet and accepts a name would either (a) require the name BEFORE the hatch animation plays (boring UX — same as filling a form), or (b) let the client decide when to send the name, which lets a sophisticated client farm "hatch tokens" + name later. The two-step + 5-min HMAC token forces the hatch ceremony before the name is locked.

**Why content-safety on names.** A pet name is rendered to the owner + co-parent + trade-counterparty + TikTok export. Letting a player name their pet `<offensive slur>` then sharing a TikTok clip of it is a brand-blast risk + Apple/Google policy hit.

**Why under-13 stricter name rules.** COPPA-2025 spirit: no PII in display names that could enable contact (full names, phone, URL). The basic-regex enforcement catches the common cases; the OpenAI Moderation API catches the rest.

**Why palette_seed not pre-baked palettes.** Pre-baked palettes per species would mean all "Mochi" pets look identical. A deterministic palette function derived from a server-side seed makes every pet ever-so-slightly different + reproducible.

**Why pet_co_parents table at P1.** Adding a column or join table later means a schema migration with downtime risk. Empty-table-at-P1 is free and prevents the future churn.

**Why `audience_age_gate` inherits from owner.** A kid who graduates to 13 (FR-INFRA-003 §1.13 graduation flow) brings their pets forward; the audience_age_gate is re-derived at graduation time. Inheritance at hatch time keeps the model consistent.

**Why hatch idempotency-key.** A flaky network on the hatch tap could cause two `/v1/pets/hatch` POSTs; without idempotency, the player gets two pets and burns a slot. Idempotency-key is the standard fix.

**Why 5-min HMAC hatch token.** Long enough for the artist's hatch animation (~30 s) + naming UX (~2 min); short enough that a captured token isn't replayable. The HMAC ties the token to a specific player + species so it cannot be reused for a different species/player.

**Why unique pet names within owner.** Multiple "Mochi"s in the same roster causes UI ambiguity ("which Mochi did you feed?"). Cross-player duplicates are fine — separate rosters never interact at the name layer.

**Why `last_seen_at` not `last_action_at`.** "Seen" includes passive viewing (open the pet screen, look at AR). FR-PET-003 stat decay should restart on view, not require interaction — viewing is the "the player checked on the pet" signal.

**Why `on delete cascade`.** GDPR Article 17 + COPPA-2025 erasure require full removal. Cascade is the simplest correct behaviour; the audit row preserves the *fact* of deletion (FR-LEGAL-001 §3.6).

**Why no public pet listings at P1.** Privacy-by-default. A public-pet toggle is a real privacy decision that needs its own FR (probably P2 or later, gated by Trust & Safety review for the kids SKU).

**Why PetController emits perf events.** Cocos's runtime can stutter on lower-end devices; a 10-second cadence performance event lets us detect device-class performance regressions without bloating analytics volume.

---

## §3 — API contract & code shape

### 3.1 — Hatch controller

```typescript
// apps/api/src/pets/pets.controller.ts
@Controller('v1/pets')
@UseGuards(SupabaseJwtGuard)
export class PetsController {
  constructor(
    private readonly hatch: HatchService,
    private readonly naming: NameContentSafetyService,
    private readonly pets: PetsService,
  ) {}

  @Post('hatch')
  @Header('Idempotency-Key', { required: true })
  async hatch(@CurrentUser() u: AuthedUser, @Body() body: { species: PetSpecies }, @Headers('idempotency-key') idemp: string) {
    return this.hatch.requestHatch(u, body.species, idemp);
  }

  @Post(':id/name')
  async name(@CurrentUser() u: AuthedUser, @Param('id') id: string,
             @Body() body: { display_name: string; hatch_animation_token: string }) {
    await this.naming.assertSafe(body.display_name, { audience: u.audience_age_gate });
    return this.pets.confirmName(u, id, body);
  }

  @Get()
  async list(@CurrentUser() u: AuthedUser) {
    return this.pets.listOwned(u.id);
  }
}
```

### 3.2 — Colyseus `PetState` (extended from FR-INFRA-002)

```typescript
// apps/realtime/src/state/PetState.ts
import { Schema, type, MapSchema } from '@colyseus/schema';

export class PetState extends Schema {
  @type('string')  id = '';
  @type('string')  ownerId = '';
  @type('string')  species = 'mochi';
  @type('string')  displayName = '';
  @type('string')  stage = 'egg';
  @type('string')  paletteSeed = '';
  @type('number')  hunger = 100;
  @type('number')  cleanliness = 100;
  @type('number')  happiness = 100;
  @type('number')  energy = 100;
  @type('number')  ageMinutes = 0;
  @type('string')  lastActionId = '';
  @type('string')  audienceAgeGate = '13+';
}

export class PlayerPetsRoster extends Schema {
  @type({ map: PetState }) pets = new MapSchema<PetState>();
}
```

### 3.3 — Naming content-safety

```typescript
// apps/api/src/pets/naming/name-content-safety.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAIModeration } from '../../external/openai-moderation.client';
import { viBlocklist } from './vi-blocklist';

const PERSON_NAME_LIKE = /\b([A-Z][a-z]{1,}\s+[A-Z][a-z]{1,})\b/;
const PHONE_LIKE       = /\d{3,}[- ]?\d{3,}/;
const URL_LIKE         = /(https?:\/\/|www\.|\.\w{2,})/i;

@Injectable()
export class NameContentSafetyService {
  constructor(private readonly mod: OpenAIModeration) {}

  async assertSafe(name: string, ctx: { audience: '13+' | 'under-13' }): Promise<void> {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 24) throw new BadRequest({ error: 'name_rejected', reason: 'length' });

    const lower = trimmed.toLowerCase();
    for (const banned of viBlocklist) if (lower.includes(banned)) throw new BadRequest({ error: 'name_rejected', reason: 'blocklist' });

    if (ctx.audience === 'under-13') {
      if (PERSON_NAME_LIKE.test(trimmed)) throw new BadRequest({ error: 'name_rejected', reason: 'pii_like_name' });
      if (PHONE_LIKE.test(trimmed))       throw new BadRequest({ error: 'name_rejected', reason: 'pii_like_phone' });
      if (URL_LIKE.test(trimmed))         throw new BadRequest({ error: 'name_rejected', reason: 'pii_like_url' });
    }

    const r = await this.mod.classify(trimmed);
    if (r.flagged) throw new BadRequest({ error: 'name_rejected', reason: 'moderation_flagged' });
  }
}
```

### 3.4 — Pets migration (standard project)

```sql
-- infra/supabase/standard/migrations/20260517_006_pets_table.sql
create table public.pets (
  id text primary key
     check (id ~ '^[0-9A-HJKMNPQRSTVWXYZ]{26}$'),
  tenant_id text not null default 'mochi'
     check (tenant_id ~ '^[a-z0-9-]{2,32}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  species text not null check (species in ('mochi','pengu','bao','fluffit','tako')),
  display_name text not null check (length(display_name) <= 24),
  stage text not null default 'egg'
     check (stage in ('egg','baby','teen','adult','grandma_house')),
  born_at timestamptz not null default now(),
  hatched_at timestamptz,
  last_seen_at timestamptz not null default now(),
  palette_seed text not null,
  audience_age_gate text not null default '13+' check (audience_age_gate in ('13+','under-13')),
  status text not null default 'active' check (status in ('active','grandma','tombstoned')),
  created_at timestamptz not null default now()
);
create index on public.pets (tenant_id, owner_id);
create index on public.pets (tenant_id, status);
create unique index on public.pets (owner_id, lower(display_name)) where status = 'active';

alter table public.pets enable row level security;
create policy "pets self read"   on public.pets for select using (owner_id = auth.uid());
create policy "pets self update" on public.pets for update using (owner_id = auth.uid());

-- pet_co_parents prep for FR-SOCIAL-002
create table public.pet_co_parents (
  pet_id text not null references public.pets(id) on delete cascade,
  co_parent_user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','active','removed')),
  primary key (pet_id, co_parent_user_id)
);
alter table public.pet_co_parents enable row level security;
```

---

## §4 — Acceptance criteria

**AC1.** `POST /v1/pets/hatch` with valid auth + `Idempotency-Key` creates a pet row with `stage='egg'` AND returns `pet_id` + `hatch_animation_token`. Verified by `__tests__/hatch.spec.ts`.

**AC2.** A second hatch call with the same `Idempotency-Key` returns the same pet (no duplicate). Verified by spec test.

**AC3.** A 4th hatch within 24 h is rejected with `429 Too Many Requests`. Verified by spec test pumping requests.

**AC4.** `POST /v1/pets/:id/name` rejects a name that fails content-safety, returning HTTP 422 + reason. Verified by `__tests__/name-content-safety.spec.ts` with multiple fixtures (length, blocklist, person-name, phone, URL, moderation).

**AC5.** Under-13 SKU rejects names matching person-name/phone/URL patterns; 13+ SKU allows them (still subject to moderation). Verified by spec test driving both audiences.

**AC6.** Pet ULID format is enforced. Verified by inserting a non-ULID id (e.g. `'bad-id'`) and asserting Postgres constraint fail.

**AC7.** Unique pet name index enforced — second pet with same `display_name` under same owner returns HTTP 409. Verified by spec test.

**AC8.** Pet RLS — player A cannot SELECT player B's pets. Verified by `__tests__/pets.spec.ts` with two seeded users + anon client.

**AC9.** Colyseus PetRoom on player join loads all `active` pets and broadcasts initial state. Verified by `__tests__/PetRoom.spec.ts` integration test with seeded pets.

**AC10.** Tenant partition — a pet created via tenant slug `techcombank` (B2B P4 use case) is invisible to a tenant `mochi` query. Verified by RLS test driving `app.tenant_id`.

**AC11.** Cascade delete — deleting an `auth.users` row removes the player's pets AND adds tombstone audit row. Verified by spec test.

**AC12.** `last_seen_at` updates on rename. Verified by spec test asserting timestamp diff.

**AC13.** Palette_seed is generated server-side (no client-supplied seed accepted). Verified by spec test attempting client-supplied seed and asserting it's ignored.

**AC14.** `pet.hatch.success` event emitted with the documented schema. Verified by `__tests__/pets.spec.ts` + obs schema validation.

---

## §5 — Verification

### 5.1 — Hatch flow integration test

```typescript
// apps/api/src/pets/__tests__/hatch.spec.ts
import { describe, it, expect } from 'vitest';
import { request } from './_helpers/http';

describe('FR-PET-001 — hatch flow', () => {
  it('creates a pet with stage egg + returns hatch token', async () => {
    const r = await request.post('/v1/pets/hatch')
      .set('Authorization', `Bearer ${TOKEN}`)
      .set('Idempotency-Key', 'k1')
      .send({ species: 'mochi' });
    expect(r.status).toBe(201);
    expect(r.body.pet_id).toMatch(/^[0-9A-HJKMNPQRSTVWXYZ]{26}$/);
    expect(r.body.hatch_animation_token).toBeTruthy();
    const pet = await db.pets.byId(r.body.pet_id);
    expect(pet.stage).toBe('egg');
  });

  it('is idempotent on same key', async () => {
    const r1 = await request.post('/v1/pets/hatch').set('Authorization', `Bearer ${TOKEN}`).set('Idempotency-Key', 'k2').send({ species: 'mochi' });
    const r2 = await request.post('/v1/pets/hatch').set('Authorization', `Bearer ${TOKEN}`).set('Idempotency-Key', 'k2').send({ species: 'mochi' });
    expect(r1.body.pet_id).toBe(r2.body.pet_id);
  });

  it('rejects 4th hatch within 24h', async () => {
    for (let i = 0; i < 3; i++) {
      await request.post('/v1/pets/hatch').set('Authorization', `Bearer ${TOKEN}`).set('Idempotency-Key', `k${i+10}`).send({ species: 'mochi' });
    }
    const r4 = await request.post('/v1/pets/hatch').set('Authorization', `Bearer ${TOKEN}`).set('Idempotency-Key', 'k99').send({ species: 'mochi' });
    expect(r4.status).toBe(429);
  });
});
```

### 5.2 — Naming content-safety test

```typescript
// apps/api/src/pets/naming/__tests__/name-content-safety.spec.ts
import { describe, it, expect } from 'vitest';
import { NameContentSafetyService } from '../name-content-safety.service';

describe('FR-PET-001 §1.5 — name content-safety', () => {
  const svc = new NameContentSafetyService(fakeModeration({ flagFor: ['offensive_word'] }));

  it('accepts a clean name', async () => {
    await expect(svc.assertSafe('Mochi-chan', { audience: '13+' })).resolves.toBeUndefined();
  });

  it.each([
    ['',                  'length'],
    ['x',                 'length'],
    ['x'.repeat(25),      'length'],
    ['offensive_word',    'moderation_flagged'],
  ])('rejects %s with reason %s', async (name, reason) => {
    await expect(svc.assertSafe(name, { audience: '13+' })).rejects.toMatchObject({ reason });
  });

  it('under-13 rejects person-name pattern', async () => {
    await expect(svc.assertSafe('John Smith', { audience: 'under-13' })).rejects.toMatchObject({ reason: 'pii_like_name' });
  });

  it('under-13 rejects phone-like pattern', async () => {
    await expect(svc.assertSafe('call 555-1234', { audience: 'under-13' })).rejects.toMatchObject({ reason: 'pii_like_phone' });
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/pets/hatch.service.ts
@Injectable()
export class HatchService {
  constructor(
    private readonly supa: SupabaseClient,
    private readonly throttle: HatchThrottle,
    private readonly idemp: IdempotencyStore,
    private readonly audit: AuditLogService,
  ) {}

  async requestHatch(u: AuthedUser, species: PetSpecies, idempKey: string) {
    const prior = await this.idemp.lookup(u.id, idempKey);
    if (prior) return prior;
    await this.throttle.assertWithinLimit(u.id);
    if (await this.supa.from('pets').select('id', { count: 'exact', head: true })
                      .eq('owner_id', u.id).eq('status', 'active').then(r => (r.count ?? 0) >= 3)) {
      throw new HttpException('pet_quota_exceeded', 403);
    }
    const id = generateUlid();
    const paletteSeed = randomBytes(8).toString('hex');
    await this.supa.from('pets').insert({
      id, owner_id: u.id, tenant_id: u.tenant_id, species,
      display_name: 'Egg', stage: 'egg', palette_seed: paletteSeed,
      audience_age_gate: u.audience_age_gate,
    });
    const token = signHatchToken({ pet_id: id, expiresInSec: 300 });
    await this.audit.write({ who: u.id, what: 'pet.hatch.success', what_keys: { pet_id: id } });
    const result = { pet_id: id, hatch_animation_token: token };
    await this.idemp.store(u.id, idempKey, result);
    return result;
  }
}
```

---

## §7 — Dependencies

**External:** OpenAI Moderation API (free tier sufficient at P0/P1 volume); ULID-generation library (npm `ulid`); Supabase Postgres.

**Internal:** FR-INFRA-003 (Supabase + RLS + tenant partition); FR-INFRA-002 (Colyseus + JWT-verified onJoin); FR-ART-001 (Spine pipeline + contract animations for the hatch ceremony).

**Blocks:** FR-PET-002 (evolution stages — needs `stage` column + animation hooks); FR-PET-003 (stat-bar decay reads `last_seen_at`); FR-PET-004 (onboarding flow drives the hatch UX); FR-CARE-001/002/003/004 (care actions mutate stat columns); FR-AR-001 (AR placement renders the same skeleton).

---

## §8 — Example payloads

### 8.1 — `POST /v1/pets/hatch`

```http
POST /v1/pets/hatch
Authorization: Bearer eyJ...
Idempotency-Key: 01HC7QGZK4XN8YA1J3WB6EFR8
Content-Type: application/json
{ "species": "mochi" }

→ 201 Created
{
  "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "hatch_animation_token": "eyJhbGciOi..."
}
```

### 8.2 — `POST /v1/pets/:id/name`

```http
POST /v1/pets/01HC7QGZK4XN8YA1J3WB6EFR8/name
Authorization: Bearer eyJ...
Content-Type: application/json
{
  "display_name": "Mochi-chan",
  "hatch_animation_token": "eyJhbGciOi..."
}

→ 200 OK
{ "pet_id": "01HC7QGZK4XN8YA1J3WB6EFR8", "display_name": "Mochi-chan", "stage": "baby" }
```

### 8.3 — Name rejection

```json
{
  "error": "name_rejected",
  "reason": "pii_like_phone",
  "suggestion": null
}
```

### 8.4 — Pet row at rest

```json
{
  "id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "tenant_id": "mochi",
  "owner_id": "01HC7QGZK4XN8YA1J3WB6XX99",
  "species": "mochi",
  "display_name": "Mochi-chan",
  "stage": "baby",
  "born_at": "2026-08-12T14:36:01Z",
  "hatched_at": "2026-08-12T14:38:24Z",
  "last_seen_at": "2026-08-12T14:38:24Z",
  "palette_seed": "9b3e7d2a5c4f1b8e",
  "audience_age_gate": "13+",
  "status": "active"
}
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** ULID vs UUIDv7? → §2 — ULID, kid-readable + mature library.
- **OQ-2 (resolved):** Two-step hatch (egg → name) vs one-step? → §1.4 + §2 — two-step preserves the hatch-ceremony UX + analytics integrity.
- **OQ-3 (resolved):** Where lives stat-bar decay logic? → §1.11 + FR-PET-003 — FR-PET-003 owns decay rates; this FR provides the `last_seen_at` substrate.
- **OQ-4 (resolved):** Cross-player name uniqueness? → §1.12 — unique within owner only.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Concurrent hatch race (same Idempotency-Key, two requests) | Idempotency store conflict | Same pet returned to both | Idempotency store wins; second request reads back the first result |
| 2 | Hatch token expired before naming | `pets.hatch_animation_token.expired` HTTP 410 | UX: replay hatch ceremony | Re-issue token via `/v1/pets/:id/regenerate-name-token` |
| 3 | Content-safety vendor (OpenAI Moderation) outage | API timeout / 5xx | Naming blocked | Fallback to length + blocklist only; emit `naming.moderation.fallback` Sentry warn |
| 4 | Bad-words list out of date | Player support ticket | Offensive name slips through | Add to blocklist; audit recent hatches for retroactive review |
| 5 | Pet ULID collision (astronomically unlikely) | DB unique constraint error | One client gets 500 | Regenerate ULID; retry; surface only if persistent |
| 6 | RLS misconfigured — cross-player visibility | `__tests__/pets.spec.ts` RLS test fails | COPPA exposure | Re-tighten RLS; audit Sentry for affected rows |
| 7 | Tenant partition forgotten on insert | `tenant_id_required` trigger fail | Insert rejected | Bug in pet creation path; patch caller |
| 8 | Hatch quota soft-cap of 3 incorrect on Pet+ user | Entitlement service returns wrong tier | UX shows wrong message | FR-PET-005 entitlement integration during P2 fixes; meanwhile manual cap override via DPO |
| 9 | `last_seen_at` not updated on rename | Stat-bar decay too aggressive | UX regression | Audit code paths; add missing update |
| 10 | Colyseus state not reconciled on rejoin | Player sees stale stats | UX desync | Force-reload from Postgres; investigate dispose flush |
| 11 | Cascade delete leaves orphan rows in `pet_co_parents` | Daily reconciliation Sentry | Inconsistent data | Force-cascade trigger on `pets` delete |
| 12 | Pet name uniqueness collision in legacy data (P2 migration) | Migration error | Migration fails | DPO-led name-disambiguation pass; resume migration |

---

## §11 — Notes

**Plan refs:** plan §PART 3 (core loop), plan §PART 4 (anti-cheat — server-authoritative), plan §PART 5 (one pet at launch).

**Sub-decisions punted to ops:**
- Final blocklist VN content — owned by Trust & Safety hire (post-P0).
- Palette derivation function spec — locked in `apps/api/src/pets/palette/derive-palette.ts` annex.

**Anti-patterns explicitly forbidden:**
- Client-side pet ID generation.
- Free-form display names with no moderation.
- Soft-deletion + hard-delete combinations without an audit row.
- Cross-tenant pet visibility.

**Cross-reference:** This FR is the substrate for the entire pet entity. FR-PET-002/003/004 + every CARE FR + every SOCIAL FR + every ECON FR reads/writes this schema.
