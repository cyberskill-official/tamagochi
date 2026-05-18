export type RlsSpecDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class RlsSpec {
  readonly kind = 'tenant';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): RlsSpecDecision {
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

export const rlsSpec = new RlsSpec();
