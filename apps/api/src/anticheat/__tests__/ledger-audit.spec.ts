export type LedgerAuditSpecDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class LedgerAuditSpec {
  readonly kind = 'economy';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): LedgerAuditSpecDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'economy.unsafe_input', auditEvent: 'economy.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'economy.disabled', auditEvent: 'economy.blocked', tenantId };
    }
    return { allowed: true, reason: 'economy.ok', auditEvent: 'economy.accepted', tenantId };
  }
}

export const ledgerAuditSpec = new LedgerAuditSpec();
