import type { AudienceAgeGate, BuildTarget } from './types.ts';
import { assert, hasBlockedText } from './utils.ts';

export class LegalService {
  readonly dpoAppointed = true;
  readonly dpiaFiledWithA05 = true;
  readonly crossBorderTiaFiled = true;
  readonly breachNotificationWindowHours = 72;
  readonly safeHarborVendor: 'PRIVO' | 'SuperAwesome kWS' = 'PRIVO';
  readonly kidsEffectiveDate = '2026-04-22';

  complianceBaselineReady(): boolean {
    return this.dpoAppointed && this.dpiaFiledWithA05 && this.crossBorderTiaFiled && this.safeHarborVendor.length > 0;
  }

  validateBranding(value: string): true {
    assert(!hasBlockedText(value, ['tamagotchi', 'digital pet', 'egg-shaped']), 'legal.branding.blocked_bandai_term');
    return true;
  }

  assertDeterministicPurchase(input: { realMoney: boolean; randomized: boolean; disclosure?: boolean }): true {
    assert(!(input.realMoney && input.randomized), 'legal.no_real_money_randomized_loot_boxes');
    if (input.randomized) assert(input.disclosure === true, 'legal.drop_rate_disclosure_required');
    return true;
  }

  storeDeclaration(target: BuildTarget): {
    target: BuildTarget;
    behavioralAds: false;
    externalLinksRequireParentalGate: true;
    contextualAdsOnly: boolean;
    thirdPartyAnalytics: string[];
  } {
    return {
      target,
      behavioralAds: false,
      externalLinksRequireParentalGate: true,
      contextualAdsOnly: target === 'kids',
      thirdPartyAnalytics: target === 'kids' ? ['GameAnalytics', 'Sentry'] : ['GameAnalytics', 'Mixpanel', 'AppsFlyer', 'Sentry']
    };
  }

  allowedSdksForAudience(audience: AudienceAgeGate): string[] {
    if (audience === 'under-13') return ['GameAnalytics', 'Sentry', 'SuperAwesome kWS'];
    return ['GameAnalytics', 'Mixpanel', 'AppsFlyer', 'Sentry', 'Better Stack', 'LevelPlay', 'AppLovin MAX'];
  }

  inspectKidsBinary(sdks: string[]): true {
    const allowed = new Set(this.allowedSdksForAudience('under-13'));
    const forbidden = sdks.filter((sdk) => !allowed.has(sdk));
    assert(forbidden.length === 0, `legal.kids_forbidden_sdk:${forbidden.join(',')}`);
    return true;
  }
}
