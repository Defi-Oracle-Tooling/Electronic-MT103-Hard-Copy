#!/bin/bash

# Remove old test files
find tests -type f -name "*.spec.js" -delete
find tests -type f -name "*.test.js" -delete

# Remove unused configuration files
rm -f .babelrc
rm -f .eslintrc
rm -f webpack.config.js
rm -f tsconfig.prod.json

# Remove empty directories
find . -type d -empty -delete

# Remove old build artifacts
rm -rf dist/*
rm -rf coverage/*
rm -rf .nyc_output/*

# Clean node_modules and reinstall
rm -rf node_modules
rm -rf .pnpm-store
pnpm install --force
