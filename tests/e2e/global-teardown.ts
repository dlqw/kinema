/**
 * Global teardown for E2E tests
 * Runs once after all tests
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Teardown that runs after all tests
  console.log('[E2E Teardown] Completed E2E test suite');

  // Cleanup test artifacts if needed
  // (Playwright handles most cleanup automatically)
}

export default globalTeardown;
