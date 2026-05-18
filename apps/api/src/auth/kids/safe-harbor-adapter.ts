export type SafeHarborAdapterDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class SafeHarborAdapter {
  readonly kind = 'compliance';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): SafeHarborAdapterDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'compliance.unsafe_input', auditEvent: 'compliance.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'compliance.disabled', auditEvent: 'compliance.blocked', tenantId };
    }
    return { allowed: true, reason: 'compliance.ok', auditEvent: 'compliance.accepted', tenantId };
  }
}

export const safeHarborAdapter = new SafeHarborAdapter();
