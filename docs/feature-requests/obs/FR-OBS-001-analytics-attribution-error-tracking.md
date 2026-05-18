---
id: FR-OBS-001
title: "Observability baseline — GameAnalytics + Mixpanel + AppsFlyer + Sentry + Better Stack (kids SKU restricted)"
module: OBS
priority: MUST
status: shipped
verify: T
phase: P0
milestone: "Foundation Gate"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-INFRA-001, FR-INFRA-002, FR-INFRA-003, FR-LEGAL-001, FR-LEGAL-002, FR-LEGAL-003, FR-ADS-002, FR-OBS-002, FR-B2B-002]
depends_on: [FR-INFRA-001, FR-INFRA-003, FR-LEGAL-001]
blocks: [FR-PET-001, FR-CARE-001, FR-OBS-002]
effort_hours: 8
new_files:
  - "apps/cocos/assets/_root/obs/Analytics.ts"
  - "apps/cocos/assets/_root/obs/Crash.ts"
  - "apps/cocos/assets/_root/obs/Attribution.ts"
  - "apps/cocos/assets/_root/obs/__tests__/Analytics.spec.ts"
  - "apps/cocos/assets/_root/obs/__tests__/kids-sdk-allowlist.spec.ts"
  - "apps/api/src/obs/sentry.ts"
  - "apps/api/src/obs/metrics.ts"
  - "apps/api/src/obs/posthog.ts"
  - "apps/api/src/obs/better-stack.ts"
  - "apps/api/src/obs/__tests__/event-schema.spec.ts"
  - "apps/cocos/src/__sdk-allowlist/kids.json"
  - "apps/cocos/src/__sdk-allowlist/standard.json"
  - "docs/obs/event-taxonomy.md"
  - "docs/obs/dashboard-spec.md"
  - "infra/grafana/dashboards/pet-care-funnel.json"
  - "infra/grafana/dashboards/auth-funnel.json"
modified_files:
  - "package.json"
  - "turbo.json"
allowed_tools:
  - "GameAnalytics SDK (f2p funnel + economy)"
  - "Mixpanel SDK (product analytics + feature flags) — STANDARD SKU ONLY"
  - "Amplitude SDK (alternative to Mixpanel; vendor decision deferred to ops) — STANDARD SKU ONLY"
  - "AppsFlyer SDK (UA attribution) — STANDARD SKU ONLY"
  - "Adjust SDK (alternative attribution; deferred to ops) — STANDARD SKU ONLY"
  - "Sentry Node SDK + Sentry Cocos SDK"
  - "Better Stack (Heroku Logs successor — uptime + structured logs)"
  - "OpenTelemetry / Prometheus (server-side metrics)"
disallowed_tools:
  - "ANY behavioural analytics SDK in the kids SKU (Mixpanel / Amplitude / AppsFlyer / Adjust / AppLovin / IronSource all banned per FR-LEGAL-001 §1.5(a))"
  - "Firebase Crashlytics on kids SKU (not certified for Kids Category)"
  - "Google Analytics in kids binaries"
  - "Cross-SKU event sharing (each SKU has its own analytics workspace)"
risk_if_skipped: "Without baseline analytics + attribution + error tracking, the soft-launch retention/economy tuning cycles required to hit D7 ≥ 18% are blind; without error tracking, regressions are detected by player complaints only; without per-SKU allowlists, the kids SKU fails Apple Kids Category review."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Standard-SKU SDK stack.** The standard SKU MUST integrate: (a) **GameAnalytics** for f2p funnel + economy; (b) **Mixpanel** for product analytics + feature flags (Amplitude is a deferred alternative); (c) **AppsFlyer** for UA attribution (Adjust deferred alternative); (d) **Sentry** for client + server errors; (e) **Better Stack** for uptime monitoring + structured log aggregation.

§1.2  **Kids-SKU SDK stack — radically reduced.** The kids SKU MUST integrate ONLY: (a) **GameAnalytics** with `consent_mode: "kids_safe"` (no behavioural-ID tracking); (b) **Sentry** for crash reporting (Sentry's `sendDefaultPii: false` mode). No Mixpanel / Amplitude / AppsFlyer / Adjust / Firebase. Verified at binary level by FR-LEGAL-003 §1.10 inspection script.

§1.3  **SDK allow-list config.** `apps/cocos/src/__sdk-allowlist/kids.json` and `apps/cocos/src/__sdk-allowlist/standard.json` MUST enumerate the SDK packages and their version pins. The build script (FR-INFRA-001 §1.4) MUST consume the SKU's allow-list and reject the build if any imported package is NOT on the allow-list for that SKU.

§1.4  **Event taxonomy.** A canonical event taxonomy MUST live at `docs/obs/event-taxonomy.md` covering: `auth.*`, `pet.*`, `care.*`, `ai.*`, `ar.*`, `viral.*`, `social.*`, `econ.*`, `sub.*`, `ad.*`, `legal.*`, `security.*`, `infra.*`. Every event name MUST follow `<module>.<action>.<outcome>` snake-case format. New event names require an FR amendment.

§1.5  **Schema validation.** Every emitted event payload MUST validate against a schema in `apps/api/src/obs/event-schemas/<event-name>.zod.ts`. Server-side, the API's `EventBus.emit` MUST run schema validation; failures MUST emit `obs.event.schema.invalid` Sentry event and drop the event payload.

§1.6  **Server-side first, client mirror second.** Where a state-changing event happens both client and server (e.g. `care.feed.completed`), the server-emitted event is the source of truth. The client emits an analytics event for UX-funnel purposes but MUST tag it with a `client_emitted_at` so the analytics pipeline can dedupe against the server `emitted_at`.

§1.7  **PII-scrubbing.** Sentry MUST be configured with explicit PII scrubbers stripping: `parent_email`, `parental_consent.*` rows, `display_name` (unless `display_name_consent: true`), `device_id` (under-13). The scrubber config MUST be loaded from `apps/api/src/obs/sentry-pii-scrub.ts` and unit-tested.

§1.8  **Sentry release tagging.** Every release MUST tag Sentry with the `git rev` + a human-readable version (e.g. `tamagochi@1.0.3-rc.2+abc1234`). Source maps for the web build MUST be uploaded to Sentry on every CI deploy (per FR-INFRA-001 §1.17).

§1.9  **Sentry transaction sampling.** Backend transactions sample at 5% by default; auth-flow transactions sample at 50% (lower volume); error transactions sample at 100%. Per-tenant tail sampling (B2B in P4) is deferred to FR-OBS-002.

§1.10  **Mixpanel feature flags.** Mixpanel's feature-flag service MUST gate every non-trivial change to gameplay (e.g. mini-game payout adjustments, AI personality tuning). Feature flags MUST be referenced via a `useFeatureFlag(flagName, defaultValue)` Cocos hook (or `serverFeatureFlag.value(name, defaultValue, userId)` server-side). All flags MUST have a default value that allows rollout without flag-service availability.

§1.11  **AppsFlyer install attribution.** AppsFlyer SDK MUST be initialised on first launch (standard SKU only); install events MUST tag the campaign ID + media-source + agency. Postback to AppsFlyer's API for in-app events (sub_start, iap_complete) MUST be server-driven (not client) to prevent fraud.

§1.12  **GameAnalytics economy events.** GameAnalytics MUST receive `BusinessEvent`, `ResourceEvent`, `ProgressionEvent`, `DesignEvent` per its documented model. The economy taxonomy MUST cover all currency sources + sinks defined in FR-ECON-001. The kids SKU sends only `DesignEvent` (no business — no IAP in kids SKU directly).

§1.13  **Better Stack uptime + log aggregation.** Better Stack MUST monitor every public endpoint (`/healthz`, `/readyz`, `/v1/auth/*`, `/v1/dsr`) with 30-second checks. Logs from Nest API + Colyseus + Edge Functions MUST stream to Better Stack with structured JSON; PII-scrubbed before send.

§1.14  **Self-host PostHog as alternative.** PostHog (self-host on AWS Singapore) MUST be set up as a Mixpanel alternative for situations where Mixpanel's pricing breaks the budget. The standard-SKU `Analytics.ts` MUST be dual-provider-compatible (config-driven). PostHog is the GameAnalytics analog if both Mixpanel and Amplitude become cost-prohibitive.

§1.15  **Cross-SKU workspace separation.** Each SKU (kids + standard) AND each B2B tenant (P4) MUST have its own GameAnalytics + Mixpanel + AppsFlyer workspace. Workspace IDs MUST be stored in `infra/supabase/<sku>/config.toml`. No cross-workspace event leakage is permitted.

§1.16  **`Analytics.ts` API surface.** The Cocos client analytics surface MUST expose:
```
Analytics.track(eventName: string, props: Record<string, unknown>): void
Analytics.identify(userId: string, traits: Record<string, unknown>): void
Analytics.setSuperProperties(props: Record<string, unknown>): void
Analytics.reset(): void
```
On the kids SKU, `identify` MUST be a no-op when `parental_consent_state != "granted"`.

§1.17  **PII consent before identify.** On the standard SKU, `Analytics.identify` MUST be deferred until: (a) user accepts the privacy-policy version; (b) a `policy_version` audit row is recorded. Identify call carries the `policy_version` as a super-property.

§1.18  **Grafana dashboards.** Two Grafana dashboards MUST exist at scaffold time: `pet-care-funnel.json` (hatch → first-feed → 7-day-streak retention) and `auth-funnel.json` (signin → after-signin → first-pet-hatch). Both MUST be JSON-versioned in `infra/grafana/dashboards/` and re-importable on a fresh Grafana instance.

§1.19  **Critical-incident alerts.** Sentry + Better Stack MUST page on:
- error rate > 1% on `/v1/auth/*` for 5 min;
- error rate > 5% anywhere for 2 min;
- 5xx on `/healthz` ≥ 3 in 5 min;
- AppsFlyer attribution failure (no installs reported) for 1 hour;
- COPPA-relevant events: `coppa.gate.bypass.attempt`, `coppa.consent.transition` (info only, manual review queue).

§1.20  **Quarterly observability review.** A scheduled task MUST fire quarterly to: (a) audit the event-taxonomy doc for orphaned events; (b) re-verify SDK allow-list parity (no new behavioural SDK leaked into kids); (c) verify Sentry PII scrubbers still active; (d) verify Grafana dashboards still rendering.

---

## §2 — Why this design

**Why three product-analytics tools (GameAnalytics + Mixpanel + AppsFlyer).** Plan §PART 4 lays out the canonical f2p stack: GameAnalytics for economy + funnel (their schema is opinionated for games), Mixpanel for ad-hoc product questions (cohorts + funnels with arbitrary filters), AppsFlyer for UA attribution (no other vendor has comparable VN/SEA media-source coverage). Each addresses a different question; replacing one with another would lose value.

**Why radically reduced SDK stack on kids SKU.** Plan §PART 8 + FR-LEGAL-001 §1.5 — COPPA-2025 redefines "personal information" to include persistent identifiers used for engagement. Behavioural analytics SDKs (Mixpanel, AppsFlyer, Adjust) all rely on persistent identifiers. The compliant kids analytics is GameAnalytics with `kids_safe` mode + Sentry with `sendDefaultPii: false`. Any other SDK on the kids binary is a regulator surface.

**Why SDK allow-list as a JSON config + build-time enforcement.** A policy in markdown is a recommendation; a JSON allow-list referenced by the build script is a CI-survivable rule. The kids SKU's allow-list is the only place we encode "this is the list of SDKs that won't get us in trouble."

**Why event taxonomy is canonical.** Custom event naming + ad-hoc properties = analytics chaos within 6 months. A taxonomy doc + schema validation forces the discipline.

**Why server-emitted events are source of truth.** Client events can be lost (offline, app-killed mid-emit), tampered with (anti-cheat bypass), or duplicated (network retry). Server events run in a trusted environment with at-most-once + at-least-once semantics depending on the queue. For business-critical events (purchase, currency change), server is authoritative.

**Why PII scrubbers are unit-tested.** Sentry's default PII handling has historically had regressions (per Sentry's CHANGELOG). Unit-testing the scrubber config catches drift on Sentry SDK upgrade.

**Why feature flags from day one.** A f2p game tunes economy + retention via small experiments. Feature flags let the team try changes without rebuilds. Mixpanel is a single-vendor solution; PostHog is the self-host fallback.

**Why Better Stack rather than Datadog.** Datadog is great but expensive ($23+/host/month). Better Stack is dramatically cheaper for the soft-launch volume, has a free tier covering P0/P1, and matches Sentry's UX. Datadog can be added later if needed.

**Why each B2B tenant gets its own analytics workspace.** PetOS tenants (banks, telcos, FMCG) want their own analytics dashboards isolated from each other and from the consumer game. Workspace separation is a B2B sales requirement.

**Why server-side AppsFlyer postback for in-app events.** Client-side postback can be spoofed (a fraud farm makes fake "iap_complete" events to attribute fake installs). Server-side postback ties the event to a verified IAP receipt.

**Why critical-incident alerts on auth >1% specifically.** Authentication is a leading indicator of broader outage. A 1% threshold catches partial-outage before player-complaint volume spikes.

**Why quarterly observability review.** Drift is the silent killer of observability. A scheduled task + checklist keeps the system honest.

---

## §3 — API contract & code shape

### 3.1 — Cocos `Analytics.ts`

```typescript
// apps/cocos/assets/_root/obs/Analytics.ts
import { isKidsSku } from '../legal/build-target';
import { parentalConsentState } from '../legal/parental-consent';

export class Analytics {
  static track(name: string, props: Record<string, unknown>): void {
    if (isKidsSku() && !this.isKidsAllowed(name)) return;   // §1.2 enforcement
    gameAnalytics.send(name, props);
    if (!isKidsSku()) mixpanel.track(name, props);
  }

  static identify(userId: string, traits: Record<string, unknown>): void {
    if (isKidsSku() && parentalConsentState() !== 'granted') return;   // §1.16
    gameAnalytics.identify(userId);
    if (!isKidsSku()) mixpanel.identify(userId);
    if (!isKidsSku()) appsFlyer.setCustomerUserID(userId);
  }

  private static isKidsAllowed(name: string): boolean {
    return name.startsWith('pet.') || name.startsWith('care.')
        || name.startsWith('design.') || name.startsWith('auth.kids.');
  }
}
```

### 3.2 — Event-schema example

```typescript
// apps/api/src/obs/event-schemas/care.feed.completed.zod.ts
import { z } from 'zod';

export const CareFeedCompletedSchema = z.object({
  pet_id: z.string().uuid(),
  player_id: z.string().uuid(),
  hunger_before: z.number().int().min(0).max(100),
  hunger_after:  z.number().int().min(0).max(100),
  food_item: z.enum(['basic','premium','seasonal']),
  source: z.enum(['ui','co_parent_remote']),
  emitted_at: z.string().datetime(),
  client_emitted_at: z.string().datetime().optional(),
});
```

### 3.3 — Sentry PII scrub

```typescript
// apps/api/src/obs/sentry-pii-scrub.ts
import * as Sentry from '@sentry/node';

export function configureSentry(opts: { dsn: string; release: string }) {
  Sentry.init({
    dsn: opts.dsn, release: opts.release, sendDefaultPii: false,
    beforeSend(event) {
      delete event.user?.email;
      delete event.user?.ip_address;
      if (event.extra) {
        delete (event.extra as any).parent_email;
        delete (event.extra as any).parental_consent;
        delete (event.extra as any).device_id;
      }
      return event;
    },
    tracesSampleRate: 0.05,
  });
}
```

### 3.4 — SDK allow-list shape

```jsonc
// apps/cocos/src/__sdk-allowlist/kids.json
{
  "sku": "kids",
  "allow": {
    "gameanalytics": { "version": "5.x" },
    "@sentry/react-native": { "version": "5.x" }
  },
  "deny": [
    "mixpanel-react-native", "appsflyer-react-native-plugin", "@firebase/analytics",
    "@firebase/messaging", "@react-native-firebase/crashlytics",
    "@adjustcom/adjust-react-native", "react-native-applovin-max",
    "react-native-google-mobile-ads"
  ]
}
```

---

## §4 — Acceptance criteria

**AC1.** Standard SKU build links GameAnalytics + Mixpanel + AppsFlyer + Sentry. Verified by `__tests__/Analytics.spec.ts` + binary inspection.

**AC2.** Kids SKU build links ONLY GameAnalytics + Sentry. Verified by FR-LEGAL-003 §1.10 binary inspection — `strings <kids.ipa> | grep -iE "(Mixpanel|AppsFlyer|Adjust|AppLovin|IronSource|Firebase)"` returns empty.

**AC3.** Server-side event schema validation rejects malformed events. Verified by `__tests__/event-schema.spec.ts` with a malformed payload.

**AC4.** Sentry PII scrub removes `parent_email`, `parental_consent`, `device_id` (under-13) from emitted events. Verified by `__tests__/sentry-pii-scrub.spec.ts` driving sample events.

**AC5.** `Analytics.identify` is a no-op on kids SKU when `parental_consent_state != "granted"`. Verified by `__tests__/Analytics.spec.ts`.

**AC6.** Sentry release tagging is correct: `release` field equals `tamagochi@<semver>+<git-rev>`. Verified by inspecting a Sentry test event.

**AC7.** AppsFlyer in-app event postback comes from the server, not the client. Verified by inspecting the AppsFlyer dashboard's source attribution.

**AC8.** Grafana dashboards `pet-care-funnel.json` + `auth-funnel.json` are JSON-versioned and re-importable. Verified by `pnpm grafana:import` against a test Grafana instance.

**AC9.** Critical-incident alerts (§1.19) fire in a synthetic chaos test. Verified by `__tests__/chaos/auth-error-spike.spec.ts`.

**AC10.** Feature-flag default returns when Mixpanel is unreachable. Verified by `__tests__/feature-flag-fallback.spec.ts`.

**AC11.** Quarterly observability-review scheduled task is created on 2026-08-17, 2026-11-17, etc. Verified by inspecting scheduled-task list.

**AC12.** Cross-SKU event isolation — events emitted by the kids SKU never appear in the standard SKU Mixpanel workspace. Verified by reviewing workspace event volumes after a soft-launch dry run.

---

## §5 — Verification

```typescript
// apps/cocos/assets/_root/obs/__tests__/kids-sdk-allowlist.spec.ts
import { describe, it, expect } from 'vitest';
import allowlist from '../../__sdk-allowlist/kids.json';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

describe('FR-OBS-001 §1.3 — kids SDK allow-list', () => {
  it('built kids bundle contains zero denied SDK strings', () => {
    const bundleDir = 'build/kids/web-mobile';
    const files = readdirSync(bundleDir, { recursive: true }) as string[];
    const jsFiles = files.filter(f => f.endsWith('.js'));
    for (const f of jsFiles) {
      const content = readFileSync(join(bundleDir, f), 'utf8');
      for (const denied of allowlist.deny) {
        expect(content.includes(denied)).toBe(false);
      }
    }
  });

  it('lists all expected denied SDKs', () => {
    const denied = new Set(allowlist.deny);
    for (const must of ['mixpanel-react-native','appsflyer-react-native-plugin','@firebase/analytics']) {
      expect(denied.has(must)).toBe(true);
    }
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/obs/sentry.ts
import { configureSentry } from './sentry-pii-scrub';
configureSentry({ dsn: process.env.SENTRY_DSN!, release: process.env.RELEASE! });

// apps/api/src/obs/metrics.ts
import { register, Counter, Histogram } from 'prom-client';
export const authSigninCounter = new Counter({
  name: 'auth_signin_total', help: 'signin attempts', labelNames: ['provider','sku','outcome'],
});
export const careActionLatency = new Histogram({
  name: 'care_action_latency_ms', help: 'care action latency', labelNames: ['action','sku'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
});
```

---

## §7 — Dependencies

**External:** GameAnalytics account; Mixpanel account; AppsFlyer account; Sentry org; Better Stack; Cloudflare R2 (for self-host PostHog if chosen).

**Internal:** FR-INFRA-001 (Cocos scaffold); FR-INFRA-003 (Supabase for event audit); FR-LEGAL-001 (PII scrub rules); FR-LEGAL-003 (binary inspection for SDK allow-list); FR-AUTH-001..003 (the `identify` call hooks into auth state).

**Blocks:** FR-PET-001 (will emit `pet.hatched`); FR-CARE-001..005 (care events); FR-OBS-002 (anti-cheat builds on this metrics scaffold).

---

## §8 — Example payloads

### 8.1 — `auth.signin.success` event

```json
{
  "event": "auth.signin.success",
  "provider": "apple",
  "sku": "standard",
  "outcome": "success",
  "user_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "region_of_record": "VN",
  "policy_version": "tamagochi-privacy-en-v1.3.0",
  "emitted_at": "2026-08-12T14:36:01Z"
}
```

### 8.2 — Sentry PII-scrubbed error

```json
{
  "release": "tamagochi@1.0.3-rc.2+abc1234",
  "level": "error",
  "tags": { "sku": "standard", "tenant_id": "mochi" },
  "extra": { "request_id": "01HC7QG..." },
  "user": { "id": "01HC7QGZK4XN8YA1J3WB6EFR8" }
  /* no email, no ip_address, no parent_email, no device_id */
}
```

### 8.3 — GameAnalytics business event

```typescript
GameAnalytics.addBusinessEvent('USD', 4.99, 'cosmetics', 'mochi-skin-a', 'iap-pack-a');
```

### 8.4 — Critical alert payload (Sentry rule)

```yaml
- name: auth-error-rate-high
  condition: error_rate > 1% on path ~ '/v1/auth/*' over 5 min
  action:
    - sentry.notify(channel: '#oncall', severity: 'page')
    - pagerduty.escalate(routing_key: tamagochi-prod)
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Mixpanel vs Amplitude? → §1.1 + §`allowed_tools` — Mixpanel default; Amplitude documented as alternative; vendor swap is config.
- **OQ-2 (resolved):** AppsFlyer vs Adjust? → §1.1 — AppsFlyer primary (VN/SEA media-source coverage); Adjust alternative.
- **OQ-3 (resolved):** PostHog self-host? → §1.14 — only if Mixpanel cost breaks budget.
- **OQ-4 (resolved):** Tail sampling per tenant? → §1.9 + deferred to FR-OBS-002 in P4.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | A denied SDK leaks into kids binary | FR-LEGAL-003 §1.10 + `__tests__/kids-sdk-allowlist.spec.ts` | Build blocked | Identify transitive dep; replace or vendor-isolate |
| 2 | Sentry PII scrubber regression after SDK upgrade | `__tests__/sentry-pii-scrub.spec.ts` fails | PR blocked | Update scrubber; pin SDK |
| 3 | Mixpanel feature-flag service down | `feature-flag.fallback.used` metric spike | Default values used | Use defaults until service recovers; investigate |
| 4 | AppsFlyer attribution outage | Postback failure metric | UA mis-attributed | Manual UA reconciliation; vendor support |
| 5 | GameAnalytics quota exceeded | Vendor email + ingestion failures | Loss of f2p funnel data | Upgrade plan; restore ingestion |
| 6 | Sentry release tagging breaks (CI doesn't set RELEASE env) | Events untagged in Sentry | Hard to correlate by version | Add CI assertion; fix script |
| 7 | Grafana dashboard JSON drifts | `grafana:import` test fails | Dashboards stale | Re-export from running Grafana; commit fresh JSON |
| 8 | Quarterly review missed | Scheduled task alerts | Drift accumulates | Manual review; tighten taxonomy |
| 9 | Cross-SKU event leakage | Mixpanel workspace event spike from "wrong" SKU | COPPA exposure | Identify leak source; rotate workspace tokens |
| 10 | Server-side event-schema validation rejects valid events | `obs.event.schema.invalid` spike | Analytics data missing | Update schema; emergency permissive mode while fix lands |
| 11 | Critical alert false-positive flood | Pager fatigue | On-call ignores real alerts | Tune thresholds; rate-limit pages |
| 12 | Better Stack uptime check rate-limited | `infra.uptime.alert.missing` synthetic check | Outage undetected | Tune check frequency; multi-vendor uptime cross-check |

---

## §11 — Notes

**Plan refs:** plan §PART 4 — analytics & ops stack (Mixpanel + GameAnalytics + AppsFlyer + Sentry + Better Stack). PostHog mentioned as self-host alternative.

**Sub-decisions punted to ops:**
- Mixpanel vs Amplitude — locked in `infra/supabase/*/config.toml` annex with cost rationale.
- Sentry transaction sampling rates — tunable; defaults in §1.9.
- Better Stack vs Datadog — Better Stack default; Datadog upgrade documented.

**Anti-patterns explicitly forbidden:**
- Mixpanel/Amplitude/AppsFlyer SDK in kids binary.
- `display_name` in Sentry events without consent.
- Client-side AppsFlyer postback for IAP.
- Custom event name outside the taxonomy.
- Shipping a feature without a feature flag.

**Cross-reference:** FR-OBS-001 is the observability substrate. FR-OBS-002 (P4 anti-cheat audit) builds on top. Every gameplay FR (FR-PET-001 onward) emits events into this scaffold.
