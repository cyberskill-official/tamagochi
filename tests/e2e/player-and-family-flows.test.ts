import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AIService,
  AuthService,
  CareService,
  EconomyService,
  InfraService,
  LegalService,
  MediaService,
  ObservabilityService,
  PetService
} from '../../src/index.ts';

test('E2E-001 standard player hatch-to-share journey', async () => {
  const auth = new AuthService();
  const infra = new InfraService();
  const pets = new PetService();
  const care = new CareService();
  const ai = new AIService();
  const media = new MediaService();
  const obs = new ObservabilityService();

  const user = auth.signIn('apple', auth.createProviderToken('apple', 'standard-player'));
  const bundle = await infra.loader.loadBundle('root', { cdnPrefix: 'https://cdn.tamagochi.app', tenantSlug: user.tenantId });
  assert.equal(bundle.url, 'https://cdn.tamagochi.app/mochi/root');

  const hatch = pets.hatch(user, 'mochi', new Date('2026-05-17T08:00:00Z'));
  const pet = pets.namePet(user, hatch.pet.id, 'Mochi', hatch.hatchAnimationToken);
  care.feed(user, pet);
  care.clean(user, pet);
  care.hug(user, pet, new Date('2026-05-17T09:00:00Z'));
  pets.evolve(pet, new Date('2026-05-21T09:00:00Z'));

  const reply = ai.reply(user, pet, 'Are you happy today?');
  const placement = media.placeInBedroomCam({ arkit: true }, pet);
  const clip = media.exportVerticalClip(pet, 'ar');
  obs.track('journey.standard.completed', { pet_id: pet.id, stage: pet.stage }, user.tenantId);

  assert.match(reply, /Mochi/);
  assert.equal(placement.mode, 'ar');
  assert.equal(clip.width, 1080);
  assert.equal(clip.height, 1920);
  assert.equal(obs.events.at(-1)?.name, 'journey.standard.completed');
});

test('E2E-002 under-13 safe account and family journey', () => {
  const legal = new LegalService();
  const auth = new AuthService();
  const pets = new PetService();
  const ai = new AIService();
  const econ = new EconomyService();
  const media = new MediaService();

  legal.inspectKidsBinary(['GameAnalytics', 'Sentry']);
  const invite = auth.createKidInvite('parent@example.com');
  const kid = auth.verifyKidInvite(invite.code);
  const hatch = pets.hatch(kid, 'mochi', new Date('2026-05-17T08:00:00Z'));
  const pet = pets.namePet(kid, hatch.pet.id, 'Mimi', hatch.hatchAnimationToken);

  assert.equal(kid.audienceAgeGate, 'under-13');
  assert.equal(ai.reply(kid, pet, 'Can we chat?').includes('chirps'), false);
  assert.equal(econ.contextualKidAd(kid, { contextual: true, behavioral: false }), true);
  assert.throws(() => econ.contextualKidAd(kid, { contextual: false, behavioral: true }), /contextual_only/);
  assert.equal(media.pushAllowed({ localHour: 21, sentToday: 1, under13: true }), false);
});

test('E2E-004 monetization and live-ops journey remains deterministic and non-randomized', () => {
  const auth = new AuthService();
  const econ = new EconomyService();
  const care = new CareService();
  const user = auth.signIn('google', auth.createProviderToken('google', 'spender'));

  econ.grant(user, 'coins', 300, 'mini-game:session-1');
  assert.equal(econ.spend(user, 'coins', 50, 'care.feed:food-1'), 250);
  assert.equal(econ.catalog.every((item) => item.randomized === false), true);
  const receipt = econ.createSignedReceipt('apple', { userId: user.id, sku: 'pet_plus.monthly', transactionId: 'txn-spender-1', kind: 'subscription' });
  econ.validateIapReceipt('apple', receipt);
  econ.restoreSubscription(user, 'apple', receipt);
  const reward = econ.rewardedVideo(user, 'daily_bonus', true);
  const pass = econ.battlePass(user);
  const streak = care.claimStreak(user, new Date('2026-05-23T12:00:00Z'));

  assert.equal(user.petPlus, true);
  assert.equal(reward.interstitial, false);
  assert.equal(pass.premium, true);
  assert.equal(streak.cozyHour, true);
  assert.throws(() => econ.grant(user, 'hearts', 10, 'streak:bad'), /hearts_only_via_iap/);
});
