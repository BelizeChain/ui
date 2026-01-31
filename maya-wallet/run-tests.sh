#!/bin/bash
# BelizeChain Maya Wallet - Automated Test Runner
# Starts services, runs tests, and generates reports

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  BelizeChain Maya Wallet Test Runner  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ ! -z "$UI_PID" ]; then
        echo "Stopping UI server (PID: $UI_PID)"
        kill $UI_PID 2>/dev/null || true
    fi
    if [ ! -z "$BLOCKCHAIN_PID" ]; then
        echo "Stopping blockchain node (PID: $BLOCKCHAIN_PID)"
        kill $BLOCKCHAIN_PID 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

# Parse command line arguments
TEST_PATTERN="${1:-}"
WORKERS="${2:-2}"
HEADED="${3:-false}"

# Check if blockchain is already running
echo -e "${BLUE}📡 Checking blockchain status...${NC}"
if pgrep -f "belizechain-node" > /dev/null; then
    echo -e "${GREEN}✅ Blockchain node already running${NC}"
    BLOCKCHAIN_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Blockchain node not running${NC}"
    echo -e "${YELLOW}   Tests will run but blockchain data may not be available${NC}"
    BLOCKCHAIN_RUNNING=false
fi

# Start UI server if not running
echo -e "\n${BLUE}🌐 Starting UI server...${NC}"
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ UI server already running on http://localhost:3001${NC}"
else
    echo "Starting Next.js dev server..."
    npm run dev > /tmp/belizechain-ui.log 2>&1 &
    UI_PID=$!
    echo "UI server started (PID: $UI_PID)"
    
    # Wait for server to be ready
    echo -n "Waiting for server to start"
    for i in {1..30}; do
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✅ UI server ready on http://localhost:3001${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo ""
        echo -e "${RED}❌ UI server failed to start${NC}"
        echo "Check logs: tail -f /tmp/belizechain-ui.log"
        exit 1
    fi
fi

# Run Playwright tests
echo -e "\n${BLUE}🧪 Running E2E Tests...${NC}"
echo "Test pattern: ${TEST_PATTERN:-all tests}"
echo "Workers: $WORKERS"
echo "Headed: $HEADED"
echo ""

# Build test command
TEST_CMD="npx playwright test"

if [ ! -z "$TEST_PATTERN" ]; then
    TEST_CMD="$TEST_CMD $TEST_PATTERN"
fi

TEST_CMD="$TEST_CMD --workers=$WORKERS"

if [ "$HEADED" = "true" ]; then
    TEST_CMD="$TEST_CMD --headed"
fi

# Run tests
echo "Running: $TEST_CMD"
echo ""

if $TEST_CMD; then
    echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      ✅ ALL TESTS PASSED! 🎉          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
else
    echo -e "\n${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║      ❌ SOME TESTS FAILED              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
fi

# Show report location
if [ -f "playwright-report/index.html" ]; then
    echo -e "\n${BLUE}📊 Test Report:${NC}"
    echo "   HTML: file://$SCRIPT_DIR/playwright-report/index.html"
    echo "   JSON: $SCRIPT_DIR/test-results/results.json"
    echo ""
    echo "To view HTML report:"
    echo "   npx playwright show-report"
fi

# Show summary
if [ -f "test-results/results.json" ]; then
    echo -e "\n${BLUE}📈 Test Summary:${NC}"
    TOTAL=$(jq -r '.stats.expected + .stats.unexpected + .stats.flaky + .stats.skipped' test-results/results.json 2>/dev/null || echo "?")
    PASSED=$(jq -r '.stats.expected' test-results/results.json 2>/dev/null || echo "?")
    FAILED=$(jq -r '.stats.unexpected' test-results/results.json 2>/dev/null || echo "?")
    FLAKY=$(jq -r '.stats.flaky' test-results/results.json 2>/dev/null || echo "?")
    SKIPPED=$(jq -r '.stats.skipped' test-results/results.json 2>/dev/null || echo "?")
    DURATION=$(jq -r '.stats.duration / 1000' test-results/results.json 2>/dev/null || echo "?")
    
    echo "   Total: $TOTAL"
    echo -e "   ${GREEN}Passed: $PASSED${NC}"
    if [ "$FAILED" != "0" ] && [ "$FAILED" != "?" ]; then
        echo -e "   ${RED}Failed: $FAILED${NC}"
    else
        echo "   Failed: $FAILED"
    fi
    if [ "$FLAKY" != "0" ] && [ "$FLAKY" != "?" ]; then
        echo -e "   ${YELLOW}Flaky: $FLAKY${NC}"
    fi
    if [ "$SKIPPED" != "0" ] && [ "$SKIPPED" != "?" ]; then
        echo "   Skipped: $SKIPPED"
    fi
    echo "   Duration: ${DURATION}s"
fi

echo ""
exit $EXIT_CODE
