export type BattlePassUiDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class BattlePassUi {
  readonly kind = 'media';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): BattlePassUiDecision {
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

export const battlePassUi = new BattlePassUi();
