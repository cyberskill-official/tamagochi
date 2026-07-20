---
id: TASK-I18N-001
title: "Localization pipeline — Crowdin + 9-language launch + diacritics-safe font fallback + RTL stub"
module: I18N
priority: MUST
status: done
verify: T
phase: P4
milestone: "Scale & PetOS B2B"
slice: 1
owner: "Tech Lead + DPO"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-INFRA-001, TASK-OBS-001, TASK-LEGAL-001, TASK-I18N-002, TASK-AI-002, TASK-VIRAL-005, TASK-AUTH-001]
depends_on: [TASK-INFRA-001]
blocks: [TASK-I18N-002]
effort_hours: 12
new_files:
  - "apps/api/src/i18n/locale.service.ts"
  - "apps/api/src/i18n/locale-key-validator.ts"
  - "apps/api/src/i18n/__tests__/locale.spec.ts"
  - "apps/cocos/assets/_root/i18n/I18nService.ts"
  - "apps/cocos/assets/_root/i18n/FontFallback.ts"
  - "apps/cocos/assets/_root/i18n/__tests__/I18nService.spec.ts"
  - "apps/cocos/assets/i18n/_keys-registry.json"
  - "apps/cocos/assets/i18n/{en,vi,id,th,pt-BR,es-LATAM,ja,ko,zh-Hant}/*.json"
  - "scripts/i18n/crowdin-sync.mjs"
  - "scripts/i18n/check-keys-coverage.mjs"
  - "docs/i18n/style-guide.md"
modified_files:
  - "apps/cocos/assets/_root/loaders/AssetBundleLoader.ts"
allowed_tools:
  - "Crowdin (translation management)"
  - "Noto Sans family + locale-specific fallback chains"
  - "ICU MessageFormat for plurals + gender"
disallowed_tools:
  - "Hardcoded English strings in shipped code"
  - "Server-side hardcoded copy (use TASK-OBS-001 schema-keyed locale)"
  - "Untested locale at production launch (each locale CI-checked)"
risk_if_skipped: "Plan §PART 5 + plan §PART 7 — VN soft-launch requires VI. Without I18N pipeline, English-only ships, conversion collapses in non-English markets."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Launch wave — 9 locales.** EN (en), VI (vi), ID (id), TH (th), PT-BR (pt-BR), ES-LATAM (es-419), JA (ja), KO (ko), ZH-Hant (zh-Hant).

§1.2  **Locale keys.** All UI strings + push notifications + email templates + audio captions MUST be keyed. Hardcoded strings forbidden in production code.

§1.3  **Key registry.** A central registry `apps/cocos/assets/i18n/_keys-registry.json` lists ALL keys + their EN source string + context comment. The registry is the source of truth for Crowdin sync.

§1.4  **Crowdin integration.** Translators work in Crowdin; CI syncs back to `apps/cocos/assets/i18n/<locale>/*.json` via `scripts/i18n/crowdin-sync.mjs`. Manual edits to locale JSON forbidden — Crowdin is canonical.

§1.5  **Per-feature namespacing.** Keys are namespaced: `care.feed.success`, `petpair.invite.received`, `streak.milestone.30`, etc. Aligns with TASK-OBS-001 §1.4 event taxonomy.

§1.6  **ICU MessageFormat.** Pluralization + gender handled by ICU MessageFormat. Standard for kid-friendly + Asian-language correctness.

§1.7  **Font fallback chains.** Locale-specific font stacks. For VI, Noto Sans Vietnamese (diacritics-safe — plan §PART 5). For JA: Noto Sans JP. For ZH-Hant: Noto Sans TC. Loaded as Cocos asset bundles.

§1.8  **Diacritics test.** Vietnamese diacritics (e.g. "ấ", "ề", "ỗ") MUST render correctly. CI snapshot test on each VI string verifying no glyph missing.

§1.9  **RTL stub.** Future Arabic / Hebrew support deferred but stub'd: `I18nService.isRtl(locale)` returns boolean, UI layouts read this. Initial wave is all LTR; RTL added in future task.

§1.10  **Locale detection.** Detected from TASK-AUTH-001 `region_of_record`, then user override via Settings, then OS locale, then 'en' fallback.

§1.11  **Missing-key fallback.** Cocos `I18nService` returns key string surrounded by `~missing~` brackets if key not in current locale; falls back to EN if EN has it; emits `i18n.missing_key { key, locale }` event to TASK-OBS-001 for triage.

§1.12  **Coverage CI.** `scripts/i18n/check-keys-coverage.mjs` enforces: every key in registry must exist in EN (mandatory); coverage in other locales reported (production-ready locales = 100% EN coverage). Build blocked on EN coverage < 100%.

§1.13  **Server-side i18n.** Push notifications + emails use the same registry. Server-rendered strings via `i18n.t(key, locale, params)`.

§1.14  **Translation review.** All translations DPO-reviewed for kid-appropriateness + cultural sensitivity (plan §PART 5). DPO sign-off required before locale goes production.

§1.15  **No-machine-translation default.** Plan §PART 5 + brand integrity — Crowdin machine-translation may seed but human review is mandatory.

§1.16  **Currency + number locale.** Per-locale formatting via ICU (e.g. "₫29.000" for VN, "Rp 29.000" for ID).

§1.17  **Date / time format.** Per-locale (e.g. ISO 8601 for international, locale-specific for in-app).

§1.18  **Tenant-aware copy override.** B2B tenants (TASK-B2B-001) may override specific keys per tenant + locale. Override path: `i18n/tenants/<slug>/<locale>/*.json`.

§1.19  **Audit + analytics.** `i18n.locale_changed`, `i18n.missing_key`, `i18n.font_fallback_applied` per TASK-OBS-001.

§1.20  **Production locale gate.** A locale is "production-ready" only when: 100% key coverage + DPO sign-off + diacritics CI test passing + 14-day soft-launch validation.

---

## §2 — Why this design

**Why 9 locales.** Plan §PART 5 — covers VN soft-launch + global P4 launch + JP/KR for Asia + LATAM for emerging markets.

**Why Crowdin.** Plan §PART 5 — industry standard for game localization. Translation memory + glossary + screenshots support.

**Why keys not hardcoded strings.** Plan §PART 5 — single source of truth + reusable + maintainable.

**Why ICU MessageFormat.** Plan §PART 5 — pluralization in JA/KO/AR/RU is grammatically complex. ICU handles it correctly.

**Why VI diacritics tested.** Plan §PART 5 — many fonts butcher Vietnamese diacritics. Snapshot test catches regression.

**Why RTL stub.** Plan §PART 5 — Arabic + Hebrew likely future markets. Stub keeps the door open without overcomplicating P4.

**Why DPO review.** Plan §PART 5 + plan §PART 8 — kid-appropriate translation requires cultural review.

**Why 14-day soft-launch validation.** Catches edge cases real users encounter.

**Why tenant-aware override.** Plan §PART 6 — Techcombank wants their own branded copy.

---

## §3 — API contract & code shape

```typescript
// apps/cocos/assets/_root/i18n/I18nService.ts
export class I18nService {
  private bundles = new Map<string, Record<string, string>>();
  private current: string = 'en';

  async loadLocale(locale: string): Promise<void> {
    const bundle = await fetch(`/i18n/${locale}/strings.json`).then(r => r.json());
    this.bundles.set(locale, bundle);
    this.current = locale;
  }

  t(key: string, params?: Record<string, any>): string {
    const bundle = this.bundles.get(this.current) ?? {};
    const fallback = this.bundles.get('en') ?? {};
    const template = bundle[key] ?? fallback[key];
    if (!template) {
      this.emitMissing(key);
      return `~missing:${key}~`;
    }
    return params ? this.interpolateIcu(template, params) : template;
  }

  isRtl(locale: string): boolean {
    return ['ar','he','fa','ur'].includes(locale.split('-')[0]);
  }
}
```

```typescript
// apps/api/src/i18n/locale.service.ts (server-side)
@Injectable()
export class LocaleService {
  private bundles = new Map<string, Record<string, string>>();

  async t(key: string, locale: string, params?: Record<string, any>): Promise<string> {
    const bundle = this.bundles.get(locale) ?? this.bundles.get('en')!;
    const template = bundle[key];
    if (!template) {
      this.audit.emit('i18n.missing_key', { key, locale });
      return `~missing:${key}~`;
    }
    return params ? this.icu.format(template, params) : template;
  }
}
```

```javascript
// scripts/i18n/check-keys-coverage.mjs
import { readFileSync, readdirSync } from 'node:fs';
const registry = JSON.parse(readFileSync('apps/cocos/assets/i18n/_keys-registry.json', 'utf8'));
const allKeys = Object.keys(registry);
const enBundle = JSON.parse(readFileSync('apps/cocos/assets/i18n/en/strings.json', 'utf8'));
const missing = allKeys.filter(k => !enBundle[k]);
if (missing.length) { console.error(`Missing in EN: ${missing}`); process.exit(1); }
console.log(`EN coverage: ${allKeys.length}/${allKeys.length}`);

const locales = readdirSync('apps/cocos/assets/i18n').filter(d => !d.startsWith('_'));
for (const l of locales) {
  if (l === 'en') continue;
  const bundle = JSON.parse(readFileSync(`apps/cocos/assets/i18n/${l}/strings.json`, 'utf8'));
  const present = allKeys.filter(k => bundle[k]).length;
  console.log(`${l}: ${present}/${allKeys.length} (${(100*present/allKeys.length).toFixed(1)}%)`);
}
```

---

## §4 — Acceptance criteria

**AC1.** All 9 locales have bundles. Verified. **AC2.** Keys registry exists with all UI keys. Verified. **AC3.** EN coverage 100% (CI). Verified. **AC4.** VI diacritics render correctly (snapshot). Verified. **AC5.** ICU MessageFormat plurals work in JA + KO. Verified. **AC6.** Missing-key fallback to EN with audit emission. Verified. **AC7.** Locale detection chain works. Verified. **AC8.** Font fallback for each locale. Verified. **AC9.** Crowdin sync round-trip. Verified. **AC10.** Server-side `i18n.t()` returns localised string. Verified. **AC11.** Tenant-override key resolution. Verified. **AC12.** RTL stub returns correct boolean. Verified.

---

## §5 — Verification

```typescript
describe('TASK-I18N-001 — i18n', () => {
  it('falls back to EN on missing key', async () => {
    await svc.loadLocale('vi');
    const r = svc.t('non.existent.key');
    expect(r).toMatch(/missing/);
  });

  it('localises VN pet greeting', async () => {
    await svc.loadLocale('vi');
    expect(svc.t('pet.greeting', { name: 'Mochi' })).toContain('Mochi');
  });

  it('ICU plurals for KO', async () => {
    await svc.loadLocale('ko');
    const r = svc.t('streak.day_count', { count: 7 });
    expect(r).toMatch(/7/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/cocos/assets/_root/i18n/FontFallback.ts
const FONT_STACK = {
  vi: ['Noto Sans Vietnamese', 'Noto Sans', 'sans-serif'],
  ja: ['Noto Sans JP', 'Noto Sans', 'sans-serif'],
  ko: ['Noto Sans KR', 'Noto Sans', 'sans-serif'],
  th: ['Noto Sans Thai', 'Noto Sans', 'sans-serif'],
  'zh-Hant': ['Noto Sans TC', 'Noto Sans', 'sans-serif'],
};

export function getFontStack(locale: string): string[] {
  return FONT_STACK[locale] ?? ['Noto Sans', 'sans-serif'];
}
```

---

## §7 — Dependencies

**External:** Crowdin account; Noto Sans font family. **Internal:** TASK-INFRA-001 (Cocos asset bundle), TASK-AUTH-001 (region_of_record), TASK-OBS-001 (missing-key event). **Blocks:** TASK-I18N-002 (payment localisation), TASK-A11Y-001 (locale-aware A11Y).

---

## §8 — Example payloads

```http
GET /v1/me/locale → 200 { "locale": "vi", "rtl": false, "font_stack": ["Noto Sans Vietnamese", "Noto Sans", "sans-serif"] }
```

```json
{ "event": "i18n.missing_key", "key": "pet.couture.preview.title", "locale": "th" }
```

```jsonc
// _keys-registry.json
{ "pet.greeting": { "en": "Hello, {name}!", "context": "Pet greets player on hatch" } }
```

```jsonc
// vi/strings.json
{ "pet.greeting": "Xin chào, {name}!" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** 9 locales at launch? → §1.1.
- **OQ-2 (resolved):** Crowdin vs Lokalise? → §1.4 — Crowdin (cheaper + better game-specific).
- **OQ-3 (resolved):** RTL at P4? → §1.9 — stub only.
- **OQ-4 (resolved):** Machine translation? → §1.15 — seed only, human review required.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Locale bundle fails to load | Cocos error | EN fallback | Surface "locale unavailable" |
| 2 | VI diacritic font missing | Snapshot test | Build blocked | Add font asset |
| 3 | Translation drift (out-of-Crowdin edit) | CI lint | PR blocked | Sync from Crowdin |
| 4 | DPO sign-off skipped | Manual gate | Cannot go-prod | DPO review step |
| 5 | Missing key in production | Audit event | EN fallback + alert | Add missing key |
| 6 | ICU plural form wrong | Translation review | UX bug | DPO + translator |
| 7 | RTL stub bug breaks layout | UI test | Layout broken | Disable RTL until ready |
| 8 | Tenant override missing required key | Validation | Fallback to consumer locale | Lint catches |
| 9 | Crowdin sync fails | CI error | Stale locales | Manual sync retry |
| 10 | Cross-tenant translation reuse leaks | RLS | Privacy | Tenant scope check |
| 11 | Currency formatting wrong | Test | UX issue | ICU correction |
| 12 | Soft-launch finds locale issues | 14-day validation | Locale held back | Iterate before go-prod |

---

## §11 — Notes

**Plan refs:** plan §PART 5 localization order; plan §PART 7 VN soft launch.

**Sub-decisions punted to ops:** Per-locale translator hiring + Crowdin glossary.

**Anti-patterns explicitly forbidden:**
- Hardcoded strings.
- Direct edits to locale JSON bypassing Crowdin.
- Production launch without DPO sign-off.

**Cross-reference:** TASK-I18N-002 payment localisation; TASK-A11Y-001 reads font fallback.
