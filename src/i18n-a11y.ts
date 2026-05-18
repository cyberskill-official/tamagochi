import { assert } from './utils.ts';

export class I18nA11yService {
  readonly locales = ['en', 'vi', 'id', 'th', 'pt-BR', 'es-LATAM', 'ja', 'ko', 'zh-Hant'];
  readonly paymentRails = ['MoMo', 'ZaloPay', 'VNPay', 'ViettelPay', 'GCash', 'DANA'];
  readonly fontFallback = ['Noto Sans', 'Noto Sans Vietnamese', 'Noto Sans Thai', 'Noto Sans CJK'];

  assertLocalizationPipeline(): true {
    assert(this.locales.length === 9, 'i18n.locale_count');
    assert(this.fontFallback.includes('Noto Sans Vietnamese'), 'i18n.vietnamese_font_missing');
    return true;
  }

  priceDisplay(country: 'VN' | 'PH' | 'ID', sku: string): { sku: string; taxInclusive: true; railCount: number } {
    return { sku, taxInclusive: true, railCount: country === 'VN' ? 4 : 1 };
  }

  contrastRatio(foregroundL: number, backgroundL: number): number {
    const lighter = Math.max(foregroundL, backgroundL);
    const darker = Math.min(foregroundL, backgroundL);
    return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  }

  assertWcag(input: { foregroundL: number; backgroundL: number; reducedMotion: boolean; labels: string[]; font?: string }): true {
    assert(this.contrastRatio(input.foregroundL, input.backgroundL) >= 4.5, 'a11y.contrast_fail');
    assert(input.reducedMotion === true, 'a11y.reduced_motion_missing');
    assert(input.labels.every(Boolean), 'a11y.missing_screen_reader_label');
    return true;
  }
}
