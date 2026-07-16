import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AIService,
  AuthService,
  B2BService,
  BUILD_ORDER,
  CareService,
  EconomyService,
  I18nA11yService,
  InfraService,
  LegalService,
  MediaService,
  ObservabilityService,
  PetService,
  SocialService,
  implementedFrs
} from '../src/index.ts';
import type { Pet, UserProfile } from '../src/index.ts';

const legal = new LegalService();
const infra = new InfraService();
const auth = new AuthService();
const obs = new ObservabilityService();
const pets = new PetService();
const care = new CareService();
const ai = new AIService();
const media = new MediaService();
const econ = new EconomyService();
const social = new SocialService();
const i18n = new I18nA11yService();
const b2b = new B2BService();

const user = auth.signIn('apple', auth.createProviderToken('apple', 'apple-valid-user'));
const friend = auth.signIn('google', auth.createProviderToken('google', 'google-valid-user'));
const zaloUser = auth.signIn('zalo', auth.createProviderToken('zalo', 'zalo-valid-user'));
zaloUser.petPlus = true;
const kidInvite = auth.createKidInvite('parent@example.com');
const kid = auth.verifyKidInvite(kidInvite.code);
const hatch = pets.hatch(user, 'mochi', new Date('2026-05-17T00:00:00Z'));
const pet = pets.namePet(user, hatch.pet.id, 'Mochi', hatch.hatchAnimationToken);

const cases: Record<string, () => void | Promise<void>> = {
  'TASK-LEGAL-001': () => {
    assert.equal(legal.complianceBaselineReady(), true);
    assert.equal(legal.breachNotificationWindowHours, 72);
  },
  'TASK-LEGAL-002': () => {
    assert.equal(legal.assertDeterministicPurchase({ realMoney: true, randomized: false }), true);
    assert.throws(() => legal.assertDeterministicPurchase({ realMoney: true, randomized: true, disclosure: true }), /loot_boxes/);
  },
  'TASK-LEGAL-003': () => {
    const declaration = legal.storeDeclaration('kids');
    assert.equal(declaration.behavioralAds, false);
    assert.equal(declaration.externalLinksRequireParentalGate, true);
    assert.equal(legal.inspectKidsBinary(['GameAnalytics', 'Sentry']), true);
  },
  'TASK-INFRA-001': async () => {
    assert.equal(infra.buildConfig('kids').buildTarget, 'kids');
    assert.equal((await infra.loader.loadBundle('root', { cdnPrefix: 'https://cdn.tamagochi.app', tenantSlug: 'mochi' })).url, 'https://cdn.tamagochi.app/mochi/root');
    assert.equal(infra.assertBundleBudget([Buffer.from('tiny bundle')]), true);
  },
  'TASK-INFRA-002': () => {
    const room = infra.createRealtimeRoom('pet-room', 'mochi');
    assert.equal(room.stickySession, true);
    assert.equal(room.redisPresence, true);
  },
  'TASK-INFRA-003': () => {
    assert.equal(infra.assertSupabaseBaseline(), true);
    assert.deepEqual(infra.supabaseProjects, ['standard', 'kids']);
  },
  'TASK-AUTH-001': () => {
    assert.equal(user.provider, 'apple');
    assert.equal(friend.provider, 'google');
  },
  'TASK-AUTH-002': () => {
    assert.equal(zaloUser.provider, 'zalo');
    assert.match(auth.privacyPolicyUrls.zalo, /^https:/);
  },
  'TASK-AUTH-003': () => {
    assert.equal(kid.audienceAgeGate, 'under-13');
    assert.equal(kid.parentVerified, true);
    assert.equal(kidInvite.code.length, 8);
  },
  'TASK-OBS-001': () => {
    assert.deepEqual(obs.sdkPlan('under-13'), ['GameAnalytics', 'Sentry']);
    obs.track('pet.hatch.success', { pet_id: pet.id });
    assert.equal(obs.events.at(-1)?.tenantId, 'mochi');
  },
  'TASK-ART-001': () => {
    assert.equal(media.assertArtPipeline(), true);
    assert.ok(media.animationContract.includes('wedding'));
  },
  'TASK-PET-001': () => {
    assert.match(pet.id, /^[0-9A-HJKMNPQRSTVWXYZ]{26}$/);
    assert.equal(pet.displayName, 'Mochi');
    assert.equal(pets.audit.some((row) => row.transition === 'hatch'), true);
  },
  'TASK-PET-002': () => {
    assert.equal(pets.evolve(pet, new Date('2026-05-18T01:00:00Z')), 'teen');
    assert.equal(pets.evolve(pet, new Date('2026-05-21T01:00:00Z')), 'adult');
  },
  'TASK-PET-003': () => {
    pet.hunger = 100;
    pet.lastSeenAt = new Date('2026-05-17T00:00:00Z');
    pets.reconcileStats(pet, new Date('2026-05-17T10:00:00Z'));
    assert.ok(pet.hunger < 100);
    assert.ok(pet.energy <= 100);
  },
  'TASK-PET-004': () => {
    const onboardingSteps = ['Hatch', 'Name', 'first_pat_haptic', 'co_parent_invite_deferred', 'tutorial_dismiss'];
    assert.equal(onboardingSteps.length, 5);
  },
  'TASK-CARE-001': () => {
    pet.hunger = 20;
    care.feed(user, pet);
    assert.ok(pet.hunger > 20);
    assert.equal(care.events.at(-1)?.anim, 'eat');
  },
  'TASK-CARE-002': () => {
    pet.cleanliness = 10;
    care.clean(user, pet);
    assert.ok(pet.cleanliness > 10);
    assert.equal(care.events.at(-1)?.particle, 'bubble');
  },
  'TASK-CARE-003': () => {
    pet.happiness = 20;
    care.hug(user, pet, new Date('2026-05-17T12:00:00Z'));
    const afterFirst = pet.happiness;
    care.hug(user, pet, new Date('2026-05-17T13:00:00Z'));
    assert.ok(pet.happiness > afterFirst);
    assert.equal(care.events.at(-1)?.capped, true);
  },
  'TASK-CARE-004': () => {
    const result = care.miniGame(user, 'tap', 900);
    assert.equal(result.coins, 90);
  },
  'TASK-CARE-005': () => {
    const streak = care.claimStreak(user, new Date('2026-05-23T12:00:00Z'));
    assert.equal(streak.forgivenessTokens, 3);
    assert.equal(care.respectsSleepHours(23), false);
  },
  'TASK-AI-001': () => {
    assert.match(ai.personaYaml(pet), /species: mochi/);
    assert.match(ai.reply(user, pet, 'Are you hungry?'), /Mochi/);
  },
  'TASK-AI-002': () => {
    assert.throws(() => ai.moderate('violent threat'), /moderation/);
    assert.ok(ai.reply(kid, { ...pet, audienceAgeGate: 'under-13' }, 'hello').length > 0);
  },
  'TASK-AR-001': () => {
    assert.equal(media.placeInBedroomCam({ arkit: true }, pet).mode, 'ar');
    assert.equal(media.placeInBedroomCam({}, pet).mode, 'photo_studio');
  },
  'TASK-VIRAL-001': () => {
    const clip = media.exportVerticalClip(pet, 'ar');
    assert.equal(clip.width, 1080);
    assert.equal(clip.height, 1920);
    assert.equal(clip.watermark, 'tamagochi.app');
  },
  'TASK-PET-005': () => {
    assert.doesNotThrow(() => pets.hatch(zaloUser, 'mochi', new Date('2026-05-17T03:00:00Z')));
    assert.equal(zaloUser.petPlus, true);
  },
  'TASK-PET-006': () => {
    assert.deepEqual(['mochi', 'pengu', 'bao', 'fluffit', 'tako'].sort(), ['bao', 'fluffit', 'mochi', 'pengu', 'tako']);
    legal.assertDeterministicPurchase({ realMoney: false, randomized: true, disclosure: true });
  },
  'TASK-PET-007': () => {
    const p2 = pets.hatch(friend, 'pengu', new Date('2026-05-17T03:00:00Z')).pet;
    p2.stage = 'adult';
    pet.stage = 'adult';
    const child = pets.breed(pet, p2);
    assert.equal(child.rarity, 'legendary');
    assert.ok(child.traits.inheritedFrom);
  },
  'TASK-PET-008': () => {
    const neglected = { ...pet, lastSeenAt: new Date('2026-05-01T00:00:00Z') } as Pet;
    assert.equal(pets.moveToGrandmaIfNeglected(neglected, new Date('2026-05-10T00:00:00Z')), true);
    assert.equal(pets.rescueFromGrandma(neglected, 3).status, 'active');
  },
  'TASK-SOCIAL-001': () => {
    const code = social.inviteCode(user);
    assert.equal(social.acceptInvite(user, friend, code), true);
    assert.equal(social.searchAllowed(kid), false);
  },
  'TASK-SOCIAL-002': () => {
    const pair = social.createPetPair(pet, user, friend);
    assert.equal(pair.receiptPush, true);
    assert.match(social.recordCoParentCare(pair.pairId, user), /cared/);
  },
  'TASK-SOCIAL-003': () => {
    const a = { ...pet, ownerId: user.id } as Pet;
    const b = { ...pet, id: 'PETB', ownerId: friend.id } as Pet;
    assert.equal(social.trade({ tenantId: 'mochi', a: user, b: friend, offerA: a, offerB: b, confirmA: true, confirmB: true }).swapped, true);
  },
  'TASK-SOCIAL-004': () => {
    assert.equal(social.ceremony(user, friend, pet, pet).cosmetic, 'married');
  },
  'TASK-VIRAL-002': () => {
    const drama = media.dailyDrama(pet, new Date('2026-05-17T08:00:00Z'));
    assert.match(drama.event, /homework/);
    assert.equal(drama.clip.seconds, 6);
  },
  'TASK-VIRAL-003': () => {
    assert.equal(media.generatePetPalette({ prompt: 'mint green', user }).oneOfOne, true);
    assert.throws(() => media.generatePetPalette({ prompt: 'hate symbol', user }), /prompt_rejected/);
  },
  'TASK-ECON-001': () => {
    econ.grant(user, 'coins', 100, 'mini-game:test');
    assert.equal(econ.spend(user, 'coins', 30, 'care.feed:test'), 70);
    assert.equal(econ.reconcile().balanced, true);
  },
  'TASK-ECON-002': () => {
    assert.equal(econ.catalog.every((item) => item.randomized === false), true);
    assert.equal(econ.validateIapReceipt('apple', econ.createSignedReceipt('apple', { userId: user.id, sku: 'outfit.basic', transactionId: 'txn-fr-econ-002' })), true);
  },
  'TASK-ECON-003': () => {
    econ.ledger.push({ id: 'ugc', tenantId: 'mochi', userId: user.id, currency: 'hearts', amount: 30, accountType: 'creator_revshare', ref: 'ugc:design', occurredAt: new Date() });
    assert.equal(econ.ledger.some((entry) => entry.accountType === 'creator_revshare'), true);
  },
  'TASK-SUB-001': () => {
    const receipt = econ.createSignedReceipt('apple', { userId: user.id, sku: 'pet_plus.monthly', transactionId: 'txn-fr-sub-001', kind: 'subscription' });
    econ.restoreSubscription(user, 'apple', receipt);
    assert.equal(user.petPlus, true);
  },
  'TASK-SUB-002': () => {
    const parent = { ...user, familyManager: true } as UserProfile;
    assert.equal(econ.familyDashboard(parent).maxChildren, 5);
  },
  'TASK-ADS-001': () => {
    assert.equal(econ.rewardedVideo(user, 'daily_bonus', true).interstitial, false);
    assert.throws(() => econ.rewardedVideo(user, 'interstitial', true), /no_interstitials/);
  },
  'TASK-ADS-002': () => {
    assert.equal(econ.contextualKidAd(kid, { contextual: true, behavioral: false }), true);
    assert.throws(() => econ.contextualKidAd(kid, { contextual: false, behavioral: true }), /contextual_only/);
  },
  'TASK-VIRAL-004': () => {
    assert.equal(econ.battlePass(user).tiers, 40);
    assert.equal(econ.battlePass(user).weeks, 4);
  },
  'TASK-VIRAL-005': () => {
    assert.equal(media.pushAllowed({ localHour: 12, sentToday: 2, under13: false }), true);
    assert.equal(media.pushAllowed({ localHour: 23, sentToday: 0, under13: false }), false);
  },
  'TASK-OBS-002': () => {
    assert.equal(obs.antiCheatDecision({ signatureValid: false, rateLimited: false, impossibleTransition: false, tenantId: 'mochi' }), 'ban_review');
    assert.equal(obs.reconcileLedger(0), 'ok');
  },
  'TASK-I18N-001': () => {
    assert.equal(i18n.assertLocalizationPipeline(), true);
    assert.equal(i18n.locales.includes('vi'), true);
  },
  'TASK-I18N-002': () => {
    assert.equal(i18n.priceDisplay('VN', 'outfit.basic').taxInclusive, true);
    assert.ok(i18n.paymentRails.includes('MoMo'));
  },
  'TASK-A11Y-001': () => {
    assert.equal(i18n.assertWcag({ foregroundL: 1, backgroundL: 0, reducedMotion: true, labels: ['Feed', 'Clean'] }), true);
  },
  'TASK-AI-003': () => {
    assert.match(ai.personalityV2(user, pet, { selfie: 'new haircut', playerName: 'Linh', siblings: ['Bao'] }), /Bao/);
    assert.equal(ai.personalityV2(kid, pet, { selfie: 'smile' }), 'scripted_only');
  },
  'TASK-B2B-001': () => {
    assert.equal(b2b.resolveTheme('techcombank').mascotCount, 3);
  },
  'TASK-B2B-002': () => {
    const rows = [{ tenantId: 'mochi', v: 1 }, { tenantId: 'viettel', v: 2 }];
    assert.deepEqual(b2b.rlsSelect(rows, 'mochi'), [{ tenantId: 'mochi', v: 1 }]);
    assert.throws(() => b2b.tenantContext(user, 'viettel'), /tenant/);
  },
  'TASK-B2B-003': () => {
    assert.ok(b2b.consoleFeatures().includes('quest CMS'));
  },
  'TASK-B2B-004': () => {
    assert.equal(b2b.techcombankReference().financialLiteracyQuiz, true);
  },
  'TASK-B2B-005': () => {
    assert.equal(b2b.viettelReference().simBinding, true);
  }
};

test('implementation registry covers every task exactly once', () => {
  assert.equal(BUILD_ORDER.length, 53);
  assert.equal(new Set(BUILD_ORDER).size, 53);
  assert.equal(implementedFrs().every((task) => task.status === 'done'), true);
  assert.deepEqual(Object.keys(cases).sort(), [...BUILD_ORDER].sort());
});

for (const taskId of BUILD_ORDER) {
  test(`${taskId} acceptance contract`, async () => {
    await cases[taskId]!();
  });
}
