#!/usr/bin/env node
const payload = {
  kind: 'platform',
  path: 'eslint-rules/no-real-money-random-pull.cjs',
  status: 'ready',
  verification: ['unit', 'fr-acceptance', 'e2e']
};
console.log(JSON.stringify(payload, null, 2));
