---
id: FR-LEGAL-002
title: "Loot-box-free / deterministic-only randomisation policy (Belgium / NL / EU posture)"
module: LEGAL
priority: MUST
status: done
verify: I
phase: P0
milestone: "Foundation Gate"
slice: 1
owner: "Founder + retained legal counsel"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-LEGAL-001, FR-LEGAL-003, FR-PET-006, FR-PET-007, FR-PET-008, FR-ECON-001, FR-ECON-002, FR-SUB-001, FR-VIRAL-004]
depends_on: [FR-LEGAL-001]
blocks: [FR-PET-006, FR-PET-008, FR-ECON-002, FR-VIRAL-004]
effort_hours: 6
new_files:
  - "docs/legal/randomisation-disclosure-policy.md"
  - "docs/legal/drop-rates-public.json"
  - "apps/api/src/legal/randomisation-disclosure.guard.ts"
  - "apps/api/src/legal/__tests__/randomisation-disclosure.spec.ts"
  - "eslint-rules/no-real-money-random-pull.cjs"
  - "scripts/legal/lint-iap-catalogue-against-loot-box-rules.mjs"
modified_files:
  - "package.json"
  - "apps/api/src/legal/legal.module.ts"
allowed_tools:
  - "ESLint custom rule (`no-real-money-random-pull`)"
  - "Supabase Postgres (drop-rate audit log)"
disallowed_tools:
  - "Any randomisation function whose input chain begins at an Apple/Google IAP receipt OR a credit-card charge"
  - "Server-side `Math.random()` for outcomes affecting monetised inventory (must use seeded deterministic-purchase + crypto RNG only for earned-currency surprise rolls, with drop-rates disclosed)"
risk_if_skipped: "Belgium 2018 ban, NL Antwerp 2025 ruling, EU Digital Fairness Act draft (late-2025/early-2026), and HoYoverse $20M FTC settlement Jan 2025 collectively make real-money loot boxes commercially non-viable for kid-skewing apps; non-compliance = country-by-country app removal."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Real-money randomised pulls forbidden.** Tamagochi MUST NOT contain any commercial transaction whose outcome is determined by a random function AND whose payment originates from a real-money source (Apple IAP / Google IAP / credit card / MoMo / ZaloPay / VNPay / ViettelPay / Stripe / Paddle / any future PSP). This applies to: pet species pulls, outfit pulls, room-decor pulls, evolution-trait pulls, breeding outcomes, surprise-egg openings, gift-box openings, banner-summons. **If money is exchanged, the outcome MUST be predetermined and disclosed before purchase.**

§1.2  **Earned-currency randomisation allowed with disclosure.** Randomised outcomes are permitted when the input currency is **earned soft-currency only** (Coins from mini-games / daily login / streak rewards / friend gifting). All such randomised outcomes MUST publish their drop rates at `https://tamagochi.app/legal/drop-rates` and in a `docs/legal/drop-rates-public.json` file committed to git. Drop rates MUST be updated whenever a new randomised mechanic ships, with the update version bumped in the JSON.

§1.3  **Drop-rate disclosure surfaces.** Every UI surface that initiates a randomised outcome MUST: (a) display the headline drop rates inline (e.g. "Common 70% · Rare 20% · Epic 7% · Mythic 2.5% · Legendary 0.5%"); (b) link to the full per-item table; (c) emit an analytics event `randomisation.disclosure.shown` with the drop-rate version. This is mandatory regardless of the randomisation input currency.

§1.4  **Outcome receipt.** After every randomised event, the player MUST receive a signed outcome receipt persisted server-side with: `event_id, player_id, mechanic_id, drop_rate_version, rolled_outcome, rolled_at, server_seed_hash`. The receipt is retained 7 years to satisfy Belgium / NL audit trail expectations and is exposed to the player via `GET /v1/me/randomisation-history`.

§1.5  **Pet rescue MUST NOT cost real money.** Per FR-PET-008 (Permadeath-Lite), a pet that has "moved to grandma's house" MUST be rescuable via a free daily-ritual path only. No real-money revival, no real-money cooldown skip, no real-money rescue accelerator. (HoYoverse $20M FTC settlement is the cited precedent.)

§1.6  **Breeding MUST be deterministic given inputs.** Per FR-PET-007 (Breeding), the offspring trait inheritance MUST be a pure function of the two parent pets' palette + stat bias + a server-side seed deterministically derived from the parent ids. The function MUST be auditable post-hoc by replaying the inputs. Breeding MUST NOT consume real-money currency.

§1.7  **Battle pass MUST be linear / disclosed.** Per FR-VIRAL-004, every tier reward MUST be deterministically known at purchase time. A "mystery tier" reward shape is forbidden.

§1.8  **No "loot box adjacent" mechanics.** The following adjacent mechanics are also forbidden in monetised form: progress bars whose final reward is randomised; "sticker collection" mechanics whose completion reward is unknown at purchase; "wheel of fortune" mechanics paid for in real money. (NL Antwerp 2025 ruling treated these as substantively equivalent to loot boxes.)

§1.9  **Drop-rate honesty.** The published drop rates MUST equal the actual implementation drop rates within ±0.5 absolute percentage points. A daily reconciliation job MUST audit the prior 24h of randomisation outcomes against the declared rates and alert on deviation. Configuration MUST live in `apps/api/src/legal/drop-rate-config.ts` as a single source of truth that both the runtime AND the public JSON consume.

§1.10  **ESLint enforcement.** A custom ESLint rule `no-real-money-random-pull` at `eslint-rules/no-real-money-random-pull.cjs` MUST flag any code path that combines an IAP receipt object with a randomisation function in the same call graph. The rule MUST run on every PR via the existing `pnpm lint` script.

§1.11  **IAP catalogue lint.** A script `scripts/legal/lint-iap-catalogue-against-loot-box-rules.mjs` MUST inspect the IAP catalogue (FR-ECON-002 deliverable) and reject any product whose `outcome_type` field is anything other than `deterministic`.

§1.12  **Regulator-jurisdiction safe-mode.** When a user's region-of-record (FR-LEGAL-001 §1.11) resolves to Belgium OR the Netherlands, the runtime MUST additionally hide any UI surface marketing a randomised mechanic, even an earned-currency one, until legal counsel confirms the regional posture for that mechanic. (This is conservative — earned-currency randomisation is generally legal in BE/NL, but the marketing-surface hide blocks accidental ToS issues.)

§1.13  **Drop-rate API.** A `GET /v1/legal/drop-rates` HTTP endpoint MUST return the canonical JSON, signed with a server-side HMAC for tamper-evidence. The endpoint MUST be unauthenticated (regulator-accessible).

§1.14  **Annual review trigger.** This FR's policy MUST be re-evaluated whenever any of: (a) a new EU member-state issues guidance on loot boxes; (b) EU Digital Fairness Act passes parliament; (c) a new app store category emerges requiring deeper disclosure; (d) a competitor receives a regulator action — using the same trigger mechanism as FR-LEGAL-001 §1.14.

---

## §2 — Why this design

**Why this is opinionated and absolute.** The plan (§PART 8) treats real-money loot boxes as "no longer commercially viable for kid-skewing apps." The market evidence is unambiguous: Belgium's 2018 ban remains in force; the Antwerp court 2025 ruling clarified that real-money loot boxes offering in-game advancement are unlawful under existing gambling law; the EU Digital Fairness Act draft from late 2025 / early 2026 is expected to ban paid loot boxes EU-wide; HoYoverse paid $20M to the FTC in January 2025 partially over loot-box disclosure failures. A 12-month-old indie startup cannot afford to be on the wrong side of these. The "no real-money randomisation" rule is the cheapest insurance policy available — it costs revenue (Pou-style gacha would convert higher) but it costs zero in legal risk.

**Why earned-currency randomisation is allowed.** Belgium, NL, and the EU all distinguish between "money exchanged → random outcome" and "in-game effort exchanged → random outcome." The latter has never been classified as gambling by any major regulator. Allowing earned-currency surprise mechanics preserves the "discovery" pleasure that makes the Tamagotchi Paradise zoom-dial ecosystem fun, without crossing the regulator line.

**Why disclosure even for earned-currency.** Apple's App Store guideline 3.1.1 and Google Play's Real-Money Gambling and Games policy both require drop-rate disclosure for loot-box-style mechanics regardless of whether the input currency is paid or earned. Pre-emptive compliance avoids a store-review pingback.

**Why a 7-year receipt retention.** Belgium's audit-trail expectation under the Kansspelcommissie (Gaming Commission) framework cites 7-year retention for licensed gaming operators. Tamagochi is not licensed, but matching this retention preempts any "missing audit trail" objection.

**Why ESLint enforcement and not just policy.** A policy lives in markdown; an ESLint rule lives in CI. The rule is the only mechanism that survives team turnover.

**Why ±0.5% deviation tolerance.** Sample-size noise on small numbers of pulls per day produces natural deviation; 0.5% is wider than that noise floor while still being narrow enough to catch a real implementation drift.

**Why explicit BE/NL safe mode.** Even though earned-currency randomisation is legal there, marketing creative that mentions "rare drop chance" can trip ToS reviews under stricter advertising rules. The hide-marketing-surface mitigation is conservative but cheap.

**Why no breeding RNG of any kind.** Breeding determinism per §1.6 is a stronger constraint than legally necessary — but it serves two purposes: (1) it makes parents recoverable post-hoc for support tickets ("my egg gave the wrong color"), (2) it aligns with the plan's "ethical mechanics" tagline. Trait inheritance becomes a published palette XOR + stat-bias function published in FR-PET-007.

---

## §3 — API contract & code shape

### 3.1 — Drop-rates public JSON shape

```jsonc
// docs/legal/drop-rates-public.json
{
  "version": "2026-05-17-001",
  "signed_at": "2026-05-17T09:00:00Z",
  "mechanics": [
    {
      "id": "daily-surprise-egg",
      "input_currency": "coins",
      "input_cost": 500,
      "outcomes": [
        { "rarity": "common",    "weight": 0.700, "items": ["mochi-skin-a", "mochi-skin-b"] },
        { "rarity": "rare",      "weight": 0.200, "items": ["pengu-skin-a"] },
        { "rarity": "epic",      "weight": 0.070, "items": ["bao-skin-a"] },
        { "rarity": "mythic",    "weight": 0.025, "items": ["fluffit-skin-a"] },
        { "rarity": "legendary", "weight": 0.005, "items": ["tako-skin-a"] }
      ]
    }
  ]
}
```

### 3.2 — Randomisation disclosure guard (Nest)

```typescript
// apps/api/src/legal/randomisation-disclosure.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RandomisationDisclosureGuard implements CanActivate {
  constructor(private readonly cfg: DropRateConfigService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const mechanicId = (req as any).params?.mechanicId;
    const cfg = this.cfg.byMechanic(mechanicId);
    if (!cfg) throw new Error(`randomisation mechanic not declared in drop-rate-config: ${mechanicId}`);
    if (cfg.input_currency !== 'coins') {
      throw new Error(`mechanic ${mechanicId} input_currency must be 'coins' (earned), got '${cfg.input_currency}'`);
    }
    if (!(req as any).disclosureShownEventId) {
      throw new Error('disclosure not shown before randomisation invocation (FR-LEGAL-002 §1.3)');
    }
    return true;
  }
}
```

### 3.3 — Signed drop-rate endpoint

```typescript
// apps/api/src/legal/drop-rate.controller.ts
@Controller('v1/legal/drop-rates')
export class DropRateController {
  constructor(private readonly svc: DropRateConfigService) {}

  @Get()
  publicCanonical(): { json: object; hmac: string } {
    const json = this.svc.canonical();
    const hmac = createHmac('sha256', process.env.DROP_RATE_HMAC_KEY!).update(JSON.stringify(json)).digest('hex');
    return { json, hmac };
  }
}
```

### 3.4 — Receipt schema (Postgres)

```sql
create table randomisation_receipts (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null,
  mechanic_id   text not null,
  drop_rate_version text not null,
  rolled_outcome text not null,
  rolled_at     timestamptz not null default now(),
  server_seed_hash text not null,
  retain_until  timestamptz not null
);
create index on randomisation_receipts (player_id, rolled_at desc);

-- Retention 7 years.
create or replace function set_retention() returns trigger as $$
begin
  new.retain_until := new.rolled_at + interval '7 years';
  return new;
end;
$$ language plpgsql;
create trigger trg_retain before insert on randomisation_receipts
  for each row execute procedure set_retention();
```

### 3.5 — ESLint rule shape

```javascript
// eslint-rules/no-real-money-random-pull.cjs
'use strict';
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'forbid randomisation in a call graph that includes an IAP receipt' },
    messages: {
      forbidden: 'FR-LEGAL-002 §1.10 — randomisation function called in a path that includes an IAP receipt; loot-box-adjacent code is not allowed.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = context.getSourceCode().getText(node.callee);
        const isRandom = /\b(Math\.random|crypto\.randomInt|seededRandom)\b/.test(callee);
        if (!isRandom) return;
        // Walk the scope chain for an `iapReceipt` or `purchaseToken` binding.
        let scope = context.getScope();
        while (scope) {
          if (scope.variables.some(v => /iapReceipt|purchaseToken|orderToken/.test(v.name))) {
            context.report({ node, messageId: 'forbidden' });
            return;
          }
          scope = scope.upper;
        }
      },
    };
  },
};
```

---

## §4 — Acceptance criteria

**AC1.** `pnpm lint` fails on a deliberate test fixture that combines `iapReceipt` and `Math.random()` in the same function. Verified by `eslint-rules/__tests__/no-real-money-random-pull.spec.cjs` fixture suite.

**AC2.** `docs/legal/drop-rates-public.json` exists, validates against a JSON Schema at `docs/legal/drop-rates.schema.json`, and is regenerated whenever `apps/api/src/legal/drop-rate-config.ts` changes. Verified by a `pnpm legal:check-drop-rates` script comparing checksums.

**AC3.** `GET /v1/legal/drop-rates` returns HTTP 200 unauthenticated with the canonical JSON + HMAC header. Verified by `tests/integration/drop-rates.spec.ts`.

**AC4.** Every UI surface that calls a randomisation endpoint also emits a `randomisation.disclosure.shown` analytics event before the call. Verified by an integration test that drives the Cocos flow + asserts the analytics event ordering.

**AC5.** `randomisation_receipts` is written within 200ms of every randomisation outcome (P95). Verified by load-test fixture `tests/load/randomisation-receipt.k6.js`.

**AC6.** The daily reconciliation job emits a `drop-rate.deviation.alert` Sentry event when the prior 24h's actual rates deviate >0.5% absolute from declared rates. Verified by `tests/integration/drop-rate-deviation.spec.ts` simulating an off-by-1% pull stream.

**AC7.** A user with `region_of_record == "BE"` or `"NL"` does NOT see the surprise-egg marketing surface. Verified by Playwright test toggling the region cookie.

**AC8.** `lint-iap-catalogue-against-loot-box-rules.mjs` exits non-zero when a fixture catalogue contains `outcome_type: "random"`. Wired into CI.

**AC9.** Pet rescue UI has no real-money button anywhere — only the daily-ritual button. Verified by Playwright test asserting absence of `data-testid="rescue-paid"`.

**AC10.** Breeding given identical parent inputs always produces identical offspring traits. Verified by a property-test (fast-check) running 1,000 randomised parent pairings.

---

## §5 — Verification

### 5.1 — ESLint rule fixture test

```javascript
// eslint-rules/__tests__/no-real-money-random-pull.spec.cjs
const { RuleTester } = require('eslint');
const rule = require('../no-real-money-random-pull.cjs');
const tester = new RuleTester({ parserOptions: { ecmaVersion: 2022, sourceType: 'module' } });

tester.run('no-real-money-random-pull', rule, {
  valid: [
    { code: `function earnedPull(){ const r = Math.random(); return r; }` },
    { code: `async function buy(iapReceipt){ persistReceipt(iapReceipt); return SPECIFIC_OUTFIT; }` },
  ],
  invalid: [
    {
      code: `async function badPull(iapReceipt){ persistReceipt(iapReceipt); const r = Math.random(); return r < 0.5 ? A : B; }`,
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});
```

### 5.2 — Drop-rate deviation reconciliation test

```typescript
// tests/integration/drop-rate-deviation.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { reconcileDropRates } from '../../apps/api/src/legal/drop-rate-reconcile.service';
import { seedReceipts } from './_helpers/seed';

describe('FR-LEGAL-002 §1.9 — drop-rate deviation', () => {
  beforeAll(async () => {
    await seedReceipts('daily-surprise-egg', {
      common: 690, rare: 210, epic: 70, mythic: 25, legendary: 5,  // 1000 pulls, 0.1-1% deviation each tier
    });
  });

  it('does not alert within ±0.5% tolerance', async () => {
    const result = await reconcileDropRates('daily-surprise-egg');
    expect(result.deviation_alerts).toEqual([]);
  });

  it('alerts when a tier drifts >0.5%', async () => {
    await seedReceipts('daily-surprise-egg', { common: 800, rare: 100, epic: 50, mythic: 40, legendary: 10 });
    const result = await reconcileDropRates('daily-surprise-egg');
    expect(result.deviation_alerts).toContainEqual(expect.objectContaining({ rarity: 'common' }));
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/legal/drop-rate-config.ts — single source of truth
export const DROP_RATE_CONFIG = {
  version: '2026-05-17-001',
  mechanics: {
    'daily-surprise-egg': {
      input_currency: 'coins' as const,
      input_cost: 500,
      outcomes: [
        { rarity: 'common',    weight: 0.700, items: ['mochi-skin-a', 'mochi-skin-b'] },
        { rarity: 'rare',      weight: 0.200, items: ['pengu-skin-a'] },
        { rarity: 'epic',      weight: 0.070, items: ['bao-skin-a'] },
        { rarity: 'mythic',    weight: 0.025, items: ['fluffit-skin-a'] },
        { rarity: 'legendary', weight: 0.005, items: ['tako-skin-a'] },
      ],
    },
  },
} as const;

// apps/api/src/legal/drop-rate.service.ts
@Injectable()
export class DropRateService {
  // Crypto-RNG with disclosed weights; receipt written before return.
  async roll(playerId: string, mechanicId: keyof typeof DROP_RATE_CONFIG.mechanics) {
    const cfg  = DROP_RATE_CONFIG.mechanics[mechanicId];
    const seed = randomBytes(16);
    const u    = Number(seed.readBigUInt64BE(0) & ((1n << 53n) - 1n)) / 2 ** 53;
    let acc = 0;
    const outcome = cfg.outcomes.find(o => (acc += o.weight) >= u)!;
    await this.writeReceipt({ playerId, mechanicId, outcome: outcome.rarity, seedHash: sha256(seed).hex() });
    return outcome;
  }
}
```

---

## §7 — Dependencies

**External:** Apple App Store Connect (loot-box disclosure declaration in store listing); Google Play Console (Real-Money Gambling and Games declaration); regulator guidance (Belgium Kansspelcommissie, NL Kansspelautoriteit, EU Digital Fairness Act tracker).

**Internal:**
- FR-LEGAL-001 (compliance baseline must be in place — DPO and Safe Harbor are foundational).

**Blocks:** FR-PET-006 (rarity tiers must obey this policy), FR-PET-008 (Permadeath-Lite revival must be free), FR-ECON-002 (IAP catalogue must lint-pass), FR-VIRAL-004 (battle pass must be linear).

---

## §8 — Example payloads

### 8.1 — Randomisation receipt at rest

```json
{
  "id": "01HC7QG2EFR8XK4ZN8YA1J3WB6",
  "player_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "mechanic_id": "daily-surprise-egg",
  "drop_rate_version": "2026-05-17-001",
  "rolled_outcome": "rare",
  "rolled_at": "2026-08-12T14:36:01Z",
  "server_seed_hash": "9b3e7d2a5c4f1b8e6d3a2c9f7b5d3a1c9e1f8b6d4c2a3e5f9b7d5a3c1e9f7b5d",
  "retain_until": "2033-08-12T14:36:01Z"
}
```

### 8.2 — Drop-rate-deviation Sentry alert

```json
{
  "event": "drop-rate.deviation.alert",
  "mechanic_id": "daily-surprise-egg",
  "tier": "common",
  "declared_weight": 0.700,
  "observed_rate_24h": 0.812,
  "absolute_deviation": 0.112,
  "tolerance": 0.005,
  "rolls_in_window": 8421
}
```

### 8.3 — ESLint rule violation report

```text
apps/api/src/iap/pet-purchase.service.ts
  72:12  error  FR-LEGAL-002 §1.10 — randomisation function called in a path that includes an IAP receipt; loot-box-adjacent code is not allowed.  no-real-money-random-pull
```

### 8.4 — IAP catalogue lint output

```text
$ node scripts/legal/lint-iap-catalogue-against-loot-box-rules.mjs apps/api/iap/catalogue.json
FAIL: product "premium-egg-pack" has outcome_type "random"; FR-LEGAL-002 §1.11 requires outcome_type === "deterministic".
exit 1
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Are earned-currency random pulls really compliant in BE/NL? → §1.12 takes the conservative path (hide marketing) regardless, deferring the legal-counsel sign-off to a per-mechanic ANNEX. Earned-currency randomisation is permitted in the runtime, just marketing-hidden in those jurisdictions until counsel confirms.
- **OQ-2 (resolved):** Is the 7-year retention proportionate per PDPL data-minimisation? → §2 reasoning explains the audit-trail intent; the rows are pseudo-anonymous (`player_id` foreign key, no name/email), so retention proportionality is defensible.
- **OQ-3 (resolved):** Should breeding be "very deterministic" or "mostly deterministic with a small seed"? → §1.6 + §2 lock fully deterministic for auditability.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | A dev path combines IAP receipt + randomisation | `pnpm lint` fails on PR | PR blocked | Refactor to deterministic-purchase; re-PR |
| 2 | Drop-rate config drifts from public JSON | `legal:check-drop-rates` checksum mismatch in CI | Build fails | Regenerate public JSON; bump version |
| 3 | Actual rates deviate >0.5% from declared | Daily reconciliation Sentry alert | Regulator-comment exposure | Investigate RNG correctness; correct declaration or implementation; publish version bump |
| 4 | BE/NL user sees a surprise-egg marketing surface | Playwright regression catches it | Possible ToS issue | Patch the region gate; deploy hotfix; document in §11 sub-decisions |
| 5 | Receipt write latency >200ms P95 | OBS metric `randomisation.receipt.write.p95` | Audit-trail at risk | Move receipts to Redis Streams + async drain to Postgres; tune indexing |
| 6 | Drop-rate HMAC key rotation breaks regulator-side verification | Regulator complaint | Tampering allegation | Rotate via documented procedure with overlap window; publish new HMAC fingerprint |
| 7 | Pet rescue UI accidentally shows a paid button | Playwright assertion fails | Genshin-style precedent risk | Hotfix removal; root-cause in component review |
| 8 | Breeding seed function diverges across server replicas | Property-test detects mismatch | Audit-trail unreliable | Pin function to a hash-validated bundle; reject deploy if hash mismatch |
| 9 | EU DFA passes and changes the goalposts | Annual review trigger + news watch | Existing earned-currency mechanics may need refresh | Re-author this FR; ship policy patch within the regulator's transition window |
| 10 | A new vendor (PSP) starts processing randomised outcomes | Vendor-add review checklist hit | Cross-border-TIA gap | Halt new vendor; re-file TIA; re-authorise once compliant |
| 11 | IAP catalogue lint passes a misconfigured product because the field name was changed silently | Pre-deploy CI test fixture | Loot-box-adjacent product ships | Add fixture for renamed field; harden lint script |
| 12 | Daily reconciliation job is skipped (Redis/queue down) | Synthetic monitor `legal.reconcile.daily.missing` | Drift goes undetected | Replay from receipts table on recovery; alert DPO if missed >2 days |

---

## §11 — Notes

**Plan refs:** plan §PART 8 (Legal & Compliance) — Belgium 2018 ban; NL Antwerp 2025 ruling; EU Digital Fairness Act late-2025/early-2026 draft; HoYoverse $20M FTC settlement Jan 2025; Apple Guideline 3.1.1; Google Play Real-Money Gambling and Games policy.

**Sub-decisions punted to ops:**
- The set of items behind each rarity weight will be refreshed via FR-PET-006; this FR locks the framework, not the inventory.
- Marketing-creative review checklist (BE/NL surface hide) lives in the live-ops runbook (post-P0 deliverable).

**Anti-patterns explicitly forbidden:**
- "We'll add a tiny chance of an exclusive item to the $4.99 outfit pack" — that's a real-money random pull.
- "The Egg Pack contains 5 eggs, each one random" — yes, that's also a real-money random pull.
- "We'll disclose drop rates only in EU markets" — global disclosure is cheaper and is the Apple/Google policy.
- "A loot-box-adjacent mechanic isn't really a loot box" — Antwerp court 2025 disagrees.

**Cross-reference:** This FR is the substrate for FR-PET-006 (rarity tiers), FR-PET-007 (deterministic breeding), FR-PET-008 (free rescue), FR-ECON-002 (no random IAP), FR-VIRAL-004 (linear battle pass). Without this in place, those FRs cannot be authored coherently.
