---
fr_id: TASK-AR-001
audited: 2026-05-17
auditor: manual (engineering-spec template v1)
verdict: PASS_WITH_REVISIONS
score_pre_revision: 8.5/10
score_post_revision_1: 9.4/10
score_post_revision_2: 10/10
issues_open: 0
issues_resolved: 6
issues_critical: 0
template: engineering-spec@1
---

## §1 — Verdict summary

AR Bedroom Cam covers ARKit + ARCore native bridges, Photo Studio fallback for non-AR devices, horizontal-plane-only at P1, kids-SKU disabled (re-enabled P3), pet 30 cm fixed height, 15-sec 9:16 vertical recording with permanent watermark, no geometry persistence (privacy), stage gate (teen+adult), lighting estimation, server-side session log without device IDs. 6 ISS findings resolved → 10/10.

## §2 — Round-1 findings (resolved)

- **ISS-001 (error) ARWorldMap could leak via Sentry crash log.** Round-1: room geometry in crash data = privacy leak. **RESOLVED §10 row 10** — PII scrubber strips ARWorldMap fields.
- **ISS-002 (warning) Long AR session memory leak.** Round-1: extended sessions could crash. **RESOLVED §10 row 11** — teardown on background.

## §3 — Round-2 findings (resolved)

- **ISS-003 (warning) Watermark accidentally omitted at encode.** Round-2: build error could drop it. **RESOLVED §10 row 8** — CI verify watermark in test frame.
- **ISS-004 (info) AR fps drop on low-end devices.** Round-2: 30 fps target unrealistic on 1 GB Android. **RESOLVED §10 row 6** — graceful degrade.
- **ISS-005 (info) iPhone X+ feature gating.** Round-2: some AR features iPhone-12+ only. **RESOLVED §10 row 12** — capability check.
- **ISS-006 (info) Lighting estimation drift.** Round-2: erratic modulation. **RESOLVED §10 row 9** — cap strength.

## §4 — Strengths preserved

- Native bridge keeps AR maturity ahead of Cocos plugin availability.
- Photo Studio fallback preserves reach on non-AR Android.
- Kids SKU disabled at P1 + clear P3 reactivation path.
- Watermark permanent + verified in CI.
- No ARWorldMap persistence respects privacy.
- 15s + 1080x1920 + 30 fps matches TikTok/Reels native format.
- Lighting estimation increases immersion without complexity.
- Server-side session log captures abuse signals without leaking device IDs.

## §5 — Resolution

`score_post_revision_2: 10/10` — accept. TASK-AR-001 sets up TASK-VIRAL-001 export pipeline.
