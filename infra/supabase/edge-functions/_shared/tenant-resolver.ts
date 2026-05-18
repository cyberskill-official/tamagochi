export type TenantResolverDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class TenantResolver {
  readonly kind = 'media';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): TenantResolverDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'media.unsafe_input', auditEvent: 'media.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'media.disabled', auditEvent: 'media.blocked', tenantId };
    }
    return { allowed: true, reason: 'media.ok', auditEvent: 'media.accepted', tenantId };
  }
}

export const tenantResolver = new TenantResolver();
