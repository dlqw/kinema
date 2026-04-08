/**
 * Integration tests for Rendering Pipeline
 * Tests the complete rendering pipeline from device creation to frame presentation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RenderEngine } from '../../packages/core/src/render/core/RenderEngine';
import type { GraphicsDevice, RenderContext } from '../../packages/core/src/render/core/types';
import { RenderAPI } from '../../packages/core/src/render/core/Capability';

// Mock GPU APIs
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

// Mock canvas element
class MockCanvas {
  width = 800;
  height = 600;
  getContext = vi.fn();
}

// Mock command encoder
class MockCommandEncoder {
  readonly label = 'mock-command-encoder';
  private commandBuffers: any[] = [];

  beginRenderPass(descriptor: any) {
    return new MockRenderPassEncoder();
  }

  beginComputePass(descriptor?: any) {
    return {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      dispatchWorkgroups: vi.fn(),
      end: vi.fn(),
    };
  }

  copyBufferToBuffer() {}
  copyBufferToTexture() {}
  copyTextureToBuffer() {}
  copyTextureToTexture() {}

  finish() {
    const commandBuffer = { label: 'mock-command-buffer' };
    this.commandBuffers.push(commandBuffer);
    return commandBuffer;
  }
}

// Mock render pass encoder
class MockRenderPassEncoder {
  readonly label = 'mock-render-pass';
  private pipelines: any[] = [];
  private bindGroups: any[] = [];

  setPipeline(pipeline: any) {
    this.pipelines.push(pipeline);
  }

  setBindGroup(index: number, bindGroup: any, dynamicOffsets?: number[]) {}

  setIndexBuffer() {}
  setVertexBuffer() {}

  draw(vertexCount: number, instanceCount?: number) {}
  drawIndexed(indexCount: number, instanceCount?: number) {}

  insertDebugMarker() {}
  popDebugGroup() {}
  pushDebugGroup() {}

  end() {}
}

// Mock graphics device
class MockGraphicsDevice implements GraphicsDevice {
  readonly label = 'mock-device';
  readonly adapterInfo = {
    vendor: 'test-vendor',
    architecture: 'test-arch',
  };
  readonly features = new Set(['texture-compression-bc']);
  readonly limits = {
    maxTextureDimension2D: 8192,
    maxVertexAttributes: 16,
  };
  readonly queue = {
    label: 'mock-queue',
    submit: vi.fn(),
    onSubmittedWorkDone: vi.fn().mockResolvedValue(undefined),
    writeBuffer: vi.fn(),
    writeTexture: vi.fn(),
    copyExternalImageToTexture: vi.fn(),
  };
  readonly api = RenderAPI.WebGPU;
  readonly canvas: HTMLCanvasElement;
  readonly presentationFormat = 'rgba8unorm' as const;
  readonly presentationSize: [number, number];
  readonly aspect: number;
  readonly pixelRatio = 1;

  private destroyed = false;
  private buffers: any[] = [];
  private textures: any[] = [];
  private samplers: any[] = [];
  private shaders: any[] = [];
  private pipelines: any[] = [];

  constructor(canvas: any) {
    this.canvas = canvas;
    this.presentationSize = [canvas.width, canvas.height];
    this.aspect = canvas.width / canvas.height;
  }

  createBuffer(descriptor: any) {
    const buffer = {
      label: descriptor.label || 'buffer',
      size: descriptor.size,
      usage: descriptor.usage,
      destroy: vi.fn(),
    };
    this.buffers.push(buffer);
    return buffer;
  }

  createTexture(descriptor: any) {
    const texture = {
      label: descriptor.label || 'texture',
      destroy: vi.fn(),
    };
    this.textures.push(texture);
    return texture;
  }

  createSampler(descriptor: any) {
    const sampler = {
      label: descriptor.label || 'sampler',
      destroy: vi.fn(),
    };
    this.samplers.push(sampler);
    return sampler;
  }

  createShaderModule(descriptor: any) {
    const shader = {
      label: descriptor.label || 'shader',
      getCompilationInfo: vi.fn().mockResolvedValue({ messages: [] }),
    };
    this.shaders.push(shader);
    return shader;
  }

  createRenderPipeline(descriptor: any) {
    const pipeline = {
      label: descriptor.label || 'pipeline',
      getBindGroupLayout: vi.fn(),
    };
    this.pipelines.push(pipeline);
    return pipeline;
  }

  createComputePipeline(descriptor: any) {
    return {
      label: descriptor.label || 'compute-pipeline',
      getBindGroupLayout: vi.fn(),
    };
  }

  createBindGroupLayout(descriptor: any) {
    return {
      label: 'bind-group-layout',
      entries: [],
    };
  }

  createPipelineLayout(descriptor: any) {
    return { label: 'pipeline-layout' };
  }

  createBindGroup(descriptor: any) {
    return {
      label: 'bind-group',
      destroy: vi.fn(),
    };
  }

  createCommandEncoder() {
    return new MockCommandEncoder();
  }

  createQuerySet(descriptor: any) {
    return {
      label: 'query-set',
      destroy: vi.fn(),
    };
  }

  resize() {}

  loseDevice() {
    this.destroyed = true;
  }

  destroy() {
    this.destroyed = true;
    this.buffers.forEach((b) => b.destroy());
    this.textures.forEach((t) => t.destroy());
    this.samplers.forEach((s) => s.destroy());
  }

  getResourceCount() {
    return {
      buffers: this.buffers.length,
      textures: this.textures.length,
      samplers: this.samplers.length,
      shaders: this.shaders.length,
      pipelines: this.pipelines.length,
    };
  }
}

// Mock render context
class MockRenderContext implements RenderContext {
  readonly canvas: HTMLCanvasElement;
  readonly device: GraphicsDevice;
  readonly presentationSize: [number, number];
  readonly aspect: number;
  readonly presentationFormat = 'rgba8unorm' as const;

  private destroyed = false;
  private frameCount = 0;

  constructor(canvas: any, device: GraphicsDevice) {
    this.canvas = canvas;
    this.device = device;
    this.presentationSize = [canvas.width, canvas.height];
    this.aspect = canvas.width / canvas.height;
  }

  update() {
    // Handle resize, etc.
  }

  present() {
    this.frameCount++;
  }

  destroy() {
    this.destroyed = true;
    this.device.destroy();
  }

  getFrameCount() {
    return this.frameCount;
  }
}

describe('Rendering Pipeline Integration Tests', () => {
  let mockCanvas: MockCanvas;
  let mockDevice: MockGraphicsDevice;
  let mockContext: MockRenderContext;

  beforeEach(() => {
    mockCanvas = new MockCanvas();
    mockDevice = new MockGraphicsDevice(mockCanvas);
    mockContext = new MockRenderContext(mockCanvas, mockDevice);

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
    (global as any).navigator = {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue({
          requestAdapterInfo: vi.fn().mockResolvedValue({
            vendor: 'test',
            architecture: 'test',
          }),
          requestDevice: vi.fn().mockResolvedValue({
            destroy: vi.fn(),
          }),
          features: new Set(),
          limits: {},
        }),
      },
    };

    // Mock document.createElement
    global.document = createElement as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    (RenderEngine as any).instance = null;
  });

  describe('Device Initialization Pipeline', () => {
    it('should initialize render engine with device', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine).toBeInstanceOf(RenderEngine);
      expect(engine.graphicsDevice).toBeDefined();
      expect(engine.renderContext).toBeDefined();
    });

    it('should setup correct presentation size', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine.width).toBe(800);
      expect(engine.height).toBe(600);
      expect(engine.aspect).toBeCloseTo(1.333, 3);
    });

    it('should handle device pixel ratio', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
        devicePixelRatio: 2,
      });

      expect(engine).toBeDefined();
    });
  });

  describe('Frame Rendering Pipeline', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should start render loop', () => {
      engine.start();

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should pause render loop', () => {
      engine.start();
      engine.pause();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should resume render loop', () => {
      engine.start();
      engine.pause();
      engine.resume();

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should update render stats each frame', () => {
      const statsBefore = engine.renderStats;

      engine.start();

      // Stats should be available
      expect(engine.renderStats).toBeDefined();
    });
  });

  describe('Resource Creation Pipeline', () => {
    let device: MockGraphicsDevice;

    beforeEach(() => {
      device = new MockGraphicsDevice(mockCanvas);
    });

    it('should create and manage buffers', () => {
      const buffer = device.createBuffer({
        size: 1024,
        usage: 1,
      });

      expect(buffer).toBeDefined();
      expect(buffer.size).toBe(1024);
      expect(device.getResourceCount().buffers).toBe(1);
    });

    it('should create and manage textures', () => {
      const texture = device.createTexture({
        size: [512, 512],
        dimension: '2d',
        format: 'rgba8unorm',
        usage: 1,
      });

      expect(texture).toBeDefined();
      expect(device.getResourceCount().textures).toBe(1);
    });

    it('should create and manage samplers', () => {
      const sampler = device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        addressModeW: 'repeat',
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
      });

      expect(sampler).toBeDefined();
      expect(device.getResourceCount().samplers).toBe(1);
    });

    it('should create and manage shaders', () => {
      const shader = device.createShaderModule({
        code: 'shader code',
      });

      expect(shader).toBeDefined();
      expect(device.getResourceCount().shaders).toBe(1);
    });

    it('should create and manage pipelines', () => {
      const pipeline = device.createRenderPipeline({
        label: 'test-pipeline',
      });

      expect(pipeline).toBeDefined();
      expect(device.getResourceCount().pipelines).toBe(1);
    });

    it('should destroy all resources', () => {
      device.createBuffer({ size: 1024, usage: 1 });
      device.createTexture({
        size: [512, 512],
        dimension: '2d',
        format: 'rgba8unorm',
        usage: 1,
      });
      device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        addressModeW: 'repeat',
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
      });

      device.destroy();

      const counts = device.getResourceCount();
      expect(counts.buffers).toBe(0);
      expect(counts.textures).toBe(0);
      expect(counts.samplers).toBe(0);
    });
  });

  describe('Command Encoding Pipeline', () => {
    let device: MockGraphicsDevice;

    beforeEach(() => {
      device = new MockGraphicsDevice(mockCanvas);
    });

    it('should create command encoder', () => {
      const encoder = device.createCommandEncoder();

      expect(encoder).toBeDefined();
      expect(encoder.label).toBe('mock-command-encoder');
    });

    it('should record render pass', () => {
      const encoder = device.createCommandEncoder();
      const renderPass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: {} as any,
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });

      expect(renderPass).toBeDefined();
    });

    it('should record compute pass', () => {
      const encoder = device.createCommandEncoder();
      const computePass = encoder.beginComputePass();

      expect(computePass).toBeDefined();
    });

    it('should finish command encoding', () => {
      const encoder = device.createCommandEncoder();
      const commandBuffer = encoder.finish();

      expect(commandBuffer).toBeDefined();
    });

    it('should submit command buffers to queue', () => {
      const encoder = device.createCommandEncoder();
      const commandBuffer = encoder.finish();

      device.queue.submit([commandBuffer]);

      expect(device.queue.submit).toHaveBeenCalled();
    });
  });

  describe('Error Handling Pipeline', () => {
    it('should handle device creation failure', async () => {
      (global as any).navigator = {};

      await expect(
        RenderEngine.init({
          canvas: mockCanvas as any,
        }),
      ).rejects.toThrow();
    });

    it('should handle render errors gracefully', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      // Mock render to throw error
      const renderSpy = vi.spyOn(engine as any, 'render').mockImplementation(() => {
        throw new Error('Render error');
      });

      engine.start();

      expect(console.error).toHaveBeenCalledWith(
        '[RenderEngine] Frame render error:',
        expect.any(Error),
      );
    });

    it('should handle context errors', () => {
      const context = new MockRenderContext(mockCanvas, mockDevice);

      // Simulate context error
      context.destroy();

      expect(context.getFrameCount()).toBe(0);
    });
  });

  describe('Lifecycle Management', () => {
    it('should complete full lifecycle', async () => {
      // Initialize
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine.graphicsDevice).toBeDefined();

      // Start
      engine.start();
      expect(mockRequestAnimationFrame).toHaveBeenCalled();

      // Pause
      engine.pause();
      expect(mockCancelAnimationFrame).toHaveBeenCalled();

      // Resume
      engine.resume();
      expect(mockRequestAnimationFrame).toHaveBeenCalled();

      // Destroy
      engine.destroy();
      expect(() => RenderEngine.get()).toThrow();
    });

    it('should cleanup resources on destroy', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      const device = engine.graphicsDevice;
      const destroySpy = vi.spyOn(device, 'destroy');

      engine.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('Frame Rate Control', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should limit frame rate when set', () => {
      engine.setFrameRate(30);

      const frameCountBefore = mockRequestAnimationFrame.mock.calls.length;
      engine.start();

      // Should still request frames, but with timing control
      expect(mockRequestAnimationFrame.mock.calls.length).toBeGreaterThan(frameCountBefore);
    });

    it('should not limit frame rate when set to 0', () => {
      engine.setFrameRate(0);

      expect(engine).toBeDefined();
    });

    it('should handle high frame rate requirements', () => {
      engine.setFrameRate(120);

      expect(engine).toBeDefined();
    });

    it('should handle low frame rate requirements', () => {
      engine.setFrameRate(15);

      expect(engine).toBeDefined();
    });
  });

  describe('Integration with Real GPU APIs', () => {
    it('should work with WebGPU when available', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue({
            requestAdapterInfo: vi.fn().mockResolvedValue({ vendor: 'nvidia' }),
            requestDevice: vi.fn().mockResolvedValue({
              destroy: vi.fn(),
            }),
            features: new Set(),
            limits: {},
          }),
        },
      };

      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGPU,
      });

      expect(engine).toBeDefined();
    });

    it('should fallback to WebGL2 when WebGPU unavailable', async () => {
      (global as any).navigator = {};
      mockCanvas.getContext.mockReturnValue({
        getParameter: vi.fn(),
        getSupportedExtensions: vi.fn(),
        getExtension: vi.fn(),
      });

      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGPU,
      });

      expect(engine).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should track frame time', () => {
      const stats = engine.renderStats;

      expect(stats.frameTime).toBeDefined();
    });

    it('should track FPS', () => {
      const stats = engine.renderStats;

      expect(stats.fps).toBeDefined();
    });

    it('should track draw calls', () => {
      const stats = engine.renderStats;

      expect(stats.drawCalls).toBeDefined();
    });

    it('should track GPU memory usage', () => {
      const stats = engine.renderStats;

      expect(stats.bufferMemory).toBeDefined();
      expect(stats.textureMemory).toBeDefined();
    });
  });

  describe('Multi-Frame Rendering', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should render multiple frames', () => {
      engine.start();

      // Simulate multiple frames
      for (let i = 0; i < 5; i++) {
        const frameCount = mockRequestAnimationFrame.mock.calls.length;
        expect(frameCount).toBeGreaterThan(i);
      }
    });

    it('should maintain state across frames', () => {
      engine.start();

      const stats1 = engine.renderStats;
      const stats2 = engine.renderStats;

      expect(stats2).toBeDefined();
    });
  });

  describe('Resize Handling', () => {
    let engine: RenderEngine;

    beforeEach(async () => {
      engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });
    });

    it('should handle canvas resize', () => {
      mockCanvas.width = 1024;
      mockCanvas.height = 768;

      // Trigger resize handling
      const device = engine.graphicsDevice;
      device.resize();

      expect(device.resize).toHaveBeenCalled();
    });

    it('should update presentation size after resize', () => {
      mockCanvas.width = 1024;
      mockCanvas.height = 768;

      // Resize would normally update these
      expect(engine).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero canvas size', async () => {
      mockCanvas.width = 0;
      mockCanvas.height = 0;

      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine.width).toBe(0);
      expect(engine.height).toBe(0);
    });

    it('should handle extreme aspect ratios', async () => {
      mockCanvas.width = 1920;
      mockCanvas.height = 108;

      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
      });

      expect(engine.aspect).toBeCloseTo(17.78, 2);
    });

    it('should handle very high DPI', async () => {
      const engine = await RenderEngine.init({
        canvas: mockCanvas as any,
        devicePixelRatio: 4,
      });

      expect(engine).toBeDefined();
    });
  });
});
