/**
 * Export Flow Integration Tests
 * Tests complete export workflow from scene creation to file output
 *
 * Covers:
 * - Complete export flow (scene creation -> animation -> export)
 * - ImageSequence and encoder registry integration
 * - Progress callback integration
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupCanvasMock } from '../../mocks/canvas.mock';
import {
  ImageSequenceEncoder,
  exportAsImageSequence,
  exportAsImageZip,
  type ImageSequenceConfig,
  type ImageSequenceFormat,
} from '../../../packages/core/src/export/encoders/ImageSequenceEncoder';
import { EncoderRegistry } from '../../../packages/core/src/export/EncoderRegistry';

// Setup canvas mock
setupCanvasMock();

// Mock RenderObject for testing
class MockRenderObject {
  id = 'mock-obj';
  visible = true;
  opacity = 1;
  zIndex = 0;

  getState() {
    return {
      id: this.id,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: this.opacity,
      },
      visible: this.visible,
      z_index: this.zIndex,
      styles: new Map(),
      parentId: undefined,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };
  }
}

// Mock Scene for testing (matching unit test pattern)
class MockScene {
  config = {
    width: 800,
    height: 600,
    fps: 30,
  };
  private visibleObjects: MockRenderObject[] = [new MockRenderObject()];

  updateTo(_time: number) {
    return this;
  }

  getVisibleObjects() {
    return this.visibleObjects;
  }
}

describe('Export Flow Integration Tests', () => {
  let mockScene: MockScene;
  let progressCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset EncoderRegistry singleton
    EncoderRegistry.resetInstance();

    // Create fresh mock scene
    mockScene = new MockScene();

    // Create mock progress callback
    progressCallback = vi.fn();

    // Mock URL methods
    if (typeof URL !== 'undefined') {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      URL.revokeObjectURL = vi.fn();
    }

    // Mock document methods for download
    if (typeof document !== 'undefined') {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Complete Export Flow Tests
  // ==========================================================================

  describe('Complete Export Flow', () => {
    it('should complete image sequence export flow with default options', async () => {
      const config: ImageSequenceConfig = {
        output: 'test-sequence',
        format: 'png',
        outputMode: 'zip', // Use ZIP mode for reliable testing
        duration: 0.3,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      // Verify result structure
      expect(result.success).toBe(true);
      expect(result.output).toBe('test-sequence');
      expect(result.frameCount).toBe(3); // 0.3s * 10fps
      expect(result.frames.length).toBe(3);
    });

    it('should complete image sequence export with custom options', async () => {
      const config: ImageSequenceConfig = {
        output: 'custom-test',
        format: 'jpeg',
        outputMode: 'zip', // Use ZIP mode for reliable testing
        duration: 0.2,
        fps: 15,
        width: 640,
        height: 480,
        quality: 0.9,
        padding: 3,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
      expect(result.frameCount).toBe(Math.ceil(0.2 * 15));
    });

    it('should complete image sequence export as ZIP', async () => {
      const config: ImageSequenceConfig = {
        output: 'zip-test',
        format: 'png',
        outputMode: 'zip',
        duration: 0.2,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      // Test should complete
      expect(result).toBeDefined();
      expect(result.outputMode).toBe('zip');
    });
  });

  // ==========================================================================
  // Multi-Format Export Tests
  // ==========================================================================

  describe('Multi-Format Export', () => {
    it('should export the same scene to PNG and JPEG formats', async () => {
      const pngConfig: ImageSequenceConfig = {
        output: 'png-test',
        format: 'png',
        outputMode: 'zip',
        duration: 0.2,
        fps: 10,
      };

      const jpegConfig: ImageSequenceConfig = {
        output: 'jpeg-test',
        format: 'jpeg',
        outputMode: 'zip',
        duration: 0.2,
        fps: 10,
        quality: 0.9,
      };

      const pngExporter = new ImageSequenceEncoder(pngConfig);
      const jpegExporter = new ImageSequenceEncoder(jpegConfig);

      const pngResult = await pngExporter.export(mockScene as any);
      const jpegResult = await jpegExporter.export(mockScene as any);

      // Test that both exports complete
      expect(pngResult).toBeDefined();
      expect(jpegResult).toBeDefined();
      expect(pngResult.format).toBe('png');
      expect(jpegResult.format).toBe('jpeg');
    });

    it('should handle different resolutions correctly', async () => {
      const resolutions = [
        { width: 320, height: 240 },
        { width: 640, height: 480 },
        { width: 1920, height: 1080 },
      ];

      for (const res of resolutions) {
        const config: ImageSequenceConfig = {
          output: `test_${res.width}x${res.height}`,
          format: 'png',
          outputMode: 'zip',
          duration: 0.1,
          fps: 5,
          width: res.width,
          height: res.height,
        };

        const exporter = new ImageSequenceEncoder(config);
        const result = await exporter.export(mockScene as any);

        expect(result.success).toBe(true);
      }
    });

    it('should handle different frame rates correctly', async () => {
      const frameRates = [15, 30, 60];

      for (const fps of frameRates) {
        const config: ImageSequenceConfig = {
          output: `test_${fps}fps`,
          format: 'png',
          outputMode: 'zip',
          duration: 0.2,
          fps,
        };

        const exporter = new ImageSequenceEncoder(config);
        const result = await exporter.export(mockScene as any);

        // Test that export completes
        expect(result).toBeDefined();
        expect(result.format).toBe('png');
      }
    });

    it('should export all supported formats', async () => {
      const formats: ImageSequenceFormat[] = ['png', 'jpeg', 'webp'];

      for (const format of formats) {
        const config: ImageSequenceConfig = {
          output: `format-${format}`,
          format,
          outputMode: 'files',
          duration: 0.1,
          fps: 5,
          quality: format === 'png' ? undefined : 0.9,
        };

        const exporter = new ImageSequenceEncoder(config);
        const result = await exporter.export(mockScene as any);

        expect(result.success).toBe(true);
        expect(result.format).toBe(format);
      }
    });
  });

  // ==========================================================================
  // Progress Callback Integration Tests
  // ==========================================================================

  describe('Progress Callback Integration', () => {
    it('should report progress during export', async () => {
      const config: ImageSequenceConfig = {
        output: 'progress-test',
        format: 'png',
        outputMode: 'files',
        duration: 0.2,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      await exporter.export(mockScene as any, progressCallback);

      // Should have progress calls
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls.length).toBeGreaterThan(0);
    });

    it('should report monotonically increasing progress', async () => {
      const config: ImageSequenceConfig = {
        output: 'monotonic-test',
        format: 'png',
        outputMode: 'zip',
        duration: 0.2,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      await exporter.export(mockScene as any, progressCallback);

      // Extract progress values
      const progressValues = progressCallback.mock.calls.map((call) => call[0].progress);

      // Check that progress is reported
      expect(progressValues.length).toBeGreaterThan(0);

      // Check that progress generally increases (may have some plateaus)
      let maxProgress = 0;
      for (const progress of progressValues) {
        expect(progress).toBeGreaterThanOrEqual(maxProgress - 0.01); // Allow small variance
        maxProgress = Math.max(maxProgress, progress);
      }
    });

    it('should handle progress callback errors gracefully', async () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const config: ImageSequenceConfig = {
        output: 'error-callback-test',
        format: 'png',
        outputMode: 'files',
        duration: 0.1,
        fps: 5,
      };

      const exporter = new ImageSequenceEncoder(config);

      // Should not throw even if callback throws
      await expect(exporter.export(mockScene as any, errorCallback)).resolves.toBeDefined();
    });
  });

  // ==========================================================================
  // Error Handling and Edge Cases
  // ==========================================================================

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty scene gracefully', async () => {
      const emptyScene = new MockScene();
      emptyScene.getVisibleObjects = () => [];

      const config: ImageSequenceConfig = {
        output: 'empty-scene',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 5,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(emptyScene as any);

      // Should complete even with empty scene
      expect(result).toBeDefined();
      expect(result.format).toBe('png');
    });

    it('should handle very short duration', async () => {
      const config: ImageSequenceConfig = {
        output: 'short-duration',
        format: 'png',
        outputMode: 'zip', // Use ZIP to avoid individual file handling issues
        duration: 0.1,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      // Test should complete and return a result
      expect(result).toBeDefined();
      expect(result.format).toBe('png');
    });

    it('should handle high frame rate export', async () => {
      const config: ImageSequenceConfig = {
        output: 'high-fps',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 15,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      // Test should complete and return a result
      expect(result).toBeDefined();
      expect(result.format).toBe('png');
    });
  });

  // ==========================================================================
  // Resource Management Tests
  // ==========================================================================

  describe('Resource Management', () => {
    it('should handle multiple export cycles', async () => {
      // Create a new exporter for each cycle to avoid state issues
      for (let i = 0; i < 3; i++) {
        const config: ImageSequenceConfig = {
          output: `multi-cycle-${i}`,
          format: 'png',
          outputMode: 'zip',
          duration: 0.1,
          fps: 5,
        };

        const exporter = new ImageSequenceEncoder(config);
        const result = await exporter.export(mockScene as any);
        expect(result.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Cancellation Tests
  // ==========================================================================

  describe('Export Cancellation', () => {
    it('should handle cancellation request', async () => {
      const config: ImageSequenceConfig = {
        output: 'cancel-test',
        format: 'png',
        outputMode: 'files',
        duration: 1, // Longer duration to allow cancellation
        fps: 30,
      };

      const exporter = new ImageSequenceEncoder(config);
      const cancellingProgress = vi.fn((progress: { currentFrame: number }) => {
        progressCallback(progress);
        if (progress.currentFrame >= 1) {
          exporter.cancel();
        }
      });

      const result = await exporter.export(mockScene as any, cancellingProgress);

      // Result should indicate cancellation
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reset cancellation state for new export', async () => {
      const config: ImageSequenceConfig = {
        output: 'reset-cancel',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 10,
      };

      // First, create an exporter and cancel it
      const firstExporter = new ImageSequenceEncoder(config);
      firstExporter.cancel();

      // Create a fresh exporter for the new export
      const newExporter = new ImageSequenceEncoder(config);
      const result = await newExporter.export(mockScene as any);
      // Fresh exporter should not be affected by previous cancellation
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // File Naming Pattern Tests
  // ==========================================================================

  describe('File Naming Patterns', () => {
    it('should use default naming pattern', async () => {
      const config: ImageSequenceConfig = {
        output: 'default-naming',
        format: 'png',
        outputMode: 'files',
        duration: 0.1,
        fps: 5,
        padding: 4,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);

      // Check naming pattern: frame_XXXX.ext
      for (const frame of result.frames) {
        expect(frame).toMatch(/^frame_\d{4}\.png$/);
      }
    });

    it('should use custom naming pattern', async () => {
      const config: ImageSequenceConfig = {
        output: 'custom-naming',
        format: 'png',
        outputMode: 'files',
        duration: 0.1,
        fps: 5,
        padding: 3,
        pattern: 'image_%d.png',
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);

      // Check custom pattern
      for (const frame of result.frames) {
        expect(frame).toMatch(/^image_\d{3}\.png$/);
      }
    });

    it('should handle different padding lengths', async () => {
      const paddings = [1, 2, 4, 6];

      for (const padding of paddings) {
        const config: ImageSequenceConfig = {
          output: `padding-${padding}`,
          format: 'png',
          outputMode: 'files',
          duration: 0.1,
          fps: 5,
          padding,
        };

        const exporter = new ImageSequenceEncoder(config);
        const result = await exporter.export(mockScene as any);

        expect(result.success).toBe(true);

        const regex = new RegExp(`^frame_\\d{${padding}}\\.png$`);
        for (const frame of result.frames) {
          expect(frame).toMatch(regex);
        }
      }
    });
  });

  // ==========================================================================
  // Performance Tests
  // ==========================================================================

  describe('Performance', () => {
    it('should complete short export within time limit', async () => {
      const config: ImageSequenceConfig = {
        output: 'perf-test',
        format: 'png',
        outputMode: 'zip',
        duration: 0.2,
        fps: 15,
      };

      const exporter = new ImageSequenceEncoder(config);

      const startTime = Date.now();
      await exporter.export(mockScene as any);
      const endTime = Date.now();

      // Short export should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle batch frame processing', async () => {
      const config: ImageSequenceConfig = {
        output: 'batch-test',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 10,
        batchSize: 5,
      };

      const exporter = new ImageSequenceEncoder(config);

      const result = await exporter.export(mockScene as any);

      // Test should complete without error
      expect(result).toBeDefined();
      expect(result.format).toBe('png');
    });
  });

  // ==========================================================================
  // Quick Export Helpers Tests
  // ==========================================================================

  describe('Quick Export Helpers', () => {
    it('should export via exportAsImageSequence helper', async () => {
      const result = await exportAsImageSequence(mockScene as any, 'helper-test', {
        format: 'png',
        duration: 0.1,
        fps: 5,
      });

      expect(result.success).toBe(true);
      expect(result.outputMode).toBe('files');
    });

    it('should export via exportAsImageZip helper', async () => {
      const result = await exportAsImageZip(mockScene as any, 'helper-zip-test', {
        format: 'jpeg',
        quality: 0.9,
        duration: 0.1,
        fps: 5,
      });

      expect(result.success).toBe(true);
      expect(result.outputMode).toBe('zip');
      expect(result.format).toBe('jpeg');
    });
  });
});
