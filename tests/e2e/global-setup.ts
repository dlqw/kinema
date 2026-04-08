/**
 * Global setup for E2E tests
 * Runs once before all tests
 *
 * @module tests/e2e/global-setup
 */

import type { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Required directories for E2E tests
 */
const REQUIRED_DIRS = [
  'test-results',
  'test-results/screenshots',
  'test-results/videos',
  'test-results/traces',
  'test-results/exports',
  'test-results/downloads',
];

/**
 * Global setup function
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('[E2E Setup] Starting E2E test suite');
  console.log(`[E2E Setup] Node version: ${process.version}`);
  console.log(`[E2E Setup] Platform: ${process.platform}`);
  console.log(`[E2E Setup] CI mode: ${process.env['CI'] ? 'Yes' : 'No'}`);

  const cwd = process.cwd();
  console.log(`[E2E Setup] Working directory: ${cwd}`);

  // Create required directories
  for (const dir of REQUIRED_DIRS) {
    const fullPath = path.join(cwd, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`[E2E Setup] Created directory: ${dir}`);
    }
  }

  // Clean up old test artifacts (optional, keeps recent ones)
  cleanupOldArtifacts(path.join(cwd, 'test-results'));

  // Write test environment info
  const envInfo = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    ciMode: !!process.env['CI'],
    baseUrl: process.env['BASE_URL'] || 'http://localhost:5173',
  };

  const envInfoPath = path.join(cwd, 'test-results', 'test-env.json');
  fs.writeFileSync(envInfoPath, JSON.stringify(envInfo, null, 2));

  console.log('[E2E Setup] Test environment ready');
}

/**
 * Clean up old test artifacts (older than 7 days)
 */
function cleanupOldArtifacts(testResultsDir: string): void {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const now = Date.now();

  try {
    const entries = fs.readdirSync(testResultsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(testResultsDir, entry.name);
        const stat = fs.statSync(subDir);
        const age = now - stat.mtimeMs;

        if (age > maxAge && entry.name !== 'exports') {
          // Keep exports directory
          fs.rmSync(subDir, { recursive: true, force: true });
          console.log(`[E2E Setup] Cleaned up old directory: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    // Ignore cleanup errors
    console.log('[E2E Setup] Cleanup skipped (directory may be empty)');
  }
}

export default globalSetup;
