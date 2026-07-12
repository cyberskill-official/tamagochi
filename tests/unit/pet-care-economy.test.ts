import test from 'node:test';
import assert from 'node:assert/strict';
import { CareService, EconomyService, PetService } from '../../src/index.ts';
import type { UserProfile } from '../../src/index.ts';

function user(id = 'u1', extra: Partial<UserProfile> = {}): UserProfile {
  return { id, tenantId: 'mochi', audienceAgeGate: '13+', ...extra };
}

test('pet service enforces hatch, consent, quota, safe names, uniqueness, evolution, and rescue', () => {
  const pets = new PetService();
  const adult = user('adult');
  const kid = user('kid', { audienceAgeGate: 'under-13' });
  assert.throws(() => pets.hatch(kid), /parental_consent/);

  const first = pets.hatch(adult, 'mochi', new Date('2026-05-17T00:00:00Z'));
  assert.throws(() => pets.namePet(adult, first.pet.id, 'https://bad.test', first.hatchAnimationToken), /name_charset|name_url/);
  pets.namePet(adult, first.pet.id, 'Mochi', first.hatchAnimationToken);

  const second = pets.hatch(adult, 'pengu', new Date('2026-05-17T02:00:00Z'));
  assert.throws(() => pets.namePet(adult, second.pet.id, 'mochi', second.hatchAnimationToken), /name_duplicate/);
  pets.namePet(adult, second.pet.id, 'Pengu', second.hatchAnimationToken);
  pets.hatch(adult, 'bao', new Date('2026-05-17T04:00:00Z'));
  assert.throws(() => pets.hatch(adult, 'tako', new Date('2026-05-17T06:00:00Z')), /quota_exceeded/);

  assert.equal(pets.evolve(first.pet, new Date('2026-05-21T00:00:00Z')), 'adult');
  first.pet.lastSeenAt = new Date('2026-05-01T00:00:00Z');
  assert.equal(pets.moveToGrandmaIfNeglected(first.pet, new Date('2026-05-10T00:00:00Z')), true);
  assert.equal(pets.rescueFromGrandma(first.pet, 3).status, 'active');
});

test('pet stat reconciliation and breeding are deterministic and tenant-safe', () => {
  const pets = new PetService();
  const a = pets.hatch(user('a'), 'mochi', new Date('2026-05-17T00:00:00Z')).pet;
  const b = pets.hatch(user('b'), 'pengu', new Date('2026-05-17T00:00:00Z')).pet;
  a.stage = 'adult';
  b.stage = 'adult';
  a.hunger = 100;
  a.lastSeenAt = new Date('2026-05-17T00:00:00Z');
  pets.reconcileStats(a, new Date('2026-05-17T12:00:00Z'));
  assert.ok(a.hunger < 100);
  const child = pets.breed(a, b, new Date('2026-05-18T00:00:00Z'));
  assert.equal(child.rarity, 'legendary');
  assert.equal(child.paletteSeed.length, 16);
  b.tenantId = 'viettel';
  assert.throws(() => pets.breed(a, b), /cross_tenant/);
});

test('care service covers feed, clean, hug caps, mini-game caps, streak forgiveness, and sleep hours', () => {
  const care = new CareService();
  const u = user();
  const pet = new PetService().hatch(u, 'mochi', new Date('2026-05-17T00:00:00Z')).pet;
  pet.hunger = 10;
  pet.cleanliness = 20;
  pet.happiness = 30;
  care.feed(u, pet);
  care.clean(u, pet);
  care.hug(u, pet, new Date('2026-05-17T09:00:00Z'));
  const afterHug = pet.happiness;
  care.hug(u, pet, new Date('2026-05-17T10:00:00Z'));
  assert.ok(pet.hunger > 10);
  assert.ok(pet.cleanliness > 20);
  assert.equal(pet.happiness, afterHug + 5);
  let earned = 0;
  for (let i = 0; i < 10; i += 1) earned += care.miniGame(u, 'memory', 2000, new Date('2026-05-17T11:00:00Z')).coins;
  assert.equal(earned, 500);
  care.claimStreak(u, new Date('2026-05-17T12:00:00Z'));
  const streak = care.claimStreak(u, new Date('2026-05-19T12:00:00Z'));
  assert.equal(streak.forgivenessTokens, 2);
  assert.equal(care.respectsSleepHours(6), false);
  assert.equal(care.respectsSleepHours(12), true);
});

test('economy service enforces double-entry ledger, no overdraft, IAP-only Hearts, subscriptions, ads, and exports', () => {
  const econ = new EconomyService();
  const u = user();
  assert.throws(() => econ.grant(u, 'hearts', 10, 'promo'), /hearts_only_via_iap/);
  assert.equal(econ.grant(u, 'coins', 200, 'streak:1'), 200);
  assert.equal(econ.spend(u, 'coins', 50, 'care.feed:1'), 150);
  assert.throws(() => econ.spend(u, 'coins', 1000, 'care.feed:2'), /insufficient_balance/);
  assert.equal(econ.reconcile().balanced, true);
  const receipt = econ.createSignedReceipt('apple', { userId: u.id, sku: 'pet_plus.monthly', transactionId: 'txn-1', kind: 'subscription' });
  assert.equal(econ.validateIapReceipt('apple', receipt), true);
  assert.throws(() => econ.validateIapReceipt('google', receipt), /platform_mismatch/);
  econ.restoreSubscription(u, 'apple', receipt);
  assert.equal(u.petPlus, true);
  assert.equal(econ.rewardedVideo(u, 'daily_bonus', true).interstitial, false);
  assert.throws(() => econ.rewardedVideo(u, 'daily_bonus', false), /reward_not_completed/);
  assert.match(econ.historyCsv(u), /occurred_at,currency,amount,ref/);
});
