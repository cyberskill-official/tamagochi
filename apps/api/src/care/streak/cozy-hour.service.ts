export type CozyHourServiceDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class CozyHourService {
  readonly kind = 'care';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): CozyHourServiceDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'care.unsafe_input', auditEvent: 'care.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'care.disabled', auditEvent: 'care.blocked', tenantId };
    }
    return { allowed: true, reason: 'care.ok', auditEvent: 'care.accepted', tenantId };
  }
}

export const cozyHourService = new CozyHourService();
