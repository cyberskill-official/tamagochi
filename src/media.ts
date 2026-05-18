import type { Pet, UserProfile } from './types.ts';
import { assert, hash, hasBlockedText, sameUtcDay } from './utils.ts';

export type SocialPlatform = 'tiktok' | 'instagram_reels' | 'youtube_shorts' | 'x' | 'threads';

export interface SocialPublishInput {
  frId: string;
  platform: SocialPlatform;
  assetUrl: string;
  caption: string;
  scheduledFor: string;
  apiKey?: string;
}

export class MediaService {
  readonly animationContract = [
    'idle', 'eat', 'sleep', 'happy', 'sad', 'sick', 'dance', 'wave',
    'egg-happy', 'egg-sad', 'baby-happy', 'baby-sad', 'teen-happy', 'teen-sad', 'adult-happy', 'adult-sad',
    'clean', 'hug', 'wedding', 'grandma'
  ];
  private readonly dramaDay = new Map<string, Date>();

  assertArtPipeline(): true {
    assert(this.animationContract.length >= 20, 'art.animation_contract_incomplete');
    return true;
  }

  placeInBedroomCam(device: { arkit?: boolean; arcore?: boolean }, pet: Pet): { mode: 'ar' | 'photo_studio'; petAnimating: true } {
    return { mode: device.arkit || device.arcore ? 'ar' : 'photo_studio', petAnimating: true };
  }

  exportVerticalClip(pet: Pet, source: 'ar' | 'drama' | 'ceremony'): { width: 1080; height: 1920; seconds: 6; watermark: 'tamagochi.app'; shareIntent: true; hashtags: string[]; source: string } {
    return {
      width: 1080,
      height: 1920,
      seconds: 6,
      watermark: 'tamagochi.app',
      shareIntent: true,
      hashtags: ['#mochilife', '#virtualpet'],
      source: `${source}:${pet.id}`
    };
  }

  dailyDrama(pet: Pet, now = new Date()): { event: string; clip: ReturnType<MediaService['exportVerticalClip']> } {
    const last = this.dramaDay.get(pet.id);
    assert(!last || !sameUtcDay(last, now), 'viral.daily_drama_cap');
    this.dramaDay.set(pet.id, now);
    return { event: `${pet.displayName} tried to eat your homework!`, clip: this.exportVerticalClip(pet, 'drama') };
  }

  generatePetPalette(input: { prompt?: string; selfieHash?: string; user: UserProfile }): { paletteSeed: string; oneOfOne: true } {
    const prompt = input.prompt ?? input.selfieHash ?? 'default';
    assert(!hasBlockedText(prompt, ['slur', 'hate', 'explicit']), 'viral.generative_prompt_rejected');
    return { paletteSeed: hash(`${input.user.id}:${prompt}`, 16), oneOfOne: true };
  }

  socialPublishStub(input: SocialPublishInput): { mode: 'mocked-dependency'; auditEvent: 'social.publish.mocked'; request: { method: 'POST'; url: string; headers: Record<string, string>; body: Record<string, unknown> }; blockedReason: 'missing_platform_api_key' } {
    assert(input.assetUrl.startsWith('https://'), 'social.asset_url_https_required');
    assert(input.caption.length > 0 && input.caption.length <= 280, 'social.caption_length_invalid');
    assert(!input.apiKey, 'social.live_publish_disabled_in_local_stub');
    return {
      mode: 'mocked-dependency',
      auditEvent: 'social.publish.mocked',
      blockedReason: 'missing_platform_api_key',
      request: {
        method: 'POST',
        url: `https://social-publisher.local/${input.platform}/posts`,
        headers: {
          authorization: 'Bearer <platform-api-key>',
          'content-type': 'application/json'
        },
        body: {
          fr_id: input.frId,
          asset_url: input.assetUrl,
          caption: input.caption,
          scheduled_for: input.scheduledFor
        }
      }
    };
  }

  pushAllowed(input: { localHour: number; sentToday: number; under13: boolean }): boolean {
    if (input.localHour >= 22 || input.localHour < 7) return false;
    if (input.sentToday >= 3) return false;
    if (input.under13 && input.sentToday >= 1) return false;
    return true;
  }
}
