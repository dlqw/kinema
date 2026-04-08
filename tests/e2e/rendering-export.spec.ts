/**
 * E2E Test: Rendering and Export Integration
 *
 * Tests the integration between rendering and export systems,
 * including various format exports and quality verification.
 *
 * @module tests/e2e/rendering-export.spec
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Test configuration constants
 */
const TEST_CONFIG = {
  defaultTimeout: 30000,
  exportTimeout: 60000,
  canvasWidth: 800,
  canvasHeight: 600,
} as const;

/**
 * Helper to create test canvas content
 */
async function createTestCanvasContent(page: Page): Promise<void> {
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw test pattern
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Red circle
    ctx.fillStyle = '#ef476f';
    ctx.beginPath();
    ctx.arc(200, 200, 80, 0, Math.PI * 2);
    ctx.fill();

    // Blue rectangle
    ctx.fillStyle = '#118ab2';
    ctx.fillRect(350, 250, 100, 100);

    // Green triangle
    ctx.fillStyle = '#06d6a0';
    ctx.beginPath();
    ctx.moveTo(600, 400);
    ctx.lineTo(650, 500);
    ctx.lineTo(550, 500);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffd166';
    ctx.font = '24px Arial';
    ctx.fillText('Test Pattern', 320, 100);
  });
}

/**
 * Helper to verify exported file integrity
 */
async function verifyFileIntegrity(
  filePath: string,
  expectedFormat: string,
): Promise<{ valid: boolean; size: number; error?: string }> {
  try {
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    // Check minimum file size
    if (stats.size < 100) {
      return { valid: false, size: stats.size, error: 'File too small' };
    }

    // Verify file headers based on format
    const headerChecks: Record<string, { hex: string; offset: number }> = {
      png: { hex: '89504e47', offset: 0 },
      gif: { hex: '47494638', offset: 0 },
      jpeg: { hex: 'ffd8ff', offset: 0 },
      webm: { hex: '1a45dfa3', offset: 0 },
    };

    const check = headerChecks[expectedFormat];
    if (check) {
      const header = buffer.slice(check.offset, check.offset + 4).toString('hex');
      if (!header.startsWith(check.hex.slice(0, header.length))) {
        return {
          valid: false,
          size: stats.size,
          error: `Invalid ${expectedFormat.toUpperCase()} header`,
        };
      }
    }

    return { valid: true, size: stats.size };
  } catch (error) {
    return {
      valid: false,
      size: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

test.describe('Rendering-Export Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });
    await createTestCanvasContent(page);
  });

  test('should render and export static frame as PNG', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'png');
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);

    const filePath = await download.path();
    if (filePath) {
      const result = await verifyFileIntegrity(filePath, 'png');
      expect(result.valid).toBeTruthy();
      expect(result.size).toBeGreaterThan(1000);
    }
  });

  test('should render and export static frame as JPEG', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'jpeg');

    // Set JPEG quality
    const qualityInput = page.locator('[data-testid="jpeg-quality"]');
    if ((await qualityInput.count()) > 0) {
      await qualityInput.fill('0.9');
    }

    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(jpg|jpeg)$/);
  });

  test('should render and export static frame as WebP', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webp');
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.webp$/);
  });
});

test.describe('GIF Export Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });
    await createTestCanvasContent(page);
  });

  test('should export animated GIF with default settings', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'gif');
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);

    const filePath = await download.path();
    if (filePath) {
      const result = await verifyFileIntegrity(filePath, 'gif');
      expect(result.valid).toBeTruthy();
    }
  });

  test('should export GIF with custom dithering settings', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'gif');

    // Configure dithering
    const ditherSelect = page.locator('[data-testid="gif-dither"]');
    if ((await ditherSelect.count()) > 0) {
      await ditherSelect.selectOption('bayer');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);
  });

  test('should export GIF with transparency', async ({ page }) => {
    // Create scene with transparency
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      canvas.width = 800;
      canvas.height = 600;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw semi-transparent objects
      ctx.fillStyle = 'rgba(233, 69, 96, 0.7)';
      ctx.beginPath();
      ctx.arc(400, 300, 100, 0, Math.PI * 2);
      ctx.fill();
    });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'gif');

    // Enable transparency
    const transparentCheckbox = page.locator('[data-testid="gif-transparent"]');
    if ((await transparentCheckbox.count()) > 0) {
      await transparentCheckbox.check();
    }

    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);
  });

  test('should export GIF with loop settings', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'gif');

    // Set loop count
    const loopInput = page.locator('[data-testid="gif-loop-count"]');
    if ((await loopInput.count()) > 0) {
      await loopInput.fill('3');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);
  });
});

test.describe('WebM Export Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });
    await createTestCanvasContent(page);
  });

  test('should export WebM with VP9 codec', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');

    // Select VP9 codec if available
    const codecSelect = page.locator('[data-testid="webm-codec"]');
    if ((await codecSelect.count()) > 0) {
      await codecSelect.selectOption('vp9');
    }

    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.webm$/);
  });

  test('should export WebM with quality settings', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');

    // Set quality
    const qualitySelect = page.locator('[data-testid="video-quality"]');
    if ((await qualitySelect.count()) > 0) {
      await qualitySelect.selectOption('high');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.webm$/);
  });

  test('should export WebM with custom bitrate', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');

    // Set custom bitrate
    const bitrateInput = page.locator('[data-testid="video-bitrate"]');
    if ((await bitrateInput.count()) > 0) {
      await bitrateInput.fill('5000000');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.webm$/);
  });

  test('should check WebM encoder availability', async ({ page }) => {
    const webmSupported = await page.evaluate(() => {
      return MediaRecorder.isTypeSupported('video/webm;codecs=vp9');
    });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');

    if (!webmSupported) {
      // Should show fallback or error
      const availabilityWarning = page.locator('[data-testid="encoder-availability-warning"]');
      expect(await availabilityWarning.count()).toBeGreaterThan(0);
    } else {
      // Should allow export
      const startButton = page.locator('[data-testid="export-start-button"]');
      await expect(startButton).toBeEnabled();
    }
  });
});

test.describe('MP4 Export Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });
    await createTestCanvasContent(page);
  });

  test('should attempt MP4 export with FFmpeg.wasm', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'mp4');

    // Check for FFmpeg loading indicator
    const loadingIndicator = page.locator('[data-testid="ffmpeg-loading"]');
    const isLoading = (await loadingIndicator.count()) > 0;

    if (isLoading) {
      // Wait for FFmpeg to load
      await expect(loadingIndicator).toBeVisible({ timeout: 30000 });
    }

    // Start export
    const downloadPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.mp4$/);
    } else {
      // If download failed, check for error message
      const errorMessage = page.locator('[data-testid="export-error"]');
      const hasError = (await errorMessage.count()) > 0;
      expect(hasError).toBeTruthy();
    }
  });

  test('should show MP4 export progress with FFmpeg', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'mp4');
    await page.click('[data-testid="export-start-button"]');

    // Check for progress indicator
    const progressIndicator = page.locator('[data-testid="export-progress"]');
    const hasProgress = (await progressIndicator.count()) > 0;

    if (hasProgress) {
      await expect(progressIndicator).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Image Sequence Export Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });
    await createTestCanvasContent(page);
  });

  test('should export PNG image sequence as ZIP', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'png-sequence');

    // Configure frame range
    const startFrameInput = page.locator('[data-testid="sequence-start-frame"]');
    const endFrameInput = page.locator('[data-testid="sequence-end-frame"]');

    if ((await startFrameInput.count()) > 0) {
      await startFrameInput.fill('0');
      await endFrameInput.fill('10');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });

  test('should export JPEG image sequence with quality setting', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'jpeg-sequence');

    // Set JPEG quality
    const qualityInput = page.locator('[data-testid="jpeg-quality"]');
    if ((await qualityInput.count()) > 0) {
      await qualityInput.fill('0.85');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });
});

test.describe('Cross-Format Quality Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });
    await createTestCanvasContent(page);
  });

  test('should produce comparable quality across formats', async ({ page }) => {
    const formats = ['png', 'jpeg', 'webp'];
    const fileSizes: Record<string, number> = {};

    for (const format of formats) {
      await page.click('[data-testid="export-button"]');
      await page.selectOption('[data-testid="export-format"]', format);

      const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
      await page.click('[data-testid="export-start-button"]');

      const download = await downloadPromise;
      const filePath = await download.path();

      if (filePath) {
        const stats = fs.statSync(filePath);
        fileSizes[format] = stats.size;
      }

      await waitForExportCompletion(page);
    }

    // PNG should be larger than JPEG (lossless vs lossy)
    if (fileSizes['png'] && fileSizes['jpeg']) {
      expect(fileSizes['png']).toBeGreaterThan(fileSizes['jpeg']);
    }
  });
});

test.describe('Render-Export Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });
  });

  test('should measure export performance metrics', async ({ page }) => {
    await createTestCanvasContent(page);

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'webm');

    const startTime = Date.now();
    await page.click('[data-testid="export-start-button"]');

    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: TEST_CONFIG.exportTimeout });
    const download = await downloadPromise;

    const endTime = Date.now();
    const exportTime = endTime - startTime;

    // Export should complete within reasonable time
    expect(exportTime).toBeLessThan(30000);

    // Check for performance metrics display
    const perfMetrics = page.locator('[data-testid="export-performance-metrics"]');
    const hasMetrics = (await perfMetrics.count()) > 0;

    if (hasMetrics) {
      const metricsText = await perfMetrics.textContent();
      expect(metricsText).toBeDefined();
    }
  });

  test('should handle high-resolution export efficiently', async ({ page }) => {
    // Create high-resolution canvas
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      canvas.width = 1920;
      canvas.height = 1080;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw more complex pattern
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `hsl(${i * 7.2}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          20 + Math.random() * 40,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    });

    await page.click('[data-testid="export-button"]');
    await page.selectOption('[data-testid="export-format"]', 'png');

    const startTime = Date.now();

    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;
    const exportTime = Date.now() - startTime;

    // High-resolution export should still be reasonably fast
    expect(exportTime).toBeLessThan(10000);
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });
});

test.describe('Browser Compatibility', () => {
  test('should check MediaRecorder support', async ({ page, browserName }) => {
    const mediaRecorderSupported = await page.evaluate(() => {
      return typeof MediaRecorder !== 'undefined';
    });

    expect(mediaRecorderSupported).toBeTruthy();

    // Check supported MIME types
    const supportedTypes = await page.evaluate(() => {
      const types = ['video/webm', 'video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/mp4'];
      return types.map((type) => ({
        type,
        supported: MediaRecorder.isTypeSupported(type),
      }));
    });

    // At least one video format should be supported
    const hasVideoSupport = supportedTypes.some((t) => t.supported);
    expect(hasVideoSupport).toBeTruthy();
  });

  test('should check canvas toBlob support', async ({ page }) => {
    const blobSupported = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return typeof canvas.toBlob === 'function';
    });

    expect(blobSupported).toBeTruthy();
  });

  test('should adapt to browser capabilities', async ({ page, browserName }) => {
    await createTestCanvasContent(page);

    await page.click('[data-testid="export-button"]');

    // Get available formats
    const formatSelect = page.locator('[data-testid="export-format"]');
    const options = await formatSelect.locator('option').allTextContents();

    // At minimum, PNG should be available
    expect(options.some((opt) => opt.toLowerCase().includes('png'))).toBeTruthy();

    // WebM support varies by browser
    if (browserName === 'firefox') {
      // Firefox has good WebM support
      expect(options.some((opt) => opt.toLowerCase().includes('webm'))).toBeTruthy();
    }
  });
});

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
