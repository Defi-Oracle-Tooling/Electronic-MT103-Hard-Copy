#!/bin/bash
# Advanced security scanning script for MT103 system

set -e  # Exit immediately if a command exits with non-zero status

REPORT_DIR="./security-reports"
NOW=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="$REPORT_DIR/security-scan-$NOW.md"
THRESHOLD="${1:-high}"  # Default to high if not specified

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report file
cat > "$REPORT_FILE" << EOF
# MT103 Security Scan Report
Date: $(date)
Version: $(grep '"version"' package.json | head -1 | sed -E 's/.*"version": "([^"]+)".*/\1/')
Severity Threshold: $THRESHOLD

## Security Scan Results

EOF

# Function to run security checks and report
function run_check() {
    local check_name="$1"
    local check_command="$2"
    local is_critical="${3:-false}"
    
    echo "Running security check: $check_name"
    echo "### $check_name" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "\`\`\`" >> "$REPORT_FILE"
    local result
    result=$(eval "$check_command" 2>&1) || true
    local exit_code=$?
    echo "$result" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ PASS: $check_name"
        echo "**Result: PASS**" >> "$REPORT_FILE"
    else
        if [ "$is_critical" = "true" ]; then
            echo "❌ FAIL: $check_name (Critical)"
            echo "**Result: FAIL (Critical)**" >> "$REPORT_FILE"
        else
            echo "⚠️ WARN: $check_name"
            echo "**Result: WARN**" >> "$REPORT_FILE"
        fi
    fi
    
    echo "" >> "$REPORT_FILE"
    return $exit_code
}

# Dependency security checks
run_check "NPM Audit" "npm audit --audit-level=$THRESHOLD" "true"

# Check for sensitive information in code
run_check "Secret Detection" "grep -r --include='*.{js,ts,jsx,tsx,json,yml,yaml}' -E '(password|secret|key|token|auth).*[=:].*[\"\\'\\`][^\"\\'\\`]{8,}[\"\\'\\`]' --exclude-dir={node_modules,dist,.git,coverage} ." "true"

# OWASP dependency check (if installed)
if command -v dependency-check > /dev/null; then
    run_check "OWASP Dependency Check" "dependency-check --project MT103 --scan . --exclude node_modules --exclude .git --out $REPORT_DIR/dependency-check" "true"
fi

# Security-focused ESLint (if config exists)
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
    run_check "ESLint Security Rules" "npx eslint --no-eslintrc -c .eslintrc.js --plugin security --ext .js,.ts ."
fi

# Run security-focused tests
run_check "Security Tests" "npx jest tests/security/ --silent" "true"

# TLS configuration validation
run_check "TLS Configuration" "scripts/check-tls-config.js" "true"

# JWT validation check
run_check "JWT Implementation" "scripts/check-jwt-config.js"

# Content Security Policy check
run_check "Content Security Policy" "scripts/check-csp.js"

# Security headers check
run_check "Security Headers" "scripts/check-security-headers.js"

# Generate summary
TOTAL_CHECKS=$(grep -c "Result:" "$REPORT_FILE")
PASSED_CHECKS=$(grep -c "Result: PASS" "$REPORT_FILE")
FAILED_CRITICAL=$(grep -c "Result: FAIL (Critical)" "$REPORT_FILE")
WARNINGS=$(grep -c "Result: WARN" "$REPORT_FILE")
SECURITY_SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

cat >> "$REPORT_FILE" << EOF
## Summary

- Total Checks: $TOTAL_CHECKS
- Passed: $PASSED_CHECKS
- Failed (Critical): $FAILED_CRITICAL
- Warnings: $WARNINGS
- Security Score: $SECURITY_SCORE%

EOF

# Add security score badge
if [ $SECURITY_SCORE -ge 90 ]; then
    echo "![Security](https://img.shields.io/badge/Security-$SECURITY_SCORE%25-success)" >> "$REPORT_FILE"
elif [ $SECURITY_SCORE -ge 75 ]; then
    echo "![Security](https://img.shields.io/badge/Security-$SECURITY_SCORE%25-yellow)" >> "$REPORT_FILE"
else
    echo "![Security](https://img.shields.io/badge/Security-$SECURITY_SCORE%25-critical)" >> "$REPORT_FILE"
fi

# Copy to latest report for easy reference
cp "$REPORT_FILE" "$REPORT_DIR/latest-security-report.md"

echo "Security scan completed. Report available at: $REPORT_FILE"

# Exit with proper status code based on critical findings
if [ $FAILED_CRITICAL -gt 0 ]; then
    echo "❌ Security scan failed with $FAILED_CRITICAL critical issues"
    exit 1
else
    echo "✅ Security scan passed with score $SECURITY_SCORE%"
    exit 0
fi
