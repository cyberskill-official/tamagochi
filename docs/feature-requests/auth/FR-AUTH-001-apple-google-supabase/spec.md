---
id: FR-AUTH-001
title: "Apple Sign-In + Google Sign-In via Supabase Auth + Cocos native bridge"
module: AUTH
priority: MUST
status: done
verify: T
phase: P0
milestone: "Foundation Gate"
slice: 1
owner: "Tech Lead + Intern (FE)"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-INFRA-001, FR-INFRA-002, FR-INFRA-003, FR-AUTH-002, FR-AUTH-003, FR-LEGAL-001, FR-LEGAL-003, FR-OBS-001, FR-SUB-001, FR-SUB-002]
depends_on: [FR-INFRA-003]
blocks: [FR-AUTH-002, FR-AUTH-003, FR-SUB-001, FR-B2B-003]
effort_hours: 10
new_files:
  - "apps/cocos/assets/_root/auth/AuthService.ts"
  - "apps/cocos/assets/_root/auth/SocialProvider.ts"
  - "apps/cocos/assets/_root/auth/__tests__/AuthService.spec.ts"
  - "apps/cocos/native/ios/AppleSignInBridge.swift"
  - "apps/cocos/native/android/GoogleSignInBridge.kt"
  - "apps/cocos/native/web/WebSocialSignIn.ts"
  - "apps/api/src/auth/auth.controller.ts"
  - "apps/api/src/auth/auth.service.ts"
  - "apps/api/src/auth/region-derivation.service.ts"
  - "apps/api/src/auth/__tests__/auth.spec.ts"
  - "apps/api/src/auth/__tests__/region-derivation.spec.ts"
  - "infra/supabase/standard/migrations/20260517_004_auth_app_users.sql"
modified_files:
  - "infra/supabase/standard/config.toml"
  - "apps/cocos/package.json"
allowed_tools:
  - "Apple AuthenticationServices (ASAuthorizationAppleIDProvider — iOS)"
  - "Google Sign-In SDK for Android (com.google.android.gms:play-services-auth)"
  - "Google Identity Services JS (web)"
  - "Supabase Auth (sign in with ID token flow)"
  - "Cocos native plugin bridge"
disallowed_tools:
  - "Email/password authentication for the consumer SKU (passwordless via Apple/Google/Zalo/magic-link only)"
  - "Facebook Sign-In (deferred — adds tracking concerns)"
  - "Twitter/X Sign-In (deferred — API instability)"
  - "Embedding service_role keys client-side (re: FR-INFRA-003 §1.6)"
risk_if_skipped: "Without a working multi-provider sign-in, no FR that requires player identity can be delivered; the kids SKU specifically cannot ship without parental consent ↔ child account binding, which requires this FR's `region_of_record` derivation."
audience_age_gate: "any"
---

## §1 — Description (BCP-14 normative)

§1.1  **Apple Sign-In on iOS.** The iOS app MUST integrate Apple Sign-In via the `ASAuthorizationAppleIDProvider` API (Authentication Services framework). The native Swift bridge at `apps/cocos/native/ios/AppleSignInBridge.swift` MUST: (a) request `[.fullName, .email]` scopes on first sign-in; (b) deliver the Apple ID token to Cocos via the documented native-to-JS bridge; (c) handle the "Hide my email" private relay path correctly (treat relay emails as the canonical email).

§1.2  **Google Sign-In on Android.** The Android app MUST integrate Google Sign-In via `com.google.android.gms:play-services-auth` v21+. The native Kotlin bridge at `apps/cocos/native/android/GoogleSignInBridge.kt` MUST: (a) request `email` + `profile` scopes; (b) return the Google ID token to Cocos via the bridge; (c) handle credential-fail / cancellation cleanly.

§1.3  **Cross-platform sign-in on web.** The WebGL build MUST integrate **Google Identity Services JS** (`google.accounts.id`) for Google sign-in. Apple Sign-In on web MUST be available via the JS SDK (Apple's `appleid.auth.js`). Both flows MUST return ID tokens to Cocos via a documented `WebSocialSignIn.ts` adapter.

§1.4  **Supabase ID-token exchange.** The Cocos client MUST exchange the provider ID token for a Supabase session via `supabase.auth.signInWithIdToken({ provider, token, nonce })`. The exchange MUST happen client-side (Supabase Auth handles the verification + session issuance). The resulting Supabase JWT MUST be persisted in the Cocos `localStorage` (web) or platform-secure storage (iOS Keychain / Android EncryptedSharedPreferences).

§1.5  **Nonce + replay protection.** Apple's ID token includes a `nonce` claim; the client MUST generate a CSPRNG nonce, pass it to Apple's sign-in call, and pass it to Supabase's `signInWithIdToken`. Supabase Auth verifies the nonce server-side.

§1.6  **Region of record derivation.** Per FR-LEGAL-001 §1.11, on first successful sign-in the API MUST derive `region_of_record` using the deterministic chain: explicit user choice → Apple/Google account region (from the ID token's `country` claim where available) → fallback IP geo → "confirm your country" gate. The derived region MUST be persisted to `public.app_users.region_of_record`.

§1.7  **Policy version stamp.** On first successful sign-in (and on every subsequent sign-in if the policy version has changed), the API MUST stamp `public.app_users.policy_version` with the current `tamagochi-privacy-en-v<X.Y.Z>` git-tagged version. A version bump on a material change MUST trigger consent re-confirmation per FR-LEGAL-001 AC11.

§1.8  **`audience_age_gate` resolution at sign-in time.** The API MUST resolve `audience_age_gate` based on the SKU the sign-in is happening through: if the request is from the kids SKU bundle ID (verified via the JWT custom claim `sku_origin` set by build-target injection per FR-LEGAL-003 §1.3), `audience_age_gate = "under-13"`; otherwise `audience_age_gate = "13+"`.

§1.9  **No account commingling across SKUs.** If a user signs in on the standard SKU with an Apple/Google identity that has previously signed into the kids SKU, the API MUST refuse the sign-in with a clear error message ("This account is registered as a children's account. Please use the Tamagochi Kids app to sign in.") and surface the graduation flow (FR-INFRA-003 §1.13) as the only path between SKUs.

§1.10  **Sign-out flow.** A `POST /v1/auth/sign-out` endpoint MUST revoke the Supabase session AND emit an audit-log row. The Cocos client MUST clear the locally persisted JWT.

§1.11  **Token refresh handling.** Supabase issues access tokens with default 1-hour lifetime + refresh tokens. The Cocos client's `AuthService.ts` MUST call `supabase.auth.refreshSession()` proactively when the access token is within 5 minutes of expiry. On refresh failure (refresh token revoked or expired), the client MUST gracefully return to the sign-in screen with state preserved.

§1.12  **Native-bridge security.** Tokens MUST NEVER cross the native-bridge boundary as plain string. The Swift / Kotlin bridge MUST serialise tokens as a JSON object with a `bridge_version` field; Cocos MUST validate the version before consuming. A mismatched bridge version triggers a forced app update prompt.

§1.13  **Disable email/password for consumer SKU.** Supabase's email/password sign-in MUST be disabled in both project configs (`config.toml` `[auth.email] enable_signup = false`). Magic-link fallback (for desktop test rigs) MAY be enabled for the standard project only via service-role API in development; production MUST disable it.

§1.14  **Observability.** Every sign-in attempt MUST emit `auth.signin.attempt { provider, sku, outcome }`. Failures emit `auth.signin.failure { provider, sku, error_class }`. Successful sign-ins write to `auth_audit_log` table.

§1.15  **Apple Sign-In privacy compliance.** Apple Sign-In is REQUIRED by Apple App Store Review if any third-party social sign-in is offered. The standard SKU offers Google + Apple; the kids SKU offers neither directly (parental consent flow per FR-AUTH-003 is the only entry).

§1.16  **Edge case: Apple "Hide my email."** When Apple returns a relay email (`xyz@privaterelay.appleid.com`), the API MUST persist it as the canonical email and respect Apple's relay deliverability rules (only send via the registered sender domain). The relay email MUST NEVER be merged with a non-relay email for the same user.

§1.17  **Cocos native bridge test seam.** The `AuthService.ts` MUST have a `setNativeBridgeForTest()` seam so unit tests can mock the bridge. Production builds reject this seam via `process.env.NODE_ENV !== 'production'` check.

§1.18  **Sign-in latency budget.** P95 sign-in latency (tap "Sign in with Apple/Google" → app-ready state) MUST be ≤ 3 seconds on a mid-tier device + 4G network. Sentry transactions tag `auth.signin.latency_ms`.

§1.19  **Account-deletion path.** Per Apple App Store policy (Guideline 5.1.1(v)) any app offering account creation MUST offer in-app account deletion. A `POST /v1/auth/delete-account` endpoint MUST: (a) verify the user; (b) open a 30-day grace window (configurable); (c) emit an audit row; (d) at grace expiry, hard-delete via DSR-erasure flow (FR-LEGAL-001 §1.9).

§1.20  **Multi-device session sharing.** A user signing in on two devices MUST see consistent pet state via the Colyseus presence layer (FR-INFRA-002 §1.4). Multi-device sessions are NOT mutually exclusive — both can play concurrently, with Colyseus reconciliation.

---

## §2 — Why this design

**Why Supabase Auth's `signInWithIdToken` flow.** Supabase Auth handles ID-token verification against Apple/Google JWKS endpoints + issues its own Supabase JWT in one round-trip. Building this ourselves would duplicate verification logic and add a security-review surface. The flow is OAuth-compliant.

**Why platform-native sign-in instead of OAuth web redirect.** Apple Guideline 4.8 requires the system Apple Sign-In sheet (not a webview) when offered. Google's recommendation is the Identity Services SDK on mobile (better consent UX, faster). The web build uses the JS SDK which is the canonical web flow.

**Why disable email/password.** Passwordless authentication is the modern UX standard for consumer mobile apps. Email/password adds breach-blast-radius (every leak is a credential leak), reset flows, password-hint UX, and CAPTCHA pressure. Apple Sign-In + Google + Zalo (FR-AUTH-002) cover ~99% of the target VN/global audience.

**Why a CSPRNG nonce for Apple.** Apple's ID token replay protection requires the relying party to seed a nonce. Skipping it is technically valid for Apple but breaks Supabase's verification requirements.

**Why "Hide my email" handled explicitly.** Apple relay emails (`*@privaterelay.appleid.com`) are first-class user identities under Apple's privacy framework. Treating them as second-class causes UX confusion (a re-sign-in maps to a new account) and Apple Review rejection.

**Why no SKU commingling.** Per FR-LEGAL-001 + FR-INFRA-003 §1.1, two databases means a user's identity is partitioned by SKU. The explicit refusal message + graduation flow prevents silent data spread.

**Why proactive token refresh.** A token expiring mid-feed (in the middle of a Colyseus session) drops the WebSocket and resets state. Refreshing 5 min ahead of expiry keeps sessions stable.

**Why native-bridge versioning.** Native bridges drift when the app is reinstalled at a different version. A version mismatch is a real cause of "infinite loading" support tickets.

**Why account-deletion in-app required.** Apple Guideline 5.1.1(v) enforced since June 2022 — non-compliance is a hard rejection.

**Why ≤ 3 s P95 sign-in.** Mobile-game soft-launch retention is sensitive to sign-in friction. Above 3 s users drop. Sentry transactions catch regressions.

**Why multi-device sessions are concurrent.** PetPair (FR-SOCIAL-002) explicitly requires co-parent multi-device. Forcing single-device login would block PetPair. Colyseus presence + room reconciliation handles consistency.

---

## §3 — API contract & code shape

### 3.1 — Cocos AuthService

```typescript
// apps/cocos/assets/_root/auth/AuthService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class AuthService {
  private supa: SupabaseClient;
  constructor(opts: { supabaseUrl: string; anonKey: string }) {
    this.supa = createClient(opts.supabaseUrl, opts.anonKey, {
      auth: { persistSession: true, storageKey: 'tamagochi.auth' },
    });
  }

  async signInWithApple(token: string, nonce: string): Promise<void> {
    const { data, error } = await this.supa.auth.signInWithIdToken({
      provider: 'apple', token, nonce,
    });
    if (error) throw error;
    await this.afterSignIn(data.session!.access_token);
  }

  async signInWithGoogle(token: string): Promise<void> {
    const { data, error } = await this.supa.auth.signInWithIdToken({
      provider: 'google', token,
    });
    if (error) throw error;
    await this.afterSignIn(data.session!.access_token);
  }

  private async afterSignIn(jwt: string): Promise<void> {
    await fetch(`${process.env.API_URL}/v1/auth/after-signin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, 'content-type': 'application/json' },
      body: JSON.stringify({ sku_origin: __BUILD_TARGET__ }),
    });
  }

  async refreshIfStale(): Promise<void> {
    const { data: { session } } = await this.supa.auth.getSession();
    if (!session) return;
    const expiresInSec = session.expires_at! - Math.floor(Date.now() / 1000);
    if (expiresInSec < 300) await this.supa.auth.refreshSession();
  }
}
```

### 3.2 — Apple Swift bridge

```swift
// apps/cocos/native/ios/AppleSignInBridge.swift
import AuthenticationServices

@objc class AppleSignInBridge: NSObject, ASAuthorizationControllerDelegate {
  static let shared = AppleSignInBridge()
  private var pendingNonce: String?

  @objc func signIn(_ nonce: String) {
    self.pendingNonce = nonce
    let req = ASAuthorizationAppleIDProvider().createRequest()
    req.requestedScopes = [.fullName, .email]
    req.nonce = sha256(nonce)
    let ctrl = ASAuthorizationController(authorizationRequests: [req])
    ctrl.delegate = self
    ctrl.performRequests()
  }

  func authorizationController(controller: ASAuthorizationController,
    didCompleteWithAuthorization auth: ASAuthorization) {
    guard let cred = auth.credential as? ASAuthorizationAppleIDCredential,
          let tokenData = cred.identityToken,
          let token = String(data: tokenData, encoding: .utf8) else { return }
    CocosBridge.emit("apple.signin.success", [
      "bridge_version": "1",
      "token": token,
      "nonce": pendingNonce ?? "",
    ])
  }
}
```

### 3.3 — Auth controller (Nest)

```typescript
// apps/api/src/auth/auth.controller.ts
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @UseGuards(SupabaseJwtGuard)
  @Post('after-signin')
  async afterSignIn(@CurrentUser() u: AuthedUser, @Body() body: { sku_origin: 'kids' | 'standard' }) {
    return this.svc.afterSignIn(u, body.sku_origin);
  }

  @UseGuards(SupabaseJwtGuard)
  @Post('sign-out')
  async signOut(@CurrentUser() u: AuthedUser) {
    return this.svc.signOut(u);
  }

  @UseGuards(SupabaseJwtGuard)
  @Post('delete-account')
  async deleteAccount(@CurrentUser() u: AuthedUser) {
    return this.svc.openAccountDeletion(u);
  }
}
```

### 3.4 — Region derivation service

```typescript
// apps/api/src/auth/region-derivation.service.ts
@Injectable()
export class RegionDerivationService {
  async derive(ctx: {
    explicit?: string;
    appleCountry?: string;
    googleCountry?: string;
    zaloCountry?: string;
    ip?: string;
  }): Promise<{ region: string; source: string; needsConfirmation: boolean }> {
    if (ctx.explicit)      return { region: ctx.explicit,      source: 'explicit',  needsConfirmation: false };
    if (ctx.appleCountry)  return { region: ctx.appleCountry,  source: 'apple',     needsConfirmation: false };
    if (ctx.googleCountry) return { region: ctx.googleCountry, source: 'google',    needsConfirmation: false };
    if (ctx.zaloCountry)   return { region: ctx.zaloCountry,   source: 'zalo',      needsConfirmation: false };
    if (ctx.ip) {
      const geo = await this.geoFromIp(ctx.ip);
      return { region: geo, source: 'ip', needsConfirmation: true };
    }
    return { region: 'unknown', source: 'fallback', needsConfirmation: true };
  }
}
```

---

## §4 — Acceptance criteria

**AC1.** Apple Sign-In on iOS produces a Supabase session. Verified by Detox UI test on iOS Simulator with the Apple sandbox account.

**AC2.** Google Sign-In on Android produces a Supabase session. Verified by Detox UI test with a test Google account.

**AC3.** Web Google Sign-In produces a Supabase session in the WebGL build. Verified by Playwright headed test.

**AC4.** Apple relay emails are persisted as canonical email; a subsequent Apple sign-in with the same relay does not create a new account. Verified by `__tests__/auth.spec.ts`.

**AC5.** Sign-in on the standard SKU with an identity registered in the kids SKU returns HTTP 409 with the graduation message. Verified by `__tests__/auth.spec.ts` with a pre-seeded kids account.

**AC6.** Token refresh fires when < 5 min remaining. Verified by `__tests__/AuthService.spec.ts` with fake timers.

**AC7.** Account-deletion endpoint opens a 30-day grace window and emits an audit row. Verified by `__tests__/auth.spec.ts`.

**AC8.** Region-of-record derivation chain returns the highest-priority signal. Verified by `__tests__/region-derivation.spec.ts` with each branch.

**AC9.** Policy-version stamp updates on sign-in when version has changed since last sign-in. Verified by `__tests__/auth.spec.ts` rotating policy_version mid-test.

**AC10.** P95 sign-in latency on iOS Simulator + Android Emulator ≤ 3 s. Verified by Sentry transaction sampling on the test cohort.

**AC11.** Bridge-version mismatch triggers a force-update prompt. Verified by `__tests__/AuthService.spec.ts` with a mocked bridge emitting `bridge_version: "999"`.

**AC12.** Email/password sign-up is disabled in both Supabase project configs. Verified by reading `config.toml` `enable_signup = false`.

---

## §5 — Verification

### 5.1 — AuthService unit test (token refresh)

```typescript
// apps/cocos/assets/_root/auth/__tests__/AuthService.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../AuthService';

describe('FR-AUTH-001 §1.11 — proactive token refresh', () => {
  it('refreshes when < 5 min remaining', async () => {
    const svc = new AuthService({ supabaseUrl: 'http://x', anonKey: 'y' });
    const expiresAt = Math.floor(Date.now() / 1000) + 200;  // 200 sec
    vi.spyOn(svc['supa'].auth, 'getSession').mockResolvedValue({ data: { session: { expires_at: expiresAt } } } as any);
    const spy = vi.spyOn(svc['supa'].auth, 'refreshSession').mockResolvedValue({} as any);
    await svc.refreshIfStale();
    expect(spy).toHaveBeenCalled();
  });
});
```

### 5.2 — Region derivation unit test

```typescript
// apps/api/src/auth/__tests__/region-derivation.spec.ts
import { describe, it, expect } from 'vitest';
import { RegionDerivationService } from '../region-derivation.service';

describe('FR-AUTH-001 §1.6 — region derivation', () => {
  const svc = new RegionDerivationService();

  it.each([
    { explicit: 'VN',                   expected: 'VN',  source: 'explicit' },
    { appleCountry: 'US',                expected: 'US',  source: 'apple' },
    { googleCountry: 'PH',               expected: 'PH',  source: 'google' },
    { zaloCountry: 'VN',                 expected: 'VN',  source: 'zalo' },
  ])('returns $expected from $source signal', async (ctx) => {
    const r = await svc.derive(ctx as any);
    expect(r.region).toBe(ctx.expected);
    expect(r.source).toBe(ctx.source);
  });

  it('falls back to IP geo with needsConfirmation', async () => {
    const r = await svc.derive({ ip: '203.0.113.5' });
    expect(r.needsConfirmation).toBe(true);
    expect(r.source).toBe('ip');
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly users: AppUsersRepo,
    private readonly region: RegionDerivationService,
    private readonly policy: PolicyVersionService,
    private readonly audit: AuditLogService,
  ) {}

  async afterSignIn(u: AuthedUser, skuOrigin: 'kids' | 'standard') {
    const expectedSku = u.tenant_id === 'mochi' && skuOrigin === 'kids' ? 'kids' : 'standard';
    const existing = await this.users.findByAppleOrGoogleId(u.providerId);
    if (existing && existing.audience_age_gate === 'under-13' && skuOrigin !== 'kids') {
      throw new HttpException({
        error: 'account_registered_as_child', graduation_url: '/graduation',
      }, HttpStatus.CONFLICT);
    }
    const region = await this.region.derive({
      appleCountry: u.appleCountry, googleCountry: u.googleCountry, ip: u.ip,
    });
    await this.users.upsert({
      id: u.id,
      tenant_id: 'mochi',
      display_name: u.displayName ?? `Player-${u.id.slice(0, 6)}`,
      region_of_record: region.region,
      audience_age_gate: skuOrigin === 'kids' ? 'under-13' : '13+',
      policy_version: await this.policy.current(),
    });
    await this.audit.write({ who: u.id, what: 'auth.signin.success', source: skuOrigin });
  }
}
```

---

## §7 — Dependencies

**External:** Apple Developer account (Sign in with Apple capability enabled). Google Cloud OAuth client (Android + Web client IDs). Supabase Auth (both projects).

**Internal:** FR-INFRA-003 (Supabase + RLS templates).

**Blocks:** FR-AUTH-002 (Zalo follows the same shape), FR-AUTH-003 (kid invite-code uses the consent flow which is keyed off this FR's account creation), FR-SUB-001 (Pet+ subscription is tied to the user id created here), FR-B2B-003 (PetOS console SSO bridge piggybacks on this scaffold).

---

## §8 — Example payloads

### 8.1 — `POST /v1/auth/after-signin`

```http
POST /v1/auth/after-signin
Authorization: Bearer eyJ... (Supabase JWT)
Content-Type: application/json

{ "sku_origin": "standard" }

→ 200 OK
{
  "user_id": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "region_of_record": "VN",
  "region_source": "apple",
  "audience_age_gate": "13+",
  "needs_region_confirmation": false
}
```

### 8.2 — Cross-SKU sign-in refusal

```http
→ 409 Conflict
{
  "error": "account_registered_as_child",
  "message": "This account is registered as a children's account. Please use the Tamagochi Kids app to sign in.",
  "graduation_url": "https://tamagochi.app/graduation"
}
```

### 8.3 — Apple bridge payload

```json
{
  "bridge_version": "1",
  "token": "eyJraWQiOiJlNkVN... (Apple ID token)",
  "nonce": "8b3c5d7f2a1e9b6d4c2a3e5f9b7d5a3c"
}
```

### 8.4 — Account-deletion request

```http
POST /v1/auth/delete-account
Authorization: Bearer eyJ...
→ 202 Accepted
{
  "delete_at": "2026-09-12T14:36:01Z",
  "grace_days": 30,
  "audit_ref": "01HC7QG..."
}
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Email/password fallback for desktop test rigs? → §1.13 — magic-link in dev only.
- **OQ-2 (resolved):** Facebook / Twitter Sign-In? → §`disallowed_tools` — deferred.
- **OQ-3 (resolved):** Single-session-only model? → §1.20 — multi-device concurrent.
- **OQ-4 (resolved):** Apple relay-email handling? → §1.16 + §2 — treat as canonical email.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Apple Sign-In service outage | `auth.signin.failure { provider: apple }` spike | iOS users blocked | Surface fallback to Google sign-in; in VN, fallback to Zalo (FR-AUTH-002) |
| 2 | Google Sign-In service outage | failure metric spike | Android users blocked | Surface alternative provider; status page update |
| 3 | Supabase Auth outage | `auth.signinWithIdToken` errors | All sign-ins blocked | Maintain in-memory session cache for already-signed-in users; surface "maintenance" splash |
| 4 | Native bridge version mismatch | Bridge emits unknown `bridge_version` | Force-update prompt | Reinstall flow; clear local Auth state on next launch |
| 5 | Token refresh fails (refresh token revoked) | `auth.refreshSession` error | User returned to sign-in screen | Preserve in-flight game state via Colyseus reconciliation |
| 6 | Cross-SKU sign-in attempt | 409 response code | User shown graduation page | Surface graduation flow with parental approval link |
| 7 | Apple relay email leak / merge | UI test detects merged account | Wrong user data exposed | Re-partition account; manual DPO escalation |
| 8 | Account deletion not completing at 30-day grace | Daily cron checks | Stale deletion ticket | Manual hard-delete via DSR-erasure path |
| 9 | Region of record indeterminate (no Apple/Google/Zalo/IP) | `region.indeterminate` event | Forced "confirm country" gate | Block app features until user confirms; UX path documented |
| 10 | Policy version git tag missing | Sign-in fails with `policy.version.missing` | Sign-in pipeline breaks | DPO escalation; tag the missing version; release blocker |
| 11 | Sign-in latency >3s P95 | Sentry transaction metric | UX regression | Investigate Apple/Google ID-token verification slowdown; cache JWKS aggressively |
| 12 | Apple Sign-In privacy policy URL drift | Apple Review rejection | Submission blocked | Update policy URL; re-submit |

---

## §11 — Notes

**Plan refs:** plan §PART 4 — auth providers (Apple + Google + Zalo + under-13 invite-code-only); plan §PART 8 — COPPA-2025 separate SKU + region of record.

**Sub-decisions punted to ops:**
- Apple sign-in service ID + Google OAuth client IDs locked in `infra/supabase/*/config.toml` annex.
- Account-deletion grace-window length: 30 days default; tunable for legal-counsel jurisdictional advice.

**Anti-patterns explicitly forbidden:**
- Webview-based Apple Sign-In (Apple Guideline 4.8).
- Embedding service_role key client-side.
- Single-session-only model (would break PetPair co-parent in P2).
- Merging Apple relay email with non-relay email for same user.

**Cross-reference:** This FR is the consumer-SKU authentication keystone. FR-AUTH-002 (Zalo) follows the same shape with Zalo-specific quirks. FR-AUTH-003 (kid invite-code) layers parental consent on top.
