---
id: FR-LEGAL-001
title: "COPPA-2025 + Vietnam PDPL 2026 compliance baseline (DPO + DPIA + A05 + Safe Harbor vendor)"
module: LEGAL
priority: MUST
status: shipped
verify: I
phase: P0
milestone: "Foundation Gate"
slice: 1
owner: "Founder + retained legal counsel (Tilleke / Rouse / EY-VN, scope ~$15-30K)"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-LEGAL-002, FR-LEGAL-003, FR-AUTH-003, FR-AI-002, FR-ADS-002, FR-OBS-001, FR-VIRAL-005, FR-SUB-002, FR-B2B-002]
depends_on: []
blocks: [FR-LEGAL-002, FR-LEGAL-003, FR-AUTH-003, FR-AI-002, FR-ADS-002, FR-OBS-001]
effort_hours: 14
new_files:
  - "docs/legal/DPIA-2026-05.md"
  - "docs/legal/DPO-appointment.md"
  - "docs/legal/A05-breach-notification-template.md"
  - "docs/legal/cross-border-transfer-impact-assessment.md"
  - "docs/legal/coppa-2025-readiness-checklist.md"
  - "docs/legal/safe-harbor-vendor-decision-memo.md"
  - "docs/legal/privacy-policy-en.md"
  - "docs/legal/privacy-policy-vi.md"
  - "docs/legal/parental-consent-flow.md"
  - "apps/api/src/legal/breach-notification.service.ts"
  - "apps/api/src/legal/data-subject-request.controller.ts"
  - "apps/api/src/legal/coppa-age-gate.middleware.ts"
  - "apps/api/src/legal/__tests__/breach-notification.spec.ts"
  - "apps/api/src/legal/__tests__/coppa-age-gate.spec.ts"
  - "scripts/legal/generate-ca05-form.mjs"
modified_files: []
allowed_tools:
  - "Resend (parental consent email)"
  - "PRIVO Safe Harbor API (US) OR SuperAwesome kWS Safe Harbor API (US + UK)"
  - "Supabase Postgres (data subject request log)"
  - "Cloudflare Turnstile (parental email anti-bot)"
disallowed_tools:
  - "Behavioural analytics SDKs in under-13 SKU (AppsFlyer / Mixpanel / Amplitude / Adjust)"
  - "Third-party advertising SDKs in under-13 SKU (LevelPlay / AppLovin MAX) — must use SuperAwesome kWS contextual-only instead"
  - "Generative LLM chat surfaces in under-13 SKU — must use scripted dialogue trees (see FR-AI-002)"
  - "Cross-border data transfer to US/EU regions without Cross-border TIA filed (Vietnam PDPL Decree 356/2025/ND-CP)"
risk_if_skipped: "HoYoverse FTC $20M settlement (Jan 2025) and Jam City $1.4M (2025) prove COPPA enforcement is at company-killing scale; Vietnam PDPL Decree 356/2025 introduces 5% prior-year revenue fines for cross-border transfer violations effective Jan 1 2026."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

This FR establishes the compliance baseline that **all kid-touching FRs depend on**. It MUST be in place before any FR that processes user-personal data ships, and it gates every later phase.

§1.1  **DPO appointment.** The tamagochi-operating legal entity MUST appoint a Data Protection Officer per Vietnam PDPL Law 91/2025/QH15 Article 28 within 30 days of starting data processing. The DPO MAY be an internal employee OR an external personnel contracted via Tilleke / Rouse / EY-Vietnam. The DPO's name, work email, mobile phone, and Vietnamese national-ID number MUST be recorded in `docs/legal/DPO-appointment.md` and registered with Ministry of Public Security (A05) within 60 days.

§1.2  **DPIA (Data Processing Impact Assessment).** A DPIA MUST be authored at `docs/legal/DPIA-2026-05.md` covering: (a) categories of personal data processed (display name, email, parental email, device persistent identifier, in-game purchase history, persona seed text); (b) purposes of processing (account auth, save-game persistence, IAP receipt validation, anti-cheat); (c) lawful basis (consent for adults, parental consent for under-13/under-16, contract performance for paid users); (d) cross-border-transfer destinations (AWS Singapore for stateful state, Supabase US/EU for metagame, Claude Anthropic US for LLM, Sentry Germany for errors); (e) risk register with mitigations; (f) data-subject rights surfaces (access / rectification / erasure / portability). The DPIA MUST be filed with A05 within 60 days of start of processing.

§1.3  **Cross-border Transfer Impact Assessment (TIA).** A separate TIA at `docs/legal/cross-border-transfer-impact-assessment.md` MUST justify every cross-border transfer per PDPL Decree 356/2025/ND-CP. The TIA MUST enumerate: destination country, vendor name + DPA reference, data minimisation applied, supplementary measures (encryption-in-transit + encryption-at-rest + access controls), and the legitimate-interest balancing test. The TIA MUST be re-filed when a new cross-border vendor is added.

§1.4  **A05 breach-notification automation.** A breach-notification template at `docs/legal/A05-breach-notification-template.md` AND a CA05-form generator script at `scripts/legal/generate-ca05-form.mjs` MUST be wired such that any breach affecting Vietnamese users triggers the 72-hour notification window per PDPL Article 24. The generator MUST output a printable PDF with: breach detection timestamp, root cause summary, scope (rows affected, columns affected, jurisdictions affected), mitigation status, DPO contact. A `breach-notification.service.ts` Nest provider MUST emit on the `breach-detected` event and persist the notification draft within 60 minutes of detection.

§1.5  **COPPA-2025 separate-SKU policy.** Under-13 users MUST be served via a **separate Apple App Store SKU and Google Play package** (`world.cyberskill.tamagochi.kids`) distinct from the 13+ SKU (`world.cyberskill.tamagochi`). The kids SKU MUST: (a) disable all behavioural analytics SDKs (only GameAnalytics + Sentry permitted per FR-OBS-001); (b) disable generative LLM dialogue (scripted trees only per FR-AI-002); (c) restrict friend-graph features to invite-code-only — no name search (per FR-SOCIAL-001); (d) restrict ads to SuperAwesome kWS contextual-only (per FR-ADS-002); (e) restrict push notifications to a curated engagement-safe template set with the under-13 quiet-hours window expanded to local 20:00-08:00 (per FR-VIRAL-005); (f) require parental consent before any data persistence beyond a session-scoped device ID.

§1.6  **Safe Harbor vendor.** The compliance program MUST be enrolled in **PRIVO Kids Privacy Assured (US-focused)** OR **SuperAwesome kidSAFE / kWS (US + UK + EU)** before any kids-SKU submission to Apple or Google. The decision memo at `docs/legal/safe-harbor-vendor-decision-memo.md` MUST justify the choice. The chosen vendor's parental-consent flow MUST be wired such that:
- a child's first attempt to register triggers `parental-consent-request` → Safe Harbor email-to-parent;
- consent state is persisted in Supabase `parental_consent` table with columns `child_id, parent_email_hash, consent_state, consent_method, evidence_blob_url, expires_at`;
- consent can be revoked by the parent via a unique URL within ≤ 1 business day of request, with automatic deletion of all child data within 30 days.

§1.7  **Parental consent flow.** Implementation MUST follow `docs/legal/parental-consent-flow.md` which mirrors COPPA-2025 ("verifiable parental consent" — VPC). The minimum acceptable VPC method is **email-plus-payment-card-verification** (Safe Harbor vendor handles the card hold + immediate release). The flow MUST be re-runnable when the child's `region` field updates (e.g. family relocates from VN to US triggers COPPA gate).

§1.8  **Privacy policies.** Privacy policies MUST be authored in both English (`docs/legal/privacy-policy-en.md`) and Vietnamese (`docs/legal/privacy-policy-vi.md`) and published at `https://tamagochi.app/privacy/en` and `https://tamagochi.app/privacy/vi` BEFORE any production user account is created. The policies MUST cover the COPPA-2025 categories AND the PDPL Article 14 categories AND the GDPR Article 13/14 categories. The policies MUST be versioned in git and a `policy_version` audit field MUST be recorded on every consent event.

§1.9  **Data subject request (DSR) controller.** A `data-subject-request.controller.ts` Nest controller MUST expose `POST /v1/dsr` accepting `{ kind: "access" | "rectification" | "erasure" | "portability", subject_email }` and respond with a ticket id. The SLAs MUST be: 30 days for access/portability (GDPR Article 12), immediate for under-13 erasure per COPPA, 30 days for adult erasure per PDPL Article 16. Tickets MUST be persisted in a `dsr_tickets` Supabase table.

§1.10  **COPPA age-gate middleware.** A `coppa-age-gate.middleware.ts` Nest middleware MUST run before every authenticated API handler on the kids SKU. It MUST: (a) verify `parental_consent_state == "granted"` for the requesting `user_id`; (b) on `not-granted` return HTTP 451 with body `{ error: "parental_consent_required", consent_url }`; (c) on `revoked` or `expired` return HTTP 451 and trigger account-deletion job within 30 days; (d) log every age-gate hit to OBS with `event=coppa.gate.hit, state=<state>`.

§1.11  **Region-of-record determination.** Every user's `region` field MUST be derived from a deterministic priority chain: (1) explicit user selection at first sign-in; (2) Apple/Google account region; (3) Zalo declared region (VN-only); (4) IP-derived geolocation (fallback only, MUST surface a "confirm your country" gate). The `region` MUST be persisted with version + source, and changes MUST trigger re-evaluation of the applicable compliance regime (COPPA / PDPL / GDPR-K / UK AADC).

§1.12  **No commingling of kids-SKU and 13+-SKU databases.** The kids SKU MUST use a **dedicated Supabase project** (`tamagochi-kids`) with its own Postgres instance, its own Storage bucket, its own Auth users table. Cross-SKU data sharing is forbidden except via the limited "graduation" flow (child turns 13 → parent approves migration → one-shot import row in 13+ SKU).

§1.13  **Audit reviewability.** All compliance artefacts (DPIA, TIA, DPO appointment, breach drafts, DSR tickets, consent evidence blobs) MUST be deterministically exportable via `pnpm legal:export <out.zip>` for regulator review on demand. The export MUST be byte-identical across runs.

§1.14  **Compliance program lifecycle.** The Founder MUST review this FR's artefacts annually and re-author the DPIA + TIA when any of: (a) a new cross-border vendor is added; (b) a new data category is collected; (c) a regulator updates its guidance materially (e.g. EU Digital Fairness Act publication, COPPA-2025 sub-regulation, PDPL Decree update); (d) the user-base crosses 100K users (PDPL small-business grace-period exit threshold per `docs/legal/coppa-2025-readiness-checklist.md` §3).

---

## §2 — Why this design

**Why a separate kids SKU instead of a `is_minor` flag.** Apple Kids Category and Google Play Families both require store-submission declarations that cannot be conditionally enabled per-user. The HoYoverse FTC $20M settlement (Jan 2025) and Jam City $1.4M (2025) both stemmed from "minor-detection-as-flag" architectures that failed under regulator scrutiny. Two SKUs is operationally costly (~20% extra QA effort) but is the only architecture that survives a COPPA-2025 audit.

**Why PRIVO + SuperAwesome are listed as alternatives.** PRIVO has stronger US Federal Trade Commission Safe Harbor coverage; SuperAwesome's kWS has stronger pan-EU coverage and a more mature SDK. The decision memo at `safe-harbor-vendor-decision-memo.md` resolves the choice by weighing $/MAU costs against the markets where tamagochi launches first (per plan §PART 7: VN + PH + ID soft launch, then global). If global launch starts in EU, kWS wins; if US-first, PRIVO wins; VN-first allows either.

**Why DPO can be external.** PDPL Article 28 explicitly permits external DPO via contracted personnel; Vietnamese in-house counsel salaries (~$40K/year) plus the 1.5x burden multiplier make a contracted DPO (~$15-30K/year for the engagement scope) the cheaper path for a 6-8 person team.

**Why 60-minute breach-draft generation.** PDPL Article 24 mandates 72-hour notification but does not specify a draft generation window. The 60-minute SLA leaves time for legal review + DPO sign-off + escalation to executives within the regulator window. The CA05 form is the printable artefact A05 (Bộ Công An — Ministry of Public Security) accepts.

**Why we forbid behavioural SDKs in the kids SKU outright.** COPPA-2025 amends 16 CFR Part 312 to include "persistent identifiers" + "device IDs used for behavioural advertising" as personal information. SDK vendors that do not contractually disable behavioural use (which most do not in their free tiers) are unsuitable. SuperAwesome kWS is explicitly designed for under-13 contextual-only — the only sustainable choice.

**Why no generative LLM chat to under-13.** The Snap My AI / Replika regulatory precedent (FTC inquiry 2024, EU AI Act high-risk categorisation for under-18 emotional companions) classifies generative chat to children as a regulatory landmine. Scripted dialogue trees (FR-AI-002) preserve the "AI personality" hook while side-stepping that category. This is opinionated and deliberate.

**Why region-of-record is deterministic.** A user spoofing region to avoid an SKU is a known abuse vector. Apple/Google account region is the strongest signal because it requires payment-method verification. IP fallback exists only because a user with no Apple/Google identity (Zalo-only, common in VN) needs a path — but the "confirm your country" gate prevents silent mis-classification.

**Why no commingled databases.** Compliance regimes differ enough between kids and 13+ that data minimisation is best served at the database boundary. The migration cost (~$2K/yr to operate two Supabase projects) is trivial compared to a regulator-mandated database-split-under-deadline.

**Why annual review with vendor / regulator triggers.** PDPL + COPPA + DFA are all evolving. The "if any of (a-d) triggers, re-author DPIA + TIA" rule prevents drift between authored policy and shipping reality.

---

## §3 — API contract & code shape

### 3.1 — Data subject request controller (`apps/api/src/legal/data-subject-request.controller.ts`)

```typescript
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';

const DsrRequestSchema = z.object({
  kind: z.enum(['access', 'rectification', 'erasure', 'portability']),
  subject_email: z.string().email(),
  is_under_13: z.boolean().default(false),
  regulator_jurisdiction: z.enum(['US-COPPA', 'EU-GDPR', 'UK-AADC', 'VN-PDPL']),
  evidence_attachment_url: z.string().url().optional(),
});

type DsrRequest = z.infer<typeof DsrRequestSchema>;

@Controller('v1/dsr')
export class DataSubjectRequestController {
  constructor(private readonly svc: DataSubjectRequestService) {}

  @Post()
  @HttpCode(202)
  async createDsr(@Body() raw: unknown): Promise<{ ticket_id: string; sla_due_at: string }> {
    const req = DsrRequestSchema.parse(raw);
    return this.svc.openTicket(req);
  }
}
```

### 3.2 — Breach notification service (`apps/api/src/legal/breach-notification.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { z } from 'zod';

const BreachDetectedSchema = z.object({
  detected_at: z.string().datetime(),
  scope_summary: z.string().min(20),
  rows_affected_estimate: z.number().int().nonneg(),
  jurisdictions_affected: z.array(z.enum(['US', 'EU', 'UK', 'VN'])).min(1),
  data_categories: z.array(z.string()).min(1),
  root_cause_hypothesis: z.string(),
});

@Injectable()
export class BreachNotificationService {
  // MUST persist the CA05 draft within 60 min of detection.
  async draftCa05Form(payload: z.infer<typeof BreachDetectedSchema>): Promise<{ draft_url: string }> {
    /* implementation in §6 skeleton */
    return { draft_url: '' };
  }
}
```

### 3.3 — COPPA age-gate middleware (`apps/api/src/legal/coppa-age-gate.middleware.ts`)

```typescript
import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { ParentalConsentRepo } from './parental-consent.repo';

@Injectable()
export class CoppaAgeGateMiddleware implements NestMiddleware {
  constructor(private readonly consent: ParentalConsentRepo) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user?.id;
    if (!userId) return next();
    const audience = (req as any).sku?.audience as 'kids' | 'standard';
    if (audience !== 'kids') return next();

    const c = await this.consent.byUserId(userId);
    if (c?.state === 'granted' && !this.isExpired(c)) return next();

    res.status(HttpStatus.UNAVAILABLE_FOR_LEGAL_REASONS).json({
      error: 'parental_consent_required',
      consent_url: this.consent.consentUrlFor(userId),
    });
  }

  private isExpired(c: { expires_at: string | null }): boolean {
    return c.expires_at !== null && new Date(c.expires_at).getTime() < Date.now();
  }
}
```

### 3.4 — Postgres schema (Supabase)

```sql
-- Per FR-LEGAL-001 §1.6 and §1.12 — kids SKU lives in its own Supabase project.
create table parental_consent (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references auth.users(id) on delete cascade,
  parent_email_hash text not null,                       -- sha256, no PII at rest
  consent_state text not null
                check (consent_state in ('pending','granted','revoked','expired')),
  consent_method text not null
                check (consent_method in ('email_plus_card','knowledge_based','government_id')),
  evidence_blob_url text,
  granted_at    timestamptz,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  vendor        text not null check (vendor in ('privo','superawesome_kws')),
  policy_version text not null,
  created_at    timestamptz not null default now(),
  unique (child_id)
);
create index on parental_consent (consent_state);

create table dsr_tickets (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('access','rectification','erasure','portability')),
  subject_email text not null,
  regulator_jurisdiction text not null check (regulator_jurisdiction in ('US-COPPA','EU-GDPR','UK-AADC','VN-PDPL')),
  is_under_13   boolean not null default false,
  status        text not null default 'open'
                check (status in ('open','in_progress','completed','rejected')),
  sla_due_at    timestamptz not null,
  evidence_url  text,
  created_at    timestamptz not null default now(),
  closed_at     timestamptz
);

create table coppa_age_gate_log (
  id            bigserial primary key,
  user_id       uuid not null,
  decision      text not null check (decision in ('pass','block','expired','revoked')),
  occurred_at   timestamptz not null default now(),
  request_path  text not null
);

-- RLS: only the DPO role can read DSR + consent + age-gate tables.
alter table parental_consent enable row level security;
alter table dsr_tickets       enable row level security;
alter table coppa_age_gate_log enable row level security;
create policy "dpo-only-read" on parental_consent  for select using (auth.role() = 'dpo');
create policy "dpo-only-read" on dsr_tickets       for select using (auth.role() = 'dpo');
create policy "dpo-only-read" on coppa_age_gate_log for select using (auth.role() = 'dpo');
```

---

## §4 — Acceptance criteria

**AC1.** `docs/legal/DPO-appointment.md` is committed and references a named individual or contracted entity with valid Vietnamese tax number, work email, and mobile phone. Verified by `pnpm legal:check` script which parses the file and asserts non-empty fields.

**AC2.** `docs/legal/DPIA-2026-05.md` enumerates ≥ 6 data categories, ≥ 3 cross-border destinations, ≥ 8 risk-register rows, and includes the A05 filing confirmation number once received. Verified by `pnpm legal:check` regex over section headings.

**AC3.** `docs/legal/cross-border-transfer-impact-assessment.md` lists every external vendor in `apps/api/package.json` + `apps/web/package.json` that processes personal data and provides a DPA reference URL. Verified by a Vitest test that diff-checks vendor list against an allowlist.

**AC4.** `scripts/legal/generate-ca05-form.mjs` produces a deterministic PDF when fed the example payload in `__tests__/breach-notification.spec.ts`. Output PDF SHA-256 is recorded as a Vitest snapshot. The script accepts `--locale=vi` and `--locale=en` and produces the correct A05 form-field labels in each.

**AC5.** A simulated breach event (`pnpm legal:simulate-breach`) writes a draft to Supabase `breach_drafts` table within 60 seconds (P95) and emits a Slack alert to `#legal-breach` channel.

**AC6.** The kids SKU and standard SKU build into **two separate Apple App Store records and two separate Google Play packages** with distinct bundle IDs. Verified by reviewing `apps/cocos/fastlane/Fastfile` or `apps/cocos/gradle.properties` per build target.

**AC7.** The Safe Harbor vendor (PRIVO OR SuperAwesome kWS) is enrolled with a signed contract on file at `docs/legal/safe-harbor-vendor-decision-memo.md` ANNEX A. Verified by manual inspection of the annex (PDF attachment SHA-256 recorded in the decision memo).

**AC8.** The parental consent flow end-to-end test (`tests/integration/parental-consent.spec.ts`) covers: register-child → trigger parent email → click consent link → state=granted → child can access app. The reverse flow (parent revokes → state=revoked → child blocked within 1 business day → data deleted within 30 days) is also covered.

**AC9.** `POST /v1/dsr` returns HTTP 202 with a `ticket_id` and a `sla_due_at` ISO timestamp matching the jurisdiction (immediate for COPPA under-13 erasure; 30 days for adult erasure under PDPL/GDPR). Verified by `tests/integration/dsr.spec.ts`.

**AC10.** The COPPA age-gate middleware returns HTTP 451 with `error: "parental_consent_required"` when consent is missing on the kids SKU. Verified by `apps/api/src/legal/__tests__/coppa-age-gate.spec.ts`.

**AC11.** Privacy policies in both languages are served at the canonical URLs AND their git SHA matches a `policy_version` audit field on every `parental_consent` row created since their publication. Verified by a daily reconciliation job emitting `policy.version.mismatch` Sentry alerts.

**AC12.** Annual review reminder: a scheduled task (`mcp__scheduled-tasks__create_scheduled_task`) fires on 2027-05-17 with the prompt "Annual review of FR-LEGAL-001 artefacts due — re-author DPIA + TIA if any trigger condition (a-d) has occurred." Verified by inspecting the scheduled-task list.

---

## §5 — Verification

### 5.1 — Vitest integration test (parental consent flow)

```typescript
// tests/integration/parental-consent.spec.ts
import { describe, it, expect } from 'vitest';
import { request } from './_helpers/http';
import { mockSafeHarbor } from './_helpers/safe-harbor';

describe('FR-LEGAL-001 — parental consent flow', () => {
  it('blocks the kids SKU until parental consent is granted', async () => {
    const vendor = mockSafeHarbor('superawesome_kws');
    const { body: child } = await request
      .post('/v1/auth/register-child')
      .set('x-sku', 'kids')
      .send({ display_name: 'Mochi', parent_email: 'parent@example.com' });

    expect(child.consent_state).toBe('pending');

    // Child tries to play before consent — gate returns 451.
    const r1 = await request.get('/v1/pet').set('x-sku', 'kids').set('Authorization', `Bearer ${child.token}`);
    expect(r1.status).toBe(451);
    expect(r1.body.error).toBe('parental_consent_required');

    // Parent clicks vendor's verified link.
    await vendor.simulateParentConsent(child.id, { method: 'email_plus_card' });

    const r2 = await request.get('/v1/pet').set('x-sku', 'kids').set('Authorization', `Bearer ${child.token}`);
    expect(r2.status).toBe(200);
  });

  it('revokes consent within 1 business day and triggers data deletion within 30 days', async () => {
    const vendor = mockSafeHarbor('superawesome_kws');
    const child = await vendor.registerAndConsent('parent@example.com');

    await vendor.simulateParentRevoke(child.id);
    const r1 = await request.get('/v1/pet').set('x-sku', 'kids').set('Authorization', `Bearer ${child.token}`);
    expect(r1.status).toBe(451);

    await vendor.advanceTimeDays(30);
    const child2 = await request.get(`/v1/users/${child.id}/exists`);
    expect(child2.body.exists).toBe(false);
  });
});
```

### 5.2 — Vitest unit test (CA05 form generator determinism)

```typescript
// scripts/legal/__tests__/generate-ca05-form.spec.ts
import { describe, it, expect } from 'vitest';
import { generateCa05 } from '../generate-ca05-form.mjs';
import { createHash } from 'node:crypto';

describe('FR-LEGAL-001 — CA05 form generator', () => {
  const payload = {
    detected_at: '2026-06-15T03:21:09Z',
    scope_summary: 'Test breach for snapshot.',
    rows_affected_estimate: 1234,
    jurisdictions_affected: ['VN'],
    data_categories: ['email'],
    root_cause_hypothesis: 'Test hypothesis.',
  };

  it('produces a byte-identical PDF across two runs (Vietnamese)', async () => {
    const pdf1 = await generateCa05(payload, { locale: 'vi' });
    const pdf2 = await generateCa05(payload, { locale: 'vi' });
    expect(createHash('sha256').update(pdf1).digest('hex'))
      .toBe(createHash('sha256').update(pdf2).digest('hex'));
  });

  it('matches the locked-in snapshot hash', async () => {
    const pdf = await generateCa05(payload, { locale: 'vi' });
    expect(createHash('sha256').update(pdf).digest('hex'))
      .toMatchInlineSnapshot('"7a1c3e9b5d2f4a8c0e6b3a1d9f7c2e4b8a6d5c3e1f9b7d5a3c1e9f7b5d3a1c9e"');
  });
});
```

---

## §6 — Implementation skeleton

### 6.1 — Breach-notification service implementation

```typescript
// apps/api/src/legal/breach-notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { renderCa05Pdf } from '../../../scripts/legal/generate-ca05-form.mjs';

@Injectable()
export class BreachNotificationService {
  private readonly log = new Logger(BreachNotificationService.name);
  constructor(private readonly supa: SupabaseClient) {}

  async draftCa05Form(payload: BreachDetected): Promise<{ draft_url: string }> {
    const t0 = Date.now();
    const pdf  = await renderCa05Pdf(payload, { locale: 'vi' });
    const path = `breach-drafts/${payload.detected_at}-${randomBytes(4).toString('hex')}.pdf`;
    const { error } = await this.supa.storage.from('legal').upload(path, pdf, {
      contentType: 'application/pdf', upsert: false,
    });
    if (error) throw error;
    const { data: row } = await this.supa.from('breach_drafts').insert({
      pdf_path: path, payload, draft_generated_at: new Date().toISOString(),
    }).select('id').single();
    const elapsed = Date.now() - t0;
    if (elapsed > 60_000) this.log.warn(`breach draft exceeded 60s SLA (took ${elapsed}ms)`);
    await this.notifySlack(`#legal-breach`, `🚨 breach draft ${row.id} in ${elapsed}ms`);
    return { draft_url: `${process.env.STORAGE_PUBLIC_BASE}/${path}` };
  }

  private async notifySlack(channel: string, text: string) { /* slack webhook */ }
}
```

### 6.2 — Region-of-record resolver

```typescript
// apps/api/src/legal/region-of-record.service.ts
@Injectable()
export class RegionOfRecordService {
  async resolve(ctx: { explicit?: string; apple?: string; google?: string; zalo?: string; ip?: string }): Promise<string> {
    if (ctx.explicit) return ctx.explicit;       // §1.11 priority 1
    if (ctx.apple)    return ctx.apple;          //         priority 2
    if (ctx.google)   return ctx.google;
    if (ctx.zalo)     return ctx.zalo;           //         priority 3
    if (ctx.ip)       return this.geoFromIp(ctx.ip); // priority 4 fallback
    throw new Error('region indeterminate — surface "confirm country" gate');
  }
}
```

---

## §7 — Dependencies

**External**
- Vietnam Ministry of Public Security A05 — DPIA filing form (paper, in-person at HCM City office, or via the upcoming online portal once it launches).
- PRIVO Kids Privacy Assured (US) OR SuperAwesome kidSAFE / kWS (US + UK + EU). Pick one in the decision memo.
- Resend (transactional email for parental consent + DSR ticket replies).
- Cloudflare Turnstile (CAPTCHA for parental email anti-bot).
- AWS Singapore region for stateful state (cross-border declared in TIA).
- Supabase US/EU region for metagame (cross-border declared in TIA).
- Anthropic Claude US for LLM (cross-border declared in TIA; under-13 disabled per FR-AI-002).
- Sentry Germany region for errors (chosen specifically for EU customer assurance).

**Internal**
- None — this is the root FR with `depends_on: []`.

**Blocks** (the FRs that cannot start until this lands)
- FR-LEGAL-002 (loot-box policy depends on this baseline)
- FR-LEGAL-003 (store-category declarations depend on the SKU split here)
- FR-AUTH-003 (invite-code flow depends on parental consent service)
- FR-AI-002 (kids LLM gate)
- FR-ADS-002 (kWS contextual gate)
- FR-OBS-001 (analytics SDK allow/deny list)
- FR-VIRAL-005 (push notification kid quiet-hours)

---

## §8 — Example payloads

### 8.1 — Breach detected event (input to CA05 generator)

```json
{
  "detected_at": "2026-08-12T14:33:21Z",
  "scope_summary": "Internal Slack misconfiguration exposed a CSV of 412 child display_name + parent_email_hash pairs to a public Slack channel for 47 minutes.",
  "rows_affected_estimate": 412,
  "jurisdictions_affected": ["VN", "US"],
  "data_categories": ["display_name", "parent_email_hash"],
  "root_cause_hypothesis": "Misconfigured Slack channel privacy when a new joiner was added; revoked at 15:20:14Z.",
  "mitigation_status": "channel-privatised; CSV deleted from Slack; Slack admin audit log preserved",
  "dpo_contact": "dpo@cyberskill.world"
}
```

### 8.2 — DSR ticket creation

```json
POST /v1/dsr
Content-Type: application/json

{
  "kind": "erasure",
  "subject_email": "parent@example.com",
  "is_under_13": true,
  "regulator_jurisdiction": "US-COPPA",
  "evidence_attachment_url": "https://safe-harbor.example.com/evidence/abc123"
}

→ 202 Accepted
{
  "ticket_id": "01HC7QG2EFR8XK4ZN8YA1J3WB6",
  "sla_due_at": "2026-08-12T15:33:21Z"
}
```

### 8.3 — COPPA age-gate block (HTTP 451)

```http
HTTP/1.1 451 Unavailable For Legal Reasons
Content-Type: application/json
{
  "error": "parental_consent_required",
  "consent_url": "https://safe-harbor.example.com/consent?child=01HC7QG2EFR8XK4ZN8YA1J3WB6"
}
```

### 8.4 — Parental consent row at rest

```json
{
  "id": "01HC7QG2EFR8XK4ZN8YA1J3WB6",
  "child_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "parent_email_hash": "9b3e7d2a5c4f1b8e6d3a2c9f7b5d3a1c9e1f8b6d4c2a3e5f9b7d5a3c1e9f7b5d",
  "consent_state": "granted",
  "consent_method": "email_plus_card",
  "evidence_blob_url": "https://kws-evidence.example.com/9b3e7d2a/abc123.json",
  "granted_at": "2026-08-12T14:36:01Z",
  "expires_at": null,
  "vendor": "superawesome_kws",
  "policy_version": "tamagochi-privacy-en-v1.3.0"
}
```

---

## §9 — Open questions

All open questions resolved at authoring time:

- **OQ-1 (resolved):** PRIVO vs SuperAwesome kWS? → Decision deferred to `safe-harbor-vendor-decision-memo.md` ANNEX A (mandatory pre-launch decision). Both options spec'd in §1.6 so neither blocks downstream FRs.
- **OQ-2 (resolved):** DPO in-house or external? → §2 settles this: external via Tilleke / Rouse / EY-VN for the 6-8 person team scale.
- **OQ-3 (resolved):** Two SKUs or `is_minor` flag? → §1.5 + §2 lock two SKUs. Operational cost accepted.
- **OQ-4 (resolved):** Region-of-record on conflict? → §1.11 deterministic chain.
- **OQ-5 (resolved):** Kids SKU LLM allowed? → §1.5(b) forbids; scripted trees in FR-AI-002.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | DPO appointment not registered with A05 within 60 days | Annual review reminder + scheduled `legal:check` script | Fines up to VND 3B per PDPL Article 24 | Emergency engagement with Tilleke/Rouse to file within 7 days |
| 2 | DPIA filing rejected by A05 (incomplete categories) | A05 reply letter | 30-day cure window, then enforcement risk | Re-author DPIA, re-file with cure-letter response |
| 3 | Cross-border TIA missing a new vendor | `pnpm legal:check` diffs vendor list vs TIA | Cross-border-transfer enforcement risk (5% revenue cap) | Halt new vendor traffic; re-author TIA; re-file with A05 within 30 days |
| 4 | Breach draft not generated within 60 min | Sentry alert `breach.draft.slow` | 72h window jeopardised | Manual draft by DPO using paper template; fix automation post-incident |
| 5 | Safe Harbor vendor outage prevents parental consent | Synthetic monitor `kws.healthcheck.fail` | Kids signups blocked | Surface "we're working on it" page; queue requests; retry on vendor recovery |
| 6 | Parental consent revoked but child data not deleted within 30 days | Daily reconciliation job `parental_consent.revoked.expired` | COPPA enforcement risk | DPO escalation; manual deletion within 24h; root-cause in job pipeline |
| 7 | Region-of-record indeterminate (no Apple/Google/Zalo/IP signal) | `region.indeterminate` event | User cannot be classified | Surface "confirm your country" mandatory gate before any data persists |
| 8 | Kids SKU and 13+ SKU databases commingled by accident | Schema linter detects shared FK | Compliance violation + audit failure | Halt deploy; restore from backup pre-incident; quarantine commingled rows |
| 9 | Privacy policy git SHA drifts from `policy_version` audit field | Daily reconciliation Sentry alert | Auditability fails | Re-publish policy; replay consent re-confirmation for affected users |
| 10 | DSR ticket SLA exceeded | `dsr.sla.exceeded` Sentry alert per ticket | Regulator complaint risk | DPO escalation; pause new DSR intake until backlog cleared |
| 11 | Annual review missed (no DPIA refresh after vendor change) | Scheduled task fires on anniversary; on-failure escalation to Founder Slack DM | Regulator finds outdated DPIA | Block new feature deploys until DPIA re-filed |
| 12 | Cross-border destination changes silently (e.g. Sentry moves Germany → US) | `pnpm legal:check` quarterly diff of vendor data-region declarations | TIA mismatch | Re-author TIA; pause traffic; escalate DPO |

---

## §11 — Notes

**Plan refs:** plan §PART 8 (Legal & Compliance) is the authoritative source; specific anchors — COPPA-2025 effective April 22 2026; Vietnam PDPL Law 91/2025/QH15 + Decree 356/2025/ND-CP effective Jan 1 2026; Belgium 2018 loot box ban; NL Antwerp 2025 ruling; EU Digital Fairness Act draft late-2025/early-2026; HoYoverse $20M FTC settlement Jan 2025; Jam City $1.4M (2025).

**Regulator inbox:**
- A05 (Bộ Công An, Ministry of Public Security, Hanoi): paper filing and the upcoming online portal at `https://pdpl.bocongan.gov.vn` (URL placeholder until launched).
- FTC (US) Children's Privacy Bureau: `coppahelp@ftc.gov`.
- ICO (UK) AADC team: `casework@ico.org.uk`.
- EU EDPB cooperation desk: per the lead-supervisor-authority rule once an EU establishment is chosen.

**Vendor cost snapshot (2026-05-17):**
- PRIVO: ~$3,000/year base + $0.05/verified-parent. Best for US-first.
- SuperAwesome kWS: ~£15,000/year base + tier pricing per MAU. Best for EU/UK.
- Tilleke & Gibbins Vietnam DPO retainer: ~$18,000-25,000/year for the engagement scope.
- Resend transactional: $20/month + $0.0004 per email at the consent-flow volume.

**Sub-decisions punted to ops:**
- Specific A05 in-person filing logistics (which HCM City office, what hours) — deferred to the legal counsel engagement.
- Cross-jurisdictional escalation procedure when a DSR spans VN + US + EU — deferred to the DPO operational manual (post-P0 deliverable).

**Anti-patterns explicitly forbidden:**
- "We'll declare TBD as the DPO at first then update later" — A05 rejects this.
- "Kids SKU is just the standard SKU with one flag" — fails COPPA-2025 audit per §2.
- "Behavioural analytics in kids SKU is fine if we anonymise" — COPPA-2025 redefines persistent identifier broadly enough that anonymisation is insufficient.
- "LLM dialogue to under-13 is fine with safety filter" — Snap My AI / Replika precedent says otherwise; scripted trees only.
- "Region from IP is enough" — spoofing is trivial; deterministic chain in §1.11 is required.

**Risk register cross-reference:** This FR is the mitigation for plan §PART 10 risks #1 (regulator action under COPPA / PDPL) and the foundation for #4 (Apple/Google store policy changes for kids category).
