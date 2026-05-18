---
id: FR-AUTH-002
title: "Zalo Sign-In (VN-mandatory) — Zalo OA SDK + Zalo OAuth Bearer + Supabase external provider"
module: AUTH
priority: MUST
status: shipped
verify: T
phase: P0
milestone: "Foundation Gate"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [FR-AUTH-001, FR-AUTH-003, FR-INFRA-003, FR-LEGAL-001, FR-LEGAL-003, FR-I18N-001, FR-OBS-001, FR-VIRAL-001]
depends_on: [FR-AUTH-001]
blocks: [FR-AUTH-003]
effort_hours: 8
new_files:
  - "apps/cocos/assets/_root/auth/ZaloSignIn.ts"
  - "apps/cocos/native/ios/ZaloSignInBridge.swift"
  - "apps/cocos/native/android/ZaloSignInBridge.kt"
  - "apps/cocos/native/web/ZaloWebSignIn.ts"
  - "apps/api/src/auth/zalo/zalo-id-token-verifier.ts"
  - "apps/api/src/auth/zalo/zalo-oauth-callback.controller.ts"
  - "apps/api/src/auth/zalo/zalo-profile-fetcher.ts"
  - "apps/api/src/auth/zalo/__tests__/zalo-id-token-verifier.spec.ts"
  - "apps/api/src/auth/zalo/__tests__/zalo-oauth-callback.spec.ts"
  - "docs/legal/zalo-oa-data-processing-addendum.md"
  - "infra/supabase/standard/migrations/20260517_005_zalo_provider.sql"
modified_files:
  - "apps/api/src/auth/auth.controller.ts"
  - "apps/api/src/auth/auth.service.ts"
  - "infra/supabase/standard/config.toml"
allowed_tools:
  - "Zalo OA SDK (iOS / Android)"
  - "Zalo OAuth 2.0 Web SDK (web)"
  - "Zalo Login API v4 (https://oauth.zaloapp.com)"
  - "Zalo Graph API (https://graph.zalo.me/v3.0)"
  - "Supabase Auth — external provider (custom OAuth flow)"
  - "Resend (for fallback email-link if Zalo session expires)"
disallowed_tools:
  - "Zalo Sign-In on the kids SKU (under-13 SKU has no public social sign-in per FR-LEGAL-001 §1.5 + FR-AUTH-003)"
  - "Storing Zalo access tokens beyond their natural TTL (≤ 90 days)"
  - "Cross-tenant Zalo OA reuse (each B2B tenant has its own Zalo OA where applicable; consumer uses cyberskill.world OA)"
risk_if_skipped: "Vietnam is the primary launch market (plan §PART 7 soft launch); Zalo has 70M+ MAU in VN with ~95% reach for Gen Z. Without Zalo Sign-In, conversion from Vietnamese organic traffic drops 30-50%; Apple/Google sign-in dominance is much weaker in VN than in US/EU."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Zalo OA app registration.** A Zalo Official Account (OA) app MUST be registered under CyberSkill's corporate Zalo Business account (zaloOA `cyberskill.world` or equivalent). The OA's app id, OA secret, and Login API credentials MUST be recorded in Supabase secrets (`ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_OA_ID`). Privacy policy URL + ToS URL + redirect URI MUST be registered in the Zalo developer portal.

§1.2  **Zalo Login API v4.** The OAuth 2.0 flow MUST use Zalo Login API v4 with PKCE (Proof Key for Code Exchange) per RFC 7636. The Cocos client generates `code_verifier` + `code_challenge`; the native bridge passes the challenge to Zalo's authorize endpoint. The exchanged `access_token` + `refresh_token` are received server-side via the redirect URI callback.

§1.3  **Native bridges.** iOS uses the Zalo OA SDK (`ZaloSDK.framework`); Android uses the Zalo OA SDK AAR (`com.zing.zalo.zalosdk:core:4+`); web uses Zalo's OAuth 2.0 redirect flow (no SDK — direct URL redirect). Each bridge MUST: (a) trigger Zalo authorization; (b) receive Zalo's auth code; (c) emit to Cocos via the documented native bridge interface (same `bridge_version` field as FR-AUTH-001).

§1.4  **Server-side code exchange.** The Cocos client MUST NOT exchange the auth code for an access token directly — Zalo's access-token endpoint requires the OA secret which MUST NEVER be client-side. The Cocos client sends the auth code + PKCE verifier to `POST /v1/auth/zalo/callback`; the Nest API exchanges with Zalo's token endpoint, fetches the user profile, and creates/updates the Supabase user.

§1.5  **Custom Supabase external provider.** Supabase Auth does not ship a built-in Zalo provider. The implementation MUST register Zalo as a **custom external provider** via Supabase Auth's `sign_in_with_id_token` semantics: the Nest API mints a deterministic Zalo-derived JWT (signed with `SUPABASE_AUTH_SECRET`) representing the Zalo identity, then exchanges it via Supabase's admin API to create / sign-in the user.

§1.6  **Profile fetch — minimal scope.** The OAuth scope MUST be the minimum required: `id` + `name` + (`picture` only when the player explicitly opts in). The Zalo Graph API `GET /v3.0/me` MUST be called with `Authorization: Bearer <token>` on the server. PHONE and EMAIL scopes are explicitly NOT requested (PDPL data minimisation).

§1.7  **Account linking.** A user who has previously signed in via Apple or Google can OPTIONALLY link their Zalo identity from `Settings → Linked accounts`. The link is one-direction: Zalo-linked identities can sign in via Zalo OR the originally-linked provider; they cannot be unlinked without account deletion. Cross-provider account merge is forbidden (Apple/Google ID + Zalo ID = separate Supabase users unless explicitly linked).

§1.8  **Zalo Mini App fallback.** For VN users on low-end devices where the Cocos WebGL build is too heavy, the Zalo Mini App format MAY be a future deliverable (deferred to a P3 FR). This FR locks the foundational Zalo Login + profile-fetch APIs so the Mini App can reuse them.

§1.9  **VN-specific UX.** The Vietnamese app build MUST surface Zalo Sign-In as the **primary** call-to-action on the sign-in screen (above Apple + Google), per VN market reality. Non-VN region builds surface Zalo as a third option after Apple + Google. The locale-driven order is configured in `apps/cocos/assets/i18n/<locale>/auth.json` (per FR-I18N-001).

§1.10  **Refresh token handling.** Zalo access tokens TTL is ~60 minutes; refresh tokens TTL is ~90 days. The Nest API MUST proactively refresh Zalo tokens 5 min before expiry. Refresh failures (refresh token revoked by user) MUST gracefully return the user to the sign-in screen via the same path as FR-AUTH-001 §1.11.

§1.11  **Disable Zalo on kids SKU.** Per FR-LEGAL-001 §1.5 + FR-AUTH-003, the kids SKU MUST NOT offer Zalo Sign-In. Build-target injection (FR-LEGAL-003 §1.3) MUST omit the Zalo native bridge entirely from the kids binary. Verified by the binary inspection script (FR-LEGAL-003 §1.10) which lints for `ZaloSDK` strings in the kids binary.

§1.12  **PDPL data-processing addendum.** A Vietnam PDPL-compliant data-processing addendum MUST be authored at `docs/legal/zalo-oa-data-processing-addendum.md` covering: (a) data categories shared with Zalo (the user's Zalo ID is shared bidirectionally); (b) the Zalo OA's terms-of-service alignment; (c) the cross-border-transfer status (Zalo OA infrastructure is in VN — domestic processing, simpler than US/EU vendors). The addendum MUST be cited in the public Vietnamese privacy policy.

§1.13  **Zalo OAuth callback security.** The `POST /v1/auth/zalo/callback` endpoint MUST: (a) verify the PKCE `code_verifier` against the recorded `code_challenge` per session (5-min TTL); (b) verify the auth code with Zalo's token endpoint; (c) verify the returned Zalo `user_id` is internally consistent (no impersonation by re-submitting another user's code); (d) emit `auth.zalo.signin.success` + `auth.zalo.signin.failure` Sentry events.

§1.14  **Rate limit + abuse.** The Zalo OAuth callback MUST be rate-limited at 10 attempts per IP per hour, 5 attempts per phone-number-hash per hour (Zalo IDs are correlated to phone numbers; a brute-force attempt would manifest as multiple attempts per phone). Exceeding triggers `auth.zalo.callback.rate_limit_exceeded` + temporary block.

§1.15  **Observability + funnel metrics.** Every step of the Zalo flow MUST emit metrics: `auth.zalo.authorize.initiated`, `auth.zalo.authorize.granted`, `auth.zalo.callback.attempted`, `auth.zalo.callback.success`, `auth.zalo.callback.failure { error_class }`, `auth.zalo.profile.fetched`. P95 end-to-end Zalo sign-in latency MUST be ≤ 4 seconds on a mid-tier VN device + 4G.

§1.16  **Zalo OA banner on sign-in.** Per Zalo OA policy, the sign-in surface MUST display the "Sign in with Zalo" Zalo-provided button (icon + Vietnamese label "Đăng nhập với Zalo" — not a custom-styled button). The button MUST be visible above the fold.

§1.17  **Disconnect / revoke flow.** Users MUST be able to disconnect their Zalo identity from their Tamagochi account via `Settings → Linked accounts → Disconnect Zalo`. The disconnect MUST: (a) revoke the Zalo refresh token via the Zalo Graph API; (b) zero out the `zalo_user_id` column; (c) emit `auth.zalo.disconnect` audit row. Disconnecting the last sign-in provider triggers the account-deletion flow per FR-AUTH-001 §1.19.

§1.18  **Test seam.** A `ZaloIdTokenVerifier.verifyForTest` seam (gated on `NODE_ENV !== 'production'`) MUST allow unit tests to bypass live Zalo verification.

§1.19  **Zalo SDK version pin.** iOS Zalo SDK + Android Zalo SDK versions MUST be exact-pinned in `Podfile` and `build.gradle`. Vendoring per FR-INFRA-001 §1.8 does not apply (Zalo SDK is a first-party vendor binary, not a marketplace package).

§1.20  **Apple Sign-In remains required on iOS.** Per Apple Guideline 4.8, an iOS build that offers any third-party social sign-in MUST also offer Apple Sign-In. The combined ordering on iOS+VN builds: Apple → Zalo → Google (Apple-first per Apple Review; Zalo prominence preserved via the "primary" label inside Apple's sign-in row).

---

## §2 — Why this design

**Why Zalo Sign-In is mandatory in VN.** Plan §PART 4 + plan §PART 7 — Vietnam is the primary soft-launch market; Zalo has 70M+ MAU there with ~95% reach for Gen Z. Pop-ups asking for "Sign in with Apple" or "Sign in with Google" convert poorly with Vietnamese users who do not associate Apple/Google identity with their primary social graph. The Vietnamese "default app for everything" is Zalo. Without it, conversion drops 30-50% (Zalo Pay + Zalo Mini Apps + Zalo OA play in the same ecosystem).

**Why custom Supabase external provider rather than waiting for built-in.** Supabase's roadmap doesn't include Zalo natively (the VN market is too small for them to prioritise). Building it as a custom external provider via `sign_in_with_id_token` is the canonical pattern Supabase supports for non-Big-Tech providers.

**Why minimum scope.** PDPL data minimisation: only `id` + `name` are required for a pet-care game. Requesting PHONE / EMAIL would be over-broad and trigger user-trust issues at sign-in (Vietnamese users are increasingly privacy-aware post-2025 PDPL launch).

**Why server-side code exchange.** Zalo's OA secret is not safe in client code; Zalo's access-token endpoint requires it. A client-side exchange would leak the secret on day one.

**Why PKCE.** PKCE protects against authorization-code interception attacks (especially relevant for native mobile flows where the redirect URI is custom-scheme rather than HTTPS). RFC 7636 — universally recommended for OAuth 2.0 native flows.

**Why account-linking is one-direction (no unlink).** Allowing arbitrary unlink-then-relink creates an account-merging attack surface (impersonate someone's Zalo if you steal their session). The disconnect flow exists but it's structured (last-provider triggers account deletion), not an arbitrary "swap providers."

**Why no Zalo Sign-In on the kids SKU.** COPPA-2025 requires no behavioural-tracking-enabled social sign-in for under-13 accounts. Zalo's terms grant Zalo the right to use sign-in events for analytics, which would be a behavioural-tracking surface. The under-13 SKU uses the parental-consent invite-code flow (FR-AUTH-003) exclusively.

**Why VN-specific UX order.** Plan §PART 7 soft-launch — VN first. UX research from plan §PART 4 (Vietnamese auth providers) implies Zalo-primary is what Vietnamese users expect.

**Why proactive refresh.** Same reasoning as FR-AUTH-001 §1.11 — token expiry mid-Colyseus-session drops the WebSocket.

**Why disable on kids SKU at binary level.** Defence in depth: a runtime feature flag could fail open; omitting the bridge entirely makes the kids binary fail-closed.

**Why PDPL data-processing addendum.** Vietnam PDPL Decree 356/2025/ND-CP requires processor-to-processor data-sharing disclosures. Tamagochi → Zalo (sharing user IDs for sign-in) is a processor relationship; the addendum is the formal documentation regulators expect.

**Why rate-limit per phone-number-hash.** Zalo IDs are 1:1 with phone numbers. A brute-force attack on the callback would manifest as multiple attempts against the same phone hash — catching it at the phone-hash level is the right granularity.

**Why Apple-first ordering on iOS.** Apple Guideline 4.8 mandates this; non-compliance is a hard rejection.

---

## §3 — API contract & code shape

### 3.1 — Cocos Zalo Sign-In

```typescript
// apps/cocos/assets/_root/auth/ZaloSignIn.ts
import { ZaloBridge } from '../../native/ZaloBridge';
import { generatePkcePair } from './pkce';

export class ZaloSignIn {
  async signIn(): Promise<{ authCode: string; codeVerifier: string }> {
    const { verifier, challenge } = await generatePkcePair();
    const authCode = await ZaloBridge.startAuthorize({
      codeChallenge: challenge,
      scope: 'id name',         // minimum per §1.6
    });
    return { authCode, codeVerifier: verifier };
  }
}
```

### 3.2 — Nest callback controller

```typescript
// apps/api/src/auth/zalo/zalo-oauth-callback.controller.ts
@Controller('v1/auth/zalo')
export class ZaloOAuthCallbackController {
  constructor(
    private readonly svc: ZaloOAuthCallbackService,
    private readonly limit: AuthZaloRateLimit,
  ) {}

  @Post('callback')
  async callback(@Body() body: { authCode: string; codeVerifier: string }, @Ip() ip: string) {
    await this.limit.assertWithinLimit({ ip, codePrefix: body.authCode.slice(0, 8) });
    const { zaloUserId, accessToken, refreshToken } = await this.svc.exchange(body);
    const profile = await this.svc.fetchProfile(accessToken);
    const supaSession = await this.svc.upsertAndMintSupabaseSession({ zaloUserId, profile });
    return supaSession;
  }
}
```

### 3.3 — Zalo OAuth callback service

```typescript
// apps/api/src/auth/zalo/zalo-oauth-callback.service.ts
@Injectable()
export class ZaloOAuthCallbackService {
  async exchange({ authCode, codeVerifier }: { authCode: string; codeVerifier: string }) {
    const resp = await fetch('https://oauth.zaloapp.com/v4/access_token', {
      method: 'POST',
      headers: { secret_key: process.env.ZALO_APP_SECRET!, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        app_id: process.env.ZALO_APP_ID!,
        grant_type: 'authorization_code',
        code: authCode,
        code_verifier: codeVerifier,
      }),
    });
    if (!resp.ok) throw new Error(`zalo.token.exchange.failed ${resp.status}`);
    const json = await resp.json() as { access_token: string; refresh_token: string; expires_in: number };
    const profile = await this.fetchProfile(json.access_token);
    return {
      zaloUserId: profile.id,
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
  }

  async fetchProfile(accessToken: string) {
    const r = await fetch('https://graph.zalo.me/v3.0/me?fields=id,name', {
      headers: { access_token: accessToken },
    });
    if (!r.ok) throw new Error(`zalo.profile.fetch.failed ${r.status}`);
    return r.json() as Promise<{ id: string; name: string }>;
  }

  async upsertAndMintSupabaseSession({ zaloUserId, profile }: { zaloUserId: string; profile: { id: string; name: string } }) {
    // Mint a Supabase-compatible JWT representing the Zalo identity.
    const jwt = await mintSupabaseJwt({
      sub: `zalo:${zaloUserId}`,
      email: `${zaloUserId}@zalo.local`,    // synthetic — Zalo email scope not requested
      provider: 'zalo',
      app_metadata: { provider: 'zalo', zalo_user_id: zaloUserId },
      user_metadata: { display_name: profile.name },
    });
    return { session: jwt };
  }
}
```

### 3.4 — Zalo provider migration

```sql
-- infra/supabase/standard/migrations/20260517_005_zalo_provider.sql
alter table public.app_users
  add column if not exists zalo_user_id text unique;
create index if not exists idx_app_users_zalo_user_id on public.app_users (zalo_user_id);
```

---

## §4 — Acceptance criteria

**AC1.** Zalo authorize flow on iOS returns an auth code on the simulator with a sandbox Zalo OA. Verified by Detox UI test.

**AC2.** Zalo authorize flow on Android returns an auth code on emulator with sandbox OA. Verified by Detox test.

**AC3.** Web Zalo redirect flow returns auth code via Playwright headed test.

**AC4.** `POST /v1/auth/zalo/callback` exchanges the auth code + PKCE verifier → Supabase session. Verified by `__tests__/zalo-oauth-callback.spec.ts` with a Zalo API mock.

**AC5.** PKCE verifier mismatch returns HTTP 400 with `error: "zalo.pkce.mismatch"`. Verified by spec test with a tampered verifier.

**AC6.** Rate limit blocks at 10 attempts per IP per hour. Verified by spec test pumping requests + asserting 429 response.

**AC7.** Zalo Sign-In is omitted from the kids binary. Verified by FR-LEGAL-003 §1.10 binary inspection — `strings <kids.ipa> | grep -i ZaloSDK` returns empty.

**AC8.** Account-linking flow: an Apple-signed-in user successfully links Zalo, then signs in via Zalo, arriving at the same Supabase user. Verified by `__tests__/auth.spec.ts`.

**AC9.** Disconnect Zalo revokes the refresh token via Zalo Graph API. Verified by spec test asserting Zalo's revoke endpoint is called.

**AC10.** Disconnecting the only sign-in provider triggers account-deletion grace window per FR-AUTH-001 §1.19. Verified by spec test.

**AC11.** VN locale build surfaces Zalo as primary CTA. Verified by Playwright test reading the rendered sign-in screen.

**AC12.** P95 Zalo sign-in latency ≤ 4 s on test cohort. Verified by Sentry transaction metric (manually reviewed in soft-launch).

---

## §5 — Verification

### 5.1 — Zalo OAuth callback unit test

```typescript
// apps/api/src/auth/zalo/__tests__/zalo-oauth-callback.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { ZaloOAuthCallbackService } from '../zalo-oauth-callback.service';

describe('FR-AUTH-002 — Zalo OAuth callback', () => {
  it('exchanges code and fetches profile', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok', refresh_token: 'rtok', expires_in: 3600 }) } as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'zalo123', name: 'Linh Nguyen' }) } as any);
    const svc = new ZaloOAuthCallbackService();
    const r = await svc.exchange({ authCode: 'ac', codeVerifier: 'cv' });
    expect(r.zaloUserId).toBe('zalo123');
    expect(r.accessToken).toBe('tok');
  });

  it('throws on token endpoint failure', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 400 } as any);
    const svc = new ZaloOAuthCallbackService();
    await expect(svc.exchange({ authCode: 'bad', codeVerifier: 'cv' })).rejects.toThrow(/zalo.token.exchange.failed/);
  });
});
```

---

## §6 — Implementation skeleton

```typescript
// apps/api/src/auth/zalo/zalo-id-token-verifier.ts
import { createHash } from 'node:crypto';
import { decodeJwt } from 'jose';

export class ZaloIdTokenVerifier {
  static verifyForTest(token: string, expectedNonceHash: string): boolean {
    const payload = decodeJwt(token);
    return createHash('sha256').update(String(payload['nonce'])).digest('hex') === expectedNonceHash;
  }
}
```

---

## §7 — Dependencies

**External:** Zalo OA + Login API + Graph API (developer account at developers.zalo.me). Vietnam corporate identity for Zalo Business registration. Zalo OA SDK iOS framework + Android AAR.

**Internal:**
- FR-AUTH-001 (Supabase Auth scaffold + auth controller foundation).
- FR-INFRA-003 (Supabase + RLS).

**Blocks:** FR-AUTH-003 (kid invite-code parental email may be a Zalo OA push — falls back to Resend if not).

---

## §8 — Example payloads

### 8.1 — `POST /v1/auth/zalo/callback`

```http
POST /v1/auth/zalo/callback
Content-Type: application/json

{
  "authCode": "AC...",
  "codeVerifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
}

→ 200 OK
{
  "session": {
    "access_token": "eyJ... (Supabase JWT)",
    "refresh_token": "eyJ...",
    "expires_at": "2026-08-12T15:36:01Z"
  }
}
```

### 8.2 — Zalo profile fetched

```json
{ "id": "1234567890123456789", "name": "Linh Nguyễn" }
```

### 8.3 — Disconnect Zalo audit row

```json
{
  "who": "01HC7QGZK4XN8YA1J3WB6EFR8",
  "what": "auth.zalo.disconnect",
  "occurred_at": "2026-08-12T14:36:01Z",
  "tenant_id": "mochi"
}
```

---

## §9 — Open questions

All resolved at authoring time:

- **OQ-1 (resolved):** Built-in Supabase Zalo provider? → §1.5 + §2 — custom external via `sign_in_with_id_token`.
- **OQ-2 (resolved):** Phone scope for parental-consent in VN? → §1.6 — phone NOT requested; data minimisation per PDPL.
- **OQ-3 (resolved):** Zalo Mini App in P0? → §1.8 — deferred to P3.
- **OQ-4 (resolved):** VN ordering above Apple-first on iOS? → §1.20 — Apple Guideline 4.8 takes precedence; Zalo is prominent within the row order.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Zalo OA suspended (e.g. ToS violation) | Zalo developer-portal email | All Zalo sign-ins blocked | Resolve with Zalo support; surface "Zalo temporarily unavailable" UX with Apple/Google fallback |
| 2 | Zalo Login API outage | `auth.zalo.callback.failure` spike | VN signups blocked | Status splash; route users to Apple/Google fallback |
| 3 | PKCE verifier session TTL expires (5 min) | `zalo.pkce.expired` error | User sees "session timed out, please retry" | Restart authorize flow |
| 4 | Zalo OA secret rotation breaks server-side exchange | `zalo.token.exchange.failed` | All sign-ins blocked | Update secret in Supabase env vars; redeploy |
| 5 | Zalo Graph API rate limit hit | `zalo.profile.fetch.failed { 429 }` | Sign-ins delayed | Backoff + retry; surface "high traffic" UX |
| 6 | Zalo SDK iOS / Android version skew | Native bridge fails | iOS or Android users blocked | Update SDK pin; ship hotfix |
| 7 | Zalo Sign-In accidentally enabled on kids binary | Binary inspection (FR-LEGAL-003 §1.10) | Submission blocked | Fix build-target injection; re-build kids binary |
| 8 | Zalo phone-hash brute-force attack | Rate-limit metric spike | Temporary block triggered | Investigate IP source; legal escalation if persistent |
| 9 | Cross-provider Zalo + Apple merge attempt | `auth.zalo.merge.refused` | User sees error | UX clarifies separate accounts; manual DPO can merge if owner proves identity |
| 10 | Zalo refresh token revoked by user (Zalo app uninstall) | Refresh fails on next session | User returned to sign-in | Preserve game state via Colyseus reconciliation |
| 11 | PDPL DPA expires / Zalo updates ToS | Annual compliance review | DPA out of date | Re-execute DPA; update privacy policy version |
| 12 | Zalo Login API v4 deprecation | Zalo developer announcement | Migration required | Pin to v4 patch; raise upgrade FR; coordinate with Zalo DevRel |

---

## §11 — Notes

**Plan refs:** plan §PART 4 (Auth: Zalo mandatory in VN), §PART 6 (VN payment rails — MoMo/ZaloPay/VNPay/ViettelPay; Zalo's role in the broader ecosystem), §PART 7 (community: Zalo Official Account for outreach).

**Sub-decisions punted to ops:**
- Specific Zalo OA approval timeline + corporate-identity submission documents — locked in the Zalo OA registration packet.
- Zalo OA broadcast schedule (for marketing) — owned by UA marketer (post-P0 hire per plan §J Phase 2).

**Anti-patterns explicitly forbidden:**
- Client-side OA-secret embed.
- Requesting PHONE/EMAIL scope.
- Allowing Zalo on the kids SKU.
- Webview-based Zalo Login in a way that breaks PKCE.
- Cross-provider account merge.

**Cross-reference:** Completes the consumer-SKU provider trio (Apple + Google + Zalo). FR-AUTH-003 (kid invite-code) is the under-13 path that intentionally has none of these providers.
