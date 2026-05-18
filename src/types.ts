export type AudienceAgeGate = 'any' | '13+' | 'under-13';
export type BuildTarget = 'kids' | 'standard';
export type Provider = 'apple' | 'google' | 'zalo';
export type Species = 'mochi' | 'pengu' | 'bao' | 'fluffit' | 'tako';
export type Stage = 'egg' | 'baby' | 'teen' | 'adult' | 'grandma_house';
export type Rarity = 'common' | 'rare' | 'epic' | 'mythic' | 'legendary';
export type Currency = 'coins' | 'hearts';
export type TenantSlug = 'mochi' | 'techcombank' | 'viettel' | string;

export interface UserProfile {
  id: string;
  tenantId: TenantSlug;
  audienceAgeGate: '13+' | 'under-13';
  provider?: Provider;
  parentVerified?: boolean;
  petPlus?: boolean;
  familyManager?: boolean;
}

export interface Pet {
  id: string;
  tenantId: TenantSlug;
  ownerId: string;
  species: Species;
  rarity: Rarity;
  displayName: string;
  stage: Stage;
  bornAt: Date;
  hatchedAt?: Date;
  lastSeenAt: Date;
  paletteSeed: string;
  audienceAgeGate: '13+' | 'under-13';
  status: 'active' | 'grandma' | 'tombstoned';
  hunger: number;
  cleanliness: number;
  happiness: number;
  energy: number;
  traits: Record<string, string | number>;
}

export interface LedgerEntry {
  id: string;
  tenantId: TenantSlug;
  userId: string | null;
  currency: Currency;
  amount: number;
  accountType: 'user_wallet' | 'system_source' | 'system_sink' | 'iap_source' | 'creator_revshare';
  ref: string;
  occurredAt: Date;
}

export interface FRRecord {
  id: string;
  phase: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  module: string;
  status: 'shipped';
}
