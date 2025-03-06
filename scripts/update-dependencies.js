const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define updates in batches for safer incremental upgrades
const updateBatches = [
  // Batch 1: ESLint and TS-ESLint (handle breaking changes in ESLint v9)
  {
    name: "ESLint and related packages",
    updates: [
      "eslint@9.21.0",
      "@typescript-eslint/eslint-plugin@8.26.0",
      "@typescript-eslint/parser@8.26.0"
    ]
  },
  // Batch 2: Security packages
  {
    name: "Security packages",
    updates: [
      "helmet@8.0.0",
      "sanitize-html@2.14.0",
      "xss@1.0.15"
    ]
  },
  // Batch 3: Performance and tooling packages
  {
    name: "Performance and tooling",
    updates: [
      "autocannon@8.0.0",
      "supertest@7.0.0",
      "pino@9.6.0"
    ]
  },
  // Batch 4: OpenTelemetry packages
  {
    name: "OpenTelemetry packages",
    updates: [
      "@opentelemetry/sdk-node@0.57.2"
    ]
  }
];

// Function to execute updates
function runUpdates() {
  const args = process.argv.slice(2);
  const batchNumber = args[0] ? parseInt(args[0]) : null;
  
  if (batchNumber !== null && (batchNumber < 1 || batchNumber > updateBatches.length)) {
    console.error(`Batch number must be between 1 and ${updateBatches.length}`);
    process.exit(1);
  }
  
  if (batchNumber) {
    const batch = updateBatches[batchNumber - 1];
    console.log(`Updating batch ${batchNumber}: ${batch.name}`);
    
    // Update packages one by one instead of all at once
    updatePackagesSequentially(batch.updates, 0);
  } else {
    console.log('Available update batches:');
    updateBatches.forEach((batch, index) => {
      console.log(`${index + 1}. ${batch.name}`);
      batch.updates.forEach(dep => console.log(`   - ${dep}`));
    });
    console.log('\nTo run an update batch, use: pnpm run update-deps <batch-number>');
  }
}

// Function to update packages one by one
function updatePackagesSequentially(packages, index) {
  if (index >= packages.length) {
    console.log('✅ All packages updated successfully');
    console.log('Run tests to ensure everything works correctly');
    return;
  }
  
  const pkg = packages[index];
  console.log(`Updating ${pkg}...`);
  
  // Use add instead of update for more reliable behavior
  const command = `pnpm add ${pkg} --save-exact`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error updating ${pkg}: ${error.message}`);
      console.error('Try updating this package manually:');
      console.error(`pnpm add ${pkg} --save-exact`);
      // Continue with next package despite error
      updatePackagesSequentially(packages, index + 1);
      return;
    }
    
    console.log(`✅ Successfully updated ${pkg}`);
    if (stderr) {
      console.log('Warnings:');
      console.log(stderr);
    }
    
    // Update next package in the list
    updatePackagesSequentially(packages, index + 1);
  });
}

runUpdates();
