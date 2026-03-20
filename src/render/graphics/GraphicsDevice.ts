/**
 * AniMaker Rendering Engine - Graphics Device Interface
 *
 * This module defines the unified graphics device interface that abstracts
 * the differences between WebGPU and WebGL2, providing a consistent API
 * for the rendering engine.
 *
 * @module graphics
 */

import type {
  BufferDescriptor,
  GraphicsBuffer,
  TextureDescriptor,
  GraphicsTexture,
  SamplerDescriptor,
  GraphicsSampler,
  ShaderModuleDescriptor,
  GraphicsShader,
  GraphicsPipeline,
  ComputePipeline,
  BindGroupLayout,
  BindGroup,
  CommandEncoder,
  Queue,
  DeviceLimits,
} from '../core/types';

import type { RenderAPI } from '../core/types';

/**
 * Graphics Device Configuration
 *
 * Configuration options for creating a graphics device.
 */
export interface GraphicsDeviceConfig {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Preferred power preference for adapter selection */
  powerPreference?: 'high-performance' | 'low-power';
  /** Device pixel ratio for high-DPI displays */
  devicePixelRatio?: number;
  /** Enable debug mode (additional validation, logging) */
  debugMode?: boolean;
  /** Preferred rendering API */
  apiPreference?: RenderAPI;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Enable alpha channel */
  alpha?: boolean;
  /** Enable depth buffer */
  depth?: boolean;
  /** Enable stencil buffer */
  stencil?: boolean;
  /** Required features for the device */
  requiredFeatures?: string[];
  /** Required limits for the device */
  requiredLimits?: Record<string, number>;
}

/**
 * Graphics Device Interface
 *
 * Abstract interface for graphics devices (WebGPU/WebGL2).
 * All methods must be implemented by concrete device classes.
 *
 * @example
 * ```typescript
 * const device = await GraphicsDevice.create({ canvas: myCanvas });
 * const buffer = device.createBuffer({ size: 1024, usage: BufferUsage.VERTEX });
 * ```
 */
export interface GraphicsDevice {
  /** Device label for debugging */
  readonly label: string;

  /** Adapter information (vendor, architecture, etc.) */
  readonly adapterInfo: GPUAdapterInfo | null;

  /** Supported features set */
  readonly features: Set<string>;

  /** Device limits (max texture sizes, buffer sizes, etc.) */
  readonly limits: DeviceLimits;

  /** Command queue for submitting work */
  readonly queue: Queue;

  /** Underlying API type (WebGPU or WebGL2) */
  readonly api: RenderAPI;

  /** Canvas element being rendered to */
  readonly canvas: HTMLCanvasElement;

  /** Presentation format for the canvas */
  readonly presentationFormat: GPUTextureFormat;

  /** Current presentation size [width, height] */
  readonly presentationSize: [number, number];

  /** Current aspect ratio (width / height) */
  readonly aspect: number;

  /** Device pixel ratio */
  readonly pixelRatio: number;

  // ==========================================================================
  // Resource Creation
  // ==========================================================================

  /**
   * Create a GPU buffer
   *
   * @param descriptor - Buffer creation descriptor
   * @returns New graphics buffer
   *
   * @example
   * ```typescript
   * const buffer = device.createBuffer({
   *   size: 256,
   *   usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
   * });
   * ```
   */
  createBuffer(descriptor: BufferDescriptor): GraphicsBuffer;

  /**
   * Create a GPU texture
   *
   * @param descriptor - Texture creation descriptor
   * @returns New graphics texture
   *
   * @example
   * ```typescript
   * const texture = device.createTexture({
   *   size: [512, 512],
   *   dimension: '2d',
   *   format: 'rgba8unorm',
   *   usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
   * });
   * ```
   */
  createTexture(descriptor: TextureDescriptor): GraphicsTexture;

  /**
   * Create a texture sampler
   *
   * @param descriptor - Sampler creation descriptor
   * @returns New graphics sampler
   *
   * @example
   * ```typescript
   * const sampler = device.createSampler({
   *   addressModeU: 'repeat',
   *   addressModeV: 'repeat',
   *   magFilter: 'linear',
   *   minFilter: 'linear',
   * });
   * ```
   */
  createSampler(descriptor: SamplerDescriptor): GraphicsSampler;

  /**
   * Create a shader module
   *
   * @param descriptor - Shader module creation descriptor
   * @returns New graphics shader
   *
   * @example
   * ```typescript
   * const shader = device.createShaderModule({
   *   label: 'MyShader',
   *   code: wgslCode,
   * });
   * ```
   */
  createShaderModule(descriptor: ShaderModuleDescriptor): GraphicsShader;

  /**
   * Create a render pipeline
   *
   * @param descriptor - Render pipeline creation descriptor
   * @returns New graphics pipeline
   */
  createRenderPipeline(descriptor: any): GraphicsPipeline;

  /**
   * Create a compute pipeline
   *
   * @param descriptor - Compute pipeline creation descriptor
   * @returns New compute pipeline
   */
  createComputePipeline(descriptor: any): ComputePipeline;

  /**
   * Create a bind group layout
   *
   * @param descriptor - Bind group layout descriptor
   * @returns New bind group layout
   */
  createBindGroupLayout(descriptor: any): BindGroupLayout;

  /**
   * Create a pipeline layout
   *
   * @param descriptor - Pipeline layout descriptor
   * @returns New pipeline layout
   */
  createPipelineLayout(descriptor: any): any;

  /**
   * Create a bind group
   *
   * @param descriptor - Bind group creation descriptor
   * @returns New bind group
   */
  createBindGroup(descriptor: any): BindGroup;

  /**
   * Create a render bundle encoder (WebGPU only)
   *
   * @param descriptor - Render bundle encoder descriptor
   * @returns New render bundle encoder or null if not supported
   */
  createRenderBundleEncoder?(descriptor: any): any;

  /**
   * Create a query set
   *
   * @param descriptor - Query set creation descriptor
   * @returns New query set
   */
  createQuerySet(descriptor: any): any;

  // ==========================================================================
  // Command Encoding
  // ==========================================================================

  /**
   * Create a command encoder for recording commands
   *
   * @returns New command encoder
   *
   * @example
   * ```typescript
   * const encoder = device.createCommandEncoder();
   * // ... record commands ...
   * device.queue.submit([encoder.finish()]);
   * ```
   */
  createCommandEncoder(): CommandEncoder;

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  /**
   * Push a debug group for error scopes
   *
   * @param groupLabel - Label for the debug group
   */
  pushErrorScope?(groupLabel: string): void;

  /**
   * Pop a debug group and get any errors
   *
   * @returns Promise that resolves to any errors that occurred
   */
  popErrorScope?(): Promise<any>;

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Handle canvas resize
   *
   * Updates the presentation size and reconfigures the context if needed.
   */
  resize(): void;

  /**
   * Lose the device (for testing or error recovery)
   */
  loseDevice(): void;

  /**
   * Destroy the device and release all resources
   *
   * After calling this method, the device cannot be used.
   */
  destroy(): void;
}

/**
 * Graphics Device Factory
 *
 * Factory function for creating graphics devices based on available APIs.
 */
export class GraphicsDeviceFactory {
  private static cachedCapabilities: Map<string, any> = new Map();

  /**
   * Create a graphics device
   *
   * Attempts to create a device with the preferred API, falling back to
   * alternative APIs if necessary.
   *
   * @param config - Device configuration
   * @returns Promise resolving to a graphics device
   * @throws Error if no supported API is available
   *
   * @example
   * ```typescript
   * // Prefer WebGPU, fall back to WebGL2
   * const device = await GraphicsDeviceFactory.create({
   *   canvas: document.querySelector('canvas'),
   *   apiPreference: RenderAPI.WebGPU,
   * });
   *
   * // Force WebGL2
   * const glDevice = await GraphicsDeviceFactory.create({
   *   canvas: document.querySelector('canvas'),
   *   apiPreference: RenderAPI.WebGL2,
   * });
   * ```
   */
  static async create(config: GraphicsDeviceConfig): Promise<GraphicsDevice> {
    const { apiPreference = RenderAPI.WebGPU } = config;

    // Try preferred API first
    if (apiPreference === RenderAPI.WebGPU) {
      const webgpu = await this.tryCreateWebGPU(config);
      if (webgpu) {
        console.log('[GraphicsDeviceFactory] Created WebGPU device');
        return webgpu;
      }
      // Fall back to WebGL2
      console.warn('[GraphicsDeviceFactory] WebGPU not available, falling back to WebGL2');
    }

    // Try WebGL2
    const webgl2 = await this.tryCreateWebGL2(config);
    if (webgl2) {
      console.log('[GraphicsDeviceFactory] Created WebGL2 device');
      return webgl2;
    }

    throw new Error(
      'No supported graphics API available. WebGPU or WebGL2 is required.'
    );
  }

  /**
   * Try to create a WebGPU device
   *
   * @param config - Device configuration
   * @returns WebGPU device or null if not available
   */
  private static async tryCreateWebGPU(
    config: GraphicsDeviceConfig
  ): Promise<GraphicsDevice | null> {
    if (!navigator.gpu) {
      return null;
    }

    try {
      const { WebGPUDevice } = await import('./webgpu/WebGPUDevice');
      return await WebGPUDevice.create(config);
    } catch (error) {
      console.warn('[GraphicsDeviceFactory] WebGPU creation failed:', error);
      return null;
    }
  }

  /**
   * Try to create a WebGL2 device
   *
   * @param config - Device configuration
   * @returns WebGL2 device or null if not available
   */
  private static async tryCreateWebGL2(
    config: GraphicsDeviceConfig
  ): Promise<GraphicsDevice | null> {
    const canvas = config.canvas;
    const gl = canvas.getContext('webgl2', {
      antialias: config.antialias ?? true,
      alpha: config.alpha ?? true,
      depth: config.depth ?? true,
      stencil: config.stencil ?? false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      return null;
    }

    try {
      const { WebGL2Device } = await import('./webgl2/WebGL2Device');
      return await WebGL2Device.create(config, gl as WebGL2RenderingContext);
    } catch (error) {
      console.warn('[GraphicsDeviceFactory] WebGL2 creation failed:', error);
      return null;
    }
  }

  /**
   * Check if WebGPU is available
   *
   * @returns True if WebGPU is available
   */
  static isWebGPUAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.gpu !== 'undefined';
  }

  /**
   * Check if WebGL2 is available
   *
   * @returns True if WebGL2 is available
   */
  static isWebGL2Available(): boolean {
    const canvas = document.createElement('canvas');
    return typeof canvas.getContext === 'function' && canvas.getContext('webgl2') !== null;
  }

  /**
   * Get available rendering APIs
   *
   * @returns Set of available APIs
   */
  static getAvailableAPIs(): Set<RenderAPI> {
    const apis = new Set<RenderAPI>();
    if (this.isWebGPUAvailable()) {
      apis.add(RenderAPI.WebGPU);
    }
    if (this.isWebGL2Available()) {
      apis.add(RenderAPI.WebGL2);
    }
    return apis;
  }

  /**
   * Clear cached capabilities
   *
   * Should be called when device capabilities may have changed (e.g., GPU switch).
   */
  static clearCache(): void {
    this.cachedCapabilities.clear();
  }
}

// Re-export types
export type {
  BufferDescriptor,
  GraphicsBuffer,
  TextureDescriptor,
  GraphicsTexture,
  SamplerDescriptor,
  GraphicsSampler,
  ShaderModuleDescriptor,
  GraphicsShader,
  GraphicsPipeline,
  ComputePipeline,
  BindGroupLayout,
  BindGroup,
  CommandEncoder,
  Queue,
  DeviceLimits,
};
