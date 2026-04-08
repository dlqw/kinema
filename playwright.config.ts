/**
 * Playwright Configuration for Kinema E2E Tests
 *
 * This configuration sets up Playwright for browser-based end-to-end testing
 * of the animation rendering and export framework.
 *
 * @module playwright.config
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Base URL for the application
 * Update this when the application has a dev server
 */
const baseURL = process.env['BASE_URL'] || 'http://localhost:5173';

const isCI = !!process.env['CI'];

/**
 * Playwright configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Test file patterns
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],

  // Timeout settings
  timeout: 60000, // 60 seconds (increased for export operations)
  expect: {
    // Assertion timeout
    timeout: 10000,
  },

  // Fully parallel with 1 worker per CPU core
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: isCI,
  // Retry on CI only
  retries: isCI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: isCI ? 1 : 4,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    ['list'], // Console output for progress
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

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Ignore HTTPS errors (for local testing)
    ignoreHTTPSErrors: true,

    // Locale and timezone for consistent testing
    locale: 'en-US',
    timezoneId: 'UTC',
  },

  // Test projects for different browsers
  projects: [
    // Desktop browsers - Primary
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable WebGPU and WebGL features
        launchOptions: {
          args: ['--enable-unsafe-webgpu', '--enable-gpu-rasterization', '--enable-zero-copy'],
        },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Firefox has good WebM support
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // Desktop browsers - Specific tests
    {
      name: 'chromium-export',
      testMatch: /export-workflow\.spec\.ts|rendering-export\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-unsafe-webgpu',
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
            '--enable-features=WebAssembly SIMD',
          ],
        },
      },
      // Export tests may need more time
      timeout: 120000,
    },

    // Mobile browsers (for responsive testing)
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

  // Web server configuration (if needed)
  // Uncomment when a dev server is available
  // webServer: {
  //   command: 'npm run dev',
  //   url: baseURL,
  //   timeout: 120000,
  //   reuseExistingServer: !isCI,
  // },
});
