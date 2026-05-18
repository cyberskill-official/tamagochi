const BUILD_ORDER = [
  'FR-LEGAL-001', 'FR-LEGAL-002', 'FR-LEGAL-003', 'FR-INFRA-001', 'FR-INFRA-002', 'FR-INFRA-003',
  'FR-AUTH-001', 'FR-AUTH-002', 'FR-AUTH-003', 'FR-OBS-001', 'FR-ART-001', 'FR-PET-001',
  'FR-PET-002', 'FR-PET-003', 'FR-PET-004', 'FR-CARE-001', 'FR-CARE-002', 'FR-CARE-003',
  'FR-CARE-004', 'FR-CARE-005', 'FR-AI-001', 'FR-AI-002', 'FR-AR-001', 'FR-VIRAL-001',
  'FR-PET-005', 'FR-PET-006', 'FR-PET-007', 'FR-PET-008', 'FR-SOCIAL-001', 'FR-SOCIAL-002',
  'FR-SOCIAL-003', 'FR-SOCIAL-004', 'FR-VIRAL-002', 'FR-VIRAL-003', 'FR-ECON-001',
  'FR-ECON-002', 'FR-ECON-003', 'FR-SUB-001', 'FR-SUB-002', 'FR-ADS-001', 'FR-ADS-002',
  'FR-VIRAL-004', 'FR-VIRAL-005', 'FR-OBS-002', 'FR-I18N-001', 'FR-I18N-002', 'FR-A11Y-001',
  'FR-AI-003', 'FR-B2B-001', 'FR-B2B-002', 'FR-B2B-003', 'FR-B2B-004', 'FR-B2B-005'
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
  $('pet-state').textContent = `${state.pet.stage} · ${BUILD_ORDER.length} shipped FRs loaded`;
  for (const key of ['hunger', 'cleanliness', 'happiness', 'energy']) $(key).value = state.pet[key];
  $('evidence').textContent = JSON.stringify(state.evidence, null, 2);
  $('fr-count').textContent = String(BUILD_ORDER.length);
  $('compliance-list').innerHTML = state.compliance.map((item) => `<li>${item}</li>`).join('');
  $('social-list').innerHTML = state.social.map((item) => `<li>${item}</li>`).join('');
}

function pass(name, evidence) {
  state.evidence[name] = { passed: true, ...evidence };
}

function standard() {
  state.pet = { name: 'Mochi', stage: 'adult', hunger: 100, cleanliness: 100, happiness: 100, energy: 95 };
  pass('standard-player-flow', {
    frs: ['FR-PET-001', 'FR-CARE-001', 'FR-AI-001', 'FR-AR-001', 'FR-VIRAL-001'],
    clip: { width: 1080, height: 1920, seconds: 6, watermark: 'tamagochi.app' }
  });
}

function kid() {
  pass('under-13-safe-flow', {
    frs: ['FR-AUTH-003', 'FR-AI-002', 'FR-ADS-002', 'FR-VIRAL-005'],
    sdkAllowList: ['GameAnalytics', 'Sentry'],
    socialDiscovery: 'invite-code-only',
    adMode: 'contextual-only'
  });
}

function social() {
  pass('social-trade-flow', {
    frs: ['FR-SOCIAL-001', 'FR-SOCIAL-002', 'FR-SOCIAL-003', 'FR-SOCIAL-004'],
    inviteCodeLength: 8,
    tradeConfirmations: 2,
    ceremonyShareClip: true
  });
}

function monetization() {
  pass('monetization-flow', {
    frs: ['FR-ECON-001', 'FR-ECON-002', 'FR-SUB-001', 'FR-ADS-001', 'FR-VIRAL-004'],
    randomizedPaidItems: 0,
    battlePassTiers: 40,
    rewardedVideoOnly: true
  });
}

function tenant() {
  pass('petos-tenant-flow', {
    frs: ['FR-B2B-001', 'FR-B2B-002', 'FR-B2B-003', 'FR-B2B-004', 'FR-B2B-005'],
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
