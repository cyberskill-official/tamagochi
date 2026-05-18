import type { Pet, UserProfile } from './types.ts';
import { assert, clamp, sameUtcDay } from './utils.ts';

export class CareService {
  readonly events: Array<Record<string, unknown>> = [];
  private readonly hugCap = new Map<string, Date>();
  private readonly dailyEarn = new Map<string, { day: string; coins: number }>();
  private readonly streaks = new Map<string, { count: number; forgivenessTokens: number; lastClaim: Date | null }>();

  feed(user: UserProfile, pet: Pet, now = new Date()): Pet {
    assert(pet.tenantId === user.tenantId, 'care.cross_tenant_forbidden');
    pet.hunger = clamp(pet.hunger + 35);
    pet.energy = clamp(pet.energy - 5);
    pet.lastSeenAt = now;
    this.events.push({ name: 'care.feed', petId: pet.id, anim: 'eat' });
    return pet;
  }

  clean(user: UserProfile, pet: Pet, now = new Date()): Pet {
    assert(pet.tenantId === user.tenantId, 'care.cross_tenant_forbidden');
    pet.cleanliness = clamp(pet.cleanliness + 40);
    pet.lastSeenAt = now;
    this.events.push({ name: 'care.clean', petId: pet.id, particle: 'bubble' });
    return pet;
  }

  hug(user: UserProfile, pet: Pet, now = new Date()): Pet {
    const last = this.hugCap.get(`${user.id}:${pet.id}`);
    const capped = Boolean(last && sameUtcDay(last, now));
    pet.happiness = clamp(pet.happiness + (capped ? 5 : 30));
    pet.lastSeenAt = now;
    this.hugCap.set(`${user.id}:${pet.id}`, now);
    this.events.push({ name: 'care.hug', petId: pet.id, haptic: true, capped });
    return pet;
  }

  miniGame(user: UserProfile, game: 'tap' | 'memory' | 'catch' | 'rhythm', score: number, now = new Date()): { game: string; coins: number } {
    const day = now.toISOString().slice(0, 10);
    const key = `${user.id}:${day}`;
    const current = this.dailyEarn.get(key) ?? { day, coins: 0 };
    const cap = user.petPlus ? 1500 : 500;
    const payout = Math.min(Math.max(0, Math.floor(score / 10)), 100, cap - current.coins);
    current.coins += payout;
    this.dailyEarn.set(key, current);
    this.events.push({ name: 'care.mini_game', game, payout });
    return { game, coins: payout };
  }

  claimStreak(user: UserProfile, now = new Date()): { count: number; forgivenessTokens: number; cozyHour: boolean } {
    const state = this.streaks.get(user.id) ?? { count: 0, forgivenessTokens: 3, lastClaim: null };
    if (!state.lastClaim) state.count = 1;
    else {
      const gap = Math.floor((now.getTime() - state.lastClaim.getTime()) / 86_400_000);
      if (gap <= 1) state.count += 1;
      else if (gap <= 2 && state.forgivenessTokens > 0) state.forgivenessTokens -= 1;
      else state.count = 1;
    }
    state.lastClaim = now;
    this.streaks.set(user.id, state);
    return { ...state, cozyHour: now.getUTCDay() === 6 };
  }

  respectsSleepHours(localHour: number): boolean {
    return localHour < 22 && localHour >= 7;
  }
}
