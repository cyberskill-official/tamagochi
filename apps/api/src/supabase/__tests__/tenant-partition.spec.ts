export type TenantPartitionSpecDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class TenantPartitionSpec {
  readonly kind = 'media';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): TenantPartitionSpecDecision {
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

export const tenantPartitionSpec = new TenantPartitionSpec();
