---
fr_id: TASK-ART-001
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.4/10
score_post_revision_1: 9.5/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

Starting 8.4/10 — a tight pet-art-pipeline spec covering Spine 2D engine pin, 20-animation contract, root/skin/slot taxonomy, atlas + texture budgets, per-pet bundle budget, Cocos Editor linter + CLI mirror, typed `SpineLoader` wrapper, Lottie UI micro-animation, Howler audio mixer + bus model, kids-SKU mute-default, audio license ledger, haptics adapter with A11Y respect, tenant skin override that cannot violate the contract, performance budget on the VN 1 GB baseline. Round-1 surfaced two structural gaps (animation length cap, A11Y reduce-motion compat). Round-2 found four refinements (audio license enforcement in CI, Lottie size budget enforcement, tenant override scope, performance test reproducibility on emulator).

## §2 — Round-1 findings (resolved)

- **ISS-001 (warning) Animation length cap missing.** Round-1 noted §1.2 listed 20 animations but did not cap duration. An artist could ship a 30-second `idle_adult` that breaks the bundle budget. **RESOLVED §1.7(d) + §3.3** — `idle_*` capped at 8 s, all others at 5 s; CLI validator enforces.

- **ISS-002 (warning) A11Y reduce-motion not in contract.** Round-1 noted §1.13 mentioned haptics A11Y but did not specify what `playContractAnimation` does under reduce-motion. **RESOLVED §1.18 + AC13** — fade replaces evolution morph cuts; idle loop frequency capped; particles skipped; contract still runs (no animation removed).

## §3 — Round-2 findings (resolved)

- **ISS-003 (error) Audio license enforcement.** Round-2 noted §1.12 required a license ledger but did not wire it to CI. **RESOLVED AC14** — `pnpm legal:check` diffs ledger against committed `*.m4a` files; CC-BY-NC and unlicensed assets rejected.

- **ISS-004 (warning) Lottie budget enforcement.** Round-2 noted §1.9 set Lottie file size limits but no AC asserted them. **RESOLVED AC9** — `pnpm art:check-lottie-budgets` script asserts ≤ 50 KB JSON per file.

- **ISS-005 (warning) Tenant override could remove contract animations.** Round-2 noted §1.17 allowed tenant skin overrides but did not prevent a tenant from defining a skin missing a slot. **RESOLVED §10 row 9** — linter runs on tenant manifest at upload time; rejects non-compliant overrides.

- **ISS-006 (info) Performance test reproducibility.** Round-2 noted AC11 ran on a 1 GB Android emulator but did not pin the emulator profile. **RESOLVED §10 row 10** — Cocos Test Player profile + emulator config locked in `docs/art/perf-test-runner-recipe.md` (deferred deliverable; AC remains tied to the recipe once authored).

## §4 — Strengths preserved

- 20-animation contract is the single load-bearing decision that prevents per-species drift.
- TypeScript union type for `AnimationContractName` makes consumer typos a compile error.
- Slot taxonomy excludes `body`/`face` from cosmetic swap — pet identity is preserved.
- Spine skin mechanism for evolution stages = bandwidth-cheap runtime swap.
- Deterministic texture compression via `oxipng -o4` aligns with TASK-INFRA-001 §1.13 reproducible builds.
- Cocos Editor extension + CLI mirror = catches violations at design time AND in CI.
- Howler.js audio with per-bus volume + kids-SKU mute-default is plan-faithful (§PART 5).
- HapticsAdapter respects A11Y (reduce-motion + OS haptics-off setting).
- Tenant skin override exists for B2B (TASK-B2B-001) but cannot break the contract — a clean extension point.
- Audio license ledger + CI enforcement keeps the project safe from rogue CC-BY-NC commits.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-ART-001 is the visual-foundation task — without it, TASK-PET-001 (pet entity) has nothing renderable and TASK-CARE-001/002/003 have no animation hooks. Next task on resume is TASK-PET-001.
