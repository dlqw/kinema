/**
 * Error Handling and Fallback Integration Tests
 * Tests error scenarios, degradation strategies, and resource cleanup
 *
 * Covers:
 * - Export error scenarios
 * - Cancellation handling
 * - Resource cleanup on failure
 * - Progress callback error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupCanvasMock } from '../../mocks/canvas.mock';
import {
  ImageSequenceEncoder,
  type ImageSequenceConfig,
} from '../../../packages/core/src/export/encoders/ImageSequenceEncoder';
import { EncoderRegistry } from '../../../packages/core/src/export/EncoderRegistry';

// Setup canvas mock
setupCanvasMock();

// Mock Scene for testing (matching unit test pattern)
class MockScene {
  config = {
    width: 800,
    height: 600,
    fps: 30,
  };

  updateTo(_time: number) {
    return this;
  }

  getVisibleObjects() {
    return [];
  }
}

describe('Error Handling and Fallback Integration Tests', () => {
  let mockScene: MockScene;
  let progressCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    EncoderRegistry.resetInstance();
    mockScene = new MockScene();
    progressCallback = vi.fn();

    // Mock URL methods
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = vi.fn();

    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Scene Error Tests
  // ==========================================================================

  describe('Scene Errors', () => {
    it('should handle scene with no visible objects', async () => {
      const emptyScene = new MockScene();
      emptyScene.getVisibleObjects = () => [];

      const config: ImageSequenceConfig = {
        output: 'empty',
        format: 'png',
        outputMode: 'files',
        duration: 0.1,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(emptyScene as any);

      // Should succeed even with no visible objects
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Cancellation Tests
  // ==========================================================================

  describe('Export Cancellation', () => {
    it('should respect cancellation during image sequence export', async () => {
      const config: ImageSequenceConfig = {
        output: 'cancel-test',
        format: 'png',
        outputMode: 'files',
        duration: 0.5,
        fps: 30,
      };

      const exporter = new ImageSequenceEncoder(config);

      const exportPromise = exporter.export(mockScene as any, progressCallback);

      // Cancel immediately
      exporter.cancel();

      const result = await exportPromise;

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled');
    });

    it('should reset cancellation state for new export', async () => {
      const config: ImageSequenceConfig = {
        output: 'reset-cancel',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);

      // Cancel first
      exporter.cancel();
      exporter.resetCancel();

      // Should work now
      const result = await exporter.export(mockScene as any);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Progress Callback Error Handling
  // ==========================================================================

  describe('Progress Callback Errors', () => {
    it('should handle callback that throws error', async () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const config: ImageSequenceConfig = {
        output: 'callback-error',
        format: 'png',
        outputMode: 'files',
        duration: 0.1,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);

      // Should not throw even if callback throws
      const result = await exporter.export(mockScene as any, errorCallback);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Concurrent Export Error Handling
  // ==========================================================================

  describe('Concurrent Export Handling', () => {
    it('should handle multiple concurrent exports', async () => {
      const config: ImageSequenceConfig = {
        output: 'concurrent',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 10,
      };

      // Create multiple exporters
      const exporters = Array.from(
        { length: 3 },
        (_, i) => new ImageSequenceEncoder({ ...config, output: `concurrent-${i}` }),
      );

      // Start all exports
      const promises = exporters.map((exporter) => exporter.export(mockScene as any));

      // Wait for all
      const results = await Promise.all(promises);

      // All should succeed
      for (const result of results) {
        expect(result.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Edge Case Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle very short duration', async () => {
      const config: ImageSequenceConfig = {
        output: 'short',
        format: 'png',
        outputMode: 'files',
        duration: 0.01,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result).toBeDefined();
    });

    it('should handle very high FPS', async () => {
      const config: ImageSequenceConfig = {
        output: 'high-fps',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 120,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle unusual dimensions', async () => {
      const config: ImageSequenceConfig = {
        output: 'unusual-dims',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 5,
        width: 1,
        height: 1,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle extreme aspect ratio', async () => {
      const config: ImageSequenceConfig = {
        output: 'extreme-aspect',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 5,
        width: 1000,
        height: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Timeout Handling Tests
  // ==========================================================================

  describe('Timeout Handling', () => {
    it('should handle long-running export', async () => {
      const config: ImageSequenceConfig = {
        output: 'long-export',
        format: 'png',
        outputMode: 'zip',
        duration: 0.3,
        fps: 30, // 9 frames
      };

      const exporter = new ImageSequenceEncoder(config);

      // Should complete within reasonable time
      const startTime = Date.now();
      const result = await exporter.export(mockScene as any);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      // Should complete within 10 seconds
      expect(endTime - startTime).toBeLessThan(10000);
    }, 15000); // Increase test timeout
  });

  // ==========================================================================
  // Memory Error Tests
  // ==========================================================================

  describe('Memory Handling', () => {
    it('should handle large frame count', async () => {
      const config: ImageSequenceConfig = {
        output: 'large-frame-count',
        format: 'png',
        outputMode: 'zip',
        duration: 0.5,
        fps: 60, // 30 frames
        batchSize: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
    });

    it('should handle high resolution export', async () => {
      const config: ImageSequenceConfig = {
        output: 'high-res',
        format: 'jpeg',
        outputMode: 'zip',
        duration: 0.1,
        fps: 5,
        width: 1920,
        height: 1080,
        quality: 0.8,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Error Message Quality Tests
  // ==========================================================================

  describe('Error Message Quality', () => {
    it('should provide error for missing output', async () => {
      const config = { duration: 0.1, fps: 10 } as ImageSequenceConfig;

      const exporter = new ImageSequenceEncoder(config);

      // Should throw due to validation
      await expect(exporter.export(mockScene as any)).rejects.toThrow();
    });
  });
});
