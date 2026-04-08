/**
 * Unit tests for CapabilityDetector
 * Tests GPU capability detection for WebGPU and WebGL2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CapabilityDetector, RenderAPI } from '../../packages/core/src/render/core/Capability';

// Mock WebGPU adapter
const mockWebGPUAdapter = {
  requestAdapterInfo: vi.fn().mockResolvedValue({
    vendor: 'nvidia',
    architecture: 'nvidia',
    device: 'geforce-rtx-3080',
    description: 'NVIDIA GeForce RTX 3080',
  }),
  features: new Set([
    'texture-compression-bc',
    'texture-compression-etc2',
    'texture-compression-astc',
    'timestamp-query',
    'pipeline-statistics-query',
  ]),
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
};

// Mock WebGL2 context
const mockWebGL2Context = {
  getParameter: vi.fn(),
  getSupportedExtensions: vi.fn(),
  getExtension: vi.fn(),
};

// Mock canvas element
const mockCanvas = {
  getContext: vi.fn(),
};

describe('CapabilityDetector', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Setup canvas mock
    mockCanvas.getContext.mockReturnValue(mockWebGL2Context);

    // Setup document.createElement
    global.document = createElement as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    CapabilityDetector.clearCache();
  });

  describe('WebGPU Detection', () => {
    it('should detect WebGPU when available', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const capability = await CapabilityDetector.detect();

      expect(capability.api).toBe(RenderAPI.WebGPU);
      expect(capability.features).toBeInstanceOf(Set);
      expect(capability.features.size).toBeGreaterThan(0);
    });

    it('should collect WebGPU features', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const capability = await CapabilityDetector.detect();

      expect(capability.features.has('texture-compression-bc')).toBe(true);
      expect(capability.features.has('timestamp-query')).toBe(true);
    });

    it('should collect WebGPU limits', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const capability = await CapabilityDetector.detect();

      expect(capability.limits.maxTextureDimension2D).toBe(8192);
      expect(capability.limits.maxVertexAttributes).toBe(16);
    });

    it('should return null when WebGPU is not available', async () => {
      (global as any).navigator = {};

      const capability = await CapabilityDetector.detect();

      expect(capability.api).not.toBe(RenderAPI.WebGPU);
    });

    it('should handle WebGPU adapter request failure', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
      };

      const capability = await CapabilityDetector.detect();

      expect(capability.api).not.toBe(RenderAPI.WebGPU);
    });

    it('should request adapter with high-performance power preference', async () => {
      const mockRequestAdapter = vi.fn().mockResolvedValue(mockWebGPUAdapter);
      (global as any).navigator = {
        gpu: {
          requestAdapter: mockRequestAdapter,
        },
      };

      await CapabilityDetector.detect();

      expect(mockRequestAdapter).toHaveBeenCalledWith({
        powerPreference: 'high-performance',
      });
    });
  });

  describe('WebGL2 Detection', () => {
    it('should detect WebGL2 when available', async () => {
      (global as any).navigator = {}; // No WebGPU
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      mockWebGL2Context.getParameter.mockImplementation((param: number) => {
        const limits: Record<number, number> = {
          0x0d33: 16384, // MAX_TEXTURE_SIZE
          0x8073: 2048, // MAX_3D_TEXTURE_SIZE
          0x0d38: 256, // MAX_ARRAY_TEXTURE_LAYERS
          0x8869: 16, // MAX_VERTEX_ATTRIBS
          0x8a2f: 16, // MAX_VERTEX_ATTRIB_BINDINGS
          0x8a40: 65536, // MAX_UNIFORM_BLOCK_SIZE
          0x8a34: 256, // UNIFORM_BUFFER_OFFSET_ALIGNMENT
        };
        return limits[param] || 0;
      });

      mockWebGL2Context.getSupportedExtensions.mockReturnValue([
        'EXT_texture_compression_bptc',
        'EXT_texture_compression_rgtc',
      ]);

      const capability = await CapabilityDetector.detect();

      expect(capability.api).toBe(RenderAPI.WebGL2);
      expect(capability.features).toBeInstanceOf(Set);
    });

    it('should add WebGL2 core features', async () => {
      (global as any).navigator = {};
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      mockWebGL2Context.getParameter.mockReturnValue(0);

      const capability = await CapabilityDetector.detect();

      expect(capability.features.has('webgl2')).toBe(true);
      expect(capability.features.has('vertex-array-object')).toBe(true);
      expect(capability.features.has('instanced-rendering')).toBe(true);
    });

    it('should collect WebGL2 extensions as features', async () => {
      (global as any).navigator = {};
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      mockWebGL2Context.getParameter.mockReturnValue(0);
      mockWebGL2Context.getSupportedExtensions.mockReturnValue([
        'EXT_texture_filter_anisotropic',
        'OES_texture_float_linear',
      ]);

      const capability = await CapabilityDetector.detect();

      expect(capability.features.has('EXT_texture_filter_anisotropic')).toBe(true);
      expect(capability.features.has('OES_texture_float_linear')).toBe(true);
    });

    it('should collect WebGL2 limits', async () => {
      (global as any).navigator = {};
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      mockWebGL2Context.getParameter.mockImplementation((param: number) => {
        const limits: Record<number, number> = {
          0x0d33: 16384, // MAX_TEXTURE_SIZE
          0x8073: 2048, // MAX_3D_TEXTURE_SIZE
          0x0d38: 256, // MAX_ARRAY_TEXTURE_LAYERS
          0x8869: 16, // MAX_VERTEX_ATTRIBS
        };
        return limits[param] || 0;
      });

      const capability = await CapabilityDetector.detect();

      expect(capability.limits.maxTextureDimension2D).toBe(16384);
      expect(capability.limits.maxTextureDimension3D).toBe(2048);
      expect(capability.limits.maxTextureArrayLayers).toBe(256);
    });

    it('should return null when WebGL2 is not available', async () => {
      (global as any).navigator = {};
      mockCanvas.getContext.mockReturnValue(null);

      const capability = await CapabilityDetector.detect();

      expect(capability.api).toBe(RenderAPI.None);
    });
  });

  describe('Feature Detection', () => {
    it('should check if a specific feature is supported', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const hasTextureCompression = await CapabilityDetector.hasFeature('texture-compression-bc');

      expect(hasTextureCompression).toBe(true);
    });

    it('should return false for unsupported feature', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const hasRayTracing = await CapabilityDetector.hasFeature('ray-tracing');

      expect(hasRayTracing).toBe(false);
    });

    it('should cache feature detection results', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      // First call
      await CapabilityDetector.hasFeature('texture-compression-bc');
      // Second call - should use cache
      await CapabilityDetector.hasFeature('texture-compression-bc');

      // Should only call requestAdapter once
      expect((global as any).navigator.gpu.requestAdapter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Limit Checking', () => {
    it('should check if limit meets requirement', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const meetsRequirement = await CapabilityDetector.meetsLimit('maxTextureDimension2D', 4096);

      expect(meetsRequirement).toBe(true);
    });

    it('should return false when limit does not meet requirement', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const meetsRequirement = await CapabilityDetector.meetsLimit('maxTextureDimension2D', 16384);

      expect(meetsRequirement).toBe(false);
    });

    it('should return false for undefined limit', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const meetsRequirement = await CapabilityDetector.meetsLimit('nonExistentLimit' as any, 100);

      expect(meetsRequirement).toBe(false);
    });
  });

  describe('API Fallback', () => {
    it('should prefer WebGPU over WebGL2', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      const capability = await CapabilityDetector.detect();

      expect(capability.api).toBe(RenderAPI.WebGPU);
    });

    it('should fall back to WebGL2 when WebGPU unavailable', async () => {
      (global as any).navigator = {};
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      mockWebGL2Context.getParameter.mockReturnValue(0);

      const capability = await CapabilityDetector.detect();

      expect(capability.api).toBe(RenderAPI.WebGL2);
    });

    it('should return None when neither API is available', async () => {
      (global as any).navigator = {};
      mockCanvas.getContext.mockReturnValue(null);
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      const capability = await CapabilityDetector.detect();

      expect(capability.api).toBe(RenderAPI.None);
      expect(capability.features.size).toBe(0);
    });
  });

  describe('Caching', () => {
    it('should cache detection results', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      // First detection
      await CapabilityDetector.detect();
      // Second detection - should use cache
      await CapabilityDetector.detect();

      expect((global as any).navigator.gpu.requestAdapter).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      await CapabilityDetector.detect();
      CapabilityDetector.clearCache();
      await CapabilityDetector.detect();

      expect((global as any).navigator.gpu.requestAdapter).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle WebGPU requestAdapter rejection', async () => {
      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockRejectedValue(new Error('GPU error')),
        },
      };
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };
      mockWebGL2Context.getParameter.mockReturnValue(0);

      const capability = await CapabilityDetector.detect();

      expect(capability.api).not.toBe(RenderAPI.WebGPU);
      expect(console.warn).toHaveBeenCalledWith(
        '[CapabilityDetector] WebGPU detection failed:',
        expect.any(Error),
      );
    });

    it('should handle missing WebGL2 debug info', async () => {
      (global as any).navigator = {};
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };
      mockWebGL2Context.getExtension.mockReturnValue(null);
      mockWebGL2Context.getParameter.mockReturnValue(0);

      const capability = await CapabilityDetector.detect();

      expect(capability.api).toBe(RenderAPI.WebGL2);
    });

    it('should handle empty WebGL2 extensions array', async () => {
      (global as any).navigator = {};
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };
      mockWebGL2Context.getSupportedExtensions.mockReturnValue(null);
      mockWebGL2Context.getParameter.mockReturnValue(0);

      const capability = await CapabilityDetector.detect();

      expect(capability.api).toBe(RenderAPI.WebGL2);
      expect(capability.features.size).toBeGreaterThan(0); // Core features still added
    });
  });

  describe('Logging', () => {
    it('should log WebGPU detection details', async () => {
      const logSpy = vi.spyOn(console, 'log');

      (global as any).navigator = {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockWebGPUAdapter),
        },
      };

      await CapabilityDetector.detect();

      expect(logSpy).toHaveBeenCalledWith(
        '[CapabilityDetector] WebGPU detected:',
        expect.objectContaining({
          vendor: 'nvidia',
          architecture: 'nvidia',
        }),
      );
    });

    it('should log WebGL2 detection details when debug info available', async () => {
      const logSpy = vi.spyOn(console, 'log');

      (global as any).navigator = {};
      (global as any).document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      };

      mockWebGL2Context.getParameter.mockImplementation((param: number) => {
        if (param === 0x9245) return 'NVIDIA Corporation'; // UNMASKED_VENDOR_WEBGL
        if (param === 0x9246) return 'NVIDIA GeForce RTX 3080'; // UNMASKED_RENDERER_WEBGL
        return 0;
      });

      mockWebGL2Context.getExtension.mockImplementation((name: string) => {
        if (name === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_VENDOR_WEBGL: 0x9245,
            UNMASKED_RENDERER_WEBGL: 0x9246,
          };
        }
        return null;
      });

      mockWebGL2Context.getSupportedExtensions.mockReturnValue([]);

      await CapabilityDetector.detect();

      expect(logSpy).toHaveBeenCalledWith(
        '[CapabilityDetector] WebGL2 detected:',
        expect.objectContaining({
          vendor: 'NVIDIA Corporation',
          renderer: 'NVIDIA GeForce RTX 3080',
        }),
      );
    });
  });
});
