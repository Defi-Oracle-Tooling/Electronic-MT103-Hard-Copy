const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐶 Setting up Husky...');

// Check if .husky directory exists
const huskyDir = path.join(__dirname, '..', '.husky');
if (!fs.existsSync(huskyDir)) {
  console.log('Creating .husky directory');
  fs.mkdirSync(huskyDir, { recursive: true });
}

try {
  // Initialize Husky with the new method
  execSync('npx husky init', { stdio: 'inherit' });

  // Create a pre-commit hook if it doesn't exist
  const preCommitPath = path.join(huskyDir, 'pre-commit');
  if (!fs.existsSync(preCommitPath)) {
    console.log('Creating pre-commit hook');
    fs.writeFileSync(preCommitPath, `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint && npm run test
`, { mode: 0o755 });
  }

  console.log('✅ Husky setup complete');
} catch (error) {
  console.error('❌ Error setting up Husky:', error);
  process.exit(1);
}
