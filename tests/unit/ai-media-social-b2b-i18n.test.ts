import test from 'node:test';
import assert from 'node:assert/strict';
import { AIService, B2BService, I18nA11yService, MediaService, PetService, SocialService } from '../../src/index.ts';
import type { UserProfile } from '../../src/index.ts';

function user(id: string, tenantId = 'mochi', audienceAgeGate: '13+' | 'under-13' = '13+'): UserProfile {
  return { id, tenantId, audienceAgeGate, parentVerified: audienceAgeGate === 'under-13' };
}

test('AI service covers persona, caching, moderation, cost caps, and kids scripted mode', () => {
  const ai = new AIService();
  const pet = new PetService().hatch(user('u1'), 'mochi', new Date('2026-05-17T00:00:00Z')).pet;
  assert.match(ai.personaYaml(pet), /tone: cozy/);
  assert.throws(() => ai.moderate('self-harm'), /moderation_rejected/);
  const first = ai.reply(user('u1'), pet, 'hello');
  const second = ai.reply(user('u1'), pet, 'hello');
  assert.equal(first, second);
  assert.equal(ai.dailyCost.get(pet.id), 1);
  for (let i = 0; i < 19; i += 1) ai.reply(user('u1'), pet, `safe-${i}`);
  assert.throws(() => ai.reply(user('u1'), pet, 'safe-over-cap'), /daily_cost_cap/);
  assert.ok(ai.reply(user('kid', 'mochi', 'under-13'), pet, 'unsafe?').length > 0);
  assert.equal(ai.personalityV2(user('kid', 'mochi', 'under-13'), pet, { selfie: 'smile' }), 'scripted_only');
});

test('media service covers AR fallback, vertical export, daily cap, generated palettes, and push rules', () => {
  const media = new MediaService();
  const pet = new PetService().hatch(user('u1'), 'mochi', new Date('2026-05-17T00:00:00Z')).pet;
  assert.equal(media.assertArtPipeline(), true);
  assert.equal(media.placeInBedroomCam({ arcore: true }, pet).mode, 'ar');
  assert.equal(media.placeInBedroomCam({}, pet).mode, 'photo_studio');
  assert.deepEqual(media.exportVerticalClip(pet, 'ar').hashtags, ['#mochilife', '#virtualpet']);
  media.dailyDrama(pet, new Date('2026-05-17T08:00:00Z'));
  assert.throws(() => media.dailyDrama(pet, new Date('2026-05-17T09:00:00Z')), /daily_drama_cap/);
  assert.equal(media.generatePetPalette({ prompt: 'sky blue', user: user('u1') }).oneOfOne, true);
  assert.throws(() => media.generatePetPalette({ prompt: 'explicit pattern', user: user('u1') }), /prompt_rejected/);
  const publish = media.socialPublishStub({
    frId: 'FR-VIRAL-001',
    platform: 'tiktok',
    assetUrl: 'https://cdn.tamagochi.app/social/fr-viral-001.mp4',
    caption: 'Mochi first tiny floor adventure. #mochilife #virtualpet',
    scheduledFor: '2026-05-19T19:30:00+07:00'
  });
  assert.equal(publish.mode, 'mocked-dependency');
  assert.equal(publish.request.body.fr_id, 'FR-VIRAL-001');
  assert.throws(() => media.socialPublishStub({ ...publish.request.body, frId: 'FR-VIRAL-001', platform: 'tiktok', assetUrl: 'file://clip.mp4', caption: 'bad', scheduledFor: '2026-05-19T19:30:00+07:00' }), /https_required/);
  assert.throws(() => media.socialPublishStub({ frId: 'FR-VIRAL-001', platform: 'tiktok', assetUrl: 'https://cdn.tamagochi.app/social/fr-viral-001.mp4', caption: 'x', scheduledFor: '2026-05-19T19:30:00+07:00', apiKey: 'live-key' }), /live_publish_disabled/);
  assert.equal(media.pushAllowed({ localHour: 12, sentToday: 2, under13: false }), true);
  assert.equal(media.pushAllowed({ localHour: 12, sentToday: 1, under13: true }), false);
});

test('social service covers invite-only kids, PetPair, break-up detection, trade safety, and ceremony', () => {
  const social = new SocialService();
  const pets = new PetService();
  const a = user('a');
  const b = user('b');
  const petA = pets.hatch(a, 'mochi', new Date('2026-05-17T00:00:00Z')).pet;
  const petB = pets.hatch(b, 'pengu', new Date('2026-05-17T00:00:00Z')).pet;
  assert.equal(social.searchAllowed(user('kid', 'mochi', 'under-13')), false);
  const code = social.inviteCode(a);
  assert.equal(social.acceptInvite(a, b, code), true);
  assert.throws(() => social.acceptInvite(a, user('c', 'viettel'), code), /cross_tenant/);
  const pair = social.createPetPair(petA, a, b);
  social.recordCoParentCare(pair.pairId, a);
  assert.equal(social.breakUpNeeded(pair.pairId, new Date(Date.now() + 2 * 86_400_000)), true);
  assert.throws(() => social.trade({ tenantId: 'mochi', a, b, offerA: petA, offerB: petB, confirmA: true, confirmB: false }), /both_sides/);
  assert.throws(() => social.trade({ tenantId: 'mochi', a, b, offerA: petA, offerB: petB, confirmA: true, confirmB: true, offPlatform: true }), /off_platform/);
  assert.equal(social.trade({ tenantId: 'mochi', a, b, offerA: petA, offerB: petB, confirmA: true, confirmB: true }).swapped, true);
  assert.equal(social.ceremony(a, b, petA, petB).shareClip, true);
});

test('i18n/a11y and B2B services cover locales, payment display, contrast, RLS, DPO, and reference tenants', () => {
  const i18n = new I18nA11yService();
  const b2b = new B2BService();
  assert.equal(i18n.assertLocalizationPipeline(), true);
  assert.equal(i18n.priceDisplay('VN', 'species.pengu').railCount, 4);
  assert.equal(i18n.assertWcag({ foregroundL: 1, backgroundL: 0, reducedMotion: true, labels: ['Feed'] }), true);
  assert.throws(() => i18n.assertWcag({ foregroundL: 0.2, backgroundL: 0.1, reducedMotion: true, labels: ['Feed'] }), /contrast_fail/);
  assert.equal(b2b.resolveTheme('viettel').mascotCount, 3);
  assert.throws(() => b2b.resolveTheme('unknown'), /tenant_unknown/);
  const rows = [{ tenantId: 'mochi', value: 1 }, { tenantId: 'techcombank', value: 2 }];
  assert.deepEqual(b2b.rlsSelect(rows, 'techcombank'), [{ tenantId: 'techcombank', value: 2 }]);
  assert.throws(() => b2b.dpoAudit(rows, 'admin'), /dpo_only/);
  assert.equal(b2b.dpoAudit(rows, 'dpo').length, 2);
  assert.ok(b2b.consoleFeatures().includes('KPI dashboard'));
  assert.equal(b2b.techcombankReference().sso, true);
  assert.equal(b2b.viettelReference().simBinding, true);
});
