/**
 * Unit tests for Export functionality
 * Tests frame encoding, image export, and video export
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Exporter,
  type ExportConfig,
  type ExportProgress,
  type ExportResult,
} from '../../../packages/core/src/export/Exporter';
import {
  FrameEncoder,
  CanvasFrameEncoder,
  type FrameEncoderOptions,
  type EncodedFrame,
} from '../../../packages/core/src/export/FrameEncoder';

// Mock RenderObject for testing
class MockRenderObject {
  constructor(
    public id: string,
    public visible: boolean = true,
    public opacity: number = 1,
    public position: { x: number; y: number } = { x: 0, y: 0 }
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

describe('FrameEncoder', () => {
  let encoder: FrameEncoder;
  let testObjects: MockRenderObject[];

  beforeEach(() => {
    const options: FrameEncoderOptions = {
      format: 'png',
      quality: 0.9,
      transparent: true,
      width: 800,
      height: 600,
    };
    encoder = new FrameEncoder(options);
    testObjects = [
      new MockRenderObject('obj1', true, 1, { x: 100, y: 100 }),
      new MockRenderObject('obj2', true, 0.8, { x: 200, y: 150 }),
    ];
  });

  describe('FrameEncoder Creation', () => {
    it('should create with default options', () => {
      const defaultEncoder = new FrameEncoder();
      expect(defaultEncoder.getFormat()).toBe('png');
    });

    it('should create with custom options', () => {
      const options: FrameEncoderOptions = {
        format: 'jpeg',
        quality: 0.8,
        transparent: false,
        width: 1920,
        height: 1080,
      };
      const customEncoder = new FrameEncoder(options);

      expect(customEncoder.getFormat()).toBe('jpeg');
    });

    it('should get image format', () => {
      expect(encoder.getFormat()).toBe('png');
    });

    it('should get MIME type for PNG', () => {
      expect(encoder.getMimeType()).toBe('image/png');
    });

    it('should get MIME type for JPEG', () => {
      const jpegEncoder = new FrameEncoder({ format: 'jpeg' });
      expect(jpegEncoder.getMimeType()).toBe('image/jpeg');
    });

    it('should get MIME type for WebP', () => {
      const webpEncoder = new FrameEncoder({ format: 'webp' });
      expect(webpEncoder.getMimeType()).toBe('image/webp');
    });
  });

  describe('Dimensions Calculation', () => {
    it('should calculate dimensions from objects', () => {
      const options: FrameEncoderOptions = {
        width: 800,
        height: 600,
      };
      const dimensionEncoder = new FrameEncoder(options);

      // Access protected method through test
      const calculateDimensions = (encoder: any, objects: any[]) => {
        return encoder.calculateDimensions(objects);
      };

      const dimensions = calculateDimensions(dimensionEncoder, testObjects);
      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    });

    it('should use default dimensions for empty object list', () => {
      const calculateDimensions = (encoder: any, objects: any[]) => {
        return encoder.calculateDimensions(objects);
      };

      const dimensions = calculateDimensions(encoder, []);
      expect(dimensions.width).toBe(1920);
      expect(dimensions.height).toBe(1080);
    });
  });

  describe('Abstract Method', () => {
    it('should require encodeFrame implementation', () => {
      expect(() => encoder.encodeFrame(testObjects, 0, 0)).rejects.toThrow();
    });
  });
});

describe('CanvasFrameEncoder', () => {
  let encoder: CanvasFrameEncoder;
  let testObjects: MockRenderObject[];

  beforeEach(() => {
    // Mock DOM environment
    global.HTMLCanvasElement = class HTMLCanvasElement {
      width = 800;
      height = 600;
      getContext() {
        return {
          clearRect: vi.fn(),
          fillStyle: '',
          fillRect: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          globalAlpha: 1,
          translate: vi.fn(),
          beginPath: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          toBlob: vi.fn((callback: any) => {
            callback(new Blob(['test'], { type: 'image/png' }));
          }),
        };
      }
    } as any;

    global.document = {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
          return new HTMLCanvasElement();
        }
        return {};
      }),
    } as any;

    const options: FrameEncoderOptions = {
      format: 'png',
      quality: 0.9,
      transparent: true,
      width: 800,
      height: 600,
    };
    encoder = new CanvasFrameEncoder(options);
    testObjects = [
      new MockRenderObject('obj1', true, 1, { x: 100, y: 100 }),
      new MockRenderObject('obj2', true, 0.8, { x: 200, y: 150 }),
    ];
  });

  describe('CanvasFrameEncoder Creation', () => {
    it('should create canvas encoder', () => {
      expect(encoder).toBeInstanceOf(CanvasFrameEncoder);
    });

    it('should inherit from FrameEncoder', () => {
      expect(encoder).toBeInstanceOf(FrameEncoder);
    });
  });

  describe('Frame Encoding', () => {
    it('should encode frame to blob', async () => {
      const frame = await encoder.encodeFrame(testObjects, 0, 0);

      expect(frame).toBeDefined();
      expect(frame.data).toBeInstanceOf(Blob);
      expect(frame.timestamp).toBe(0);
      expect(frame.frameNumber).toBe(0);
      expect(frame.width).toBeGreaterThan(0);
      expect(frame.height).toBeGreaterThan(0);
    });

    it('should use custom dimensions', async () => {
      const customEncoder = new CanvasFrameEncoder({
        width: 1920,
        height: 1080,
      });

      const frame = await customEncoder.encodeFrame(testObjects, 0, 0);
      expect(frame.width).toBe(1920);
      expect(frame.height).toBe(1080);
    });

    it('should include frame metadata', async () => {
      const frame = await encoder.encodeFrame(testObjects, 1.5, 90);

      expect(frame.timestamp).toBe(1.5);
      expect(frame.frameNumber).toBe(90);
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources', () => {
      expect(() => encoder.dispose()).not.toThrow();
    });
  });
});

describe('Exporter', () => {
  let exporter: Exporter;
  let testConfig: ExportConfig;

  beforeEach(() => {
    testConfig = {
      output: 'test-output',
      fps: 60,
      width: 800,
      height: 600,
      backgroundColor: '#000000',
    };
    exporter = new Exporter(testConfig);
  });

  describe('Exporter Creation', () => {
    it('should create exporter with config', () => {
      expect(exporter).toBeInstanceOf(Exporter);
    });

    it('should store config', () => {
      expect(exporter['config']).toEqual(testConfig);
    });
  });

  describe('Validation', () => {
    it('should validate config', () => {
      expect(() => exporter['validateConfig']()).not.toThrow();
    });

    it('should require output filename', () => {
      const invalidExporter = new Exporter({} as ExportConfig);
      expect(() => invalidExporter['validateConfig']()).toThrow();
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress', () => {
      const callback = vi.fn();
      exporter['reportProgress']({
        currentFrame: 10,
        totalFrames: 100,
        progress: 0.1,
        operation: 'test',
      });

      expect(exporter['progressCallback']).toBeUndefined();
    });

    it('should call progress callback', () => {
      const callback = vi.fn();
      exporter['progressCallback'] = callback;

      exporter['reportProgress']({
        currentFrame: 50,
        totalFrames: 100,
        progress: 0.5,
        operation: 'encoding',
      });

      expect(callback).toHaveBeenCalledWith({
        currentFrame: 50,
        totalFrames: 100,
        progress: 0.5,
        operation: 'encoding',
      });
    });
  });

  describe('Cancellation', () => {
    it('should reset cancel flag', () => {
      exporter['cancelled'] = true;
      exporter['resetCancel']();
      expect(exporter['cancelled']).toBe(false);
    });
  });

  describe('Frame Count Calculation', () => {
    it('should calculate frame count', () => {
      const count = exporter['getFrameCount'](5, 60);
      expect(count).toBe(300);
    });

    it('should handle partial frames', () => {
      const count = exporter['getFrameCount'](1.5, 60);
      expect(count).toBe(90);
    });
  });

  describe('Dimensions Calculation', () => {
    it('should get dimensions from config', () => {
      const scene = { config: { width: 1920, height: 1080 } };
      const dims = exporter['getDimensions'](scene as any);

      expect(dims.width).toBe(800);
      expect(dims.height).toBe(600);
    });

    it('should use scene dimensions when not in config', () => {
      const noSizeExporter = new Exporter({
        output: 'test',
      } as any);

      const scene = { config: { width: 1920, height: 1080 } };
      const dims = noSizeExporter['getDimensions'](scene as any);

      expect(dims.width).toBe(1920);
      expect(dims.height).toBe(1080);
    });
  });

  describe('Export Result', () => {
    it('should create successful result', () => {
      const result: ExportResult = {
        success: true,
        output: 'test-output',
      };

      expect(result.success).toBe(true);
      expect(result.output).toBe('test-output');
    });

    it('should create failed result', () => {
      const result: ExportResult = {
        success: false,
        error: 'Test error',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('Progress Structure', () => {
    it('should create progress object', () => {
      const progress: ExportProgress = {
        currentFrame: 50,
        totalFrames: 100,
        progress: 0.5,
        operation: 'encoding',
      };

      expect(progress.currentFrame).toBe(50);
      expect(progress.totalFrames).toBe(100);
      expect(progress.progress).toBe(0.5);
      expect(progress.operation).toBe('encoding');
    });
  });
});
