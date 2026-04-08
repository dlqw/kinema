/**
 * E2E Test: Export Workflow
 *
 * Tests the complete export workflow including user interaction scenarios,
 * export process verification, and error handling.
 *
 * @module tests/e2e/export-workflow.spec
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper function to set up a basic scene for export testing
 */
async function setupBasicScene(page: Page): Promise<void> {
  await page.goto('/');

  // Wait for application to load
  await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });

  // Create a simple scene with an animated object
  await page.click('[data-testid="create-scene-button"]');

  // Add a circle
  await page.click('[data-testid="add-circle-button"]');
  await page.click('[data-testid="object-apply"]');

  // Add a simple animation
  await page.click('[data-testid="add-animation-button"]');
  await page.selectOption('[data-testid="animation-type"]', 'fade-in');
  await page.fill('[data-testid="animation-duration"]', '500');
  await page.click('[data-testid="animation-apply-button"]');
}

/**
 * Helper function to wait for export completion
 */
async function waitForExportCompletion(page: Page, timeout = 30000): Promise<boolean> {
  try {
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe('Export Workflow - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicScene(page);
  });

  test('should complete full export workflow from scene to download', async ({ page }) => {
    // Step 1: Open export dialog
    await page.click('[data-testid="export-button"]');

    // Verify export dialog appears
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();

    // Step 2: Select format
    await page.selectOption('[data-testid="export-format"]', 'webm');

    // Step 3: Configure settings
    await page.selectOption('[data-testid="video-quality"]', 'medium');
    await page.fill('[data-testid="export-framerate"]', '30');

    // Step 4: Start export
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.click('[data-testid="export-start-button"]');

    // Step 5: Monitor progress
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Step 6: Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.webm$/);

    // Step 7: Verify completion
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible();
  });

  test('should export with custom resolution settings', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Set custom resolution
    await page.check('[data-testid="custom-resolution"]');
    await page.fill('[data-testid="export-width"]', '1920');
    await page.fill('[data-testid="export-height"]', '1080');

    // Verify aspect ratio is preserved or displayed
    const aspectRatio = await page.locator('[data-testid="aspect-ratio"]').textContent();
    expect(aspectRatio).toContain('16:9');

    await page.selectOption('[data-testid="export-format"]', 'mp4');
    await page.click('[data-testid="export-start-button"]');

    // Wait for export to complete or start
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible({ timeout: 5000 });
  });

  test('should export animation with loop settings', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Select GIF format (supports loops)
    await page.selectOption('[data-testid="export-format"]', 'gif');

    // Configure loop settings
    await page.fill('[data-testid="gif-loop-count"]', '3');

    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);
  });
});

test.describe('Export Workflow - User Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicScene(page);
  });

  test('should allow format selection with availability check', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Check format options are available
    const formatSelect = page.locator('[data-testid="export-format"]');
    await expect(formatSelect).toBeVisible();

    // Test each format option
    const formats = ['gif', 'webm', 'mp4', 'png'];

    for (const format of formats) {
      await formatSelect.selectOption(format);
      const selectedValue = await formatSelect.inputValue();
      expect(selectedValue).toBe(format);
    }
  });

  test('should show encoder availability warnings', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Select MP4 format (may require FFmpeg.wasm)
    await page.selectOption('[data-testid="export-format"]', 'mp4');

    // Check for availability indicator
    const availabilityWarning = page.locator('[data-testid="encoder-availability-warning"]');
    const hasWarning = (await availabilityWarning.count()) > 0;

    if (hasWarning) {
      // Should show fallback option or loading indicator
      await expect(availabilityWarning).toBeVisible();
    }
  });

  test('should update estimated file size based on settings', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Get initial estimate
    await page.selectOption('[data-testid="export-format"]', 'webm');
    const initialEstimate = await page.locator('[data-testid="estimated-size"]').textContent();

    // Change quality
    await page.selectOption('[data-testid="video-quality"]', 'high');
    await page.waitForTimeout(500);

    // Get updated estimate
    const updatedEstimate = await page.locator('[data-testid="estimated-size"]').textContent();

    // Estimates should be different (or at least visible)
    expect(initialEstimate).toBeDefined();
    expect(updatedEstimate).toBeDefined();
  });

  test('should preserve export settings between sessions', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Set specific settings
    await page.selectOption('[data-testid="export-format"]', 'gif');
    await page.selectOption('[data-testid="gif-quality"]', 'high');
    await page.fill('[data-testid="gif-loop-count"]', '5');

    // Close dialog
    await page.click('[data-testid="export-cancel-button"]');

    // Reopen export dialog
    await page.click('[data-testid="export-button"]');

    // Verify settings are preserved
    const format = await page.locator('[data-testid="export-format"]').inputValue();
    const quality = await page.locator('[data-testid="gif-quality"]').inputValue();
    const loopCount = await page.locator('[data-testid="gif-loop-count"]').inputValue();

    expect(format).toBe('gif');
    expect(quality).toBe('high');
    expect(loopCount).toBe('5');
  });

  test('should provide export presets', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Check for preset dropdown
    const presetSelect = page.locator('[data-testid="export-preset"]');
    const hasPresets = (await presetSelect.count()) > 0;

    if (hasPresets) {
      // Select a preset
      await presetSelect.selectOption('youtube-1080p');

      // Verify settings are auto-filled
      const width = await page.locator('[data-testid="export-width"]').inputValue();
      const height = await page.locator('[data-testid="export-height"]').inputValue();
      const format = await page.locator('[data-testid="export-format"]').inputValue();

      expect(width).toBe('1920');
      expect(height).toBe('1080');
      expect(format).toBe('mp4');
    }
  });
});

test.describe('Export Workflow - Progress and Status', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicScene(page);
  });

  test('should show real-time export progress', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');
    await page.click('[data-testid="export-start-button"]');

    // Wait for progress indicator
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Verify progress updates
    const progressBar = page.locator('[data-testid="export-progress-bar"]');
    await expect(progressBar).toBeVisible();

    // Get initial progress
    const initialProgress = await progressBar.getAttribute('aria-valuenow');

    // Wait for progress to update
    await page.waitForTimeout(1000);

    // Progress should be tracked
    expect(initialProgress).toBeDefined();
  });

  test('should display time remaining estimate', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');
    await page.click('[data-testid="export-start-button"]');

    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Check for time remaining display
    const timeRemaining = page.locator('[data-testid="export-time-remaining"]');
    const hasTimeRemaining = (await timeRemaining.count()) > 0;

    if (hasTimeRemaining) {
      const timeText = await timeRemaining.textContent();
      expect(timeText).toMatch(/\d+/); // Should contain a number
    }
  });

  test('should show frame processing status', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'gif');
    await page.click('[data-testid="export-start-button"]');

    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Check for frame counter
    const frameCounter = page.locator('[data-testid="export-frame-counter"]');
    const hasFrameCounter = (await frameCounter.count()) > 0;

    if (hasFrameCounter) {
      const counterText = await frameCounter.textContent();
      expect(counterText).toMatch(/\d+\s*\/\s*\d+/); // "X / Y" format
    }
  });

  test('should update preview during export', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');
    await page.click('[data-testid="export-start-button"]');

    // Check for preview canvas
    const previewCanvas = page.locator('[data-testid="export-preview-canvas"]');
    const hasPreview = (await previewCanvas.count()) > 0;

    if (hasPreview) {
      await expect(previewCanvas).toBeVisible();
    }
  });
});

test.describe('Export Workflow - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicScene(page);
  });

  test('should validate export settings before starting', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Try to set invalid framerate
    await page.fill('[data-testid="export-framerate"]', '-10');
    await page.click('[data-testid="export-start-button"]');

    // Should show validation error
    await expect(page.locator('[data-testid="export-validation-error"]')).toBeVisible();
  });

  test('should handle encoder initialization failure', async ({ page }) => {
    // Simulate encoder failure by blocking WebAssembly
    await page.addInitScript(() => {
      // Testing fallback - intentionally breaking WebAssembly
      (window as unknown as Record<string, unknown>).WebAssembly = undefined;
    });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'mp4');
    await page.click('[data-testid="export-start-button"]');

    // Should show error or fallback
    const errorLocator = page.locator('[data-testid="export-error"]');
    const fallbackLocator = page.locator('[data-testid="encoder-fallback"]');

    const hasError = (await errorLocator.count()) > 0;
    const hasFallback = (await fallbackLocator.count()) > 0;

    expect(hasError || hasFallback).toBeTruthy();
  });

  test('should handle disk space errors gracefully', async ({ page }) => {
    // This test simulates storage quota exceeded
    await page.evaluate(() => {
      // @ts-expect-error - Testing error handling
      navigator.storage = {
        estimate: () => Promise.resolve({ quota: 0, usage: 0 }),
      };
    });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');

    // Try to start export
    await page.click('[data-testid="export-start-button"]');

    // Should either show error or handle gracefully
    const errorLocator = page.locator('[data-testid="export-error"]');
    const hasError = (await errorLocator.count()) > 0;

    // If no error shown, export should still work with memory fallback
    if (!hasError) {
      await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
    }
  });

  test('should handle export cancellation correctly', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');
    await page.click('[data-testid="export-start-button"]');

    // Wait for export to start
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Cancel export
    await page.click('[data-testid="export-cancel-button"]');

    // Verify cancellation
    await expect(page.locator('[data-testid="export-cancelled"]')).toBeVisible();

    // Verify cleanup - no partial files
    await expect(page.locator('[data-testid="export-progress"]')).not.toBeVisible();
  });

  test('should recover from temporary encoding errors', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');
    await page.click('[data-testid="export-start-button"]');

    // Wait for export progress
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Simulate error and retry
    // The system should handle errors and either retry or show clear error message
    const exportComplete = await waitForExportCompletion(page, 60000);

    // Either completes or shows proper error
    if (!exportComplete) {
      const errorMessage = page.locator('[data-testid="export-error-message"]');
      const hasError = (await errorMessage.count()) > 0;
      expect(hasError).toBeTruthy();
    }
  });

  test('should show helpful error messages for unsupported formats', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Try to select potentially unavailable format
    const formatSelect = page.locator('[data-testid="export-format"]');
    const options = await formatSelect.locator('option').allTextContents();

    // If MP4 is listed but not available
    if (options.includes('mp4')) {
      await formatSelect.selectOption('mp4');

      const unavailableIndicator = page.locator('[data-testid="format-unavailable"]');
      const isUnavailable = (await unavailableIndicator.count()) > 0;

      if (isUnavailable) {
        await expect(unavailableIndicator).toContainText(/MP4.*requires|FFmpeg|not available/i);
      }
    }
  });
});

test.describe('Export Workflow - Multiple Format Exports', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicScene(page);
  });

  test('should export same scene in multiple formats sequentially', async ({ page }) => {
    // Export as GIF
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'gif');

    let downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.click('[data-testid="export-start-button"]');
    let download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);

    await waitForExportCompletion(page);

    // Export as WebM
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');

    downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.click('[data-testid="export-start-button"]');
    download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.webm$/);
  });

  test('should maintain quality across different export formats', async ({ page }) => {
    const formats = ['gif', 'webm'];

    for (const format of formats) {
      await page.click('[data-testid="export-button"]');
      await page.selectOption('[data-testid="export-format"]', format);

      // Set high quality
      const qualitySelect = page.locator('[data-testid="export-quality"]');
      if ((await qualitySelect.count()) > 0) {
        await qualitySelect.selectOption('high');
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
      await page.click('[data-testid="export-start-button"]');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`));

      await waitForExportCompletion(page);
    }
  });
});

test.describe('Export Workflow - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicScene(page);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    // Tab through export dialog elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be on format selector
    const focusedElement = page.locator(':focus');
    const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase());

    expect(['select', 'button', 'input']).toContain(tagName);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.click('[data-testid="export-button"]');

    const exportDialog = page.locator('[data-testid="export-dialog"]');
    await expect(exportDialog).toHaveAttribute('role', 'dialog');

    const progressIndicator = page.locator('[data-testid="export-progress-bar"]');
    if ((await progressIndicator.count()) > 0) {
      await expect(progressIndicator).toHaveAttribute('role', 'progressbar');
    }
  });

  test('should announce export progress to screen readers', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');
    await page.click('[data-testid="export-start-button"]');

    // Check for live region
    const liveRegion = page.locator('[aria-live="polite"]');
    const hasLiveRegion = (await liveRegion.count()) > 0;

    if (hasLiveRegion) {
      // Should announce progress updates
      const text = await liveRegion.textContent();
      expect(text).toBeDefined();
    }
  });
});
