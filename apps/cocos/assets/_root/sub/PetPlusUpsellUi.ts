export type PetPlusUpsellUiDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class PetPlusUpsellUi {
  readonly kind = 'pet';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): PetPlusUpsellUiDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'pet.unsafe_input', auditEvent: 'pet.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'pet.disabled', auditEvent: 'pet.blocked', tenantId };
    }
    return { allowed: true, reason: 'pet.ok', auditEvent: 'pet.accepted', tenantId };
  }
}

export const petPlusUpsellUi = new PetPlusUpsellUi();
