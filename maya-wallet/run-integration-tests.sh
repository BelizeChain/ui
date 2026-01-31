#!/bin/bash
# BelizeChain Integration Test Runner
# Runs E2E tests with real blockchain node + UI server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  BelizeChain Integration Test Runner      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Cleanup function
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

# Check if blockchain is running
echo -e "${BLUE}🔗 Checking blockchain status...${NC}"
if pgrep -f "belizechain-node" > /dev/null; then
    echo -e "${GREEN}✅ Blockchain node already running${NC}"
    BLOCKCHAIN_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Blockchain node not running${NC}"
    echo "Starting blockchain node..."
    
    cd ../..
    ./target/release/belizechain-node --dev --tmp > /tmp/blockchain-integration.log 2>&1 &
    BLOCKCHAIN_PID=$!
    cd ui/maya-wallet
    
    echo "Blockchain started (PID: $BLOCKCHAIN_PID)"
    echo -n "Waiting for blockchain to be ready"
    
    for i in {1..30}; do
        if curl -s -H "Content-Type: application/json" \
           -d '{"id":1, "jsonrpc":"2.0", "method": "system_health"}' \
           http://127.0.0.1:9944 2>/dev/null | grep -q "peers"; then
            echo ""
            echo -e "${GREEN}✅ Blockchain ready${NC}"
            BLOCKCHAIN_RUNNING=true
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if [ "$BLOCKCHAIN_RUNNING" != "true" ]; then
        echo ""
        echo -e "${RED}❌ Blockchain failed to start${NC}"
        echo "Check logs: tail -f /tmp/blockchain-integration.log"
        exit 1
    fi
fi

# Get current block number
BLOCK=$(curl -s -H "Content-Type: application/json" \
     -d '{"id":1, "jsonrpc":"2.0", "method": "chain_getHeader"}' \
     http://127.0.0.1:9944 2>/dev/null | grep -o '"number":"[^"]*"' | cut -d'"' -f4 || echo "?")
echo "Current block: $BLOCK"

# Check if UI is running
echo -e "\n${BLUE}🌐 Checking UI server status...${NC}"
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ UI server already running${NC}"
else
    echo "Starting UI server..."
    npm run dev > /tmp/ui-integration.log 2>&1 &
    UI_PID=$!
    echo "UI server started (PID: $UI_PID)"
    
    echo -n "Waiting for UI to be ready"
    for i in {1..30}; do
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✅ UI server ready${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
fi

# Run integration tests
echo -e "\n${BLUE}🧪 Running Integration Tests...${NC}"
echo "Tests will connect to real blockchain and verify data"
echo ""

# Run tests tagged with @integration
if npx playwright test --grep "@integration" --project=chromium --workers=1; then
    echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ ALL INTEGRATION TESTS PASSED! 🎉     ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
else
    echo -e "\n${RED}╔════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ SOME INTEGRATION TESTS FAILED         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
fi

# Show logs if failed
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "\n${YELLOW}📋 Recent Blockchain Logs:${NC}"
    tail -20 /tmp/blockchain-integration.log 2>/dev/null || echo "No logs"
    echo ""
    echo -e "${YELLOW}📋 Recent UI Logs:${NC}"
    tail -20 /tmp/ui-integration.log 2>/dev/null || echo "No logs"
fi

echo ""
echo "Full logs:"
echo "  Blockchain: /tmp/blockchain-integration.log"
echo "  UI Server:  /tmp/ui-integration.log"
echo ""

exit $EXIT_CODE
