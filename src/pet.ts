import type { Pet, Rarity, Species, Stage, TenantSlug, UserProfile } from './types.ts';
import { assert, clamp, daysBetween, hash, hasBlockedText, ulid } from './utils.ts';

const speciesRarity: Record<Species, Rarity> = {
  mochi: 'common',
  pengu: 'rare',
  bao: 'epic',
  fluffit: 'mythic',
  tako: 'legendary'
};

export class PetService {
  readonly pets = new Map<string, Pet>();
  readonly audit: Array<{ petId: string; transition: string; at: Date }> = [];
  private readonly hatchDebounce = new Map<string, Date>();
  private readonly coParents = new Map<string, Set<string>>();

  assertNameSafe(name: string, audience: UserProfile['audienceAgeGate']): true {
    const trimmed = name.trim();
    assert(trimmed.length >= 2 && trimmed.length <= 24, 'pet.name_length');
    assert(/^[\p{L}\p{N}\p{M} '\-]+$/u.test(trimmed), 'pet.name_charset');
    assert(!hasBlockedText(trimmed, ['slur', 'curse', 'badword']), 'pet.name_blocklist');
    if (audience === 'under-13') {
      assert(!/https?:\/\//i.test(trimmed), 'pet.name_url_rejected');
      assert(!/\+?\d[\d -]{7,}/.test(trimmed), 'pet.name_phone_rejected');
      assert(!/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(trimmed), 'pet.name_full_name_rejected');
    }
    return true;
  }

  hatch(user: UserProfile, species: Species = 'mochi', now = new Date()): { pet: Pet; hatchAnimationToken: string } {
    assert(user.audienceAgeGate !== 'under-13' || user.parentVerified, 'pet.kid_parental_consent_required');
    const activeCount = [...this.pets.values()].filter((pet) => pet.ownerId === user.id && pet.status === 'active').length;
    const cap = user.petPlus ? 10 : 3;
    assert(activeCount < cap, 'pet.quota_exceeded');
    const last = this.hatchDebounce.get(user.id);
    assert(!last || now.getTime() - last.getTime() >= 3_600_000, 'pet.hatch_debounce');
    this.hatchDebounce.set(user.id, now);
    const id = ulid(`${user.id}:${species}:${now.toISOString()}`);
    const pet: Pet = {
      id,
      tenantId: user.tenantId,
      ownerId: user.id,
      species,
      rarity: speciesRarity[species],
      displayName: species === 'mochi' ? 'Mochi' : species,
      stage: 'egg',
      bornAt: now,
      lastSeenAt: now,
      paletteSeed: hash(id),
      audienceAgeGate: user.audienceAgeGate,
      status: 'active',
      hunger: 100,
      cleanliness: 100,
      happiness: 100,
      energy: 100,
      traits: { statBias: 0 }
    };
    this.pets.set(id, pet);
    this.audit.push({ petId: id, transition: 'hatch', at: now });
    return { pet, hatchAnimationToken: hash(`${id}:${user.id}:hatch`, 24) };
  }

  namePet(user: UserProfile, petId: string, displayName: string, hatchAnimationToken: string): Pet {
    const pet = this.requireOwnedPet(user, petId);
    assert(hatchAnimationToken === hash(`${pet.id}:${user.id}:hatch`, 24), 'pet.hatch_token_invalid');
    this.assertNameSafe(displayName, user.audienceAgeGate);
    const duplicate = [...this.pets.values()].some((other) => other.ownerId === user.id && other.id !== petId && other.status === 'active' && other.displayName.toLowerCase() === displayName.toLowerCase());
    assert(!duplicate, 'pet.name_duplicate');
    pet.displayName = displayName.trim();
    pet.hatchedAt = new Date();
    this.audit.push({ petId, transition: 'name_changed', at: pet.hatchedAt });
    return pet;
  }

  evolve(pet: Pet, now = new Date()): Stage {
    const ageHours = (now.getTime() - pet.bornAt.getTime()) / 3_600_000;
    const next: Stage = ageHours >= 72 ? 'adult' : ageHours >= 24 ? 'teen' : ageHours >= 1 ? 'baby' : 'egg';
    if (pet.stage !== next) {
      pet.stage = next;
      this.audit.push({ petId: pet.id, transition: `stage:${next}`, at: now });
    }
    return pet.stage;
  }

  reconcileStats(pet: Pet, now = new Date()): Pet {
    const hours = Math.max(0, (now.getTime() - pet.lastSeenAt.getTime()) / 3_600_000);
    const stageFactor = pet.stage === 'adult' ? 0.75 : pet.stage === 'teen' ? 1 : 1.25;
    pet.hunger = clamp(pet.hunger - hours * 3 * stageFactor);
    pet.cleanliness = clamp(pet.cleanliness - hours * 2 * stageFactor);
    pet.happiness = clamp(pet.happiness - hours * 2.5 * stageFactor);
    pet.energy = clamp(pet.energy + hours * 4);
    pet.lastSeenAt = now;
    return pet;
  }

  moveToGrandmaIfNeglected(pet: Pet, now = new Date()): boolean {
    if (daysBetween(pet.lastSeenAt, now) >= 7) {
      pet.stage = 'grandma_house';
      pet.status = 'grandma';
      this.audit.push({ petId: pet.id, transition: 'grandma', at: now });
      return true;
    }
    return false;
  }

  rescueFromGrandma(pet: Pet, ritualDays: number): Pet {
    assert(pet.status === 'grandma', 'pet.not_in_grandma_house');
    assert(ritualDays >= 3, 'pet.rescue_requires_three_free_rituals');
    pet.status = 'active';
    pet.stage = 'adult';
    pet.hunger = 80;
    pet.cleanliness = 80;
    pet.happiness = 90;
    this.audit.push({ petId: pet.id, transition: 'rescue', at: new Date() });
    return pet;
  }

  breed(parentA: Pet, parentB: Pet, now = new Date()): Pet {
    assert(parentA.stage === 'adult' && parentB.stage === 'adult', 'pet.breeding_requires_adults');
    assert(parentA.tenantId === parentB.tenantId, 'pet.cross_tenant_breeding_forbidden');
    const childSeed = hash(`${parentA.paletteSeed}:${parentB.paletteSeed}`);
    const child: Pet = {
      id: ulid(`${parentA.id}:${parentB.id}:${now.toISOString()}`),
      tenantId: parentA.tenantId,
      ownerId: parentA.ownerId,
      species: parentA.species,
      rarity: 'legendary',
      displayName: 'Egg',
      stage: 'egg',
      bornAt: now,
      lastSeenAt: now,
      paletteSeed: childSeed,
      audienceAgeGate: parentA.audienceAgeGate,
      status: 'active',
      hunger: 100,
      cleanliness: 100,
      happiness: 100,
      energy: 100,
      traits: { inheritedFrom: `${parentA.id}:${parentB.id}`, statBias: Number.parseInt(childSeed.slice(0, 2), 16) % 10 }
    };
    this.pets.set(child.id, child);
    return child;
  }

  addCoParent(petId: string, userId: string): void {
    const set = this.coParents.get(petId) ?? new Set<string>();
    set.add(userId);
    this.coParents.set(petId, set);
  }

  requireOwnedPet(user: UserProfile, petId: string): Pet {
    const pet = this.pets.get(petId);
    assert(pet, 'pet.not_found');
    const coparents = this.coParents.get(petId);
    assert(pet.ownerId === user.id || coparents?.has(user.id), 'pet.not_owned');
    assert(pet.tenantId === user.tenantId, 'pet.cross_tenant_forbidden');
    return pet;
  }
}
