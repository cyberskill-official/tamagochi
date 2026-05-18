---
id: FR-A11Y-001
title: "WCAG-AA baseline — 4.5:1 contrast + reduce-motion + colour-blind palette + OpenDyslexic + VoiceOver/TalkBack labels"
module: A11Y
priority: MUST
status: shipped
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 1
owner: "Tech Lead + designer + DPO"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-INFRA-001, FR-ART-001, FR-PET-003, FR-CARE-001, FR-CARE-002, FR-OBS-001, FR-I18N-001, FR-LEGAL-001]
depends_on: [FR-INFRA-001, FR-ART-001]
blocks: []
effort_hours: 12
new_files:
  - "apps/cocos/assets/_root/a11y/AccessibilityService.ts"
  - "apps/cocos/assets/_root/a11y/ContrastChecker.ts"
  - "apps/cocos/assets/_root/a11y/preferences.ts"
  - "apps/cocos/assets/_root/a11y/__tests__/AccessibilityService.spec.ts"
  - "apps/cocos/native/ios/A11ySettingsBridge.swift"
  - "apps/cocos/native/android/A11ySettingsBridge.kt"
  - "docs/a11y/audit-checklist.md"
modified_files:
  - "apps/cocos/assets/_root/art/SpineLoader.ts"
  - "apps/cocos/assets/_root/pets/StatBar.ts"
  - "apps/cocos/assets/_root/care/BubbleParticle.ts"
allowed_tools:
  - "iOS UIAccessibility / Android AccessibilityManager"
  - "OpenDyslexic font"
  - "ColorBlindly contrast checker"
disallowed_tools:
  - "Reduce-motion ignored anywhere"
  - "Colour-only feedback (always accompanied by icon/text/sound)"
  - "Tap targets < 44×44 pt (Apple) or < 48 dp (Android)"
risk_if_skipped: "Apple Kids Category + UK ICO AADC + EU EAA — accessibility is a regulator gate. Without WCAG-AA baseline, app store reviews flag + accessibility-required regulators (US ADA) sue."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **WCAG-AA conformance target.** App MUST conform to WCAG 2.1 Level AA for the gameplay surface. Documented in `docs/a11y/audit-checklist.md`.

§1.2  **Text contrast.** All text MUST have contrast ratio ≥ 4.5:1 against background (3:1 for large text, ≥ 24pt). Verified by `ContrastChecker.ts` CI test.

§1.3  **Tap targets.** Minimum 44×44 pt (Apple) / 48 dp (Android) for all interactive elements. Kids SKU 88×88 pt minimum per FR-LEGAL-003 §1.11.

§1.4  **Reduce-motion mode.** App MUST detect `prefers-reduced-motion` (Cocos `sys.os` + native bridge) and:
- Cap idle animation frequency (per FR-ART-001 §1.18).
- Replace evolution morph cuts with fade.
- Skip particle bursts > 6 particles (FR-CARE-002 §1.12).
- Disable parallax / screen-shake.
- Disable AR camera-shake (FR-AR-001 §1.14).

§1.5  **Colour-blind palette swap.** Settings → Accessibility → Colour-blind preset selector with options: protanopia / deuteranopia / tritanopia / default. When set, all colour-coded UI (stat bars per FR-PET-003 §1.11, tier badges per FR-PET-006) uses adjusted palette.

§1.6  **Colour-independent feedback.** Every UI signal MUST have non-colour redundancy: icon, text label, sound, haptic. Stat-bar green/yellow/red also shows percentage text + sad-face icon when critical.

§1.7  **OpenDyslexic font option.** Settings → Accessibility → Toggle "Dyslexia-friendly font". When ON, all UI text renders with OpenDyslexic font.

§1.8  **VoiceOver (iOS) + TalkBack (Android) labels.** Every interactive element MUST have an accessibility label. Cocos `Node.accessibilityLabel` set on all buttons + named-pet sprites.

§1.9  **Focus order.** Tab + screen-reader navigation MUST follow logical reading order (top-to-bottom, left-to-right; right-to-left for RTL stub).

§1.10  **Skip-link for repetitive content.** "Skip animation" appears on the hatch ceremony (after midpoint per FR-PET-004 §1.12) + any long sequence.

§1.11  **Audio cues alongside visual.** Every primary feedback also plays audio (mute-respect per FR-ART-001 §1.14). E.g. feeding plays "om-nom" SFX in addition to animation.

§1.12  **No flashing > 3Hz.** WCAG 2.3.1 — content MUST NOT flash more than 3 times per second. Mini-game rhythm games + evolution effects audited.

§1.13  **Closed captions on AI dialogue.** Per FR-AI-001, dialogue text is always visible (no audio-only delivery). For TTS-read mode (opt-in), captions remain.

§1.14  **Settings — accessibility section.** Single screen showing all toggles: reduce-motion, colour-blind preset, dyslexia font, screen-reader hints, tap-target enlarge (1.5× option).

§1.15  **Audit CI step.** `pnpm a11y:check` runs:
- Contrast ratio on all text/background pairs.
- Tap target ≥ 44pt verification.
- Accessibility label coverage (every interactive element).
- Reduce-motion respect in 10 documented paths.

§1.16  **Language-aware text expansion.** UI layouts MUST tolerate 30% text expansion (e.g. German ≈ 1.3× English). Per FR-I18N-001 9-language wave.

§1.17  **DPO-reviewed a11y audit.** Annual external accessibility audit (e.g. by Deque or accessibility consultant). Issues filed for next release.

§1.18  **Kids SKU specific.** Per FR-LEGAL-003 — kids gets 1.3× base font + 88×88 pt taps. Apple Kids Category baseline.

§1.19  **Tenant-aware a11y override.** B2B tenants (FR-B2B-001) inherit baseline; may not REMOVE accessibility features, only add.

§1.20  **Analytics.** `a11y.reduce_motion.enabled`, `a11y.colour_blind.preset_changed`, `a11y.dyslexia_font.enabled` per FR-OBS-001 — informs prioritisation.

---

## §2 — Why this design

**Why WCAG-AA target.** Plan §PART 5 — Apple Kids Category, ICO AADC, EU EAA all converge on AA conformance for kid-app baseline.

**Why 4.5:1 contrast.** WCAG standard.

**Why colour-independent feedback.** Plan §PART 5 — green/red is the canonical pitfall. Icon + text + sound layers ensure access regardless of colour vision.

**Why OpenDyslexic.** Plan §PART 5 — dyslexia-friendly option is increasingly expected.

**Why no flashing > 3Hz.** WCAG 2.3.1 — photosensitive epilepsy.

**Why text expansion 30%.** Internationalization reality — German/Russian typically 1.3× English; UI must accommodate.

**Why external annual audit.** Plan §PART 5 + plan §PART 10 — accessibility regression is silent without external eyes.

---

## §3 — API contract & code shape

```typescript
// apps/cocos/assets/_root/a11y/preferences.ts
export interface A11yPreferences {
  reduceMotion: boolean;
  colorBlindPreset: 'default' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  dyslexiaFont: boolean;
  enlargedTaps: boolean;
  screenReaderHints: boolean;
}

export class AccessibilityService {
  private prefs: A11yPreferences = this.loadDefaults();

  loadFromOs(): void {
    const reduceMotion = NativeA11yBridge.prefersReducedMotion();
    this.prefs.reduceMotion = reduceMotion;
  }

  prefersReducedMotion(): boolean { return this.prefs.reduceMotion; }
  colorPaletteFor(stat: string): { color: string; label: string } { /* maps per preset */ return {} as any; }
  applyToScene(scene: cc.Scene): void {
    if (this.prefs.dyslexiaFont) this.swapFonts(scene, 'OpenDyslexic');
    if (this.prefs.enlargedTaps) this.scaleInteractiveElements(scene, 1.5);
  }
}
```

```typescript
// apps/cocos/assets/_root/a11y/ContrastChecker.ts
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(parseColor(fg));
  const l2 = relativeLuminance(parseColor(bg));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function ensureContrast(fg: string, bg: string, threshold = 4.5): boolean {
  return contrastRatio(fg, bg) >= threshold;
}
```

---

## §4 — Acceptance criteria

**AC1.** All text contrast ≥ 4.5:1 verified by CI. Verified.
**AC2.** Tap targets ≥ 44pt standard / 88pt kids. Verified.
**AC3.** Reduce-motion detected from OS. Verified.
**AC4.** Reduce-motion applied across 10 documented paths. Verified.
**AC5.** Colour-blind presets render correctly. Verified by visual regression.
**AC6.** OpenDyslexic font toggle works. Verified.
**AC7.** VoiceOver labels present on every interactive node. Verified by accessibility tree dump.
**AC8.** No content flashing > 3Hz. Verified.
**AC9.** Captions on AI dialogue. Verified.
**AC10.** UI tolerates 30% text expansion. Verified by simulator.
**AC11.** Kids SKU 1.3× base font. Verified.
**AC12.** Settings accessibility screen functional. Verified.

---

## §5 — Verification

```typescript
describe('FR-A11Y-001 — WCAG-AA', () => {
  it('contrast ≥ 4.5:1 for body text', () => {
    expect(contrastRatio('#1a1a1a', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('respects reduce-motion', () => {
    a11y.setReduceMotion(true);
    expect(a11y.prefersReducedMotion()).toBe(true);
    const particleCount = BubbleParticle.particleCountForCurrentPrefs();
    expect(particleCount).toBe(6);
  });

  it('OpenDyslexic font applies', () => {
    a11y.setDyslexiaFont(true);
    a11y.applyToScene(mockScene);
    expect(mockScene.fontFamilyUsed).toBe('OpenDyslexic');
  });
});
```

---

## §6 — Implementation skeleton

```swift
// apps/cocos/native/ios/A11ySettingsBridge.swift
@objc class A11ySettingsBridge: NSObject {
  @objc static func prefersReducedMotion() -> Bool {
    return UIAccessibility.isReduceMotionEnabled
  }
  @objc static func voiceOverRunning() -> Bool {
    return UIAccessibility.isVoiceOverRunning
  }
}
```

---

## §7 — Dependencies

**External:** OpenDyslexic font; iOS UIAccessibility; Android AccessibilityManager.
**Internal:** FR-INFRA-001 (Cocos scene), FR-ART-001 (animation reduce-motion path), FR-PET-003 (stat-bar colour-blind), FR-I18N-001 (text expansion), FR-CARE-002 (particle cap).
**Blocks:** none.

---

## §8 — Example payloads

```json
{ "event": "a11y.reduce_motion.enabled", "user_id": "01HU...", "source": "os_preference" }
```

```json
{ "event": "a11y.colour_blind.preset_changed", "preset": "deuteranopia", "user_id": "01HU..." }
```

```json
{
  "preferences": {
    "reduce_motion": true,
    "colour_blind_preset": "deuteranopia",
    "dyslexia_font": false,
    "enlarged_taps": false
  }
}
```

```text
Audit-checklist excerpt:
  ✓ Hatch ceremony: reduce-motion fade applied
  ✓ Mini-game rhythm: no flashing > 3Hz
  ✓ Stat-bar: numeric value visible on long-press
  ✓ Pet evolution: skip CTA after midpoint
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** WCAG-AA vs AAA? → §1.1 — AA at P4; AAA aspirational.
- **OQ-2 (resolved):** Tap target 44 vs 48? → §1.3 — Apple 44pt, Android 48dp.
- **OQ-3 (resolved):** External audit? → §1.17 — annual.
- **OQ-4 (resolved):** Kids 1.3× font? → §1.18 — per FR-LEGAL-003.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Contrast regression on UI change | CI fails | PR blocked | Adjust colours |
| 2 | Tap target too small | CI fails | PR blocked | Enlarge |
| 3 | Reduce-motion missed on new animation | UI test | Regression | Add to documented paths |
| 4 | OpenDyslexic font missing | Asset bundle | Build fails | Add font asset |
| 5 | VoiceOver label missing | A11y tree dump | UI test fails | Add label |
| 6 | Flashing >3Hz on mini-game | Frame-rate analysis | Photosensitive risk | Throttle |
| 7 | Text overflow at 30% expansion | Visual regression | UI broken | Refactor layout |
| 8 | Colour-blind preset breaks brand | Designer review | Visual issue | Refine palette |
| 9 | OS a11y bridge fails | Sentry | Fallback to defaults | Investigate |
| 10 | Annual audit issues backlog | DPO | Compliance gap | Prioritize |
| 11 | Kids 1.3× font breaks layout | CI test | Build fail | Refactor |
| 12 | Tenant override removes a11y | Lint | Block tenant deploy | Validate |

---

## §11 — Notes

**Plan refs:** plan §PART 5 accessibility.

**Sub-decisions punted to ops:** External audit vendor selection annually.

**Anti-patterns explicitly forbidden:**
- Colour-only feedback.
- Reduce-motion ignored.
- Tap targets below WCAG minimum.

**Cross-reference:** FR-ART-001 reduce-motion paths; FR-PET-003 colour-blind palette; FR-LEGAL-003 kids tap-target sizing; FR-I18N-001 text expansion.
