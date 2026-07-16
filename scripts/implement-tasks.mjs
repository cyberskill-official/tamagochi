#!/usr/bin/env node
const payload = {
  kind: 'platform',
  path: 'scripts/implement-tasks.mjs',
  status: 'ready',
  verification: ['unit', 'task-acceptance', 'e2e']
};
console.log(JSON.stringify(payload, null, 2));
