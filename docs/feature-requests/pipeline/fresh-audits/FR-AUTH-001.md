# FR-AUTH-001 Fresh Zero-Touch Audit

**Derived state:** done
**Reason:** Done with local signed/device adapter coverage; production gate remains: Apple/Google OAuth production validation requires provider credentials; signed local provider assertions are enforced in tests.
**Attempts:** 1
**Deliverables checked:** 14
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**External production gate:** Apple/Google OAuth production validation requires provider credentials; signed local provider assertions are enforced in tests.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (3.436584ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (1.116916ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.332375ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.214042ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (1.822375ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.587792ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (1.020667ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.182125ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (4.227ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.217375ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.787625ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.350167ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 133.885125

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-AUTH-001

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-AUTH-001

✔ implementation registry covers every FR exactly once (1.450666ms)
✔ FR-LEGAL-001 acceptance contract (0.059167ms)
✔ FR-LEGAL-002 acceptance contract (0.167417ms)
✔ FR-LEGAL-003 acceptance contract (0.076083ms)
✔ FR-INFRA-001 acceptance contract (0.658375ms)
✔ FR-INFRA-002 acceptance contract (0.046458ms)
✔ FR-INFRA-003 acceptance contract (0.04975ms)
✔ FR-AUTH-001 acceptance contract (0.042375ms)
✔ FR-AUTH-002 acceptance contract (0.099875ms)
✔ FR-AUTH-003 acceptance contract (0.070584ms)
✔ FR-OBS-001 acceptance contract (0.067458ms)
✔ FR-ART-001 acceptance contract (0.054958ms)
✔ FR-PET-001 acceptance contract (0.043708ms)
✔ FR-PET-002 acceptance contract (0.044791ms)
✔ FR-PET-003 acceptance contract (0.080542ms)
✔ FR-PET-004 acceptance contract (0.029375ms)
✔ FR-CARE-001 acceptance contract (0.0405ms)
✔ FR-CARE-002 acceptance contract (0.032833ms)
✔ FR-CARE-003 acceptance contract (0.051917ms)
✔ FR-CARE-004 acceptance contract (0.045667ms)
✔ FR-CARE-005 acceptance contract (0.046333ms)
✔ FR-AI-001 acceptance contract (0.077625ms)
✔ FR-AI-002 acceptance contract (0.045125ms)
✔ FR-AR-001 acceptance contract (0.030042ms)
✔ FR-VIRAL-001 acceptance contract (0.032958ms)
✔ FR-PET-005 acceptance contract (0.07225ms)
✔ FR-PET-006 acceptance contract (0.026417ms)
✔ FR-PET-007 acceptance contract (0.075083ms)
✔ FR-PET-008 acceptance contract (0.060459ms)
✔ FR-SOCIAL-001 acceptance contract (0.071709ms)
✔ FR-SOCIAL-002 acceptance contract (0.063209ms)
✔ FR-SOCIAL-003 acceptance contract (0.043625ms)
✔ FR-SOCIAL-004 acceptance contract (0.028042ms)
✔ FR-VIRAL-002 acceptance contract (0.035833ms)
✔ FR-VIRAL-003 acceptance contract (0.049ms)
✔ FR-ECON-001 acceptance contract (0.106542ms)
✔ FR-ECON-002 acceptance contract (0.034209ms)
✔ FR-ECON-003 acceptance contract (0.033041ms)
✔ FR-SUB-001 acceptance contract (0.03225ms)
✔ FR-SUB-002 acceptance contract (0.051375ms)
✔ FR-ADS-001 acceptance contract (0.058791ms)
✔ FR-ADS-002 acceptance contract (0.043208ms)
✔ FR-VIRAL-004 acceptance contract (0.027292ms)
✔ FR-VIRAL-005 acceptance contract (0.037417ms)
✔ FR-OBS-002 acceptance contract (0.050708ms)
✔ FR-I18N-001 acceptance contract (0.024ms)
✔ FR-I18N-002 acceptance contract (0.030208ms)
✔ FR-A11Y-001 acceptance contract (0.037875ms)
✔ FR-AI-003 acceptance contract (0.036ms)
✔ FR-B2B-001 acceptance contract (0.024959ms)
✔ FR-B2B-002 acceptance contract (0.05975ms)
✔ FR-B2B-003 acceptance contract (0.021709ms)
✔ FR-B2B-004 acceptance contract (0.022041ms)
✔ FR-B2B-005 acceptance contract (0.027292ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 129.579

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (4.165875ms)
✔ E2E-007 web QA console serves live browser-ready artifact (112.092958ms)
✔ E2E-001 standard player hatch-to-share journey (2.840083ms)
✔ E2E-002 under-13 safe account and family journey (1.225791ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.303167ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (2.122625ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (1.290292ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 260.068833

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

