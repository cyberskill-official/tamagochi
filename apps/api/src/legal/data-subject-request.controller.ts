export type DataSubjectRequestControllerDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class DataSubjectRequestController {
  readonly kind = 'compliance';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): DataSubjectRequestControllerDecision {
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

export const dataSubjectRequestController = new DataSubjectRequestController();
