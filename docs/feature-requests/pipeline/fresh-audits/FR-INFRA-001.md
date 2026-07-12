# FR-INFRA-001 Fresh Zero-Touch Audit

**Derived state:** done
**Reason:** Done with local signed/device adapter coverage; production gate remains: Cocos Creator native builds require Cocos editor/Xcode/Android signing; local web QA and bundle tests are available.
**Attempts:** 1
**Deliverables checked:** 22
**Missing deliverables:** 0
**Scaffold deliverables:** 0
**External production gate:** Cocos Creator native builds require Cocos editor/Xcode/Android signing; local web QA and bundle tests are available.

## Raw Terminal Results

### npm run test:unit

```text
> tamagochi@0.1.0 test:unit
> node --test tests/unit/*.test.ts

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (2.34525ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (1.422125ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.28775ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.192625ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (1.3915ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.910375ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (0.893291ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.1705ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (3.354416ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.210291ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.698625ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.300667ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 135.362333

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-INFRA-001

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-INFRA-001

✔ implementation registry covers every FR exactly once (1.411083ms)
✔ FR-LEGAL-001 acceptance contract (0.059958ms)
✔ FR-LEGAL-002 acceptance contract (0.179334ms)
✔ FR-LEGAL-003 acceptance contract (0.081666ms)
✔ FR-INFRA-001 acceptance contract (0.686125ms)
✔ FR-INFRA-002 acceptance contract (0.043583ms)
✔ FR-INFRA-003 acceptance contract (0.047334ms)
✔ FR-AUTH-001 acceptance contract (0.035916ms)
✔ FR-AUTH-002 acceptance contract (0.077792ms)
✔ FR-AUTH-003 acceptance contract (0.073625ms)
✔ FR-OBS-001 acceptance contract (0.064ms)
✔ FR-ART-001 acceptance contract (0.05275ms)
✔ FR-PET-001 acceptance contract (0.042292ms)
✔ FR-PET-002 acceptance contract (0.044917ms)
✔ FR-PET-003 acceptance contract (0.073ms)
✔ FR-PET-004 acceptance contract (0.0285ms)
✔ FR-CARE-001 acceptance contract (0.040416ms)
✔ FR-CARE-002 acceptance contract (0.033417ms)
✔ FR-CARE-003 acceptance contract (0.058ms)
✔ FR-CARE-004 acceptance contract (0.045708ms)
✔ FR-CARE-005 acceptance contract (0.041667ms)
✔ FR-AI-001 acceptance contract (0.073916ms)
✔ FR-AI-002 acceptance contract (0.04525ms)
✔ FR-AR-001 acceptance contract (0.030708ms)
✔ FR-VIRAL-001 acceptance contract (0.033834ms)
✔ FR-PET-005 acceptance contract (0.073041ms)
✔ FR-PET-006 acceptance contract (0.028375ms)
✔ FR-PET-007 acceptance contract (0.081084ms)
✔ FR-PET-008 acceptance contract (0.05325ms)
✔ FR-SOCIAL-001 acceptance contract (0.066625ms)
✔ FR-SOCIAL-002 acceptance contract (0.056958ms)
✔ FR-SOCIAL-003 acceptance contract (0.042334ms)
✔ FR-SOCIAL-004 acceptance contract (0.030041ms)
✔ FR-VIRAL-002 acceptance contract (0.038708ms)
✔ FR-VIRAL-003 acceptance contract (0.056834ms)
✔ FR-ECON-001 acceptance contract (0.1145ms)
✔ FR-ECON-002 acceptance contract (0.033792ms)
✔ FR-ECON-003 acceptance contract (0.029958ms)
✔ FR-SUB-001 acceptance contract (0.030208ms)
✔ FR-SUB-002 acceptance contract (0.039708ms)
✔ FR-ADS-001 acceptance contract (0.055583ms)
✔ FR-ADS-002 acceptance contract (0.040667ms)
✔ FR-VIRAL-004 acceptance contract (0.030416ms)
✔ FR-VIRAL-005 acceptance contract (0.031792ms)
✔ FR-OBS-002 acceptance contract (0.047542ms)
✔ FR-I18N-001 acceptance contract (0.10825ms)
✔ FR-I18N-002 acceptance contract (0.049ms)
✔ FR-A11Y-001 acceptance contract (0.051083ms)
✔ FR-AI-003 acceptance contract (0.045625ms)
✔ FR-B2B-001 acceptance contract (0.028375ms)
✔ FR-B2B-002 acceptance contract (0.074416ms)
✔ FR-B2B-003 acceptance contract (0.023916ms)
✔ FR-B2B-004 acceptance contract (0.025791ms)
✔ FR-B2B-005 acceptance contract (0.030042ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 135.315709

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (4.630208ms)
✔ E2E-007 web QA console serves live browser-ready artifact (109.436084ms)
✔ E2E-001 standard player hatch-to-share journey (2.837958ms)
✔ E2E-002 under-13 safe account and family journey (0.718875ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.250709ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (3.340041ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (1.0085ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 259.389042

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

