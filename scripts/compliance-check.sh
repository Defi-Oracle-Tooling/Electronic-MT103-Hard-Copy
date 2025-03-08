#!/bin/bash
# Compliance verification script

set -e  # Exit immediately if a command exits with non-zero status

echo "Running MT103 compliance verification..."

REPORT_DIR="./compliance-reports"
NOW=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="$REPORT_DIR/compliance-report-$NOW.md"

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report file
cat > "$REPORT_FILE" << EOF
# MT103 Compliance Report
Date: $(date)
Version: $(grep '"version"' package.json | cut -d '"' -f4)

## Compliance Check Results

EOF

# Function to run checks and append to report
function run_check() {
    local check_name="$1"
    local check_command="$2"
    
    echo "Running check: $check_name"
    echo "### $check_name" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local result
    result=$($check_command 2>&1) || true
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ PASS: $check_name" 
        echo "**Status: PASS**" >> "$REPORT_FILE"
    else
        echo "❌ FAIL: $check_name"
        echo "**Status: FAIL**" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "```" >> "$REPORT_FILE"
    echo "$result" >> "$REPORT_FILE"
    echo "```" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Example checks
run_check "Check 1: Example Check" "echo 'This is an example check.'"
run_check "Check 2: Another Example Check" "echo 'This is another example check.'"

# Actual compliance checks
run_check "Check 3: Validate JSON Schema" "jsonschema -i sample.json schema.json"
run_check "Check 4: Check for Required Fields" "jq 'has(\"field_name\")' sample.json"
run_check "Check 5: Validate Field Lengths" "jq 'if .field_name | length <= 10 then true else false end' sample.json"

echo "Compliance verification completed. Report saved to $REPORT_FILE"