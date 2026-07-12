---
id: FR-AI-002
title: "Content safety classifier (OpenAI Moderation primary + Azure fallback) + kids-SKU scripted dialogue trees"
module: AI
priority: MUST
status: done
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead + DPO"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-AI-001, FR-AI-003, FR-PET-001, FR-LEGAL-001, FR-LEGAL-003, FR-AUTH-003, FR-VIRAL-002, FR-VIRAL-003, FR-OBS-001, FR-SOCIAL-002]
depends_on: [FR-AI-001, FR-LEGAL-001]
blocks: [FR-VIRAL-002, FR-VIRAL-003, FR-AI-003]
effort_hours: 8
new_files:
  - "apps/api/src/ai/safety/content-safety.service.ts"
  - "apps/api/src/ai/safety/openai-moderation-adapter.ts"
  - "apps/api/src/ai/safety/azure-content-safety-adapter.ts"
  - "apps/api/src/ai/safety/scripted-dialogue-tree.ts"
  - "apps/api/src/ai/safety/__tests__/content-safety.spec.ts"
  - "apps/api/src/ai/safety/__tests__/scripted-dialogue.spec.ts"
  - "apps/api/src/ai/safety/scripts/en/baby.json"
  - "apps/api/src/ai/safety/scripts/en/teen.json"
  - "apps/api/src/ai/safety/scripts/en/adult.json"
  - "apps/api/src/ai/safety/scripts/vi/baby.json"
  - "apps/api/src/ai/safety/scripts/vi/teen.json"
  - "apps/api/src/ai/safety/scripts/vi/adult.json"
modified_files:
  - "apps/api/src/ai/persona/persona.service.ts"
allowed_tools:
  - "OpenAI Moderation API (free, no auth required for moderation endpoint)"
  - "Azure AI Content Safety API (fallback)"
  - "Redis cache for moderation results"
disallowed_tools:
  - "Self-built classifier without third-party redundancy (regulator confidence requires established vendor)"
  - "Bypassing safety gate for any output (every LLM response gates here)"
  - "Generative LLM dialogue on kids SKU (this FR's scripted tree is the replacement)"
risk_if_skipped: "Without content safety, LLM hallucinations or jailbreak attempts ship to players — direct Apple/Google App Review rejection risk + COPPA-2025 enforcement risk if kids-adjacent. FR-PET-001 naming filter and FR-AI-001 persona output both depend on this classifier."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Universal output gate.** Every LLM-generated text (FR-AI-001 personas, FR-VIRAL-002 Daily Drama, FR-VIRAL-003 generative pet, FR-AI-003 personality v2) MUST pass through this service before reaching the client.

§1.2  **Two-vendor architecture.** Primary: **OpenAI Moderation** (free tier, no PII required, used for moderation only). Fallback: **Azure AI Content Safety**. Vendor switch via environment-variable swap.

§1.3  **Category coverage.** Both adapters MUST classify against these categories:
- hate / hate-speech
- harassment / threats
- sexual / minors (zero-tolerance)
- violence / graphic
- self-harm
- profanity / vulgarity
- personally-identifiable-information (URL, phone, email, address)
- regulated-content (drugs, gambling, weapons)

§1.4  **Severity threshold.** Per category, a confidence score ≥ 0.5 triggers block; ≥ 0.25 triggers warn (logged, not blocked). The "sexual/minors" category MUST trigger block at ≥ 0.1 (zero-tolerance).

§1.5  **Kids-SKU stricter rules.** Per FR-LEGAL-001 §1.5(b) + FR-AUTH-003, the kids SKU MUST use ONLY the scripted dialogue tree — generative LLM is forbidden. The scripted tree consists of pre-authored phrases stored in `scripts/<locale>/<stage>.json`.

§1.6  **Scripted dialogue tree shape.** Each stage file (`baby.json`, `teen.json`, `adult.json`) contains 30+ phrases per trigger type:
- idle
- after_care
- after_mini_game (win)
- after_mini_game (loss)
- evolution
- time_of_day (morning/afternoon/evening)
- low_stat (hungry/dirty/sad/tired)

§1.7  **Endpoint.** `POST /v1/ai/safety/check` — body `{ text: string, audience: '13+'|'under-13' }`. Returns `{ ok: boolean, reason?: string, severity?: number }`. Called server-side; not exposed to clients directly.

§1.8  **Kids endpoint for scripted dialogue.** `POST /v1/ai/pet/:petId/scripted-speak` — body `{ trigger: ScriptedTrigger }`. Returns scripted phrase from the appropriate `scripts/<locale>/<stage>.json` randomly chosen (FR-LEGAL-002 deterministic-by-seed isn't required because scripted dialogue isn't a randomised outcome that affects monetised inventory).

§1.9  **Adapter cache.** Identical input text within 24h returns cached result. Cache key = sha256(text).

§1.10  **PII pattern detection.** Beyond moderation API, an additional client-side regex sweep MUST run for: phone numbers, email addresses, URLs, full-name patterns. Any hit triggers block regardless of moderation score.

§1.11  **Severity logging.** Every check emits `ai.safety.check { audience, reason, severity, source_vendor, cached }`.

§1.12  **Block-without-substitute.** If `ok: false`, the calling service (FR-AI-001 etc.) is responsible for substituting a scripted fallback. This FR does NOT provide a substitute — that's the caller's job.

§1.13  **Latency budget.** P95 check latency ≤ 300ms. Beyond → adapter swap.

§1.14  **DPO review path.** When `severity ≥ 0.5` is detected, the blocked output is logged to a DPO review queue (Supabase `safety_review_queue` table). DPO reviews periodically to tune thresholds + classifier patterns.

§1.15  **Per-tenant rate-limit.** 1000 checks/minute per tenant (covers consumer + B2B). Beyond → fail-closed (treat as unsafe).

§1.16  **Vendor outage fail-closed.** When both vendors down, the system fails closed: output blocked + scripted fallback substituted. Plan §PART 4 — better to ship a less-personal pet than an offensive one.

§1.17  **Scripted dialogue localisation.** All scripts MUST be authored in EN + VI for P1. Other locales follow in P4 via FR-I18N-001.

§1.18  **DPO-curated scripted phrases.** Every scripted phrase MUST be reviewed by the DPO for kid-appropriateness + cultural sensitivity. Review status tracked in `scripts/<locale>/<stage>.review.md`.

§1.19  **Cocos integration.** `AiSpeechBubble.ts` (FR-AI-001 §1.18) handles both `claude-haiku`/`gemini-flash` source-model AND `scripted_fallback`/`scripted_kids` identically — same render path.

§1.20  **Audit retention.** Block events retained 7 years for kids (COPPA audit), 2 years for standard.

---

## §2 — Why this design

**Why two vendors.** Single-vendor failure = no safety = halt to LLM features. Two-vendor redundancy matches the FR-AI-001 model architecture.

**Why OpenAI Moderation primary.** Free tier, no auth, well-understood category boundaries, low latency. Azure Content Safety is the canonical regulated-vendor fallback.

**Why zero-tolerance for sexual/minors.** COPPA-2025 + Apple Kids Category + UK ICO AADC + general moral imperative. Threshold 0.1 instead of 0.5 reflects this.

**Why scripted dialogue for kids SKU.** Snap My AI / Replika regulatory precedent shows generative chat to children is regulator-toxic. Scripted = compliant.

**Why 30+ phrases per trigger.** Below 30, repetition becomes obvious within a single play session.

**Why client-side regex on top of moderation API.** Moderation classifies meaning; regex catches structured PII (phone numbers, URLs) regardless of context.

**Why DPO review queue.** Edge cases + threshold tuning need human judgment. The queue captures them for periodic review without delaying real-time delivery.

**Why fail-closed on vendor outage.** Plan §PART 4 — better safer than personality-rich. UX cost is acceptable.

**Why blocked-without-substitute is the caller's responsibility.** Separation of concerns — this FR classifies; callers decide fallback strategy (FR-AI-001 → scripted; FR-VIRAL-002 → generic phrase; etc.).

---

## §3 — API contract & code shape

```typescript
// apps/api/src/ai/safety/content-safety.service.ts
@Injectable()
export class ContentSafetyService {
  constructor(
    private readonly openai: OpenAIModerationAdapter,
    private readonly azure: AzureContentSafetyAdapter,
    private readonly cache: SafetyCache,
    private readonly rate: RateLimit,
  ) {}

  async assertSafe(text: string, ctx: { audience: '13+'|'under-13' }): Promise<{ ok: boolean; reason?: string; severity?: number }> {
    if (ctx.audience === 'under-13') return { ok: false, reason: 'kids_require_scripted' };
    await this.rate.assert({ key: 'safety-check', perMinute: 1000 });
    const cached = await this.cache.get(text);
    if (cached) return cached;

    const piiHit = this.checkPii(text);
    if (piiHit) return this.block(text, 'pii', 1.0);

    try {
      const r = await this.openai.moderate(text);
      const decision = this.decide(r);
      await this.cache.set(text, decision, 86400);
      return decision;
    } catch (err) {
      try {
        const r = await this.azure.classify(text);
        return this.decide(r);
      } catch (err2) {
        this.audit.emit('ai.safety.both_vendors_down');
        return { ok: false, reason: 'vendor_outage_fail_closed' };
      }
    }
  }

  private checkPii(text: string): boolean {
    return /\b\d{3,}[- ]?\d{3,}/.test(text)              // phone-like
        || /[\w.-]+@[\w.-]+\.\w{2,}/.test(text)          // email
        || /(https?:\/\/|www\.)/.test(text);             // URL
  }

  private decide(scores: Record<string, number>): { ok: boolean; reason?: string; severity?: number } {
    if ((scores['sexual/minors'] ?? 0) >= 0.1) return { ok: false, reason: 'sexual/minors', severity: scores['sexual/minors'] };
    const blocked = Object.entries(scores).find(([_, score]) => score >= 0.5);
    if (blocked) return { ok: false, reason: blocked[0], severity: blocked[1] };
    return { ok: true };
  }
}
```

```typescript
// apps/api/src/ai/safety/scripted-dialogue-tree.ts
export class ScriptedDialogueTree {
  async pick(stage: 'baby'|'teen'|'adult', trigger: string, locale: string): Promise<string> {
    const phrases = await this.loadScript(stage, locale, trigger);
    const idx = Math.floor(Math.random() * phrases.length);
    return phrases[idx];
  }
}
```

```jsonc
// apps/api/src/ai/safety/scripts/en/baby.json (excerpt)
{
  "idle": [
    "*yawn* I might take a nap soon.",
    "I love sunny days like today!",
    "Boop! What're you up to?",
    "I'm gonna grow big and strong!"
  ],
  "after_care": [
    "Mmm, that was nice!",
    "Thanks for taking care of me!"
  ],
  "low_stat.hungry": ["My tummy is making sounds...", "I could eat a whole bowl right now!"]
}
```

---

## §4 — Acceptance criteria

**AC1.** Safe text → `{ ok: true }`. Verified.
**AC2.** Vulgar text → `{ ok: false, reason: 'profanity' }`. Verified.
**AC3.** Phone number in text → blocked with reason 'pii'. Verified.
**AC4.** Under-13 audience → always returns `{ ok: false, reason: 'kids_require_scripted' }`. Verified.
**AC5.** Vendor switch — OpenAI down → Azure used. Verified with mocked adapters.
**AC6.** Both vendors down → fail-closed. Verified.
**AC7.** Cache hit returns cached result without vendor call. Verified.
**AC8.** Scripted tree returns 30+ phrases per trigger per stage per locale (EN + VI). Verified by counting JSON entries.
**AC9.** DPO review queue captures severity ≥ 0.5 blocks. Verified.
**AC10.** Rate-limit 1000/min enforced. Verified.
**AC11.** Latency P95 ≤ 300ms. Verified by load test (Sentry).
**AC12.** Sexual/minors category triggers at 0.1 (not 0.5). Verified by spec test.

---

## §5 — Verification

```typescript
// apps/api/src/ai/safety/__tests__/content-safety.spec.ts
describe('FR-AI-002 — content safety', () => {
  it('blocks PII regardless of vendor', async () => {
    const r = await svc.assertSafe('call me at 555-1234', { audience: '13+' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('pii');
  });

  it('under-13 always returns scripted required', async () => {
    const r = await svc.assertSafe('hello!', { audience: 'under-13' });
    expect(r.reason).toBe('kids_require_scripted');
  });

  it('routes to Azure on OpenAI 5xx', async () => {
    vi.spyOn(openai, 'moderate').mockRejectedValue(new Error('5xx'));
    vi.spyOn(azure, 'classify').mockResolvedValue({ hate: 0 });
    const r = await svc.assertSafe('hello', { audience: '13+' });
    expect(r.ok).toBe(true);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/ai/safety/openai-moderation-adapter.ts
@Injectable()
export class OpenAIModerationAdapter {
  async moderate(text: string): Promise<Record<string, number>> {
    const r = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ input: text }),
    });
    if (!r.ok) throw new Error(`openai.moderation.failed ${r.status}`);
    const j = await r.json() as { results: Array<{ category_scores: Record<string, number> }> };
    return j.results[0].category_scores;
  }
}
```

---

## §7 — Dependencies

**External:** OpenAI Moderation API, Azure AI Content Safety API.
**Internal:** FR-AI-001 (caller), FR-LEGAL-001 (DPO + audience policy), FR-AUTH-003 (kid-SKU detection).
**Blocks:** FR-VIRAL-002, FR-VIRAL-003, FR-AI-003.

---

## §8 — Example payloads

```http
POST /v1/ai/safety/check
{ "text": "Mochi loves you!", "audience": "13+" }
→ 200 { "ok": true }
```

```http
POST /v1/ai/safety/check
{ "text": "visit example.com", "audience": "13+" }
→ 200 { "ok": false, "reason": "pii", "severity": 1.0 }
```

```http
POST /v1/ai/pet/01HC.../scripted-speak
{ "trigger": "idle" }
→ 200 { "text": "Boop! What're you up to?", "source_model": "scripted_kids" }
```

```json
{ "event": "ai.safety.check", "audience": "13+", "reason": "profanity", "severity": 0.7, "source_vendor": "openai", "cached": false }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Threshold 0.5 vs 0.7? → §1.4 — 0.5 standard, 0.1 sexual/minors.
- **OQ-2 (resolved):** Scripted phrase count? → §1.6 — 30+ per trigger/stage.
- **OQ-3 (resolved):** Vendor outage default? → §1.16 — fail-closed.
- **OQ-4 (resolved):** Client-side regex + API both? → §1.10 — both layers.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | OpenAI moderation down | 5xx | Azure fallback | Both down → fail-closed |
| 2 | Azure down too | 5xx | Fail-closed | Surface "Mochi sleepy" UX |
| 3 | Latency >300ms persistently | Sentry transaction | Adapter swap | Cache hit rate ↑ |
| 4 | Threshold too aggressive → blocked-rate spike | OBS dashboard | UX feels dull | DPO reviews + tunes |
| 5 | Scripted phrases repetitive | Player support | UX boring | Add phrases via i18n batch |
| 6 | PII regex false-positive (e.g. "happy 365 days") | Player support | Block legit text | Refine regex; audit cases |
| 7 | Cache poisoning (vendor returns wrong) | Audit | Stale blocks | TTL bounds blast radius |
| 8 | Rate-limit hit during traffic spike | Per-tenant alert | Fail-closed | Scale rate-limit budget |
| 9 | DPO review queue grows unbounded | Disk | Manual review backlog | Throttle queue; alert DPO |
| 10 | Localised scripts missing key | UX fallback to EN | Mild | Add missing keys |
| 11 | Kid-SKU somehow bypasses (race) | Audit | Generative chat slips through | RLS + SKU gate hardened |
| 12 | Sexual/minors threshold too low (false positives) | Player support | Block innocent text | DPO review; adjust |

---

## §11 — Notes

**Plan refs:** plan §PART 4 (content-safety classifier for under-13 + adult).

**Sub-decisions punted to ops:**
- Specific phrase library content — DPO-reviewed per locale.
- Threshold values per category — Mixpanel-tunable.

**Anti-patterns explicitly forbidden:**
- Bypassing the gate.
- Generative LLM on kids SKU.
- Single-vendor without fallback.

**Cross-reference:** Every LLM output FR depends on this. The scripted tree replaces generative chat in the kids SKU.
