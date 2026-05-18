import type { Pet, TenantSlug, UserProfile } from './types.ts';
import { assert, deterministicCode } from './utils.ts';

export class SocialService {
  readonly friends = new Map<string, Set<string>>();
  readonly blocks = new Map<string, Set<string>>();
  readonly pairs = new Map<string, { petId: string; users: [string, string]; actions: Array<{ userId: string; at: Date }> }>();

  inviteCode(user: UserProfile): string {
    return deterministicCode(`${user.id}:${user.tenantId}`);
  }

  acceptInvite(from: UserProfile, to: UserProfile, code: string): true {
    assert(code === this.inviteCode(from), 'social.invite_invalid');
    assert(from.tenantId === to.tenantId, 'social.cross_tenant_friend_forbidden');
    this.link(from.id, to.id);
    return true;
  }

  searchAllowed(user: UserProfile): boolean {
    return user.audienceAgeGate !== 'under-13';
  }

  createPetPair(pet: Pet, a: UserProfile, b: UserProfile): { pairId: string; receiptPush: true } {
    assert(a.tenantId === b.tenantId && pet.tenantId === a.tenantId, 'social.petpair_cross_tenant');
    const pairId = deterministicCode(`${pet.id}:${a.id}:${b.id}`, 12);
    this.pairs.set(pairId, { petId: pet.id, users: [a.id, b.id], actions: [] });
    return { pairId, receiptPush: true };
  }

  recordCoParentCare(pairId: string, user: UserProfile): string {
    const pair = this.pairs.get(pairId);
    assert(pair, 'social.petpair_missing');
    assert(pair.users.includes(user.id), 'social.petpair_not_member');
    pair.actions.push({ userId: user.id, at: new Date() });
    return `${user.id} cared for ${pair.petId} while you were away`;
  }

  breakUpNeeded(pairId: string, now = new Date()): boolean {
    const pair = this.pairs.get(pairId);
    assert(pair, 'social.petpair_missing');
    const recent = pair.actions.filter((action) => now.getTime() - action.at.getTime() <= 3 * 86_400_000);
    return recent.length > 0 && new Set(recent.map((action) => action.userId)).size === 1;
  }

  trade(input: { tenantId: TenantSlug; a: UserProfile; b: UserProfile; offerA: Pet; offerB: Pet; confirmA: boolean; confirmB: boolean; offPlatform?: boolean }): { swapped: true } {
    assert(input.a.tenantId === input.b.tenantId && input.a.tenantId === input.tenantId, 'social.trade_cross_tenant');
    assert(!input.offPlatform, 'social.no_off_platform_trade');
    assert(input.confirmA && input.confirmB, 'social.both_sides_confirm_required');
    const ownerA = input.offerA.ownerId;
    input.offerA.ownerId = input.offerB.ownerId;
    input.offerB.ownerId = ownerA;
    return { swapped: true };
  }

  ceremony(a: UserProfile, b: UserProfile, petA: Pet, petB: Pet): { room: string; cosmetic: 'married'; shareClip: true } {
    assert(a.tenantId === b.tenantId && petA.tenantId === petB.tenantId, 'social.ceremony_cross_tenant');
    return { room: `wedding:${petA.id}:${petB.id}`, cosmetic: 'married', shareClip: true };
  }

  private link(a: string, b: string): void {
    const aSet = this.friends.get(a) ?? new Set<string>();
    const bSet = this.friends.get(b) ?? new Set<string>();
    aSet.add(b);
    bSet.add(a);
    this.friends.set(a, aSet);
    this.friends.set(b, bSet);
  }
}
