export type FriendsControllerDecision = {
  allowed: boolean;
  reason: string;
  auditEvent: string;
  tenantId: string;
};

export class FriendsController {
  readonly kind = 'social';

  evaluate(input: { tenantId?: string; audience?: '13+' | 'under-13'; enabled?: boolean; unsafe?: boolean }): FriendsControllerDecision {
    const tenantId = input.tenantId ?? 'mochi';
    if (input.unsafe) {
      return { allowed: false, reason: 'social.unsafe_input', auditEvent: 'social.rejected', tenantId };
    }
    if (input.enabled === false) {
      return { allowed: false, reason: 'social.disabled', auditEvent: 'social.blocked', tenantId };
    }
    return { allowed: true, reason: 'social.ok', auditEvent: 'social.accepted', tenantId };
  }
}

export const friendsController = new FriendsController();
