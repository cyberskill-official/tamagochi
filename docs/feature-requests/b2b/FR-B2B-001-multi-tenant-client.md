---
id: FR-B2B-001
title: "Multi-tenant Cocos client — tenant slug at boot + theme bundle (palette + logo + Spine + CMS) via Cloudflare R2"
module: B2B
priority: MUST
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 1
owner: "Tech Lead + BD lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-INFRA-001, FR-ART-001, FR-I18N-001, FR-PET-006, FR-B2B-002, FR-B2B-003, FR-B2B-004, FR-B2B-005, FR-OBS-001]
depends_on: [FR-INFRA-001, FR-ART-001, FR-I18N-001]
blocks: [FR-B2B-002, FR-B2B-003, FR-B2B-004, FR-B2B-005]
effort_hours: 14
new_files:
  - "apps/cocos/assets/_root/tenant/TenantBootstrap.ts"
  - "apps/cocos/assets/_root/tenant/TenantThemeLoader.ts"
  - "apps/cocos/assets/_root/tenant/__tests__/TenantBootstrap.spec.ts"
  - "apps/api/src/tenant/tenant.controller.ts"
  - "apps/api/src/tenant/tenant.service.ts"
  - "apps/api/src/tenant/tenant-manifest.validator.ts"
  - "apps/api/src/tenant/__tests__/tenant-manifest.spec.ts"
  - "infra/supabase/standard/migrations/20260517_032_tenants.sql"
  - "docs/b2b/tenant-onboarding-runbook.md"
modified_files:
  - "apps/cocos/assets/_root/loaders/AssetBundleLoader.ts"
allowed_tools:
  - "Cloudflare R2 (per-tenant CDN)"
  - "Postgres tenant manifest"
  - "Spine skin override per tenant"
disallowed_tools:
  - "Tenant overrides that remove core animations (FR-ART-001 §1.2 contract)"
  - "Tenant cross-data sharing (FR-B2B-002 partition enforced)"
  - "Tenant slug guessing / brute-force (signed JWT or hostname-based resolution)"
risk_if_skipped: "Plan §PART 6 B2B PetOS — multi-tenant client is the load-bearing capability for white-label. Without it, B2B tenants (Techcombank, Viettel, etc.) require separate apps, not a config-driven extension."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Tenant slug resolution.** At app boot, the client resolves its tenant slug via one of:
- iOS/Android: bundle ID (e.g. `world.cyberskill.tamagochi` = consumer 'mochi'; `world.techcombank.junior-pet` = 'techcombank'; `world.viettel.pet-of-viettel` = 'viettel').
- Web: hostname (e.g. `mochi.tamagochi.app` = consumer; `kids.techcombank.com.vn` = techcombank tenant).

§1.2  **Tenant manifest fetch.** Cocos client calls `GET /v1/tenant/<slug>/manifest` returning tenant config: palette, logo URL, Spine skin override URL, CMS string bundle URL, feature flags. Manifest cached 5 min.

§1.3  **Theme bundle.** Tenant theme assets (palette + logo + Spine skin + per-species mascots) lazy-loaded from Cloudflare R2 by slug. Per FR-INFRA-001 §1.5 + 1.6 bundle budget — tenant override ≤ 4 MB.

§1.4  **Quest CMS.** Per-tenant quest strings + flow definitions loaded from CMS API. Tenant operators define quests via the PetOS console (FR-B2B-003).

§1.5  **Per-tenant feature flags.** Tenants opt-in/out of: AI personality v2, generative-pet adoption, breeding, trade window, AR, etc.

§1.6  **No contract violation.** Tenant overrides MAY change palette + accessories + names but MUST NOT remove FR-ART-001 §1.2 20-animation contract.

§1.7  **Endpoint — manifest.** `GET /v1/tenant/:slug/manifest` returns `{ slug, name, palette, logo_url, theme_bundle_url, locale_overrides, feature_flags, quest_cms_url }`.

§1.8  **Endpoint — list tenants.** `GET /v1/tenant/list` (admin-only) returns all configured tenants.

§1.9  **Tenant rate-limit budget.** Per FR-INFRA-002 §1.15 — each tenant has its own rate-limit budget. Consumer 'mochi' separate from B2B.

§1.10  **Locale + tenant interaction.** Tenant locale overrides FR-I18N-001 base strings via override JSON files. Per `i18n/tenants/<slug>/<locale>/*.json`.

§1.11  **Tenant audit retention.** 7 years for kids-adjacent tenants (e.g. Techcombank junior-banking-pet); 2-year for adult-only B2B.

§1.12  **Tenant slug validation.** Slug format `^[a-z0-9-]{2,32}$`. Forbidden: starts with `_`, contains uppercase, reserved words (`admin`, `api`, `internal`).

§1.13  **Tenant migration.** A tenant operator can request slug change via DPO sign-off → updates tenant_id on all related rows (carefully, atomic).

§1.14  **Bundle signature.** Tenant theme bundle MUST be signed by the operator's private key on PetOS console. Cocos client verifies signature before applying theme — anti-defacement.

§1.15  **Per-tenant analytics workspace.** Per FR-OBS-001 §1.15 — each tenant has its own GameAnalytics + Mixpanel workspace.

§1.16  **Tenant config DB.** `tenants` table: `(slug pk, name, owner_email, status, created_at, manifest_url, sku_origin, audience_default, billing_contact, dpa_signed_at)`.

§1.17  **Consumer 'mochi' is the default tenant.** Treated as a tenant for code-path simplicity. No special-casing.

§1.18  **Tenant onboarding runbook.** `docs/b2b/tenant-onboarding-runbook.md` documents steps: contract → DPA → slug registration → theme bundle upload → CMS config → analytics workspace → staging launch → production approval.

§1.19  **Tenant disable.** Admin can disable a tenant via flag; client at next boot sees "this tenant is unavailable" UX.

§1.20  **Analytics.** `tenant.bootstrap.success`, `tenant.theme_loaded`, `tenant.feature_flag.toggled`, `tenant.signature.invalid` per FR-OBS-001.

---

## §2 — Why this design

**Why slug-based resolution.** Plan §PART 6 — clean separation. Bundle ID / hostname routing is the canonical multi-tenant pattern.

**Why theme bundle on R2 not in-app.** Plan §PART 4 — dynamic per-tenant content cannot bake into the binary. R2 + CDN is correct.

**Why contract preserved.** FR-ART-001 §1.2 — all gameplay code assumes the 20 animations exist.

**Why per-tenant feature flags.** Plan §PART 6 — Techcombank may not want trading; FMCG may not want AI dialogue.

**Why bundle signature.** Plan §PART 4 anti-defacement — without signature, MITM could swap theme assets.

**Why per-tenant analytics workspace.** Plan §PART 6 — B2B customer wants their own dashboard.

---

## §3 — API contract & code shape

```typescript
// apps/cocos/assets/_root/tenant/TenantBootstrap.ts
export class TenantBootstrap {
  async resolveSlug(): Promise<string> {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.includes('techcombank')) return 'techcombank';
      if (host.includes('viettel')) return 'viettel';
      return 'mochi';
    }
    return sys.bundle_id_to_slug(sys.bundleId);
  }

  async load(slug: string): Promise<TenantManifest> {
    const r = await fetch(`/v1/tenant/${slug}/manifest`);
    if (!r.ok) throw new Error(`tenant.manifest.unavailable:${slug}`);
    const manifest = await r.json() as TenantManifest;
    if (!await this.verifySignature(manifest)) throw new Error('tenant.signature.invalid');
    return manifest;
  }
}
```

```typescript
// apps/api/src/tenant/tenant.controller.ts
@Controller('v1/tenant')
export class TenantController {
  @Get(':slug/manifest')
  async manifest(@Param('slug') slug: string) {
    return this.svc.manifest(slug);
  }
}
```

```sql
create table public.tenants (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,32}$'),
  name text not null,
  owner_email text not null,
  status text not null default 'staging' check (status in ('staging','active','disabled')),
  manifest_url text not null,
  sku_origin text check (sku_origin in ('standard','kids','both')),
  audience_default text default '13+',
  billing_contact jsonb,
  dpa_signed_at timestamptz,
  feature_flags jsonb not null default '{}',
  created_at timestamptz not null default now()
);
```

---

## §4 — Acceptance criteria

**AC1.** Slug resolution via bundle ID + hostname. Verified.
**AC2.** Manifest fetch returns valid config. Verified.
**AC3.** Theme bundle ≤ 4 MB enforced. Verified.
**AC4.** Contract animations preserved post-override. Verified.
**AC5.** Per-tenant rate-limit budget separate. Verified.
**AC6.** Tenant locale override resolves. Verified.
**AC7.** Tenant disable shows UX. Verified.
**AC8.** Bundle signature verified. Verified.
**AC9.** Per-tenant analytics workspace separated. Verified.
**AC10.** Slug format constraint enforced. Verified.
**AC11.** Migration path documented. Verified.
**AC12.** Audit retention per tenant. Verified.

---

## §5 — Verification

```typescript
describe('FR-B2B-001 — multi-tenant', () => {
  it('resolves mochi for consumer host', async () => {
    mockWindow({ hostname: 'tamagochi.app' });
    expect(await bootstrap.resolveSlug()).toBe('mochi');
  });

  it('rejects unsigned theme bundle', async () => {
    mockManifest({ signature: 'tampered' });
    await expect(bootstrap.load('techcombank')).rejects.toThrow(/signature.invalid/);
  });

  it('feature flag disables AI for tenant', async () => {
    await mockTenant('viettel', { feature_flags: { ai_personality: false } });
    const m = await svc.manifest('viettel');
    expect(m.feature_flags.ai_personality).toBe(false);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/_root/tenant/TenantThemeLoader.ts
export class TenantThemeLoader {
  async load(manifest: TenantManifest): Promise<void> {
    const themeBundle = await loadBundle(manifest.theme_bundle_url, { cdnPrefix: '', tenantSlug: manifest.slug });
    this.applyPalette(manifest.palette);
    this.applyLogo(manifest.logo_url);
    for (const species of manifest.species_overrides ?? []) {
      const skin = await themeBundle.load(`${species.id}/skin.json`, sp.SkeletonData);
      SpineLoader.registerTenantSkin(species.id, skin);
    }
  }
}
```

---

## §7 — Dependencies

**External:** Cloudflare R2; tenant DPA agreements.
**Internal:** FR-INFRA-001 (asset bundle loader + tenant slug), FR-ART-001 (Spine skin contract), FR-I18N-001 (locale overrides).
**Blocks:** FR-B2B-002/003/004/005.

---

## §8 — Example payloads

```http
GET /v1/tenant/techcombank/manifest
→ 200
{
  "slug": "techcombank",
  "name": "Techcombank Junior Pet",
  "palette": { "primary": "#fdcb02", "secondary": "#3a3a3a", ... },
  "logo_url": "https://cdn.tamagochi.app/techcombank/logo.png",
  "theme_bundle_url": "techcombank/theme-2026-08",
  "feature_flags": { "ai_personality": false, "breeding": false, "trade": false, "savings_quest": true },
  "audience_default": "under-13",
  "signature": "..."
}
```

```json
{ "event": "tenant.bootstrap.success", "slug": "techcombank", "manifest_version": "2026-08-01" }
```

```json
{ "error": "tenant.signature.invalid", "slug": "techcombank" }
```

```yaml
# tenant onboarding runbook excerpt
1. Sign master agreement + DPA
2. Receive tenant slug + admin credentials
3. Upload theme bundle to PetOS console (FR-B2B-003)
4. Configure quest CMS strings
5. DPO review
6. Staging launch (7 days)
7. Production approval
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** Slug routing? → §1.1.
- **OQ-2 (resolved):** Bundle on R2? → §1.3 + §2.
- **OQ-3 (resolved):** Contract preserved? → §1.6 + §2.
- **OQ-4 (resolved):** Signature? → §1.14.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Manifest URL unavailable | Cocos error | Fall back to consumer 'mochi' | UX hint |
| 2 | Theme bundle >4 MB | Asset budget CI | Build blocked | Compress |
| 3 | Signature forged | Verification | Reject | Audit |
| 4 | Contract animation missing from tenant skin | Lint | Reject | Reupload |
| 5 | Slug collision | Unique constraint | Rejected | Operator pick new slug |
| 6 | Tenant disabled mid-session | App detects on next boot | UX "unavailable" | Refer to operator |
| 7 | Migration breaks active sessions | Atomic tx | OK | Designed |
| 8 | Per-tenant locale missing | EN fallback | OK | i18n batch |
| 9 | Analytics workspace mis-config | Manual review | Data ghosting | Audit |
| 10 | DPA expires | Annual review | Compliance gap | Re-execute |
| 11 | Slug brute-force | Slug enumeration | Limited via hostname | Signed JWT path |
| 12 | Operator key compromised | Signature mismatch | Pause tenant | Rotate keys |

---

## §11 — Notes

**Plan refs:** plan §PART 6 PetOS B2B; plan §PART 4 multi-tenant architecture.

**Sub-decisions punted to ops:** Per-tenant DPA contract negotiation.

**Anti-patterns explicitly forbidden:**
- Removing core animations.
- Bake tenant into binary.
- Unsigned theme bundles.

**Cross-reference:** FR-B2B-002 (partition + RLS); FR-B2B-003 (PetOS console).
