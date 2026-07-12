import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AuthService,
  B2BService,
  CareService,
  EconomyService,
  I18nA11yService,
  ObservabilityService,
  PetService,
  SocialService
} from '../../src/index.ts';

test('E2E-003 social collection journey covers friends, PetPair, breeding, trust trade, and ceremony', () => {
  const auth = new AuthService();
  const pets = new PetService();
  const care = new CareService();
  const social = new SocialService();
  const a = auth.signIn('apple', auth.createProviderToken('apple', 'social-a'));
  const b = auth.signIn('google', auth.createProviderToken('google', 'social-b'));
  const petA = pets.hatch(a, 'mochi', new Date('2026-05-17T08:00:00Z')).pet;
  const petB = pets.hatch(b, 'pengu', new Date('2026-05-17T08:00:00Z')).pet;
  petA.stage = 'adult';
  petB.stage = 'adult';

  social.acceptInvite(a, b, social.inviteCode(a));
  const pair = social.createPetPair(petA, a, b);
  care.feed(a, petA);
  const receipt = social.recordCoParentCare(pair.pairId, a);
  const child = pets.breed(petA, petB);
  const ceremony = social.ceremony(a, b, petA, petB);
  const trade = social.trade({ tenantId: 'mochi', a, b, offerA: petA, offerB: petB, confirmA: true, confirmB: true });

  assert.match(receipt, /cared/);
  assert.equal(child.rarity, 'legendary');
  assert.equal(ceremony.cosmetic, 'married');
  assert.equal(trade.swapped, true);
  assert.equal(petA.ownerId, b.id);
});

test('E2E-005 PetOS tenant isolation journey covers theme, RLS, DPO, observability, localization, and reference tenants', () => {
  const auth = new AuthService();
  const b2b = new B2BService();
  const obs = new ObservabilityService();
  const i18n = new I18nA11yService();
  const econ = new EconomyService();

  const techUser = auth.signIn('zalo', auth.createProviderToken('zalo', 'techcombank-user', 'techcombank'), 'techcombank');
  const viettelUser = auth.signIn('zalo', auth.createProviderToken('zalo', 'viettel-user', 'viettel'), 'viettel');
  const rows = [
    { tenantId: 'techcombank', balance: 100 },
    { tenantId: 'viettel', balance: 200 }
  ];

  const theme = b2b.resolveTheme('techcombank');
  const visibleRows = b2b.rlsSelect(rows, techUser.tenantId);
  obs.track('tenant.partition.check', { rows: visibleRows.length }, techUser.tenantId);
  econ.grant(techUser, 'coins', 100, 'bank.quest:savings');
  econ.grant(viettelUser, 'coins', 200, 'telco.quest:topup');

  assert.equal(theme.bundlePath, 'https://cdn.tamagochi.app/techcombank/theme');
  assert.deepEqual(visibleRows, [{ tenantId: 'techcombank', balance: 100 }]);
  assert.throws(() => b2b.tenantContext(techUser, 'viettel'), /tenant.context.mismatch/);
  assert.equal(b2b.dpoAudit(rows, 'dpo').length, 2);
  assert.equal(obs.events.at(-1)?.tenantId, 'techcombank');
  assert.equal(i18n.assertLocalizationPipeline(), true);
  assert.equal(i18n.priceDisplay('VN', 'species.pengu').taxInclusive, true);
  assert.equal(i18n.assertWcag({ foregroundL: 1, backgroundL: 0, reducedMotion: true, labels: ['Save quest', 'Top-up quest'] }), true);
  assert.equal(b2b.techcombankReference().financialLiteracyQuiz, true);
  assert.equal(b2b.viettelReference().simBinding, true);
});
