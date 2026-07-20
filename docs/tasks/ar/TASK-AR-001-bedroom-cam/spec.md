---
id: TASK-AR-001
title: "Bedroom Cam — ARKit/ARCore plane detection + Spine pet placement + 9:16 video capture with watermark"
module: AR
priority: MUST
status: done
verify: T
phase: P1
milestone: "Core Pet MVP"
slice: 1
owner: "Tech Lead"
created: 2026-05-17
shipped: 2026-05-17
related_frs: [TASK-INFRA-001, TASK-PET-001, TASK-PET-002, TASK-ART-001, TASK-VIRAL-001, TASK-LEGAL-001, TASK-LEGAL-003, TASK-A11Y-001, TASK-OBS-001]
depends_on: [TASK-INFRA-001, TASK-PET-002, TASK-ART-001]
blocks: [TASK-VIRAL-001]
effort_hours: 14
new_files:
  - "apps/cocos/native/ios/ARKitBridge.swift"
  - "apps/cocos/native/android/ARCoreBridge.kt"
  - "apps/cocos/assets/_root/ar/ArSession.ts"
  - "apps/cocos/assets/_root/ar/PetArPlacer.ts"
  - "apps/cocos/assets/_root/ar/VideoCapture.ts"
  - "apps/cocos/assets/_root/ar/WatermarkOverlay.ts"
  - "apps/cocos/assets/_root/ar/__tests__/PetArPlacer.spec.ts"
  - "apps/cocos/assets/_root/ar/__tests__/VideoCapture.spec.ts"
  - "apps/api/src/ar/ar-session.controller.ts"
  - "apps/api/src/ar/__tests__/ar-session.spec.ts"
  - "infra/supabase/standard/migrations/20260517_014_ar_sessions.sql"
modified_files:
  - "apps/cocos/fastlane/Fastfile"
allowed_tools:
  - "ARKit 5+ on iOS 15+ (`ARKit.framework`)"
  - "ARCore 1.40+ on Android 7+ (Google Play Services for AR)"
  - "Cocos `sp.Skeleton` rendered into AR scene"
  - "AVAssetWriter (iOS) + MediaCodec (Android) for video capture"
  - "Photo Studio fallback for non-AR-capable devices"
disallowed_tools:
  - "AR placement on kids SKU without parental gate (TASK-LEGAL-003 §1.4)"
  - "Sharing captured video via deep link to external apps for under-13 (TASK-LEGAL-003 external-link gate)"
  - "Persistent storage of plane-detection geometry (privacy: user's room layout)"
  - "AR scenes that prompt photographing identifiable people"
risk_if_skipped: "Plan §PART 3 viral hook #2 — AR placement is the documented TikTok-native virality wedge. Without it, the 'Bedroom Cam' moment that drives organic UGC is missing; TASK-VIRAL-001 export pipeline has nothing to export."
audience_age_gate: "13+"
---

## §1 — Description (BCP-14 normative)

§1.1  **AR support detection.** App MUST detect AR capability at runtime:
- iOS: `ARWorldTrackingConfiguration.isSupported`.
- Android: `ArCoreApk.checkAvailability()`.
- Fallback: surface "Photo Studio" mode (Cocos render to texture without AR; static background) for unsupported devices.

§1.2  **Permission flow.** Camera + (Android only) ARCore install permissions MUST be requested at first AR session start, not at app launch. Requests follow OS-level permission patterns; denial routes to Photo Studio fallback.

§1.3  **Plane detection.** AR session detects horizontal planes (floor, table). Pet is placed only on horizontal planes ≥ 0.5 m² confidence. Vertical-plane mode forbidden at P1 (placement complexity + lighting variance).

§1.4  **Pet anchor.** Once placed, the pet's anchor is a `tracking_session.anchors[0]` reference. The pet renders at a fixed 30 cm height in world space (kawaii proportion vs typical room scale).

§1.5  **Spine in AR.** The Cocos `sp.Skeleton` component used in the main game renders directly into the AR scene (same skeleton bundle, same contract animations). Critical animations triggered: `ar_greet` (on placement), `idle_<stage>` (default), `dance` (button-tap from user), `wave` (button-tap from user).

§1.6  **Video capture — 9:16 vertical.** A "Record" button captures **up to 15 seconds** of video at:
- iOS: AVAssetWriter, 1080×1920, H.264, 30 fps, ~6 Mbps.
- Android: MediaCodec, same params.

§1.7  **Watermark overlay.** Captured video MUST be overlaid with "tamagochi.app" watermark in bottom-right corner (12pt font, semi-transparent), via `WatermarkOverlay.ts` applied at encode time. Watermark MUST be impossible to disable in production.

§1.8  **Save to camera roll.** Captured video saved to the OS camera roll (with explicit user consent gate per platform). Returns the file URI to the Cocos layer for TASK-VIRAL-001 share-intent.

§1.9  **No persistent geometry storage.** Plane-detection meshes MUST NOT be persisted server-side or shared with external services. AR session state lives only in memory; on session end, all geometry is discarded. Privacy: user's room layout is sensitive.

§1.10  **Kids SKU disabled.** Per TASK-LEGAL-003 §1.4, the AR-share path goes outside the app (camera roll → user's other apps). Under-13 must use parental gate (math problem). At P1, the kids SKU **disables the AR feature entirely** — the entry point is hidden. Re-enable in P3 as part of the parental-controlled gate flow.

§1.11  **Stage gate.** AR placement requires `stage ∈ {teen, adult}` (per TASK-PET-002 §1.6) — eggs/babies cannot be ARed (UX rationale: AR is a "we go places together" intimate experience, fits maturity).

§1.12  **AR session telemetry.** `ar.session.started`, `ar.session.placed { plane_count, time_to_place_ms }`, `ar.session.recorded { duration_sec }`, `ar.session.failed { reason }` per TASK-OBS-001.

§1.13  **Performance budget.** AR rendering MUST sustain ≥ 30 fps on the TASK-INFRA-001 §1.20 baseline VN 1 GB Android device. Falls below → graceful degrade (lower Spine sample rate; warn user with "Photo Studio mode might work better").

§1.14  **A11Y reduce-motion.** When `prefers-reduced-motion: reduce`, animations slow + screen-shake (none in AR but documented for completeness) disabled. Voice-over hint reads aloud: "Pet placed near the chair."

§1.15  **Lighting estimation.** ARKit / ARCore lighting-estimation API drives the Spine skeleton's tint: in low light, pet renders slightly desaturated; in bright light, slight warm tint. Cocos `sp.Skeleton.color` modulation.

§1.16  **Server-side AR session log.** `ar_sessions` table records: `(id, user_id, pet_id, started_at, ended_at, placed boolean, recorded boolean, fallback_mode boolean)`. Used for analytics + abuse monitoring (rapid AR-record cycles could indicate UGC farming).

§1.17  **No persistent device-info leak.** Camera serial number, IMU sensor IDs, model-specific IDs MUST NOT be sent to the server. Only categorical fields ("iOS 17", "ARKit-capable").

§1.18  **Pre-record consent screen.** Before the first AR record, a one-time consent screen explains: "We don't store your room — the recording is yours alone." Consent is per-device, not per-account.

§1.19  **Photo Studio fallback flow.** Non-AR devices see a 2D scene with selectable backgrounds (forest / room / cafe). Same Spine rendering + same video capture. Photo Studio respects the same kids-SKU disable.

§1.20  **Cocos integration.** `PetArPlacer.ts` orchestrates: bridge to native ARKit/ARCore → poll for planes → on tap, place pet on plane → trigger `ar_greet` animation → expose Record button → call native `VideoCapture` on record.

---

## §2 — Why this design

**Why ARKit + ARCore native bridges.** Plan §PART 4. Cocos plugins for AR are still maturing; native bridge is the safer P1 path.

**Why horizontal-plane only.** Horizontal floors/tables are the most reliable surfaces. Vertical-plane support (e.g. pet on a wall) is a P3+ feature.

**Why 30 cm pet height.** Empirical UX testing — pets shorter than 20 cm feel unimportant; pets taller than 50 cm feel intimidating. 30 cm sits in the kawaii sweet spot.

**Why 15-second max recording.** TikTok / Reels native format. Longer recordings inflate file size + complicate share UX.

**Why watermark not removable.** Anti-piracy + brand awareness. Plan §PART 7.

**Why no geometry persistence.** Plan §PART 11 — privacy. Room mesh is sensitive (could reveal floor plan).

**Why kids SKU disabled at P1.** External-link gate complexity. Re-enable in P3 with parental-dashboard control.

**Why teen+adult stage only.** Plan §PART 3 — bonding mechanic for maturity moments.

**Why server-side session log.** Anti-abuse monitoring (UGC farming).

**Why Photo Studio fallback.** Plan §PART 7 — emerging-market reach. Many VN Android devices don't support AR.

**Why lighting estimation.** Increases the "pet is really in my room" feeling.

---

## §3 — API contract & code shape

```swift
// apps/cocos/native/ios/ARKitBridge.swift
@objc class ARKitBridge: NSObject, ARSessionDelegate {
  static let shared = ARKitBridge()
  private var session: ARSession?

  @objc func startSession() -> Bool {
    guard ARWorldTrackingConfiguration.isSupported else { return false }
    let config = ARWorldTrackingConfiguration()
    config.planeDetection = .horizontal
    config.environmentTexturing = .automatic
    session = ARSession(); session?.delegate = self; session?.run(config)
    return true
  }

  func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
    for anchor in anchors where anchor is ARPlaneAnchor {
      CocosBridge.emit("ar.plane.detected", ["anchor_id": anchor.identifier.uuidString])
    }
  }
}
```

```typescript
// apps/cocos/assets/_root/ar/PetArPlacer.ts
import { _decorator, Component, EventTouch } from 'cc';
import { ArBridge } from './ArBridge';
import { SpineLoader } from '../art/SpineLoader';

@ccclass('PetArPlacer')
export class PetArPlacer extends Component {
  async start() {
    if (await this.isKidsSku()) { this.swapToPhotoStudio(); return; }
    const supported = await ArBridge.startSession();
    if (!supported) { this.swapToPhotoStudio(); return; }
    this.node.on(Node.EventType.TOUCH_END, (e: EventTouch) => this.onTap(e));
  }

  private async onTap(e: EventTouch) {
    const planeHit = await ArBridge.raycast(e.getLocationX(), e.getLocationY());
    if (!planeHit) return;
    const skel = await new SpineLoader().loadPetSkeleton(this.petId);
    ArBridge.placePet(skel, planeHit.anchor_id);
    new SpineLoader().playContractAnimation(skel.component, 'ar_greet');
    this.audit.emit('ar.session.placed', { plane_count: planeHit.plane_count });
  }
}
```

```typescript
// apps/cocos/assets/_root/ar/VideoCapture.ts
export class VideoCapture {
  async record(durationSec: number): Promise<{ file_uri: string; duration_sec: number }> {
    if (durationSec > 15) durationSec = 15;
    const result = await ArBridge.recordVideo({ duration_sec: durationSec, resolution: '1080x1920', fps: 30 });
    return result;  // bridge handles watermark overlay
  }
}
```

```sql
-- infra/supabase/standard/migrations/20260517_014_ar_sessions.sql
create table public.ar_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id text not null references public.pets(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  placed boolean default false,
  recorded boolean default false,
  fallback_mode boolean default false,
  platform text not null check (platform in ('ios','android')),
  tenant_id text not null default 'mochi'
);
alter table public.ar_sessions enable row level security;
create policy "ar self" on public.ar_sessions for select using (user_id = auth.uid());
```

---

## §4 — Acceptance criteria

**AC1.** Standard SKU on AR-capable iOS surfaces AR session. Verified by Detox + AR test fixture. **AC2.** Non-AR-capable device falls back to Photo Studio. Verified. **AC3.** Kids SKU has AR entry-point hidden. Verified by Playwright. **AC4.** Plane detection finds horizontal plane in test fixture. Verified by Detox. **AC5.** Pet placement triggers `ar_greet` animation. Verified. **AC6.** Video capture 15s max. Verified. **AC7.** Watermark visible bottom-right of captured video. Verified by inspecting output frame. **AC8.** Video saved to camera roll with consent. Verified. **AC9.** Stage-locked: AR on baby pet returns 403 + UX redirects. Verified. **AC10.** Pre-record consent screen shown once per device. Verified by Detox. **AC11.** AR fps ≥ 30 on baseline emulator. Verified. **AC12.** No camera serial / IMU id sent to server. Verified by network proxy inspection.

---

## §5 — Verification

```typescript
// apps/cocos/assets/_root/ar/__tests__/PetArPlacer.spec.ts
describe('TASK-AR-001 — PetArPlacer', () => {
  it('falls back to Photo Studio when AR unsupported', async () => {
    vi.spyOn(ArBridge, 'startSession').mockResolvedValue(false);
    const placer = new PetArPlacer();
    await placer.start();
    expect(placer.fallbackActive).toBe(true);
  });

  it('disables AR on kids SKU', async () => {
    (globalThis as any).__BUILD_TARGET__ = 'kids';
    const placer = new PetArPlacer();
    await placer.start();
    expect(placer.fallbackActive).toBe(true);
  });

  it('triggers ar_greet on placement', async () => {
    const spy = vi.spyOn(SpineLoader.prototype, 'playContractAnimation');
    await placer.onTap({ getLocationX: () => 0, getLocationY: () => 0 } as any);
    expect(spy).toHaveBeenCalledWith(expect.anything(), 'ar_greet');
  });
});
```

---

## §6 — Implementation skeleton

```kotlin
// apps/cocos/native/android/ARCoreBridge.kt (excerpt)
class ARCoreBridge(private val ctx: Context) {
  private var session: Session? = null
  fun startSession(): Boolean {
    val avail = ArCoreApk.getInstance().checkAvailability(ctx)
    if (avail != ArCoreApk.Availability.SUPPORTED_INSTALLED) return false
    session = Session(ctx).apply {
      val config = Config(this).apply { planeFindingMode = Config.PlaneFindingMode.HORIZONTAL }
      configure(config); resume()
    }
    return true
  }
}
```

---

## §7 — Dependencies

**External:** ARKit (iOS 15+); ARCore (Google Play Services for AR); AVAssetWriter (iOS); MediaCodec (Android). **Internal:** TASK-INFRA-001 (Cocos scaffold), TASK-PET-002 (stage gate), TASK-ART-001 (Spine `ar_greet`). **Blocks:** TASK-VIRAL-001 (TikTok export pipeline reads AR video file URI).

---

## §8 — Example payloads

```http
POST /v1/ar/session
{ "pet_id": "01HC..." }
→ 200 { "session_id": "01HCARS...", "platform_capabilities": { "ar": true, "lidar": false } }
```

```json
{ "event": "ar.session.placed", "session_id": "01HCARS...", "plane_count": 2, "time_to_place_ms": 4123 }
```

```json
{
  "session_id": "01HCARS...",
  "user_id": "01HC...",
  "pet_id": "01HC...",
  "started_at": "2026-08-12T14:36:01Z",
  "placed": true,
  "recorded": true,
  "fallback_mode": false,
  "platform": "ios"
}
```

```json
{ "event": "ar.session.failed", "reason": "permission_denied" }
```

---

## §9 — Open questions

All resolved:
- **OQ-1 (resolved):** AR plugin vs native bridge? → §`allowed_tools` + §2 — native bridge.
- **OQ-2 (resolved):** Vertical-plane mode? → §1.3 — P3+.
- **OQ-3 (resolved):** Watermark removable for Pet+? → §1.7 + §2 — never removable.
- **OQ-4 (resolved):** Kids SKU at P1 vs P3? → §1.10 — disabled P1, enabled P3 with parental gate.

---

## §10 — Failure modes inventory

| # | Failure | Detection | Outcome | Recovery |
|---|---|---|---|---|
| 1 | Plane detection times out (poor lighting) | UX wait > 10s | Surface "find better lighting" hint | User retry; or fallback to Photo Studio |
| 2 | ARCore SDK requires update on Android | ArCoreApk check | Prompt user to update Google Play Services for AR | Or fallback to Photo Studio |
| 3 | Video recording mid-capture interrupted (phone call) | OS event | Discard partial file | Retry; show UX |
| 4 | Camera permission denied | Permission API | Fallback to Photo Studio | Re-request opportunity in Settings |
| 5 | Pet skeleton fails to render in AR | Cocos error | UX broken | Reset session; reload skeleton |
| 6 | AR fps drops below 30 on low-end device | Sentry perf metric | Graceful degrade | Lower Spine sample rate; warn user |
| 7 | Camera roll write permission denied | Save fails | UX error | Re-prompt; or surface "share without saving" |
| 8 | Watermark accidentally omitted in encode | Build assert | Patches blocked | Verify in CI before submission |
| 9 | Lighting estimation drifts wildly | Visual artifacts | Pet color unstable | Cap modulation strength |
| 10 | Plane geometry mistakenly persisted to crash log | Sentry data review | Privacy leak | PII scrubber strips ARWorldMap fields |
| 11 | AR session memory leak (long sessions) | OS terminates | Crash | Tear down session on background |
| 12 | iOS-only iPhone-12+ AR-features used on iPhone-X | Feature detection | Graceful degrade | Check capability before invoking |

---

## §11 — Notes

**Plan refs:** plan §PART 3 viral hooks #2 (Bedroom Cam), §PART 4 (ARKit/ARCore), §PART 5 (graceful fallback).

**Sub-decisions punted to ops:**
- Photo Studio backgrounds — designer-curated.
- Watermark exact styling — designer locks per locale.

**Anti-patterns explicitly forbidden:**
- Persistent ARWorldMap to server.
- AR on kids SKU at P1.
- Removable watermark.
- AR placement on egg/baby pets.

**Cross-reference:** TASK-VIRAL-001 consumes the captured video URI for share-intent. TASK-A11Y-001 reduce-motion applies.
