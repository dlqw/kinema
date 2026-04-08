/**
 * E2E Test Fixtures - Export Test Utilities
 *
 * Provides fixtures, mock data, and helper functions for E2E export testing.
 *
 * @module tests/e2e/fixtures/export-fixtures
 */

import { Page } from '@playwright/test';

/**
 * Export test configuration
 */
export const exportTestConfig = {
  defaultTimeout: 30000,
  exportTimeout: 60000,
  mp4ExportTimeout: 120000, // MP4 with FFmpeg.wasm takes longer
  canvasWidth: 800,
  canvasHeight: 600,
  highResWidth: 1920,
  highResHeight: 1080,
} as const;

/**
 * Test scene configurations
 */
export const testSceneConfigs = {
  basic: {
    objects: ['circle'],
    animations: [{ type: 'fade-in', duration: 500 }],
  },
  complex: {
    objects: ['circle', 'rectangle', 'text'],
    animations: [
      { type: 'fade-in', duration: 500 },
      { type: 'move', duration: 1000 },
      { type: 'scale', duration: 750 },
    ],
  },
  animated: {
    objects: ['circle'],
    animations: [{ type: 'bounce', duration: 2000, loop: true, loopCount: 3 }],
  },
  transparent: {
    objects: ['circle'],
    animations: [],
    transparent: true,
  },
} as const;

/**
 * Export format configurations
 */
export const formatConfigs = {
  png: {
    extension: 'png',
    mimeType: 'image/png',
    headerHex: '89504e47',
  },
  jpeg: {
    extension: 'jpg',
    mimeType: 'image/jpeg',
    headerHex: 'ffd8ff',
  },
  webp: {
    extension: 'webp',
    mimeType: 'image/webp',
    headerHex: '52494646',
  },
  gif: {
    extension: 'gif',
    mimeType: 'image/gif',
    headerHex: '47494638',
  },
  webm: {
    extension: 'webm',
    mimeType: 'video/webm',
    headerHex: '1a45dfa3',
  },
  mp4: {
    extension: 'mp4',
    mimeType: 'video/mp4',
    headerHex: '000000', // MP4 has variable header
  },
} as const;

/**
 * Quality presets for export testing
 */
export const qualityPresets = {
  low: {
    jpeg: 0.5,
    webp: 0.5,
    videoBitrate: 1000000,
    gifColors: 64,
  },
  medium: {
    jpeg: 0.75,
    webp: 0.75,
    videoBitrate: 2500000,
    gifColors: 128,
  },
  high: {
    jpeg: 0.9,
    webp: 0.9,
    videoBitrate: 5000000,
    gifColors: 256,
  },
  maximum: {
    jpeg: 1.0,
    webp: 1.0,
    videoBitrate: 10000000,
    gifColors: 256,
  },
} as const;

/**
 * Resolution presets for export testing
 */
export const resolutionPresets = {
  sd: { width: 640, height: 480, label: '480p' },
  hd: { width: 1280, height: 720, label: '720p' },
  fullHd: { width: 1920, height: 1080, label: '1080p' },
  ultraHd: { width: 3840, height: 2160, label: '4K' },
  square: { width: 512, height: 512, label: 'Square' },
  portrait: { width: 1080, height: 1920, label: 'Portrait' },
} as const;

/**
 * Helper class for managing test exports
 */
export class ExportTestHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to the application and wait for load
   */
  async navigateToApp(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForSelector('canvas', { timeout: 10000 });
  }

  /**
   * Create a test scene with specified configuration
   */
  async createTestScene(config: keyof typeof testSceneConfigs): Promise<void> {
    const sceneConfig = testSceneConfigs[config];

    // Click create scene button
    await this.page.click('[data-testid="create-scene-button"]');

    // Add objects
    for (const object of sceneConfig.objects) {
      await this.page.click(`[data-testid="add-${object}-button"]`);
      await this.page.click('[data-testid="object-apply"]');
    }

    // Add animations
    for (const anim of sceneConfig.animations) {
      await this.page.click('[data-testid="add-animation-button"]');
      await this.page.selectOption('[data-testid="animation-type"]', anim.type);
      await this.page.fill('[data-testid="animation-duration"]', String(anim.duration));

      if ('loop' in anim && anim.loop) {
        await this.page.check('[data-testid="animation-loop"]');
        if ('loopCount' in anim) {
          await this.page.fill('[data-testid="loop-count"]', String(anim.loopCount));
        }
      }

      await this.page.click('[data-testid="animation-apply-button"]');
    }
  }

  /**
   * Draw test content on canvas
   */
  async drawTestContent(
    options: {
      width?: number;
      height?: number;
      transparent?: boolean;
    } = {},
  ): Promise<void> {
    const { width = 800, height = 600, transparent = false } = options;

    await this.page.evaluate(
      ({ width, height, transparent }) => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!transparent) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Draw test pattern
        // Red circle
        ctx.fillStyle = transparent ? 'rgba(239, 71, 111, 0.8)' : '#ef476f';
        ctx.beginPath();
        ctx.arc(width * 0.25, height * 0.33, Math.min(width, height) * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Blue rectangle
        ctx.fillStyle = transparent ? 'rgba(17, 138, 178, 0.8)' : '#118ab2';
        ctx.fillRect(width * 0.4, height * 0.4, width * 0.15, height * 0.2);

        // Green triangle
        ctx.fillStyle = transparent ? 'rgba(6, 214, 160, 0.8)' : '#06d6a0';
        ctx.beginPath();
        ctx.moveTo(width * 0.7, height * 0.6);
        ctx.lineTo(width * 0.8, height * 0.8);
        ctx.lineTo(width * 0.6, height * 0.8);
        ctx.closePath();
        ctx.fill();
      },
      { width, height, transparent },
    );
  }

  /**
   * Open export dialog
   */
  async openExportDialog(): Promise<void> {
    await this.page.click('[data-testid="export-button"]');
    await this.page.waitForSelector('[data-testid="export-dialog"]', { timeout: 5000 });
  }

  /**
   * Configure export settings
   */
  async configureExport(settings: {
    format: string;
    quality?: keyof typeof qualityPresets;
    resolution?: keyof typeof resolutionPresets;
    customWidth?: number;
    customHeight?: number;
    additionalOptions?: Record<string, string>;
  }): Promise<void> {
    // Select format
    await this.page.selectOption('[data-testid="export-format"]', settings.format);

    // Set quality if specified
    if (settings.quality) {
      void qualityPresets[settings.quality];
      const qualitySelect = this.page.locator('[data-testid="export-quality"]');
      if ((await qualitySelect.count()) > 0) {
        await qualitySelect.selectOption(settings.quality);
      }
    }

    // Set resolution if specified
    if (settings.resolution) {
      const res = resolutionPresets[settings.resolution];
      const customResCheckbox = this.page.locator('[data-testid="custom-resolution"]');
      if ((await customResCheckbox.count()) > 0) {
        await customResCheckbox.check();
        await this.page.fill('[data-testid="export-width"]', String(res.width));
        await this.page.fill('[data-testid="export-height"]', String(res.height));
      }
    }

    // Set custom dimensions
    if (settings.customWidth && settings.customHeight) {
      const customResCheckbox = this.page.locator('[data-testid="custom-resolution"]');
      if ((await customResCheckbox.count()) > 0) {
        await customResCheckbox.check();
        await this.page.fill('[data-testid="export-width"]', String(settings.customWidth));
        await this.page.fill('[data-testid="export-height"]', String(settings.customHeight));
      }
    }

    // Apply additional options
    if (settings.additionalOptions) {
      for (const [key, value] of Object.entries(settings.additionalOptions)) {
        const locator = this.page.locator(`[data-testid="${key}"]`);
        const tagName = await locator.evaluate((el) => el.tagName.toLowerCase());

        if (tagName === 'select') {
          await locator.selectOption(value);
        } else if (tagName === 'input') {
          const inputType = await locator.getAttribute('type');
          if (inputType === 'checkbox') {
            if (value === 'true') {
              await locator.check();
            } else {
              await locator.uncheck();
            }
          } else {
            await locator.fill(value);
          }
        }
      }
    }
  }

  /**
   * Start export and wait for completion
   */
  async startExport(timeout = exportTestConfig.exportTimeout): Promise<{
    success: boolean;
    filename?: string;
    error?: string;
  }> {
    await this.page.click('[data-testid="export-start-button"]');

    try {
      const download = await this.page.waitForEvent('download', { timeout });
      const filename = download.suggestedFilename();

      return { success: true, filename };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Cancel ongoing export
   */
  async cancelExport(): Promise<void> {
    await this.page.click('[data-testid="export-cancel-button"]');
    await this.page.waitForSelector('[data-testid="export-cancelled"]', { timeout: 5000 });
  }

  /**
   * Check encoder availability
   */
  async checkEncoderAvailability(format: string): Promise<{
    available: boolean;
    reason?: string;
  }> {
    await this.openExportDialog();
    await this.page.selectOption('[data-testid="export-format"]', format);

    const warningLocator = this.page.locator('[data-testid="encoder-availability-warning"]');
    const hasWarning = (await warningLocator.count()) > 0;

    if (hasWarning) {
      const reason = await warningLocator.textContent();
      return { available: false, reason: reason || undefined } as {
        available: false;
        reason?: string;
      };
    }

    return { available: true };
  }

  /**
   * Get current export progress
   */
  async getExportProgress(): Promise<{
    percent: number;
    frame?: number;
    totalFrames?: number;
    timeRemaining?: string;
  } | null> {
    const progressLocator = this.page.locator('[data-testid="export-progress"]');
    const isVisible = await progressLocator.isVisible();

    if (!isVisible) {
      return null;
    }

    const progressBar = this.page.locator('[data-testid="export-progress-bar"]');
    const percent = await progressBar.getAttribute('aria-valuenow');

    const frameCounter = this.page.locator('[data-testid="export-frame-counter"]');
    const frameText = await frameCounter.textContent();

    const timeRemaining = this.page.locator('[data-testid="export-time-remaining"]');
    const timeText = await timeRemaining.textContent();

    let frame: number | undefined;
    let totalFrames: number | undefined;

    if (frameText) {
      const match = frameText.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        frame = parseInt(match[1]!, 10);
        totalFrames = parseInt(match[2]!, 10);
      }
    }

    return {
      percent: percent ? parseInt(percent, 10) : 0,
      ...(frame !== undefined ? { frame } : {}),
      ...(totalFrames !== undefined ? { totalFrames } : {}),
      ...(timeText ? { timeRemaining: timeText } : {}),
    };
  }

  /**
   * Wait for export to complete
   */
  async waitForCompletion(timeout = exportTestConfig.exportTimeout): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="export-complete"]', { timeout });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * File verification utilities
 */
export const fileVerification = {
  /**
   * Verify file integrity by checking header
   */
  verifyHeader(buffer: Buffer, format: keyof typeof formatConfigs): boolean {
    const config = formatConfigs[format];
    const header = buffer.slice(0, 4).toString('hex');
    return header.startsWith(config.headerHex.slice(0, header.length));
  },

  /**
   * Get file size category
   */
  getSizeCategory(size: number): 'tiny' | 'small' | 'medium' | 'large' | 'huge' {
    if (size < 1024) return 'tiny'; // < 1KB
    if (size < 10 * 1024) return 'small'; // < 10KB
    if (size < 100 * 1024) return 'medium'; // < 100KB
    if (size < 1024 * 1024) return 'large'; // < 1MB
    return 'huge'; // >= 1MB
  },

  /**
   * Check if file size is within expected range
   */
  isSizeInRange(
    size: number,
    expectedMin: number,
    expectedMax: number,
  ): { valid: boolean; reason?: string } {
    if (size < expectedMin) {
      return { valid: false, reason: `File too small: ${size} < ${expectedMin}` };
    }
    if (size > expectedMax) {
      return { valid: false, reason: `File too large: ${size} > ${expectedMax}` };
    }
    return { valid: true };
  },
};

/**
 * Browser capability detection
 */
export const browserCapabilities = {
  /**
   * Check WebM encoding support
   */
  async checkWebMSupport(page: Page): Promise<{
    vp8: boolean;
    vp9: boolean;
    any: boolean;
  }> {
    return page.evaluate(() => {
      return {
        vp8: MediaRecorder.isTypeSupported('video/webm;codecs=vp8'),
        vp9: MediaRecorder.isTypeSupported('video/webm;codecs=vp9'),
        any:
          MediaRecorder.isTypeSupported('video/webm') ||
          MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ||
          MediaRecorder.isTypeSupported('video/webm;codecs=vp9'),
      };
    });
  },

  /**
   * Check canvas export support
   */
  async checkCanvasSupport(page: Page): Promise<{
    toBlob: boolean;
    toDataURL: boolean;
    webp: boolean;
  }> {
    return page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return {
        toBlob: typeof canvas.toBlob === 'function',
        toDataURL: typeof canvas.toDataURL === 'function',
        webp: (() => {
          const dataUrl = canvas.toDataURL('image/webp');
          return dataUrl.startsWith('data:image/webp');
        })(),
      };
    });
  },

  /**
   * Check WebAssembly support (needed for FFmpeg.wasm)
   */
  async checkWebAssemblySupport(page: Page): Promise<boolean> {
    return page.evaluate(() => {
      return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    });
  },

  /**
   * Get all capability information
   */
  async getAllCapabilities(page: Page): Promise<{
    webm: { vp8: boolean; vp9: boolean; any: boolean };
    canvas: { toBlob: boolean; toDataURL: boolean; webp: boolean };
    webAssembly: boolean;
  }> {
    const [webm, canvas, webAssembly] = await Promise.all([
      this.checkWebMSupport(page),
      this.checkCanvasSupport(page),
      this.checkWebAssemblySupport(page),
    ]);

    return { webm, canvas, webAssembly };
  },
};

/**
 * Re-export types for test files
 */
export type ExportTestConfig = typeof exportTestConfig;
export type TestSceneConfig = (typeof testSceneConfigs)[keyof typeof testSceneConfigs];
export type FormatConfig = (typeof formatConfigs)[keyof typeof formatConfigs];
export type QualityPreset = (typeof qualityPresets)[keyof typeof qualityPresets];
export type ResolutionPreset = (typeof resolutionPresets)[keyof typeof resolutionPresets];
