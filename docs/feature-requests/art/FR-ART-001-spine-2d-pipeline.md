---
id: FR-ART-001
title: "Spine 2D pet skeleton pipeline (20-anim contract) + Lottie UI + Howler.js audio"
module: ART
priority: MUST
status: done
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead + 2 Spine artists"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-INFRA-001, FR-PET-001, FR-PET-002, FR-PET-006, FR-CARE-001, FR-CARE-002, FR-CARE-003, FR-AR-001, FR-VIRAL-001, FR-VIRAL-003, FR-ECON-003, FR-A11Y-001, FR-B2B-001]
depends_on: [FR-INFRA-001]
blocks: [FR-PET-001, FR-PET-002, FR-PET-006, FR-CARE-001, FR-CARE-002, FR-CARE-003, FR-AR-001, FR-VIRAL-001, FR-ECON-003]
effort_hours: 14
new_files:
  - "apps/cocos/assets/pets/_template/skeleton-contract.spine.json"
  - "apps/cocos/assets/pets/_template/atlas-contract.atlas"
  - "apps/cocos/assets/_root/art/SpineLoader.ts"
  - "apps/cocos/assets/_root/art/AnimationContract.ts"
  - "apps/cocos/assets/_root/art/LottieLoader.ts"
  - "apps/cocos/assets/_root/art/AudioMixer.ts"
  - "apps/cocos/assets/_root/art/HapticsAdapter.ts"
  - "apps/cocos/assets/_root/art/__tests__/SpineLoader.spec.ts"
  - "apps/cocos/assets/_root/art/__tests__/AnimationContract.spec.ts"
  - "apps/cocos/assets/_root/art/__tests__/AudioMixer.spec.ts"
  - "apps/cocos/extensions/spine-contract-lint/main.ts"
  - "apps/cocos/extensions/asset-budget-per-pet/main.ts"
  - "scripts/art/validate-spine-contract.mjs"
  - "scripts/art/build-pet-bundle.mjs"
  - "scripts/art/compress-textures.mjs"
  - "docs/art/spine-authoring-guide.md"
  - "docs/art/audio-asset-budget.md"
  - "docs/art/animation-contract.md"
modified_files:
  - "apps/cocos/package.json"
  - "apps/cocos/scripts/assert-bundle-budget.mjs"
allowed_tools:
  - "Spine 2D Essential ($69) or Pro ($299) editor — Esoteric Software"
  - "@cocos/spine-runtime (Cocos plugin for Spine playback)"
  - "lottie-cocos plugin (https://github.com/cocos/cocos-engine-external)"
  - "Howler.js 2.2.x (cross-platform audio)"
  - "Native haptics: CoreHaptics (iOS) + VibrationEffect (Android API 26+)"
  - "TinyPNG / oxipng (deterministic texture compression)"
  - "ffmpeg (audio loop normalisation)"
disallowed_tools:
  - "Frame-by-frame sprite-sheet animation (3× the asset budget per plan §PART 5)"
  - "DragonBones (Spine alternative — incompatible runtime API, would fork the pipeline)"
  - "Live2D for the launch hero pet (heavier license; permitted for premium-species pets in a future FR)"
  - "Compressed audio formats Cocos cannot decode at runtime (e.g. Opus on iOS Safari — use AAC/MP3 fallback)"
  - "Cocos Particle2D for pet body animation (Spine only — Particle2D is for VFX layers)"
risk_if_skipped: "Without a locked Spine authoring contract, every pet species takes 3× the artist budget (plan §PART 5 risk); the visual ceiling that differentiates from Pou-clones collapses; AR/TikTok-export hooks (FR-AR-001, FR-VIRAL-001) cannot ship because they depend on the contract's pose set."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Spine 2D engine pin.** Pet skeletons MUST be authored in **Spine 2D 4.2.x** (Esoteric Software). The Spine runtime MUST be `@cocos/spine-runtime` matching Spine 4.2. Mixing runtime ↔ editor major versions is forbidden.

§1.2  **20-animation contract.** Every Spine skeleton (one per pet species) MUST implement the contract animation set with these exact names:
```
idle_baby | idle_teen | idle_adult
eat | sleep | happy | sad | sick | dance | wave
hatch | evolve_baby_to_teen | evolve_teen_to_adult
care_pet | care_clean | care_feed | care_drink
celebrate_co_parent | wedding_pose
ar_greet
```
20 animations exactly. Adding a 21st requires an FR amendment (the count is the contract). Missing one breaks the linter.

§1.3  **Skeleton root contract.** Every skeleton MUST have:
- root bone named `root`;
- three rig presets: `baby`, `teen`, `adult` (via Spine skin system OR three skeleton states);
- exactly 4 attachment slots: `body`, `face`, `accessory_head`, `accessory_body`;
- a `mood_blink` event firing every 2-6 seconds in `idle_*`.

§1.4  **Slot taxonomy for cosmetics.** Cosmetic outfits (FR-ECON-002 / FR-ECON-003) MUST swap attachments only on the named `accessory_*` slots — never on `body` or `face` (which would break species identity). The Spine "Skin" mechanism MUST be used so that swapping is deterministic and bandwidth-cheap (no full-skeleton reload).

§1.5  **Atlas + texture limits.** Each species' atlas MUST be: (a) 2048×2048 max single page; (b) PNG-8 if no semi-transparency required, otherwise PNG-32; (c) compressed deterministically with `oxipng -o4`; (d) ≤ 1.0 MB on disk per species after compression. The `compress-textures.mjs` script MUST run as a pre-bundle step.

§1.6  **Bundle budget per species.** Per FR-INFRA-001 §1.5, each pet species' Cocos asset bundle (skeleton JSON + atlas PNG + animation track binary) MUST be ≤ **1.5 MB compressed (br)** per the budget table. Verified by `apps/cocos/extensions/asset-budget-per-pet/main.ts` Editor extension + the existing `assert-bundle-budget.mjs` CI check.

§1.7  **Spine contract linter.** A Cocos Editor extension at `apps/cocos/extensions/spine-contract-lint/main.ts` MUST: (a) load each Spine JSON; (b) assert all 20 animation names present; (c) assert root bone + skin presets + slot names match §1.3/§1.4; (d) flag any animation longer than 5 seconds (idle exception — capped at 8 s); (e) display a red banner in the Editor on violation. A CLI mirror lives at `scripts/art/validate-spine-contract.mjs` for CI.

§1.8  **Cocos `SpineLoader.ts` wrapper.** A typed wrapper MUST expose:
```
loadPetSkeleton(speciesId: string, opts: { tenantSlug?: string }): Promise<sp.Skeleton>
playContractAnimation(skel: sp.Skeleton, name: AnimationContractName, opts?: { loop?: boolean; mixDuration?: number }): void
```
The type `AnimationContractName` is the union of the 20 names in §1.2. Calling with a non-contract string is a TypeScript compile error.

§1.9  **Lottie for UI micro-animation.** UI micro-animations (button-press, level-up burst, currency-gain) MUST use Lottie via `lottie-cocos`. Lottie JSON files MUST live under `apps/cocos/assets/ui/lottie/` with a `_manifest.json` listing each animation's purpose + length. Per-Lottie size budget: ≤ 50 KB JSON + ≤ 200 KB embedded images (use SVG paths where possible).

§1.10  **Howler.js audio mixer.** Audio playback MUST use Howler.js 2.2.x via the `AudioMixer.ts` wrapper. Wrapper API:
```
AudioMixer.playLoop(name: LoopName, opts?: { fadeInMs?: number }): HowlHandle
AudioMixer.playOneShot(name: SfxName): void
AudioMixer.setBus(bus: 'music' | 'sfx' | 'ui', volume: number): void
AudioMixer.muteAll(): void
```
The kids SKU MUST default `muteAll()` ON at first launch per plan §PART 5 (Apple Kids guideline expectation). Standard SKU defaults music ON, sfx ON, ui ON at 70% / 90% / 80% respectively.

§1.11  **Audio asset budget.** The launch hero pet (Mochi) ships with: **8 music loops** (3 idle / 2 hatch-celebrate / 1 sleep / 1 sad / 1 sick) + **80 SFX** (≤ 0.5 s each, AAC 96 kbps mono). Total music: ≤ 4 MB; total SFX: ≤ 2 MB. Loops MUST be normalised to -16 LUFS via ffmpeg.

§1.12  **Sound credit + licensing.** Every audio asset MUST have a license entry in `docs/art/audio-license-ledger.md` covering: source (composer name OR royalty-free site), license type (full-buyout / CC0 / CC-BY-NC / commissioned), attribution requirement. CC-BY-NC and non-royalty-free assets are forbidden for production. License audit runs in `pnpm legal:check`.

§1.13  **HapticsAdapter.** A `HapticsAdapter.ts` wrapper MUST expose:
```
HapticsAdapter.tap(intensity: 'light' | 'medium' | 'heavy'): void
HapticsAdapter.success(): void
HapticsAdapter.warning(): void
HapticsAdapter.error(): void
```
On iOS, MUST use CoreHaptics `CHHapticEngine`; on Android API 26+, MUST use `VibrationEffect`; on web + older Android, MUST be a no-op (graceful degrade). Haptics MUST respect the user's accessibility "reduce motion" preference (per FR-A11Y-001) and the OS-level haptics-off setting.

§1.14  **Mute-on-default for kids SKU.** Per plan §PART 5 + Apple Kids Category expectation, the kids SKU MUST launch with audio muted; the player MUST tap an explicit "enable sound" button before any audio plays. Standard SKU launches with audio ON.

§1.15  **Spine authoring guide.** A guide at `docs/art/spine-authoring-guide.md` MUST cover: contract animations checklist; bone-naming conventions; mesh-deformation budget (≤ 200 vertices per skeleton); texture-atlas packing recipe (1-pixel padding); export settings (`Cocos Creator preset` ticked in Spine export dialog); per-animation FPS (24 fps default).

§1.16  **Per-pet bundle build script.** `scripts/art/build-pet-bundle.mjs` MUST: (a) accept `--species=<id>`; (b) validate Spine contract; (c) compress textures; (d) emit `apps/cocos/build/pets/<species>/` with skeleton.json + atlas.png + meta.json (size summary); (e) run the asset-budget assert.

§1.17  **Per-pet tenant override.** A per-tenant theme bundle (FR-B2B-001) MAY override colour palette / accessory presets via Spine's skin mechanism, but MUST NOT override the contract animation set. Tenant overrides live under `apps/cocos/assets/tenants/<slug>/pets/<species>/skin.json`. The tenant skin path is resolved by `SpineLoader.loadPetSkeleton` via the `tenantSlug` option (FR-INFRA-001 §1.6 loader API).

§1.18  **A11Y reduce-motion compatibility.** When `prefers-reduced-motion` is set (per FR-A11Y-001), `playContractAnimation` MUST: (a) replace evolutionary morph cuts with a fade; (b) cap idle loop frequency to 1× per 5 s; (c) skip particle layers attached to the Spine skeleton. The reduce-motion path MUST NOT break the contract — every animation still runs, just gentler.

§1.19  **Hot-reload during development.** The Cocos Editor MUST hot-reload Spine assets without a full project reload — supported natively by `@cocos/spine-runtime` but MUST be verified in the authoring-guide test rig.

§1.20  **Performance budget.** On a baseline VN Android device (1 GB RAM, mid-tier 2024 SoC), playing 3 concurrent Spine skeletons in idle MUST sustain ≥ 50 fps with the Mochi launch skeleton. Verified by a Cocos perf test on a representative device emulator profile.

---

## §2 — Why this design

**Why Spine 2D over Live2D / frame-by-frame / DragonBones.** Plan §PART 4 + §PART 5 — Spine ($69 essential, $299 pro one-time per artist) is the industry standard with the best Cocos integration. Live2D is heavier license (subscription) and over-tuned for VTuber / anime face — overkill for kawaii pets and 2x the asset cost per pet. Frame-by-frame is 3× the artist budget per plan §PART 5. DragonBones is technically compatible but has a smaller artist community + fewer Cocos integration examples; would silently widen the talent pool to find.

**Why a 20-animation contract.** Without a contract, each new pet species drifts in animation names + counts, which means every UI consumer (Spine player invocation in `FR-PET-002` evolution flow, `FR-CARE-001` feed action, `FR-AR-001` AR-greet, etc.) needs per-species switch cases. With a contract, the consumer code is generic and a new species only requires the Spine artist to fill the contract. The 20 names cover every gameplay-driven animation in P1-P3 — anything new requires an FR amendment so the change is intentional.

**Why three rig presets via skin system.** Spine's skin mechanism is dramatically cheaper at runtime than swapping skeletons. A pet that evolves baby → teen → adult doesn't reload its skeleton; it switches skin. Bundle size drops too (one skeleton instead of three).

**Why slot taxonomy excludes `body` and `face`.** Cosmetic swapping on `body` would let a player buy "make this pet's species look like a different species" — the moment that ships, the pet identity collapses and FR-PET-006 rarity tiers become meaningless. `accessory_head` + `accessory_body` give cosmetic surface without breaking identity.

**Why 1.5 MB per-species bundle.** Plan §PART 4 — total WebGL initial bundle is 15 MB. The core experience (one pet) sits inside ~3 MB (root engine + UI + Mochi). Adding species without inflating cold-start means cap-per-species at 1.5 MB. Atlas 1.0 MB + skeleton/track binary 0.5 MB = the budget.

**Why deterministic texture compression.** `oxipng -o4` is the standard reproducible PNG optimiser. Non-deterministic compressors (some node-canvas builds) break FR-INFRA-001 §1.13 reproducible builds.

**Why a Cocos Editor extension AND a CLI for linting.** Editor extension catches violations at design time (red banner is in the artist's face). CLI catches violations when an artist commits direct to git without opening the Editor. Both layers needed.

**Why TypeScript union type for animation names.** Forces compile-time enforcement of the contract in consumer code. A new pet species engineer cannot accidentally play `'happey'` (typo) — TypeScript errors immediately.

**Why Lottie for UI but Spine for pets.** Lottie is purpose-built for vector UI micro-animation and ships smaller files for short geometric animations. Spine is purpose-built for character rigging + mesh deformation. Using one tool for both is feasible but always optimises for the wrong case on one side.

**Why Howler.js.** Plan §PART 4 — cross-platform audio with consistent API. Cocos's native audio API has documented quirks across iOS Safari WebGL + Android WebView. Howler abstracts them.

**Why mute-on-default for kids SKU.** Apple Kids Category Guideline expectation: kids apps SHOULD launch silently so the device-mute setting is respected. Auto-playing audio in a kids app is a Review-rejection risk.

**Why audio loops at -16 LUFS.** Mobile content broadcast standard since 2019. Loops at louder LUFS clip on cheap VN Android speakers; quieter LUFS makes the game feel "dead."

**Why HapticsAdapter respects accessibility.** Some users find haptics painful (e.g. arthritis); some Android haptics implementations are uncomfortably aggressive. Respecting the OS-level setting is the right user-respect default.

**Why a tenant-skin override exists but cannot override contract animations.** Per FR-B2B-001, tenants want a Pet-of-Techcombank look. Letting them swap the palette is a config; letting them remove animations would break consumer features (every consumer feature relies on the 20 animations existing).

**Why 50 fps on a 1 GB Android baseline.** Plan §PART 4 — VN baseline is 1 GB RAM Android. 50 fps with 3 concurrent skeletons (the owner pet + 1 visiting pet + a UI background pet) is the realistic stress case. Anything below feels stuttery.

---

## §3 — API contract & code shape

### 3.1 — Animation contract type

```typescript
// apps/cocos/assets/_root/art/AnimationContract.ts
export const ANIMATION_CONTRACT = [
  'idle_baby', 'idle_teen', 'idle_adult',
  'eat', 'sleep', 'happy', 'sad', 'sick', 'dance', 'wave',
  'hatch', 'evolve_baby_to_teen', 'evolve_teen_to_adult',
  'care_pet', 'care_clean', 'care_feed', 'care_drink',
  'celebrate_co_parent', 'wedding_pose',
  'ar_greet',
] as const;

export type AnimationContractName = (typeof ANIMATION_CONTRACT)[number];

export const ATTACHMENT_SLOTS = ['body','face','accessory_head','accessory_body'] as const;
export type AttachmentSlot = (typeof ATTACHMENT_SLOTS)[number];

export const SKIN_PRESETS = ['baby','teen','adult'] as const;
export type SkinPreset = (typeof SKIN_PRESETS)[number];
```

### 3.2 — SpineLoader

```typescript
// apps/cocos/assets/_root/art/SpineLoader.ts
import { sp } from 'cc';
import { loadBundle } from '../loaders/AssetBundleLoader';
import { AnimationContractName, ANIMATION_CONTRACT } from './AnimationContract';

export class SpineLoader {
  async loadPetSkeleton(speciesId: string, opts: { tenantSlug?: string } = {}): Promise<sp.SkeletonData> {
    const bundle = await loadBundle(`pets/${speciesId}`, {
      cdnPrefix: process.env.CDN_PREFIX!,
      tenantSlug: opts.tenantSlug,
    });
    const data = await new Promise<sp.SkeletonData>((res, rej) => {
      bundle.load(`${speciesId}/skeleton`, sp.SkeletonData, (err, d) => err ? rej(err) : res(d));
    });
    this.assertContract(data);
    return data;
  }

  private assertContract(data: sp.SkeletonData): void {
    const present = new Set(data.animations.map(a => a.name));
    for (const required of ANIMATION_CONTRACT) {
      if (!present.has(required)) {
        throw new Error(`FR-ART-001 §1.2 — animation '${required}' missing from skeleton`);
      }
    }
  }

  playContractAnimation(
    skel: sp.Skeleton,
    name: AnimationContractName,
    opts: { loop?: boolean; mixDuration?: number } = {},
  ): void {
    skel.setAnimation(0, name, opts.loop ?? false);
    if (opts.mixDuration != null) skel.setMix(name, name, opts.mixDuration);
  }
}
```

### 3.3 — Spine contract linter (CLI)

```javascript
// scripts/art/validate-spine-contract.mjs
import { readFileSync } from 'node:fs';

const CONTRACT = [
  'idle_baby','idle_teen','idle_adult','eat','sleep','happy','sad','sick','dance','wave',
  'hatch','evolve_baby_to_teen','evolve_teen_to_adult','care_pet','care_clean','care_feed','care_drink',
  'celebrate_co_parent','wedding_pose','ar_greet',
];
const SLOTS = ['body','face','accessory_head','accessory_body'];
const SKINS = ['baby','teen','adult'];

const path = process.argv[2];
if (!path) { console.error('usage: validate-spine-contract.mjs <skeleton.json>'); process.exit(2); }

const sk = JSON.parse(readFileSync(path, 'utf8'));
const errors = [];

const animationNames = Object.keys(sk.animations ?? {});
for (const required of CONTRACT) if (!animationNames.includes(required)) errors.push(`missing animation: ${required}`);
if (animationNames.length !== CONTRACT.length) errors.push(`expected exactly ${CONTRACT.length} animations, found ${animationNames.length}`);

const slotNames = new Set((sk.slots ?? []).map(s => s.name));
for (const slot of SLOTS) if (!slotNames.has(slot)) errors.push(`missing slot: ${slot}`);

const skinNames = new Set((sk.skins ?? []).map(s => s.name));
for (const skin of SKINS) if (!skinNames.has(skin)) errors.push(`missing skin preset: ${skin}`);

for (const [name, anim] of Object.entries(sk.animations ?? {})) {
  const maxDuration = name.startsWith('idle_') ? 8 : 5;
  const duration = computeAnimDuration(anim);
  if (duration > maxDuration) errors.push(`animation '${name}' duration ${duration.toFixed(2)}s > ${maxDuration}s`);
}

if (errors.length) { console.error('FR-ART-001 contract failures:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log(`OK: ${path}`);

function computeAnimDuration(anim) {
  let max = 0;
  for (const tracks of Object.values(anim ?? {})) for (const t of Object.values(tracks ?? {})) {
    if (Array.isArray(t)) for (const kf of t) if (kf?.time > max) max = kf.time;
  }
  return max;
}
```

### 3.4 — AudioMixer

```typescript
// apps/cocos/assets/_root/art/AudioMixer.ts
import { Howl } from 'howler';
import { isKidsSku } from '../legal/build-target';

type Bus = 'music' | 'sfx' | 'ui';

export class AudioMixer {
  private static busVolume: Record<Bus, number> =
    isKidsSku() ? { music: 0, sfx: 0, ui: 0 } : { music: 0.7, sfx: 0.9, ui: 0.8 };
  private static handles = new Map<string, Howl>();

  static playLoop(name: string, opts: { fadeInMs?: number } = {}): Howl {
    const h = new Howl({ src: [`audio/loops/${name}.m4a`], loop: true, volume: 0 });
    this.handles.set(name, h);
    h.play();
    h.fade(0, this.busVolume.music, opts.fadeInMs ?? 500);
    return h;
  }

  static playOneShot(name: string): void {
    const h = new Howl({ src: [`audio/sfx/${name}.m4a`], volume: this.busVolume.sfx });
    h.play();
  }

  static setBus(bus: Bus, volume: number): void {
    this.busVolume[bus] = Math.max(0, Math.min(1, volume));
  }

  static muteAll(): void { for (const h of this.handles.values()) h.mute(true); }
}
```

---

## §4 — Acceptance criteria

**AC1.** `pnpm art:lint` (running `validate-spine-contract.mjs` over every `apps/cocos/assets/pets/*/skeleton.json`) exits 0 on the launch hero (Mochi) skeleton AND exits non-zero on a fixture skeleton missing `wedding_pose`. Verified by CI step + `__tests__/AnimationContract.spec.ts` fixture set.

**AC2.** TypeScript compile fails when consumer code calls `playContractAnimation(skel, 'happey')`. Verified by `__tests__/AnimationContract.spec.ts` with `@ts-expect-error` lines.

**AC3.** Loading the Mochi pet skeleton via `SpineLoader.loadPetSkeleton('mochi')` resolves with all 20 animations present. Verified by `__tests__/SpineLoader.spec.ts`.

**AC4.** A skeleton missing any contract animation throws an error at load time. Verified by spec test with a stripped fixture.

**AC5.** Per-pet bundle (Mochi) is ≤ 1.5 MB brotli-compressed. Verified by `assert-bundle-budget.mjs` running on the Mochi build artefact.

**AC6.** Audio loop normalisation: every committed `.m4a` loop measures -16 LUFS ±1 LU. Verified by `pnpm art:audit-audio` running `ffmpeg-normalize` in dry-run mode.

**AC7.** Kids SKU launches with bus volumes at 0 (muted). Verified by `__tests__/AudioMixer.spec.ts` with `BUILD_TARGET=kids`.

**AC8.** Standard SKU launches with music/sfx/ui at 70/90/80%. Verified similarly.

**AC9.** Lottie animations under `apps/cocos/assets/ui/lottie/` are each ≤ 50 KB JSON. Verified by a `pnpm art:check-lottie-budgets` script.

**AC10.** Tenant skin override path resolves correctly via `SpineLoader.loadPetSkeleton('mochi', { tenantSlug: 'techcombank' })`. Verified by `__tests__/SpineLoader.spec.ts` against a mocked CDN.

**AC11.** Performance test on a 1 GB Android emulator profile sustains ≥ 50 fps with 3 concurrent Mochi skeletons in idle. Verified by `apps/cocos/__tests__/perf-spine.spec.ts` running in Cocos Test Player.

**AC12.** Cocos Editor extension shows a red banner when opening a project with a non-contract-conforming Spine asset. Verified manually + by a Playwright-against-Editor smoke test.

**AC13.** Reduce-motion mode is respected — when `prefers-reduced-motion: reduce` is set (per FR-A11Y-001), `playContractAnimation` skips particle layers + falls back to fade for evolution morphs. Verified by `__tests__/AnimationContract.spec.ts`.

**AC14.** Audio license ledger covers every committed asset. Verified by `pnpm legal:check` which diffs the ledger against `apps/cocos/assets/audio/**/*.m4a`.

---

## §5 — Verification

### 5.1 — Animation contract test

```typescript
// apps/cocos/assets/_root/art/__tests__/AnimationContract.spec.ts
import { describe, it, expect } from 'vitest';
import { ANIMATION_CONTRACT, AnimationContractName } from '../AnimationContract';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('FR-ART-001 — animation contract', () => {
  it('contract has exactly 20 names', () => {
    expect(ANIMATION_CONTRACT.length).toBe(20);
    expect(new Set(ANIMATION_CONTRACT).size).toBe(20);   // no dups
  });

  it('compile-time rejects unknown animation names', () => {
    function play(_name: AnimationContractName) { /* noop */ }
    play('eat');                                          // ok
    // @ts-expect-error - 'happey' is not in contract
    play('happey');
  });

  it('CLI validator rejects skeleton missing wedding_pose', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'spine-'));
    const stripped = makeFixtureSkeleton({ omit: ['wedding_pose'] });
    const path = join(tmp, 'bad.json');
    writeFileSync(path, JSON.stringify(stripped));
    expect(() => execSync(`node scripts/art/validate-spine-contract.mjs ${path}`, { stdio: 'pipe' }))
      .toThrow(/missing animation: wedding_pose/);
  });
});

function makeFixtureSkeleton(opts: { omit?: string[] } = {}) {
  const omit = new Set(opts.omit ?? []);
  return {
    skins:[{ name:'baby' },{ name:'teen' },{ name:'adult' }],
    slots:[{ name:'body' },{ name:'face' },{ name:'accessory_head' },{ name:'accessory_body' }],
    animations: Object.fromEntries(ANIMATION_CONTRACT.filter(n => !omit.has(n)).map(n => [n, {}])),
  };
}
```

### 5.2 — AudioMixer kids-default test

```typescript
// apps/cocos/assets/_root/art/__tests__/AudioMixer.spec.ts
import { describe, it, expect, vi } from 'vitest';

describe('FR-ART-001 §1.10/§1.14 — AudioMixer defaults', () => {
  it('kids SKU launches muted', async () => {
    (globalThis as any).__BUILD_TARGET__ = 'kids';
    vi.resetModules();
    const { AudioMixer } = await import('../AudioMixer');
    expect((AudioMixer as any).busVolume.music).toBe(0);
    expect((AudioMixer as any).busVolume.sfx).toBe(0);
    expect((AudioMixer as any).busVolume.ui).toBe(0);
  });

  it('standard SKU launches with 70/90/80', async () => {
    (globalThis as any).__BUILD_TARGET__ = 'standard';
    vi.resetModules();
    const { AudioMixer } = await import('../AudioMixer');
    expect((AudioMixer as any).busVolume.music).toBeCloseTo(0.7);
    expect((AudioMixer as any).busVolume.sfx).toBeCloseTo(0.9);
    expect((AudioMixer as any).busVolume.ui).toBeCloseTo(0.8);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/_root/art/HapticsAdapter.ts
import { sys } from 'cc';
import { prefersReducedMotion } from '../a11y/preferences';

declare const window: any;

export class HapticsAdapter {
  static tap(intensity: 'light' | 'medium' | 'heavy'): void {
    if (prefersReducedMotion()) return;
    if (sys.os === sys.OS.IOS && (window as any).__iosHaptics?.tap) {
      (window as any).__iosHaptics.tap(intensity);
    } else if (sys.os === sys.OS.ANDROID && (window as any).__androidVibrate) {
      const ms = intensity === 'light' ? 10 : intensity === 'medium' ? 25 : 60;
      (window as any).__androidVibrate(ms);
    }
    // web + older Android: no-op
  }

  static success(): void { this.tap('light'); this.tap('light'); }
  static warning(): void { this.tap('medium'); }
  static error():   void { this.tap('heavy'); this.tap('heavy'); }
}
```

---

## §7 — Dependencies

**External:** Spine 2D editor license (per artist); `@cocos/spine-runtime` matching Spine 4.2; `lottie-cocos` plugin; Howler.js 2.2.x npm package; CoreHaptics (iOS SDK); VibrationEffect (Android SDK 26+); oxipng + ffmpeg for build pipeline; commissioned composer for 8 loops + 80 SFX (~$3-5K per plan §PART 5).

**Internal:** FR-INFRA-001 (Cocos scaffold + asset-bundle loader + bundle-budget script).

**Blocks:** FR-PET-001 (pet entity needs the skeleton runtime), FR-PET-002 (evolution stages use the skin presets), FR-PET-006 (5 launch species all conform to contract), FR-CARE-001/002/003 (each care action triggers a contract animation), FR-AR-001 (AR-greet animation), FR-VIRAL-001 (TikTok export captures contract animations), FR-ECON-003 (UGC Pet Couture uses accessory slots).

---

## §8 — Example payloads

### 8.1 — Spine contract linter PASS

```text
$ pnpm art:lint
OK: apps/cocos/assets/pets/mochi/skeleton.json
OK: apps/cocos/assets/pets/pengu/skeleton.json
```

### 8.2 — Spine contract linter FAIL

```text
$ pnpm art:lint
FR-ART-001 contract failures:
  missing animation: wedding_pose
  animation 'idle_baby' duration 9.20s > 8s
apps/cocos/assets/pets/bao/skeleton.json
exit 1
```

### 8.3 — Bundle-budget output for Mochi species

```text
$ node scripts/art/build-pet-bundle.mjs --species=mochi
[1/4] validating spine contract ... OK
[2/4] compressing textures via oxipng -o4 ... 1.0 MB → 786 KB
[3/4] building bundle ... apps/cocos/build/pets/mochi/ (1.18 MB br)
[4/4] asserting per-species budget (1.5 MB) ... PASS
```

### 8.4 — Audio license ledger entry

```yaml
- file: audio/loops/idle-baby.m4a
  source: composer "Hoa Tran (commissioned)"
  license: full-buyout
  contract: docs/legal/composer-engagement-letter.pdf
  added: 2026-05-17
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Spine Essential vs Pro? → §`allowed_tools` — Essential ($69) sufficient for launch; Pro ($299) only if mesh skinning becomes needed for premium pets (deferred FR).
- **OQ-2 (resolved):** Live2D for the hero pet? → §`disallowed_tools` + §2 — Live2D permitted only for premium-species pets in a future FR; launch hero uses Spine.
- **OQ-3 (resolved):** Contract size — 20 vs 25 animations? → §1.2 + §2 — 20 covers every P1-P3 gameplay-driven animation; new ones require FR amendment.
- **OQ-4 (resolved):** Audio format — AAC vs MP3 vs Opus? → §`disallowed_tools` — AAC primary (iOS Safari WebGL friendly); MP3 fallback. Opus deferred.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | New species ships missing a contract animation | `pnpm art:lint` CI step | PR blocked | Artist fills the missing animation; re-PR |
| 2 | Texture atlas exceeds 1 MB after compression | `assert-bundle-budget` fails | Build blocked | Artist re-packs or drops mesh detail; or split into 2 atlas pages |
| 3 | A consumer ships `playContractAnimation('typo')` | TypeScript compile error | PR blocked | Use canonical contract name |
| 4 | Spine 4.2 → 4.3 major upgrade breaks runtime | Cocos plugin regression | Pet rendering breaks | Pin Spine + runtime; upgrade FR with regression pass |
| 5 | Lottie file inflates with embedded raster art | `art:check-lottie-budgets` fails | Build blocked | Vector-only refactor; or move to Spine |
| 6 | Audio loop measured at -10 LUFS (too loud) | `art:audit-audio` fails | Build blocked | Re-normalise; re-commit |
| 7 | Composer asset uploaded with CC-BY-NC license | `pnpm legal:check` rejects | Build blocked | Either commission full-buyout or replace asset |
| 8 | iOS CoreHaptics permission denied | Runtime detection | Haptic no-op | Document; user can re-enable in Settings |
| 9 | Tenant skin override breaks contract (e.g. removes a slot) | Linter on tenant manifest | Tenant theme rejected | Tenant uploads compliant override; re-deploy |
| 10 | Performance test fails on 1 GB Android emulator | `__tests__/perf-spine.spec.ts` fails | PR blocked | Optimise skeleton bone count; reduce mesh deformation; or relax target with explicit FR amendment |
| 11 | Spine artist commits with non-default Cocos export preset | Linter checks JSON shape; emits warning | Asset may load but suboptimal | Artist re-exports with correct preset |
| 12 | Reduce-motion toggle off-by-one (animation skipped when not needed) | `__tests__/AnimationContract.spec.ts` covers branch | UX regression for non-A11Y users | Fix conditional; redeploy |

---

## §11 — Notes

**Plan refs:** plan §PART 5 (art direction & UX) — Spine 2D, 20 base animations per pet, Lottie UI, Howler.js audio, ~$3-5K composer budget, mute-on default for kids per Apple Kids guideline.

**Sub-decisions punted to ops:**
- Spine Pro vs Essential per artist — Essential default; Pro purchase requires a budget memo.
- Composer engagement letter template — locked in `docs/legal/composer-engagement-letter-template.pdf`.
- Final 8 loops + 80 SFX music briefs — owned by art lead post-P0.

**Anti-patterns explicitly forbidden:**
- Frame-by-frame animation for pets.
- Cosmetic slot overlap on `body` / `face`.
- Live2D on the launch hero (cost + license risk).
- Per-species custom animation names outside the contract.
- Audio assets without a license ledger entry.

**Cross-reference:** This FR is the substrate for every visual gameplay FR in P1. Without it, FR-PET-001 cannot load a renderable pet; FR-CARE-001 has nothing to animate; FR-VIRAL-001 has no export-able motion. FR-B2B-001 (tenant themes) extends this without breaking the contract.
