# Tamagochi — Feature-Request Authoring Workflow

**Owner:** Stephen Cheng (Founder, CyberSkill)
**Status:** v1.0.0 — adopted 2026-05-17 with the initial 51-FR phase-based batch
**Use when:** authoring a new feature request before any code lands.

This document is the canonical playbook for tamagochi. Every FR that ships into the consumer game or the PetOS B2B engine starts here. The workflow is **self-contained inside this project** — it does not depend on any sibling project's documents.

---

## §1 — The mental model

One FR = one atomic, testable, normative requirement. Smaller is better.

- **Atomic** — covers exactly one capability. If you can't test it independently with a single integration test, it's two FRs.
- **Testable** — the FR has a verification method (unit / integration / chaos / manual / play-test) and an acceptance signal.
- **Normative** — uses BCP-14 keywords (`MUST` / `SHOULD` / `COULD` / `MAY`) and is precise enough that two engineers reading it write the same code.

One FR → one task → (eventually) one PR.

---

## §2 — File layout

```
tamagochi/
├── AGENTS.md                              ← project-local BRAIN protocol (root)
├── CLAUDE.md                              ← @AGENTS.md pointer
└── docs/
    ├── Tamagotchi-Style Virtual Pet Game - Strategic Implementation Plan.md  ← source plan
    └── feature-requests/                  ← single source of truth for live FRs
        ├── AUTHORING.md                   ← this file
        ├── BACKLOG.md                     ← phase-by-phase index
        ├── MANIFEST.json                  ← state file (per-module FR counters)
        ├── SESSION_PROGRESS.md            ← per-session authoring trace
        ├── legal/                         ← one folder per module
        │   ├── FR-LEGAL-001-coppa-pdpl-baseline.md
        │   ├── FR-LEGAL-001-coppa-pdpl-baseline.audit.md
        │   └── ...
        ├── infra/  auth/  obs/
        ├── pet/    care/  ai/    ar/  viral/
        ├── social/ econ/  sub/   ads/ art/
        ├── i18n/   a11y/  b2b/
```

| Convention | Value |
|---|---|
| FR-ID format | `FR-{MOD}-{NNN}` where `{MOD}` is from the closed catalogue (§2.1) and `{NNN}` is zero-padded three digits, dense within the module (001, 002, 003 — never skip) |
| Filename | `FR-{MOD}-{NNN}-{slug}.md` where slug is kebab-case, ≤ 50 chars |
| Per-module folder | lowercase module code (`legal/`, `infra/`, `pet/`, etc.) |
| Status states | `draft` → `audited` → `accepted` → `building` → `shipped` (or `deferred` / `rejected` / `superseded`) |

### §2.1 — Closed module catalogue (17 modules)

| Code | Folder | Scope |
|---|---|---|
| **LEGAL** | `legal/` | COPPA-2025 / GDPR-K / Vietnam PDPL / loot-box / Apple Kids / Bandai IP / DPIA / Safe Harbor |
| **INFRA** | `infra/` | Cocos Creator client + Colyseus stateful real-time + Supabase metagame + Cloudflare/AWS hosting |
| **AUTH** | `auth/` | Apple / Google / Zalo sign-in + under-13 invite-code + parental consent gate |
| **OBS** | `obs/` | GameAnalytics + Mixpanel/Amplitude + AppsFlyer + Sentry + Better Stack |
| **PET** | `pet/` | Pet entity, species, evolution, stat-bar model, multi-pet inventory, breeding, permadeath-lite |
| **CARE** | `care/` | Feed / clean / hug / mini-game framework / streaks / haptics |
| **AI** | `ai/` | LLM pet personality (Claude Haiku / Gemini Flash) + content safety + persona schema |
| **AR** | `ar/` | ARKit / ARCore Bedroom Cam placement + AR export pipeline |
| **VIRAL** | `viral/` | TikTok-native export + Daily Drama + generative pet + battle pass + push |
| **SOCIAL** | `social/` | Friends graph + PetPair co-parent + trade window + Pet Wedding |
| **ECON** | `econ/` | Currency ledger + IAP catalogue + UGC Pet Couture rev-share |
| **SUB** | `sub/` | Pet+ subscription + Family tier + entitlement service |
| **ADS** | `ads/` | Rewarded video (LevelPlay/AppLovin MAX) + SuperAwesome kWS kid gate |
| **ART** | `art/` | Spine 2D pipeline + Lottie UI micro-anim + audio (Howler.js) + asset budget |
| **I18N** | `i18n/` | 9-language localization (EN, VI, ID, TH, PT-BR, ES-LATAM, JA, KO, ZH-Hant) + diacritics + Crowdin |
| **A11Y** | `a11y/` | WCAG-AA contrast + reduced-motion + colour-blind palette + dyslexia font + screen-reader labels |
| **B2B** | `b2b/` | PetOS white-label multi-tenant engine + tenant theming + PetOS console + bank/telco reference integrations |

---

## §3 — Authoring procedure (manual, MVP)

For each new FR:

1. Identify the module from §2.1's closed catalogue. Add a new entry to `BACKLOG.md` in the appropriate phase + module section.
2. Increment `MANIFEST.json` → `last_fr_id_per_module.<MODULE>`.
3. Create the markdown file in `docs/feature-requests/<module>/FR-<MOD>-<NNN>-<slug>.md` with the frontmatter (§6) and the 11 body sections (§4).
4. **Two-round audit** per §5. Both rounds documented in the corresponding `.audit.md` file using the engineering-spec template (§5.2).
5. **Loop revise + re-audit** until `score_post_revision_2: 10/10` (§12 Master Rule).
6. When all issues are resolved, set `status: accepted` in the FR frontmatter.
7. Create a corresponding task (Cowork TaskCreate or TASKS.md) referencing the FR-ID.
8. Build (one FR per PR). On merge, set `status: shipped` and `shipped: <date>` in the FR frontmatter.

---

## §4 — FR body shape (11 mandatory sections)

```markdown
---
{frontmatter — see §6}
---

## §1 — Description (BCP-14 normative)
Numbered clauses with MUST / SHOULD / COULD / MAY. Each clause is independently testable.

## §2 — Why this design
Rationale per non-obvious decision. Cite the source plan section number when applicable
(e.g. "Plan §C8 — Cocos Creator 3.x reasoning").

## §3 — API contract & code shape
HTTP, GraphQL, function signatures, DB schema, Colyseus room handlers, Cocos component
signatures, native bridge stubs. Implementable.

## §4 — Acceptance criteria
Numbered, observable, automatable. One AC ≈ one test case.

## §5 — Verification
Test code in TypeScript (Jest/Vitest/Playwright/Cocos test harness). Concrete fixtures.

## §6 — Implementation skeleton
The 30–60 lines an engineer would actually write. Compilable.

## §7 — Dependencies
External (vendor, env, infra, App Store / Play Store / Zalo entitlements). Internal (FR-IDs).

## §8 — Example payloads
Sample requests / responses / DB rows / log lines / Colyseus room state diffs.

## §9 — Open questions
Either resolved at authoring time (recommended for 10/10) OR explicitly deferred to a
P-N re-batch.

## §10 — Failure modes inventory
Table of (Failure | Detection | Outcome | Recovery). ≥ 10 rows for full FRs, ≥ 8 for stubs.

## §11 — Notes
Anything not normative but useful — historical context, related plan refs, sub-decisions
punted to ops, regulator citations, vendor pricing snapshots.
```

---

## §5 — Audit procedure

### §5.1 — Two rounds, always

- **Round 1:** find structural issues (missing sections, ambiguous BCP-14 clauses, security gaps, observability holes, regulator gaps). Document each issue with `severity ∈ {error, warning, info}` and `rule_id`.
- **Round 2:** find subtler issues (concurrency races, edge cases, drift catchers, CI gates, anti-cheat gaps, server-authoritative blind spots).

The starting score is typically 7.5–8.5; round-1 brings it to 9.0–9.5; round-2 closes to 10/10.

### §5.2 — Engineering-spec audit template (v1)

```markdown
---
fr_id: FR-<MOD>-<NNN>
audited: <ISO date>
auditor: manual (engineering-spec template v1)
verdict: PASS | PASS_WITH_REVISIONS | FAIL
score_pre_revision: X.X/10
score_post_revision_1: X.X/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: N
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary
1–2 paragraphs: starting state, key issues, resolution.

## §2 — Round-1 findings (resolved)
- ISS-001 (severity) Title — RESOLVED §X.Y + AC<n>.
- ISS-002 ...

## §3 — Round-2 findings (resolved)
- ISS-00N (severity) Title — RESOLVED ...

## §4 — Strengths preserved
Bullet list of what stays.

## §5 — Resolution
Final score + ship verdict.
```

### §5.3 — Severity codes

- **error** — would break correctness, security, regulator compliance, or production. Must resolve before accept.
- **warning** — would degrade UX or operability. Should resolve before accept; deferral requires explicit note.
- **info** — nice-to-have refinement. Resolution recommended but not blocking.

### §5.4 — 10/10 criteria

An FR scores 10/10 only when:

- All §1 clauses are BCP-14 normative.
- §2 explains every non-obvious decision (no "because I felt like it").
- §3 contract compiles or is directly translatable to compilable code.
- Each §4 AC is independently testable.
- §5 contains code, not prose.
- §6 skeleton is ≤ 60 lines and runs against §7 deps.
- §9 has zero open questions, OR each open one is explicitly punted to a named future FR.
- §10 enumerates ≥ 10 failure modes (≥ 8 for sanctioned stubs) with concrete detection + recovery columns.
- Round-1 + Round-2 audit files exist with 0 issues_open and 0 issues_critical.
- For under-13-touching FRs: explicit COPPA-2025 + Safe Harbor + parental-consent surfaces are documented.

---

## §6 — Frontmatter schema

Required on every FR:

```yaml
---
id: FR-<MOD>-<NNN>                          # e.g., FR-LEGAL-001
title: "<short imperative title>"
module: <MOD>                                # closed enum from §2.1 table
priority: MUST | SHOULD | COULD | MAY        # BCP-14
status: draft | audited | accepted | building | shipped | deferred | rejected
verify: T | I | A | D                        # Test | Inspection | Analysis | Demonstration
phase: P0 | P1 | P2 | P3 | P4
milestone: "<phase short label>"
slice: 1                                     # which slice within the module
owner: <person or role>
created: <ISO date>
related_frs: [FR-IDs]                        # cross-references
depends_on: [FR-IDs]                         # must be shipped before this can build
blocks: [FR-IDs]
effort_hours: <integer>
new_files:                                   # files this FR creates
  - <path>
modified_files:                              # files this FR edits
  - <path>
allowed_tools:                               # what the implementer may use
  - <tool>
disallowed_tools:                            # what's banned (with reason in §2 if needed)
  - <tool>
risk_if_skipped: "<one sentence>"
audience_age_gate: "any" | "13+" | "under-13"   # tamagochi-specific — drives COPPA gates
---
```

---

## §7 — Status lifecycle

```
draft
  ↓ (round 1 audit complete)
audited (round-1 verdict in .audit.md)
  ↓ (round 2 audit reaches 10/10)
accepted (status: accepted in FR frontmatter)
  ↓ (engineer picks up task, opens branch)
building
  ↓ (PR merges fulfilling AC4 fully)
shipped (status: shipped; shipped: <date> added)
```

Alternate terminal states: `deferred` (parked), `rejected`, `superseded` (replaced by newer FR via `superseded_by:`).

---

## §8 — Task integration

Two persistence paths:

### Path A — Cowork TaskCreate

In a Cowork session, the task list lives in the session UI; one task per FR.

### Path B — TASKS.md (project-local)

For long-running work, append to `TASKS.md` at the tamagochi project root:

```markdown
## LEGAL module · slice 1

- [ ] FR-LEGAL-001 — COPPA-2025 + PDPL VN baseline  ·  status: accepted  ·  est: 12h
- [ ] FR-LEGAL-002 — Loot-box-free / deterministic-only policy  ·  status: accepted  ·  est: 6h
- [ ] FR-LEGAL-003 — Apple Kids / Google Play Families  ·  status: accepted  ·  est: 5h
```

---

## §9 — Phase capability gates (not time-based)

Per the user directive of 2026-05-17, tamagochi phases are **capability gates**, not time windows:

| Phase | Capability gate | Exit signal |
|---|---|---|
| **P0 — Foundation Gate** | Legal entity + DPO + COPPA-2025/PDPL compliance baseline; Cocos+Colyseus+Supabase scaffold; Apple/Google/Zalo auth; observability baseline | All P0 FRs at status `shipped`, DPIA filed, A05 notification template wired |
| **P1 — Core Pet MVP** | One pet species hatch → feed/clean/hug → AI personality → AR placement → TikTok export; ethical streak system | 500 closed-beta testers playing; D7 retention ≥ 18% in beta cohort |
| **P2 — Social & Multi-Pet** | 5 species + breeding + co-parent (PetPair) + trade window + friend graph + Daily Drama + generative-at-adoption pet | k-factor ≥ 0.4; D30 ≥ 7%; trade scam-rate < 0.5% |
| **P3 — Monetization & Live-Ops** | IAP cosmetics + Pet+ subscription + Family tier + rewarded video + battle pass + push | Sub conversion ≥ 3%; ARPDAU ≥ $0.05; no loot-box-related regulator complaints |
| **P4 — Scale & PetOS B2B** | 9-language localization; full A11Y pass; AI personality v2; multi-tenant PetOS engine + 2 reference tenants (one bank, one telco) | 2 anchor B2B tenants signed contracts; $1M+ B2B ARR pipeline; consumer game in top-10 casual in 3+ countries |

**No phase has a calendar date attached** — phases ship when their capability gate's exit signal is met.

---

## §10 — Re-batching for later phases

Each later phase MAY be re-batched after the previous phase's exit signal is observed, OR if a Risk Matrix row triggers (regulator action, Apple/Google policy shift, store rejection, anti-cheat exploit, etc.).

Re-batch process: write a slice brief for the affected modules → manually re-author or extend FRs per §5 → push to `BACKLOG.md`.

---

## §11 — Drift catchers (CI gates)

Mechanical enforcement that the workflow is followed:

| Check | Rule | Surface |
|---|---|---|
| FR-ID density | no skips within a module (001, 002, 003, …) | `pnpm fr:check` (P0 deliverable) |
| Frontmatter required fields | all of §6 present | `pnpm fr:check` |
| Audit file exists | every `FR-*.md` has matching `*.audit.md` | `pnpm fr:check` |
| 10/10 before accepted | `status: accepted` requires `score_post_revision_2: 10/10` in audit | `pnpm fr:check` |
| BCP-14 keywords | each §1 clause has at least one MUST/SHOULD/MAY/COULD | `pnpm fr:check` |
| Manifest sync | `last_fr_id_per_module.<MOD>` matches highest FR-ID in folder | `pnpm fr:check` |
| Effort hours populated | every FR has `effort_hours: <integer>` (≥ 1) | `pnpm fr:check` |
| Audit ≥ 6 issues | every audit's `issues_resolved` is ≥ 6 (round-1 + round-2 combined) | `pnpm fr:check` |
| Failure modes ≥ 10 | every FR's §10 table has ≥ 10 rows (≥ 8 for sanctioned stubs) | `pnpm fr:check` |
| YAML-safe frontmatter | no unquoted `#` inside flow-array values or unquoted scalars | `pnpm fr:check` |
| `audience_age_gate` set | every FR declares an age gate | `pnpm fr:check` |
| Under-13 FRs cite COPPA gates | when `audience_age_gate ∈ {"under-13"}`, FR §1 cites Safe Harbor surfaces | `pnpm fr:check` |

(`pnpm fr:check` script will live at the repo root in `scripts/fr-check.mjs` once the Cocos workspace is scaffolded under P0.)

---

## §12 — Loop-to-10/10 master rule (load-bearing)

This rule is normative for every author and supersedes every other guidance below.

> **After creating one FR, loop audit rounds on it until it reaches *perfect* — before starting the next FR.**

### What "perfect" means

Perfect = **highly detailed** AND **perfectly matched to core requirements** AND **complete** AND **no truncation**.

- **Highly detailed**: every architectural decision is named, every contract surface is enumerated, every failure mode is listed.
- **Perfectly matched to core requirements**: the spec covers what the FR is *for* — no scope creep, no scope under-coverage. The §1 normative clauses fully express the contract that downstream FRs and engineers depend on.
- **Complete**: all 11 sections present and substantive. No `(elided)`, no `(see other FR)` cross-references that hide the contract.
- **No truncation**: no "summary form," no "compact form due to context budget," no "abridged for brevity." If the author runs into a budget limit, the right action is to **stop, save state, and resume later** — never to ship a truncated FR.

### The Loop

1. **First-pass author** the FR per the 11-section template (§4 above).
2. **Author the audit file** at `<spec-stem>.audit.md` — find at least **6 ISS findings**; score the spec honestly.
3. **If `score_post_revision_2 < 10/10`**: revise the FR addressing every finding.
4. **Re-audit** the revised spec.
5. **Repeat** steps 3-4 until `score_post_revision_2: 10/10`.
6. **Only then** start the next FR.

### Two sanctioned exceptions to the size target

Both must be explicit in the FR title AND the audit file:

1. **Stub FRs.** An FR whose explicit purpose is to reserve an API namespace / route prefix / job-queue tag / Cocos scene slot for a later phase. The stub MUST fully spec the no-op behavior. Acceptable ≤ 300 lines.
2. **Pure-infrastructure / Terraform / config FRs.** Where the contract surface is small. Acceptable ≤ 400 lines.

Neither exception authorises *truncation* — both still require all 11 sections, just at smaller scale.

### Spec-depth calibration

- **Target 400–700 lines** per substantive FR.
- Below 300 (excluding sanctioned stubs/infra above) suggests under-specification.
- Above 1,000 suggests prose padding that obscures the spec.

### §12.1 — Autonomous march (no asking between FRs)

When the user has triggered an FR-authoring run (e.g. "create backlog + FRs"), the agent SHALL drain the frontier autonomously: complete one FR to 10/10, then start the next immediately without asking the user. Stop only on:

- a hard decision the user has not authorised (e.g. closed-catalogue extension);
- a context/output budget limit (in which case save SESSION_PROGRESS.md and surface the resume token);
- reaching the end of the planned phase batch.

---

## §13 — Frontmatter YAML hygiene (hard rules)

These rules prevent silent data loss when parsers consume the FR frontmatter:

1. **No unquoted `#` inside frontmatter values.** YAML treats unquoted `#` after whitespace as a comment marker. Quote values containing `#`.
2. **No trailing `#` comments on value lines.** Use standalone comment lines above the field instead.
3. **`depends_on` and `blocks` MUST be reciprocal.** If FR-X has `depends_on: [FR-Y]`, FR-Y MUST list FR-X in `blocks`.
4. **Placeholder FR references** in `depends_on:` / `blocks:` MUST carry an inline comment `# placeholder — not yet specified` so coherence sweeps know to skip them.

---

## §14 — Audit-file hard floor

Per the master rule (§12), every audit file MUST:

1. Have a matching `<spec-stem>.audit.md` companion file for the FR.
2. Report `score_post_revision_2: 10/10` as the only acceptable shipping score.
3. Enumerate ≥ **6 ISS findings** total across round-1 and round-2 (`issues_resolved: ≥ 6` in frontmatter).
4. Cite the resolution location for every ISS finding (§N #M reference, AC reference, or §10 row reference).
5. Never delete an audit when superseding a spec — append a new audit row.

A `score_post_revision_2: 10/10` without ≥ 6 resolved issues is a red flag — the author didn't pressure-test the spec enough.

---

*End of workflow. Keep this file open while authoring.*
