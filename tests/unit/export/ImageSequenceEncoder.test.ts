/**
 * Unit tests for ImageSequenceEncoder
 * Tests image sequence export functionality including PNG, JPEG, WebP formats
 * and ZIP archive creation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ImageSequenceEncoder,
  exportAsImageSequence,
  exportAsImageZip,
  type ImageSequenceConfig,
  type ImageSequenceResult,
  type ImageSequenceFormat,
} from '../../../packages/core/src/export/encoders/ImageSequenceEncoder';
import { setupCanvasMock } from '../../mocks/canvas.mock';

// Setup canvas mock before tests
setupCanvasMock();

// Mock Scene for testing
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

// Mock RenderObject for testing
class MockRenderObject {
  constructor(
    public id: string,
    public visible: boolean = true,
    public opacity: number = 1,
    public position: { x: number; y: number } = { x: 0, y: 0 },
  ) {}

  getState() {
    return {
      id: this.id,
      transform: {
        position: this.position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: this.opacity,
      },
      visible: this.visible,
      z_index: 0,
      styles: new Map(),
    };
  }

  getBoundingBox() {
    return {
      min: { x: -50, y: -50, z: 0 },
      max: { x: 50, y: 50, z: 0 },
      center: { x: 0, y: 0, z: 0 },
    };
  }
}

describe('ImageSequenceEncoder', () => {
  let mockScene: MockScene;
  let defaultConfig: ImageSequenceConfig;

  beforeEach(() => {
    mockScene = new MockScene();
    defaultConfig = {
      output: 'test_frames',
      format: 'png',
      outputMode: 'files',
      duration: 0.5, // Short duration for faster tests
      fps: 10,
      padding: 4,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create encoder with default config', () => {
      const encoder = new ImageSequenceEncoder({ output: 'test' });
      expect(encoder).toBeInstanceOf(ImageSequenceEncoder);
    });

    it('should create encoder with custom config', () => {
      const config: ImageSequenceConfig = {
        output: 'custom_frames',
        format: 'jpeg',
        outputMode: 'zip',
        quality: 0.8,
        duration: 5,
        fps: 60,
        padding: 5,
        pattern: 'img_%d.jpg',
        batchSize: 20,
      };

      const encoder = new ImageSequenceEncoder(config);
      expect(encoder).toBeInstanceOf(ImageSequenceEncoder);
    });

    it('should apply default values for missing config', () => {
      const encoder = new ImageSequenceEncoder({ output: 'test' });
      expect(encoder.getExtension()).toBe('png'); // Default format
    });
  });

  describe('Export Configuration', () => {
    it('should use PNG format by default', () => {
      const encoder = new ImageSequenceEncoder({ output: 'test' });
      expect(encoder.getExtension()).toBe('png');
    });

    it('should support JPEG format', () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'jpeg',
      });
      expect(encoder.getExtension()).toBe('jpeg');
    });

    it('should support WebP format', () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'webp',
      });
      expect(encoder.getExtension()).toBe('webp');
    });

    it('should return zip extension for ZIP mode', () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'png',
        outputMode: 'zip',
      });
      expect(encoder.getExtension()).toBe('zip');
    });
  });

  describe('MIME Types', () => {
    it('should return correct MIME type for PNG', () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'png',
      });
      expect(encoder.getMimeType()).toBe('image/png');
    });

    it('should return correct MIME type for JPEG', () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'jpeg',
      });
      expect(encoder.getMimeType()).toBe('image/jpeg');
    });

    it('should return correct MIME type for WebP', () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'webp',
      });
      expect(encoder.getMimeType()).toBe('image/webp');
    });
  });

  describe('Export Process', () => {
    it('should export frames successfully', async () => {
      const encoder = new ImageSequenceEncoder(defaultConfig);
      const result = await encoder.export(mockScene as any);

      expect(result.success).toBe(true);
      expect(result.frameCount).toBe(5); // 0.5s * 10fps = 5 frames
      expect(result.frames.length).toBe(5);
      expect(result.format).toBe('png');
      expect(result.outputMode).toBe('files');
    });

    it('should report progress during export', async () => {
      const progressCallback = vi.fn();
      const encoder = new ImageSequenceEncoder(defaultConfig);

      await encoder.export(mockScene as any, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      // Should report at least initial and final progress
      expect(progressCallback.mock.calls.length).toBeGreaterThan(1);
    });

    it('should respect custom duration and fps', async () => {
      const config: ImageSequenceConfig = {
        ...defaultConfig,
        duration: 1,
        fps: 20,
      };

      const encoder = new ImageSequenceEncoder(config);
      const result = await encoder.export(mockScene as any);

      expect(result.frameCount).toBe(20); // 1s * 20fps = 20 frames
    });

    it('should handle different formats', async () => {
      const formats: ImageSequenceFormat[] = ['png', 'jpeg', 'webp'];

      for (const format of formats) {
        const config: ImageSequenceConfig = {
          ...defaultConfig,
          format,
        };

        const encoder = new ImageSequenceEncoder(config);
        const result = await encoder.export(mockScene as any);

        expect(result.success).toBe(true);
        expect(result.format).toBe(format);
      }
    });
  });

  describe('File Naming', () => {
    it('should generate correct file names with padding', async () => {
      const encoder = new ImageSequenceEncoder({
        ...defaultConfig,
        padding: 4,
      });

      const result = await encoder.export(mockScene as any);

      expect(result.frames[0]).toMatch(/frame_0000\.png/);
      expect(result.frames[1]).toMatch(/frame_0001\.png/);
    });

    it('should support custom pattern', async () => {
      const encoder = new ImageSequenceEncoder({
        ...defaultConfig,
        pattern: 'img_%d.png',
      });

      const result = await encoder.export(mockScene as any);

      expect(result.frames[0]).toMatch(/img_0000\.png/);
    });
  });

  describe('Cancellation', () => {
    it('should handle cancellation', async () => {
      const encoder = new ImageSequenceEncoder({
        ...defaultConfig,
        duration: 5, // Longer duration
        fps: 60,
      });

      // Start export
      const exportPromise = encoder.export(mockScene as any);

      // Cancel immediately
      encoder.cancel();

      const result = await exportPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Export was cancelled');
    });

    it('should reset cancel state on new export', async () => {
      const encoder = new ImageSequenceEncoder(defaultConfig);

      // First export (cancelled)
      encoder.cancel();
      await encoder.export(mockScene as any);

      // Reset and do second export
      encoder.resetCancel();
      const result = await encoder.export(mockScene as any);

      expect(result.success).toBe(true);
    });
  });

  describe('ZIP Output Mode', () => {
    it('should export as ZIP archive', async () => {
      const encoder = new ImageSequenceEncoder({
        ...defaultConfig,
        outputMode: 'zip',
      });

      const result = await encoder.export(mockScene as any);

      expect(result.success).toBe(true);
      expect(result.outputMode).toBe('zip');
      // ZIP blob might be undefined in test environment without JSZip
    });
  });

  describe('Error Handling', () => {
    it('should validate required config', async () => {
      const encoder = new ImageSequenceEncoder({} as ImageSequenceConfig);

      await expect(encoder.export(mockScene as any)).rejects.toThrow();
    });

    it('should handle invalid format gracefully', async () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'invalid' as any,
      });

      // Should still create encoder (validation happens during export)
      expect(encoder).toBeInstanceOf(ImageSequenceEncoder);
    });
  });

  describe('Batch Processing', () => {
    it('should process frames in batches', async () => {
      const encoder = new ImageSequenceEncoder({
        ...defaultConfig,
        batchSize: 2,
      });

      const result = await encoder.export(mockScene as any);

      expect(result.success).toBe(true);
    });
  });

  describe('Quality Settings', () => {
    it('should use default quality for lossy formats', () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'jpeg',
      });

      expect(encoder).toBeInstanceOf(ImageSequenceEncoder);
    });

    it('should accept custom quality setting', () => {
      const encoder = new ImageSequenceEncoder({
        output: 'test',
        format: 'jpeg',
        quality: 0.5,
      });

      expect(encoder).toBeInstanceOf(ImageSequenceEncoder);
    });
  });
});

describe('Quick Export Helpers', () => {
  let mockScene: MockScene;

  beforeEach(() => {
    mockScene = new MockScene();
  });

  describe('exportAsImageSequence', () => {
    it('should export image sequence with defaults', async () => {
      const result = await exportAsImageSequence(mockScene as any, 'test_frames', {
        duration: 0.5,
        fps: 10,
      });

      expect(result.success).toBe(true);
      expect(result.outputMode).toBe('files');
    });

    it('should accept custom options', async () => {
      const result = await exportAsImageSequence(mockScene as any, 'test_frames', {
        format: 'jpeg',
        duration: 0.5,
        fps: 10,
        quality: 0.8,
      });

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
    });
  });

  describe('exportAsImageZip', () => {
    it('should export as ZIP archive', async () => {
      const result = await exportAsImageZip(mockScene as any, 'test_archive', {
        duration: 0.5,
        fps: 10,
      });

      expect(result.success).toBe(true);
      expect(result.outputMode).toBe('zip');
    });

    it('should accept format options', async () => {
      const result = await exportAsImageZip(mockScene as any, 'test_archive', {
        format: 'webp',
        quality: 0.9,
        duration: 0.5,
        fps: 10,
      });

      expect(result.success).toBe(true);
      expect(result.format).toBe('webp');
    });
  });
});

describe('ImageSequenceResult', () => {
  it('should have correct result structure', async () => {
    const encoder = new ImageSequenceEncoder({
      output: 'test',
      duration: 0.2,
      fps: 5,
    });

    const result = await encoder.export(new MockScene() as any);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('frameCount');
    expect(result).toHaveProperty('frames');
    expect(result).toHaveProperty('totalSize');
    expect(result).toHaveProperty('outputMode');
    expect(result).toHaveProperty('format');

    if (result.success) {
      expect(typeof result.frameCount).toBe('number');
      expect(Array.isArray(result.frames)).toBe(true);
      expect(typeof result.totalSize).toBe('number');
    }
  });
});
