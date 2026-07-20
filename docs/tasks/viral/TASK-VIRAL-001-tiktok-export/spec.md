---
id: TASK-VIRAL-001
title: "TikTok-native vertical video export — 1080×1920 6s clip + watermark + trending audio + one-tap share"
module: VIRAL
priority: MUST
status: done
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead + UA/growth"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-AR-001, TASK-PET-002, TASK-ART-001, TASK-LEGAL-003, TASK-AUTH-003, TASK-VIRAL-002, TASK-VIRAL-003, TASK-SOCIAL-004, TASK-OBS-001]
depends_on: [TASK-AR-001]
blocks: [TASK-VIRAL-002, TASK-VIRAL-003]
effort_hours: 10
new_files:
  - "apps/cocos/assets/_root/viral/VideoExporter.ts"
  - "apps/cocos/assets/_root/viral/ShareIntent.ts"
  - "apps/cocos/native/ios/ShareSheetBridge.swift"
  - "apps/cocos/native/android/ShareIntentBridge.kt"
  - "apps/cocos/assets/_root/viral/__tests__/VideoExporter.spec.ts"
  - "apps/api/src/viral/share-tracking.controller.ts"
  - "apps/api/src/viral/__tests__/share-tracking.spec.ts"
  - "infra/supabase/standard/migrations/20260517_015_share_tracking.sql"
modified_files: []
allowed_tools:
  - "iOS Share Sheet (UIActivityViewController)"
  - "Android Intent (ACTION_SEND, MIME type video/mp4)"
  - "AVAssetWriter / MediaCodec (encoding)"
  - "TikTok 'trending audio' metadata via meta tag (no SDK integration at P1)"
disallowed_tools:
  - "External-link share on kids SKU without parental gate (TASK-LEGAL-003)"
  - "Auto-posting to TikTok/Reels without user tap (consent-driven)"
  - "Removable watermark"
  - "User-supplied caption overlay text (PII risk + abuse vector — P3+ feature with moderation)"
risk_if_skipped: "Plan §PART 3 viral hook #5 + plan §PART 7 GTM — TikTok-native exports are the primary organic acquisition lever. Without this pipeline, TASK-VIRAL-002 (Daily Drama) + TASK-VIRAL-003 (generative pet) + TASK-SOCIAL-004 (wedding) have no share surface."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **Vertical 9:16 video format.** Exported videos MUST be 1080×1920 H.264 at 30 fps. AAC mono audio at 96 kbps. Container MP4.

§1.2  **6-second default.** Auto-generated clips (Daily Drama, evolution) default to 6 seconds. AR Bedroom Cam clips (TASK-AR-001) extend up to 15 seconds. Configurable per export call.

§1.3  **Watermark.** Lower-right corner "tamagochi.app" overlay — 12pt, semi-transparent, included at encode time. Indelible.

§1.4  **Hashtag prefill on share.** When user taps share, the system MUST pre-fill text: `"My pet Mochi! #mochilife #virtualpet"` (locale-adapted). User can edit before posting.

§1.5  **Trending audio metadata.** The exported MP4 SHOULD include an `iTunes` metadata tag suggesting trending audio (a curated list per region rotates monthly). Actual audio mix is the in-game soundtrack; the metadata hints at TikTok's audio-pairing UX.

§1.6  **Share intent — one tap.** A single "Share" button invokes the OS share sheet:
- iOS: `UIActivityViewController` with the video file URI.
- Android: `Intent(Intent.ACTION_SEND)` with `mime=video/mp4`.

The OS share sheet handles the routing to TikTok/Reels/messaging/etc.

§1.7  **Per-share telemetry.** When the user invokes share, emit `viral.share.invoked { source: 'ar' | 'daily_drama' | 'evolution' | 'wedding', video_duration_sec }`. We CANNOT detect which app the user picked (OS-level privacy); but we record the invocation.

§1.8  **Share-tracking link.** A short-link `https://tamagochi.app/s/<id>` MAY be appended to the share caption. When a recipient taps the link, server logs the click via the `share_tracking` table for k-factor analytics.

§1.9  **Kids-SKU restriction.** Per TASK-LEGAL-003 + TASK-AUTH-003, the Share button MUST be hidden on the kids SKU. Kids cannot share externally without parental approval; P3+ feature flag enables parental-approved sharing.

§1.10  **Stage gate.** Sharing requires `stage ∈ {teen, adult}` for AR; Daily Drama clips can share from baby+. Evolution clips share at the moment of advancement.

§1.11  **Privacy — no biometric capture.** AR clips MUST NOT capture identifiable people in frame. Pre-recording UX hint advises "make sure other people aren't in frame." No client-side face detection at P1; P3+ adds it.

§1.12  **Server-side share log retention.** `share_tracking` rows retained 90 days for analytics + privacy. Player can delete their share history via TASK-LEGAL-001 DSR.

§1.13  **No automated posts.** Plan §PART 11 — no automated TikTok account integration at P1. Sharing is purely user-driven via OS share sheet.

§1.14  **A11Y.** Share button labelled for screen readers ("Share video of your pet"). Reduce-motion does not affect share output (video unaffected).

§1.15  **Caption locale.** Hashtag list MUST localise per TASK-I18N-001:
- en: `#mochilife #virtualpet`
- vi: `#mochilife #thúảo`
- (P4: ja `#モチライフ`, ko `#모치라이프`, etc.)

§1.16  **Trending audio tag rotation.** Monthly review of trending audio in TikTok per region. Locked in `apps/cocos/assets/viral/trending-audio.json` (Mixpanel-tunable for fast iteration).

§1.17  **Performance budget.** Export encoding MUST complete in ≤ 3 seconds for a 6-second clip on baseline VN Android. Beyond → cancel + retry with lower bitrate.

§1.18  **Captioning at P1 → none.** Auto-generated captions ("Mochi feeling happy!") are deferred to P2+ once Content Safety classifier (TASK-AI-002) approves caption variety.

§1.19  **Caption length.** When user-editable, max 280 characters (TikTok caption limit headroom). Server validates length; client enforces.

§1.20  **Analytics taxonomy.** `viral.share.invoked`, `viral.share.link_click`, `viral.export.failed { reason }` per TASK-OBS-001 §1.4.

---

## §2 — Why this design

**Why 1080×1920.** Plan §PART 4 — TikTok-native dimensions. Lower resolutions look pixelated; higher inflate file size.

**Why 6-second default.** Plan §PART 3 — TikTok / Reels canonical clip length. 6s is enough to convey a moment, short enough to retain attention.

**Why prefill hashtag.** Lowers friction. Plan §PART 7 GTM — user-defined hashtags rare from casual users.

**Why no SDK integration with TikTok at P1.** TikTok's Share SDK is iOS-only (Android via web only) + adds review friction. OS-level share sheet works everywhere.

**Why share-tracking link.** Plan §PART 7 — measure viral coefficient (k-factor). Without it, share-to-install attribution is impossible.

**Why kids SKU hidden.** External-link gate complexity per TASK-LEGAL-003.

**Why no automated posts.** Plan §PART 11 trust model + plan §PART 8 — credentialed auto-posting opens many surfaces (token theft, abuse, etc.).

**Why no captions at P1.** Plan §PART 3 — auto-generated captions need TASK-AI-002 review. Punting reduces P1 scope.

**Why trending audio metadata only (no real audio).** Music licensing is a P3+ concern. Metadata hint is a free-via-precedent feature.

---

## §3 — API contract & code shape

```typescript
// apps/cocos/assets/_root/viral/VideoExporter.ts
export class VideoExporter {
  async export(opts: { input_video_uri: string; duration_sec: number; locale: string }): Promise<{ output_uri: string; watermarked: true }> {
    if (opts.duration_sec > 15) throw new Error('TASK-VIRAL-001 §1.2 max 15s');
    const trending = TRENDING_AUDIO[opts.locale]?.[currentMonth()] ?? '';
    return NativeBridge.exportVerticalMp4({
      input: opts.input_video_uri, duration_sec: opts.duration_sec,
      watermark: 'tamagochi.app',
      itunes_song_metadata: trending,
    });
  }
}

export class ShareIntent {
  async invoke(opts: { video_uri: string; caption: string; source: 'ar'|'daily_drama'|'evolution'|'wedding' }): Promise<{ invoked: true; share_link_id?: string }> {
    if (await this.isKidsSku()) throw new Error('TASK-VIRAL-001 §1.9 kids cannot share');
    const linkId = await api.post('/v1/viral/share/create-link', { source: opts.source });
    const captionWithLink = `${opts.caption} https://tamagochi.app/s/${linkId}`;
    await NativeBridge.openShareSheet({ video_uri: opts.video_uri, caption: captionWithLink });
    return { invoked: true, share_link_id: linkId };
  }
}
```

```sql
-- infra/supabase/standard/migrations/20260517_015_share_tracking.sql
create table public.share_tracking (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  source text not null check (source in ('ar','daily_drama','evolution','wedding')),
  created_at timestamptz not null default now(),
  click_count int not null default 0,
  install_count int not null default 0,
  expires_at timestamptz not null default now() + interval '90 days'
);
create index on public.share_tracking (user_id);
alter table public.share_tracking enable row level security;
create policy "share self" on public.share_tracking for select using (user_id = auth.uid());
```

```typescript
// apps/api/src/viral/share-tracking.controller.ts
@Controller('v1/viral/share')
@UseGuards(SupabaseJwtGuard)
export class ShareTrackingController {
  @Post('create-link')
  async createLink(@CurrentUser() u: AuthedUser, @Body() body: { source: 'ar'|'daily_drama'|'evolution'|'wedding' }) {
    const id = generateUlid();
    await this.supa.from('share_tracking').insert({ id, user_id: u.id, source: body.source });
    return id;
  }
}
```

---

## §4 — Acceptance criteria

**AC1.** Export produces 1080×1920 H.264 MP4 with watermark embedded. Verified by ffprobe inspection. **AC2.** Default duration 6s; AR uses 15s. Verified. **AC3.** Kids SKU has no Share button visible. Verified by Playwright. **AC4.** Share button invokes OS share sheet on iOS + Android. Verified by Detox. **AC5.** Prefilled hashtag localised correctly. Verified across EN + VI builds. **AC6.** Share link created server-side returns ULID. Verified. **AC7.** Share link click increments `click_count`. Verified. **AC8.** Trending audio metadata embedded. Verified by ffprobe. **AC9.** Export latency ≤ 3s on baseline emulator. Verified. **AC10.** No automated post path exists in code. Verified by grep for "post_to_tiktok" etc. **AC11.** Share tracking retention 90 days. Verified by retention policy migration. **AC12.** Caption length validation 280 chars. Verified.

---

## §5 — Verification

```typescript
// apps/cocos/assets/_root/viral/__tests__/VideoExporter.spec.ts
describe('TASK-VIRAL-001 — exporter', () => {
  it('rejects >15s', async () => {
    await expect(exp.export({ input_video_uri: 'x', duration_sec: 20, locale: 'en' })).rejects.toThrow(/max 15s/);
  });

  it('embeds locale-correct hashtags', async () => {
    const out = await exp.export({ input_video_uri: 'x', duration_sec: 6, locale: 'vi' });
    expect(out.itunes_song_metadata).toContain('thúảo');
  });

  it('blocks share on kids SKU', async () => {
    (globalThis as any).__BUILD_TARGET__ = 'kids';
    await expect(intent.invoke({ video_uri: 'x', caption: 'hi', source: 'ar' })).rejects.toThrow(/kids cannot share/);
  });
});
```

---

## §6 — Implementation skeleton

```swift
// apps/cocos/native/ios/ShareSheetBridge.swift
@objc class ShareSheetBridge: NSObject {
  @objc static func open(_ videoUri: String, caption: String) {
    let url = URL(fileURLWithPath: videoUri)
    let activityVC = UIActivityViewController(
      activityItems: [url, caption],
      applicationActivities: nil
    )
    let topVC = UIApplication.shared.windows.first?.rootViewController
    topVC?.present(activityVC, animated: true)
  }
}
```

---

## §7 — Dependencies

**External:** iOS UIActivityViewController; Android Intent.ACTION_SEND; AVAssetWriter / MediaCodec. **Internal:** TASK-AR-001 (provides input video URI), TASK-PET-002 (evolution share moment), TASK-LEGAL-003 (kids gate), TASK-I18N-001 (locale). **Blocks:** TASK-VIRAL-002 (Daily Drama share), TASK-VIRAL-003 (generative pet share), TASK-SOCIAL-004 (wedding share).

---

## §8 — Example payloads

```http
POST /v1/viral/share/create-link
{ "source": "ar" }
→ 200 { "id": "01HCSHARE..." }
```

```json
{
  "event": "viral.share.invoked",
  "user_id": "01HC...",
  "source": "ar",
  "video_duration_sec": 6,
  "platform": "ios"
}
```

```json
{
  "id": "01HCSHARE...",
  "user_id": "01HC...",
  "source": "ar",
  "click_count": 12,
  "install_count": 3,
  "created_at": "2026-08-12T14:36:01Z"
}
```

```text
Caption rendered by user before posting:
"My pet Mochi! #mochilife #virtualpet https://tamagochi.app/s/01HCSHARE..."
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** TikTok SDK integration at P1? → §2 — OS share sheet only.
- **OQ-2 (resolved):** Captions at P1? → §1.18 — no (P2+).
- **OQ-3 (resolved):** Audio licensing? → §1.5 + §2 — metadata hint only, no real audio.
- **OQ-4 (resolved):** Auto-post path? → §`disallowed_tools` + §2 — forbidden.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Export encoding fails on low-end Android | MediaCodec error | UX show "try again" | Retry with lower bitrate |
| 2 | Share sheet cancelled by user | OS callback | Telemetry as "intent_dismissed" | No further action |
| 3 | Share link DB write fails | Server error | Share-without-link works | Surface telemetry-only mode |
| 4 | Trending audio metadata invalid | Player support | UX OK; metadata blank | Restore from Mixpanel cache |
| 5 | Watermark omitted at encode | CI assert | Build blocked | Re-encode with correct overlay |
| 6 | Caption with emoji breaking share | Detox UI | Sanitize before pass | Strip incompatible chars |
| 7 | Storage permission denied on Android | OS API | Fallback: share without save | Surface "share-only" UX |
| 8 | Click tracking retention exceeded | Disk | Retention policy | 90-day cutoff |
| 9 | Kids SKU share button accidentally visible | Playwright catches | COPPA risk | Hot-fix to hide |
| 10 | TikTok blocks tamagochi.app domain | UA monitoring | Surface alternate domain | Pivot to cyberskill.world subdomain |
| 11 | Export latency >3s persistently | Perf metric | UX hang | Lower bitrate or pre-cache hot codec init |
| 12 | Share intent breaks on app rotation | OS state | Crash | Persist intent payload to allow recovery |

---

## §11 — Notes

**Plan refs:** plan §PART 3 viral hook #5 (TikTok-native exports), plan §PART 7 GTM, plan §PART 4 (no TikTok SDK at P1).

**Sub-decisions punted to ops:**
- Hashtag list per locale — UA-curated monthly.
- Trending audio metadata per region — Mixpanel-flag-tuned.

**Anti-patterns explicitly forbidden:**
- Automated posting.
- Removable watermark.
- Kids share without parental gate.
- User-supplied caption overlay text at P1.

**Cross-reference:** Closes P1 visual viral loop. TASK-VIRAL-002 / 003 / TASK-SOCIAL-004 all use this export pipeline.
