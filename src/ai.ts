import type { Pet, UserProfile } from './types.ts';
import { assert, hash, hasBlockedText } from './utils.ts';

export class AIService {
  readonly cache = new Map<string, string>();
  readonly dailyCost = new Map<string, number>();
  readonly scriptedDialogue = ['Let us play!', 'Snack time?', 'I feel cozy today.'];

  moderate(text: string): true {
    assert(!hasBlockedText(text, ['slur', 'self-harm', 'violent threat']), 'ai.moderation_rejected');
    return true;
  }

  reply(user: UserProfile, pet: Pet, input: string): string {
    if (user.audienceAgeGate === 'under-13') return this.scriptedDialogue[Math.abs(hash(input).charCodeAt(0)) % this.scriptedDialogue.length]!;
    this.moderate(input);
    const key = `${pet.id}:${hash(input)}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const cost = (this.dailyCost.get(pet.id) ?? 0) + 1;
    assert(cost <= 20, 'ai.daily_cost_cap');
    this.dailyCost.set(pet.id, cost);
    const response = `${pet.displayName} chirps: ${input.includes('?') ? 'I think so!' : 'I hear you.'}`;
    this.moderate(response);
    this.cache.set(key, response);
    return response;
  }

  personaYaml(pet: Pet): string {
    const yaml = `name: ${pet.displayName}\nspecies: ${pet.species}\nstage: ${pet.stage}\ntone: cozy\n`;
    assert(yaml.length <= 1200, 'ai.persona_too_long');
    return yaml;
  }

  personalityV2(user: UserProfile, pet: Pet, signals: { selfie?: string; playerName?: string; siblings?: string[] }): string {
    if (user.audienceAgeGate === 'under-13') return 'scripted_only';
    const siblingText = signals.siblings?.length ? ` and remembers ${signals.siblings.join(', ')}` : '';
    return `${pet.displayName} notices ${signals.selfie ?? 'your smile'}${signals.playerName ? `, ${signals.playerName}` : ''}${siblingText}.`;
  }
}
