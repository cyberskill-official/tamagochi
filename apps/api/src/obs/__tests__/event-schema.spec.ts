export type EventSchemaSpecDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class EventSchemaSpec {
  readonly kind = 'observability';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): EventSchemaSpecDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'observability.unsafe_input', auditEvent: 'observability.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'observability.disabled', auditEvent: 'observability.blocked', tenantId };
    }
    return { allowed: true, reason: 'observability.ok', auditEvent: 'observability.accepted', tenantId };
  }
}

export const eventSchemaSpec = new EventSchemaSpec();
