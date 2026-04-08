/**
 * Global teardown for E2E tests
 * Runs once after all tests
 *
 * @module tests/e2e/global-teardown
 */

import type { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown function
 */
async function globalTeardown(_config: FullConfig): Promise<void> {
  console.log('[E2E Teardown] Starting E2E test suite cleanup');

  const cwd = process.cwd();
  const testResultsDir = path.join(cwd, 'test-results');

  // Generate test summary
  await generateTestSummary(testResultsDir);

  // Clean up temporary files
  cleanupTemporaryFiles(testResultsDir);

  console.log('[E2E Teardown] Completed E2E test suite');
}

/**
 * Generate test summary from results
 */
async function generateTestSummary(testResultsDir: string): Promise<void> {
  const summaryPath = path.join(testResultsDir, 'test-summary.json');

  try {
    // Read test results if available
    const resultsPath = path.join(testResultsDir, '..', 'test-results.json');
    let testResults: Record<string, unknown> = {};

    if (fs.existsSync(resultsPath)) {
      const content = fs.readFileSync(resultsPath, 'utf-8');
      testResults = JSON.parse(content);
    }

    const summary = {
      timestamp: new Date().toISOString(),
      duration: testResults['duration'] || 0,
      passed: (testResults['suites'] as Array<unknown>)?.length || 0,
      testResultsPath: resultsPath,
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('[E2E Teardown] Test summary generated');
  } catch (error) {
    console.log('[E2E Teardown] Could not generate test summary');
  }
}

/**
 * Clean up temporary files
 */
function cleanupTemporaryFiles(testResultsDir: string): void {
  const tempPatterns = ['.tmp', '.temp', '~'];

  try {
    const entries = fs.readdirSync(testResultsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const isTemp = tempPatterns.some((pattern) => entry.name.endsWith(pattern));
        if (isTemp) {
          const filePath = path.join(testResultsDir, entry.name);
          fs.unlinkSync(filePath);
          console.log(`[E2E Teardown] Removed temporary file: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

export default globalTeardown;
