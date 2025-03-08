#!/bin/bash
# Script for automating version updates and releases

set -e  # Exit immediately if a command exits with non-zero status

VERSION_TYPE="${1:-patch}"  # Default to patch if not specified
SKIP_TESTS="${2:-false}"    # Default to running tests

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch|premajor|preminor|prepatch|prerelease)$ ]]; then
    echo "Error: Version type must be one of: major, minor, patch, premajor, preminor, prepatch, prerelease"
    echo "Usage: $0 [version-type] [skip-tests]"
    exit 1
fi

echo "🚀 Preparing $VERSION_TYPE release..."

# Ensure we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: You're not on the main branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Release aborted."
        exit 1
    fi
fi

# Ensure the working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Working directory is not clean. Please commit or stash your changes first."
    exit 1
fi

# Pull the latest changes
echo "📥 Pulling latest changes from remote..."
git pull origin main

# Run tests if not skipped
if [ "$SKIP_TESTS" != "true" ]; then
    echo "🧪 Running tests..."
    ./scripts/run-tests.sh
    
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed. Release aborted."
        exit 1
    fi
fi

# Run compliance checks
echo "🔍 Running compliance checks..."
./scripts/compliance-check.sh

if [ $? -ne 0 ]; then
    echo "❌ Compliance checks failed. Release aborted."
    exit 1
fi

# Update version in package.json
echo "📝 Updating version..."
CURRENT_VERSION=$(grep '"version"' package.json | cut -d '"' -f4)
NEW_VERSION=$(npm --no-git-tag-version version $VERSION_TYPE | sed 's/v//')
echo "Updated version from $CURRENT_VERSION to $NEW_VERSION"

# Update version in other files
echo "🔄 Updating version references in other files..."
find ./docs -type f -name "*.md" -exec sed -i "s/Version: $CURRENT_VERSION/Version: $NEW_VERSION/g" {} \;
find ./src -type f -name "*.ts" -exec sed -i "s/version: '$CURRENT_VERSION'/version: '$NEW_VERSION'/g" {} \;
find ./src -type f -name "*.js" -exec sed -i "s/version: '$CURRENT_VERSION'/version: '$NEW_VERSION'/g" {} \;

# Generate changelog
echo "📋 Generating changelog..."
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10")
CHANGELOG_FILE="CHANGELOG.md"

# Create temporary changelog entry
TEMP_CHANGELOG=$(mktemp)
cat > "$TEMP_CHANGELOG" << EOF
# $NEW_VERSION ($(date +%Y-%m-%d))

## Changes

$(git log $PREV_TAG..HEAD --pretty=format:"* %s" --no-merges)

EOF

# Prepend the new entry to the CHANGELOG.md file
if [ -f "$CHANGELOG_FILE" ]; then
    cat "$CHANGELOG_FILE" >> "$TEMP_CHANGELOG"
fi
mv "$TEMP_CHANGELOG" "$CHANGELOG_FILE"

# Create a commit for the version update
echo "💾 Committing version update..."
git add package.json $CHANGELOG_FILE
git add $(git ls-files | grep -E '\.(md|ts|js)$')  # Add any modified files with version updates
git commit -m "Release v$NEW_VERSION"

# Create git tag
echo "🏷️ Creating git tag..."
git tag -a "v$NEW_VERSION" -m "Version $NEW_VERSION"

# Show a summary
echo "📋 Release Summary:"
echo "  Version: $NEW_VERSION"
echo "  Tag: v$NEW_VERSION"
echo "  Changelog: Updated in $CHANGELOG_FILE"

echo "✅ Release preparation completed!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git show HEAD"
echo "  2. Push the commit and tag: git push origin main && git push origin v$NEW_VERSION"
echo "  3. Create a release on GitHub with the changelog content"

exit 0
