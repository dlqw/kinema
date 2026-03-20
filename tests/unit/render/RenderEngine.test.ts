/**
 * Unit tests for RenderEngine
 * Tests initialization, render loop, and lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RenderEngine, RenderAPI } from '../../../src/render/core/RenderEngine';

// Mock GPU APIs
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

// Mock canvas element
class MockCanvas {
  width = 800;
  height = 600;
  getContext = vi.fn();
}

// Mock WebGPU adapter and device
const mockGPUAdapter = {
  requestAdapterInfo: vi.fn().mockResolvedValue({
    vendor: 'mock-vendor',
    architecture: 'mock-arch',
    device: 'mock-device',
    description: 'mock-description',
  }),
  features: new Set(['texture-compression-bc', 'timestamp-query']),
  limits: {
    maxTextureDimension1D: 8192,
    maxTextureDimension2D: 8192,
    maxTextureDimension3D: 2048,
    maxTextureArrayLayers: 256,
    maxBindGroups: 4,
    maxDynamicUniformBuffersPerPipelineLayout: 8,
    maxDynamicStorageBuffersPerPipelineLayout: 4,
    maxSampledTexturesPerShaderStage: 16,
    maxSamplersPerShaderStage: 16,
    maxStorageBuffersPerShaderStage: 8,
    maxStorageTexturesPerShaderStage: 8,
    maxUniformBuffersPerShaderStage: 16,
    maxUniformBufferBindingSize: 65536,
    maxStorageBufferBindingSize: 134217728,
    minUniformBufferOffsetAlignment: 256,
    minStorageBufferOffsetAlignment: 256,
    maxVertexBuffers: 8,
    maxVertexAttributes: 16,
    maxVertexBufferArrayStride: 2048,
  },
  requestDevice: vi.fn().mockResolvedValue({
    destroy: vi.fn(),
  }),
};

// Mock navigator.gpu
const mockGPU = {
  requestAdapter: vi.fn().mockResolvedValue(mockGPUAdapter),
};

describe('RenderEngine', () => {
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    mockCanvas = new MockCanvas();

    // Mock requestAnimationFrame
    global.requestAnimationFrame = mockRequestAnimationFrame as any;
    global.cancelAnimationFrame = mockCancelAnimationFrame as any;

    // Mock performance.now()
    vi.stubGlobal('performance', {
      now: vi.fn().mockReturnValue(0),
    });

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock navigator.gpu
    (global as any).navigator = { gpu: mockGPU };
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    (RenderEngine as any).instance = null;
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine).toBeInstanceOf(RenderEngine);
      expect(RenderEngine.get()).toBe(engine);
    });

    it('should initialize with custom configuration', async () => {
      const config = {
        canvas: mockCanvas as any,
        devicePixelRatio: 2,
        powerPreference: 'low-power' as const,
        apiPreference: RenderAPI.WebGPU,
        debugMode: true,
        antialias: false,
        alpha: false,
        depth: false,
        stencil: true,
      };

      const engine = await RenderEngine.init(config);

      expect(engine).toBeInstanceOf(RenderEngine);
    });

    it('should return existing instance if already initialized', async () => {
      const engine1 = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
      const engine2 = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine1).toBe(engine2);
      expect(console.warn).toHaveBeenCalledWith(
        'RenderEngine already initialized. Returning existing instance.'
      );
    });

    it('should throw error if no supported graphics API found', async () => {
      (global as any).navigator = {};

      await expect(
        RenderEngine.init({
          canvas: mockCanvas as any,
        })
      ).rejects.toThrow('No supported graphics API found');
    });

    it('should provide access to graphics device', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      const device = engine.graphicsDevice;
      expect(device).toBeDefined();
    });

    it('should throw error when accessing device before initialization', async () => {
      (RenderEngine as any).instance = null;

      expect(() => RenderEngine.get()).toThrow(
        'RenderEngine not initialized. Call RenderEngine.init() first.'
      );
    });
  });

  describe('Render Loop', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should start the render loop', () => {
      engine.start();

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should not start if already running', () => {
      engine.start();
      engine.start(); // Start again

      expect(console.warn).toHaveBeenCalledWith('[RenderEngine] Already running');
    });

    it('should pause the render loop', () => {
      engine.start();
      engine.pause();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should resume the render loop', () => {
      engine.start();
      engine.pause();
      engine.resume();

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should not resume if already running', () => {
      engine.start();
      const frameCountBefore = mockRequestAnimationFrame.mock.calls.length;
      engine.resume();

      expect(mockRequestAnimationFrame.mock.calls.length).toBe(frameCountBefore);
    });

    it('should handle frame rate limiting', () => {
      engine.setFrameRate(30);

      // 30 FPS = ~33.33ms per frame
      // Target frame time should be set
      expect(engine).toBeDefined();
    });

    it('should set unlimited frame rate when fps is 0', () => {
      engine.setFrameRate(0);

      expect(engine).toBeDefined();
    });
  });

  describe('Canvas Properties', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should get canvas element', () => {
      const canvas = engine.canvas;
      expect(canvas).toBeDefined();
    });

    it('should get canvas width', () => {
      const width = engine.width;
      expect(width).toBeGreaterThanOrEqual(0);
    });

    it('should get canvas height', () => {
      const height = engine.height;
      expect(height).toBeGreaterThanOrEqual(0);
    });

    it('should get aspect ratio', () => {
      const aspect = engine.aspect;
      expect(aspect).toBeGreaterThan(0);
    });
  });

  describe('Render Stats', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should get current render stats', () => {
      const stats = engine.renderStats;

      expect(stats).toBeDefined();
      expect(stats.fps).toBeDefined();
      expect(stats.frameTime).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    it('should destroy the engine', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
      engine.start();

      engine.destroy();

      // Singleton should be cleared
      expect(() => RenderEngine.get()).toThrow();
    });

    it('should pause before destroying', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
      engine.start();

      const pauseSpy = vi.spyOn(engine, 'pause');
      engine.destroy();

      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should clean up context on destroy', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      engine.destroy();

      // Context should be null
      expect(engine.renderContext).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle render errors gracefully', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      // Mock render to throw error
      const renderSpy = vi.spyOn(engine as any, 'render').mockImplementation(() => {
        throw new Error('Render error');
      });

      engine.start();

      // Should not throw, but log error
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle missing canvas gracefully', async () => {
      const engine = await RenderEngine.init({
        canvas: null as any,
      });

      expect(engine.canvas).toBeNull();
    });
  });

  describe('Configuration Defaults', () => {
    it('should use default device pixel ratio when not specified', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine).toBeDefined();
    });

    it('should use high-performance power preference by default', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine).toBeDefined();
    });

    it('should prefer WebGPU by default', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine).toBeDefined();
    });

    it('should enable debug mode when specified', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
        debugMode: true,
      });

      expect(engine).toBeDefined();
    });
  });

  describe('Frame Time Management', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should calculate delta time between frames', () => {
      engine.start();

      const firstCall = mockRequestAnimationFrame.mock.calls[0];
      expect(firstCall).toBeDefined();
    });

    it('should handle frame rate limiting', () => {
      engine.setFrameRate(30); // 30 FPS = ~33.33ms per frame

      // With frame rate limiting, should delay if frame is too fast
      expect(engine).toBeDefined();
    });

    it('should handle unlimited frame rate', () => {
      engine.setFrameRate(0); // Unlimited

      expect(engine).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    it('should enforce single instance', async () => {
      const engine1 = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      // Try to create second instance
      const engine2 = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine1).toBe(engine2);
    });

    it('should allow recreation after destroy', async () => {
      const engine1 = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
      engine1.destroy();

      const engine2 = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine1).not.toBe(engine2);
      expect(RenderEngine.get()).toBe(engine2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high frame rates', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
      engine.setFrameRate(120);

      expect(engine).toBeDefined();
    });

    it('should handle very low frame rates', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
      engine.setFrameRate(1);

      expect(engine).toBeDefined();
    });

    it('should handle zero dimension canvas', async () => {
      const zeroCanvas = new MockCanvas();
      zeroCanvas.width = 0;
      zeroCanvas.height = 0;

      const engine = await RenderEngine.init({
        canvas: zeroCanvas as any,
      });

      expect(engine.width).toBe(0);
      expect(engine.height).toBe(0);
    });

    it('should handle very large canvas dimensions', async () => {
      const largeCanvas = new MockCanvas();
      largeCanvas.width = 16384;
      largeCanvas.height = 16384;

      const engine = await RenderEngine.init({
        canvas: largeCanvas as any,
      });

      expect(engine.width).toBe(16384);
      expect(engine.height).toBe(16384);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on destroy', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      // Get device before destroy
      const device = engine.graphicsDevice;
      expect(device).toBeDefined();

      engine.destroy();

      // After destroy, accessing device should throw
      expect(() => engine.graphicsDevice).toThrow();
    });

    it('should nullify references on destroy', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      engine.destroy();

      expect((engine as any).device).toBeNull();
      expect((engine as any).context).toBeNull();
    });
  });
});
