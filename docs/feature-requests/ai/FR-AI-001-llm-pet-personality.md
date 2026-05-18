---
id: FR-AI-001
title: "LLM pet personality — Claude Haiku primary + Gemini Flash fallback + persona YAML + 20-event memory + cost cap"
module: AI
priority: MUST
status: shipped
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-PET-001, FR-PET-002, FR-PET-003, FR-AI-002, FR-INFRA-002, FR-INFRA-003, FR-CARE-001, FR-CARE-002, FR-CARE-003, FR-VIRAL-002, FR-VIRAL-003, FR-AI-003, FR-OBS-001, FR-LEGAL-001]
depends_on: [FR-PET-002, FR-INFRA-002]
blocks: [FR-AI-002, FR-VIRAL-002, FR-VIRAL-003, FR-AI-003]
effort_hours: 12
new_files:
  - "apps/api/src/ai/persona/persona.service.ts"
  - "apps/api/src/ai/persona/persona-yaml.ts"
  - "apps/api/src/ai/persona/event-memory.service.ts"
  - "apps/api/src/ai/persona/llm-router.service.ts"
  - "apps/api/src/ai/persona/claude-haiku-adapter.ts"
  - "apps/api/src/ai/persona/gemini-flash-adapter.ts"
  - "apps/api/src/ai/persona/cost-cap.service.ts"
  - "apps/api/src/ai/persona/cache.service.ts"
  - "apps/api/src/ai/persona/__tests__/persona.spec.ts"
  - "apps/api/src/ai/persona/__tests__/llm-router.spec.ts"
  - "apps/api/src/ai/persona/__tests__/cost-cap.spec.ts"
  - "apps/cocos/assets/_root/ai/AiSpeechBubble.ts"
  - "apps/cocos/assets/_root/ai/__tests__/AiSpeechBubble.spec.ts"
  - "infra/supabase/standard/migrations/20260517_013_ai_persona.sql"
modified_files:
  - "apps/api/src/care/feed.service.ts"
  - "apps/api/src/care/hug.service.ts"
  - "apps/api/src/care/mini-game/mini-game.service.ts"
allowed_tools:
  - "Anthropic Claude Haiku 4.5 API (primary)"
  - "Google Gemini 2.0 Flash API (fallback)"
  - "Redis (response cache + cost-cap counter)"
  - "Supabase Postgres (persona + event memory)"
disallowed_tools:
  - "Generative LLM chat to under-13 SKU (FR-AI-002 wires the scripted-tree replacement)"
  - "Free-form user-supplied prompts to the LLM (system prompt + structured event context only)"
  - "Storing raw LLM responses without content-safety filter (FR-AI-002 gate)"
  - "OpenAI for generative chat (cost + data-residency — moderation-only via OpenAI elsewhere)"
risk_if_skipped: "Plan §PART 3 viral hook #3 — AI personality is the documented unfair-advantage differentiator from Pou/Talking Tom. Without LLM persona, the consumer-game differentiation collapses to UI polish. Cost cap is the load-bearing mitigation against unbounded API spend."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Standard SKU only.** Per FR-LEGAL-001 §1.5 + FR-AUTH-003, LLM generative chat is forbidden in the kids SKU. Under-13 pets use scripted dialogue trees (FR-AI-002). This FR specs the 13+ SKU pipeline only.

§1.2  **Persona YAML.** Each pet has a `persona.yaml` (~300 tokens max) describing: species-archetype tone, vocabulary preferences, mood-stage variants, off-limits topics. Stored in `apps/api/src/ai/persona/species/<species>.yaml` for species defaults; per-pet overrides stored in DB.

§1.3  **Event memory — last 20 events.** The persona service maintains a per-pet rolling memory of the last 20 events: care actions (feed/clean/hug/mini-game), evolution stages, stat warnings, owner sign-in pings, AR placements. Stored in `pet_event_memory` table with `(pet_id, event_id, kind, payload_summary, occurred_at)`. Used as context for next LLM dialogue.

§1.4  **Endpoint.** `POST /v1/ai/pet/:petId/speak` — body `{ trigger: 'idle'|'after_care'|'after_mini_game'|'evolution'|'time_of_day', context_overrides?: object }`. Returns `{ text, sentiment, animation_hint, ttl_sec }`.

§1.5  **System prompt structure.** Server builds a system prompt:
```
You are {pet.display_name}, a {species} pet who is {stage} stage.
Personality: {persona.yaml}
Recent events: {last_20_events}
Current stats: hunger {h}, cleanliness {c}, happiness {hp}, energy {e}.
Owner just did: {trigger}.

Reply in ≤ 80 characters, first-person. Avoid: personal questions about the owner,
URLs, phone numbers, capitalised slogans. Match the persona tone.
```
Strict shape; user input never reaches the prompt directly.

§1.6  **Claude Haiku primary.** Default model is `claude-haiku-4-5-20251001` via Anthropic API. Output cap: 100 tokens. Temperature 0.7.

§1.7  **Gemini Flash fallback.** When Anthropic returns 429/5xx OR latency > 3s, route to `gemini-2.0-flash`. Document the fallback ratio per OBS dashboard.

§1.8  **Aggressive caching.** Cache key = `sha256(system_prompt)` — identical prompts hit Redis cache (24h TTL). Plan §PART 4 — cache-first is the cost-control lever.

§1.9  **Cost cap per pet per day.** Each pet has a daily LLM-call cap: 30 calls. Beyond, the persona falls back to a 12-line scripted bank (FR-AI-002 reuses these for the kids SKU). Cap reset at player's local midnight.

§1.10  **Cost cap per player per day.** Global player cap of 100 LLM calls/day (covers multi-pet Pet+ users). Beyond → scripted fallback.

§1.11  **Content safety gating.** Every LLM response MUST pass through FR-AI-002's content-safety classifier BEFORE being returned to the client. Failures emit `ai.persona.safety_blocked` event + a generic safe response substitutes.

§1.12  **Response shape.** API returns:
```typescript
{
  text: string;              // ≤ 80 chars
  sentiment: 'happy'|'neutral'|'sad'|'tired'|'excited';
  animation_hint: 'idle_baby'|'happy'|'dance'|'sad'|...;  // FR-ART-001 contract name
  source_model: 'claude-haiku'|'gemini-flash'|'scripted_fallback';
  ttl_sec: number;           // cache TTL hint to client
}
```

§1.13  **Latency budget.** P95 end-to-end ≤ 2s (including cache lookup + LLM call + content-safety pass). Beyond → scripted fallback.

§1.14  **No user-supplied prompts.** The endpoint takes only structured `trigger` + optional `context_overrides` (whitelist fields like `current_time_of_day`). Free-form text from clients is rejected.

§1.15  **Event memory persistence.** `pet_event_memory` rotates the oldest event when 20 reached. Retention 90 days (analytics) + RLS owner-only read.

§1.16  **Persona schema validation.** Per-species YAML files MUST validate against `apps/api/src/ai/persona/persona-schema.zod.ts`. Loaded once at server boot.

§1.17  **Sentiment → animation mapping.** The LLM response includes a sentiment field; server maps it to a FR-ART-001 contract animation: happy → `happy`, sad → `sad`, tired → `sick`, excited → `dance`, neutral → idle. The mapping table is `apps/api/src/ai/persona/sentiment-anim-map.ts`.

§1.18  **Cocos `AiSpeechBubble.ts`.** Cocos component renders the response: speech bubble UI + plays the suggested animation + reads aloud (TTS optional, opt-in). Renders gracefully for `scripted_fallback` (subset of phrases).

§1.19  **Observability.** `ai.persona.call { model, latency_ms, cached, tokens_used, cost_cents }` + `ai.persona.cost_cap_hit` + `ai.persona.safety_blocked` events.

§1.20  **Cost monitoring + alerts.** Daily aggregated LLM spend per tenant tracked. Alert when daily spend exceeds $50 (initial budget) — surface in OBS dashboard. Per FR-OBS-001 critical-incident rules.

---

## §2 — Why this design

**Why Claude Haiku primary.** Per plan §PART 4 — $0.25/M input + $1.25/M output = sub-$0.005 per pet-speech with 80-token responses. Haiku is the cheapest model with good persona-following ability.

**Why Gemini Flash fallback.** Two-vendor redundancy. Anthropic outages are real; Gemini Flash is the cheapest alternative with comparable persona quality at $0.075/M input.

**Why ≤ 300 token persona YAML.** Plan §PART 4. Anything larger inflates per-call cost.

**Why 20-event memory.** Plan §PART 4. Smaller (10) loses context for varied dialogue; larger (50+) blows the token budget per call.

**Why 30 calls/pet/day + 100/player/day.** Plan retention math: 60-second sessions, 4-5 trigger moments per session, ~30 active triggers/day per pet. 30 cap matches realistic engagement; 100/player is a Pet+ multi-pet ceiling.

**Why scripted fallback when cap hit.** Plan §PART 4 — keep cost predictable. Falling back to scripted phrases at cap is invisible to the player as long as the bank is varied (FR-AI-002's 12 lines is the minimum).

**Why no user-supplied prompts.** Plan §PART 11 prompt-injection trust model — player text is adversarial input. Injecting it into the LLM prompt opens jailbreak attacks ("ignore previous instructions and...").

**Why content-safety gating on output.** LLM hallucinations + jailbreak attempts can produce harmful text. FR-AI-002 classifier is the canonical gate.

**Why aggressive caching.** Plan §PART 4 — caching is the cost-control lever. Most pets in similar stat+stage states get similar prompts; cache hit rate target ≥ 50%.

**Why kids SKU explicitly excluded.** Snap My AI / Replika regulatory precedent. Plan §PART 4. Scripted trees in FR-AI-002.

**Why no OpenAI for generation.** Cost + data-residency concerns. OpenAI is used only for moderation in this stack.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/ai/persona/persona.service.ts
@Injectable()
export class PersonaService {
  constructor(
    private readonly router: LlmRouter,
    private readonly safety: ContentSafetyService,
    private readonly memory: EventMemoryService,
    private readonly costCap: CostCapService,
    private readonly cache: PersonaCacheService,
  ) {}

  async speak(petId: string, ownerId: string, trigger: PersonaTrigger): Promise<PersonaResponse> {
    if ((await this.userSkuFor(ownerId)) === 'kids') throw new HttpException('ai.kids.forbidden', 403);
    if (await this.costCap.exceededForPet(petId)) return this.scripted(trigger);
    if (await this.costCap.exceededForPlayer(ownerId)) return this.scripted(trigger);
    const prompt = await this.buildPrompt(petId, trigger);
    const cached = await this.cache.get(prompt);
    if (cached) return { ...cached, source_model: cached.source_model + '+cache' as any };
    const llmResp = await this.router.complete(prompt, { maxTokens: 100, temperature: 0.7 });
    const safe = await this.safety.assertSafe(llmResp.text);
    if (!safe.ok) {
      this.audit.emit('ai.persona.safety_blocked', { pet_id: petId, reason: safe.reason });
      return this.scripted(trigger);
    }
    const sentiment = this.inferSentiment(llmResp.text);
    const response: PersonaResponse = {
      text: llmResp.text,
      sentiment,
      animation_hint: SENTIMENT_TO_ANIM[sentiment],
      source_model: llmResp.model,
      ttl_sec: 60,
    };
    await this.cache.set(prompt, response, 86400);
    await this.costCap.recordCall(petId, ownerId, llmResp.cost_cents);
    return response;
  }
}
```

```typescript
// apps/api/src/ai/persona/llm-router.service.ts
@Injectable()
export class LlmRouter {
  constructor(private readonly anthropic: ClaudeHaikuAdapter, private readonly gemini: GeminiFlashAdapter) {}
  async complete(prompt: string, opts: { maxTokens: number; temperature: number }): Promise<{ text: string; model: string; cost_cents: number }> {
    try {
      const t0 = Date.now();
      const r = await this.anthropic.complete(prompt, opts);
      if (Date.now() - t0 > 3000) throw new Error('latency_exceeded');
      return { ...r, model: 'claude-haiku' };
    } catch (err: any) {
      this.fallbackAlert(err);
      const r = await this.gemini.complete(prompt, opts);
      return { ...r, model: 'gemini-flash' };
    }
  }
}
```

```sql
-- infra/supabase/standard/migrations/20260517_013_ai_persona.sql
create table public.pet_persona_overrides (
  pet_id text primary key references public.pets(id) on delete cascade,
  yaml text not null,
  updated_at timestamptz not null default now()
);

create table public.pet_event_memory (
  id bigserial primary key,
  pet_id text not null references public.pets(id) on delete cascade,
  kind text not null,
  payload_summary jsonb not null,
  occurred_at timestamptz not null default now()
);
create index on public.pet_event_memory (pet_id, occurred_at desc);
alter table public.pet_event_memory enable row level security;
create policy "event_memory self" on public.pet_event_memory for select
  using (pet_id in (select id from public.pets where owner_id = auth.uid()));
```

---

## §4 — Acceptance criteria

**AC1.** `POST /v1/ai/pet/:id/speak` on standard SKU returns text ≤ 80 chars + sentiment + animation_hint. Verified.
**AC2.** Same endpoint on kids SKU returns 403 `ai.kids.forbidden`. Verified.
**AC3.** Cost cap (30 calls/pet/day) — 31st call falls back to scripted. Verified.
**AC4.** Player cost cap (100/day) — 101st call falls back. Verified.
**AC5.** Cache hit returns response without LLM call (assert via spy). Verified.
**AC6.** Claude latency > 3s OR 5xx → Gemini fallback. Verified with mocked adapters.
**AC7.** Content-safety block → scripted fallback + `ai.persona.safety_blocked` event. Verified.
**AC8.** Event memory rotates at 21st event. Verified.
**AC9.** User-supplied free-form text in body is rejected. Verified.
**AC10.** Sentiment→animation mapping correct. Verified.
**AC11.** Daily spend dashboard captures cost in cents. Verified by spec test asserting cost_cents recorded.
**AC12.** Persona YAML schema validation rejects malformed YAML at boot. Verified.

---

## §5 — Verification

```typescript
// apps/api/src/ai/persona/__tests__/persona.spec.ts
describe('FR-AI-001 — persona', () => {
  it('blocks kids SKU', async () => {
    await expect(svc.speak('pet', 'kid-user', 'idle')).rejects.toMatchObject({ status: 403 });
  });

  it('falls back to scripted at cap', async () => {
    await consumeAllCalls('pet1');
    const r = await svc.speak('pet1', 'u1', 'idle');
    expect(r.source_model).toBe('scripted_fallback');
  });

  it('routes to Gemini on Claude 5xx', async () => {
    vi.spyOn(anthropic, 'complete').mockRejectedValue(new Error('5xx'));
    vi.spyOn(gemini, 'complete').mockResolvedValue({ text: 'hi', cost_cents: 1 });
    const r = await svc.speak('pet', 'u1', 'idle');
    expect(r.source_model).toMatch(/gemini/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/ai/persona/cost-cap.service.ts
@Injectable()
export class CostCapService {
  constructor(@Inject('REDIS') private readonly redis: RedisClientType) {}
  async exceededForPet(petId: string): Promise<boolean> {
    const day = todayUtc();
    const n = parseInt((await this.redis.get(`cc:pet:${day}:${petId}`)) ?? '0', 10);
    return n >= 30;
  }
  async exceededForPlayer(userId: string): Promise<boolean> {
    const n = parseInt((await this.redis.get(`cc:user:${todayUtc()}:${userId}`)) ?? '0', 10);
    return n >= 100;
  }
  async recordCall(petId: string, userId: string, costCents: number): Promise<void> {
    const day = todayUtc();
    await this.redis.incr(`cc:pet:${day}:${petId}`);
    await this.redis.expire(`cc:pet:${day}:${petId}`, 36*3600);
    await this.redis.incr(`cc:user:${day}:${userId}`);
    await this.redis.expire(`cc:user:${day}:${userId}`, 36*3600);
    await this.redis.incrBy(`cc:spend:${day}`, costCents);
  }
}
```

---

## §7 — Dependencies

**External:** Anthropic Claude Haiku API; Google Gemini Flash API; Redis.
**Internal:** FR-PET-002 (stage in prompt), FR-PET-003 (stats in prompt), FR-AI-002 (content safety gate), FR-INFRA-002 (Colyseus events feed event-memory), FR-INFRA-003 (Supabase persistence), FR-LEGAL-001 (SKU gate).
**Blocks:** FR-VIRAL-002 (Daily Drama uses persona), FR-VIRAL-003 (generative pet), FR-AI-003 (personality v2).

---

## §8 — Example payloads

```http
POST /v1/ai/pet/01HC.../speak
{ "trigger": "after_care" }
→ 200
{
  "text": "Mmm, thanks for the snack! Feeling 30% less grumpy now.",
  "sentiment": "happy",
  "animation_hint": "happy",
  "source_model": "claude-haiku",
  "ttl_sec": 60
}
```

```json
{ "error": "ai.kids.forbidden", "guidance": "Use scripted dialogue tree via FR-AI-002." }
```

```json
{ "event": "ai.persona.call", "pet_id": "01HC...", "model": "claude-haiku", "latency_ms": 642, "cached": false, "tokens_used": 88, "cost_cents": 0.4 }
```

```json
{ "event": "ai.persona.cost_cap_hit", "pet_id": "01HC...", "scope": "pet_daily", "remaining_calls": 0 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Claude vs Gemini primary? → §1.6 + §2 — Claude Haiku (best cost/quality at 100-token responses).
- **OQ-2 (resolved):** Cost cap math? → §1.9/1.10 + §2 — 30 pet / 100 player / day.
- **OQ-3 (resolved):** Free-form prompts? → §1.14 — never (prompt-injection model).
- **OQ-4 (resolved):** OpenAI for chat? → §`disallowed_tools` — moderation only.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Anthropic API outage | 5xx error rate | Gemini fallback | Both vendors → scripted fallback |
| 2 | Both vendors down | High failure rate | Scripted only | Surface "Mochi is sleepy today" UX |
| 3 | Cost cap counter Redis lost | Counter resets | Burst calls until reset | Conservative fallback: assume capped |
| 4 | Cache key collision (sha256 birthday) | Effectively impossible | None | N/A |
| 5 | Content-safety classifier flags too aggressively | Scripted ratio spikes | UX dull | Tune FR-AI-002 thresholds |
| 6 | Prompt-injection jailbreak via persona YAML override | YAML validation lint | Tampered persona rejected | Schema strict; YAML files reviewed |
| 7 | Latency >3s consistently → Gemini storm | Anthropic SLO breach | Always-fallback | Investigate; scale Anthropic if available |
| 8 | Cost exceeds $50/day | Daily alert | Budget breach | Tighten cost cap; review traffic |
| 9 | Persona YAML missing on first launch | Boot-time validation | Server refuses to start | Fix YAML; redeploy |
| 10 | Event memory grows unbounded for high-engagement player | Disk + per-pet count | Cap at 20 per pet | Implemented via rotation |
| 11 | Kid mistakenly authenticated on standard SKU → AI exposure | RLS via sub claim | 403 returned | FR-AUTH-003 / SKU gate enforces |
| 12 | Sentiment-to-animation map drifts from contract names | Boot-time check | Server refuses to start | Locked contract names from FR-ART-001 |

---

## §11 — Notes

**Plan refs:** plan §PART 3 viral hook #3 (AI personality); plan §PART 4 (Claude Haiku + Gemini Flash; aggressive cache; kids SKU disabled).

**Sub-decisions punted to ops:**
- Exact persona YAMLs per species — drafted by designer + reviewed by DPO.
- Cost-cap thresholds tunable via Mixpanel flag.

**Anti-patterns explicitly forbidden:**
- LLM chat on kids SKU.
- Free-form user prompts.
- Storing raw responses without safety filter.

**Cross-reference:** FR-AI-002 is the safety classifier this FR depends on. FR-VIRAL-002 (Daily Drama), FR-VIRAL-003 (generative pet), FR-AI-003 (personality v2) build on top.
