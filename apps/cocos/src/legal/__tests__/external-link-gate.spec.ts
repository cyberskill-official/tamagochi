export type ExternalLinkGateSpecDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class ExternalLinkGateSpec {
  readonly kind = 'compliance';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): ExternalLinkGateSpecDecision {
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

export const externalLinkGateSpec = new ExternalLinkGateSpec();
