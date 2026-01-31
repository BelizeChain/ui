#!/bin/bash
# Quick test runner - runs a single test file to verify setup

set -e

echo "🧪 Running Quick Test (Home Page Only)"
echo "======================================"
echo ""

cd /home/wicked/belizechain-belizechain/ui/maya-wallet

# Check services
echo "Checking services..."
if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "❌ UI not running on localhost:3001"
    exit 1
fi
echo "✅ UI is running"
echo ""

# Run single test file
echo "Running home page tests..."
npx playwright test tests/e2e/01-home.spec.ts --reporter=list

echo ""
echo "✅ Quick test complete!"
