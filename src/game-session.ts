import { AIService } from './ai.ts';
import { AuthService } from './auth.ts';
import { B2BService } from './b2b.ts';
import { CareService } from './care.ts';
import { EconomyService } from './economy.ts';
import { I18nA11yService } from './i18n-a11y.ts';
import { InfraService } from './infra.ts';
import { LegalService } from './legal.ts';
import { MediaService } from './media.ts';
import { ObservabilityService } from './observability.ts';
import { PetService } from './pet.ts';
import { SocialService } from './social.ts';
import type { UserProfile } from './types.ts';

export interface ScenarioResult {
  name: string;
  passed: boolean;
  evidence: Record<string, unknown>;
}

export class TamagochiGameSession {
  readonly legal = new LegalService();
  readonly infra = new InfraService();
  readonly auth = new AuthService();
  readonly obs = new ObservabilityService();
  readonly pets = new PetService();
  readonly care = new CareService();
  readonly ai = new AIService();
  readonly media = new MediaService();
  readonly econ = new EconomyService();
  readonly social = new SocialService();
  readonly i18n = new I18nA11yService();
  readonly b2b = new B2BService();

  runStandardPlayerJourney(): ScenarioResult {
    const user = this.auth.signIn('apple', 'standard-session-token');
    const hatch = this.pets.hatch(user, 'mochi', new Date('2026-05-18T08:00:00+07:00'));
    const pet = this.pets.namePet(user, hatch.pet.id, 'Mochi', hatch.hatchAnimationToken);
    this.care.feed(user, pet);
    this.care.clean(user, pet);
    this.care.hug(user, pet, new Date('2026-05-18T09:00:00+07:00'));
    this.pets.evolve(pet, new Date('2026-05-22T09:00:00+07:00'));
    const reply = this.ai.reply(user, pet, 'Are you ready for a video?');
    const clip = this.media.exportVerticalClip(pet, 'ar');
    this.obs.track('journey.standard.live_check', { pet_id: pet.id, stage: pet.stage }, user.tenantId);
    return {
      name: 'standard-player-hatch-care-ai-share',
      passed: pet.stage === 'adult' && clip.width === 1080 && reply.includes('Mochi'),
      evidence: { petId: pet.id, stage: pet.stage, clip, eventCount: this.obs.events.length }
    };
  }

  runKidSafeJourney(): ScenarioResult {
    this.legal.inspectKidsBinary(['GameAnalytics', 'Sentry']);
    const invite = this.auth.createKidInvite('parent@example.com');
    const kid = this.auth.verifyKidInvite(invite.code);
    const hatch = this.pets.hatch(kid, 'mochi', new Date('2026-05-18T08:00:00+07:00'));
    const pet = this.pets.namePet(kid, hatch.pet.id, 'Mimi', hatch.hatchAnimationToken);
    const dialogue = this.ai.reply(kid, pet, 'hello');
    this.econ.contextualKidAd(kid, { contextual: true, behavioral: false });
    return {
      name: 'under-13-parent-gated-safe-mode',
      passed: kid.parentVerified === true && !dialogue.includes('chirps'),
      evidence: { inviteCodeLength: invite.code.length, audience: kid.audienceAgeGate, dialogue }
    };
  }

  runSocialJourney(): ScenarioResult {
    const a = this.auth.signIn('apple', 'social-a-session');
    const b = this.auth.signIn('google', 'social-b-session');
    const petA = this.pets.hatch(a, 'mochi', new Date('2026-05-18T08:00:00+07:00')).pet;
    const petB = this.pets.hatch(b, 'pengu', new Date('2026-05-18T08:00:00+07:00')).pet;
    petA.stage = 'adult';
    petB.stage = 'adult';
    this.social.acceptInvite(a, b, this.social.inviteCode(a));
    const pair = this.social.createPetPair(petA, a, b);
    const receipt = this.social.recordCoParentCare(pair.pairId, a);
    const child = this.pets.breed(petA, petB);
    const trade = this.social.trade({ tenantId: 'mochi', a, b, offerA: petA, offerB: petB, confirmA: true, confirmB: true });
    const ceremony = this.social.ceremony(a, b, petA, petB);
    return {
      name: 'friend-coparent-breed-trade-ceremony',
      passed: trade.swapped && child.rarity === 'legendary' && ceremony.shareClip,
      evidence: { receipt, childRarity: child.rarity, ownerAfterTrade: petA.ownerId }
    };
  }

  runMonetizationJourney(): ScenarioResult {
    const user = this.auth.signIn('zalo', 'monetization-session');
    this.econ.grant(user, 'coins', 300, 'mini-game:session');
    const balanceAfterSpend = this.econ.spend(user, 'coins', 50, 'care.feed:food');
    this.econ.restoreSubscription(user, 'apple:subscription');
    const reward = this.econ.rewardedVideo(user, 'daily_bonus', true);
    const pass = this.econ.battlePass(user);
    return {
      name: 'ledger-iap-sub-ads-battle-pass',
      passed: balanceAfterSpend === 250 && user.petPlus === true && reward.interstitial === false && pass.tiers === 40,
      evidence: { balanceAfterSpend, reward, battlePass: pass, randomizedCatalogItems: this.econ.catalog.filter((item) => item.randomized).length }
    };
  }

  runTenantJourney(): ScenarioResult {
    const techUser: UserProfile = this.auth.signIn('zalo', 'techcombank-session', 'techcombank');
    const viettelUser: UserProfile = this.auth.signIn('zalo', 'viettel-session', 'viettel');
    const rows = [{ tenantId: techUser.tenantId, value: 1 }, { tenantId: viettelUser.tenantId, value: 2 }];
    const visible = this.b2b.rlsSelect(rows, techUser.tenantId);
    const theme = this.b2b.resolveTheme('techcombank');
    this.i18n.assertLocalizationPipeline();
    this.i18n.assertWcag({ foregroundL: 1, backgroundL: 0, reducedMotion: true, labels: ['Quest', 'Dashboard'] });
    return {
      name: 'petos-tenant-isolation-reference-tenants',
      passed: visible.length === 1 && theme.mascotCount === 3 && this.b2b.viettelReference().simBinding,
      evidence: { visible, theme, techcombank: this.b2b.techcombankReference(), viettel: this.b2b.viettelReference() }
    };
  }

  runAll(): ScenarioResult[] {
    return [
      this.runStandardPlayerJourney(),
      this.runKidSafeJourney(),
      this.runSocialJourney(),
      this.runMonetizationJourney(),
      this.runTenantJourney()
    ];
  }
}
