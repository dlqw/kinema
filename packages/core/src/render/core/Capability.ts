/**
 * Kinema Rendering Engine - GPU Capability Detection
 *
 * Detects and reports GPU capabilities for WebGPU and WebGL2.
 */

import type { RenderCapability, DeviceLimits } from './types';
import { RenderAPI } from './types';

export { RenderAPI };

/**
 * GPU Capability Detector
 *
 * Detects available graphics APIs and their capabilities
 */
export class CapabilityDetector {
  private static cachedCapability: RenderCapability | null = null;

  /**
   * Detect available graphics APIs and their capabilities
   *
   * @returns Promise containing render capability information
   */
  static async detect(): Promise<RenderCapability> {
    if (this.cachedCapability) {
      return this.cachedCapability;
    }

    // Try WebGPU first
    const webGPUCapability = await this.detectWebGPU();
    if (webGPUCapability) {
      this.cachedCapability = webGPUCapability;
      return webGPUCapability;
    }

    // Fall back to WebGL2
    const webGL2Capability = this.detectWebGL2();
    if (webGL2Capability) {
      this.cachedCapability = webGL2Capability;
      return webGL2Capability;
    }

    // No supported API
    this.cachedCapability = {
      api: RenderAPI.None,
      features: new Set(),
      limits: {},
    };
    return this.cachedCapability;
  }

  /**
   * Detect WebGPU capabilities
   */
  private static async detectWebGPU(): Promise<RenderCapability | null> {
    if (!navigator.gpu) {
      return null;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!adapter) {
        return null;
      }

      const features = adapter.features;
      const limits = adapter.limits;

      // Collect feature names
      const featureSet = new Set<string>();
      for (const feature of features) {
        featureSet.add(feature);
      }

      // Map limits to our DeviceLimits interface
      const deviceLimits: DeviceLimits = {
        maxTextureDimension1D: limits.maxTextureDimension1D,
        maxTextureDimension2D: limits.maxTextureDimension2D,
        maxTextureDimension3D: limits.maxTextureDimension3D,
        maxTextureArrayLayers: limits.maxTextureArrayLayers,
        maxBindGroups: limits.maxBindGroups,
        maxDynamicUniformBuffersPerPipelineLayout: limits.maxDynamicUniformBuffersPerPipelineLayout,
        maxDynamicStorageBuffersPerPipelineLayout: limits.maxDynamicStorageBuffersPerPipelineLayout,
        maxSampledTexturesPerShaderStage: limits.maxSampledTexturesPerShaderStage,
        maxSamplersPerShaderStage: limits.maxSamplersPerShaderStage,
        maxStorageBuffersPerShaderStage: limits.maxStorageBuffersPerShaderStage,
        maxStorageTexturesPerShaderStage: limits.maxStorageTexturesPerShaderStage,
        maxUniformBuffersPerShaderStage: limits.maxUniformBuffersPerShaderStage,
        maxUniformBufferBindingSize: limits.maxUniformBufferBindingSize,
        maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
        minUniformBufferOffsetAlignment: limits.minUniformBufferOffsetAlignment,
        minStorageBufferOffsetAlignment: limits.minStorageBufferOffsetAlignment,
        maxVertexBuffers: limits.maxVertexBuffers,
        maxVertexAttributes: limits.maxVertexAttributes,
        maxVertexBufferArrayStride: limits.maxVertexBufferArrayStride,
      };

      // Get adapter info
      const adapterInfo = adapter.info;

      console.log('[CapabilityDetector] WebGPU detected:', {
        vendor: adapterInfo.vendor,
        architecture: adapterInfo.architecture,
        device: adapterInfo.device,
        description: adapterInfo.description,
        features: Array.from(featureSet),
      });

      return {
        api: RenderAPI.WebGPU,
        features: featureSet,
        limits: deviceLimits,
      };
    } catch (error) {
      console.warn('[CapabilityDetector] WebGPU detection failed:', error);
      return null;
    }
  }

  /**
   * Detect WebGL2 capabilities
   */
  private static detectWebGL2(): RenderCapability | null {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      return null;
    }

    // Collect WebGL2 capabilities
    const featureSet = new Set<string>();
    const limits: DeviceLimits = {};

    // Get limits
    const getLimit = (param: number): number => {
      return gl.getParameter(param) as number;
    };

    limits.maxTextureDimension2D = getLimit(gl.MAX_TEXTURE_SIZE);
    limits.maxTextureDimension3D = getLimit(gl.MAX_3D_TEXTURE_SIZE);
    limits.maxTextureArrayLayers = getLimit(gl.MAX_ARRAY_TEXTURE_LAYERS);
    limits.maxVertexAttributes = getLimit(gl.MAX_VERTEX_ATTRIBS);
    limits.maxVertexBuffers = getLimit(gl.MAX_VERTEX_ATTRIBS); // Use MAX_VERTEX_ATTRIBS as approximation
    limits.maxUniformBufferBindingSize = getLimit(gl.MAX_UNIFORM_BLOCK_SIZE);
    limits.minUniformBufferOffsetAlignment = getLimit(gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT);

    // Detect extensions as features
    const extensions = gl.getSupportedExtensions();
    if (extensions) {
      for (const ext of extensions) {
        featureSet.add(ext);
      }
    }

    // Add WebGL2 core features
    featureSet.add('webgl2');
    featureSet.add('vertex-array-object');
    featureSet.add('instanced-rendering');
    featureSet.add('multiple-render-targets');
    featureSet.add('transform-feedback');

    // Get debug info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      console.log('[CapabilityDetector] WebGL2 detected:', {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        features: Array.from(featureSet),
      });
    }

    return {
      api: RenderAPI.WebGL2,
      features: featureSet,
      limits,
    };
  }

  /**
   * Check if a specific feature is supported
   *
   * @param feature - Feature name to check
   * @returns Promise resolving to true if feature is supported
   */
  static async hasFeature(feature: string): Promise<boolean> {
    const capability = await this.detect();
    return capability.features.has(feature);
  }

  /**
   * Check if a specific limit meets requirements
   *
   * @param limit - Limit name to check
   * @param required - Required minimum value
   * @returns Promise resolving to true if limit meets requirement
   */
  static async meetsLimit(limit: keyof DeviceLimits, required: number): Promise<boolean> {
    const capability = await this.detect();
    const actual = capability.limits[limit];
    return actual !== undefined && actual >= required;
  }

  /**
   * Clear cached capability detection
   */
  static clearCache(): void {
    this.cachedCapability = null;
  }
}

export { RenderCapability };
export type { DeviceLimits };
