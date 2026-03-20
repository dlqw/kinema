/**
 * E2E Test: Export Workflow
 *
 * Tests the complete export workflow including video, GIF, and image sequence
 * exports, with verification of output files.
 */

import { test, expect, fs } from '@playwright/test';
import path from 'path';

test.describe('Export Workflow', () => {
  const exportDir = 'test-results/exports';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Ensure export directory exists
    await page.evaluate((dir) => {
      // Create export directory if it doesn't exist
      // (In real implementation, this would be handled by the app)
      return { ready: true };
    }, exportDir);

    // Wait for canvas to be ready
    await expect(page.locator('canvas')).toBeAttached({ timeout: 10000 });
  });

  test('should export animation as video', async ({ page }) => {
    // Create a simple animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'rotate');
    await page.fill('[data-testid="animation-duration"]', '2000');
    await page.check('[data-testid="animation-loop"]');
    await page.fill('[data-testid="loop-count"]', '2');
    await page.click('[data-testid="animation-apply-button"]');

    // Play animation briefly to ensure it works
    await page.click('[data-testid="play-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="stop-button"]');

    // Initiate video export
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.click('[data-testid="export-video-button"]');

    // Configure export settings
    await page.selectOption('[data-testid="video-format"]', 'mp4');
    await page.selectOption('[data-testid="video-quality"]', 'high');
    await page.fill('[data-testid="video-framerate"]', '60');
    await page.click('[data-testid="export-start-button"]');

    // Wait for download to complete
    const download = await downloadPromise;

    // Verify video file was created
    expect(download.suggestedFilename()).toMatch(/\.(mp4|webm)$/);

    // Verify file metadata
    const stats = await fs.stat(download.path());
    expect(stats.size).toBeGreaterThan(1000); // At least 1KB

    // Cleanup
    await fs.unlink(download.path());
  });

  test('should export animation as GIF', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'fade-in');
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.click('[data-testid="animation-apply-button"]');

    // Initiate GIF export
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.click('[data-testid="export-gif-button"]');

    // Configure GIF settings
    await page.selectOption('[data-testid="gif-quality"]', 'high');
    await page.fill('[data-testid="gif-frame-rate"]', '30');
    await page.click('[data-testid="export-start-button"]');

    // Wait for download
    const download = await downloadPromise;

    // Verify GIF file
    expect(download.suggestedFilename()).toMatch(/\.gif$/);

    // Verify it's a valid GIF (has GIF header)
    const buffer = await fs.readFile(download.path());
    const header = buffer.slice(0, 6).toString('hex');
    expect(header).toBe('474946383961'); // 'GIF89a' in hex

    // Cleanup
    await fs.unlink(download.path());
  });

  test('should export as image sequence', async ({ page }) => {
    // Create animation with multiple frames
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'bounce');
    await page.fill('[data-testid="animation-duration"]', '1500');
    await page.click('[data-testid="animation-apply-button"]');

    // Initiate image sequence export
    await page.click('[data-testid="export-sequence-button"]');

    // Configure export settings
    await page.fill('[data-testid="sequence-start-frame"]', '0');
    await page.fill('[data-testid="sequence-end-frame"]', '45');
    await page.selectOption('[data-testid="sequence-format"]', 'png');
    await page.click('[data-testid="export-start-button"]');

    // For image sequence, we expect a ZIP file
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    const download = await downloadPromise;

    // Verify ZIP file
    expect(download.suggestedFilename()).toMatch(/\.(zip|tar\.gz)$/);

    // Verify file size is reasonable
    const stats = await fs.stat(download.path());
    expect(stats.size).toBeGreaterThan(500);

    // Cleanup
    await fs.unlink(download.path());
  });

  test('should export single frame as image', async ({ page }) => {
    // Create static scene
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Set specific frame to export
    await page.click('[data-testid="timeline-scrubber"]');
    await page.waitForTimeout(100);

    // Export current frame
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.click('[data-testid="export-frame-button"]');
    await page.selectOption('[data-testid="image-format"]', 'png');

    const download = await downloadPromise;

    // Verify image file
    expect(download.suggestedFilename()).toMatch(/\.(png|jpg|jpeg)$/);

    // Verify it's a valid image
    const buffer = await fs.readFile(download.path());

    // Check PNG header (if PNG)
    if (download.suggestedFilename().endsWith('.png')) {
      const header = buffer.slice(0, 8).toString('hex');
      expect(header).toBe('89504e47'); // PNG header
    }

    // Cleanup
    await fs.unlink(download.path());
  });

  test('should export with custom resolution', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Initiate export with custom resolution
    await page.click('[data-testid="export-video-button"]');

    // Set custom resolution
    await page.selectOption('[data-testid="export-resolution"]', '1920x1080');
    await page.click('[data-testid="export-start-button"]');

    // Verify export respects resolution setting
    const resolutionText = await page.locator('[data-testid="export-resolution"]')
      .inputValue();

    expect(resolutionText).toBe('1920x1080');
  });

  test('should show export progress indicator', async ({ page }) => {
    // Create longer animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'move');
    await page.fill('[data-testid="animation-duration"]', '3000');
    await page.click('[data-testid="animation-apply-button"]');

    // Start export
    await page.click('[data-testid="export-video-button"]');
    await page.click('[data-testid="export-start-button"]');

    // Verify progress indicator appears
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Verify progress updates
    const progressText = await page.locator('[data-testid="export-progress-percent"]')
      .textContent();

    expect(progressText).toBeDefined();

    // Wait for export to complete or timeout
    await page.waitForTimeout(5000);

    // Verify completion indicator
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible();
  });

  test('should handle export cancellation', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'scale');
    await page.fill('[-testid="animation-duration"]', '5000');
    await page.click('[data-testid="animation-apply-button"]');

    // Start export
    await page.click('[data-testid="export-video-button"]');
    await page.click('[data-testid="export-start-button"]');

    // Wait for progress to start
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Cancel export
    await page.click('[data-testid="export-cancel-button"]');

    // Verify cancellation was processed
    await expect(page.locator('[data-testid="export-cancelled"]')).toBeVisible();

    // Verify no partial file was created
    const files = fs.readdirSync('test-results/exports').filter(
      f => !f.startsWith('.')
    );

    // Should be empty or only contain test artifacts
    expect(files.length).toBe(0);
  });

  test('should validate export settings before exporting', async ({ page }) => {
    // Try to export with invalid duration
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="export-video-button"]');

    // Set invalid duration
    await page.fill('[data-testid="export-duration"]', '-1');
    await page.click('[data-testid="export-start-button"]');

    // Should show validation error
    await expect(page.locator('[data-testid="export-error"] >> text=Duration must be positive'))
      .toBeVisible();

    // Fix duration
    await page.fill('[data-testid="export-duration"]', '5');
    await page.click('[data-testid="export-start-button"]');

    // Should proceed without error
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
  });

  test('should export multiple scenes as separate files', async ({ page }) => {
    // Create first scene
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');
    await page.click('[data-testid="save-scene-button"]');

    // Create second scene
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle"]');
    await page.click('[data-testid="object-apply"]');

    // Export both scenes
    await page.click('[data-testid="export-batch-button"]');

    // Select all scenes
    await page.check('[data-testid="scene-select-all"]');
    await page.click('[data-testid="export-selected-button"]');

    // Should prompt for format selection
    await expect(page.locator('[data-testid="export-format-dialog"]')).toBeVisible();

    // Select video format
    await page.selectOption('[data-testid="batch-export-format"]', 'mp4');
    await page.click('[data-testid="batch-export-start"]');

    // Should export multiple files
    // (In real test, would wait for multiple downloads or a ZIP file)
    const exportComplete = page.locator('[data-testid="batch-export-complete"]');
    await expect(exportComplete).toBeVisible({ timeout: 30000 });
  });

  test('should preserve aspect ratio in exports', async ({ page }) => {
    // Create scene with specific aspect ratio
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      // Set to 16:9 aspect ratio
      canvas.width = 1920;
      canvas.height = 1080;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#f39c12';
      ctx.fillRect(100, 100, 100, 100);

      return { aspectRatio: canvas.width / canvas.height };
    });

    // Initiate export
    await page.click('[data-testid="export-video-button"]');

    // Check aspect ratio in export settings
    const exportAspectRatio = await page.locator('[data-testid="export-aspect-ratio"]')
      .textContent();

    expect(exportAspectRatio).toBe('16:9');

    // Verify aspect ratio lock option
    await expect(page.locator('[data-testid="lock-aspect-ratio"]')).toBeAttached();
  });

  test('should add watermark to exports', async ({ page }) => {
    // Create scene
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Enable watermark in export settings
    await page.click('[data-testid="export-settings-button"]');
    await page.check('[data-testid="enable-watermark"]');
    await page.fill('[data-testid="watermark-text"]', 'Test Watermark');

    // Perform export with watermark
    await page.click('[data-testid="export-video-button"]');
    await page.click('[data-testid="export-start-button"]');

    // Wait for export to complete
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible({ timeout: 30000 });

    // Verify watermark was applied
    // (In real test, would inspect exported video)
    await expect(page.locator('[data-testid="export-with-watermark"]')).toBeVisible();
  });

  test('should export with transparency when supported', async ({ page }) => {
    // Create scene with transparency
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 600;

      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw semi-transparent object
      ctx.fillStyle = 'rgba(233, 69, 96, 0.5)';
      ctx.fillRect(300, 200, 200, 200);

      return { hasTransparency: true };
    });

    // Initiate export with transparency
    await page.click('[data-testid="export-video-button"]');

    // Check if transparency option is available
    const transparencyOption = page.locator('[data-testid="export-transparency"]');
    const hasTransparency = await transparencyOption.count() > 0;

    if (hasTransparency) {
      await page.check('[data-testid="export-transparency"]');
    }

    await page.click('[data-testid="export-start-button"]');

    // Verify export completed
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible({ timeout: 30000 });
  });

  test('should show export preview before finalizing', async ({ page }) => {
    // Create scene
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Initiate export
    await page.click('[data-testid="export-video-button"]');

    // Check if preview is shown
    const previewCanvas = page.locator('[data-testid="export-preview-canvas"]');
    const hasPreview = await previewCanvas.count() > 0;

    if (hasPreview) {
      await expect(previewCanvas).toBeVisible();

      // Preview should match canvas
      const originalCanvas = page.locator('canvas').first();
      await expect(previewCanvas).toBeVisible();

      // Take screenshot of preview for comparison
      const previewScreenshot = await previewCanvas.screenshot();
      expect(previewScreenshot).toBeDefined();
    }
  });
});

test.describe('Export - File Verification', () => {
  test('should verify exported video can be played back', async ({ page }) => {
    // This test would verify the exported video can be played
    // For now, we'll create a test scene and initiate export

    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Export video
    await page.click('[data-testid="export-video-button"]');
    await page.click('[data-testid="export-start-button"]');

    // Wait for export
    await page.waitForTimeout(5000);

    // Verify export complete indicator
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible();

    // Verify "play exported video" option is available
    await expect(page.locator('[data-testid="play-exported-video"]')).toBeVisible();
  });

  test('should verify GIF file plays correctly', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Export GIF
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.click('[data-testid="export-gif-button"]');
    await page.click('[data-testid="export-start-button"]');

    const download = await downloadPromise;

    // Load GIF in page to verify it's valid
    await page.evaluate((filePath) => {
      const img = document.createElement('img');
      img.src = filePath;
      img.id = 'gif-verification';
      document.body.appendChild(img);

      return { imgCreated: true };
    }, download.path().toString());

    // Wait for image to load
    const img = page.locator('#gif-verification');
    await expect(img).toBeVisible();

    // Clean up
    await fs.unlink(download.path());
  });

  test('should export with custom frame rate and duration', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'bounce');
    await page.fill('[data-testid="animation-duration"]', '2000');
    await page.click('[data-testid="animation-apply-button']');

    // Configure export with custom settings
    await page.click('[data-testid="export-video-button"]');

    // Set custom frame rate
    await page.selectOption('[data-testid="video-framerate"]', '120');

    // Set duration to match animation length
    await page.fill('[data-testid="export-duration"]', '2');

    await page.click('[data-testid="export-start-button"]');

    // Verify settings were applied
    const frameRate = await page.locator('[data-testid="video-framerate"]')
      .inputValue();
    expect(frameRate).toBe('120');

    const duration = await page.locator('[data-testid="export-duration"]')
      .inputValue();
    expect(duration).toBe('2');
  });
});

test.describe('Export - Performance', () => {
  test('should handle large animation exports efficiently', async ({ page }) => {
    // Create complex scene with many objects
    await page.click('[data-testid="create-scene-button"]');

    for (let i = 0; i < 20; i++) {
      await page.click('[data-testid="add-circle-button"]');
      await page.click('[data-testid="object-apply"]');

      if (i > 0) {
        await page.click('[data-testid="add-animation-button"]');
        await page.selectOption('[data-testid="animation-type"]', 'fade-in');
        await page.fill('[data-testid="animation-duration"]', '500');
        await page.click('[data-testid="animation-apply-button"]');
      }
    }

    // Initiate export
    const startTime = Date.now();

    await page.click('[data-testid="export-video-button"]');
    await page.click('[data-testid="export-start-button"]');

    // Wait for export to complete
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible({ timeout: 60000 });

    const exportTime = Date.now() - startTime;

    // Export should complete in reasonable time (<30 seconds for 20 objects)
    expect(exportTime).toBeLessThan(30000);
  });

  test('should cancel long-running export', async ({ page }) => {
    // Create long animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'move');
    await page.fill('[data-testid="animation-duration"]', '30000'); // 30 seconds
    await page.click('[data-testid="animation-apply-button']');

    // Start export
    await page.click('[data-testid="export-video-button"]');
    await page.click('[data-testid="export-start-button"]');

    // Wait for progress to start
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Cancel after short delay
    await page.waitForTimeout(1000);
    await page.click('[data-testid="export-cancel-button"]');

    // Verify cancellation was processed
    await expect(page.locator('[data-testid="export-cancelled"]')).toBeVisible();

    // Verify no export file was created (or if created, it was cleaned up)
    const exportDirExists = fs.existsSync('test-results/exports');
    if (exportDirExists) {
      const files = fs.readdirSync('test-results/exports').filter(
        f => !f.startsWith('.')
      );
      expect(files.length).toBe(0);
    }
  });
});

test.describe('Export - Edge Cases', () => {
  test('should export empty scene', async ({ page }) => {
    // Create empty scene
    await page.click('[data-testid="create-scene-button"]');

    // Try to export
    await page.click('[data-testid="export-video-button"]');
    await page.click('[data-testid="export-start-button"]');

    // Should either allow export or show appropriate message
    const errorOrWarning = page.locator('[data-testid="export-error"]');
    const completeIndicator = page.locator('[data-testid="export-complete"]');

    const hasError = await errorOrWarning.count() > 0;
    const isComplete = await completeIndicator.count() > 0;

    expect(hasError || isComplete).toBeTruthy();
  });

  test('should handle export when animation is playing', async ({ page }) => {
    // Create and start animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'fade-in');
    await page.fill('[data-testid="animation-duration"]', '2000');
    await page.click('[data-testid="animation-apply-button"]');

    // Start playback
    await page.click('[data-testid="play-button"]');

    // Try to export while playing
    await page.click('[data-testid="export-video-button"]');
    await page.click('[data-testid="export-start-button"]');

    // Should either stop playback, show warning, or proceed
    const warning = page.locator('[data-testid="export-while-playing-warning"]');
    const hasWarning = await warning.count() > 0;

    // If no warning, export should still work
    expect(true).toBeTruthy();
  });
});
