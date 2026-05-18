import type { TenantSlug, UserProfile } from './types.ts';
import { assert } from './utils.ts';

export class B2BService {
  readonly tenants = new Map<TenantSlug, { palette: string[]; analyticsWorkspace: string; rateLimit: number }>([
    ['mochi', { palette: ['#f8d66d', '#56a3a6'], analyticsWorkspace: 'ga-mochi', rateLimit: 10_000 }],
    ['techcombank', { palette: ['#e1251b', '#ffffff'], analyticsWorkspace: 'ga-techcombank', rateLimit: 2500 }],
    ['viettel', { palette: ['#008c44', '#ffffff'], analyticsWorkspace: 'ga-viettel', rateLimit: 2500 }]
  ]);

  resolveTheme(tenantSlug: TenantSlug): { tenantSlug: TenantSlug; bundlePath: string; mascotCount: 3 } {
    assert(this.tenants.has(tenantSlug), 'b2b.tenant_unknown');
    return { tenantSlug, bundlePath: `https://cdn.tamagochi.app/${tenantSlug}/theme`, mascotCount: 3 };
  }

  tenantContext(user: UserProfile, requestedTenant: TenantSlug): true {
    assert(user.tenantId === requestedTenant, 'tenant.context.mismatch');
    return true;
  }

  rlsSelect<T extends { tenantId: TenantSlug }>(rows: T[], tenantId: TenantSlug): T[] {
    return rows.filter((row) => row.tenantId === tenantId);
  }

  dpoAudit<T extends { tenantId: TenantSlug }>(rows: T[], role: string): T[] {
    assert(role === 'dpo', 'tenant.dpo_only');
    return rows;
  }

  consoleFeatures(): string[] {
    return ['theme upload', 'quest CMS', 'KPI dashboard', 'entitlement tiers', 'tenant SLA'];
  }

  techcombankReference(): { tenant: 'techcombank'; quest: string; sso: true; financialLiteracyQuiz: true } {
    return { tenant: 'techcombank', quest: 'Save 100K VND -> feed pet a special meal', sso: true, financialLiteracyQuiz: true };
  }

  viettelReference(): { tenant: 'viettel'; quest: string; sso: true; simBinding: true } {
    return { tenant: 'viettel', quest: 'Top up your line -> feed pet', sso: true, simBinding: true };
  }
}
