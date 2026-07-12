# FR-AR-001 Fresh Zero-Touch Audit

**Derived state:** done
**Reason:** Done with local signed/device adapter coverage; production gate remains: ARKit/ARCore require physical devices; Photo Studio fallback and AR decision logic are local.
**Attempts:** 1
**Deliverables checked:** 12
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**External production gate:** ARKit/ARCore require physical devices; Photo Studio fallback and AR decision logic are local.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (6.012792ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (1.489792ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.866958ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.322542ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (1.370041ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.547584ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (0.81025ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.155625ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (3.952958ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.258459ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.914125ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.717708ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 147.832959

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-AR-001

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-AR-001

✔ implementation registry covers every FR exactly once (1.59725ms)
✔ FR-LEGAL-001 acceptance contract (0.067292ms)
✔ FR-LEGAL-002 acceptance contract (0.1865ms)
✔ FR-LEGAL-003 acceptance contract (0.083917ms)
✔ FR-INFRA-001 acceptance contract (0.730125ms)
✔ FR-INFRA-002 acceptance contract (0.047167ms)
✔ FR-INFRA-003 acceptance contract (0.145333ms)
✔ FR-AUTH-001 acceptance contract (0.057834ms)
✔ FR-AUTH-002 acceptance contract (0.125375ms)
✔ FR-AUTH-003 acceptance contract (0.082208ms)
✔ FR-OBS-001 acceptance contract (0.07525ms)
✔ FR-ART-001 acceptance contract (0.059791ms)
✔ FR-PET-001 acceptance contract (0.049291ms)
✔ FR-PET-002 acceptance contract (0.052542ms)
✔ FR-PET-003 acceptance contract (0.080541ms)
✔ FR-PET-004 acceptance contract (0.03025ms)
✔ FR-CARE-001 acceptance contract (0.043083ms)
✔ FR-CARE-002 acceptance contract (0.034833ms)
✔ FR-CARE-003 acceptance contract (0.061584ms)
✔ FR-CARE-004 acceptance contract (0.048ms)
✔ FR-CARE-005 acceptance contract (0.050667ms)
✔ FR-AI-001 acceptance contract (0.089875ms)
✔ FR-AI-002 acceptance contract (0.050083ms)
✔ FR-AR-001 acceptance contract (0.03225ms)
✔ FR-VIRAL-001 acceptance contract (0.033667ms)
✔ FR-PET-005 acceptance contract (0.080792ms)
✔ FR-PET-006 acceptance contract (0.028375ms)
✔ FR-PET-007 acceptance contract (0.085959ms)
✔ FR-PET-008 acceptance contract (0.063625ms)
✔ FR-SOCIAL-001 acceptance contract (0.077292ms)
✔ FR-SOCIAL-002 acceptance contract (0.065166ms)
✔ FR-SOCIAL-003 acceptance contract (0.045625ms)
✔ FR-SOCIAL-004 acceptance contract (0.030083ms)
✔ FR-VIRAL-002 acceptance contract (0.037708ms)
✔ FR-VIRAL-003 acceptance contract (0.051584ms)
✔ FR-ECON-001 acceptance contract (0.122042ms)
✔ FR-ECON-002 acceptance contract (0.034667ms)
✔ FR-ECON-003 acceptance contract (0.032958ms)
✔ FR-SUB-001 acceptance contract (0.036041ms)
✔ FR-SUB-002 acceptance contract (0.076958ms)
✔ FR-ADS-001 acceptance contract (0.056708ms)
✔ FR-ADS-002 acceptance contract (0.042291ms)
✔ FR-VIRAL-004 acceptance contract (0.034042ms)
✔ FR-VIRAL-005 acceptance contract (0.037625ms)
✔ FR-OBS-002 acceptance contract (0.056584ms)
✔ FR-I18N-001 acceptance contract (0.027459ms)
✔ FR-I18N-002 acceptance contract (0.031166ms)
✔ FR-A11Y-001 acceptance contract (0.046ms)
✔ FR-AI-003 acceptance contract (0.045541ms)
✔ FR-B2B-001 acceptance contract (0.029209ms)
✔ FR-B2B-002 acceptance contract (0.065458ms)
✔ FR-B2B-003 acceptance contract (0.023208ms)
✔ FR-B2B-004 acceptance contract (0.023084ms)
✔ FR-B2B-005 acceptance contract (0.02675ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 146.981

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (4.781667ms)
✔ E2E-007 web QA console serves live browser-ready artifact (113.663333ms)
✔ E2E-001 standard player hatch-to-share journey (4.527833ms)
✔ E2E-002 under-13 safe account and family journey (0.743708ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.258042ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (3.919708ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (1.007875ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 265.676875

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

