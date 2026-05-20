# FR-AR-001 Fresh Zero-Touch Audit

**Derived state:** done
**Reason:** Done with local mock/sandbox coverage; production gate remains: ARKit/ARCore require physical devices; Photo Studio fallback and AR decision logic are local.
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

✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (2.122459ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (1.335417ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.297833ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.440583ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (1.418083ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.498209ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (1.332167ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.15225ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (4.785167ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.244625ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.864125ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.76025ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 130.920291

exit_code=0
```

### npm run test:fr -- --test-name-pattern FR-AR-001

```text
> tamagochi@0.1.0 test:fr
> node --test tests/fr-acceptance.test.ts --test-name-pattern FR-AR-001

✔ implementation registry covers every FR exactly once (1.451208ms)
✔ FR-LEGAL-001 acceptance contract (0.0735ms)
✔ FR-LEGAL-002 acceptance contract (0.272375ms)
✔ FR-LEGAL-003 acceptance contract (0.133834ms)
✔ FR-INFRA-001 acceptance contract (0.742458ms)
✔ FR-INFRA-002 acceptance contract (0.052667ms)
✔ FR-INFRA-003 acceptance contract (0.059125ms)
✔ FR-AUTH-001 acceptance contract (0.043708ms)
✔ FR-AUTH-002 acceptance contract (0.097166ms)
✔ FR-AUTH-003 acceptance contract (0.07425ms)
✔ FR-OBS-001 acceptance contract (0.067834ms)
✔ FR-ART-001 acceptance contract (0.060375ms)
✔ FR-PET-001 acceptance contract (0.0455ms)
✔ FR-PET-002 acceptance contract (0.047958ms)
✔ FR-PET-003 acceptance contract (0.063292ms)
✔ FR-PET-004 acceptance contract (0.031958ms)
✔ FR-CARE-001 acceptance contract (0.04075ms)
✔ FR-CARE-002 acceptance contract (0.03175ms)
✔ FR-CARE-003 acceptance contract (0.053209ms)
✔ FR-CARE-004 acceptance contract (0.042292ms)
✔ FR-CARE-005 acceptance contract (0.044625ms)
✔ FR-AI-001 acceptance contract (0.075875ms)
✔ FR-AI-002 acceptance contract (0.040416ms)
✔ FR-AR-001 acceptance contract (0.027583ms)
✔ FR-VIRAL-001 acceptance contract (0.027541ms)
✔ FR-PET-005 acceptance contract (0.067542ms)
✔ FR-PET-006 acceptance contract (0.025958ms)
✔ FR-PET-007 acceptance contract (0.078959ms)
✔ FR-PET-008 acceptance contract (0.058541ms)
✔ FR-SOCIAL-001 acceptance contract (0.066458ms)
✔ FR-SOCIAL-002 acceptance contract (0.059ms)
✔ FR-SOCIAL-003 acceptance contract (0.038417ms)
✔ FR-SOCIAL-004 acceptance contract (0.025667ms)
✔ FR-VIRAL-002 acceptance contract (0.033042ms)
✔ FR-VIRAL-003 acceptance contract (0.043917ms)
✔ FR-ECON-001 acceptance contract (0.103916ms)
✔ FR-ECON-002 acceptance contract (0.030083ms)
✔ FR-ECON-003 acceptance contract (0.027541ms)
✔ FR-SUB-001 acceptance contract (0.028583ms)
✔ FR-SUB-002 acceptance contract (0.046792ms)
✔ FR-ADS-001 acceptance contract (0.050375ms)
✔ FR-ADS-002 acceptance contract (0.039291ms)
✔ FR-VIRAL-004 acceptance contract (0.025541ms)
✔ FR-VIRAL-005 acceptance contract (0.039042ms)
✔ FR-OBS-002 acceptance contract (0.044792ms)
✔ FR-I18N-001 acceptance contract (0.021625ms)
✔ FR-I18N-002 acceptance contract (0.027042ms)
✔ FR-A11Y-001 acceptance contract (0.04375ms)
✔ FR-AI-003 acceptance contract (0.044ms)
✔ FR-B2B-001 acceptance contract (0.032ms)
✔ FR-B2B-002 acceptance contract (0.067083ms)
✔ FR-B2B-003 acceptance contract (0.021875ms)
✔ FR-B2B-004 acceptance contract (0.024541ms)
✔ FR-B2B-005 acceptance contract (0.027125ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 126.219208

exit_code=0
```

### npm run test:e2e

```text
> tamagochi@0.1.0 test:e2e
> node --test tests/e2e/*.test.ts

✔ E2E-006 game session orchestrator passes all product journeys (6.428958ms)
✔ E2E-007 web QA console serves live browser-ready artifact (108.111333ms)
✔ E2E-001 standard player hatch-to-share journey (2.785291ms)
✔ E2E-002 under-13 safe account and family journey (1.490375ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.268541ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (2.061583ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.984375ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 249.451792

exit_code=0
```

### npm run qa:check

```text
> tamagochi@0.1.0 qa:check
> node scripts/qa-check.mjs

QA check passed: README, PRD, SRS, social schedule, 53 test-case mappings, 3 unit files, 3 E2E files, no placeholder markers.

exit_code=0
```

