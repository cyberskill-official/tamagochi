# Fresh Zero-Touch Revalidation - 2026-05-18

All pre-existing FR status labels were ignored. The state below was re-derived from files and tests during this run.

| State | Count |
|---|---:|
| shipped (10/10) + strict-audited | 44 |
| shipped (10/10) + mocked-dependency | 9 |

## Coverage

```text
✔ E2E-006 game session orchestrator passes all product journeys (22.028208ms)
✔ E2E-007 web QA console serves live browser-ready artifact (60.709208ms)
✔ E2E-001 standard player hatch-to-share journey (12.616209ms)
✔ E2E-002 under-13 safe account and family journey (0.671042ms)
✔ E2E-004 monetization and live-ops journey remains deterministic and non-randomized (0.256625ms)
✔ E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony (15.837417ms)
✔ E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants (0.92275ms)
✔ implementation registry covers every FR exactly once (1.004458ms)
✔ FR-LEGAL-001 acceptance contract (0.061458ms)
✔ FR-LEGAL-002 acceptance contract (0.205041ms)
✔ FR-LEGAL-003 acceptance contract (0.095042ms)
✔ FR-INFRA-001 acceptance contract (0.660458ms)
✔ FR-INFRA-002 acceptance contract (0.044416ms)
✔ FR-INFRA-003 acceptance contract (0.054041ms)
✔ FR-AUTH-001 acceptance contract (0.034916ms)
✔ FR-AUTH-002 acceptance contract (0.089125ms)
✔ FR-AUTH-003 acceptance contract (0.031375ms)
✔ FR-OBS-001 acceptance contract (0.063041ms)
✔ FR-ART-001 acceptance contract (0.05575ms)
✔ FR-PET-001 acceptance contract (0.048667ms)
✔ FR-PET-002 acceptance contract (0.0545ms)
✔ FR-PET-003 acceptance contract (0.075833ms)
✔ FR-PET-004 acceptance contract (0.028333ms)
✔ FR-CARE-001 acceptance contract (0.231583ms)
✔ FR-CARE-002 acceptance contract (0.314041ms)
✔ FR-CARE-003 acceptance contract (0.490084ms)
✔ FR-CARE-004 acceptance contract (0.087792ms)
✔ FR-CARE-005 acceptance contract (0.09ms)
✔ FR-AI-001 acceptance contract (0.109542ms)
✔ FR-AI-002 acceptance contract (0.058083ms)
✔ FR-AR-001 acceptance contract (0.044958ms)
✔ FR-VIRAL-001 acceptance contract (0.038709ms)
✔ FR-PET-005 acceptance contract (0.103833ms)
✔ FR-PET-006 acceptance contract (0.043709ms)
✔ FR-PET-007 acceptance contract (0.096583ms)
✔ FR-PET-008 acceptance contract (0.063375ms)
✔ FR-SOCIAL-001 acceptance contract (0.083708ms)
✔ FR-SOCIAL-002 acceptance contract (0.069917ms)
✔ FR-SOCIAL-003 acceptance contract (0.068334ms)
✔ FR-SOCIAL-004 acceptance contract (0.045667ms)
✔ FR-VIRAL-002 acceptance contract (0.055125ms)
✔ FR-VIRAL-003 acceptance contract (0.059375ms)
✔ FR-ECON-001 acceptance contract (0.141708ms)
✔ FR-ECON-002 acceptance contract (0.03325ms)
✔ FR-ECON-003 acceptance contract (0.0335ms)
✔ FR-SUB-001 acceptance contract (0.03125ms)
✔ FR-SUB-002 acceptance contract (0.036ms)
✔ FR-ADS-001 acceptance contract (0.05775ms)
✔ FR-ADS-002 acceptance contract (0.043ms)
✔ FR-VIRAL-004 acceptance contract (0.031125ms)
✔ FR-VIRAL-005 acceptance contract (0.034083ms)
✔ FR-OBS-002 acceptance contract (0.068916ms)
✔ FR-I18N-001 acceptance contract (0.028833ms)
✔ FR-I18N-002 acceptance contract (0.03625ms)
✔ FR-A11Y-001 acceptance contract (0.044916ms)
✔ FR-AI-003 acceptance contract (0.041334ms)
✔ FR-B2B-001 acceptance contract (0.028625ms)
✔ FR-B2B-002 acceptance contract (0.063084ms)
✔ FR-B2B-003 acceptance contract (0.023833ms)
✔ FR-B2B-004 acceptance contract (0.027791ms)
✔ FR-B2B-005 acceptance contract (0.023792ms)
✔ AI service covers persona, caching, moderation, cost caps, and kids scripted mode (2.959875ms)
✔ media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules (1.431875ms)
✔ social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony (0.675583ms)
✔ i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants (0.275083ms)
✔ legal service enforces compliance, SDK, branding, and loot-box rules (12.364958ms)
✔ auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation (0.559167ms)
✔ infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata (0.851833ms)
✔ observability service separates kids SDKs, tags events, and catches security drift (0.151875ms)
✔ pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue (4.076666ms)
✔ pet stat reconciliation and breeding are deterministic and tenant-safe (0.233583ms)
✔ care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours (0.244417ms)
✔ economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports (0.328ms)
ℹ tests 73
ℹ suites 0
ℹ pass 73
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 199.128625
ℹ start of coverage report
ℹ ------------------------------------------------------------------
ℹ file              | line % | branch % | funcs % | uncovered lines
ℹ ------------------------------------------------------------------
ℹ src               |        |          |         | 
ℹ  ai.ts            | 100.00 |    85.71 |  100.00 | 
ℹ  auth.ts          | 100.00 |   100.00 |  100.00 | 
ℹ  b2b.ts           | 100.00 |   100.00 |  100.00 | 
ℹ  care.ts          |  98.48 |    82.35 |  100.00 | 56
ℹ  economy.ts       | 100.00 |    92.86 |  100.00 | 
ℹ  game-session.ts  | 100.00 |   100.00 |  100.00 | 
ℹ  i18n-a11y.ts     | 100.00 |    85.71 |  100.00 | 
ℹ  index.ts         | 100.00 |   100.00 |  100.00 | 
ℹ  infra.ts         |  94.44 |   100.00 |   87.50 | 28-31
ℹ  legal.ts         |  98.15 |    86.67 |  100.00 | 45
ℹ  media.ts         | 100.00 |    86.96 |  100.00 | 
ℹ  observability.ts | 100.00 |   100.00 |  100.00 | 
ℹ  pet.ts           |  96.88 |    90.00 |   92.31 | 104 147-150
ℹ  registry.ts      | 100.00 |   100.00 |  100.00 | 
ℹ  social.ts        | 100.00 |   100.00 |  100.00 | 
ℹ  types.ts         | 100.00 |   100.00 |  100.00 | 
ℹ  utils.ts         | 100.00 |   100.00 |  100.00 | 
ℹ ------------------------------------------------------------------
ℹ all files         |  98.99 |    92.51 |   98.37 | 
ℹ ------------------------------------------------------------------
ℹ end of coverage report

exit_code=0
```

## Reports

- FR-LEGAL-001: docs/feature-requests/pipeline/fresh-audits/FR-LEGAL-001.md
- FR-LEGAL-002: docs/feature-requests/pipeline/fresh-audits/FR-LEGAL-002.md
- FR-LEGAL-003: docs/feature-requests/pipeline/fresh-audits/FR-LEGAL-003.md
- FR-INFRA-001: docs/feature-requests/pipeline/fresh-audits/FR-INFRA-001.md
- FR-INFRA-002: docs/feature-requests/pipeline/fresh-audits/FR-INFRA-002.md
- FR-INFRA-003: docs/feature-requests/pipeline/fresh-audits/FR-INFRA-003.md
- FR-AUTH-001: docs/feature-requests/pipeline/fresh-audits/FR-AUTH-001.md
- FR-AUTH-002: docs/feature-requests/pipeline/fresh-audits/FR-AUTH-002.md
- FR-AUTH-003: docs/feature-requests/pipeline/fresh-audits/FR-AUTH-003.md
- FR-OBS-001: docs/feature-requests/pipeline/fresh-audits/FR-OBS-001.md
- FR-ART-001: docs/feature-requests/pipeline/fresh-audits/FR-ART-001.md
- FR-PET-001: docs/feature-requests/pipeline/fresh-audits/FR-PET-001.md
- FR-PET-002: docs/feature-requests/pipeline/fresh-audits/FR-PET-002.md
- FR-PET-003: docs/feature-requests/pipeline/fresh-audits/FR-PET-003.md
- FR-PET-004: docs/feature-requests/pipeline/fresh-audits/FR-PET-004.md
- FR-CARE-001: docs/feature-requests/pipeline/fresh-audits/FR-CARE-001.md
- FR-CARE-002: docs/feature-requests/pipeline/fresh-audits/FR-CARE-002.md
- FR-CARE-003: docs/feature-requests/pipeline/fresh-audits/FR-CARE-003.md
- FR-CARE-004: docs/feature-requests/pipeline/fresh-audits/FR-CARE-004.md
- FR-CARE-005: docs/feature-requests/pipeline/fresh-audits/FR-CARE-005.md
- FR-AI-001: docs/feature-requests/pipeline/fresh-audits/FR-AI-001.md
- FR-AI-002: docs/feature-requests/pipeline/fresh-audits/FR-AI-002.md
- FR-AR-001: docs/feature-requests/pipeline/fresh-audits/FR-AR-001.md
- FR-VIRAL-001: docs/feature-requests/pipeline/fresh-audits/FR-VIRAL-001.md
- FR-PET-005: docs/feature-requests/pipeline/fresh-audits/FR-PET-005.md
- FR-PET-006: docs/feature-requests/pipeline/fresh-audits/FR-PET-006.md
- FR-PET-007: docs/feature-requests/pipeline/fresh-audits/FR-PET-007.md
- FR-PET-008: docs/feature-requests/pipeline/fresh-audits/FR-PET-008.md
- FR-SOCIAL-001: docs/feature-requests/pipeline/fresh-audits/FR-SOCIAL-001.md
- FR-SOCIAL-002: docs/feature-requests/pipeline/fresh-audits/FR-SOCIAL-002.md
- FR-SOCIAL-003: docs/feature-requests/pipeline/fresh-audits/FR-SOCIAL-003.md
- FR-SOCIAL-004: docs/feature-requests/pipeline/fresh-audits/FR-SOCIAL-004.md
- FR-VIRAL-002: docs/feature-requests/pipeline/fresh-audits/FR-VIRAL-002.md
- FR-VIRAL-003: docs/feature-requests/pipeline/fresh-audits/FR-VIRAL-003.md
- FR-ECON-001: docs/feature-requests/pipeline/fresh-audits/FR-ECON-001.md
- FR-ECON-002: docs/feature-requests/pipeline/fresh-audits/FR-ECON-002.md
- FR-ECON-003: docs/feature-requests/pipeline/fresh-audits/FR-ECON-003.md
- FR-SUB-001: docs/feature-requests/pipeline/fresh-audits/FR-SUB-001.md
- FR-SUB-002: docs/feature-requests/pipeline/fresh-audits/FR-SUB-002.md
- FR-ADS-001: docs/feature-requests/pipeline/fresh-audits/FR-ADS-001.md
- FR-ADS-002: docs/feature-requests/pipeline/fresh-audits/FR-ADS-002.md
- FR-VIRAL-004: docs/feature-requests/pipeline/fresh-audits/FR-VIRAL-004.md
- FR-VIRAL-005: docs/feature-requests/pipeline/fresh-audits/FR-VIRAL-005.md
- FR-OBS-002: docs/feature-requests/pipeline/fresh-audits/FR-OBS-002.md
- FR-I18N-001: docs/feature-requests/pipeline/fresh-audits/FR-I18N-001.md
- FR-I18N-002: docs/feature-requests/pipeline/fresh-audits/FR-I18N-002.md
- FR-A11Y-001: docs/feature-requests/pipeline/fresh-audits/FR-A11Y-001.md
- FR-AI-003: docs/feature-requests/pipeline/fresh-audits/FR-AI-003.md
- FR-B2B-001: docs/feature-requests/pipeline/fresh-audits/FR-B2B-001.md
- FR-B2B-002: docs/feature-requests/pipeline/fresh-audits/FR-B2B-002.md
- FR-B2B-003: docs/feature-requests/pipeline/fresh-audits/FR-B2B-003.md
- FR-B2B-004: docs/feature-requests/pipeline/fresh-audits/FR-B2B-004.md
- FR-B2B-005: docs/feature-requests/pipeline/fresh-audits/FR-B2B-005.md
