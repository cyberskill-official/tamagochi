import type { Currency, LedgerEntry, TenantSlug, UserProfile } from './types.ts';
import { assert, ulid } from './utils.ts';

export class EconomyService {
  readonly ledger: LedgerEntry[] = [];
  readonly catalog = [
    { sku: 'outfit.basic', kind: 'outfit', usd: 0.99, vnd: 29000, randomized: false },
    { sku: 'room.cozy', kind: 'room_decor', usd: 2.99, vnd: 79000, randomized: false },
    { sku: 'species.pengu', kind: 'premium_species', usd: 4.99, vnd: 129000, randomized: false }
  ];

  balance(userId: string, currency: Currency, tenantId?: TenantSlug): number {
    return this.ledger
      .filter((entry) => entry.userId === userId && entry.currency === currency && (!tenantId || entry.tenantId === tenantId))
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  grant(user: UserProfile, currency: Currency, amount: number, ref: string, source: 'system_source' | 'iap_source' = 'system_source'): number {
    assert(amount > 0, 'econ.invalid_amount');
    assert(currency !== 'hearts' || source === 'iap_source', 'econ.hearts_only_via_iap');
    this.writePair(user.tenantId, user.id, currency, amount, 'user_wallet', source, ref);
    return this.balance(user.id, currency, user.tenantId);
  }

  spend(user: UserProfile, currency: Currency, amount: number, ref: string): number {
    assert(amount > 0, 'econ.invalid_amount');
    const current = this.balance(user.id, currency, user.tenantId);
    assert(current >= amount, 'econ.insufficient_balance');
    this.writePair(user.tenantId, user.id, currency, -amount, 'user_wallet', 'system_sink', ref);
    return this.balance(user.id, currency, user.tenantId);
  }

  validateIapReceipt(platform: 'apple' | 'google' | 'antom', receipt: string): true {
    assert(receipt.startsWith(`${platform}:`), 'econ.receipt_invalid');
    return true;
  }

  restoreSubscription(user: UserProfile, receipt: string): UserProfile {
    this.validateIapReceipt(receipt.startsWith('google:') ? 'google' : 'apple', receipt);
    user.petPlus = true;
    return user;
  }

  familyDashboard(parent: UserProfile): { maxChildren: 5; screenTimeCaps: true; spendCaps: true; contentFilter: true } {
    assert(parent.familyManager === true, 'sub.family_manager_required');
    return { maxChildren: 5, screenTimeCaps: true, spendCaps: true, contentFilter: true };
  }

  rewardedVideo(user: UserProfile, placement: string, completed: boolean): { coins: number; interstitial: false } {
    assert(completed, 'ads.reward_not_completed');
    assert(placement !== 'interstitial', 'ads.no_interstitials');
    return { coins: this.grant(user, 'coins', 25, `ads.rewarded:${placement}`), interstitial: false };
  }

  contextualKidAd(user: UserProfile, ad: { behavioral: boolean; contextual: boolean }): true {
    if (user.audienceAgeGate === 'under-13') {
      assert(ad.contextual && !ad.behavioral, 'ads.kids_contextual_only');
    }
    return true;
  }

  battlePass(user: UserProfile): { priceUsd: 4.99; weeks: 4; tiers: 40; premium: boolean } {
    return { priceUsd: 4.99, weeks: 4, tiers: 40, premium: user.petPlus === true };
  }

  historyCsv(user: UserProfile): string {
    const rows = this.ledger.filter((entry) => entry.userId === user.id).map((entry) => `${entry.occurredAt.toISOString()},${entry.currency},${entry.amount},${entry.ref}`);
    return ['occurred_at,currency,amount,ref', ...rows].join('\n');
  }

  reconcile(): { balanced: boolean; driftPct: number } {
    const byRef = new Map<string, number>();
    for (const entry of this.ledger) byRef.set(entry.ref, (byRef.get(entry.ref) ?? 0) + entry.amount);
    const balanced = [...byRef.values()].every((sum) => sum === 0);
    return { balanced, driftPct: balanced ? 0 : 1 };
  }

  private writePair(tenantId: TenantSlug, userId: string, currency: Currency, userAmount: number, userType: LedgerEntry['accountType'], otherType: LedgerEntry['accountType'], ref: string): void {
    this.ledger.push({ id: ulid(`${ref}:user`), tenantId, userId, currency, amount: userAmount, accountType: userType, ref, occurredAt: new Date() });
    this.ledger.push({ id: ulid(`${ref}:system`), tenantId, userId: null, currency, amount: -userAmount, accountType: otherType, ref, occurredAt: new Date() });
  }
}
