/**
 * Unit tests for GraphicsDevice and GraphicsDeviceFactory
 * Tests device creation, API fallback, and resource management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GraphicsDeviceFactory,
  GraphicsDevice,
  GraphicsDeviceConfig,
} from '../../packages/core/src/render/graphics/GraphicsDevice';
import { RenderAPI } from '../../packages/core/src/render/core/Capability';

// Mock canvas element
class MockCanvas {
  width = 800;
  height = 600;
  getContext = vi.fn();
}

// Mock WebGPU device
const mockWebGPUDevice = {
  label: 'mock-webgpu-device',
  destroy: vi.fn(),
  createBuffer: vi.fn(),
  createTexture: vi.fn(),
  createSampler: vi.fn(),
  createShaderModule: vi.fn(),
  createRenderPipeline: vi.fn(),
  createComputePipeline: vi.fn(),
  createBindGroupLayout: vi.fn(),
  createPipelineLayout: vi.fn(),
  createBindGroup: vi.fn(),
  createCommandEncoder: vi.fn(),
  createQuerySet: vi.fn(),
  pushErrorScope: vi.fn(),
  popErrorScope: vi.fn(),
  queue: {
    label: 'mock-queue',
    submit: vi.fn(),
    onSubmittedWorkDone: vi.fn().mockResolvedValue(undefined),
    writeBuffer: vi.fn(),
    writeTexture: vi.fn(),
    copyExternalImageToTexture: vi.fn(),
  },
  features: new Set(['texture-compression-bc']),
  limits: {
    maxTextureDimension2D: 8192,
    maxVertexAttributes: 16,
  },
};

const mockWebGPUAdapter = {
  requestDevice: vi.fn().mockResolvedValue(mockWebGPUDevice),
  requestAdapterInfo: vi.fn().mockResolvedValue({
    vendor: 'nvidia',
    architecture: 'nvidia',
    device: 'geforce-rtx-3080',
    description: 'NVIDIA GeForce RTX 3080',
  }),
};

// Mock WebGL2 context
const mockWebGL2Context = {
  getParameter: vi.fn(),
  getSupportedExtensions: vi.fn(),
  getExtension: vi.fn(),
  createBuffer: vi.fn(),
  createTexture: vi.fn(),
  createSampler: vi.fn(),
  createShader: vi.fn(),
  createProgram: vi.fn(),
  createFramebuffer: vi.fn(),
  createRenderbuffer: vi.fn(),
  createVertexArray: vi.fn(),
  bindBuffer: vi.fn(),
  bindTexture: vi.fn(),
  bindRenderbuffer: vi.fn(),
  bindFramebuffer: vi.fn(),
  bindVertexArray: vi.fn(),
  deleteBuffer: vi.fn(),
  deleteTexture: vi.fn(),
  deleteShader: vi.fn(),
  deleteProgram: vi.fn(),
  deleteFramebuffer: vi.fn(),
  deleteRenderbuffer: vi.fn(),
  deleteVertexArray: vi.fn(),
};

// Mock GraphicsDevice implementations
class MockWebGPUDevice implements GraphicsDevice {
  readonly label = 'mock-webgpu-device';
  readonly adapterInfo: any = {
    vendor: 'nvidia',
    architecture: 'nvidia',
  };
  readonly features = new Set(['texture-compression-bc']);
  readonly limits = {
    maxTextureDimension2D: 8192,
    maxVertexAttributes: 16,
  };
  readonly queue = mockWebGPUDevice.queue;
  readonly api = RenderAPI.WebGPU;
  readonly canvas: HTMLCanvasElement;
  readonly presentationFormat = 'rgba8unorm' as const;
  readonly presentationSize: [number, number];
  readonly aspect: number;
  readonly pixelRatio = 1;

  constructor(config: GraphicsDeviceConfig) {
    this.canvas = config.canvas;
    this.presentationSize = [config.canvas.width, config.canvas.height];
    this.aspect = config.canvas.width / config.canvas.height;
  }

  createBuffer = vi.fn();
  createTexture = vi.fn();
  createSampler = vi.fn();
  createShaderModule = vi.fn();
  createRenderPipeline = vi.fn();
  createComputePipeline = vi.fn();
  createBindGroupLayout = vi.fn();
  createPipelineLayout = vi.fn();
  createBindGroup = vi.fn();
  createCommandEncoder = vi.fn();
  createQuerySet = vi.fn();
  resize = vi.fn();
  loseDevice = vi.fn();
  destroy = vi.fn();
}

class MockWebGL2Device implements GraphicsDevice {
  readonly label = 'mock-webgl2-device';
  readonly adapterInfo = null;
  readonly features = new Set(['webgl2']);
  readonly limits = {
    maxTextureDimension2D: 16384,
    maxVertexAttributes: 16,
  };
  readonly queue = mockWebGPUDevice.queue;
  readonly api = RenderAPI.WebGL2;
  readonly canvas: HTMLCanvasElement;
  readonly presentationFormat = 'rgba8unorm' as const;
  readonly presentationSize: [number, number];
  readonly aspect: number;
  readonly pixelRatio = 1;

  constructor(config: GraphicsDeviceConfig) {
    this.canvas = config.canvas;
    this.presentationSize = [config.canvas.width, config.canvas.height];
    this.aspect = config.canvas.width / config.canvas.height;
  }

  createBuffer = vi.fn();
  createTexture = vi.fn();
  createSampler = vi.fn();
  createShaderModule = vi.fn();
  createRenderPipeline = vi.fn();
  createComputePipeline = vi.fn();
  createBindGroupLayout = vi.fn();
  createPipelineLayout = vi.fn();
  createBindGroup = vi.fn();
  createCommandEncoder = vi.fn();
  createQuerySet = vi.fn();
  resize = vi.fn();
  loseDevice = vi.fn();
  destroy = vi.fn();
}

describe('GraphicsDeviceFactory', () => {
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    mockCanvas = new MockCanvas();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Setup global objects
    (global as any).document = {
      createElement: vi.fn().mockReturnValue(mockCanvas),
    };
    (global as any).navigator = {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Device Creation', () => {
    it('should create WebGPU device when preferred and available', async () => {
      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGPU,
      };

      // Mock dynamic import
      vi.doMock('../../../src/render/graphics/webgpu/WebGPUDevice', () => ({
        WebGPUDevice: {
          create: vi.fn().mockResolvedValue(new MockWebGPUDevice(config)),
        },
      }));

      const device = await GraphicsDeviceFactory.create(config);

      expect(device).toBeDefined();
      expect(device.api).toBe(RenderAPI.WebGPU);
    });

    it('should create WebGL2 device when WebGPU unavailable', async () => {
      (global as any).navigator = {}; // No WebGPU
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGPU,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device).toBeDefined();
    });

    it('should create WebGL2 device when preferred', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGL2,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device).toBeDefined();
      expect(device.api).toBe(RenderAPI.WebGL2);
    });

    it('should throw error when no API available', async () => {
      (global as any).navigator = {};
      mockCanvas.getContext.mockReturnValue(null);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
      };

      await expect(GraphicsDeviceFactory.create(config)).rejects.toThrow(
        'No supported graphics API available',
      );
    });
  });

  describe('API Availability Checks', () => {
    it('should detect WebGPU availability', () => {
      (global as any).navigator = {
        gpu: {},
      };

      expect(GraphicsDeviceFactory.isWebGPUAvailable()).toBe(true);
    });

    it('should detect WebGPU unavailability', () => {
      (global as any).navigator = {};

      expect(GraphicsDeviceFactory.isWebGPUAvailable()).toBe(false);
    });

    it('should detect WebGL2 availability', () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      expect(GraphicsDeviceFactory.isWebGL2Available()).toBe(true);
    });

    it('should detect WebGL2 unavailability', () => {
      mockCanvas.getContext.mockReturnValue(null);

      expect(GraphicsDeviceFactory.isWebGL2Available()).toBe(false);
    });

    it('should get available APIs', () => {
      (global as any).navigator = {
        gpu: {},
      };
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const apis = GraphicsDeviceFactory.getAvailableAPIs();

      expect(apis.has(RenderAPI.WebGPU)).toBe(true);
      expect(apis.has(RenderAPI.WebGL2)).toBe(true);
    });

    it('should return empty set when no APIs available', () => {
      (global as any).navigator = {};
      mockCanvas.getContext.mockReturnValue(null);

      const apis = GraphicsDeviceFactory.getAvailableAPIs();

      expect(apis.size).toBe(0);
    });
  });

  describe('Device Configuration', () => {
    it('should use default configuration when not specified', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device).toBeDefined();
      expect(device.pixelRatio).toBe(1);
    });

    it('should use custom device pixel ratio', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        devicePixelRatio: 2,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.pixelRatio).toBe(2);
    });

    it('should use custom power preference', async () => {
      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        powerPreference: 'low-power',
      };

      expect(config.powerPreference).toBe('low-power');
    });

    it('should enable debug mode when specified', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        debugMode: true,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebGPU creation failure gracefully', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockRejectedValue(new Error('WebGPU error')),
        },
      };
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGPU,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.api).toBe(RenderAPI.WebGL2); // Fallback
      expect(console.warn).toHaveBeenCalledWith(
        '[GraphicsDeviceFactory] WebGPU not available, falling back to WebGL2',
      );
    });

    it('should log warnings when falling back', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(null), // No adapter
        },
      };
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGPU,
      };

      await GraphicsDeviceFactory.create(config);

      expect(console.warn).toHaveBeenCalledWith(
        '[GraphicsDeviceFactory] WebGPU not available, falling back to WebGL2',
      );
    });

    it('should log success when creating WebGPU device', async () => {
      const logSpy = vi.spyOn(console, 'log');

      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGPU,
      };

      await GraphicsDeviceFactory.create(config);

      expect(logSpy).toHaveBeenCalledWith('[GraphicsDeviceFactory] Created WebGPU device');
    });
  });

  describe('Cache Management', () => {
    it('should clear cached capabilities', () => {
      GraphicsDeviceFactory.clearCache();

      expect((GraphicsDeviceFactory as any).cachedCapabilities.size).toBe(0);
    });
  });

  describe('Device Properties', () => {
    it('should have correct presentation size', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.presentationSize).toEqual([800, 600]);
    });

    it('should have correct aspect ratio', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.aspect).toBe(800 / 600);
    });

    it('should handle zero dimensions', async () => {
      mockCanvas.width = 0;
      mockCanvas.height = 0;
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.presentationSize).toEqual([0, 0]);
      expect(device.aspect).toBe(NaN); // 0/0 = NaN
    });

    it('should have canvas reference', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.canvas).toBe(mockCanvas);
    });
  });

  describe('WebGPU to WebGL2 Fallback', () => {
    it('should automatically fallback when WebGPU unavailable', async () => {
      (global as any).navigator = {}; // No WebGPU
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGPU, // Prefer WebGPU
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.api).toBe(RenderAPI.WebGL2);
    });

    it('should respect WebGL2 preference', async () => {
      (global as any).navigator = {
        gpu: {},
      };
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        apiPreference: RenderAPI.WebGL2,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.api).toBe(RenderAPI.WebGL2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large canvas dimensions', async () => {
      mockCanvas.width = 16384;
      mockCanvas.height = 16384;
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.presentationSize).toEqual([16384, 16384]);
    });

    it('should handle very high device pixel ratio', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        devicePixelRatio: 4,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.pixelRatio).toBe(4);
    });

    it('should handle zero device pixel ratio', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

      const config: GraphicsDeviceConfig = {
        canvas: mockCanvas as any,
        devicePixelRatio: 0,
      };

      const device = await GraphicsDeviceFactory.create(config);

      expect(device.pixelRatio).toBe(0);
    });
  });
});

describe('GraphicsDevice Interface', () => {
  let mockDevice: GraphicsDevice;

  beforeEach(() => {
    const mockCanvas = new MockCanvas();
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    mockDevice = {
      label: 'test-device',
      adapterInfo: null,
      features: new Set(['feature1', 'feature2']),
      limits: {
        maxTextureDimension2D: 8192,
        maxVertexAttributes: 16,
      },
      queue: {
        label: 'test-queue',
        submit: vi.fn(),
        onSubmittedWorkDone: vi.fn().mockResolvedValue(undefined),
        writeBuffer: vi.fn(),
        writeTexture: vi.fn(),
        copyExternalImageToTexture: vi.fn(),
      },
      api: RenderAPI.WebGPU,
      canvas: mockCanvas as any,
      presentationFormat: 'rgba8unorm',
      presentationSize: [800, 600],
      aspect: 1.333,
      pixelRatio: 1,
      createBuffer: vi.fn(),
      createTexture: vi.fn(),
      createSampler: vi.fn(),
      createShaderModule: vi.fn(),
      createRenderPipeline: vi.fn(),
      createComputePipeline: vi.fn(),
      createBindGroupLayout: vi.fn(),
      createPipelineLayout: vi.fn(),
      createBindGroup: vi.fn(),
      createCommandEncoder: vi.fn(),
      createQuerySet: vi.fn(),
      resize: vi.fn(),
      loseDevice: vi.fn(),
      destroy: vi.fn(),
    };
  });

  describe('Resource Creation', () => {
    it('should create buffer', () => {
      mockDevice.createBuffer({ size: 1024, usage: 1 });

      expect(mockDevice.createBuffer).toHaveBeenCalledWith({
        size: 1024,
        usage: 1,
      });
    });

    it('should create texture', () => {
      mockDevice.createTexture({
        size: [512, 512],
        dimension: '2d',
        format: 'rgba8unorm',
        usage: 1,
      });

      expect(mockDevice.createTexture).toHaveBeenCalled();
    });

    it('should create sampler', () => {
      mockDevice.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        addressModeW: 'repeat',
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
      });

      expect(mockDevice.createSampler).toHaveBeenCalled();
    });

    it('should create shader module', () => {
      mockDevice.createShaderModule({
        code: 'shader code',
      });

      expect(mockDevice.createShaderModule).toHaveBeenCalledWith({
        code: 'shader code',
      });
    });

    it('should create render pipeline', () => {
      mockDevice.createRenderPipeline({});

      expect(mockDevice.createRenderPipeline).toHaveBeenCalled();
    });

    it('should create command encoder', () => {
      mockDevice.createCommandEncoder();

      expect(mockDevice.createCommandEncoder).toHaveBeenCalled();
    });
  });

  describe('Device Properties', () => {
    it('should have label', () => {
      expect(mockDevice.label).toBe('test-device');
    });

    it('should have features set', () => {
      expect(mockDevice.features).toBeInstanceOf(Set);
      expect(mockDevice.features.has('feature1')).toBe(true);
    });

    it('should have limits', () => {
      expect(mockDevice.limits.maxTextureDimension2D).toBe(8192);
    });

    it('should have queue', () => {
      expect(mockDevice.queue).toBeDefined();
      expect(mockDevice.queue.label).toBe('test-queue');
    });

    it('should have API type', () => {
      expect(mockDevice.api).toBe(RenderAPI.WebGPU);
    });

    it('should have canvas reference', () => {
      expect(mockDevice.canvas).toBeDefined();
    });

    it('should have presentation format', () => {
      expect(mockDevice.presentationFormat).toBe('rgba8unorm');
    });

    it('should have presentation size', () => {
      expect(mockDevice.presentationSize).toEqual([800, 600]);
    });

    it('should have aspect ratio', () => {
      expect(mockDevice.aspect).toBeCloseTo(1.333, 3);
    });

    it('should have pixel ratio', () => {
      expect(mockDevice.pixelRatio).toBe(1);
    });
  });

  describe('Lifecycle Methods', () => {
    it('should call resize', () => {
      mockDevice.resize();

      expect(mockDevice.resize).toHaveBeenCalled();
    });

    it('should call loseDevice', () => {
      mockDevice.loseDevice();

      expect(mockDevice.loseDevice).toHaveBeenCalled();
    });

    it('should call destroy', () => {
      mockDevice.destroy();

      expect(mockDevice.destroy).toHaveBeenCalled();
    });
  });
});
