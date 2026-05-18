import type { Provider, TenantSlug, UserProfile } from './types.ts';
import { assert, deterministicCode, hash } from './utils.ts';

interface Invite {
  code: string;
  parentEmailHash: string;
  vendor: 'PRIVO' | 'SuperAwesome kWS';
  verified: boolean;
  tenantId: TenantSlug;
}

export class AuthService {
  readonly users = new Map<string, UserProfile>();
  readonly invites = new Map<string, Invite>();
  readonly privacyPolicyUrls = {
    zalo: 'https://tamagochi.app/privacy/zalo',
    apple: 'https://tamagochi.app/privacy/apple',
    google: 'https://tamagochi.app/privacy/google'
  };

  signIn(provider: Provider, token: string, tenantId: TenantSlug = 'mochi'): UserProfile {
    assert(token.length >= 8, 'auth.invalid_oauth_token');
    if (provider === 'zalo') assert(this.privacyPolicyUrls.zalo.startsWith('https://'), 'auth.zalo_privacy_url_missing');
    const user: UserProfile = {
      id: `${provider}_${hash(token, 12)}`,
      tenantId,
      audienceAgeGate: '13+',
      provider
    };
    this.users.set(user.id, user);
    return user;
  }

  createKidInvite(parentEmail: string, vendor: 'PRIVO' | 'SuperAwesome kWS' = 'PRIVO', tenantId: TenantSlug = 'mochi'): Invite {
    assert(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parentEmail), 'auth.parent_email_invalid');
    const code = deterministicCode(`${parentEmail}:${vendor}:${tenantId}`);
    const invite = { code, parentEmailHash: hash(parentEmail), vendor, verified: false, tenantId };
    this.invites.set(code, invite);
    return invite;
  }

  verifyKidInvite(code: string): UserProfile {
    const invite = this.invites.get(code);
    assert(invite, 'auth.invite_not_found');
    invite.verified = true;
    const child: UserProfile = {
      id: `kid_${hash(code, 12)}`,
      tenantId: invite.tenantId,
      audienceAgeGate: 'under-13',
      parentVerified: true
    };
    this.users.set(child.id, child);
    return child;
  }

  assertKidCanCreatePet(user: UserProfile): true {
    assert(user.audienceAgeGate !== 'under-13' || user.parentVerified === true, 'auth.kid_requires_parental_consent');
    return true;
  }
}
