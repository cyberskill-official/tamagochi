# Tamagochi — Task Backlog

**Owner:** Stephen Cheng (Founder, CyberSkill) · **Status:** v1.0.2 — rework mode; zero-touch revalidation coverage-passed, 2026-05-21
**Source of truth:** the markdown files in this folder. This index is regenerated when tasks land or change status.
**Source plan:** [`../Tamagotchi-Style Virtual Pet Game - Strategic Implementation Plan.md`](../Tamagotchi-Style%20Virtual%20Pet%20Game%20-%20Strategic%20Implementation%20Plan.md)
**Authoring playbook:** `task-audit` skill (see task skills) (project-local)
**Implementation log:** [`IMPLEMENTATION_LOG.md`](IMPLEMENTATION_LOG.md) — all tasks shipped in locked build order on 2026-05-17

---

## §0 — How to read this backlog

This document is the **single source of truth** for what the tamagochi consumer game (and the PetOS B2B engine that shares its codebase) is going to build, organised by **phase** (P0 → P4), then by **module**, then by **slice** within each module. Every row is one task; one task is one atomic, testable requirement.

- **Phase** maps to the capability arc in the source plan: `P0 Foundation Gate` (legal, infra, auth, observability) → `P1 Core Pet MVP` (one pet, AR, AI dialogue, TikTok export) → `P2 Social & Multi-Pet` (5 species + breeding + co-parent + trade + Daily Drama) → `P3 Monetization & Live-Ops` (IAP + Pet+ + Family + ads + battle pass) → `P4 Scale & PetOS B2B` (9-lang + A11Y + multi-tenant + bank/telco tenants). **Phases are capability gates, not time windows** — per the user directive of 2026-05-17.
- **Slice** is a coherent ship-unit within a module. Slice 1 is always the minimum viable surface for that module.
- **Priority** uses BCP-14 keywords — `MUST` (release blocker) · `SHOULD` (release should-have) · `COULD` (release nice-to-have) · `MAY` (post-release).
- **Status** flows: `draft → ready_to_implement → implementing → ready_to_review → reviewing → ready_to_test → testing → done` (or `on_hold` / `closed`).
- **Terminal markers:** row status `done` is terminal for the zero-touch state engine; implementation-quality modifiers are captured in audit evidence, not the lifecycle status.
- **Depends on** is the cross-FR dependency graph. An task cannot start `implementing` until its `depends_on` rows are all `done`.
- **Effort** is a rough sizing in hours (1h = 30 min focused work + 30 min coordination/review). Treat as ±50%. Sized for one experienced engineer (the VN team shape: 1 Tech Lead + 2 Cocos devs + 1 Node/TS backend dev + 1 designer/live-ops + 2 Spine artists + 1 UA + 0.5 QA from plan §G).
- **Age gate** is tamagochi-specific. `under-13` triggers COPPA-2025 + Safe Harbor surfaces in §1; `13+` is the global default; `any` means the task is regulator-agnostic (e.g. infra plumbing).

**Reading order for the founder/planner:** scan §1 (totals) → pick the phase you're working in → read the per-module breakdown in that phase → drill into individual task markdowns as you accept them.

**Reading order for the implementer:** find your assigned TASK-ID in the per-module section → click through to the task markdown → that file has the API contract, test harness, allowed-tools, implementation hints.

---

## §1 — Totals at a glance

| Phase | Modules in scope | tasks planned | Estimated effort (person-weeks) | Capability gate (exit signal) |
|---|---|---:|---:|---|
| **P0 — Foundation Gate** | LEGAL · INFRA · AUTH · OBS | **10** | ~6.0 | DPO appointed, DPIA filed with Ministry of Public Security A05, Cocos+Colyseus+Supabase scaffold live, Apple+Google+Zalo sign-in passing, observability green |
| **P1 — Core Pet MVP** | PET · CARE · AI · AR · VIRAL · ART | **14** | ~9.0 | 500 closed-beta testers playing; D7 retention ≥ 18% in beta cohort |
| **P2 — Social & Multi-Pet** | PET · SOCIAL · VIRAL | **10** | ~8.0 | k-factor ≥ 0.4; D30 ≥ 7%; trade scam-rate < 0.5% |
| **P3 — Monetization & Live-Ops** | ECON · SUB · ADS · VIRAL | **9** | ~7.5 | Sub conversion ≥ 3%; ARPDAU ≥ $0.05; no loot-box-related regulator complaints |
| **P4 — Scale & PetOS B2B** | I18N · A11Y · AI · B2B · OBS | **10** | ~10.0 | 2 anchor B2B tenants signed (one bank, one telco); $1M+ B2B ARR pipeline; consumer top-10 casual in 3+ countries |
| **Total** | 17 modules · 5 phases | **53** | **~40.5 person-weeks** | 5 capability gates |

**Effort budget reality-check:** 53 tasks × ~10h average = 530h ≈ 13.25 person-weeks of pure coding. The 40.5 person-weeks total accounts for design + legal review + QA + App Store / Play Store submissions + Zalo OA approval + Spine asset production + per-tenant B2B onboarding + multi-language QA. Maps roughly to ~40 weeks for one full-time Senior Tech Lead, consistent with the 12-month plan §J phasing (the plan estimates ~7-8 FTE for 12 months ≈ 350+ person-weeks team-wide; this backlog covers the ~40-week critical path one Tech Lead must drive personally).

**Phase-1 funding scope — what this backlog locks down today:** **all 53 tasks across P0+P1+P2+P3+P4** are spec-complete and 10/10 audited per the cyberos `task-audit skill §12` master rule (loop until perfect before next task). Per the user directive of 2026-05-17, no task sits below 10/10; no task is roadmap-only.

---

## §2 — P0 · Foundation Gate

**Phase goal:** stand up the cross-cutting infrastructure every gameplay feature depends on, with COPPA-2025 + Vietnam PDPL 2026 compliance wired from day one. By P0 exit, tamagochi has a legal entity decision (the CyberSkill JSC), a DPO appointed (Article 28 PDPL), DPIA filed with Ministry of Public Security (Article 24), a Cocos Creator 3.x TypeScript project scaffold building to iOS+Android+WebGL, a Colyseus Node/TS room server running on AWS Singapore, a Supabase Postgres + Auth + Storage tenant, Apple/Google/Zalo sign-in working, an under-13 invite-code flow gated through PRIVO / SuperAwesome kWS Safe Harbor, and the analytics + error-tracking stack (GameAnalytics + Mixpanel + AppsFlyer + Sentry) live.

**Compliance gates:**
- COPPA-2025 (US, effective April 22, 2026) — separate under-13 SKU; no behavioural ads; no LLM chat to under-13; Safe Harbor vendor retained.
- Vietnam PDPL Law 91/2025/QH15 + Decree 356/2025/ND-CP (effective Jan 1, 2026) — DPO appointed; DPIA + Cross-border TIA filed with Ministry of Public Security; 72-hour breach window automated.
- Apple Kids Category & Google Play Families baseline — declarations prepared for store submission.
- Loot-box compliance posture documented (Belgium ban, NL Antwerp 2025, EU DFA draft).

**Build order (locked):** LEGAL-001 → LEGAL-002 → LEGAL-003 → INFRA-001 (Cocos scaffold) → INFRA-002 (Colyseus) → INFRA-003 (Supabase) → AUTH-001 (Apple+Google) → AUTH-002 (Zalo) → AUTH-003 (under-13 invite-code + kWS) → OBS-001.

### P0.1 — LEGAL · compliance baseline

**Owner:** Founder + retained legal counsel (Tilleke/Rouse/EY-VN scope, ~$15–30K) · **Slice plan:** 1 slice, 3 tasks · **Plan refs:** plan §PART 8 legal & compliance.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-LEGAL-001** | COPPA-2025 + Vietnam PDPL 2026 compliance baseline — DPO appointed + DPIA filed + A05 breach-notification automation + Safe Harbor vendor (PRIVO / kWS) retained | MUST | done | — | 14h |
| **TASK-LEGAL-002** | Loot-box-free / deterministic-only policy — disclosure surfaces + drop-rate doc + Belgium/NL/EU posture (no real-money randomised loot boxes anywhere in tamagochi) | MUST | done | TASK-LEGAL-001 | 6h |
| **TASK-LEGAL-003** | Apple Kids Category + Google Play Families declarations + contextual-ad gate + parental-link external-purchase gate | MUST | done | TASK-LEGAL-001, TASK-LEGAL-002 | 6h |

### P0.2 — INFRA · Cocos client + Colyseus + Supabase scaffold

**Owner:** Tech Lead · **Slice plan:** 1 slice, 3 tasks · **Plan refs:** plan §PART 4 technical stack.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-INFRA-001** | Cocos Creator 3.x + TypeScript project scaffold building to iOS / Android / WebGL with ≤ 15 MB initial WebGL bundle + Spine + Lottie + Howler.js + asset-bundle CDN loader | MUST | done | — | 14h |
| **TASK-INFRA-002** | Colyseus stateful real-time room server (Node 22 + TypeScript) on AWS Singapore + sticky session via ELB + presence in Redis + room-handler scaffold | MUST | done | TASK-INFRA-001 | 12h |
| **TASK-INFRA-003** | Supabase Postgres + Auth + Storage + Edge Functions baseline with Row Level Security templates + tenant-id partition template for B2B + KMS-encrypted backups | MUST | done | TASK-INFRA-001 | 12h |

### P0.3 — AUTH · authentication baseline (Apple + Google + Zalo + kid invite-code)

**Owner:** Tech Lead + Intern (FE) · **Slice plan:** 1 slice, 3 tasks · **Plan refs:** plan §PART 4 auth, §PART 8 legal.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-AUTH-001** | Apple Sign-In + Google Sign-In via Supabase Auth + Cocos native bridge (Capacitor / Cocos native iOS-Android plugin) | MUST | done | TASK-INFRA-003 | 10h |
| **TASK-AUTH-002** | Zalo Sign-In (mandatory in VN) — Zalo OA SDK + Zalo OAuth Bearer + Supabase external provider config + privacy-policy URL surfaces | MUST | done | TASK-AUTH-001 | 8h |
| **TASK-AUTH-003** | Under-13 SKU invite-code flow — no email; PRIVO or SuperAwesome kWS Safe Harbor parental email-to-parent gate; invite code = 8-char alphanumeric tied to parent verified-account row | MUST | done | TASK-LEGAL-001, TASK-AUTH-001 | 12h |

### P0.4 — OBS · analytics + attribution + error tracking baseline

**Owner:** Tech Lead · **Slice plan:** 1 slice, 1 task · **Plan refs:** plan §PART 4 analytics & ops stack.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-OBS-001** | GameAnalytics (f2p funnel/economy) + Mixpanel (product analytics + feature flags) + AppsFlyer (UA attribution, with Adjust documented as fallback) + Sentry (errors) + Better Stack (uptime) baseline; under-13 SKU uses ONLY GameAnalytics + Sentry (no behavioural SDKs) | MUST | done | TASK-INFRA-001, TASK-INFRA-003, TASK-LEGAL-001 | 8h |

---

## §3 — P1 · Core Pet MVP

**Phase goal:** ship a single playable pet experience the founder will dogfood with 500 closed-beta testers. One pet species (the "Mochi" launch hero); hatch from egg → name → 90-second onboarding → daily feed / clean / hug / mini-game loop → AI-driven dialogue → AR placement on the floor → TikTok-native 9:16 export. Streak system with **forgiveness tokens** (no FOMO trauma for kids); local-time push that respects sleep hours. Spine 2D animation pipeline locked.

**Capability gate:** D7 retention ≥ 18% across the 500-beta-tester cohort, before P2 social work begins.

**Compliance gate:** Apple TestFlight + Google Internal Test approvals; closed-beta consent forms (adults only at this stage — under-13 SKU lands in P3 alongside Family tier).

**Build order (locked):** ART-001 (Spine pipeline first, blocks everything visual) → PET-001 → PET-002 → PET-003 → PET-004 → CARE-001..005 → AI-001 → AI-002 → AR-001 → VIRAL-001.

### P1.1 — ART · Spine 2D pipeline + audio

**Owner:** Tech Lead + 2 Spine artists · **Slice plan:** 1 slice, 1 task · **Plan refs:** plan §PART 5 art direction & UX.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-ART-001** | Spine 2D pet skeleton pipeline — 20-animation contract per pet (idle, eat, sleep, happy, sad, sick, dance, wave, 3 evolution stages × 2 moods), Cocos `sp.Skeleton` integration, asset bundling, Lottie UI micro-anim, Howler.js audio (8 loops + 80 SFX, mute-on default for kids per plan §PART 5) | MUST | done | TASK-INFRA-001 | 14h |

### P1.2 — PET · pet entity + evolution + stats + onboarding

**Owner:** Tech Lead · **Slice plan:** 1 slice, 4 tasks · **Plan refs:** plan §PART 3 game design, §PART 4 anti-cheat (server-authoritative).

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-PET-001** | Pet entity schema (Postgres `pets` table + Colyseus `PetState` schema) + hatch flow + naming with content-safety filter | MUST | done | TASK-INFRA-003, TASK-INFRA-002, TASK-ART-001 | 10h |
| **TASK-PET-002** | Pet evolution stages (egg → baby → teen → adult) + age timer (server-authoritative, wall-clock-resistant) + stage-gated unlocks | MUST | done | TASK-PET-001 | 8h |
| **TASK-PET-003** | Stat-bar model (hunger / cleanliness / happiness / energy) with decay rate per stage + caps + persistence + offline-decay reconciliation | MUST | done | TASK-PET-002 | 10h |
| **TASK-PET-004** | 90-second onboarding flow (Hatch → Name → first pat with haptic → optional "invite a friend to co-parent" entry point deferred until P2 → tutorial dismiss) | MUST | done | TASK-PET-001, TASK-PET-002, TASK-PET-003 | 8h |

### P1.3 — CARE · daily care loop (feed / clean / hug / mini-game / streak)

**Owner:** Tech Lead + designer · **Slice plan:** 1 slice, 5 tasks · **Plan refs:** plan §PART 3 core loop.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-CARE-001** | Feed action — server-authoritative consumable spend + hunger restore + Spine `eat` anim trigger + cooldown + analytics event | MUST | done | TASK-PET-003, TASK-ART-001 | 8h |
| **TASK-CARE-002** | Clean/bath action — soap consumable + cleanliness restore + bubble particle (Cocos Particle2D) + analytics event | MUST | done | TASK-PET-003, TASK-ART-001 | 6h |
| **TASK-CARE-003** | Hug/pet action — happiness restore + haptic feedback (CHHapticEngine on iOS, VibrationEffect on Android) + Spine `happy` anim + 24h soft cap to deter farming | MUST | done | TASK-PET-003, TASK-ART-001 | 6h |
| **TASK-CARE-004** | Mini-game framework — Cocos scene loader contract + 4 stock games (Tap-the-Mochi, Memory Match, Catch-the-Falling-Snacks, Rhythm Tap) + soft-currency payout (capped per session, server-validated) | MUST | done | TASK-INFRA-002, TASK-PET-003 | 14h |
| **TASK-CARE-005** | Streak system with **forgiveness tokens** — daily streak counter + 3 forgiveness tokens per month + "Cozy Hour" weekly double-currency window + ethical no-FOMO copy + sleep-hour respect | MUST | done | TASK-CARE-001, TASK-CARE-002, TASK-CARE-003, TASK-CARE-004 | 8h |

### P1.4 — AI · LLM pet personality + content safety

**Owner:** Tech Lead + designer · **Slice plan:** 1 slice, 2 tasks · **Plan refs:** plan §PART 4 AI/LLM.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-AI-001** | LLM pet personality — Claude Haiku primary, Gemini 2.0 Flash fallback; persona = ≤300-token YAML per pet + rolling 20-event memory; aggressive response cache; cost cap per pet per day | MUST | done | TASK-PET-002, TASK-INFRA-002 | 12h |
| **TASK-AI-002** | Content safety classifier (OpenAI Moderation primary, Azure Content Safety fallback) — gate every LLM input + output before delivery; **under-13 SKU has LLM fully disabled and uses scripted dialogue trees** | MUST | done | TASK-AI-001, TASK-LEGAL-001 | 8h |

### P1.5 — AR · Bedroom Cam placement

**Owner:** Tech Lead · **Slice plan:** 1 slice, 1 task · **Plan refs:** plan §PART 3 viral hooks #2.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-AR-001** | Bedroom Cam — ARKit on iOS, ARCore on Android; plane detection; "place pet on floor" tap; pet Spine anim continues in AR; capture 9:16 video to camera roll with watermark; graceful fallback to "Photo Studio" on unsupported devices | MUST | done | TASK-PET-001, TASK-ART-001 | 14h |

### P1.6 — VIRAL · TikTok-native export pipeline

**Owner:** Tech Lead + designer · **Slice plan:** 1 slice, 1 task · **Plan refs:** plan §PART 3 viral hooks #5, §PART 7 GTM.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-VIRAL-001** | TikTok-native vertical video export — 1080×1920 6-second clip; watermark "tamagochi.app"; trending-audio metadata pass-through; one-tap share intent (iOS Share Sheet, Android `ACTION_SEND`); hashtag prefilled `#mochilife #virtualpet` | MUST | done | TASK-AR-001, TASK-PET-002 | 10h |

---

## §4 — P2 · Social & Multi-Pet

**Phase goal:** turn the single-pet MVP into a social, multi-pet game. 5 launch species across 5 rarity tiers (Common / Rare / Epic / Mythic / Legendary, all earnable — no real-money loot boxes per TASK-LEGAL-002). Breeding system (two pets → child with mixed traits). Permadeath-Lite ("grandma's house" after 7 days neglect + free-ritual rescue). Friend graph with invite codes. **PetPair co-parent mode** — the viral wedge from Widgetable / Pengu / Pokipet. Trust-trade window that shows both sides exactly. Pet Wedding / Best Friend Ceremony as the share-worthy moment. Daily Drama procedural micro-events. Generative pet at adoption (text-prompt / selfie → one-of-one Spine palette).

**Capability gate:** k-factor ≥ 0.4; D30 ≥ 7%; trade-related scam-rate < 0.5%; ≥ 3 organic TikTok videos per week from beta testers.

**Build order (locked):** PET-005 (multi-pet inventory) → PET-006 (5 species + rarity) → PET-007 (breeding) → PET-008 (permadeath-lite) → SOCIAL-001 (friend graph) → SOCIAL-002 (PetPair) → SOCIAL-003 (trade window) → SOCIAL-004 (wedding) → VIRAL-002 (Daily Drama) → VIRAL-003 (generative pet).

### P2.1 — PET · multi-pet + species + breeding + permadeath-lite

**Owner:** Tech Lead + designer · **Slice plan:** 2 slices, 4 tasks · **Plan refs:** plan §PART 3 multi-pet, viral hooks #1/#4/#8.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-PET-005** | Multi-pet inventory — 3 slots free, 10 slots Pet+ (entitlement checks backed by TASK-SUB-001) | MUST | done | TASK-PET-001, TASK-PET-003 | 8h |
| **TASK-PET-006** | 5 launch species (Mochi / Pengu / Bao / Fluffit / Tako) × 5 rarity tiers — Common drop from hatch; Rare from streak rewards; Epic from event quests; Mythic from co-parent milestones; Legendary from breeding (NO real-money random pulls anywhere) | MUST | done | TASK-PET-005, TASK-LEGAL-002, TASK-ART-001 | 12h |
| **TASK-PET-007** | Breeding system — two pets ≥ adult stage + cooldown → child egg with deterministic trait inheritance (palette XOR + stat-bias from parents) + 24h incubation + revealed child appearance (Tamagotchi Paradise inheritance precedent) | MUST | done | TASK-PET-006 | 12h |
| **TASK-PET-008** | Permadeath-Lite — 7-day total neglect → pet "moves to grandma's house"; free 3-day daily-ritual rescue path (NO real-money revival anywhere; Belgian/Dutch revival-paywall ban precedent) | MUST | done | TASK-PET-003, TASK-LEGAL-002 | 10h |

### P2.2 — SOCIAL · friends + co-parent + trade + wedding

**Owner:** Tech Lead + designer · **Slice plan:** 2 slices, 4 tasks · **Plan refs:** plan §PART 3 viral hooks #1/#7.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-SOCIAL-001** | Friend graph — invite codes (8-char) + accept/reject + blocklist + Colyseus presence; under-13 SKU restricted to invite-code-only (no name search) per COPPA | MUST | done | TASK-AUTH-003, TASK-INFRA-002 | 10h |
| **TASK-SOCIAL-002** | **PetPair co-parent mode** — two phones share one pet; either co-parent can feed / clean / hug; receipt push to the other ("Linh fed Mochi while you were asleep ❤️"); "break-up screen" after 3 days of one-sided care | MUST | done | TASK-SOCIAL-001, TASK-CARE-001, TASK-CARE-002, TASK-CARE-003 | 14h |
| **TASK-SOCIAL-003** | Trust-trade window — both-sides-show confirm step (Adopt Me scam-crisis precedent); server-authoritative atomic swap; rate-limit per pair; no off-platform trades | MUST | done | TASK-PET-005, TASK-SOCIAL-001 | 12h |
| **TASK-SOCIAL-004** | Pet Wedding / Best Friend Ceremony — synchronous 2-player mini-event in shared Colyseus room; outcome unlocks a "married" cosmetic; auto-rendered share clip | SHOULD | done | TASK-SOCIAL-002, TASK-VIRAL-001 | 10h |

### P2.3 — VIRAL · Daily Drama + generative pet at adoption

**Owner:** Tech Lead + designer · **Slice plan:** 1 slice, 2 tasks · **Plan refs:** plan §PART 3 viral hooks #5/#8.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-VIRAL-002** | Daily Drama — procedural micro-events ("Mochi tried to eat your homework!"), 6-sec auto-rendered share clip, hashtag prefill, 1 event/day/pet cap | MUST | done | TASK-AI-001, TASK-VIRAL-001 | 10h |
| **TASK-VIRAL-003** | Generative pet at adoption — text-prompt or selfie → one-of-one Spine palette (palette generator service, server-side, with denylist for offensive prompts) | SHOULD | done | TASK-PET-006, TASK-AI-002, TASK-ART-001 | 12h |

---

## §5 — P3 · Monetization & Live-Ops

**Phase goal:** turn the social game into a freemium business. IAP cosmetics catalogue (no real-money randomised loot boxes anywhere). Pet+ subscription ($4.99/mo or $39.99/yr globally; ₫99K/mo or ₫799K/yr in VN). Family tier (parental dashboard, up to 5 child profiles). Rewarded video only (no interstitials — kid retention + regulator pressure). SuperAwesome kWS for under-13 contextual ads only. Battle pass / Cozy Hour. Push notifications (FCM iOS APNS) with sleep-hour respect and frequency caps.

**Capability gate:** Sub conversion ≥ 3% mature cohort; ARPDAU ≥ $0.05; zero loot-box-related regulator complaints; under-13 SKU still passing Apple Kids & Google Families re-reviews.

**Build order (locked):** ECON-001 (currency ledger) → ECON-002 (IAP catalogue) → ECON-003 (UGC Pet Couture) → SUB-001 (Pet+) → SUB-002 (Family) → ADS-001 (rewarded) → ADS-002 (kWS kid gate) → VIRAL-004 (battle pass) → VIRAL-005 (push).

### P3.1 — ECON · currency + IAP + UGC

**Owner:** Tech Lead + designer + UA · **Slice plan:** 2 slices, 3 tasks · **Plan refs:** plan §PART 6 monetization.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-ECON-001** | Currency ledger — soft "Coins" (earned from mini-games / streaks) + premium "Hearts" (paid only); server-authoritative double-entry ledger; anti-cheat impossible-state-transition ban | MUST | done | TASK-INFRA-003 | 12h |
| **TASK-ECON-002** | IAP catalogue — outfits ($0.99–4.99), room decor ($2.99), premium pet species (direct purchase $4.99–9.99 — never randomised); VN pricing ₫29K–229K; Apple/Google IAP plus VN MoMo / ZaloPay / VNPay / ViettelPay via Antom (MoR) | MUST | done | TASK-ECON-001, TASK-LEGAL-002 | 14h |
| **TASK-ECON-003** | Pet Couture UGC — in-app Spine-slot designer; submission queue + Trust & Safety review (manual + automated denylist); winning designs become buyable with 30% creator rev-share (Roblox UGC playbook) | COULD | done | TASK-ECON-002, TASK-ART-001 | 12h |

### P3.2 — SUB · Pet+ + Family

**Owner:** Tech Lead · **Slice plan:** 1 slice, 2 tasks · **Plan refs:** plan §PART 6 subscription Pet+.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-SUB-001** | Pet+ subscription — $4.99/mo or $39.99/yr (VN ₫99K/mo or ₫799K/yr) via Apple/Google IAP subscription products + Supabase entitlement service + restore-purchase + grace period | MUST | done | TASK-AUTH-001, TASK-ECON-001 | 12h |
| **TASK-SUB-002** | Family tier ($9.99/mo; VN ₫199K/mo) — up to 5 child profiles + parental dashboard (screen-time caps, spend caps, content filter) | SHOULD | done | TASK-SUB-001, TASK-AUTH-003 | 10h |

### P3.3 — ADS · rewarded video + kWS kid gate

**Owner:** Tech Lead + UA · **Slice plan:** 1 slice, 2 tasks · **Plan refs:** plan §PART 6 advertising.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-ADS-001** | Rewarded video via LevelPlay (IronSource) primary + AppLovin MAX waterfall fallback; NO interstitials anywhere; daily cap to avoid kid-retention damage | MUST | done | TASK-LEGAL-003, TASK-ECON-001 | 8h |
| **TASK-ADS-002** | Under-13 SKU SuperAwesome kWS contextual-only ad gate — never serve behavioural ads to under-13 accounts; on-device classifier + server enforcement | MUST | done | TASK-ADS-001, TASK-AUTH-003, TASK-LEGAL-001 | 8h |

### P3.4 — VIRAL · battle pass + push

**Owner:** Tech Lead + designer · **Slice plan:** 1 slice, 2 tasks · **Plan refs:** plan §PART 6 battle pass, §PART 3 retention.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-VIRAL-004** | Battle pass — $4.99 / 4 weeks; ~40 tiers; free + premium track; daily/weekly objectives; carry-over rules; entitlement via TASK-SUB-001 service | SHOULD | done | TASK-SUB-001, TASK-CARE-005 | 12h |
| **TASK-VIRAL-005** | Push notifications — FCM (Android) + APNS (iOS) via Supabase Edge Functions; sleep-hour respect (local 22:00–07:00 quiet); frequency caps (≤ 3/day); under-13 push subject to TASK-LEGAL-001 engagement-push restrictions | MUST | done | TASK-CARE-005, TASK-LEGAL-001 | 10h |

---

## §6 — P4 · Scale & PetOS B2B

**Phase goal:** prove the codebase scales internationally (9 languages, full A11Y pass, AI personality v2) AND that the multi-tenant **PetOS by CyberSkill** white-label engine is a fundable B2B wedge. Land **2 anchor tenants in year 1**: one Vietnamese bank (target: Techcombank junior account) and one Vietnamese telco (target: Viettel top-up loyalty). Multi-tenant architecture: single Cocos client + tenant-themed assets bundle (loaded from CDN by tenant slug); shared Colyseus/Postgres with tenant-id partition + RLS; separate analytics workspace per tenant. Anti-cheat hardened. Server-authoritative ledger audit.

**Capability gate:** 2 anchor B2B tenants under signed contract; $1M+ B2B ARR pipeline; consumer game top-10 in casual/simulation in 3+ countries.

**Build order (locked):** OBS-002 (anti-cheat audit, hardens everything below) → I18N-001 (localization pipeline) → I18N-002 (VN/PH/ID payments soft-launch) → A11Y-001 (WCAG-AA) → AI-003 (personality v2) → B2B-001 (multi-tenant client) → B2B-002 (tenant partition + RLS) → B2B-003 (PetOS console) → B2B-004 (Techcombank reference) → B2B-005 (Viettel reference).

### P4.1 — OBS · anti-cheat + ledger audit

**Owner:** Tech Lead · **Slice plan:** 1 slice, 1 task · **Plan refs:** plan §PART 4 anti-cheat, §PART 10 risks #7 trading-scam.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-OBS-002** | Anti-cheat + server-authoritative ledger audit — sign client→server messages with session secret; rate-limit per-IP and per-account; ban on impossible state transitions; daily reconciliation job (currency ledger ↔ event log) | MUST | done | TASK-ECON-001, TASK-INFRA-002, TASK-OBS-001 | 14h |

### P4.2 — I18N · localization + soft-launch payments

**Owner:** Tech Lead + UA · **Slice plan:** 2 slices, 2 tasks · **Plan refs:** plan §PART 5 localisation order, §PART 6 VN payments.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-I18N-001** | Localization pipeline — Crowdin integration; 9-language launch wave (EN, VI, ID, TH, PT-BR, ES-LATAM, JA, KO, ZH-Hant); diacritics-safe font fallback chain (Noto Sans VI for Vietnamese); RTL readiness hook for future Arabic | MUST | done | TASK-INFRA-001 | 12h |
| **TASK-I18N-002** | VN soft-launch payment rails — MoMo / ZaloPay / VNPay / ViettelPay via Antom (Merchant-of-Record); PH/ID launch via GCash / DANA via Xsolla MoR; pricing-per-tier table in `prices.yaml`; tax-inclusive display for VN | MUST | done | TASK-ECON-002 | 10h |

### P4.3 — A11Y · WCAG-AA baseline

**Owner:** Tech Lead + designer · **Slice plan:** 1 slice, 1 task · **Plan refs:** plan §PART 5 accessibility.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-A11Y-001** | WCAG-AA baseline — 4.5:1 contrast across all text; reduced-motion toggle (kills parallax + screen-shake); colour-blind palette swap (deuteranopia / protanopia / tritanopia); OpenDyslexic font option; VoiceOver / TalkBack labels on every interactive node | MUST | done | TASK-INFRA-001, TASK-ART-001 | 12h |

### P4.4 — AI · personality v2

**Owner:** Tech Lead · **Slice plan:** 1 slice, 1 task · **Plan refs:** plan §PART 3 viral hooks #3/#8.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-AI-003** | AI personality v2 — selfie-aware reactions ("you got a haircut!"); name-aware memory ("happy birthday Linh!"); multi-pet awareness (siblings reference each other); 13+ only (under-13 SKU stays scripted per TASK-AI-002) | SHOULD | done | TASK-AI-001, TASK-AI-002, TASK-PET-005 | 12h |

### P4.5 — B2B · PetOS multi-tenant engine

**Owner:** Tech Lead + BD lead (year 2 hire) · **Slice plan:** 3 slices, 5 tasks · **Plan refs:** plan §PART 6 B2B PetOS white-label.

| TASK-ID | Title | Pri | Status | Depends on | Effort |
|---|---|:-:|:-:|---|---:|
| **TASK-B2B-001** | Multi-tenant Cocos client — tenant slug resolved at boot; theme bundle (palette + logo + 3 mascot Spine skeletons + quest CMS strings) lazy-loaded from Cloudflare R2 by slug; consumer tenant = `cyberskill/mochi` | MUST | done | TASK-INFRA-001, TASK-ART-001, TASK-I18N-001 | 14h |
| **TASK-B2B-002** | Tenant partition — `tenant_id` column on every Postgres table + Supabase RLS templates; Colyseus rooms keyed by `tenant_id`; separate analytics workspace per tenant in GameAnalytics + Mixpanel; per-tenant rate-limit budget | MUST | done | TASK-INFRA-003, TASK-INFRA-002, TASK-OBS-002 | 14h |
| **TASK-B2B-003** | PetOS console — Next.js admin app for tenant operators; theme upload UI; quest CMS; KPI dashboard; entitlement (tier: setup-only / SaaS-monthly / rev-share / per-MAU) | MUST | done | TASK-B2B-002, TASK-AUTH-001 | 14h |
| **TASK-B2B-004** | Techcombank reference tenant — junior account pet that grows with savings; quest "Save 100K ₫ → feed pet a special meal"; financial-literacy quiz mini-game; Techcombank SSO bridge; per-account-holder unique mascot | SHOULD | done | TASK-B2B-003, TASK-CARE-004 | 14h |
| **TASK-B2B-005** | Viettel reference tenant — top-up your line → feed pet; daily-login → reduced data costs; Pet-of-Viettel loyalty mascot; Viettel SSO bridge; SIM-card-linked account binding | SHOULD | done | TASK-B2B-003, TASK-CARE-001 | 14h |

---

## §7 — Cross-cutting watch-items (every phase)

These are not tasks but live audit attention points lifted from plan §PART 10 (Risks & Success Factors). Each row maps to an existing task's `risk_if_skipped` field.

| Watch-item | Plan ref | task(s) where this lands |
|---|---|---|
| COPPA-2025 regulator action ($10M+ exposure) | §PART 10 risk #1 | TASK-LEGAL-001, TASK-AUTH-003, TASK-AI-002, TASK-ADS-002, TASK-VIRAL-005 |
| Vietnam PDPL Decree 356/2025 enforcement | §PART 10 risk #1, §PART 8 | TASK-LEGAL-001 (DPIA + A05 + 72h breach) |
| EU loot-box ban widens (Digital Fairness Act) | §PART 10 risk #2 | TASK-LEGAL-002, TASK-ECON-002, TASK-PET-006, TASK-PET-008 |
| Failure to differentiate from Pou/Talking Tom/Widgetable | §PART 10 risk #3 | TASK-AI-001 (LLM personality), TASK-SOCIAL-002 (PetPair), TASK-PET-007 (breeding) — the unfair combo |
| Apple/Google store policy changes for kids | §PART 10 risk #4 | TASK-LEGAL-003, TASK-AUTH-003, TASK-ADS-002, "13+" SKU fallback documented in TASK-LEGAL-003 |
| TikTok algorithm / ban shift | §PART 10 risk #5 | TASK-VIRAL-001 (multi-platform Reels/Shorts intent), TASK-VIRAL-002, TASK-VIRAL-003 |
| CPI inflation in soft-launch markets | §PART 10 risk #6 | TASK-I18N-002, TASK-OBS-001 (per-market UA-cost dashboard) |
| Trading-scam reputation crisis (Adopt Me precedent) | §PART 10 risk #7 | TASK-SOCIAL-003 (both-sides confirm), TASK-OBS-002 (anti-cheat) |
| Bandai IP enforcement | §PART 10 risk #8 | AGENTS.md §8.3 denylist; TASK-LEGAL-003 store-submission review |
| Burnout / single-founder dependency | §PART 10 risk #9 | This backlog assumes 1 Tech Lead + team — hire #2 commercial lead by month 6 per plan §J Phase 2 |
| B2B sales cycles longer than runway | §PART 10 risk #10 | P4 tasks gated on P0-P3 consumer milestones first; B2B treated as Year-2 upside per plan §J Phase 4 |
| Cocos engine + ecosystem risk (Chinese-origin vendor) | §PART 4 | TASK-INFRA-001 (Cocos pinned version + asset-budget guardrails); fall-back to Unity documented in TASK-INFRA-001 §11 |
| Colyseus single-vendor risk | §PART 4 | TASK-INFRA-002 (Nakama upgrade path documented in §11) |

---

## §8 — Manifest

Source state file: [`MANIFEST.json`](MANIFEST.json) — tracks per-module task counters and batch history. Maintained manually at MVP scale per `task-audit` skill (see task skills) §3.

When adding a new task:

1. Update the relevant phase + module section in this file.
2. Increment `MANIFEST.json` → `last_fr_id_per_module.<MODULE>`.
3. Create the task markdown in `docs/tasks/<module>/` following the workflow.
4. Two-round audit per workflow §5; reach 10/10 before `status: accepted`.

---

<!-- ZERO_TOUCH_REVALIDATION:START -->

## §9 — Zero-touch rework (2026-05-21)

Rework mode was enabled, so terminal `done` rows were force-re-evaluated from the start of the implementation phase. This ledger is derived from dependency order, declared deliverables, scaffold-marker detection, per-FR tests, E2E tests, QA checks, and final coverage.

**Stage:** coverage-passed
**Summary:** done: 53
**Edge-case matrix:** [EDGE_CASE_MATRIX_2026-05-21.md](EDGE_CASE_MATRIX_2026-05-21.md)
**Raw reports:** [pipeline/fresh-audits/](pipeline/fresh-audits/)

| # | TASK-ID | Derived state | External gate | Evidence |
|---:|---|---|---|---|
| 1 | TASK-LEGAL-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 2 | TASK-LEGAL-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 3 | TASK-LEGAL-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 4 | TASK-INFRA-001 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: Cocos Creator native builds require Cocos editor/Xcode/Android signing; local web QA and bundle tests are available. |
| 5 | TASK-INFRA-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 6 | TASK-INFRA-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 7 | TASK-AUTH-001 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: Apple/Google OAuth production validation requires provider credentials; signed local provider assertions are enforced in tests. |
| 8 | TASK-AUTH-002 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: Zalo OA approval and OAuth credentials are external; signed local provider assertions are enforced in tests. |
| 9 | TASK-AUTH-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 10 | TASK-OBS-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 11 | TASK-ART-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 12 | TASK-PET-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 13 | TASK-PET-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 14 | TASK-PET-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 15 | TASK-PET-004 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 16 | TASK-CARE-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 17 | TASK-CARE-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 18 | TASK-CARE-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 19 | TASK-CARE-004 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 20 | TASK-CARE-005 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 21 | TASK-AI-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 22 | TASK-AI-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 23 | TASK-AR-001 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: ARKit/ARCore require physical devices; Photo Studio fallback and AR decision logic are local. |
| 24 | TASK-VIRAL-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 25 | TASK-PET-005 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 26 | TASK-PET-006 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 27 | TASK-PET-007 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 28 | TASK-PET-008 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 29 | TASK-SOCIAL-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 30 | TASK-SOCIAL-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 31 | TASK-SOCIAL-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 32 | TASK-SOCIAL-004 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 33 | TASK-VIRAL-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 34 | TASK-VIRAL-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 35 | TASK-ECON-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 36 | TASK-ECON-002 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: Apple/Google/Antom/Xsolla receipts require merchant credentials; signed local receipt assertions are enforced in tests. |
| 37 | TASK-ECON-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 38 | TASK-SUB-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 39 | TASK-SUB-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 40 | TASK-ADS-001 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: LevelPlay/AppLovin SDK calls require ad-network credentials; local reward validation adapter is enforced in tests. |
| 41 | TASK-ADS-002 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: SuperAwesome kWS requires vendor credentials; contextual-only policy is enforced local. |
| 42 | TASK-VIRAL-004 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 43 | TASK-VIRAL-005 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 44 | TASK-OBS-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 45 | TASK-I18N-001 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: Crowdin sync requires a project token; locale bundle coverage is local. |
| 46 | TASK-I18N-002 | done | local signed/device adapter; production credentials/device required | Done with local signed/device adapter coverage; production gate remains: Antom/Xsolla rails require merchant credentials; pricing table validation is local. |
| 47 | TASK-A11Y-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 48 | TASK-AI-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 49 | TASK-B2B-001 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 50 | TASK-B2B-002 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 51 | TASK-B2B-003 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 52 | TASK-B2B-004 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |
| 53 | TASK-B2B-005 | done | none | Deliverables, unit tests, targeted task contract, E2E, and QA checks passed. |

<!-- ZERO_TOUCH_REVALIDATION:END -->

*End of tamagochi backlog v1.0.2. 53 tasks freshly revalidated across 5 capability-gated phases. Re-generate after every status change in the task files.*
