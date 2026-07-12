const STORAGE_KEY = 'tamagochi-original-loop-save-v1';
const LEGACY_STORAGE_KEY = 'tamagochi-playable-save-v1';
const GAME_MINUTE_MS = 4000;
const MAX_CATCHUP_MINUTES = 240;
const HEART_MAX = 4;

const actions = [
  { id: 'meal', label: 'Meal' },
  { id: 'snack', label: 'Snack' },
  { id: 'game', label: 'Game' },
  { id: 'toilet', label: 'Toilet' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'lights', label: 'Lights' },
  { id: 'discipline', label: 'Discipline' }
];

const stagePlan = [
  { stage: 'child', at: 32, form: 'Marutchi', baseWeight: 10 },
  { stage: 'teen', at: 92, form: 'Teenchi', baseWeight: 20 },
  { stage: 'adult', at: 180, form: null, baseWeight: 30 }
];

const adultForms = [
  { maxScore: 1, name: 'Bright Adult', face: 'v' },
  { maxScore: 3, name: 'Steady Adult', face: 'u' },
  { maxScore: 5, name: 'Cheerful Adult', face: 'w' },
  { maxScore: 7, name: 'Snacky Adult', face: 'o' },
  { maxScore: 9, name: 'Sleepy Adult', face: '-' },
  { maxScore: 11, name: 'Wild Adult', face: '~' },
  { maxScore: Infinity, name: 'Fragile Adult', face: '_' }
];

const $ = (id) => document.getElementById(id);

let state = load();

function freshState(now = Date.now()) {
  return {
    selectedAction: 'meal',
    gameRound: null,
    statusMessage: 'The egg is warming under the clock.',
    log: ['10:00 Egg loaded. It will hatch soon.'],
    pet: {
      stage: 'egg',
      form: 'Egg',
      ageMinutes: 0,
      baseWeight: 1,
      weight: 1,
      hunger: HEART_MAX,
      happy: HEART_MAX,
      discipline: 0,
      careMistakes: 0,
      disciplineMistakes: 0,
      messes: 0,
      lastMessAt: null,
      sick: false,
      sickSince: null,
      medicineLeft: 0,
      asleep: false,
      lightsOff: false,
      attention: null,
      attentionCooldownUntil: 0,
      snackDebt: 0,
      gamesPlayed: 0,
      gameWins: 0,
      departed: false,
      lastTickAt: now
    }
  };
}

function load() {
  const base = freshState();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!parsed?.pet) return base;
    return {
      ...base,
      ...parsed,
      pet: { ...base.pet, ...parsed.pet },
      log: Array.isArray(parsed.log) ? parsed.log.slice(0, 90) : base.log
    };
  } catch {
    return base;
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetSave() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  state = freshState();
  save();
  render();
}

function pushLog(message) {
  state.statusMessage = message;
  state.log.unshift(`${formatClock(state.pet)} ${message}`);
  state.log = state.log.slice(0, 90);
}

function clampHeart(value) {
  return Math.max(0, Math.min(HEART_MAX, Math.round(value)));
}

function dayHour(ageMinutes) {
  return (10 + Math.floor((ageMinutes % 96) / 4)) % 24;
}

function formatClock(pet) {
  const hour = dayHour(pet.ageMinutes);
  const quarter = pet.ageMinutes % 4;
  return `${String(hour).padStart(2, '0')}:${String(quarter * 15).padStart(2, '0')}`;
}

function isSleepTime(pet) {
  const hour = dayHour(pet.ageMinutes);
  return hour >= 21 || hour < 7;
}

function ageYears(pet) {
  return Math.max(0, Math.floor(pet.ageMinutes / 48));
}

function heartBar(value) {
  return `[${'#'.repeat(value)}${'.'.repeat(HEART_MAX - value)}]`;
}

function hungerInterval(pet) {
  if (pet.stage === 'baby') return 6;
  if (pet.stage === 'child') return 8;
  if (pet.stage === 'teen') return 10;
  return 12;
}

function happyInterval(pet) {
  if (pet.stage === 'baby') return 8;
  if (pet.stage === 'child') return 10;
  if (pet.stage === 'teen') return 12;
  return 14;
}

function clearAttention(...kinds) {
  const pet = state.pet;
  if (pet.attention && kinds.includes(pet.attention.kind)) {
    pet.attention = null;
    pet.attentionCooldownUntil = pet.ageMinutes + 2;
    return true;
  }
  return false;
}

function callFor(kind, message, dueIn = 12, events = []) {
  const pet = state.pet;
  if (pet.attention || pet.ageMinutes < pet.attentionCooldownUntil) return;
  pet.attention = {
    kind,
    message,
    startedAt: pet.ageMinutes,
    deadline: pet.ageMinutes + dueIn
  };
  events.push(message);
}

function makeSick(reason, events = null) {
  const pet = state.pet;
  if (pet.sick || pet.departed) return;
  pet.sick = true;
  pet.sickSince = pet.ageMinutes;
  pet.medicineLeft = Math.min(3, 1 + Math.floor((pet.careMistakes + pet.snackDebt) / 3));
  const message = `${reason} Medicine needed ${pet.medicineLeft} time${pet.medicineLeft === 1 ? '' : 's'}.`;
  if (events) events.push(message);
  else pushLog(message);
}

function hatch(events) {
  const pet = state.pet;
  pet.stage = 'baby';
  pet.form = 'Babytchi';
  pet.baseWeight = 5;
  pet.weight = 5;
  pet.hunger = HEART_MAX;
  pet.happy = HEART_MAX;
  pet.lightsOff = false;
  events.push('The egg hatched. Hunger and happy hearts now matter.');
}

function adultFor(pet) {
  const weightPenalty = Math.max(0, pet.weight - pet.baseWeight - 8);
  const score = (pet.careMistakes * 2)
    + pet.disciplineMistakes
    + Math.floor(weightPenalty / 3)
    + Math.max(0, pet.snackDebt - 2)
    + Math.max(0, 3 - pet.discipline);
  return adultForms.find((form) => score <= form.maxScore) ?? adultForms.at(-1);
}

function updateEvolution(events) {
  const pet = state.pet;
  if (pet.stage === 'egg' || pet.stage === 'adult' || pet.departed) return;
  const next = stagePlan.findLast((rule) => pet.ageMinutes >= rule.at);
  if (!next || next.stage === pet.stage) return;

  pet.stage = next.stage;
  pet.baseWeight = next.baseWeight;
  pet.weight = Math.max(pet.weight, next.baseWeight);

  if (next.stage === 'adult') {
    const adult = adultFor(pet);
    pet.form = adult.name;
    events.push(`Evolution: care history produced ${adult.name}.`);
  } else {
    pet.form = next.form;
    events.push(`Evolution: ${pet.form} reached the ${next.stage} stage.`);
  }
}

function depart(events) {
  const pet = state.pet;
  pet.departed = true;
  pet.stage = 'departed';
  pet.form = 'Departed';
  pet.attention = null;
  state.gameRound = null;
  events.push('Neglect caught up. Start a new egg to raise another pet.');
}

function checkMissedAttention(events) {
  const pet = state.pet;
  if (!pet.attention || pet.ageMinutes <= pet.attention.deadline) return;

  if (pet.attention.kind === 'discipline') {
    pet.disciplineMistakes += 1;
    events.push('A discipline call was missed.');
  } else {
    pet.careMistakes += 1;
    events.push(`${pet.attention.kind} call missed. Care mistake recorded.`);
  }

  pet.attention = null;
  pet.attentionCooldownUntil = pet.ageMinutes + 8;
}

function updateSleep(events) {
  const pet = state.pet;
  const shouldSleep = isSleepTime(pet);

  if (shouldSleep && !pet.asleep) {
    pet.asleep = true;
    events.push('It fell asleep.');
  }

  if (!shouldSleep && pet.asleep) {
    pet.asleep = false;
    pet.lightsOff = false;
    if (pet.attention?.kind === 'sleep') pet.attention = null;
    events.push('It woke up.');
  }

  if (pet.asleep && !pet.lightsOff) {
    callFor('sleep', 'It is sleeping with the lights on.', 8, events);
  }
}

function simulateMinute(events) {
  const pet = state.pet;
  if (pet.departed) return;

  pet.ageMinutes += 1;

  if (pet.stage === 'egg') {
    if (pet.ageMinutes >= 3) hatch(events);
    return;
  }

  updateSleep(events);
  checkMissedAttention(events);
  if (pet.departed) return;

  if (!pet.asleep) {
    if (pet.ageMinutes % hungerInterval(pet) === 0) {
      pet.hunger = clampHeart(pet.hunger - 1);
    }

    if (pet.ageMinutes % happyInterval(pet) === 0) {
      pet.happy = clampHeart(pet.happy - 1);
    }

    if (pet.ageMinutes % 24 === 0) {
      pet.messes = Math.min(3, pet.messes + 1);
      pet.lastMessAt = pet.lastMessAt ?? pet.ageMinutes;
      events.push('Bathroom mess appeared.');
    }

    if (
      pet.ageMinutes % 38 === 0
      && pet.discipline < HEART_MAX
      && pet.hunger > 0
      && pet.happy > 0
      && pet.messes === 0
      && !pet.sick
    ) {
      callFor('discipline', 'It called while fed and happy. Discipline is expected.', 10, events);
    }
  }

  if (pet.messes >= 2 && pet.lastMessAt && pet.ageMinutes - pet.lastMessAt >= 14) {
    makeSick('Mess stayed too long.', events);
  }

  if (pet.sick && pet.sickSince && pet.ageMinutes - pet.sickSince >= 32 && pet.ageMinutes % 16 === 0) {
    pet.careMistakes += 1;
    events.push('Sickness lingered and counted as a care mistake.');
  }

  if (pet.hunger === 0) {
    callFor('hunger', 'Hunger is empty. Feed a meal before the call expires.', 12, events);
  } else if (pet.happy === 0) {
    callFor('happy', 'Happy is empty. Win a game or give a snack.', 12, events);
  } else if (pet.messes > 0 && pet.lastMessAt && pet.ageMinutes - pet.lastMessAt >= 6) {
    callFor('mess', 'Bathroom cleanup is waiting.', 12, events);
  } else if (pet.sick) {
    callFor('sick', 'A skull icon appeared. Medicine is needed.', 12, events);
  }

  updateEvolution(events);

  if (pet.careMistakes >= 10 || (pet.sick && pet.careMistakes >= 7)) {
    depart(events);
  }
}

function advanceTime(now = Date.now()) {
  const pet = state.pet;
  const elapsed = Math.floor((now - pet.lastTickAt) / GAME_MINUTE_MS);
  if (elapsed <= 0) return;

  const events = [];
  const catchup = Math.min(elapsed, MAX_CATCHUP_MINUTES);
  for (let minute = 0; minute < catchup; minute += 1) {
    simulateMinute(events);
  }

  pet.lastTickAt = elapsed > MAX_CATCHUP_MINUTES ? now : pet.lastTickAt + (catchup * GAME_MINUTE_MS);
  events.slice(-8).forEach((event) => pushLog(event));
  save();
}

function canUseCare(action) {
  const pet = state.pet;
  if (pet.stage === 'egg') {
    pushLog('The egg is still hatching.');
    return false;
  }
  if (pet.departed) {
    pushLog('This pet has departed. Start a new egg.');
    return false;
  }
  if (pet.asleep && !['lights', 'medicine', 'toilet'].includes(action)) {
    pushLog('It is asleep and ignores that care icon.');
    return false;
  }
  return true;
}

function feedMeal() {
  const pet = state.pet;
  if (pet.attention?.kind === 'discipline') {
    pushLog('It refuses the meal because this is a discipline call.');
    return;
  }
  if (pet.hunger >= HEART_MAX) {
    pushLog('Meal refused. Hunger is already full.');
    return;
  }
  pet.hunger = clampHeart(pet.hunger + 1);
  pet.weight += 1;
  clearAttention('hunger');
  pushLog('Meal eaten. Hunger rose and weight went up.');
}

function feedSnack() {
  const pet = state.pet;
  if (pet.attention?.kind === 'discipline') {
    pushLog('It refuses the snack because this is a discipline call.');
    return;
  }
  if (pet.happy >= HEART_MAX) {
    pushLog('Snack refused. Happy hearts are already full.');
    return;
  }
  pet.happy = clampHeart(pet.happy + 1);
  pet.weight += 2;
  pet.snackDebt += 1;
  clearAttention('happy');
  pushLog('Snack eaten. Happy rose, but weight rose faster.');
  if (pet.snackDebt >= 4 || pet.weight > pet.baseWeight + 14) {
    makeSick('Too many snacks made it unhealthy.');
  }
}

function startGame() {
  const pet = state.pet;
  if (pet.attention?.kind === 'discipline') {
    pushLog('It refuses to play because this is a discipline call.');
    return;
  }
  if (pet.sick) {
    pushLog('It is too sick to play.');
    return;
  }
  state.gameRound = { startedAt: pet.ageMinutes };
  pushLog('Character Game started. Guess left or right.');
}

function resolveGame(direction) {
  advanceTime();
  const pet = state.pet;
  if (!state.gameRound || pet.departed) return;

  const result = Math.random() < 0.5 ? 'left' : 'right';
  const won = direction === result;
  pet.gamesPlayed += 1;

  if (won) {
    pet.gameWins += 1;
    pet.happy = clampHeart(pet.happy + 1);
    pet.weight = Math.max(pet.baseWeight, pet.weight - 2);
    pet.snackDebt = Math.max(0, pet.snackDebt - 2);
    clearAttention('happy');
    pushLog(`Correct. It moved ${result}. Happy rose and weight dropped.`);
  } else {
    pet.happy = clampHeart(pet.happy - 1);
    pushLog(`Wrong. It moved ${result}. Happy dropped.`);
  }

  state.gameRound = null;
  save();
  render();
}

function cleanToilet() {
  const pet = state.pet;
  if (pet.messes === 0) {
    pushLog('No bathroom mess to flush.');
    return;
  }
  pet.messes = 0;
  pet.lastMessAt = null;
  clearAttention('mess');
  pushLog('Bathroom mess flushed.');
}

function giveMedicine() {
  const pet = state.pet;
  if (!pet.sick) {
    pushLog('No skull icon. Medicine is not needed.');
    return;
  }
  pet.medicineLeft -= 1;
  if (pet.medicineLeft <= 0) {
    pet.sick = false;
    pet.sickSince = null;
    pet.medicineLeft = 0;
    clearAttention('sick');
    pushLog('Medicine worked. Sickness cleared.');
  } else {
    pushLog(`Medicine dose given. ${pet.medicineLeft} more needed.`);
  }
}

function toggleLights() {
  const pet = state.pet;
  pet.lightsOff = !pet.lightsOff;
  if (pet.asleep && pet.lightsOff) {
    clearAttention('sleep');
    pushLog('Lights off while sleeping. Good care.');
    return;
  }
  if (!pet.asleep && pet.lightsOff) {
    pet.happy = clampHeart(pet.happy - 1);
    pushLog('Lights off while awake. It grumbled.');
    return;
  }
  pushLog('Lights on.');
}

function discipline() {
  const pet = state.pet;
  if (pet.attention?.kind === 'discipline') {
    pet.discipline = clampHeart(pet.discipline + 1);
    clearAttention('discipline');
    pushLog('Correct discipline. Discipline meter rose.');
    return;
  }
  if (pet.attention) {
    pet.happy = clampHeart(pet.happy - 1);
    pet.disciplineMistakes += 1;
    pushLog(`Wrong response. The active call is ${pet.attention.kind}.`);
    return;
  }
  pet.happy = clampHeart(pet.happy - 1);
  pushLog('No discipline call was active. Happy dropped.');
}

function performAction(action) {
  advanceTime();
  state.selectedAction = action;
  if (!canUseCare(action)) {
    save();
    render();
    return;
  }

  if (action === 'meal') feedMeal();
  if (action === 'snack') feedSnack();
  if (action === 'game') startGame();
  if (action === 'toilet') cleanToilet();
  if (action === 'medicine') giveMedicine();
  if (action === 'lights') toggleLights();
  if (action === 'discipline') discipline();

  save();
  render();
}

function cycleAction() {
  const index = actions.findIndex((action) => action.id === state.selectedAction);
  const next = actions[(index + 1 + actions.length) % actions.length];
  state.selectedAction = next.id;
  state.statusMessage = `${next.label} icon selected.`;
  save();
  render();
}

function showStatus() {
  const pet = state.pet;
  const activeCall = pet.attention ? `Call: ${pet.attention.kind}` : 'No active call';
  state.statusMessage = `${activeCall}. Games ${pet.gameWins}/${pet.gamesPlayed}. Snacks ${pet.snackDebt}.`;
  save();
  render();
}

function faceFor(pet) {
  if (pet.departed) return 'x';
  if (pet.stage === 'egg') return '--';
  if (pet.asleep) return 'z';
  if (pet.sick) return '!';
  if (pet.hunger === 0 || pet.happy === 0) return '_';
  if (pet.stage === 'adult') return adultForms.find((form) => form.name === pet.form)?.face ?? 'v';
  if (pet.stage === 'teen') return 'o';
  if (pet.stage === 'child') return 'u';
  return 'w';
}

function stageLine(pet) {
  if (pet.departed) return 'Care ended.';
  if (pet.stage === 'egg') return 'The egg will hatch soon.';
  const sleep = pet.asleep ? 'asleep' : 'awake';
  const health = pet.sick ? 'sick' : pet.messes > 0 ? 'messy' : 'healthy';
  return `${pet.stage} / ${sleep} / ${health}`;
}

function progression(pet) {
  const level = Math.min(99, 1 + Math.floor(pet.ageMinutes / 48) + Math.floor(pet.gameWins / 3));
  const exp = pet.departed ? 0 : Math.floor(((pet.ageMinutes % 48) / 48) * 70) + Math.min(29, pet.gameWins * 7);
  const coins = (pet.gameWins * 12) + (pet.gamesPlayed * 2) + (ageYears(pet) * 5);
  const mapX = Math.min(160, 28 + Math.floor((exp / 100) * 132));
  return { level, exp: Math.min(99, exp), coins, mapX };
}

function activeQuest(pet) {
  if (pet.departed) {
    return {
      title: 'Raise a new egg',
      progress: 'Press New egg to restart the grove run.'
    };
  }

  if (pet.stage === 'egg') {
    return {
      title: 'Warm the egg',
      progress: `${Math.max(0, 3 - pet.ageMinutes)} game min until hatch.`
    };
  }

  if (pet.sick) {
    return {
      title: 'Cure the skull',
      progress: `${pet.medicineLeft} medicine dose${pet.medicineLeft === 1 ? '' : 's'} left.`
    };
  }

  if (pet.messes > 0) {
    return {
      title: 'Clean the path',
      progress: `${pet.messes} bathroom mess${pet.messes === 1 ? '' : 'es'} waiting.`
    };
  }

  if (pet.hunger === 0) {
    return {
      title: 'Cook a meal',
      progress: 'Fill hunger before the call expires.'
    };
  }

  if (pet.happy === 0) {
    return {
      title: 'Win a game',
      progress: 'Play a left/right round for happy hearts.'
    };
  }

  if (pet.asleep) {
    return {
      title: 'Moon care',
      progress: pet.lightsOff ? 'Lights are off. Nice sleepy care.' : 'Turn lights off while it sleeps.'
    };
  }

  return {
    title: pet.stage === 'adult' ? 'Keep the grove shining' : 'Grow Mochi',
    progress: `Level up with care, games, and clean paths.`
  };
}

function render() {
  const pet = state.pet;
  const selected = state.selectedAction;
  const lcd = $('lcd');
  const progress = progression(pet);
  const quest = activeQuest(pet);

  lcd.dataset.stage = pet.stage;
  lcd.dataset.sick = String(pet.sick);
  lcd.dataset.asleep = String(pet.asleep);
  lcd.dataset.messes = String(pet.messes > 0);

  $('attention-light').classList.toggle('is-on', Boolean(pet.attention));
  $('clock-label').textContent = formatClock(pet);
  $('lights-label').textContent = pet.lightsOff ? 'LIGHTS OFF' : 'LIGHTS ON';
  $('pet-face').textContent = faceFor(pet);
  $('pet-name').textContent = pet.form;
  $('pet-stage').textContent = stageLine(pet);
  $('status-note').textContent = pet.attention?.message ?? state.statusMessage;
  $('hunger-hearts').textContent = heartBar(pet.hunger);
  $('happy-hearts').textContent = heartBar(pet.happy);
  $('discipline-pips').textContent = heartBar(pet.discipline);
  $('age-label').textContent = `${ageYears(pet)} yr`;
  $('weight-label').textContent = `${pet.weight} lb`;
  $('mistake-label').textContent = `${pet.careMistakes} care / ${pet.disciplineMistakes} disc`;
  $('mess-mark').textContent = pet.messes > 1 ? `POO x${pet.messes}` : 'POO';
  $('sick-mark').textContent = pet.medicineLeft > 1 ? `MED x${pet.medicineLeft}` : 'MED';
  $('game-status').textContent = state.gameRound
    ? 'Which way will it move next?'
    : `Games won ${pet.gameWins}/${pet.gamesPlayed}.`;
  $('guess-left').disabled = !state.gameRound;
  $('guess-right').disabled = !state.gameRound;
  $('game-log').textContent = state.log.join('\n');
  $('hud-level').textContent = String(progress.level);
  $('hud-exp').textContent = `${progress.exp}%`;
  $('coin-label').textContent = String(progress.coins);
  $('minimap-time').textContent = formatClock(pet);
  $('quest-title').textContent = quest.title;
  $('quest-progress').textContent = quest.progress;
  document.documentElement.style.setProperty('--map-player-x', `${progress.mapX}px`);

  document.querySelectorAll('[data-icon]').forEach((icon) => {
    icon.classList.toggle('is-selected', icon.dataset.icon === selected);
  });

  document.querySelectorAll('.care-button').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.action === selected);
  });
}

document.querySelectorAll('.care-button').forEach((button) => {
  button.addEventListener('click', () => performAction(button.dataset.action));
});

$('button-a').addEventListener('click', cycleAction);
$('button-b').addEventListener('click', () => performAction(state.selectedAction));
$('button-c').addEventListener('click', showStatus);
$('guess-left').addEventListener('click', () => resolveGame('left'));
$('guess-right').addEventListener('click', () => resolveGame('right'));
$('reset-save').addEventListener('click', resetSave);

advanceTime();
render();

window.setInterval(() => {
  advanceTime();
  render();
}, 1000);
