#!/bin/bash
# Generate project information and statistics

set -e  # Exit immediately if a command exits with non-zero status

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_FILE="$PROJECT_ROOT/project_stats.md"

echo -e "${BLUE}Gathering project information...${NC}"

# Get version from package.json
VERSION=$(grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed -E 's/.*"version": "([^"]+)".*/\1/')

# Generate header
cat > "$OUTPUT_FILE" << EOF
# MT103 Electronic System - Project Information

**Version:** $VERSION
**Generated:** $(date)

## Project Statistics

EOF

# File counts by type
echo -e "${GREEN}Counting files by type...${NC}"
echo "### File Counts" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "| File Type | Count |" >> "$OUTPUT_FILE"
echo "|-----------|-------|" >> "$OUTPUT_FILE"
echo "| JavaScript | $(find "$PROJECT_ROOT" -name "*.js" | wc -l) |" >> "$OUTPUT_FILE"
echo "| TypeScript | $(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.tsx" | wc -l) |" >> "$OUTPUT_FILE"
echo "| Markdown | $(find "$PROJECT_ROOT" -name "*.md" | wc -l) |" >> "$OUTPUT_FILE"
echo "| YAML | $(find "$PROJECT_ROOT" -name "*.yml" -o -name "*.yaml" | wc -l) |" >> "$OUTPUT_FILE"
echo "| Shell Scripts | $(find "$PROJECT_ROOT" -name "*.sh" | wc -l) |" >> "$OUTPUT_FILE"
echo "| JSON | $(find "$PROJECT_ROOT" -name "*.json" | wc -l) |" >> "$OUTPUT_FILE"
echo "| Total | $(find "$PROJECT_ROOT" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l) |" >> "$OUTPUT_FILE"

# Code size
echo -e "${GREEN}Calculating code size...${NC}"
echo "" >> "$OUTPUT_FILE"
echo "### Code Size" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "| Language | Lines |" >> "$OUTPUT_FILE"
echo "|----------|-------|" >> "$OUTPUT_FILE"
echo "| JavaScript | $(find "$PROJECT_ROOT" -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*" -exec cat {} \; | wc -l) |" >> "$OUTPUT_FILE"
echo "| TypeScript | $(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.git/*" -exec cat {} \; | wc -l) |" >> "$OUTPUT_FILE"
echo "| Total | $(find "$PROJECT_ROOT" -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.git/*" -exec cat {} \; | wc -l) |" >> "$OUTPUT_FILE"

# Dependency information
echo -e "${GREEN}Analyzing dependencies...${NC}"
echo "" >> "$OUTPUT_FILE"
echo "### Dependencies" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "| Type | Count |" >> "$OUTPUT_FILE"
echo "|------|-------|" >> "$OUTPUT_FILE"
DEPS=$(grep -o '"dependencies":' "$PROJECT_ROOT/package.json" -A 100 | grep -v "devDependencies" | grep -o '"[^"]*":' | wc -l)
DEV_DEPS=$(grep -o '"devDependencies":' "$PROJECT_ROOT/package.json" -A 100 | grep -o '"[^"]*":' | wc -l)
echo "| Production | $DEPS |" >> "$OUTPUT_FILE"
echo "| Development | $DEV_DEPS |" >> "$OUTPUT_FILE"
echo "| Total | $((DEPS + DEV_DEPS)) |" >> "$OUTPUT_FILE"

# Test coverage information if available
if [ -f "$PROJECT_ROOT/coverage/coverage-summary.json" ]; then
    echo -e "${GREEN}Getting test coverage information...${NC}"
    echo "" >> "$OUTPUT_FILE"
    echo "### Test Coverage" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    COVERAGE=$(grep -o '"total":.*"lines":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' "$PROJECT_ROOT/coverage/coverage-summary.json" | grep -o '"pct":[0-9.]*' | grep -o '[0-9.]*')
    echo "Test coverage: $COVERAGE%" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

echo -e "${YELLOW}Project information compiled to $OUTPUT_FILE${NC}"
echo "✅ Done"
