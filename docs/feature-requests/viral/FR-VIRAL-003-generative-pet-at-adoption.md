---
id: FR-VIRAL-003
title: "Generative pet at adoption — text-prompt OR selfie → one-of-one Spine palette + safety denylist"
module: VIRAL
priority: SHOULD
status: shipped
verify: T
phase: P2
milestone: "Social & Multi-Pet"
slice: 1
owner: "Tech Lead + AI lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-PET-001, FR-PET-006, FR-AI-001, FR-AI-002, FR-ART-001, FR-AUTH-003, FR-LEGAL-001, FR-LEGAL-002, FR-VIRAL-001, FR-OBS-001]
depends_on: [FR-PET-006, FR-AI-002, FR-ART-001]
blocks: []
effort_hours: 12
new_files:
  - "apps/api/src/viral/generative-pet/generative-pet.controller.ts"
  - "apps/api/src/viral/generative-pet/generative-pet.service.ts"
  - "apps/api/src/viral/generative-pet/palette-generator.ts"
  - "apps/api/src/viral/generative-pet/prompt-safety.ts"
  - "apps/api/src/viral/generative-pet/__tests__/palette-generator.spec.ts"
  - "apps/api/src/viral/generative-pet/__tests__/prompt-safety.spec.ts"
  - "apps/cocos/assets/_root/viral/GenerativePetAdoptionUi.ts"
modified_files:
  - "apps/api/src/pets/pets.service.ts"
allowed_tools:
  - "Server-side palette derivation (deterministic)"
  - "OpenAI Moderation API (FR-AI-002) for prompt safety"
  - "Optional vision API (Google Vision or AWS Rekognition) for selfie safety classification"
disallowed_tools:
  - "Generative pet on kids SKU (FR-AUTH-003 — kid pets are scripted-derived)"
  - "Storing selfies server-side (privacy)"
  - "Free-form prompts without moderation filter"
  - "External LLM image generation (no Midjourney/DALL-E — palette-only derivation)"
risk_if_skipped: "Plan §PART 3 viral hook #8 — generative-at-adoption is the WidgetableBoards-style differentiation moment. Without it, every adopted pet looks similar; cluster of identical-Mochis breaks share-worthiness."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Generative pet on adoption.** Only at the moment of first hatching a NEW pet (per FR-PET-001 §1.4), 13+ players have an optional path to provide a text prompt OR selfie to influence the pet's appearance.

§1.2  **Standard SKU only.** Per FR-AUTH-003 + plan §PART 8, kids SKU pets use the default palette derivation per FR-PET-001 §1.6 (server-seeded). Generative path is disabled.

§1.3  **Two input modes.**
- **Text prompt** (max 100 chars): e.g. "sunset over the ocean" — palette derived from sentiment + theme.
- **Selfie**: player uploads a photo — palette derived from dominant colours (NOT photo itself; only the 3-5 dominant RGB values).

§1.4  **No image storage server-side.** Per privacy: selfies are processed in-memory; only the extracted dominant-colour vector (≤ 30 bytes) is persisted. Original image discarded immediately.

§1.5  **Prompt safety.** Text prompt MUST pass FR-AI-002 content safety. Selfie MUST pass an OPTIONAL vision-API safety classifier (faces detected → flag for review but not blocked; NSFW → blocked).

§1.6  **Palette derivation.** The dominant colours combine with the species' base palette via a deterministic blend function:
```
finalPalette = blend(speciesBase, userInput, weight=0.4)
```
The blend is computed server-side; same inputs → same output.

§1.7  **One-of-one uniqueness.** Combined with FR-PET-001 §1.6 server-side `palette_seed`, the result is a unique 16-byte palette. Two players with identical prompts get slightly different results due to the seed.

§1.8  **Spine palette swap.** Cocos `SpineLoader` (FR-ART-001 §1.4) applies the palette via Spine's slot-recolour mechanism. The 4 attachment slots (`body`, `face`, `accessory_head`, `accessory_body`) MUST respect the palette.

§1.9  **Endpoint — adopt with prompt.** `POST /v1/pets/hatch` (existing FR-PET-001 endpoint, extended) — body adds optional `{ generative_input: { mode: 'text'|'selfie', prompt?: string, dominant_colors?: string[] } }`.

§1.10  **Cost.** Free at P2 (encourage adoption). FR-ECON-001 may extend with cosmetic re-generation options in P3+.

§1.11  **One generative input per pet.** Once hatched, the palette is locked. Re-roll is not available; player must buy a "Pet Couture" cosmetic to change appearance (FR-ECON-003).

§1.12  **Audit + analytics.** `viral.generative.adopted { pet_id, mode, palette_hash }`. Records the mode used but NEVER the prompt text or selfie reference. 7-year retention for kids-adjacent audit.

§1.13  **Prompt sanitisation.** Text prompt is stripped of any PII regex patterns (email/phone/URL) before being passed to FR-AI-002 — defense in depth.

§1.14  **Vision API fail-closed.** If vision API down, selfie mode is blocked + text prompt mode offered. Don't ship pet with unvalidated selfie.

§1.15  **Deterministic blend.** Implementation MUST be a pure function. Property-test verified.

§1.16  **Cocos `GenerativePetAdoptionUi.ts`.** UI offers 3 paths: "Surprise me" (default palette per FR-PET-001), "Describe a feeling" (text prompt), "Use a photo" (selfie). 90-second budget per onboarding (FR-PET-004).

§1.17  **Tenant override blocks generative.** B2B tenants (FR-B2B-001) may disable the generative path — their themes are pre-curated.

§1.18  **Locale.** Prompt input + UX copy localised per FR-I18N-001.

§1.19  **AR compatibility.** Generative palette renders correctly in AR (FR-AR-001) — palette is per-skeleton, not per-scene.

§1.20  **Sharing the unique pet.** First-hatch share via FR-VIRAL-001 includes "Generated from: <prompt or 'a photo'>" caption attribution (text-mode only — selfie mode never reveals).

---

## §2 — Why this design

**Why prompts not text-to-image.** Plan §PART 4 + cost. Full image generation is expensive + risks copyright/likeness issues. Palette derivation is safe + cheap.

**Why no selfie storage.** Privacy first. Plan §PART 11 trust model.

**Why kids SKU disabled.** Plan §PART 8 + FR-AI-002 — kid generative is regulator-toxic.

**Why one-of-one + locked.** Plan §PART 3 — uniqueness drives share-worthiness. Re-rolling defeats the moment.

**Why deterministic blend.** Auditability + repeatability.

**Why optional rather than default.** Plan §PART 5 onboarding ≤90s — generative adds time. Optional respects pace.

**Why vision API fail-closed.** Better to disable a feature than ship unvalidated content.

**Why no external generative API.** Cost cap + safety simplicity + IP cleanliness.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/viral/generative-pet/palette-generator.ts
export function generatePalette(input: {
  species: Species;
  baseSeed: Buffer;        // FR-PET-001 server-side
  dominantColors?: string[];  // selfie mode
  prompt?: string;          // text mode (already sanitised + safety-passed)
}): { paletteSeed: string; paletteHash: string } {
  const speciesPalette = SPECIES_PALETTES[input.species];
  let blendVector: number[];

  if (input.dominantColors) {
    blendVector = input.dominantColors.flatMap(c => hexToRgb(c));
  } else if (input.prompt) {
    blendVector = themeToVector(input.prompt);  // designer-defined theme→RGB table
  } else {
    blendVector = randomVectorFromSeed(input.baseSeed);
  }

  const final = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) {
    final[i] = Math.round((speciesPalette[i] * 0.6 + blendVector[i % blendVector.length] * 0.4)) & 0xff;
    final[i] ^= input.baseSeed[i % input.baseSeed.length];  // re-randomise via seed
  }

  return {
    paletteSeed: final.toString('hex'),
    paletteHash: sha256(final).digest('hex'),
  };
}
```

```typescript
// apps/api/src/viral/generative-pet/prompt-safety.ts
@Injectable()
export class PromptSafetyService {
  constructor(private readonly mod: ContentSafetyService) {}

  async sanitize(prompt: string): Promise<string> {
    if (prompt.length > 100) throw new HttpException('prompt.too_long', 422);
    const stripped = prompt
      .replace(/[\w.-]+@[\w.-]+\.\w{2,}/g, '<email>')
      .replace(/\d{3,}[- ]?\d{3,}/g, '<phone>')
      .replace(/(https?:\/\/|www\.)\S+/g, '<url>');
    const r = await this.mod.assertSafe(stripped, { audience: '13+' });
    if (!r.ok) throw new HttpException({ error: 'prompt.unsafe', reason: r.reason }, 422);
    return stripped;
  }
}
```

```typescript
// apps/api/src/viral/generative-pet/generative-pet.service.ts (excerpt)
async generateAdoption(u: AuthedUser, species: Species, input?: GenerativeInput) {
  if (await this.userSkuFor(u.id) === 'kids') {
    // Force default palette
    input = undefined;
  }
  let palette: { paletteSeed: string; paletteHash: string };
  if (input?.mode === 'selfie') {
    if (!await this.vision.checkSelfie(input.dominant_colors_source)) {
      throw new HttpException('selfie.unsafe', 422);
    }
    palette = generatePalette({ species, baseSeed: randomBytes(16), dominantColors: input.dominant_colors });
  } else if (input?.mode === 'text') {
    const cleaned = await this.promptSafety.sanitize(input.prompt!);
    palette = generatePalette({ species, baseSeed: randomBytes(16), prompt: cleaned });
  } else {
    palette = generatePalette({ species, baseSeed: randomBytes(16) });
  }
  await this.audit.emit('viral.generative.adopted', { user_id: u.id, mode: input?.mode ?? 'default', palette_hash: palette.paletteHash });
  return palette;
}
```

---

## §4 — Acceptance criteria

**AC1.** Text-prompt adoption returns palette unique per (species, seed, prompt). Verified.
**AC2.** Selfie input never stored — only dominant_colors extracted. Verified.
**AC3.** Kids SKU forces default palette regardless of input. Verified.
**AC4.** Unsafe prompt rejected with reason. Verified.
**AC5.** PII regex stripped before moderation. Verified.
**AC6.** Vision API down → selfie mode blocked. Verified.
**AC7.** Deterministic blend (same inputs → same output). Verified by property test.
**AC8.** Palette locked after hatch (no re-roll). Verified.
**AC9.** AR renders palette correctly. Verified.
**AC10.** Share caption attributes prompt mode only (text). Verified.
**AC11.** Tenant override disables path. Verified.
**AC12.** Audit emits without storing prompt text. Verified.

---

## §5 — Verification

```typescript
describe('FR-VIRAL-003 — generative palette', () => {
  it('is deterministic per input', () => {
    const a = generatePalette({ species: 'mochi', baseSeed: Buffer.from('00'.repeat(16), 'hex'), prompt: 'ocean' });
    const b = generatePalette({ species: 'mochi', baseSeed: Buffer.from('00'.repeat(16), 'hex'), prompt: 'ocean' });
    expect(a.paletteSeed).toBe(b.paletteSeed);
  });

  it('differs across seeds (uniqueness)', () => {
    const a = generatePalette({ species: 'mochi', baseSeed: Buffer.from('00'.repeat(16), 'hex'), prompt: 'ocean' });
    const b = generatePalette({ species: 'mochi', baseSeed: Buffer.from('FF'.repeat(16), 'hex'), prompt: 'ocean' });
    expect(a.paletteSeed).not.toBe(b.paletteSeed);
  });

  it('rejects unsafe prompts', async () => {
    await expect(prompt.sanitize('VISIT example.com FOR FREE COINS')).rejects.toThrow(/url/i);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/_root/viral/GenerativePetAdoptionUi.ts (excerpt)
@ccclass('GenerativePetAdoptionUi')
export class GenerativePetAdoptionUi extends Component {
  onTapSurpriseMe() { this.proceed(undefined); }
  async onTapTextPrompt() {
    const text = await this.promptInput.text;
    this.proceed({ mode: 'text', prompt: text });
  }
  async onTapSelfie() {
    const photoUri = await CameraBridge.takePhoto();
    const colors = await CameraBridge.extractDominantColors(photoUri, 5);  // in-memory
    this.proceed({ mode: 'selfie', dominant_colors: colors });
  }
}
```

---

## §7 — Dependencies

**External:** Optional vision-API (Google Vision / AWS Rekognition).
**Internal:** FR-PET-006 (species + tier), FR-AI-002 (content safety), FR-ART-001 (Spine palette).
**Blocks:** none.

---

## §8 — Example payloads

```http
POST /v1/pets/hatch
{ "species": "mochi", "generative_input": { "mode": "text", "prompt": "sunset over the ocean" } }
→ 201 { "pet_id": "01HC...", "palette_seed": "9b3e7d2a5c4f1b8e6d3a2c9f7b5d3a1c", "palette_hash": "..." }
```

```json
{ "event": "viral.generative.adopted", "user_id": "01HU...", "pet_id": "01HC...", "mode": "selfie", "palette_hash": "..." }
```

```json
{ "error": "prompt.unsafe", "reason": "moderation_flagged" }
```

```json
{ "error": "selfie.vision_unavailable", "fallback": "use_text_prompt_or_default" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Palette-only vs image gen? → §`disallowed_tools` + §2.
- **OQ-2 (resolved):** Kids generative? → §1.2 — disabled.
- **OQ-3 (resolved):** Selfie storage? → §1.4 — never.
- **OQ-4 (resolved):** Re-roll? → §1.11 — Pet Couture path only.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Vision API down | Synthetic | Selfie mode disabled | Text/default fallback |
| 2 | Prompt evades moderation | DPO review | Off-palette pet | Tighten classifier |
| 3 | Selfie image accidentally stored | Audit | Privacy breach | Code review + audit log scan |
| 4 | Palette blend produces black/white only | Stat | Boring pet | Force minimum saturation |
| 5 | Re-roll requested (UX glitch) | Server reject | UX hang | Surface Pet Couture path |
| 6 | Cross-tenant disabled gen | B2B config | OK | Tenant manifest read |
| 7 | Spine palette swap missing slot | Cocos error | Default colors | Slot guard |
| 8 | Audit text leak (prompt stored) | DPO | Privacy issue | Schema lint |
| 9 | AR render off-palette | Cocos | Visual bug | Recompute palette in AR scene |
| 10 | Locale missing prompt copy | EN fallback | OK | i18n batch |
| 11 | Selfie crash on iOS Photos limit | OS error | UX error | Surface "try again" |
| 12 | Theme-to-vector mapping missing key | Default mid-gray | Bland | Designer table review |

---

## §11 — Notes

**Plan refs:** plan §PART 3 viral hook #8 (generative-at-adoption), plan §PART 11 privacy.

**Sub-decisions punted to ops:** Theme→RGB table designer-curated.

**Anti-patterns explicitly forbidden:**
- Image storage.
- Kids generative.
- External text-to-image.
- Re-roll path.

**Cross-reference:** FR-PET-006 species + tier carry forward; FR-VIRAL-001 share attribution.
