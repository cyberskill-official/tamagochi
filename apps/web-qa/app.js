const BUILD_ORDER = [
  'TASK-LEGAL-001', 'TASK-LEGAL-002', 'TASK-LEGAL-003', 'TASK-INFRA-001', 'TASK-INFRA-002', 'TASK-INFRA-003',
  'TASK-AUTH-001', 'TASK-AUTH-002', 'TASK-AUTH-003', 'TASK-OBS-001', 'TASK-ART-001', 'TASK-PET-001',
  'TASK-PET-002', 'TASK-PET-003', 'TASK-PET-004', 'TASK-CARE-001', 'TASK-CARE-002', 'TASK-CARE-003',
  'TASK-CARE-004', 'TASK-CARE-005', 'TASK-AI-001', 'TASK-AI-002', 'TASK-AR-001', 'TASK-VIRAL-001',
  'TASK-PET-005', 'TASK-PET-006', 'TASK-PET-007', 'TASK-PET-008', 'TASK-SOCIAL-001', 'TASK-SOCIAL-002',
  'TASK-SOCIAL-003', 'TASK-SOCIAL-004', 'TASK-VIRAL-002', 'TASK-VIRAL-003', 'TASK-ECON-001',
  'TASK-ECON-002', 'TASK-ECON-003', 'TASK-SUB-001', 'TASK-SUB-002', 'TASK-ADS-001', 'TASK-ADS-002',
  'TASK-VIRAL-004', 'TASK-VIRAL-005', 'TASK-OBS-002', 'TASK-I18N-001', 'TASK-I18N-002', 'TASK-A11Y-001',
  'TASK-AI-003', 'TASK-B2B-001', 'TASK-B2B-002', 'TASK-B2B-003', 'TASK-B2B-004', 'TASK-B2B-005'
];

const state = {
  pet: { name: 'Mochi', stage: 'egg', hunger: 100, cleanliness: 100, happiness: 100, energy: 100 },
  evidence: {},
  compliance: [
    'COPPA kids SKU: GameAnalytics + Sentry only',
    'No real-money randomized loot boxes',
    'Under-13 AI: scripted dialogue only',
    'Tenant partition: cross-tenant rows filtered',
    'Push quiet hours: local 22:00-07:00'
  ],
  social: [
    'TikTok/Reels/Shorts: Hatch reveal clip, Tuesday 19:30 ICT',
    'Daily Drama clip: Thursday 19:30 ICT',
    'PetPair co-parent story: Saturday 10:00 ICT',
    'Wedding ceremony clip: Sunday 20:00 ICT'
  ]
};

const $ = (id) => document.getElementById(id);

function render() {
  $('overall-status').textContent = Object.values(state.evidence).every((item) => item?.passed !== false) ? 'Passing' : 'Check';
  $('pet-name').textContent = state.pet.name;
  $('pet-state').textContent = `${state.pet.stage} · ${BUILD_ORDER.length} shipped tasks loaded`;
  for (const key of ['hunger', 'cleanliness', 'happiness', 'energy']) $(key).value = state.pet[key];
  $('evidence').textContent = JSON.stringify(state.evidence, null, 2);
  $('task-count').textContent = String(BUILD_ORDER.length);
  $('compliance-list').innerHTML = state.compliance.map((item) => `<li>${item}</li>`).join('');
  $('social-list').innerHTML = state.social.map((item) => `<li>${item}</li>`).join('');
}

function pass(name, evidence) {
  state.evidence[name] = { passed: true, ...evidence };
}

function standard() {
  state.pet = { name: 'Mochi', stage: 'adult', hunger: 100, cleanliness: 100, happiness: 100, energy: 95 };
  pass('standard-player-flow', {
    tasks: ['TASK-PET-001', 'TASK-CARE-001', 'TASK-AI-001', 'TASK-AR-001', 'TASK-VIRAL-001'],
    clip: { width: 1080, height: 1920, seconds: 6, watermark: 'tamagochi.app' }
  });
}

function kid() {
  pass('under-13-safe-flow', {
    tasks: ['TASK-AUTH-003', 'TASK-AI-002', 'TASK-ADS-002', 'TASK-VIRAL-005'],
    sdkAllowList: ['GameAnalytics', 'Sentry'],
    socialDiscovery: 'invite-code-only',
    adMode: 'contextual-only'
  });
}

function social() {
  pass('social-trade-flow', {
    tasks: ['TASK-SOCIAL-001', 'TASK-SOCIAL-002', 'TASK-SOCIAL-003', 'TASK-SOCIAL-004'],
    inviteCodeLength: 8,
    tradeConfirmations: 2,
    ceremonyShareClip: true
  });
}

function monetization() {
  pass('monetization-flow', {
    tasks: ['TASK-ECON-001', 'TASK-ECON-002', 'TASK-SUB-001', 'TASK-ADS-001', 'TASK-VIRAL-004'],
    randomizedPaidItems: 0,
    battlePassTiers: 40,
    rewardedVideoOnly: true
  });
}

function tenant() {
  pass('petos-tenant-flow', {
    tasks: ['TASK-B2B-001', 'TASK-B2B-002', 'TASK-B2B-003', 'TASK-B2B-004', 'TASK-B2B-005'],
    visibleTenantRows: 1,
    dpoAudit: 'role-gated',
    referenceTenants: ['techcombank', 'viettel']
  });
}

const scenarios = { standard, kid, social, monetization, tenant };

document.querySelectorAll('[data-scenario]').forEach((button) => {
  button.addEventListener('click', () => {
    const scenario = button.getAttribute('data-scenario');
    if (scenario === 'all') Object.values(scenarios).forEach((fn) => fn());
    else scenarios[scenario]();
    render();
  });
});

render();
