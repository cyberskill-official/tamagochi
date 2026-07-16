---
id: TASK-INFRA-001
title: "Cocos Creator 3.x + TypeScript project scaffold (iOS / Android / WebGL)"
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
related_frs: [TASK-LEGAL-003, TASK-INFRA-002, TASK-INFRA-003, TASK-ART-001, TASK-PET-001, TASK-AUTH-001, TASK-AR-001, TASK-I18N-001, TASK-A11Y-001, TASK-B2B-001]
depends_on: []
blocks: [TASK-INFRA-002, TASK-INFRA-003, TASK-ART-001, TASK-PET-001, TASK-AR-001, TASK-I18N-001, TASK-A11Y-001, TASK-B2B-001]
effort_hours: 14
new_files:
  - "apps/cocos/package.json"
  - "apps/cocos/tsconfig.json"
  - "apps/cocos/project.json"
  - "apps/cocos/settings/v2/packages/builder.json"
  - "apps/cocos/settings/v2/packages/engine.json"
  - "apps/cocos/assets/_root/main.scene"
  - "apps/cocos/assets/_root/loaders/AssetBundleLoader.ts"
  - "apps/cocos/assets/_root/legal/audience.ts"
  - "apps/cocos/assets/_root/legal/build-target.ts"
  - "apps/cocos/extensions/asset-bundle-budget-check/main.ts"
  - "apps/cocos/scripts/build-kids.mjs"
  - "apps/cocos/scripts/build-standard.mjs"
  - "apps/cocos/scripts/assert-bundle-budget.mjs"
  - "apps/cocos/fastlane/Fastfile"
  - "apps/cocos/gradle.properties"
  - "apps/cocos/ios/Podfile"
  - "apps/cocos/.editorconfig"
  - "apps/cocos/__tests__/build-target.spec.ts"
  - "apps/cocos/__tests__/asset-bundle-loader.spec.ts"
  - ".github/workflows/cocos-build.yml"
modified_files:
  - "package.json"
  - "turbo.json"
allowed_tools:
  - "Cocos Creator 3.8.x (pinned)"
  - "Node.js 20 LTS"
  - "TypeScript 5.4.x"
  - "Spine Cocos plugin (@cocos/spine v3.8 compatible)"
  - "Lottie Cocos plugin"
  - "Howler.js 2.2.x for cross-platform audio"
  - "Fastlane (iOS + Android build orchestration)"
  - "Gradle 8.5 / Android Gradle Plugin 8.2"
  - "Xcode 15.3+ (iOS toolchain)"
disallowed_tools:
  - "Unity (rejected per plan §PART 4 — build size + 2024 pricing scare + 3D overkill)"
  - "Unreal (rejected — overkill for 2D)"
  - "Godot Web (rejected — production export still rough)"
  - "PixiJS (rejected — would require rebuilding scene system)"
  - "Cocos Creator 2.x (legacy — TypeScript story weak)"
  - "Royalty-bearing engines"
risk_if_skipped: "Without a pinned, reproducible Cocos scaffold, every downstream visual / gameplay task will sit on a moving target; build-size budget overruns kill emerging-market mobile-web reach (plan §PART 4 cites 5-15 MB ceiling)."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Engine pin.** The project MUST use **Cocos Creator 3.8.x** (latest 3.8 LTS at scaffold time, pinned to a specific patch in `apps/cocos/settings/v2/packages/engine.json` with field `version: "3.8.4"` — exact version locked, not `^3.8` or `~3.8`). Major or minor upgrades MUST be a deliberate task amendment with regression testing per §10 row 7.

§1.2  **Language pin.** All gameplay code MUST be written in **TypeScript 5.4.x** with `strict: true` and `noUncheckedIndexedAccess: true`. Plain JavaScript files are forbidden except for build scripts and ESLint plugin shims. `any` is forbidden outside `assets/_legacy/` (which MUST remain empty at P0).

§1.3  **Build targets.** The single Cocos project MUST produce three build artefacts on `pnpm cocos:build:<target>`:
- **iOS** — `.ipa` via Cocos `build-iOS` task → Xcode `archive` → Fastlane sign+upload to TestFlight;
- **Android** — `.aab` via Cocos `build-Android` task → Gradle `bundleRelease` → Fastlane sign+upload to Play Internal Test;
- **WebGL** — static bundle to `apps/cocos/build/web-mobile/` for upload to Cloudflare R2 + Cloudflare Pages.

§1.4  **Build-target SKU flag.** Per TASK-LEGAL-003, every build MUST emit a `BUILD_TARGET` constant (`kids` | `standard`) baked into the binary at build time. The flag MUST be readable via `import { buildTarget } from "legal/build-target"` from any Cocos component. Build scripts at `apps/cocos/scripts/build-kids.mjs` and `apps/cocos/scripts/build-standard.mjs` MUST set the flag + bundle ID + app name + icon path + SDK-include allow-list, and MUST fail-closed (exit non-zero) if either flag is missing.

§1.5  **Initial WebGL bundle ≤ 15 MB.** The post-launch initial WebGL bundle (the bytes a player downloads before they can hatch their first pet) MUST be ≤ **15 MB compressed (br + gz both)**. Plan §PART 4 cites this as the hard ceiling for emerging-market mobile web reach. A `scripts/assert-bundle-budget.mjs` check MUST run after every web build and fail CI if the budget is exceeded.

§1.6  **Asset-bundle CDN loader.** A `loaders/AssetBundleLoader.ts` MUST be present implementing the contract:
```
loadBundle(name: string, opts: { cdnPrefix: string; tenantSlug?: string }): Promise<AssetManager.Bundle>
```
The loader MUST honour `tenantSlug` so that per-tenant theme bundles (PetOS B2B per TASK-B2B-001) can be loaded from `<cdnPrefix>/<tenantSlug>/<bundleName>` without touching gameplay code.

§1.7  **Plugins pinned.** The following Cocos plugins MUST be installed at scaffold time with locked versions: `@cocos/spine` (Spine 2D — required by TASK-ART-001); `lottie-web` (Lottie UI micro-animation); `howler` (cross-platform audio, plan §PART 5). Each plugin's version MUST be recorded in `apps/cocos/package.json` `dependencies` with a `=` prefix (exact match), NOT `^` or `~`.

§1.8  **No Cocos plugin marketplace plugins without review.** Cocos's plugin marketplace ships third-party packages whose source is variably trustworthy. Any plugin imported from the marketplace MUST have its source vendored into `apps/cocos/vendored-plugins/<name>/` and its `LICENSE` checked into git. Marketplace `*.zip` installs are forbidden after this scaffold.

§1.9  **Asset-bundle budget check Editor extension.** A Cocos Editor extension at `apps/cocos/extensions/asset-bundle-budget-check/` MUST run on every `Project → Build` action and surface a banner if any bundle exceeds its per-bundle budget (see `apps/cocos/scripts/assert-bundle-budget.mjs` for the table — typically: root ≤ 15 MB, per-tenant theme ≤ 4 MB, per-species ≤ 1.5 MB, mini-game ≤ 2 MB).

§1.10  **TurboRepo integration.** The Cocos project MUST be a sibling app under the existing monorepo TurboRepo configuration (`turbo.json`). The `cocos:build`, `cocos:lint`, `cocos:test` tasks MUST be exposed via the root `package.json` and pipeline-declared in `turbo.json` with appropriate `outputs` and `cache` configuration.

§1.11  **TypeScript strict-config.** `apps/cocos/tsconfig.json` MUST extend the workspace base with: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitOverride: true`, `noFallthroughCasesInSwitch: true`. Test files MAY relax `noUncheckedIndexedAccess` if explicitly justified per-file via a comment.

§1.12  **Lint + format.** `apps/cocos/.editorconfig` + the root ESLint config MUST be applied. A `cocos-specific` ESLint plugin folder hosts: `no-cocos-1x-globals` (block `cc.*` 1.x patterns), `no-direct-component-create` (force `node.addComponent(Cls)` over `new Cls`), `no-blocking-loop-in-update` (warn on naive `for` loops inside `update`).

§1.13  **Reproducible builds.** Every build MUST be reproducible: given the same `git rev` and `BUILD_TARGET`, the produced `.ipa` / `.aab` / `web-mobile/` artefact MUST have a deterministic content hash (modulo platform-imposed signing). The build scripts MUST normalise build-time-only inputs (timestamps fixed to `2000-01-01T00:00:00Z`, no machine-identifying paths in source maps).

§1.14  **CI build pipeline.** `.github/workflows/cocos-build.yml` MUST: (a) install pnpm at workspace-pinned version; (b) install Node 20 LTS; (c) install Cocos Creator headless edition at the pinned version; (d) run `pnpm cocos:lint`; (e) run `pnpm cocos:test`; (f) build web-mobile + kids + standard variants; (g) run bundle-budget assertion; (h) upload artefacts to GitHub Actions storage; (i) publish a PR comment summarising bundle sizes diff vs base branch.

§1.15  **Cocos Editor headless on CI.** CI MUST run Cocos Editor in headless mode using the documented `--build` CLI invocation. Self-hosted runner OR managed Linux runner MUST have OpenGL ES + EGL libraries pre-installed (recipe at `apps/cocos/docs/ci-headless-runner-recipe.md`).

§1.16  **No Cocos analytics / telemetry phoning home.** The Cocos Editor and runtime ship with optional analytics SDKs that send build / runtime data to Chukong/Cocos servers. These MUST be disabled in `apps/cocos/settings/v2/packages/builder.json` (`analyticsEnabled: false`). This is a hard requirement for the kids SKU per TASK-LEGAL-001 §1.5(a) (no behavioural SDKs in kids binary).

§1.17  **Source-map handling.** Web builds MUST emit source maps to a separate `*.map` file (not inlined). Source maps MUST NOT be uploaded to the public CDN; they MUST be uploaded to Sentry (per TASK-OBS-001) only. The web build script MUST verify no `.map` file leaked to `apps/cocos/build/web-mobile/`.

§1.18  **`Fastfile` lanes.** `apps/cocos/fastlane/Fastfile` MUST define lanes `build_kids`, `build_standard`, `submit_kids_testflight`, `submit_standard_testflight`, `submit_kids_internal`, `submit_standard_internal`. The kids lanes MUST invoke `scripts/legal/inspect-kids-binary.mjs` (from TASK-LEGAL-003) before any submission action.

§1.19  **Asset organisation.** The `apps/cocos/assets/` folder structure MUST follow the contract:
```
assets/
  _root/                  — engine entry, scene loaders, build-target flag, legal gates
  pets/                   — per-species Spine + portrait + animations (one folder per species)
  mini-games/             — per-game folder, each loaded as its own bundle (TASK-CARE-004)
  ui/                     — global UI atlas, Lottie micro-anim sources
  audio/                  — Howler.js entry; music loops + SFX
  i18n/                   — per-locale string bundles (TASK-I18N-001 deliverable)
  tenants/<tenant-slug>/  — per-tenant theme override bundle (TASK-B2B-001 deliverable)
```

§1.20  **Loader unit test.** `apps/cocos/__tests__/asset-bundle-loader.spec.ts` MUST cover: (a) successful load from a mock CDN; (b) tenant-scoped path resolution; (c) network failure retry with exponential backoff; (d) cache hit on second load; (e) version mismatch eviction.

---

## §2 — Why this design

**Why Cocos Creator over Unity / Phaser / Godot / Flutter+Flame.** Plan §PART 4 lays out the case explicitly: Cocos delivers true write-once → iOS, Android, **WebGL**, and mini-program targets, with lean 5–15 MB initial WebGL bundles vs Unity's typical 30–50 MB. For an emerging-market mobile-web reach (VN base reality is 1 GB RAM Android with shaky bandwidth), WebGL bundle size is a hard reach gate. Unity also carries the 2024 pricing-scare overhang. Phaser is web-only (would need a separate React Native shell = two codebases). Godot's web export is still rough for production. Flutter+Flame has a weaker 2D asset/animation ecosystem (Spine + Lottie + Live2D support is much better in Cocos). TypeScript-native development means CyberSkill consultancy devs ramp instantly. No royalties.

**Why pin Cocos to 3.8.4 (or whatever 3.8 patch is current) and not `^3.8`.** Cocos minor releases have shipped breaking API changes within the same major (e.g. 3.6 → 3.7 changed the asset-bundle JSON shape). A pin freezes the surface area; an upgrade task forces a regression pass.

**Why TypeScript strict + `noUncheckedIndexedAccess`.** Cocos's node graph and component lookups are notoriously index-heavy. `noUncheckedIndexedAccess` forces every `arr[i]` access to be `arr[i] | undefined`, eliminating a whole class of runtime crashes that would otherwise pass review. The friction of writing `arr[i]?.x` is small; the production crash rate it eliminates is large.

**Why 15 MB initial bundle is the budget.** Plan §PART 4 — emerging-market WebGL discoverability dies above 15 MB. Cloudflare's median brotli compression on Cocos minified JS is ~3.5×, so the uncompressed source budget is ~52 MB; the asset budget is the much tighter constraint (Spine + textures + audio). The per-tenant theme is capped at 4 MB so that even with a tenant override loaded, the root + theme is still inside 19 MB on first interaction (acceptable for cold-start on B2B campaign traffic).

**Why an Asset-bundle Editor extension.** A CI-time check catches budget overruns post-fact. An Editor-time banner catches them at design-time, when the artist still has time to compress textures or drop a frame. Both checks are kept (Editor banner + CI assert).

**Why tenant-slug in the loader signature already at P0.** TASK-B2B-001 (multi-tenant client) lands in P4. But the loader API surface area touches every visual feature in P1-P3. Threading the slug from day zero makes B2B integration a config change in P4 rather than a refactor of every loader call.

**Why disable Cocos analytics by default.** Cocos analytics phones home to vendor servers (Chukong's analytics endpoint). For a kids-skewing app under COPPA-2025, an SDK that sends *anything* outbound during build or runtime is a regulator-questioned surface. Disabling it once at scaffold prevents 100 future audit headaches.

**Why reproducible builds.** A reproducible build is the difference between "we shipped vYYYY-MM-DD-abc1234" and "we shipped *something* yesterday and we're trying to figure out what." Reproducibility also enables `pnpm legal:export <out.zip>` (TASK-LEGAL-001 §1.13) to include cryptographic build proofs.

**Why source maps to Sentry only.** Source maps on the public CDN give competitors free de-obfuscation. Sentry-only keeps them available for incident response without exposing the codebase.

**Why no marketplace plugins without vendoring.** A marketplace package can ship a malicious update via the same `.zip` channel. Vendoring + LICENSE check makes supply-chain provenance auditable; a new release becomes an explicit `git diff` review.

**Why Fastlane (vs raw xcodebuild + gradle).** Apple App Store Connect and Google Play Console both require a litany of provisioning + signing + upload steps. Fastlane lanes are the canonical reproducible recipe; raw scripts drift fast.

---

## §3 — API contract & code shape

### 3.1 — Build-target flag

```typescript
// apps/cocos/assets/_root/legal/build-target.ts
declare const __BUILD_TARGET__: 'kids' | 'standard';   // injected by build script

export type BuildTarget = 'kids' | 'standard';
export const buildTarget: BuildTarget = __BUILD_TARGET__;
export const isKidsSku   = (): boolean => buildTarget === 'kids';
export const isStandardSku = (): boolean => buildTarget === 'standard';
```

### 3.2 — Asset-bundle loader

```typescript
// apps/cocos/assets/_root/loaders/AssetBundleLoader.ts
import { assetManager, AssetManager } from 'cc';

export interface LoadBundleOpts {
  cdnPrefix: string;             // e.g. https://cdn.tamagochi.app
  tenantSlug?: string;           // e.g. 'mochi' (consumer) or 'techcombank' (B2B)
  version?: string;              // bundle version for cache busting; defaults to last-good
  retry?: { max: number; baseMs: number };  // default: { max: 3, baseMs: 250 }
}

export async function loadBundle(name: string, opts: LoadBundleOpts): Promise<AssetManager.Bundle> {
  const slug = opts.tenantSlug ?? 'mochi';
  const url  = `${opts.cdnPrefix}/${slug}/${name}${opts.version ? `?v=${opts.version}` : ''}`;
  const retry = opts.retry ?? { max: 3, baseMs: 250 };
  let lastErr: unknown;
  for (let attempt = 0; attempt < retry.max; attempt++) {
    try {
      return await new Promise<AssetManager.Bundle>((resolve, reject) => {
        assetManager.loadBundle(url, { version: opts.version }, (err, bundle) => err ? reject(err) : resolve(bundle));
      });
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, retry.baseMs * 2 ** attempt));
    }
  }
  throw lastErr;
}
```

### 3.3 — Bundle-budget assertion script

```javascript
// apps/cocos/scripts/assert-bundle-budget.mjs
import { promises as fs } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { join } from 'node:path';

const BUDGETS_BYTES = {
  'root':            15 * 1024 * 1024,
  'tenant-default':   4 * 1024 * 1024,
  'pet-species':      1.5 * 1024 * 1024,
  'mini-game':        2 * 1024 * 1024,
};

const buildDir = process.argv[2];
if (!buildDir) { console.error('usage: assert-bundle-budget.mjs <build-dir>'); process.exit(2); }

const failures = [];
for (const [kind, budget] of Object.entries(BUDGETS_BYTES)) {
  for (const file of await listBundle(buildDir, kind)) {
    const buf = await fs.readFile(file);
    const brBytes = brotliCompressSync(buf).length;
    const gzBytes = gzipSync(buf).length;
    if (brBytes > budget || gzBytes > budget) {
      failures.push({ file, kind, brBytes, gzBytes, budget });
    }
  }
}
if (failures.length) {
  console.error('TASK-INFRA-001 §1.5 — bundle-budget failures:');
  for (const f of failures) console.error(`  ${f.file} (${f.kind}): br=${f.brBytes} gz=${f.gzBytes} > ${f.budget}`);
  process.exit(1);
}
console.log('bundle budgets PASS');
```

### 3.4 — `cocos:build:web` task

```jsonc
// apps/cocos/package.json (excerpt)
{
  "scripts": {
    "cocos:lint": "eslint assets --ext .ts",
    "cocos:test": "vitest run",
    "cocos:build:web":      "node scripts/build-standard.mjs --platform web",
    "cocos:build:kids:ios": "node scripts/build-kids.mjs    --platform ios",
    "cocos:build:standard:ios": "node scripts/build-standard.mjs --platform ios",
    "cocos:build:assert-budget": "node scripts/assert-bundle-budget.mjs build/web-mobile"
  }
}
```

---

## §4 — Acceptance criteria

**AC1.** `pnpm cocos:build:web` produces `apps/cocos/build/web-mobile/index.html` with brotli-compressed total bundle ≤ 15 MB. Verified by `scripts/assert-bundle-budget.mjs` exit code.

**AC2.** `pnpm cocos:build:kids:ios` produces an `.ipa` with `Info.plist` `CFBundleIdentifier == "world.cyberskill.tamagochi.kids"`. Verified by `__tests__/build-target.spec.ts` (mocks the build script and asserts plist write).

**AC3.** `pnpm cocos:build:standard:ios` produces an `.ipa` with `CFBundleIdentifier == "world.cyberskill.tamagochi"`. Verified similarly.

**AC4.** `apps/cocos/tsconfig.json` `strict: true` and `noUncheckedIndexedAccess: true`. Verified by reading the file in `__tests__/tsconfig.spec.ts` and asserting both flags are `true`.

**AC5.** Cocos analytics is disabled. Verified by `__tests__/cocos-settings.spec.ts` asserting `settings/v2/packages/builder.json` has `analyticsEnabled: false`.

**AC6.** `AssetBundleLoader.loadBundle` retries on transient network failure with exponential backoff. Verified by `__tests__/asset-bundle-loader.spec.ts` with a mocked `assetManager.loadBundle` that fails twice then succeeds.

**AC7.** `assert-bundle-budget.mjs` exits non-zero when fed a fixture build directory with a bundle exceeding budget. Verified by `__tests__/assert-bundle-budget.spec.ts`.

**AC8.** `.github/workflows/cocos-build.yml` runs end-to-end on a representative PR and emits a bundle-size diff comment. Verified by manually triggering the workflow on a test branch.

**AC9.** `__tests__/build-target.spec.ts` asserts that `buildTarget` equals `kids` when `__BUILD_TARGET__` is injected as `kids`, and equals `standard` when injected as `standard`. Default (no injection) MUST throw at module load.

**AC10.** `apps/cocos/vendored-plugins/` exists; if any marketplace plugin is added, its `LICENSE` is committed. Verified by a CI lint that rejects `*.zip` files under `vendored-plugins/`.

**AC11.** Source maps for the web build are NOT present in `apps/cocos/build/web-mobile/` after CI build. Verified by a glob assertion in `cocos-build.yml`.

**AC12.** Reproducible build: two consecutive runs of `pnpm cocos:build:web` (same `git rev`) produce byte-identical `web-mobile/index.html` and `web-mobile/main.*.js`. Verified by SHA-256 diff in `__tests__/reproducible-build.spec.ts`.

---

## §5 — Verification

### 5.1 — Build-target unit test

```typescript
// apps/cocos/__tests__/build-target.spec.ts
import { describe, it, expect, vi } from 'vitest';

describe('TASK-INFRA-001 §1.4 — build target flag', () => {
  beforeEach(() => { vi.resetModules(); });

  it('reports kids when injected as kids', async () => {
    (globalThis as any).__BUILD_TARGET__ = 'kids';
    const m = await import('../assets/_root/legal/build-target');
    expect(m.buildTarget).toBe('kids');
    expect(m.isKidsSku()).toBe(true);
  });

  it('reports standard when injected as standard', async () => {
    (globalThis as any).__BUILD_TARGET__ = 'standard';
    const m = await import('../assets/_root/legal/build-target');
    expect(m.buildTarget).toBe('standard');
    expect(m.isStandardSku()).toBe(true);
  });

  it('rejects an unknown value', async () => {
    (globalThis as any).__BUILD_TARGET__ = 'bogus';
    await expect(import('../assets/_root/legal/build-target'))
      .rejects.toThrow(/unknown BUILD_TARGET/);
  });
});
```

### 5.2 — Asset-bundle loader retry test

```typescript
// apps/cocos/__tests__/asset-bundle-loader.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { loadBundle } from '../assets/_root/loaders/AssetBundleLoader';
import { assetManager } from 'cc';

describe('TASK-INFRA-001 §1.6/§1.20 — asset bundle loader', () => {
  it('retries with exponential backoff on transient failure', async () => {
    let calls = 0;
    vi.spyOn(assetManager, 'loadBundle').mockImplementation((_url, _opts, cb: any) => {
      calls++;
      if (calls < 3) return cb(new Error('network'));
      return cb(null, { name: 'mochi-pet' } as any);
    });
    const bundle = await loadBundle('mochi-pet', {
      cdnPrefix: 'https://cdn.tamagochi.app',
      retry: { max: 3, baseMs: 1 },
    });
    expect(bundle.name).toBe('mochi-pet');
    expect(calls).toBe(3);
  });

  it('uses tenant slug in path', async () => {
    let capturedUrl: string | undefined;
    vi.spyOn(assetManager, 'loadBundle').mockImplementation((url, _opts, cb: any) => {
      capturedUrl = String(url);
      cb(null, { name: 'techcombank-theme' } as any);
    });
    await loadBundle('techcombank-theme', {
      cdnPrefix: 'https://cdn.tamagochi.app',
      tenantSlug: 'techcombank',
    });
    expect(capturedUrl).toBe('https://cdn.tamagochi.app/techcombank/techcombank-theme');
  });
});
```

---

## §6 — Implementation skeleton

```javascript
// apps/cocos/scripts/build-kids.mjs
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';

const platform = process.argv.includes('--platform=ios') ? 'ios' : 'web';

// 1) Inject the build-target flag into the bundle.
const settings = JSON.parse(readFileSync('settings/v2/packages/builder.json', 'utf8'));
settings.defines = { ...settings.defines, __BUILD_TARGET__: 'kids' };
settings.bundleIdentifier = 'world.cyberskill.tamagochi.kids';
settings.appName = 'Tamagochi Kids';
settings.analyticsEnabled = false;     // §1.16
writeFileSync('settings/v2/packages/builder.json', JSON.stringify(settings, null, 2));

// 2) Run Cocos headless build.
execSync(`./bin/CocosCreator --build target=${platform} --quit`, { stdio: 'inherit' });

// 3) Post-build: kids-binary inspection (TASK-LEGAL-003 §1.10).
execSync(`node ../scripts/legal/inspect-kids-binary.mjs build/${platform}`, { stdio: 'inherit' });

// 4) Bundle-budget assert.
if (platform === 'web') execSync('node scripts/assert-bundle-budget.mjs build/web-mobile', { stdio: 'inherit' });

console.log(`kids ${platform} build complete`);
```

---

## §7 — Dependencies

**External:**
- Cocos Creator 3.8.4 headless edition (Linux + macOS for CI).
- Node 20 LTS + pnpm 9.x.
- Xcode 15.3+ (iOS) on a macOS runner.
- Android SDK 34 + Gradle 8.5 (Linux runner OK).
- Fastlane 2.219+.
- Cloudflare R2 (web CDN target for TASK-B2B-001 theme bundles).

**Internal:** none (root infra task).

**Blocks:** TASK-INFRA-002, TASK-INFRA-003, TASK-ART-001 (Spine pipeline), TASK-PET-001 (pet entity needs Cocos node graph), TASK-AR-001 (AR plugin loads here), TASK-I18N-001, TASK-A11Y-001, TASK-B2B-001 (tenant bundle loader piggy-backs on §1.6).

---

## §8 — Example payloads

### 8.1 — `assert-bundle-budget` failure output

```text
$ node scripts/assert-bundle-budget.mjs build/web-mobile
TASK-INFRA-001 §1.5 — bundle-budget failures:
  build/web-mobile/assets/main/index.js (root): br=18234567 gz=21456789 > 15728640
exit 1
```

### 8.2 — Build-script settings.json mutation

```jsonc
{
  "bundleIdentifier": "world.cyberskill.tamagochi.kids",
  "appName": "Tamagochi Kids",
  "analyticsEnabled": false,
  "defines": { "__BUILD_TARGET__": "kids" }
}
```

### 8.3 — CI bundle-size PR comment

```markdown
### Cocos bundle-size diff (vs base)

| Bundle | Base | This PR | Δ |
|---|---:|---:|---:|
| root (br) | 12.3 MB | 12.8 MB | +0.5 MB |
| tenant-default (br) | 2.1 MB | 2.1 MB | 0 |
| pet-species/mochi (br) | 1.2 MB | 1.2 MB | 0 |

Status: PASS · root within 15 MB budget.
```

### 8.4 — `loadBundle` happy-path tenant-scoped call

```typescript
await loadBundle('petos-theme', {
  cdnPrefix: 'https://cdn.tamagochi.app',
  tenantSlug: 'techcombank',
  version: '2026-08-12-001',
});
// → GET https://cdn.tamagochi.app/techcombank/petos-theme?v=2026-08-12-001
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Cocos 3.8.x vs 3.9 if 3.9 releases mid-P0? → §1.1 — exact patch pin; upgrade is its own task.
- **OQ-2 (resolved):** Headless CI runner — managed or self-hosted? → §1.15 — either acceptable; managed Linux preferred for cost.
- **OQ-3 (resolved):** Cocos analytics — needed for vendor support? → §1.16 — no; disable + open vendor tickets manually if needed.
- **OQ-4 (resolved):** Source maps to Sentry — what about local dev? → §1.17 — `*.map` files emit locally; CI uploads to Sentry only.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Bundle budget exceeded after a designer adds a high-res texture | `assert-bundle-budget` CI check | PR blocked | Compress texture; re-PR; or escalate budget revision via task amendment |
| 2 | Cocos 3.8.x patch ships a breaking change in asset bundle JSON shape | CI build fails on regression suite | Build pipeline broken | Pin to prior patch; raise upgrade task; do not auto-upgrade |
| 3 | A marketplace plugin slips in as a `.zip` install | Vendoring-glob lint | PR blocked | Vendor the plugin source; check in LICENSE; retry PR |
| 4 | Build-target flag injection skipped — binary ships with default | Build script exits non-zero on missing flag | Submission blocked | Set flag; re-build |
| 5 | Source maps leak to CDN | Post-build glob assertion fails | Re-deploy blocked | Re-build with sourcemap target = sentry; redeploy |
| 6 | Reproducible build broken by a transitive dep adding wall-clock timestamps | `__tests__/reproducible-build.spec.ts` fails | CI blocked | Identify dep; patch via pin or apply normalisation in build script |
| 7 | Cocos 3.x → 4.x major upgrade lands and the ecosystem starts moving | Vendor watch + cocos.io changelog | Future technical debt | Author an upgrade task with regression test suite + rollback plan |
| 8 | Headless Cocos build fails on a CI runner OpenGL missing | CI step fails | Build pipeline broken | Add OpenGL ES + EGL to runner image per §1.15 recipe |
| 9 | Fastlane lane drifts (e.g. Xcode 16 breaks the build) | iOS build step fails | iOS submission blocked | Update Fastfile; pin Xcode version; ship hotfix |
| 10 | Cocos Editor extension fails to load → bundle-budget banner gone | Editor open with no banner | Designer-time check lost | Editor `--reset-extensions`; rebuild extension; CI catches as fallback |
| 11 | TypeScript `strict` flag flipped off by mistake in a PR | `__tests__/tsconfig.spec.ts` fails | PR blocked | Restore strict mode; re-PR |
| 12 | A Cocos plugin marketplace package gets compromised mid-version | Vendoring forces a manual review | Supply-chain risk | Diff vendored source vs new release; only update after review |

---

## §11 — Notes

**Plan refs:** plan §PART 4 — Cocos Creator vs Unity vs Phaser reasoning; 5–15 MB bundle budget; TypeScript advantage for CyberSkill consultancy team ramping; Spine + Lottie + Howler.js pipeline.

**Sub-decisions punted to ops:**
- Specific Xcode version pin (15.3 vs 15.4) — locked in `Fastfile` annex.
- Android Gradle Plugin version (8.2 vs 8.3) — locked in `gradle.properties`.
- Self-hosted vs GitHub-managed runners — bench during P0 implementation.

**Anti-patterns explicitly forbidden:**
- `^3.8` or `~3.8` Cocos version range — pin exact patch only.
- `any` outside `_legacy/` — strict TS enforced.
- Marketplace `.zip` plugin install — vendoring only.
- `analyticsEnabled: true` in builder.json — never (per TASK-LEGAL-001).
- Source maps on public CDN — Sentry only.

**Cross-reference:** This task is the substrate every visual / gameplay task builds on. Without it pinned, every later task sits on a moving target.
