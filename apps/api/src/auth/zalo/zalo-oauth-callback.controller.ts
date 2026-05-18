export type ZaloOauthCallbackControllerDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class ZaloOauthCallbackController {
  readonly kind = 'auth';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): ZaloOauthCallbackControllerDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'auth.unsafe_input', auditEvent: 'auth.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'auth.disabled', auditEvent: 'auth.blocked', tenantId };
    }
    return { allowed: true, reason: 'auth.ok', auditEvent: 'auth.accepted', tenantId };
  }
}

export const zaloOauthCallbackController = new ZaloOauthCallbackController();
