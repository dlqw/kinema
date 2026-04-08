/**
 * Format Conversion Integration Tests
 * Tests format conversion scenarios including PNG/JPEG/WebP
 *
 * Covers:
 * - Image format conversions
 * - Quality preservation
 * - File naming patterns
 * - Batch processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupCanvasMock } from '../../mocks/canvas.mock';
import {
  ImageSequenceEncoder,
  type ImageSequenceConfig,
  type ImageSequenceFormat,
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

describe('Format Conversion Integration Tests', () => {
  let mockScene: MockScene;
  let registry: EncoderRegistry;

  beforeEach(() => {
    EncoderRegistry.resetInstance();
    registry = EncoderRegistry.getInstance();
    mockScene = new MockScene();

    // Mock URL methods
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    registry.clear();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Image Format Conversion Tests
  // ==========================================================================

  describe('Image Format Conversions', () => {
    const formats: ImageSequenceFormat[] = ['png', 'jpeg', 'webp'];

    it.each(formats)('should export scene as %s sequence', async (format) => {
      const config: ImageSequenceConfig = {
        output: `test-${format}`,
        format,
        outputMode: 'files',
        duration: 0.2,
        fps: 10,
        quality: format === 'png' ? undefined : 0.9,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
      expect(result.format).toBe(format);
      expect(result.frames.length).toBe(2);
    });

    it('should produce JPEG with quality setting', async () => {
      const qualities = [0.5, 0.7, 0.9, 1.0];

      for (const quality of qualities) {
        const config: ImageSequenceConfig = {
          output: `quality-test-${quality}`,
          format: 'jpeg',
          outputMode: 'zip',
          duration: 0.1,
          fps: 5,
          quality,
        };

        const exporter = new ImageSequenceEncoder(config);
        const result = await exporter.export(mockScene as any);

        expect(result.success).toBe(true);
      }
    });

    it('should produce WebP with quality setting', async () => {
      const config: ImageSequenceConfig = {
        output: 'webp-test',
        format: 'webp',
        outputMode: 'files',
        duration: 0.1,
        fps: 10,
        quality: 0.85,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
      expect(result.format).toBe('webp');
    });
  });

  // ==========================================================================
  // Cross-Format Quality Comparison
  // ==========================================================================

  describe('Cross-Format Quality', () => {
    it('should produce consistent frame counts across formats', async () => {
      const formats: Array<{ format: ImageSequenceFormat; name: string }> = [
        { format: 'png', name: 'lossless' },
        { format: 'jpeg', name: 'lossy-jpeg' },
        { format: 'webp', name: 'webp' },
      ];

      const results = [];

      for (const { format, name } of formats) {
        const config: ImageSequenceConfig = {
          output: `${name}-test`,
          format,
          outputMode: 'zip',
          duration: 0.2,
          fps: 10,
          quality: format === 'png' ? undefined : 0.9,
        };

        const exporter = new ImageSequenceEncoder(config);
        const result = await exporter.export(mockScene as any);
        results.push({ name, result });
      }

      // All should succeed with same frame count
      const frameCounts = results.map((r) => r.result.frameCount);
      const allSame = frameCounts.every((c) => c === frameCounts[0]);
      expect(allSame).toBe(true);

      // All should succeed
      results.forEach((r) => {
        expect(r.result.success).toBe(true);
      });
    });
  });

  // ==========================================================================
  // ZIP Archive Format Tests
  // ==========================================================================

  describe('ZIP Archive Format', () => {
    it('should create ZIP archive for PNG sequence', async () => {
      const config: ImageSequenceConfig = {
        output: 'png-zip',
        format: 'png',
        outputMode: 'zip',
        duration: 0.2,
        fps: 10,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
      expect(result.outputMode).toBe('zip');
    });

    it('should create ZIP archive for JPEG sequence', async () => {
      const config: ImageSequenceConfig = {
        output: 'jpeg-zip',
        format: 'jpeg',
        outputMode: 'zip',
        duration: 0.2,
        fps: 10,
        quality: 0.9,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
      expect(result.outputMode).toBe('zip');
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
  // Batch Processing Tests
  // ==========================================================================

  describe('Batch Processing', () => {
    it('should process frames in batches', async () => {
      const config: ImageSequenceConfig = {
        output: 'batch-test',
        format: 'png',
        outputMode: 'files',
        duration: 0.5,
        fps: 30, // 15 frames
        batchSize: 5,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
      expect(result.frameCount).toBe(15);
    });

    it('should handle small batch sizes', async () => {
      const config: ImageSequenceConfig = {
        output: 'small-batch',
        format: 'png',
        outputMode: 'files',
        duration: 0.2,
        fps: 10,
        batchSize: 1,
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
    });

    it('should handle large batch sizes', async () => {
      const config: ImageSequenceConfig = {
        output: 'large-batch',
        format: 'png',
        outputMode: 'files',
        duration: 0.2,
        fps: 10,
        batchSize: 100, // More than total frames
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Format Detection Integration
  // ==========================================================================

  describe('Format Detection Integration', () => {
    it('should detect format from output filename', () => {
      const testCases = [
        { input: 'animation.gif', expected: 'gif' },
        { input: 'frames/image.png', expected: 'png' },
        { input: 'video.webm', expected: 'webm' },
        { input: 'movie.mp4', expected: 'mp4' },
        { input: 'photo.jpeg', expected: 'jpeg' },
        { input: 'image.webp', expected: 'webp' },
      ];

      for (const { input, expected } of testCases) {
        const detected = registry.detectFormat(input);
        expect(detected).toBe(expected);
      }
    });

    it('should get MIME type for detected format', () => {
      const formats: Array<{ format: ImageSequenceFormat; expectedMime: string }> = [
        { format: 'png', expectedMime: 'image/png' },
        { format: 'jpeg', expectedMime: 'image/jpeg' },
        { format: 'webp', expectedMime: 'image/webp' },
      ];

      for (const { format, expectedMime } of formats) {
        const mimeType = registry.getMimeType(format);
        expect(mimeType).toBe(expectedMime);
      }
    });
  });

  // ==========================================================================
  // Multi-Resolution Export Tests
  // ==========================================================================

  describe('Multi-Resolution Export', () => {
    it('should export at different resolutions', async () => {
      const resolutions = [
        { width: 320, height: 240 },
        { width: 640, height: 480 },
        { width: 1280, height: 720 },
      ];

      for (const res of resolutions) {
        const config: ImageSequenceConfig = {
          output: `res_${res.width}x${res.height}`,
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

    it('should maintain aspect ratio when specified', async () => {
      const config: ImageSequenceConfig = {
        output: 'aspect-test',
        format: 'png',
        outputMode: 'zip',
        duration: 0.1,
        fps: 5,
        width: 1920,
        height: 1080, // 16:9
      };

      const exporter = new ImageSequenceEncoder(config);
      const result = await exporter.export(mockScene as any);

      expect(result.success).toBe(true);
    });
  });
});
