export type I18nServiceDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class I18nService {
  readonly kind = 'i18n';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): I18nServiceDecision {
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

export const i18nService = new I18nService();
