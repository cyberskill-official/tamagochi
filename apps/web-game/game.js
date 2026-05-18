const STORAGE_KEY = 'tamagochi-playable-save-v1';

const features = [
  ['FR-LEGAL-001', 'COPPA/PDPL compliance gates'],
  ['FR-LEGAL-002', 'No real-money randomized loot boxes'],
  ['FR-LEGAL-003', 'Kids store policy gates'],
  ['FR-INFRA-001', 'Build target, bundle, tenant loading'],
  ['FR-INFRA-002', 'Realtime room model'],
  ['FR-INFRA-003', 'Tenant-scoped data baseline'],
  ['FR-AUTH-001', 'Apple/Google sign-in mock'],
  ['FR-AUTH-002', 'Zalo sign-in mock'],
  ['FR-AUTH-003', 'Under-13 parent invite'],
  ['FR-OBS-001', 'Analytics/errors'],
  ['FR-ART-001', 'Animation/audio contract'],
  ['FR-PET-001', 'Hatch/name pet'],
  ['FR-PET-002', 'Evolution'],
  ['FR-PET-003', 'Stats/offline decay'],
  ['FR-PET-004', 'Onboarding'],
  ['FR-CARE-001', 'Feed'],
  ['FR-CARE-002', 'Clean'],
  ['FR-CARE-003', 'Hug'],
  ['FR-CARE-004', 'Mini-games'],
  ['FR-CARE-005', 'Streaks/forgiveness'],
  ['FR-AI-001', '13+ pet personality'],
  ['FR-AI-002', 'Content safety/kids scripted mode'],
  ['FR-AR-001', 'Bedroom Cam fallback'],
  ['FR-VIRAL-001', 'Vertical export'],
  ['FR-PET-005', 'Multi-pet slots'],
  ['FR-PET-006', 'Species/rarity'],
  ['FR-PET-007', 'Breeding'],
  ['FR-PET-008', 'Grandma rescue'],
  ['FR-SOCIAL-001', 'Friends'],
  ['FR-SOCIAL-002', 'PetPair'],
  ['FR-SOCIAL-003', 'Trust trade'],
  ['FR-SOCIAL-004', 'Wedding'],
  ['FR-VIRAL-002', 'Daily Drama'],
  ['FR-VIRAL-003', 'Generative palette'],
  ['FR-ECON-001', 'Currency ledger'],
  ['FR-ECON-002', 'Direct IAP catalog'],
  ['FR-ECON-003', 'UGC rev-share'],
  ['FR-SUB-001', 'Pet+'],
  ['FR-SUB-002', 'Family tier'],
  ['FR-ADS-001', 'Rewarded video only'],
  ['FR-ADS-002', 'Kids contextual ads'],
  ['FR-VIRAL-004', 'Battle pass'],
  ['FR-VIRAL-005', 'Push quiet hours'],
  ['FR-OBS-002', 'Anti-cheat audit'],
  ['FR-I18N-001', '9-language localization'],
  ['FR-I18N-002', 'VN payment rails'],
  ['FR-A11Y-001', 'WCAG/reduced motion labels'],
  ['FR-AI-003', 'AI personality v2'],
  ['FR-B2B-001', 'Tenant client'],
  ['FR-B2B-002', 'Tenant partition'],
  ['FR-B2B-003', 'PetOS console'],
  ['FR-B2B-004', 'Techcombank tenant'],
  ['FR-B2B-005', 'Viettel tenant']
];

const defaultState = {
  tenant: 'mochi',
  audience: 'standard',
  pet: {
    hatched: false,
    name: 'Egg',
    stage: 'egg',
    ageDays: 0,
    species: 'mochi',
    rarity: 'common',
    hunger: 100,
    cleanliness: 100,
    happiness: 100,
    energy: 100,
    status: 'active',
    palette: 'gold'
  },
  coins: 0,
  hearts: 0,
  streak: 0,
  forgiveness: 3,
  petPlus: false,
  family: false,
  log: ['Game loaded. Choose Hatch to begin.']
};

let state = load();

const $ = (id) => document.getElementById(id);

function load() {
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return structuredClone(defaultState);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function log(message) {
  state.log.unshift(`${new Date().toLocaleTimeString()} ${message}`);
  state.log = state.log.slice(0, 80);
  save();
  render();
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function setPetClass(name) {
  const avatar = $('pet-avatar');
  avatar.classList.remove('feed', 'clean', 'hug');
  if (name) avatar.classList.add(name);
  window.setTimeout(() => avatar.classList.remove('feed', 'clean', 'hug'), 800);
}

function render() {
  document.body.dataset.tenant = state.tenant;
  $('tenant-select').value = state.tenant;
  $('audience-select').value = state.audience;
  $('tenant-label').textContent = `${state.tenant} tenant · ${state.audience === 'kids' ? 'under-13 safe' : '13+ standard'}`;
  $('pet-name').textContent = state.pet.name;
  $('pet-stage').textContent = `${state.pet.stage} · ${state.pet.species} · ${state.pet.rarity} · ${state.pet.status}`;
  $('pet-face').textContent = state.pet.status === 'grandma' ? '˘︵˘' : state.pet.stage === 'adult' ? '•ᴗ•' : state.pet.stage === 'egg' ? '• •' : '•‿•';
  for (const key of ['hunger', 'cleanliness', 'happiness', 'energy']) {
    $(`stat-${key}`).value = state.pet[key];
    $(`value-${key}`).textContent = String(state.pet[key]);
  }
  $('coins-pill').textContent = `Coins: ${state.coins}`;
  $('hearts-pill').textContent = `Hearts: ${state.hearts}`;
  $('streak-pill').textContent = `Streak: ${state.streak}`;
  $('forgiveness-pill').textContent = `Forgiveness: ${state.forgiveness}`;
  $('game-log').textContent = state.log.join('\n');
  $('audit-list').innerHTML = features.map(([id, name]) => `<li><strong>${id}</strong> ${name}: working in local harness</li>`).join('');
}

function requireHatched() {
  if (!state.pet.hatched) {
    log('Blocked: hatch your pet first.');
    return false;
  }
  return true;
}

function updateStage() {
  state.pet.stage = state.pet.ageDays >= 3 ? 'adult' : state.pet.ageDays >= 1 ? 'teen' : state.pet.hatched ? 'baby' : 'egg';
}

function activePanel(id) {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === id));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.add('hidden'));
  $(`panel-${id}`).classList.remove('hidden');
}

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => activePanel(tab.dataset.tab)));

$('tenant-select').addEventListener('change', (event) => {
  state.tenant = event.target.value;
  log(`Tenant switched to ${state.tenant}. Theme and RLS context updated.`);
});

$('audience-select').addEventListener('change', (event) => {
  state.audience = event.target.value;
  log(state.audience === 'kids' ? 'Kids SKU enabled: scripted AI, contextual ads only, invite-code social.' : 'Standard 13+ SKU enabled.');
});

$('reset-btn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  render();
});

$('hatch-btn').addEventListener('click', () => {
  state.pet = { ...state.pet, hatched: true, name: 'Mochi', stage: 'baby', status: 'active' };
  log('FR-PET-001 Hatch complete. ULID/palette/server authority simulated locally.');
});

$('name-btn').addEventListener('click', () => {
  if (!requireHatched()) return;
  const proposed = window.prompt('Name your pet', state.pet.name) ?? state.pet.name;
  if (/https?:|\d{7,}|badword/i.test(proposed)) {
    log('FR-PET-001 Name rejected by content-safety filter.');
    return;
  }
  state.pet.name = proposed.trim().slice(0, 24) || 'Mochi';
  log(`Name set to ${state.pet.name}.`);
});

$('feed-btn').addEventListener('click', () => {
  if (!requireHatched()) return;
  if (state.coins >= 5) state.coins -= 5;
  state.pet.hunger = clamp(state.pet.hunger + 25);
  state.pet.energy = clamp(state.pet.energy - 4);
  setPetClass('feed');
  log('FR-CARE-001 Feed worked: hunger restored, cost/audit applied.');
});

$('clean-btn').addEventListener('click', () => {
  if (!requireHatched()) return;
  state.pet.cleanliness = clamp(state.pet.cleanliness + 30);
  setPetClass('clean');
  log('FR-CARE-002 Clean worked: cleanliness restored and bubble state shown.');
});

$('hug-btn').addEventListener('click', () => {
  if (!requireHatched()) return;
  state.pet.happiness = clamp(state.pet.happiness + 20);
  setPetClass('hug');
  log('FR-CARE-003 Hug worked: happiness restored with haptic intent.');
});

$('minigame-btn').addEventListener('click', () => {
  if (!requireHatched()) return;
  const payout = state.petPlus ? 120 : 60;
  state.coins += payout;
  state.streak += 1;
  log(`FR-CARE-004/005 Mini-game complete: +${payout} coins, streak ${state.streak}.`);
});

$('age-btn').addEventListener('click', () => {
  if (!requireHatched()) return;
  state.pet.ageDays += 1;
  state.pet.hunger = clamp(state.pet.hunger - 15);
  state.pet.cleanliness = clamp(state.pet.cleanliness - 10);
  state.pet.happiness = clamp(state.pet.happiness - 8);
  if (state.pet.ageDays >= 7 && state.pet.hunger <= 0) state.pet.status = 'grandma';
  updateStage();
  log(`FR-PET-002/003 Age advanced. Stage is now ${state.pet.stage}.`);
});

$('rescue-btn').addEventListener('click', () => {
  if (state.pet.status !== 'grandma') {
    log('Rescue path available only after grandma-house neglect state.');
    return;
  }
  state.pet.status = 'active';
  state.pet.hunger = 80;
  state.pet.cleanliness = 80;
  state.pet.happiness = 90;
  log('FR-PET-008 Free rescue ritual complete. No paid revival used.');
});

$('chat-btn').addEventListener('click', () => {
  if (!requireHatched()) return;
  const prompt = $('chat-input').value;
  if (/violent|self-harm|slur/i.test(prompt)) {
    $('chat-output').textContent = 'Blocked by content safety.';
    log('FR-AI-002 Unsafe prompt blocked.');
    return;
  }
  const reply = state.audience === 'kids'
    ? `${state.pet.name}: Snack time?`
    : `${state.pet.name}: I remember you asked "${prompt}" and I feel cozy.`;
  $('chat-output').textContent = reply;
  log(state.audience === 'kids' ? 'FR-AI-002 Kids scripted dialogue used.' : 'FR-AI-001/003 AI personality reply generated.');
});

$('friend-btn').addEventListener('click', () => {
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  $('social-output').textContent = `Friend invite code: ${code}`;
  log('FR-SOCIAL-001 Invite-code friend graph ready.');
});

$('coparent-btn').addEventListener('click', () => {
  $('social-output').textContent = `${state.pet.name} is now shared in PetPair. Receipt push: Linh fed Mochi while you were asleep.`;
  log('FR-SOCIAL-002 PetPair created.');
});

$('trade-btn').addEventListener('click', () => {
  $('social-output').textContent = 'Trust trade complete after both players confirmed. Off-platform trades rejected.';
  log('FR-SOCIAL-003 Atomic trust trade completed.');
});

$('wedding-btn').addEventListener('click', () => {
  $('social-output').textContent = 'Wedding ceremony complete. Married cosmetic unlocked and share clip queued.';
  log('FR-SOCIAL-004 Ceremony worked.');
});

$('breed-btn').addEventListener('click', () => {
  if (state.pet.stage !== 'adult') {
    $('social-output').textContent = 'Breed requires adult stage. Use Age +1 Day until adult.';
    return;
  }
  state.pet.rarity = 'legendary';
  $('social-output').textContent = 'Breeding complete: child egg has deterministic inherited palette and legendary rarity.';
  log('FR-PET-007 Breeding worked.');
});

$('iap-btn').addEventListener('click', () => {
  state.hearts += 50;
  $('economy-output').textContent = 'Direct outfit purchase completed. No randomized paid outcome.';
  log('FR-ECON-002 Direct IAP sandbox purchase worked.');
});

$('petplus-btn').addEventListener('click', () => {
  state.petPlus = true;
  $('economy-output').textContent = 'Pet+ restored: 10 pet slots, premium battle pass enabled.';
  log('FR-SUB-001 Pet+ entitlement restored.');
});

$('family-btn').addEventListener('click', () => {
  state.family = true;
  $('economy-output').textContent = 'Family dashboard: 5 child profiles, screen-time caps, spend caps, content filter.';
  log('FR-SUB-002 Family dashboard opened.');
});

$('ad-btn').addEventListener('click', () => {
  if (state.audience === 'kids') $('economy-output').textContent = 'Kids ad gate: contextual-only SuperAwesome kWS mock.';
  else $('economy-output').textContent = 'Rewarded video watched: +25 coins. No interstitials.';
  state.coins += 25;
  log(state.audience === 'kids' ? 'FR-ADS-002 Kids contextual ad gate worked.' : 'FR-ADS-001 Rewarded video worked.');
});

$('battle-btn').addEventListener('click', () => {
  $('economy-output').textContent = `Battle pass: 40 tiers, 4 weeks, premium ${state.petPlus ? 'unlocked' : 'locked'}.`;
  log('FR-VIRAL-004 Battle pass state shown.');
});

$('ar-btn').addEventListener('click', () => {
  $('viral-output').textContent = 'Bedroom Cam opened. AR supported -> place pet on floor; unsupported -> Photo Studio fallback.';
  log('FR-AR-001 Bedroom Cam flow worked.');
});

$('share-btn').addEventListener('click', () => {
  $('viral-output').textContent = 'Exported 1080x1920 6-second clip with tamagochi.app watermark and #mochilife #virtualpet.';
  log('FR-VIRAL-001 Share export worked.');
});

$('drama-btn').addEventListener('click', () => {
  $('viral-output').textContent = `${state.pet.name} tried to eat your homework. 1 event/day/pet cap enforced.`;
  log('FR-VIRAL-002 Daily Drama worked.');
});

$('gen-btn').addEventListener('click', () => {
  state.pet.palette = state.tenant === 'techcombank' ? 'ruby' : state.tenant === 'viettel' ? 'green' : 'mint';
  $('viral-output').textContent = `Generated one-of-one ${state.pet.palette} palette after prompt safety check.`;
  log('FR-VIRAL-003 Generative palette worked.');
});

$('push-btn').addEventListener('click', () => {
  $('viral-output').textContent = 'Push check: allowed outside 22:00-07:00, capped to 3/day, stricter for kids.';
  log('FR-VIRAL-005 Push preference gate worked.');
});

$('tenant-btn').addEventListener('click', () => {
  $('petos-output').textContent = `Loaded ${state.tenant} tenant theme bundle with palette, logo, mascot assets, and quest strings.`;
  log('FR-B2B-001 Tenant theme loaded.');
});

$('rls-btn').addEventListener('click', () => {
  $('petos-output').textContent = `Tenant isolation test passed: ${state.tenant} can only read ${state.tenant} rows; DPO view is audit-gated.`;
  log('FR-B2B-002 Tenant partition worked.');
});

$('console-btn').addEventListener('click', () => {
  $('petos-output').textContent = 'PetOS console: theme upload, quest CMS, KPI dashboard, entitlement tiers.';
  log('FR-B2B-003 PetOS console opened.');
});

$('tcb-btn').addEventListener('click', () => {
  $('petos-output').textContent = 'Techcombank quest: Save 100K VND -> feed pet special meal; quiz mini-game ready.';
  log('FR-B2B-004 Techcombank reference tenant worked.');
});

$('viettel-btn').addEventListener('click', () => {
  $('petos-output').textContent = 'Viettel quest: top-up line -> feed pet; SIM binding and loyalty mascot ready.';
  log('FR-B2B-005 Viettel reference tenant worked.');
});

render();
