/**
 * Playwright Configuration for AniMaker E2E Tests
 *
 * This configuration sets up Playwright for browser-based end-to-end testing
 * of the animation rendering framework.
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Base URL for the application
 * Update this when the application has a dev server
 */
const baseURL = process.env.BASE_URL || 'http://localhost:5173';

/**
 * Playwright configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Timeout settings
  timeout: 30000, // 30 seconds
  expect: {
    // Assertion timeout
    timeout: 5000,
  },

  // Fully parallel with 1 worker per CPU core
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for all tests
    baseURL,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot configuration
    screenshot: 'only-on-failure',

    // Video configuration
    video: 'retain-on-failure',

    // Browser viewport
    viewport: { width: 1280, height: 720 },
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Global setup and teardown
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'test-results/',
});
