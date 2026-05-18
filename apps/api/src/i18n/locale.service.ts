export type LocaleServiceDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class LocaleService {
  readonly kind = 'i18n';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): LocaleServiceDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'i18n.unsafe_input', auditEvent: 'i18n.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'i18n.disabled', auditEvent: 'i18n.blocked', tenantId };
    }
    return { allowed: true, reason: 'i18n.ok', auditEvent: 'i18n.accepted', tenantId };
  }
}

export const localeService = new LocaleService();
