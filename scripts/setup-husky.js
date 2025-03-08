const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createHook(name, content) {
  const hookPath = path.join(huskyDir, name);
  if (!fs.existsSync(hookPath)) {
    console.log(`Creating ${name} hook`);
    fs.writeFileSync(hookPath, content, { mode: 0o755 });
  }
}

console.log('🐶 Setting up Husky...');

const huskyDir = path.join(__dirname, '..', '.husky');
ensureDirectoryExists(huskyDir);

try {
  execSync('npx husky init', { stdio: 'inherit' });

  // Create pre-commit hook
  createHook('pre-commit', `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint && npm run test
`);

  // Create pre-push hook
  createHook('pre-push', `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run test:coverage && npm audit
`);

  // Create commit-msg hook
  createHook('commit-msg', `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "\${1}"
`);

  console.log('✅ Husky setup complete');
} catch (error) {
  console.error('❌ Error setting up Husky:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
