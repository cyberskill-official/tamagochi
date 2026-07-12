import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { TamagochiPlatform } from '../../src/platform.ts';

test('file-backed platform persists gameplay, ledger, events, and queued social posts across reloads', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tamagochi-platform-'));
  try {
    const stateFile = join(dir, 'state.json');
    const platform = await TamagochiPlatform.open(stateFile);
    const user = await platform.signIn('apple', 'persistent-player');
    const pet = await platform.hatchPet(user, 'mochi', 'Mochi', new Date('2026-05-24T01:00:00.000Z'));

    pet.hunger = 40;
    await platform.feedPet(user, pet.id, new Date('2026-05-24T02:00:00.000Z'));
    await platform.grantCoins(user, 120, 'unit:persistence:grant');
    await platform.restorePetPlus(user, 'apple', 'pet_plus.monthly', 'txn-persist-001');
    const publish = await platform.queueSocialPost(user, pet.id, {
      frId: 'FR-VIRAL-001',
      platform: 'tiktok',
      assetUrl: 'https://cdn.tamagochi.app/pets/mochi-first-care.mp4',
      caption: 'Mochi made it through first care.',
      scheduledFor: '2026-05-24T03:00:00.000Z',
      accessToken: 'live-publish-token-1234567890'
    });

    const raw = JSON.parse(await readFile(stateFile, 'utf8'));
    assert.equal(raw.users.length, 1);
    assert.equal(raw.pets.length, 1);
    assert.equal(raw.ledger.length, 2);
    assert.equal(raw.obsEvents.some((event: Record<string, unknown>) => event.name === 'social.publish.queued'), true);
    assert.equal(raw.socialPublishes[0].id, publish.platformPostId);
    assert.equal(raw.socialPublishes[0].tokenHash.length, 64);
    assert.equal(raw.socialPublishes[0].body.asset_url, 'https://cdn.tamagochi.app/pets/mochi-first-care.mp4');

    const reloaded = await TamagochiPlatform.open(stateFile);
    assert.equal(reloaded.auth.users.get(user.id)?.petPlus, true);
    assert.equal(reloaded.pets.pets.get(pet.id)?.displayName, 'Mochi');
    assert.equal(reloaded.pets.pets.get(pet.id)?.hunger, 75);
    assert.equal(reloaded.pets.pets.get(pet.id)?.lastSeenAt.toISOString(), '2026-05-24T02:00:00.000Z');
    assert.equal(reloaded.econ.balance(user.id, 'coins'), 120);
    assert.equal(reloaded.publishedSocialPosts[0]?.id, publish.platformPostId);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
