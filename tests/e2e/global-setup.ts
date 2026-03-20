/**
 * Global setup for E2E tests
 * Runs once before all tests
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Setup that runs before all tests
  console.log('[E2E Setup] Starting E2E test suite');

  // Create test output directory if it doesn't exist
  const fs = await import('fs');
  const path = await import('path');

  const outputDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const screenshotsDir = path.join(outputDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('[E2E Setup] Test environment ready');
}

export default globalSetup;
