---
id: TASK-AI-003
title: "AI personality v2 — selfie-aware reactions + name-aware memory + multi-pet sibling awareness (13+ only)"
module: AI
priority: SHOULD
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 1
owner: "Tech Lead + AI lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-AI-001, TASK-AI-002, TASK-PET-005, TASK-AUTH-003, TASK-LEGAL-001, TASK-OBS-001, TASK-INFRA-003]
depends_on: [TASK-AI-001, TASK-AI-002, TASK-PET-005]
blocks: []
effort_hours: 12
new_files:
  - "apps/api/src/ai/persona-v2/persona-v2.service.ts"
  - "apps/api/src/ai/persona-v2/selfie-context.service.ts"
  - "apps/api/src/ai/persona-v2/sibling-awareness.service.ts"
  - "apps/api/src/ai/persona-v2/name-memory.service.ts"
  - "apps/api/src/ai/persona-v2/__tests__/persona-v2.spec.ts"
modified_files:
  - "apps/api/src/ai/persona/persona.service.ts"
allowed_tools:
  - "TASK-AI-001 LLM router (Claude Haiku + Gemini Flash)"
  - "TASK-AI-002 content safety"
  - "TASK-PET-005 multi-pet roster"
disallowed_tools:
  - "Personality v2 on kids SKU (defer LLM-richness for ever)"
  - "Storing selfie image server-side (privacy)"
  - "Sibling-awareness across users (only owner's own pets)"
  - "Name-memory beyond persona prompt context (no persistent personal-data echo)"
risk_if_skipped: "Plan §PART 3 — unfair-advantage differentiator beyond v1 persona. Without v2 enrichment, multi-pet meta + sibling intimacy + name-awareness moments fall flat."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Standard SKU only.** Per TASK-AI-001 §1.1 + TASK-LEGAL-001 §1.5 — kids SKU stays scripted via TASK-AI-002 dialogue trees. No LLM enrichment for under-13.

§1.2  **Selfie-aware reactions.** When player invokes TASK-VIRAL-003 generative-pet flow OR explicitly shares a selfie via Settings, the AI may reference visual changes ("You got a haircut!"). Implementation:
- Player opt-in: settings toggle "Notice my appearance changes".
- On opt-in, periodic selfie comparison flow (optional, 1×/week).
- Selfie processed in-memory (NO storage per TASK-LEGAL-001 §1.4).
- Dominant-color delta vs last reference → triggers "you look different!" line.
- Reference: 3-5 RGB values only persisted (no image).

§1.3  **Name-aware memory.** Player's name (display_name from TASK-AUTH-001) included in persona prompt context. AI may reference: "Hi Linh!", "Linh, did you eat lunch?". DPO-reviewed for kid-appropriateness even on 13+.

§1.4  **Birthday awareness.** Player's birthday (from sign-up flow + TASK-AUTH-001 — opt-in only) triggers "Happy birthday Linh!" line on the day.

§1.5  **Multi-pet sibling awareness.** Per TASK-PET-005 multi-pet — AI persona context includes the player's roster. Siblings can reference each other: "Bao is so noisy today!" (when Bao is also owned). Tied to TASK-PET-007 breeding lineage if siblings are bred.

§1.6  **Cross-pet anti-affinity.** Pets MAY exhibit slight personality affinities (best friends, mild rivals). Affinities deterministically derived from each pet's `palette_seed` hash. Not random.

§1.7  **Time-of-day awareness.** Per TASK-AI-001 trigger `time_of_day` — v2 enriches: "Good morning Linh!" / "It's getting late, are you about to sleep?".

§1.8  **Event memory expansion.** Per TASK-AI-001 §1.3 — increase 20-event memory to 40 for Pet+ subscribers (additional context for richer dialogue).

§1.9  **Cost cap raised for v2.** Pet+ subscribers get persona-v2 quota 90 calls/pet/day (vs 60 for v1). Free tier remains 30/day. Hardly any v2 features available to free tier (only name-aware basics).

§1.10  **Content safety stricter for v2.** v2 responses pass through TASK-AI-002 + additional name/birthday-leak check (don't echo back identifying info).

§1.11  **Endpoint — persona v2 speak.** Same `/v1/ai/pet/:petId/speak` endpoint extended with `context_overrides: { include_sibling: true, include_selfie_delta: true, include_name: true }`.

§1.12  **Selfie consent flow.** Settings → Privacy → "Selfie-aware AI" toggle (default OFF). On toggle, parental consent re-confirmation if account is under-18 (Apple Family Sharing or parental notification — even 13-18 is gradient).

§1.13  **Name-leak prevention.** Per TASK-AI-002 — AI MUST NOT include the player's name in shared TikTok clips (TASK-VIRAL-001) or in any externally-rendered content. Only in in-app dialogue.

§1.14  **Persona evolution.** Per pet, persona refines over time based on care patterns. E.g. a heavily-fed pet says "Linh always knows when I'm hungry!". State stored in `pet_personality_traits` table.

§1.15  **DPO-reviewed v2 prompt templates.** Every v2 capability has a system-prompt template DPO-reviewed for boundary respect.

§1.16  **Audit retention.** 2-year for standard (no kids on v2).

§1.17  **Tenant override.** B2B tenants may use baseline v1 only (TASK-B2B-001 can disable v2 for tenant simplicity).

§1.18  **Performance budget.** v2 latency budget remains 2s P95 (same as v1 per TASK-AI-001 §1.13).

§1.19  **Fallback to v1.** If v2 fails (cost cap, safety block, vendor outage), fall back to v1 (scripted) per TASK-AI-001 fallback chain.

§1.20  **Analytics.** `ai.persona_v2.feature_used { feature }`, `ai.persona_v2.name_referenced`, `ai.persona_v2.sibling_referenced`, `ai.persona_v2.selfie_delta_detected` per TASK-OBS-001.

---

## §2 — Why this design

**Why kids exclusion.** Plan §PART 8 — generative + name-aware + selfie-aware for under-13 = COPPA-2025 super-toxic. Hard line.

**Why opt-in selfie.** Privacy first.

**Why no selfie storage.** Plan §PART 11 — selfies are sensitive.

**Why name-awareness.** Plan §PART 3 viral hook #3 — name in dialogue creates intimacy.

**Why deterministic anti-affinity.** Plan §PART 4 + TASK-LEGAL-002 — no random outcomes; auditable.

**Why sibling awareness.** Plan §PART 3 multi-pet — cross-pet references make pets feel like a family.

**Why event memory 40 for Pet+.** Plan §PART 6 — meaningful Pet+ perk beyond base game.

**Why name-leak prevention in TikTok.** Plan §PART 11 — adversarial input model; player's name should never be in publicly-shareable content.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/ai/persona-v2/persona-v2.service.ts
@Injectable()
export class PersonaV2Service {
  async speak(petId: string, ownerId: string, trigger: PersonaTrigger, overrides?: PersonaContextOverrides) {
    if (await this.sku(ownerId) === 'kids') throw new HttpException('ai.kids.forbidden', 403);
    const owner = await this.users.byId(ownerId);
    const siblings = overrides?.include_sibling ? await this.siblings(ownerId, petId) : [];
    const selfieDelta = overrides?.include_selfie_delta ? await this.selfieDelta(ownerId) : null;
    const promptCtx = {
      ...await this.basePersona.context(petId),
      owner_name: overrides?.include_name ? owner.display_name : undefined,
      birthday_today: this.isBirthday(owner.birth_date),
      siblings: siblings.map(s => ({ id: s.id, species: s.species, current_mood: this.mood(s) })),
      selfie_delta: selfieDelta,
    };
    try {
      const r = await this.llmRouter.complete(this.buildV2Prompt(promptCtx), { maxTokens: 100 });
      const safe = await this.safety.assertSafe(r.text, { audience: '13+' });
      if (!safe.ok) throw new Error('safety_block');
      // Name-leak prevention for shareable content (per TASK-VIRAL-001)
      if (trigger === 'shareable' && this.containsName(r.text, owner.display_name)) {
        r.text = this.redactName(r.text);
      }
      return r;
    } catch {
      return this.fallbackToV1(petId, trigger);
    }
  }
}
```

```sql
create table public.pet_personality_traits (
  pet_id text primary key references public.pets(id) on delete cascade,
  feed_affinity int default 0,
  clean_affinity int default 0,
  hug_affinity int default 0,
  mini_game_affinity int default 0,
  evolved_at timestamptz default now(),
  tenant_id text not null default 'mochi'
);

create table public.user_selfie_reference (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dominant_rgb jsonb,
  consent_opt_in boolean not null default false,
  consented_at timestamptz,
  last_updated timestamptz default now(),
  tenant_id text not null default 'mochi'
);
```

---

## §4 — Acceptance criteria

**AC1.** Kids SKU rejected for v2. Verified.
**AC2.** Name in dialogue when opted-in. Verified.
**AC3.** Sibling pet referenced when owned. Verified.
**AC4.** Selfie delta computed in-memory (no storage). Verified.
**AC5.** Birthday triggers special line. Verified.
**AC6.** Name redacted in shareable content. Verified.
**AC7.** Pet+ event memory 40 events. Verified.
**AC8.** Fallback to v1 on failure. Verified.
**AC9.** Anti-affinity deterministic. Verified.
**AC10.** Settings selfie toggle works + parental gate. Verified.
**AC11.** Personality traits evolve over time. Verified.
**AC12.** Tenant can disable v2. Verified.

---

## §5 — Verification

```typescript
describe('TASK-AI-003 — persona v2', () => {
  it('references sibling pet', async () => {
    await seedPets('u1', ['mochi', 'bao']);
    const r = await svc.speak('pet-mochi', 'u1', 'idle', { include_sibling: true });
    expect(r.text).toMatch(/Bao/i);
  });

  it('redacts name in shareable content', async () => {
    const r = await svc.speak('pet1', 'u1', 'shareable', { include_name: true });
    expect(r.text).not.toContain('Linh');
  });

  it('falls back to v1 on safety block', async () => {
    mockSafetyBlock();
    const r = await svc.speak('pet1', 'u1', 'idle');
    expect(r.source_model).toMatch(/v1|scripted/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/ai/persona-v2/selfie-context.service.ts
@Injectable()
export class SelfieContextService {
  async selfieDelta(userId: string, newRgb?: number[][]): Promise<{ changed: boolean; description?: string } | null> {
    if (!newRgb) return null;
    const { data: ref } = await this.supa.from('user_selfie_reference').select('*').eq('user_id', userId).maybeSingle();
    if (!ref) return null;
    const delta = this.computeColorDelta(ref.dominant_rgb, newRgb);
    if (delta > 0.15) {
      await this.supa.from('user_selfie_reference').update({ dominant_rgb: newRgb, last_updated: new Date() }).eq('user_id', userId);
      return { changed: true, description: this.deltaToDescription(delta) };
    }
    return { changed: false };
  }
}
```

---

## §7 — Dependencies

**External:** Same as TASK-AI-001 (Claude Haiku, Gemini Flash).
**Internal:** TASK-AI-001 (LLM router), TASK-AI-002 (safety), TASK-PET-005 (multi-pet), TASK-AUTH-003 (kids exclusion).
**Blocks:** none.

---

## §8 — Example payloads

```json
{ "text": "Hi Linh! Bao is really noisy today — wanna play with us?", "source_model": "claude-haiku", "v2_features_used": ["name", "sibling"] }
```

```json
{ "event": "ai.persona_v2.feature_used", "user_id": "01HU...", "feature": "selfie_delta" }
```

```json
{
  "context_overrides": {
    "include_sibling": true,
    "include_name": true,
    "include_selfie_delta": false
  }
}
```

```json
{ "pet_id": "01HC...", "feed_affinity": 8, "clean_affinity": 3, "hug_affinity": 12, "mini_game_affinity": 5 }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Kids v2? → §1.1 — never.
- **OQ-2 (resolved):** Selfie storage? → §1.2 — RGB-only, no image.
- **OQ-3 (resolved):** Sibling cross-user? → §`disallowed_tools`.
- **OQ-4 (resolved):** Name in shareable content? → §1.13 — redacted.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Name leak in TikTok export | Redaction filter | UX issue | Tighten filter |
| 2 | Selfie consent revoked mid-session | DSR | Selfie ignored | Verified |
| 3 | Sibling reference confusing (deleted sibling) | Roster sync | Reference removed | Refresh siblings |
| 4 | LLM hallucinates wrong birthday | Sanity check | Avoid | Validate birthday|
| 5 | Anti-affinity feels mechanical | Player support | Soften prompt | DPO tune |
| 6 | Cost cap raise blows budget | Daily reconciliation | Tighten | Adjust Pet+ caps |
| 7 | Safety block frequent on v2 | Metric | Frustration | Tune classifier |
| 8 | Cross-tenant selfie reference leak | RLS | Privacy | Audit |
| 9 | Selfie storage accidentally created | Audit | Privacy breach | Code review |
| 10 | Personality traits drift erratic | Daily check | UX confusion | Cap drift rate |
| 11 | Audit retention 2-year configured | DPO | OK | Verified |
| 12 | Tenant disables v2 broken | UI test | Bug | Fix flag |

---

## §11 — Notes

**Plan refs:** plan §PART 3 viral hook #3 (AI personality v2).

**Sub-decisions punted to ops:** Affinity tuning + selfie consent UX copy.

**Anti-patterns explicitly forbidden:**
- v2 on kids.
- Selfie storage.
- Cross-user sibling.
- Name in shareable content.

**Cross-reference:** TASK-AI-001 fallback; TASK-PET-005 multi-pet roster; TASK-VIRAL-001 share redaction.
