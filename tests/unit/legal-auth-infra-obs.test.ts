import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService, InfraService, LegalService, ObservabilityService } from '../../src/index.ts';

test('legal service enforces compliance, SDK, branding, and loot-box rules', () => {
  const legal = new LegalService();
  assert.equal(legal.complianceBaselineReady(), true);
  assert.equal(legal.validateBranding('Mochi companion app'), true);
  assert.throws(() => legal.validateBranding('Tamagotchi clone'), /blocked_bandai_term/);
  assert.deepEqual(legal.allowedSdksForAudience('under-13'), ['GameAnalytics', 'Sentry', 'SuperAwesome kWS']);
  assert.throws(() => legal.inspectKidsBinary(['GameAnalytics', 'Mixpanel']), /kids_forbidden_sdk/);
  assert.equal(legal.assertDeterministicPurchase({ realMoney: false, randomized: true, disclosure: true }), true);
  assert.throws(() => legal.assertDeterministicPurchase({ realMoney: true, randomized: true }), /loot_boxes/);
});

test('auth service covers Apple, Google, Zalo, parent invites, and fail-closed validation', () => {
  const auth = new AuthService();
  assert.equal(auth.signIn('apple', 'apple-token-123').provider, 'apple');
  assert.equal(auth.signIn('google', 'google-token-123').audienceAgeGate, '13+');
  assert.match(auth.signIn('zalo', 'zalo-token-123').id, /^zalo_/);
  assert.throws(() => auth.signIn('apple', 'short'), /invalid_oauth_token/);
  assert.throws(() => auth.createKidInvite('not-an-email'), /parent_email_invalid/);
  const invite = auth.createKidInvite('parent@example.com', 'SuperAwesome kWS');
  assert.equal(invite.code.length, 8);
  const child = auth.verifyKidInvite(invite.code);
  assert.equal(child.parentVerified, true);
  assert.equal(auth.assertKidCanCreatePet(child), true);
  assert.throws(() => auth.verifyKidInvite('NOPE0000'), /invite_not_found/);
});

test('infra service validates build targets, tenant asset loading, bundle budgets, and realtime metadata', async () => {
  const infra = new InfraService();
  assert.equal(infra.cocosVersion, '3.8.4');
  assert.equal(infra.buildConfig('standard').analyticsEnabled, false);
  const root = await infra.loader.loadBundle('root', { cdnPrefix: 'https://cdn.tamagochi.app', tenantSlug: 'techcombank', version: 'v1' });
  const cached = await infra.loader.loadBundle('root', { cdnPrefix: 'https://cdn.tamagochi.app', tenantSlug: 'techcombank', version: 'v1' });
  assert.equal(root, cached);
  assert.equal(root.url, 'https://cdn.tamagochi.app/techcombank/root?v=v1');
  await assert.rejects(() => infra.loader.loadBundle('root', { cdnPrefix: 'cdn.example.test' }), /invalid_cdn_prefix/);
  assert.equal(infra.assertBundleBudget([Buffer.from('small')]), true);
  assert.deepEqual(infra.createRealtimeRoom('trade-room', 'viettel'), { name: 'trade-room', tenantId: 'viettel', stickySession: true, redisPresence: true });
  assert.equal(infra.assertSupabaseBaseline(), true);
});

test('observability service separates kids SDKs, tags events, and catches security drift', () => {
  const obs = new ObservabilityService();
  assert.deepEqual(obs.sdkPlan('under-13'), ['GameAnalytics', 'Sentry']);
  assert.ok(obs.sdkPlan('13+').includes('AppsFlyer'));
  obs.track('care.feed', { pet_id: 'PET1' }, 'mochi');
  assert.deepEqual(obs.sentryTags('techcombank', 'standard'), { tenant_id: 'techcombank', build_target: 'standard' });
  assert.equal(obs.antiCheatDecision({ signatureValid: true, rateLimited: false, impossibleTransition: false, tenantId: 'mochi' }), 'allow');
  assert.equal(obs.antiCheatDecision({ signatureValid: true, rateLimited: true, impossibleTransition: false, tenantId: 'mochi' }), 'ban_review');
  assert.equal(obs.reconcileLedger(0.2), 'alert');
});
