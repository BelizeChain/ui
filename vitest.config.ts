import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests only — Playwright e2e lives under */e2e and jest is unused.
    include: [
      'shared/src/**/*.test.ts',
      'maya-wallet/src/**/*.test.ts',
      'blue-hole-portal/src/**/*.test.ts',
    ],
    environment: 'node',
    testTimeout: 30000,
  },
});
