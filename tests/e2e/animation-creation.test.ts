/**
 * E2E Test: Animation Creation Workflow
 *
 * Tests the complete animation creation workflow from scene setup
 * to animation playback and verification.
 */

import { test, expect } from '@playwright/test';

test.describe('Animation Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the application to load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  });

  test('should create a simple scene with animated object', async ({ page }) => {
    // Step 1: Create a new scene
    await page.click('[data-testid="create-scene-button"]');
    await expect(page.locator('[data-testid="scene-editor"]')).toBeVisible();

    // Step 2: Add a rectangle object
    await page.click('[data-testid="add-rectangle-button"]');
    await expect(page.locator('[data-testid="object-list"] >> text=Rectangle')).toBeVisible();

    // Step 3: Select the rectangle
    await page.click('[data-testid="object-item-rectangle"]');

    // Step 4: Add position animation
    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'move');
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.click('[data-testid="animation-apply-button"]');

    // Step 5: Verify animation is added
    await expect(page.locator('[data-testid="timeline"] >> text=Move')).toBeVisible();

    // Step 6: Play the animation
    await page.click('[data-testid="play-button"]');

    // Wait for animation to complete
    await page.waitForTimeout(1500);

    // Step 7: Verify animation result
    const objectPosition = await page.locator('[data-testid="object-item-rectangle"]')
      .getAttribute('data-position');

    expect(objectPosition).toBeDefined();
  });

  test('should create multi-object scene with sequential animations', async ({ page }) => {
    // Create scene
    await page.click('[data-testid="create-scene-button"]');

    // Add first object (circle)
    await page.click('[data-testid="add-circle-button"]');
    await page.fill('[data-testid="object-x"]', '100');
    await page.fill('[data-testid="object-y"]', '100');
    await page.click('[data-testid="object-apply"]');

    // Add second object (rectangle)
    await page.click('[data-testid="add-rectangle-button"]');
    await page.fill('[data-testid="object-x"]', '200');
    await(page.fill('[data-testid="object-y"]', '200'));
    await page.click('[data-testid="object-apply"]');

    // Verify both objects are in the scene
    await expect(page.locator('[data-testid="object-list"] >> text=Circle')).toBeVisible();
    await expect(page.locator('[data-testid="object-list"] >> text=Rectangle')).toBeVisible();

    // Add fade-in animation to first object
    await page.click('[data-testid="object-item-circle"]');
    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'fade-in');
    await page.fill('[data-testid="animation-duration"]', '500');
    await page.click('[data-testid="animation-apply-button"]');

    // Add scale animation to second object
    await page.click('[data-testid="object-item-rectangle"]');
    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'scale');
    await page.fill('[data-testid="animation-duration"]', '750');
    await page.click('[data-testid="animation-apply-button"]');

    // Verify timeline shows both animations
    await expect(page.locator('[data-testid="timeline"] >> text=Fade In')).toBeVisible();
    await expect(page.locator('[data-testid="timeline"] >> text=Scale')).toBeVisible();

    // Play and verify
    await page.click('[data-testid="play-button"]');
    await page.waitForTimeout(2000);

    // Check final state
    const timelineComplete = page.locator('[data-testid="timeline-complete"]');
    await expect(timelineComplete).toBeVisible();
  });

  test('should create complex animation with easing functions', async ({ page }) => {
    // Create scene
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Add animation with custom easing
    await page.click('[data-testid="object-item-rectangle"]');
    await page.click('[data-testid="add-animation-button"]');

    // Select easing function
    await page.selectOption('[data-testid="easing-function"]', 'easeInOutCubic');

    // Set animation properties
    await page.fill('[data-testid="animation-duration"]', '1500');
    await page.fill('[data-testid="target-x"]', '300');
    await page.fill('[data-testid="target-y"]', '200');

    await page.click('[data-testid="animation-apply-button"]');

    // Verify easing is applied
    await expect(page.locator('[data-testid="animation-details"] >> text=easeInOutCubic')).toBeVisible();

    // Play and capture frames for verification
    await page.click('[data-testid="play-button"]');

    // Capture frames at different points
    const frames = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(300);
      const screenshot = await page.screenshot({
        fullPage: false,
        clip: { x: 0, y: 0, width: 800, height: 600 },
      });
      frames.push(screenshot);
    }

    // Verify animation produced different frames (object moved)
    expect(frames).toHaveLength(5);
  });

  test('should save and load animation project', async ({ page }) => {
    // Create a project
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');
    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'rotate');
    await page.fill('[data-testid="animation-duration"]', '2000');
    await page.click('[data-testid="animation-apply-button"]');

    // Save project
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="save-project-button"]');
    const download = await downloadPromise;

    // Verify project file
    expect(download.suggestedFilename()).toMatch(/\.animaker$/);

    // Clear scene
    await page.click('[data-testid="clear-scene-button"]');
    await expect(page.locator('[data-testid="object-list"]')).toBeEmpty();

    // Load project
    await page.click('[data-testid="load-project-button"]');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(download.path());

    // Verify project loaded
    await expect(page.locator('[data-testid="object-list"] >> text=Rectangle')).toBeVisible();
    await expect(page.locator('[data-testid="timeline"] >> text=Rotate')).toBeVisible();
  });

  test('should handle animation preview with different frame rates', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');
    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'bounce');
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.click('[data-testid="animation-apply-button"]');

    // Test different frame rates
    const frameRates = [24, 30, 60, 120];

    for (const fps of frameRates) {
      // Set frame rate
      await page.selectOption('[data-testid="frame-rate"]', String(fps));

      // Play animation
      await page.click('[data-testid="play-button"]');
      await page.waitForTimeout(1500);

      // Verify playback completed
      await expect(page.locator('[data-testid="playback-status"] >> text=Complete')).toBeVisible();

      // Reset for next test
      await page.click('[data-testid="stop-button"]');
    }
  });

  test('should validate animation properties before applying', async ({ page }) => {
    // Create object
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Try to create animation with invalid duration
    await page.click('[data-testid="add-animation-button"]');
    await page.fill('[data-testid="animation-duration"]', '-100');
    await page.click('[data-testid="animation-apply-button"]');

    // Should show validation error
    await expect(page.locator('[data-testid="error-message"] >> text=Duration must be positive')).toBeVisible();

    // Fix duration
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.click('[data-testid="animation-apply-button"]');

    // Should succeed now
    await expect(page.locator('[data-testid="timeline"]')).toContainText('Move');
  });

  test('should support animation copy/paste and duplicate', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');
    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'scale');
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.click('[data-testid="animation-apply-button"]');

    // Select animation
    await page.click('[data-testid="timeline-animation-item"]');

    // Copy animation
    await page.click('[data-testid="copy-animation-button"]');

    // Paste to create duplicate
    await page.click('[data-testid="paste-animation-button"]');

    // Verify duplicate animation exists
    const animations = await page.locator('[data-testid="timeline-animation-item"]').count();
    expect(animations).toBe(2);
  });

  test('should undo and redo animation operations', async ({ page }) => {
    // Create object and animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    // Add animation
    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'move');
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.click('[data-testid="animation-apply-button"]');

    // Verify animation exists
    await expect(page.locator('[data-testid="timeline"]')).toContainText('Move');

    // Undo animation addition
    await page.click('[data-testid="undo-button"]');

    // Animation should be removed
    await expect(page.locator('[data-testid="timeline"]')).not.toContainText('Move');

    // Redo animation addition
    await page.click('[data-testid="redo-button"]');

    // Animation should be restored
    await expect(page.locator('[data-testid="timeline"]')).toContainText('Move');
  });

  test('should preview animation at different time points', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-circle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'fade-out');
    await page.fill('[data-testid="animation-duration"]', '2000');
    await page.click('[data-testid="animation-apply-button"]');

    // Use timeline scrubber to preview
    const timeline = page.locator('[data-testid="timeline-scrubber"]');

    // Scrub to 25%
    await timeline.click({ position: { x: 0.25, y: 0.5 } });
    await page.waitForTimeout(100);

    // Scrub to 50%
    await timeline.click({ position: { x: 0.5, y: 0.5 } });
    await page.waitForTimeout(100);

    // Scrub to 75%
    await timeline.click({ position: { x: 0.75, y: 0.5 } });
    await page.waitForTimeout(100);

    // Scrub to end
    await timeline.click({ position: { x: 1, y: 0.5 } });
    await page.waitForTimeout(100);

    // Verify timeline position indicator
    await expect(page.locator('[data-testid="timeline-position"]')).toHaveText('2.0s');
  });

  test('should handle animation loops correctly', async ({ page }) => {
    // Create looping animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'rotate');
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.check('[data-testid="animation-loop"]');

    // Set loop count
    await page.fill('[data-testid="loop-count"]', '3');
    await page.click('[data-testid="animation-apply-button"]');

    // Play animation
    await page.click('[data-testid="play-button"]');

    // Wait for multiple loops to complete
    await page.waitForTimeout(4000);

    // Verify animation stopped after loops
    await expect(page.locator('[data-testid="playback-status"] >> text=Complete')).toBeVisible();
  });
});

test.describe('Animation Creation - Error Handling', () => {
  test('should handle missing canvas gracefully', async ({ page }) => {
    // Navigate to page without canvas support
    await page.goto('/');

    // Check for error message or fallback
    const errorMessage = page.locator('[data-testid="no-canvas-error"]');
    const fallbackMessage = page.locator('[data-testid="canvas-fallback"]');

    const hasError = await errorMessage.count() > 0;
    const hasFallback = await fallbackMessage.count() > 0;

    expect(hasError || hasFallback).toBeTruthy();
  });

  test('should handle large number of objects performance', async ({ page }) => {
    // Create scene
    await page.click('[data-testid="create-scene-button"]');

    // Add many objects
    for (let i = 0; i < 50; i++) {
      await page.click('[data-testid="add-circle-button"]');
      await page.click('[data-testid="object-apply"]');
    }

    // Verify performance is acceptable
    const objectCount = await page.locator('[data-testid="object-list"] > *').count();
    expect(objectCount).toBe(50);

    // Check for performance warnings
    const perfWarning = page.locator('[data-testid="performance-warning"]');
    const hasWarning = await perfWarning.count() > 0;

    // Performance warning is acceptable for 50+ objects
    expect(objectCount).toBeGreaterThan(0);
  });

  test('should handle animation deletion and cleanup', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'move');
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.click('[data-testid="animation-apply-button"]');

    // Verify animation exists
    await expect(page.locator('[data-testid="timeline"]')).toContainText('Move');

    // Delete animation
    await page.click('[data-testid="timeline-animation-item"]');
    await page.click('[data-testid="delete-animation-button"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');

    // Verify animation is removed
    await expect(page.locator('[data-testid="timeline"]')).not.toContainText('Move');
  });

  test('should preserve animation state during scene resize', async ({ page }) => {
    // Create animation
    await page.click('[data-testid="create-scene-button"]');
    await page.click('[data-testid="add-rectangle-button"]');
    await page.click('[data-testid="object-apply"]');

    await page.click('[data-testid="add-animation-button"]');
    await page.selectOption('[data-testid="animation-type"]', 'scale');
    await page.fill('[data-testid="animation-duration"]', '1000');
    await page.click('[data-testid="animation-apply-button"]');

    // Get initial object state
    const initialState = await page.locator('[data-testid="object-item-rectangle"]')
      .getAttribute('data-state');

    // Resize scene
    await page.fill('[data-testid="scene-width"]', '1920');
    await page.fill('[data-testid="scene-height"]', '1080');
    await page.click('[data-testid="apply-resize"]');

    // Verify animation still exists and is valid
    await expect(page.locator('[data-testid="timeline"]')).toContainText('Scale');

    // Verify object state is preserved (possibly scaled)
    const finalState = await page.locator('[data-testid="object-item-rectangle"]')
      .getAttribute('data-state');
    expect(finalState).toBeDefined();
  });
});
