# FR-AUTH-001 Fresh Zero-Touch Audit

**Derived state:** shipped (10/10) + mocked-dependency
**Reason:** Apple/Google OAuth production validation requires provider credentials; sandbox token validation is local.
**Attempts:** 1
**Deliverables checked:** 14
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**Mocked dependency:** Apple/Google OAuth production validation requires provider credentials; sandbox token validation is local.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (1.673625ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (0.565584ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.28925ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.178667ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (0.7695ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.440334ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (0.664709ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.128791ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (4.241959ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.263084ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.241708ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.295833ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 79.802083

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-AUTH-001

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-AUTH-001

✔ implementation registry covers every FR exactly once (0.7625ms)
✔ FR-LEGAL-001 acceptance contract (0.056792ms)
✔ FR-LEGAL-002 acceptance contract (0.147792ms)
✔ FR-LEGAL-003 acceptance contract (0.082875ms)
✔ FR-INFRA-001 acceptance contract (0.520667ms)
✔ FR-INFRA-002 acceptance contract (0.03925ms)
✔ FR-INFRA-003 acceptance contract (0.045125ms)
✔ FR-AUTH-001 acceptance contract (0.0415ms)
✔ FR-AUTH-002 acceptance contract (0.106167ms)
✔ FR-AUTH-003 acceptance contract (0.070375ms)
✔ FR-OBS-001 acceptance contract (0.06975ms)
✔ FR-ART-001 acceptance contract (0.05375ms)
✔ FR-PET-001 acceptance contract (0.044458ms)
✔ FR-PET-002 acceptance contract (0.045084ms)
✔ FR-PET-003 acceptance contract (0.076ms)
✔ FR-PET-004 acceptance contract (0.026041ms)
✔ FR-CARE-001 acceptance contract (0.036417ms)
✔ FR-CARE-002 acceptance contract (0.029167ms)
✔ FR-CARE-003 acceptance contract (0.05525ms)
✔ FR-CARE-004 acceptance contract (0.043166ms)
✔ FR-CARE-005 acceptance contract (0.044834ms)
✔ FR-AI-001 acceptance contract (0.377792ms)
✔ FR-AI-002 acceptance contract (0.104084ms)
✔ FR-AR-001 acceptance contract (0.068292ms)
✔ FR-VIRAL-001 acceptance contract (0.048583ms)
✔ FR-PET-005 acceptance contract (0.079833ms)
✔ FR-PET-006 acceptance contract (0.029ms)
✔ FR-PET-007 acceptance contract (0.086958ms)
✔ FR-PET-008 acceptance contract (0.054666ms)
✔ FR-SOCIAL-001 acceptance contract (0.084708ms)
✔ FR-SOCIAL-002 acceptance contract (0.066583ms)
✔ FR-SOCIAL-003 acceptance contract (0.046083ms)
✔ FR-SOCIAL-004 acceptance contract (0.031291ms)
✔ FR-VIRAL-002 acceptance contract (0.036792ms)
✔ FR-VIRAL-003 acceptance contract (0.049709ms)
✔ FR-ECON-001 acceptance contract (0.113875ms)
✔ FR-ECON-002 acceptance contract (0.040209ms)
✔ FR-ECON-003 acceptance contract (0.03125ms)
✔ FR-SUB-001 acceptance contract (0.035917ms)
✔ FR-SUB-002 acceptance contract (0.045625ms)
✔ FR-ADS-001 acceptance contract (0.095417ms)
✔ FR-ADS-002 acceptance contract (0.054666ms)
✔ FR-VIRAL-004 acceptance contract (0.031667ms)
✔ FR-VIRAL-005 acceptance contract (0.031834ms)
✔ FR-OBS-002 acceptance contract (0.043166ms)
✔ FR-I18N-001 acceptance contract (0.021792ms)
✔ FR-I18N-002 acceptance contract (0.027709ms)
✔ FR-A11Y-001 acceptance contract (0.035083ms)
✔ FR-AI-003 acceptance contract (0.033875ms)
✔ FR-B2B-001 acceptance contract (0.023959ms)
✔ FR-B2B-002 acceptance contract (0.049625ms)
✔ FR-B2B-003 acceptance contract (0.021042ms)
✔ FR-B2B-004 acceptance contract (0.02075ms)
✔ FR-B2B-005 acceptance contract (0.019291ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 79.767834

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (4.351708ms)
✔ E2E-007 web QA console serves live browser-ready artifact (52.009041ms)
✔ E2E-001 standard player hatch-to-share journey (4.071292ms)
✔ E2E-002 under-13 safe account and family journey (0.981666ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.381834ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (2.848917ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.665542ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 143.337542

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

