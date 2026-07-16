---
id: TASK-B2B-003
title: "PetOS console — Next.js admin app for tenant operators · theme upload + quest CMS + KPI dashboard + entitlement tier config"
module: B2B
priority: MUST
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 2
owner: "Tech Lead + BD lead + designer"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-B2B-001, TASK-B2B-002, TASK-AUTH-001, TASK-LEGAL-001, TASK-OBS-001, TASK-INFRA-003, TASK-B2B-004, TASK-B2B-005]
depends_on: [TASK-B2B-001, TASK-B2B-002, TASK-AUTH-001]
blocks: [TASK-B2B-004, TASK-B2B-005]
effort_hours: 14
new_files:
  - "apps/petos-console/package.json"
  - "apps/petos-console/src/app/layout.tsx"
  - "apps/petos-console/src/app/page.tsx"
  - "apps/petos-console/src/app/theme/page.tsx"
  - "apps/petos-console/src/app/quests/page.tsx"
  - "apps/petos-console/src/app/kpi/page.tsx"
  - "apps/petos-console/src/app/billing/page.tsx"
  - "apps/petos-console/src/app/audit/page.tsx"
  - "apps/petos-console/src/lib/sso-handshake.ts"
  - "apps/petos-console/src/lib/__tests__/sso-handshake.spec.ts"
  - "infra/supabase/standard/migrations/20260517_034_petos_console.sql"
modified_files: []
allowed_tools:
  - "Next.js 15 + Tailwind"
  - "Apple/Google SSO for operator login"
  - "Supabase Auth for operator role"
  - "Cloudflare R2 for theme bundle upload"
disallowed_tools:
  - "Operator cross-tenant access without DPO grant"
  - "Theme upload bypassing signature (TASK-B2B-001 §1.14)"
  - "CMS string update without DPO review for kid-tenants"
risk_if_skipped: "B2B PetOS needs an operator self-service surface. Without it, every theme update / quest CMS change is a Tech Lead bottleneck."
audience_age_gate: "any"
---

## §1 — Specification (BCP-14 normative)

§1.1  **Operator SSO.** Operators authenticate via SSO (Apple/Google + corporate SAML if needed). Operator account binds to one tenant slug (or many for CyberSkill staff).

§1.2  **Entitlement tier.** Console enforces tier:
- **Setup-only** ($25K-150K one-off): operator can configure theme + quests; CyberSkill operates.
- **SaaS** ($2K-25K/mo): full self-service.
- **Rev-share** (15-30%): self-service + monthly settlement.
- **Per-MAU** ($0.05-0.20): self-service + monthly MAU billing.

§1.3  **Theme upload.** Operator uploads ZIP containing palette + logo + Spine skin JSON + override strings. Console validates signature, schema, and contract preservation.

§1.4  **Quest CMS.** Operator authors quests via web UI: title, description, trigger (sign-in, save 100K VND, etc.), reward (Coins). Saved to per-tenant CMS API consumed by TASK-B2B-001 manifest.

§1.5  **KPI dashboard.** Read-only dashboard: DAU/MAU, retention curves, IAP revenue, top quests by completion. Powered by TASK-OBS-001 per-tenant analytics workspace.

§1.6  **Audit log view.** Read-only audit timeline per TASK-LEGAL-001 + TASK-OBS-002 — DSR requests, ban events, theme uploads, etc.

§1.7  **Billing tab.** Per TASK-B2B-002 SLA + tier — monthly invoice, MAU usage, payment status.

§1.8  **DPO data export.** Operator can export tenant data (DSR-compliant) for offboarding. Atomic + signed.

§1.9  **Multi-operator support.** Tenant can have multiple operators with role: admin / editor / viewer. Audit logs operator action.

§1.10  **Endpoint — theme upload.** `POST /v1/petos/tenant/:slug/theme` — multipart upload + signature + validation.

§1.11  **Endpoint — quest list.** `GET /v1/petos/tenant/:slug/quests` + `POST` create + `PATCH` update + `DELETE`.

§1.12  **Endpoint — KPIs.** `GET /v1/petos/tenant/:slug/kpis?range=7d`.

§1.13  **No tenant cross-access.** Operators see only their tenant. Cross-tenant requires DPO grant per TASK-B2B-002 §1.8.

§1.14  **Audit retention.** 7 years.

§1.15  **Console hosted at admin.petos.tamagochi.app.** Separate hostname from consumer game.

§1.16  **DPO review of quest copy.** Per TASK-AI-002 + TASK-LEGAL-001 — kid-tenant quest copy requires DPO sign-off before live.

§1.17  **Staging vs production.** Operator can preview changes in staging environment before push-to-prod.

§1.18  **Bulk operations rate-limited.** Theme upload max 10/day per tenant; quest changes 100/day.

§1.19  **2FA mandatory.** Operator accounts require 2FA for any write action.

§1.20  **Analytics.** `petos.operator.login`, `petos.theme.uploaded`, `petos.quest.changed`, `petos.dsr.export_initiated` per TASK-OBS-001.

---

## §2 — Why this design

**Why Next.js console.** Plan §PART 6 — separate web app from game client. Different audience + auth model.

**Why operator entitlement tiers.** Plan §PART 6 — different B2B contracts.

**Why DPO review of quest copy for kids.** TASK-LEGAL-001 — kid-tenant content must pass review.

**Why staging environment.** Plan §PART 4 — operators need confidence before push-to-prod.

**Why bulk rate-limit.** Anti-abuse + accidental misconfig protection.

**Why 2FA mandatory.** Plan §PART 8 — operator account compromise = brand-blast risk.

---

## §3 — API contract & code shape

```typescript
// apps/petos-console/src/app/theme/page.tsx
export default function ThemePage() {
  const [file, setFile] = useState<File | null>(null);
  async function upload() {
    const form = new FormData();
    form.append('theme', file!);
    const r = await fetch(`/api/petos/tenant/${tenantSlug}/theme`, { method: 'POST', body: form });
    return r.json();
  }
  return <FileInput onChange={setFile} onUpload={upload} />;
}
```

```sql
create table public.petos_operators (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null references public.tenants(slug),
  email text not null,
  role text not null check (role in ('admin','editor','viewer')),
  invited_by uuid,
  joined_at timestamptz,
  last_seen_at timestamptz,
  unique (tenant_slug, email)
);

create table public.petos_audit_log (
  id bigserial primary key,
  tenant_slug text not null,
  operator_id uuid not null,
  action text not null,
  payload jsonb,
  occurred_at timestamptz not null default now()
);

create table public.tenant_quests (
  id text primary key,
  tenant_slug text not null references public.tenants(slug),
  title text not null,
  description text not null,
  trigger_type text not null,
  trigger_config jsonb,
  reward_coins int default 0,
  status text not null default 'draft' check (status in ('draft','staging','production','archived')),
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## §4 — Acceptance criteria

**AC1.** Operator can log in via SSO. Verified.
**AC2.** Theme upload signed validation. Verified.
**AC3.** Quest CMS create/edit/delete. Verified.
**AC4.** KPIs render per range. Verified.
**AC5.** Operator can't access other tenant. Verified.
**AC6.** Audit log captures actions. Verified.
**AC7.** DSR export atomic + signed. Verified.
**AC8.** Multi-operator roles enforced. Verified.
**AC9.** 2FA mandatory for writes. Verified.
**AC10.** Staging preview works. Verified.
**AC11.** DPO review enforced for kids tenants. Verified.
**AC12.** Bulk rate-limit. Verified.

---

## §5 — Verification

```typescript
describe('TASK-B2B-003 — PetOS console', () => {
  it('operator restricted to own tenant', async () => {
    await mockOperator('alice', 'techcombank', 'admin');
    await expect(api.get('/petos/tenant/viettel/quests', operatorToken('alice'))).rejects.toMatchObject({ status: 403 });
  });

  it('2FA required for theme upload', async () => {
    await expect(api.post('/petos/tenant/techcombank/theme', themeFile, opToken('alice', { '2fa': false }))).rejects.toMatchObject({ status: 401 });
  });

  it('kids tenant quest requires DPO review', async () => {
    await mockTenant('techcombank', { audience_default: 'under-13' });
    const r = await api.post('/petos/tenant/techcombank/quests', { title: 'Test', status: 'production' });
    expect(r.status).toBe(202); // pending DPO review
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/petos-console/src/lib/sso-handshake.ts
export async function ssoHandshake(provider: 'google' | 'apple' | 'saml'): Promise<{ token: string; tenant_slug: string; role: string }> {
  const r = await fetch(`/api/petos/auth/sso/${provider}`);
  if (!r.ok) throw new Error('sso.failed');
  const j = await r.json();
  return j;
}
```

---

## §7 — Dependencies

**External:** Apple/Google SSO; Next.js hosting (Vercel or Cloudflare).
**Internal:** TASK-B2B-001 (manifest base), TASK-B2B-002 (tenant partition), TASK-AUTH-001 (auth), TASK-OBS-001 (per-tenant analytics), TASK-LEGAL-001 (DPO).
**Blocks:** TASK-B2B-004/005.

---

## §8 — Example payloads

```http
POST /v1/petos/tenant/techcombank/theme
Authorization: Bearer <op-token>
X-2FA: 123456
multipart/form-data:
  theme: <ZIP>
→ 201 { "theme_version": "2026-08-01", "validated": true, "production_at": null }
```

```json
{ "event": "petos.theme.uploaded", "tenant": "techcombank", "operator": "alice@techcombank.com", "version": "2026-08-01" }
```

```json
{
  "kpis": {
    "dau_7d": [4200, 4350, 4180, 4500, 4620, 4480, 4720],
    "mau": 35000,
    "iap_revenue_usd_7d": 8430,
    "top_quests": [
      { "id": "save-100k", "completions_7d": 2401 }
    ]
  }
}
```

```json
{ "error": "petos.cross_tenant_forbidden", "tenant_requested": "viettel", "operator_tenant": "techcombank" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** SSO provider? → §1.1.
- **OQ-2 (resolved):** Tier entitlement? → §1.2.
- **OQ-3 (resolved):** DPO review? → §1.16.
- **OQ-4 (resolved):** Staging? → §1.17.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Theme validation fails | Signature check | Reject | Operator re-uploads |
| 2 | Cross-tenant access attempt | RLS | Rejected | Audit |
| 3 | 2FA bypass | Validation | Rejected | Investigate |
| 4 | DPO review backlog | Daily | Quests stuck draft | Hire reviewers |
| 5 | Operator compromise | Audit | Bulk damage | Disable account; rotate keys |
| 6 | KPI dashboard slow | Caching | UX issue | Cache layer |
| 7 | DSR export incomplete | Audit | Compliance gap | Manual completion |
| 8 | Operator role escalation | Audit | Privacy issue | DPO escalation |
| 9 | Bulk theme upload abuse | Rate-limit | Blocked | Adjust limit |
| 10 | Staging diff to prod | Visual regression | Customer surprise | Force review |
| 11 | Audit retention | DPO | 7-year | Configured |
| 12 | Console hosting outage | Vercel/CF | Unavailable | Multi-region |

---

## §11 — Notes

**Plan refs:** plan §PART 6 (PetOS console).

**Sub-decisions punted to ops:** Tier pricing negotiation; SAML integration per-tenant.

**Anti-patterns explicitly forbidden:**
- Cross-tenant operator access.
- Theme bypass signature.
- Kid-tenant quest without DPO review.

**Cross-reference:** TASK-B2B-001 manifest; TASK-B2B-002 partition; TASK-B2B-004 Techcombank; TASK-B2B-005 Viettel.
