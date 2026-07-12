# FR-ADS-002 Fresh Zero-Touch Audit

**Derived state:** done
**Reason:** Done with local signed/device adapter coverage; production gate remains: SuperAwesome kWS requires vendor credentials; contextual-only policy is enforced local.
**Attempts:** 1
**Deliverables checked:** 6
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**External production gate:** SuperAwesome kWS requires vendor credentials; contextual-only policy is enforced local.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (2.268625ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (1.811042ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.3165ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.2085ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (1.362417ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.501709ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (1.528791ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.220791ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (4.516833ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.241917ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.814375ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.481625ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 133.765125

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-ADS-002

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-ADS-002

✔ implementation registry covers every FR exactly once (1.432458ms)
✔ FR-LEGAL-001 acceptance contract (0.058083ms)
✔ FR-LEGAL-002 acceptance contract (0.16925ms)
✔ FR-LEGAL-003 acceptance contract (0.080084ms)
✔ FR-INFRA-001 acceptance contract (0.67925ms)
✔ FR-INFRA-002 acceptance contract (0.045041ms)
✔ FR-INFRA-003 acceptance contract (0.051084ms)
✔ FR-AUTH-001 acceptance contract (0.04275ms)
✔ FR-AUTH-002 acceptance contract (0.087375ms)
✔ FR-AUTH-003 acceptance contract (0.072417ms)
✔ FR-OBS-001 acceptance contract (0.072ms)
✔ FR-ART-001 acceptance contract (0.054666ms)
✔ FR-PET-001 acceptance contract (0.043208ms)
✔ FR-PET-002 acceptance contract (0.045667ms)
✔ FR-PET-003 acceptance contract (0.08ms)
✔ FR-PET-004 acceptance contract (0.030208ms)
✔ FR-CARE-001 acceptance contract (0.04125ms)
✔ FR-CARE-002 acceptance contract (0.033541ms)
✔ FR-CARE-003 acceptance contract (0.060458ms)
✔ FR-CARE-004 acceptance contract (0.045875ms)
✔ FR-CARE-005 acceptance contract (0.047875ms)
✔ FR-AI-001 acceptance contract (0.080583ms)
✔ FR-AI-002 acceptance contract (0.044292ms)
✔ FR-AR-001 acceptance contract (0.029875ms)
✔ FR-VIRAL-001 acceptance contract (0.030583ms)
✔ FR-PET-005 acceptance contract (0.074375ms)
✔ FR-PET-006 acceptance contract (0.027083ms)
✔ FR-PET-007 acceptance contract (0.082625ms)
✔ FR-PET-008 acceptance contract (0.057167ms)
✔ FR-SOCIAL-001 acceptance contract (0.074583ms)
✔ FR-SOCIAL-002 acceptance contract (0.06225ms)
✔ FR-SOCIAL-003 acceptance contract (0.042458ms)
✔ FR-SOCIAL-004 acceptance contract (0.029667ms)
✔ FR-VIRAL-002 acceptance contract (0.037416ms)
✔ FR-VIRAL-003 acceptance contract (0.048625ms)
✔ FR-ECON-001 acceptance contract (0.113833ms)
✔ FR-ECON-002 acceptance contract (0.034833ms)
✔ FR-ECON-003 acceptance contract (0.034208ms)
✔ FR-SUB-001 acceptance contract (0.035ms)
✔ FR-SUB-002 acceptance contract (0.069333ms)
✔ FR-ADS-001 acceptance contract (0.06475ms)
✔ FR-ADS-002 acceptance contract (0.046125ms)
✔ FR-VIRAL-004 acceptance contract (0.027875ms)
✔ FR-VIRAL-005 acceptance contract (0.035208ms)
✔ FR-OBS-002 acceptance contract (0.048666ms)
✔ FR-I18N-001 acceptance contract (0.025375ms)
✔ FR-I18N-002 acceptance contract (0.028375ms)
✔ FR-A11Y-001 acceptance contract (0.0375ms)
✔ FR-AI-003 acceptance contract (0.035333ms)
✔ FR-B2B-001 acceptance contract (0.024125ms)
✔ FR-B2B-002 acceptance contract (0.057542ms)
✔ FR-B2B-003 acceptance contract (0.021042ms)
✔ FR-B2B-004 acceptance contract (0.021208ms)
✔ FR-B2B-005 acceptance contract (0.028041ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 135.324541

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (4.803542ms)
✔ E2E-007 web QA console serves live browser-ready artifact (111.931958ms)
✔ E2E-001 standard player hatch-to-share journey (2.785958ms)
✔ E2E-002 under-13 safe account and family journey (0.834208ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.848416ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (1.937958ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.95675ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 262.230875

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

