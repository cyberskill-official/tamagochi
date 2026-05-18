export type DailyDramaServiceDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class DailyDramaService {
  readonly kind = 'ai';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): DailyDramaServiceDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'ai.unsafe_input', auditEvent: 'ai.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'ai.disabled', auditEvent: 'ai.blocked', tenantId };
    }
    return { allowed: true, reason: 'ai.ok', auditEvent: 'ai.accepted', tenantId };
  }
}

export const dailyDramaService = new DailyDramaService();
