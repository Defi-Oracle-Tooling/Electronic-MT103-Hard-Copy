# Dependency Update Guide

This guide explains how to safely update the dependencies in this project to resolve warnings and use the latest package versions.

## Progress So Far

✅ Fixed OpenTelemetry Peer Dependencies:
- Updated @opentelemetry/api to version 1.4.1
- Added proper resolutions and overrides in package.json
- Added .npmrc configuration to handle peer dependency warnings

✅ Fixed Husky Deprecation Warning:
- Updated Husky configuration to follow the v9 installation method
- Removed deprecated `prepare` script with `husky install`
- Added proper setup script for Husky

✅ Fixed TypeScript/Babel Configuration:
- Added proper Babel configuration for TypeScript support
- Updated Jest configuration for TypeScript and React
- Added missing development dependencies for TypeScript support

## Husky Setup

Husky v9 has changed its installation method. To properly set it up:

```bash
# Install dependencies which will trigger the postinstall script
pnpm install

# Or manually run the setup script
pnpm run setup-husky
```

## Next Steps: Incremental Updates

We've created a script to help update dependencies in controlled batches to minimize risk of breaking changes:

```bash
# List all available update batches
pnpm run update-deps

# Update a specific batch (example: updating ESLint)
pnpm run update-deps 1
```

## Update Batches

1. **ESLint and TypeScript ESLint**: Updates eslint to v9 and related packages
2. **Security Packages**: Updates helmet and other security-related packages
3. **Performance and Tooling**: Updates packages like autocannon, supertest, and pino
4. **OpenTelemetry**: Updates @opentelemetry/sdk-node to latest compatible version

## After Each Update

After applying each update batch:

1. Run tests to ensure everything works:
   ```bash
   pnpm test
   ```

2. Fix any breaking changes that may have been introduced

3. Commit your changes before proceeding to the next batch

## Handling Major Version Upgrades

For major version upgrades (particularly ESLint v9), check the project's migration guides:

- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [TypeScript ESLint v8 Migration Guide](https://typescript-eslint.io/linting/configs/)

## Manual Update Option

If you prefer to handle updates manually:

```bash
# Update all dependencies within current major version
pnpm update

# Update specific package to specific version
pnpm update [package]@[version]
```
