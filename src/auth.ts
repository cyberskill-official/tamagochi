import type { Provider, TenantSlug, UserProfile } from './types.ts';
import { assert, deterministicCode, hash, signPayload, verifyPayload } from './utils.ts';

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
  private readonly providerTokenSecret = 'tamagochi-local-provider-token-v2';
  readonly privacyPolicyUrls = {
    zalo: 'https://tamagochi.app/privacy/zalo',
    apple: 'https://tamagochi.app/privacy/apple',
    google: 'https://tamagochi.app/privacy/google'
  };

  createProviderToken(provider: Provider, subject: string, tenantId: TenantSlug = 'mochi', expiresAt = new Date(Date.now() + 15 * 60_000)): string {
    assert(subject.length >= 3, 'auth.provider_subject_invalid');
    return signPayload({
      iss: `${provider}.identity.local`,
      aud: 'tamagochi',
      provider,
      sub: subject,
      tenantId,
      exp: expiresAt.toISOString()
    }, this.providerTokenSecret);
  }

  signIn(provider: Provider, token: string, tenantId?: TenantSlug): UserProfile {
    let assertion: { provider: Provider; sub: string; tenantId: TenantSlug; exp: string; aud: string };
    try {
      assertion = verifyPayload<{ provider: Provider; sub: string; tenantId: TenantSlug; exp: string; aud: string }>(token, this.providerTokenSecret);
    } catch {
      throw new Error('auth.invalid_oauth_token');
    }
    assert(assertion.aud === 'tamagochi', 'auth.invalid_audience');
    assert(assertion.provider === provider, 'auth.provider_mismatch');
    assert(new Date(assertion.exp).getTime() > Date.now(), 'auth.provider_token_expired');
    const resolvedTenant = tenantId ?? assertion.tenantId;
    assert(resolvedTenant === assertion.tenantId, 'auth.tenant_mismatch');
    if (provider === 'zalo') assert(this.privacyPolicyUrls.zalo.startsWith('https://'), 'auth.zalo_privacy_url_missing');
    const user: UserProfile = {
      id: `${provider}_${hash(`${provider}:${assertion.sub}`, 12)}`,
      tenantId: resolvedTenant,
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
