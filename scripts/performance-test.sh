#!/bin/bash
# Performance testing script for MT103 system

set -e  # Exit immediately if a command exits with non-zero status

# Configuration
TEST_TYPE="${1:-all}"
TEST_DURATION="${2:-60}"  # Default duration in seconds
REPORT_DIR="./performance-reports"
NOW=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="$REPORT_DIR/performance-report-$NOW.md"
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report file
cat > "$REPORT_FILE" << EOF
# MT103 Performance Test Report
- **Date**: $(date)
- **Version**: $(grep '"version"' package.json | head -1 | sed -E 's/.*"version": "([^"]+)".*/\1/')
- **Test Type**: $TEST_TYPE
- **Duration**: $TEST_DURATION seconds
- **Base URL**: $BASE_URL

## Test Results

EOF

# Function to run a performance test
run_performance_test() {
    local test_name="$1"
    local test_endpoint="$2"
    local test_config="${3:-}"
    
    echo "Running performance test: $test_name"
    echo "### $test_name" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    local result
    if [ -z "$test_config" ]; then
        result=$(npx autocannon -d $TEST_DURATION "$BASE_URL$test_endpoint" 2>&1)
    else
        result=$(npx autocannon -d $TEST_DURATION "$BASE_URL$test_endpoint" \
          --method POST \
          --headers "Content-Type=application/json" \
          --body "$test_config" 2>&1)
    fi
    
    # Extract key metrics
    local requests=$(echo "$result" | grep "Req/Sec" -A 3 | tail -n 1)
    local latency=$(echo "$result" | grep "Latency" -A 3 | tail -n 1)
    local throughput=$(echo "$result" | grep "Throughput" -A 2 | tail -n 1)
    
    echo "```" >> "$REPORT_FILE"
    echo "Endpoint: $BASE_URL$test_endpoint" >> "$REPORT_FILE"
    echo "Requests/sec: $requests" >> "$REPORT_FILE"
    echo "Latency: $latency" >> "$REPORT_FILE"
    echo "Throughput: $throughput" >> "$REPORT_FILE"
    echo "```" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Run tests based on the test type
case "$TEST_TYPE" in
    all)
        run_performance_test "Test 1" "/api/test1"
        run_performance_test "Test 2" "/api/test2" '{"key":"value"}'
        ;;
    test1)
        run_performance_test "Test 1" "/api/test1"
        ;;
    test2)
        run_performance_test "Test 2" "/api/test2" '{"key":"value"}'
        ;;
    *)
        echo "Unknown test type: $TEST_TYPE"
        exit 1
        ;;
esac

echo "Performance testing completed. Report saved to $REPORT_FILE"