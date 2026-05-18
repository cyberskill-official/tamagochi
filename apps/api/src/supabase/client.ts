export type ClientDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class Client {
  readonly kind = 'platform';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): ClientDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'platform.unsafe_input', auditEvent: 'platform.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'platform.disabled', auditEvent: 'platform.blocked', tenantId };
    }
    return { allowed: true, reason: 'platform.ok', auditEvent: 'platform.accepted', tenantId };
  }
}

export const client = new Client();
