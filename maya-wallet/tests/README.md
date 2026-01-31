# Maya Wallet E2E Testing Suite

Automated end-to-end tests for Maya Wallet using Playwright.

## 📋 Test Coverage

### Pages Tested (9 Blockchain-Wired Pages)
✅ **01-home.spec.ts** - Home page, balance display, navigation  
✅ **02-staking.spec.ts** - Validator staking, PoUW contributions  
✅ **03-governance.spec.ts** - Proposals, voting, democracy  
✅ **04-trade.spec.ts** - BelizeX DEX, liquidity pools, swaps  
✅ **05-belizeid.spec.ts** - Identity verification, KYC status  
✅ **06-bridges.spec.ts** - Cross-chain transfers (Ethereum, Polkadot)  
✅ **07-bns.spec.ts** - .bz domain registration, marketplace  
✅ **08-landledger.spec.ts** - Property registry, land titles  
✅ **09-payroll.spec.ts** - Salary payments, payroll records  
✅ **10-analytics.spec.ts** - Aggregated statistics dashboard  
✅ **99-navigation.spec.ts** - Global navigation, routing, 404 handling  

### Test Types
- **Page Load Tests** - Verify pages load successfully
- **Content Tests** - Check for expected elements and data
- **Navigation Tests** - Verify routing and back buttons work
- **Responsive Tests** - Test mobile and desktop viewports
- **State Management** - Verify data persistence and auto-refresh
- **Error Handling** - Test wallet disconnection and errors

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
cd ui/maya-wallet
npm install

# Install Playwright browsers (first time only)
npx playwright install chromium
```

### Start Required Services
```bash
# Terminal 1: Start blockchain node
./target/release/belizechain-node --dev --tmp

# Terminal 2: Start UI dev server
cd ui/maya-wallet && npm run dev
```

### Run Tests
```bash
# Run all tests (headless)
npm run test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/e2e/02-staking.spec.ts

# Debug mode (step through tests)
npm run test:debug

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=mobile-chrome
```

### View Test Results
```bash
# Open HTML report
npm run test:report

# View JSON results
cat test-results/results.json | jq
```

## 📊 Test Results

Test results are saved to:
- **HTML Report**: `test-results/html/index.html`
- **JSON Report**: `test-results/results.json`
- **Screenshots**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)
- **Traces**: `test-results/` (on retry)

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- **Timeout**: 60 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Base URL**: http://localhost:3001
- **Browsers**: Chromium (desktop + mobile)
- **Viewport**: 1280x720 (desktop), 375x667 (mobile)
- **Timezone**: America/Belize

### Test Fixtures (`tests/fixtures/blockchain.ts`)
Custom fixtures for blockchain testing:
- `mockWallet()` - Mock Polkadot.js wallet connection
- `mockBlockchainAPI()` - Mock blockchain API responses
- `waitForBlockchain()` - Wait for connection
- `mockAccount()` - Mock account with balance

## 🧪 Writing New Tests

### Example Test Structure
```typescript
import { test, expect } from '../fixtures/blockchain';

test.describe('Page Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/page-path');
  });

  test('should load page', async ({ page }) => {
    await expect(page).toHaveURL(/.*page-path/);
    await expect(
      page.locator('text=/Page Title/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display content', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const content = page.locator('text=/Expected Content/i').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
```

### Best Practices
1. **Use Descriptive Test Names** - "should display validator list when connected"
2. **Wait for Content** - Use `waitForTimeout()` or `waitForSelector()`
3. **Flexible Selectors** - Use regex and `.first()` for resilient tests
4. **Fallback Expectations** - Handle both connected and disconnected states
5. **Test Isolation** - Each test should be independent
6. **Screenshot on Failure** - Enabled by default in config

## 📈 CI/CD Integration

Tests run automatically on:
- Push to `main`, `develop`, `belizechain` branches
- Pull requests to these branches

GitHub Actions workflow: `.github/workflows/e2e-tests.yml`

### CI Environment
- **Blockchain**: Runs in Docker service container
- **UI**: Built and served during test run
- **Browsers**: Chromium only (fastest)
- **Artifacts**: Test reports uploaded for 30 days

## 🐛 Debugging Tests

### Debug Specific Test
```bash
# Open test in debug mode
npx playwright test tests/e2e/02-staking.spec.ts --debug

# Run with headed browser
npx playwright test --headed --workers=1

# Generate trace
npx playwright test --trace on
```

### View Traces
```bash
# Open trace viewer
npx playwright show-trace test-results/trace.zip
```

### Common Issues

**"Timeout waiting for element"**
→ Increase timeout or add `waitForTimeout()`

**"Page not found"**
→ Verify UI dev server is running on localhost:3001

**"Blockchain not connected"**
→ Verify blockchain node is running on ws://127.0.0.1:9944

**"Tests flaky"**
→ Use more flexible selectors (regex, `.first()`, `.catch()`)

## 📚 Resources

- [Playwright Docs](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

## 🎯 Success Criteria

Tests are considered passing if:
- ✅ All page load tests pass
- ✅ Navigation works across all pages
- ✅ Content displays (connected or disconnected state)
- ✅ No critical errors in browser console
- ✅ Mobile viewport tests pass
- ✅ Auto-refresh mechanisms work

## 🚨 Maintenance

### Update Tests When:
- Adding new pages or features
- Changing page layouts or selectors
- Modifying blockchain services
- Updating Polkadot.js API version

### Test Stability
- Run tests 3 times to verify stability
- Check for flaky tests (pass/fail randomly)
- Update selectors if UI changes
- Mock external dependencies when possible
