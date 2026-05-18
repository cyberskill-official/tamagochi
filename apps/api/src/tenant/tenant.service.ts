export type TenantServiceDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class TenantService {
  readonly kind = 'tenant';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): TenantServiceDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'tenant.unsafe_input', auditEvent: 'tenant.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'tenant.disabled', auditEvent: 'tenant.blocked', tenantId };
    }
    return { allowed: true, reason: 'tenant.ok', auditEvent: 'tenant.accepted', tenantId };
  }
}

export const tenantService = new TenantService();
