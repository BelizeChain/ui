#!/bin/bash
# BelizeChain UI Wiring Test Script
# Tests blockchain connectivity and service availability

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  BelizeChain UI Wiring Test"
echo "  Checking blockchain and service connectivity"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASS=0
FAIL=0
WARN=0

# Function to check TCP port
check_port() {
  local port=$1
  timeout 1 bash -c "</dev/tcp/127.0.0.1/$port" 2>/dev/null
}

# Function to check HTTP endpoint
check_http() {
  local url=$1
  curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. BLOCKCHAIN NODE (Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if check_port 9944; then
  echo -e "${GREEN}✅ Blockchain node running on ws://127.0.0.1:9944${NC}"
  PASS=$((PASS + 1))
  
  # Additional check: try to query chain info
  if command -v websocat &> /dev/null; then
    CHAIN=$(echo '{"id":1,"jsonrpc":"2.0","method":"system_chain","params":[]}' | \
            websocat -n1 ws://127.0.0.1:9944 2>/dev/null | \
            grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$CHAIN" ]; then
      echo -e "   Chain: ${BLUE}$CHAIN${NC}"
    fi
  fi
else
  echo -e "${RED}❌ Blockchain node NOT running on ws://127.0.0.1:9944${NC}"
  echo -e "   ${YELLOW}Start with: ./target/release/belizechain-node --dev --tmp${NC}"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. PYTHON SERVICES (Optional but Recommended)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Nawal (Federated Learning)
if check_port 8001; then
  echo -e "${GREEN}✅ Nawal service running on http://localhost:8001${NC}"
  PASS=$((PASS + 1))
  
  # Try health check
  if command -v curl &> /dev/null; then
    STATUS=$(check_http "http://localhost:8001/health")
    if [ "$STATUS" = "200" ]; then
      echo -e "   Health check: ${GREEN}OK${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠️  Nawal service NOT running (optional)${NC}"
  echo -e "   ${BLUE}Start with: cd nawal && python -m nawal.orchestrator server${NC}"
  WARN=$((WARN + 1))
fi
echo ""

# Kinich (Quantum Computing)
if check_port 8002; then
  echo -e "${GREEN}✅ Kinich service running on http://localhost:8002${NC}"
  PASS=$((PASS + 1))
  
  STATUS=$(check_http "http://localhost:8002/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo -e "   Health check: ${GREEN}OK${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Kinich service NOT running (optional)${NC}"
  echo -e "   ${BLUE}Start with: cd kinich && python -m kinich.core.quantum_node${NC}"
  WARN=$((WARN + 1))
fi
echo ""

# Pakit (Storage)
if check_port 8003; then
  echo -e "${GREEN}✅ Pakit service running on http://localhost:8003${NC}"
  PASS=$((PASS + 1))
  
  STATUS=$(check_http "http://localhost:8003/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo -e "   Health check: ${GREEN}OK${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Pakit service NOT running (optional)${NC}"
  echo -e "   ${BLUE}Start with: cd pakit && python -m pakit.api_server${NC}"
  WARN=$((WARN + 1))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. UI APPLICATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if UI is running
if check_port 3001; then
  echo -e "${GREEN}✅ Maya Wallet running on http://localhost:3001${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${YELLOW}⚠️  Maya Wallet NOT running${NC}"
  echo -e "   ${BLUE}Start with: cd ui && npm run dev:maya${NC}"
  WARN=$((WARN + 1))
fi
echo ""

if check_port 3002; then
  echo -e "${GREEN}✅ Blue Hole Portal running on http://localhost:3002${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${YELLOW}⚠️  Blue Hole Portal NOT running${NC}"
  echo -e "   ${BLUE}Start with: cd ui && npm run dev:bluehole${NC}"
  WARN=$((WARN + 1))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. ENVIRONMENT CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if .env.local files exist
if [ -f "ui/maya-wallet/.env.local" ]; then
  echo -e "${GREEN}✅ Maya Wallet environment configured (.env.local)${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${YELLOW}⚠️  Maya Wallet .env.local NOT found${NC}"
  echo -e "   ${BLUE}Create from: cp ui/maya-wallet/.env.example ui/maya-wallet/.env.local${NC}"
  WARN=$((WARN + 1))
fi
echo ""

if [ -f "ui/blue-hole-portal/.env.local" ]; then
  echo -e "${GREEN}✅ Blue Hole Portal environment configured (.env.local)${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${YELLOW}⚠️  Blue Hole Portal .env.local NOT found${NC}"
  echo -e "   ${BLUE}Create from: cp ui/blue-hole-portal/.env.example ui/blue-hole-portal/.env.local${NC}"
  WARN=$((WARN + 1))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. BROWSER EXTENSION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${BLUE}ℹ️  Polkadot.js Extension Check${NC}"
echo -e "   Please verify manually in your browser:"
echo -e "   1. Extension is installed (https://polkadot.js.org/extension/)"
echo -e "   2. Extension is enabled for localhost"
echo -e "   3. At least one account exists"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=$((PASS + FAIL + WARN))
echo -e "Tests Run: ${BLUE}$TOTAL${NC}"
echo -e "Passed:    ${GREEN}$PASS${NC}"
echo -e "Failed:    ${RED}$FAIL${NC}"
echo -e "Warnings:  ${YELLOW}$WARN${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}❌ CRITICAL: Blockchain node must be running${NC}"
  echo ""
  echo "Quick Start Commands:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "# Terminal 1: Blockchain"
  echo "./target/release/belizechain-node --dev --tmp"
  echo ""
  echo "# Terminal 2: Python Services (optional)"
  echo "source .venv/bin/activate"
  echo "cd nawal && python -m nawal.orchestrator server &"
  echo "cd ../kinich && python -m kinich.core.quantum_node &"
  echo "cd ../pakit && python -m pakit.api_server &"
  echo ""
  echo "# Terminal 3: UI"
  echo "cd ui && npm run dev:all"
  echo ""
  exit 1
elif [ $WARN -gt 3 ]; then
  echo -e "${YELLOW}⚠️  PARTIAL: Some services not running (UI will work with limited features)${NC}"
  echo ""
  exit 0
else
  echo -e "${GREEN}✅ SUCCESS: All critical services running!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Open http://localhost:3001 (Maya Wallet)"
  echo "  2. Open http://localhost:3002 (Blue Hole Portal)"
  echo "  3. Connect Polkadot.js extension"
  echo "  4. Start testing pages!"
  echo ""
  exit 0
fi
