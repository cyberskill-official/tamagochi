---
id: FR-B2B-002
title: "Tenant partition — tenant_id on every table + Supabase RLS + Colyseus per-tenant rooms + per-tenant rate-limit"
module: B2B
priority: MUST
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-INFRA-002, FR-INFRA-003, FR-OBS-002, FR-B2B-001, FR-B2B-003, FR-B2B-004, FR-B2B-005, FR-OBS-001, FR-LEGAL-001]
depends_on: [FR-INFRA-003, FR-INFRA-002, FR-OBS-002, FR-B2B-001]
blocks: [FR-B2B-004, FR-B2B-005]
effort_hours: 14
new_files:
  - "apps/api/src/tenant/tenant-context.middleware.ts"
  - "apps/api/src/tenant/tenant-isolator.service.ts"
  - "apps/api/src/tenant/__tests__/tenant-isolation.spec.ts"
  - "infra/supabase/standard/migrations/20260517_033_tenant_rls_enforcement.sql"
modified_files:
  - "apps/api/src/supabase/client.ts"
  - "apps/realtime/src/rooms/_BaseTenantRoom.ts"
allowed_tools:
  - "Postgres RLS with current_setting('app.tenant_id')"
  - "Colyseus per-room tenant binding"
  - "Per-tenant rate-limit (FR-INFRA-002 §1.15)"
disallowed_tools:
  - "Cross-tenant data access (RLS enforced)"
  - "Tenant_id field omitted on any new table (CI check)"
  - "Tenant scope bypass for "system" admin user (no superuser path)"
risk_if_skipped: "B2B PetOS critical — tenant data isolation is a contractual + regulatory requirement. Without RLS + partition, Techcombank player data could be visible to Viettel admins, etc."
audience_age_gate: "any"
---

## §1 — Specification (BCP-14 normative)

§1.1  **Tenant_id on every table.** Every Postgres table holding player-facing data MUST have a `tenant_id text not null` column. CI lint enforces.

§1.2  **RLS using session variable.** Per FR-INFRA-003 §1.4 — every RLS policy uses `current_setting('app.tenant_id')`. Set on every Postgres connection via FR-INFRA-003 §1.5 RPC.

§1.3  **Tenant context middleware.** Nest middleware reads JWT claim `tenant_id` + sets `app.tenant_id` in the request-scoped Supabase connection. Per FR-INFRA-002 onAuth + FR-INFRA-003.

§1.4  **Colyseus tenant rooms.** Per FR-INFRA-002 §1.6 — TradeRoom, WeddingRoom, PetRoom keyed by `tenant_id`. Cross-tenant room joins rejected per `_BaseTenantRoom.onJoin`.

§1.5  **Per-tenant rate limits.** Each tenant has independent rate-limit budgets. Consumer 'mochi' DDoS doesn't affect B2B Techcombank.

§1.6  **Cross-tenant ban scope.** Per FR-OBS-002 §1.8 — bans apply per-tenant only. Anonymized signal shared.

§1.7  **No "superuser" cross-tenant role.** Even admins can only read one tenant at a time. Switching requires explicit context change.

§1.8  **DPO-only cross-tenant view.** A special `dpo_audit` view allows DPO to read across tenants for compliance — audit-logged + 7-year retention.

§1.9  **Per-tenant Storage buckets.** Per FR-INFRA-003 §1.16 — Storage scoped by tenant.

§1.10  **Per-tenant analytics workspace.** Per FR-OBS-001 §1.15.

§1.11  **Tenant migration tooling.** A user can be moved between tenants only via documented procedure: parental consent + DPO sign-off + audited transfer.

§1.12  **B2B SLA.** Tenant performance: ≥ 99.9% uptime, ≤ 200ms P95 API latency, ≤ 50ms p95 Colyseus message latency.

§1.13  **Per-tenant resource limits.** Each tenant has CPU/memory/storage quotas. Consumer 'mochi' largest budget; B2B tenants smaller (configurable per contract).

§1.14  **Cross-tenant fraud monitoring.** Per FR-OBS-002 §1.18 — anonymized fraud signals shared.

§1.15  **Tenant deletion runbook.** Removing a tenant: notice → 30-day grace → backup → atomic delete via DSR.

§1.16  **Audit retention per tenant.** Per FR-LEGAL-001.

§1.17  **CI lint — tenant column required.** Migration files reviewed; any new `create table` without `tenant_id` rejected.

§1.18  **No cross-tenant pet move.** Per FR-PET-001 — a pet's tenant is fixed at creation. Movement requires explicit DPO procedure.

§1.19  **Tenant-aware Sentry filtering.** Sentry events tagged with tenant; per-tenant dashboards.

§1.20  **Analytics.** `tenant.partition.cross_attempt`, `tenant.context.mismatch`, `tenant.dpo.audit_query` per FR-OBS-001.

---

## §2 — Why this design

**Why RLS over app-layer.** Plan §PART 4 — RLS is the canonical "no superuser SQL leak" pattern.

**Why session variable.** Per FR-INFRA-003 — `set_config` is the canonical Postgres pattern.

**Why no superuser cross-tenant.** Plan §PART 8 — even admins should not have lateral access by default.

**Why DPO-audit view.** Plan §PART 8 — regulator compliance occasionally requires cross-tenant query (e.g. cross-tenant DSR query).

**Why per-tenant SLA.** Plan §PART 6 — B2B customers expect SLAs.

**Why CI lint for tenant column.** Plan §PART 4 anti-cheat — forgetting tenant_id is a privacy bug.

---

## §3 — API contract & code shape

```typescript
// apps/api/src/tenant/tenant-context.middleware.ts
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly supa: TenantSupabase) {}
  async use(req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (user?.tenant_id) {
      await this.supa.forTenant(user.tenant_id);
    }
    next();
  }
}
```

```sql
-- migration: enforce tenant_id on policies
-- example template for all tables
create policy "tenant scoped read" on public.pets
  for select using (tenant_id = current_setting('app.tenant_id', true));

create policy "tenant scoped write" on public.pets
  for insert with check (tenant_id = current_setting('app.tenant_id', true));

-- DPO cross-tenant audit view (restricted to dpo role)
create or replace view public.dpo_pets_cross_tenant as select * from public.pets;
revoke all on public.dpo_pets_cross_tenant from public;
grant select on public.dpo_pets_cross_tenant to dpo;
```

---

## §4 — Acceptance criteria

**AC1.** Every table has tenant_id (CI lint). Verified.
**AC2.** RLS policies use current_setting. Verified.
**AC3.** Cross-tenant SELECT returns 0 rows. Verified.
**AC4.** Tenant context set per request. Verified.
**AC5.** Colyseus cross-tenant join rejected. Verified.
**AC6.** Per-tenant rate-limit independent. Verified.
**AC7.** Bans scoped to tenant. Verified.
**AC8.** DPO can audit cross-tenant. Verified.
**AC9.** Per-tenant Storage isolated. Verified.
**AC10.** Per-tenant analytics workspace. Verified.
**AC11.** Pet cross-tenant move forbidden without DPO. Verified.
**AC12.** SLA monitoring per tenant. Verified.

---

## §5 — Verification

```typescript
describe('FR-B2B-002 — partition', () => {
  it('cross-tenant SELECT returns nothing', async () => {
    await seedPet('mochi-user', 'mochi');
    await setTenantCtx('techcombank');
    const r = await supa.from('pets').select('*');
    expect(r.data).toEqual([]);
  });

  it('cross-tenant Colyseus join rejected', async () => {
    const tokenMochi = mintJwt({ tenant_id: 'mochi' });
    const tokenTcb = mintJwt({ tenant_id: 'techcombank' });
    const room = await client.joinOrCreate('pet-room', { token: tokenMochi });
    await expect(client.joinById(room.id, { token: tokenTcb })).rejects.toThrow(/cross_tenant/);
  });

  it('DPO cross-tenant view accessible', async () => {
    await setRole('dpo');
    const r = await supa.from('dpo_pets_cross_tenant').select('count');
    expect(r.error).toBeNull();
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/tenant/tenant-isolator.service.ts
@Injectable()
export class TenantIsolatorService {
  async assertTenantContext(supa: SupabaseClient, expected: string): Promise<void> {
    const { data } = await supa.rpc('current_app_tenant');
    if (data !== expected) throw new HttpException('tenant.context.mismatch', 500);
  }
}
```

---

## §7 — Dependencies

**External:** Postgres RLS; Sentry per-tag dashboards.
**Internal:** FR-INFRA-002 (Colyseus), FR-INFRA-003 (RLS), FR-OBS-002 (anti-cheat), FR-B2B-001 (manifest).
**Blocks:** FR-B2B-004 (Techcombank), FR-B2B-005 (Viettel).

---

## §8 — Example payloads

```json
{ "event": "tenant.partition.cross_attempt", "user_id": "01HU...", "user_tenant": "mochi", "attempted_tenant": "techcombank" }
```

```json
{ "tenant_sla_breached": false, "uptime_pct": 99.95, "latency_p95_ms": 142 }
```

```http
GET /v1/admin/tenant/techcombank/pets?dpo_audit=true
Authorization: Bearer <dpo-token>
→ 200 [...]
```

```sql
-- example RLS check
SELECT * FROM public.pets;  -- only returns rows where tenant_id = app.tenant_id
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** RLS vs app-layer? → §1.2 — RLS.
- **OQ-2 (resolved):** Superuser? → §1.7 — no.
- **OQ-3 (resolved):** DPO cross-tenant? → §1.8 — special view.
- **OQ-4 (resolved):** Pet cross-tenant move? → §1.18 — DPO procedure only.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | tenant_id NULL on insert | NOT NULL constraint | Insert rejected | Verified |
| 2 | RLS bypass | Audit | Privacy issue | DPO escalation |
| 3 | Session var not set | RLS returns 0 | Empty result | Middleware enforced |
| 4 | Cross-tenant Colyseus | _BaseTenantRoom catches | Rejected | Verified |
| 5 | Rate-limit cross-impact | Per-tenant budget | Independent | Verified |
| 6 | DPO audit accidentally bypasses RLS for non-DPO | Role check | Granted to dpo only | Verified |
| 7 | Tenant migration partial | Atomic tx | OK | Designed |
| 8 | Per-tenant SLA breach | Monitoring | Customer notify | Investigate |
| 9 | Storage bucket misconfigured | RLS | Inaccessible | Reconfigure |
| 10 | Analytics workspace mix | Manual review | Data ghosting | Audit |
| 11 | CI lint missed | Schema review | Privacy bug | Add to lint |
| 12 | Anti-cheat ban scope | Per-tenant | OK | Verified |

---

## §11 — Notes

**Plan refs:** plan §PART 4 multi-tenant; plan §PART 6 B2B SLA.

**Sub-decisions punted to ops:** Per-tenant SLA contract negotiation.

**Anti-patterns explicitly forbidden:**
- Cross-tenant superuser.
- tenant_id omitted on tables.
- Anti-cheat ban cross-tenant.

**Cross-reference:** FR-INFRA-003 RLS templates; FR-B2B-001 manifest; FR-B2B-003 console.
