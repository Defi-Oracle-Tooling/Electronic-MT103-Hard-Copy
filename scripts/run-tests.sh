#!/bin/bash
# Comprehensive test runner for MT103 project

set -e  # Exit immediately if a command exits with non-zero status

MODE="${1:-all}"  # Default to "all" if no mode specified
REPORT_DIR="./test-reports"

# Print colored output
function print_header() {
    echo -e "\n\033[1;34m==== $1 ====\033[0m\n"
}

function print_success() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

function print_failure() {
    echo -e "\033[1;31m✗ $1\033[0m"
}

# Create reports directory
mkdir -p "$REPORT_DIR"

# Run unit tests
function run_unit_tests() {
    print_header "Running Unit Tests"
    pnpm test -- --testPathIgnorePatterns=performance --testPathIgnorePatterns=e2e
    if [ $? -eq 0 ]; then
        print_success "Unit tests passed"
    else
        print_failure "Unit tests failed"
        if [ "$MODE" == "ci" ]; then exit 1; fi
    fi
}

# Run performance tests
function run_performance_tests() {
    print_header "Running Performance Tests"
    pnpm test:load
    if [ $? -eq 0 ]; then
        print_success "Performance tests passed"
    else 
        print_failure "Performance tests did not meet thresholds"
        # Don't fail the build on performance tests when running in CI mode
    fi
}

# Run security tests
function run_security_tests() {
    print_header "Running Security Tests"
    pnpm test:security
    print_header "Running Security Audit"
    pnpm audit:security || echo "Security vulnerabilities found - review report"
}

# Run E2E tests
function run_e2e_tests() {
    print_header "Running End-to-End Tests"
    pnpm test:e2e
    if [ $? -eq 0 ]; then
        print_success "E2E tests passed"
    else
        print_failure "E2E tests failed"
        if [ "$MODE" == "ci" ]; then exit 1; fi
    fi
}

# Run linting and formatting checks
function run_lint_checks() {
    print_header "Running Lint Checks"
    pnpm lint
    if [ $? -eq 0 ]; then
        print_success "Lint checks passed"
    else
        print_failure "Lint checks failed"
        if [ "$MODE" == "ci" ]; then exit 1; fi
    fi
}

# Main execution
case "$MODE" in
    "unit")
        run_unit_tests
        ;;
    "performance")
        run_performance_tests
        ;;
    "security")
        run_security_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "lint")
        run_lint_checks
        ;;
    "ci")
        run_lint_checks
        run_unit_tests
        run_security_tests
        run_e2e_tests
        ;;
    *)
        run_lint_checks
        run_unit_tests
        run_security_tests
        run_performance_tests
        run_e2e_tests
        print_header "All tests completed"
        ;;
esac
