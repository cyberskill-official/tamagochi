import { open, mkdir, readFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AuthService } from './auth.ts';
import { CareService } from './care.ts';
import { EconomyService } from './economy.ts';
import { MediaService, type SocialPlatform, type SocialPublishInput, type SocialPublishTransport } from './media.ts';
import { ObservabilityService } from './observability.ts';
import { PetService } from './pet.ts';
import { SocialService } from './social.ts';
import type { LedgerEntry, Pet, Provider, Species, TenantSlug, UserProfile } from './types.ts';
import { assert, hash, ulid } from './utils.ts';

type IsoLedgerEntry = Omit<LedgerEntry, 'occurredAt'> & { occurredAt: string };
type IsoPet = Omit<Pet, 'bornAt' | 'hatchedAt' | 'lastSeenAt'> & {
  bornAt: string;
  hatchedAt?: string;
  lastSeenAt: string;
};

interface PersistedInvite {
  code: string;
  parentEmailHash: string;
  vendor: 'PRIVO' | 'SuperAwesome kWS';
  verified: boolean;
  tenantId: TenantSlug;
}

interface PersistedPetAudit {
  petId: string;
  transition: string;
  at: string;
}

interface PersistedPair {
  pairId: string;
  petId: string;
  users: [string, string];
  actions: Array<{ userId: string; at: string }>;
}

export interface PersistedSocialPublish {
  id: string;
  platform: SocialPlatform;
  url: string;
  at: string;
  body: Record<string, unknown>;
  tokenHash: string;
}

export interface PlatformSnapshot {
  version: 1;
  savedAt: string;
  users: UserProfile[];
  invites: PersistedInvite[];
  pets: IsoPet[];
  petAudit: PersistedPetAudit[];
  ledger: IsoLedgerEntry[];
  careEvents: Array<Record<string, unknown>>;
  obsEvents: Array<Record<string, unknown>>;
  friends: Array<{ userId: string; friendIds: string[] }>;
  blocks: Array<{ userId: string; blockedIds: string[] }>;
  pairs: PersistedPair[];
  socialPublishes: PersistedSocialPublish[];
}

export class JsonPlatformStore {
  readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async load(): Promise<PlatformSnapshot> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const snapshot = JSON.parse(raw) as PlatformSnapshot;
      assert(snapshot.version === 1, 'platform.snapshot_version_unsupported');
      return withSnapshotDefaults(snapshot);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptySnapshot();
      throw error;
    }
  }

  async save(snapshot: PlatformSnapshot): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const next = { ...snapshot, savedAt: new Date().toISOString() };
    const body = `${JSON.stringify(next, null, 2)}\n`;
    const tmpPath = `${this.filePath}.${randomUUID()}.tmp`;
    const handle = await open(tmpPath, 'w', 0o600);
    try {
      await handle.writeFile(body, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(tmpPath, this.filePath);
    try {
      const dirHandle = await open(dirname(this.filePath), 'r');
      try {
        await dirHandle.sync();
      } finally {
        await dirHandle.close();
      }
    } catch {
      // Directory fsync is best-effort across developer platforms.
    }
  }
}

export class TamagochiPlatform {
  readonly auth = new AuthService();
  readonly pets = new PetService();
  readonly care = new CareService();
  readonly econ = new EconomyService();
  readonly media = new MediaService();
  readonly obs = new ObservabilityService();
  readonly social = new SocialService();
  readonly store: JsonPlatformStore;
  private socialPublishes: PersistedSocialPublish[] = [];

  constructor(store: JsonPlatformStore) {
    this.store = store;
  }

  static async open(filePath: string): Promise<TamagochiPlatform> {
    const platform = new TamagochiPlatform(new JsonPlatformStore(filePath));
    await platform.reload();
    return platform;
  }

  get publishedSocialPosts(): readonly PersistedSocialPublish[] {
    return this.socialPublishes;
  }

  async reload(): Promise<void> {
    this.applySnapshot(await this.store.load());
  }

  async flush(): Promise<void> {
    await this.store.save(this.snapshot());
  }

  async signIn(provider: Provider, subject: string, tenantId: TenantSlug = 'mochi'): Promise<UserProfile> {
    const token = this.auth.createProviderToken(provider, subject, tenantId);
    const user = this.auth.signIn(provider, token, tenantId);
    this.obs.track('auth.sign_in.persisted', { user_id: user.id, provider }, user.tenantId);
    await this.flush();
    return user;
  }

  async hatchPet(user: UserProfile, species: Species = 'mochi', displayName = 'Mochi', now = new Date()): Promise<Pet> {
    const hatch = this.pets.hatch(user, species, now);
    const pet = this.pets.namePet(user, hatch.pet.id, displayName, hatch.hatchAnimationToken);
    this.obs.track('pet.hatched.persisted', { pet_id: pet.id, species }, user.tenantId);
    await this.flush();
    return pet;
  }

  async feedPet(user: UserProfile, petId: string, now = new Date()): Promise<Pet> {
    const pet = this.pets.requireOwnedPet(user, petId);
    const updated = this.care.feed(user, pet, now);
    this.obs.track('care.feed.persisted', { pet_id: petId }, user.tenantId);
    await this.flush();
    return updated;
  }

  async grantCoins(user: UserProfile, amount: number, ref: string): Promise<number> {
    const balance = this.econ.grant(user, 'coins', amount, ref);
    this.obs.track('economy.coins.granted', { user_id: user.id, amount, ref }, user.tenantId);
    await this.flush();
    return balance;
  }

  async restorePetPlus(user: UserProfile, platform: 'apple' | 'google', sku: string, transactionId: string): Promise<{ user: UserProfile; receipt: string }> {
    const receipt = this.econ.createSignedReceipt(platform, { userId: user.id, sku, transactionId, kind: 'subscription' });
    const updated = this.econ.restoreSubscription(user, platform, receipt);
    this.obs.track('subscription.pet_plus.restored', { user_id: user.id, sku, platform }, user.tenantId);
    await this.flush();
    return { user: updated, receipt };
  }

  async queueSocialPost(user: UserProfile, petId: string, input: Omit<SocialPublishInput, 'taskId'> & { taskId?: string }): Promise<Awaited<ReturnType<MediaService['publishSocial']>>> {
    const pet = this.pets.requireOwnedPet(user, petId);
    const publishInput: SocialPublishInput = {
      taskId: input.taskId ?? 'TASK-VIRAL-001',
      platform: input.platform,
      assetUrl: input.assetUrl,
      caption: input.caption,
      scheduledFor: input.scheduledFor,
      accessToken: input.accessToken
    };
    const transport = this.persistingSocialTransport(input.accessToken);
    const result = await this.media.publishSocial(publishInput, transport);
    this.obs.track('social.publish.queued', { pet_id: pet.id, platform: input.platform, post_id: result.platformPostId }, user.tenantId);
    await this.flush();
    return result;
  }

  snapshot(): PlatformSnapshot {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      users: [...this.auth.users.values()].map((user) => ({ ...user })),
      invites: [...this.auth.invites.values()].map((invite) => ({ ...invite })),
      pets: [...this.pets.pets.values()].map((pet) => serializePet(pet)),
      petAudit: this.pets.audit.map((row) => ({ ...row, at: row.at.toISOString() })),
      ledger: this.econ.ledger.map((entry) => ({ ...entry, occurredAt: entry.occurredAt.toISOString() })),
      careEvents: this.care.events.map((event) => ({ ...event })),
      obsEvents: this.obs.events.map((event) => ({ ...event })),
      friends: [...this.social.friends.entries()].map(([userId, ids]) => ({ userId, friendIds: [...ids].sort() })),
      blocks: [...this.social.blocks.entries()].map(([userId, ids]) => ({ userId, blockedIds: [...ids].sort() })),
      pairs: [...this.social.pairs.entries()].map(([pairId, pair]) => ({
        pairId,
        petId: pair.petId,
        users: [...pair.users] as [string, string],
        actions: pair.actions.map((action) => ({ userId: action.userId, at: action.at.toISOString() }))
      })),
      socialPublishes: this.socialPublishes.map((post) => ({ ...post, body: { ...post.body } }))
    };
  }

  private applySnapshot(snapshot: PlatformSnapshot): void {
    this.auth.users.clear();
    for (const user of snapshot.users) this.auth.users.set(user.id, { ...user });

    this.auth.invites.clear();
    for (const invite of snapshot.invites) this.auth.invites.set(invite.code, { ...invite });

    this.pets.pets.clear();
    for (const pet of snapshot.pets) this.pets.pets.set(pet.id, deserializePet(pet));

    this.pets.audit.splice(0, this.pets.audit.length, ...snapshot.petAudit.map((row) => ({ ...row, at: new Date(row.at) })));
    this.econ.ledger.splice(0, this.econ.ledger.length, ...snapshot.ledger.map((entry) => ({ ...entry, occurredAt: new Date(entry.occurredAt) })));
    this.care.events.splice(0, this.care.events.length, ...snapshot.careEvents.map((event) => ({ ...event })));
    this.obs.events.splice(0, this.obs.events.length, ...snapshot.obsEvents.map((event) => ({ ...event })));

    this.social.friends.clear();
    for (const row of snapshot.friends) this.social.friends.set(row.userId, new Set(row.friendIds));
    this.social.blocks.clear();
    for (const row of snapshot.blocks) this.social.blocks.set(row.userId, new Set(row.blockedIds));
    this.social.pairs.clear();
    for (const pair of snapshot.pairs) {
      this.social.pairs.set(pair.pairId, {
        petId: pair.petId,
        users: pair.users,
        actions: pair.actions.map((action) => ({ userId: action.userId, at: new Date(action.at) }))
      });
    }

    this.socialPublishes = snapshot.socialPublishes.map((post) => ({ ...post, body: { ...post.body } }));
  }

  private persistingSocialTransport(accessToken: string): SocialPublishTransport {
    return {
      post: async (url, body) => {
        const platform = url.split('/').at(-2) as SocialPlatform;
        const id = ulid(`${url}:${JSON.stringify(body)}:${this.socialPublishes.length}`);
        this.socialPublishes.push({
          id,
          platform,
          url,
          at: new Date().toISOString(),
          body: { ...body },
          tokenHash: hash(accessToken, 64)
        });
        return { status: 202, id };
      }
    };
  }
}

function emptySnapshot(): PlatformSnapshot {
  return {
    version: 1,
    savedAt: new Date(0).toISOString(),
    users: [],
    invites: [],
    pets: [],
    petAudit: [],
    ledger: [],
    careEvents: [],
    obsEvents: [],
    friends: [],
    blocks: [],
    pairs: [],
    socialPublishes: []
  };
}

function withSnapshotDefaults(snapshot: PlatformSnapshot): PlatformSnapshot {
  return {
    ...emptySnapshot(),
    ...snapshot,
    users: snapshot.users ?? [],
    invites: snapshot.invites ?? [],
    pets: snapshot.pets ?? [],
    petAudit: snapshot.petAudit ?? [],
    ledger: snapshot.ledger ?? [],
    careEvents: snapshot.careEvents ?? [],
    obsEvents: snapshot.obsEvents ?? [],
    friends: snapshot.friends ?? [],
    blocks: snapshot.blocks ?? [],
    pairs: snapshot.pairs ?? [],
    socialPublishes: snapshot.socialPublishes ?? []
  };
}

function serializePet(pet: Pet): IsoPet {
  return {
    ...pet,
    bornAt: pet.bornAt.toISOString(),
    hatchedAt: pet.hatchedAt?.toISOString(),
    lastSeenAt: pet.lastSeenAt.toISOString()
  };
}

function deserializePet(pet: IsoPet): Pet {
  return {
    ...pet,
    bornAt: new Date(pet.bornAt),
    hatchedAt: pet.hatchedAt ? new Date(pet.hatchedAt) : undefined,
    lastSeenAt: new Date(pet.lastSeenAt)
  };
}
