/**
 * Kinema Rendering Engine - WebGL2 Device Implementation
 *
 * This module implements the GraphicsDevice interface for WebGL2.
 * It serves as a fallback when WebGPU is not available.
 *
 * @module graphics.webgl2
 */

import type { GraphicsDevice, GraphicsDeviceConfig } from '../GraphicsDevice';

import { RenderAPI } from '../GraphicsDevice';

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
  IndexFormat,
  CommandBuffer,
  RenderPassEncoder,
  QuerySet,
} from '../../core/types';

/**
 * WebGL2 Device Implementation
 *
 * Implements GraphicsDevice interface using the WebGL2 API.
 * This provides a fallback for browsers that don't support WebGPU.
 *
 * @example
 * ```typescript
 * const device = await WebGL2Device.create({
 *   canvas: document.querySelector('canvas'),
 *   powerPreference: 'high-performance',
 * });
 * ```
 */
export class WebGL2Device implements GraphicsDevice {
  // ==========================================================================
  // Public Properties
  // ==========================================================================

  readonly label: string = 'WebGL2Device';
  readonly api: RenderAPI = RenderAPI.WebGL2;
  readonly canvas: HTMLCanvasElement;
  readonly presentationFormat: GPUTextureFormat = 'bgra8unorm'; // WebGL2 uses BGRA
  readonly pixelRatio: number;

  /** Native WebGL2 rendering context */
  public readonly gl: WebGL2RenderingContext;

  /** Adapter information (simulated for WebGL2) */
  readonly adapterInfo: {
    vendor: string;
    architecture: string;
    device: string;
    description: string;
  } | null = null;

  /** Supported features set */
  readonly features: Set<string>;

  /** Device limits */
  readonly limits: DeviceLimits;

  /** Command queue wrapper */
  readonly queue: Queue;

  /** Current presentation size */
  readonly presentationSize: [number, number] = [0, 0];

  /** Current aspect ratio */
  readonly aspect: number = 1;

  private _isDestroyed: boolean = false;
  private _config: GraphicsDeviceConfig;
  private _resourceIdCounter: number = 0;
  private _buffers: Map<number, WebGLBuffer> = new Map();
  private _textures: Map<number, WebGLTexture> = new Map();
  private _programs: Map<number, WebGLProgram> = new Map();
  private _framebuffers: Map<number, WebGLFramebuffer> = new Map();
  private _renderbuffers: Map<number, WebGLRenderbuffer> = new Map();

  // ==========================================================================
  // Constructor
  // ==========================================================================

  private constructor(config: GraphicsDeviceConfig, gl: WebGL2RenderingContext) {
    this._config = config;
    this.canvas = config.canvas;
    this.gl = gl;
    this.pixelRatio = config.devicePixelRatio ?? window.devicePixelRatio ?? 1;

    // Detect and collect features
    this.features = this.detectFeatures(gl);

    // Map limits
    this.limits = this.mapLimits(gl);

    // Create queue wrapper
    this.queue = new WebGL2Queue(gl);

    // Initialize presentation size
    this.updatePresentationSize();

    // Create adapter info (simulated)
    this.adapterInfo = this.createAdapterInfo(gl);

    // Setup error handling
    this.setupErrorHandling();

    // Log device info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      console.log('[WebGL2Device] Initialized:', {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        features: Array.from(this.features).slice(0, 10).join(', '),
        ...(this.features.size > 10 && { more: `+${this.features.size - 10} more` }),
      });
    } else {
      console.log('[WebGL2Device] Initialized:', {
        version: gl.getParameter(gl.VERSION),
        features: Array.from(this.features).slice(0, 10).join(', '),
      });
    }
  }

  // ==========================================================================
  // Static Factory
  // ==========================================================================

  /**
   * Create a WebGL2 device
   *
   * @param config - Device configuration
   * @param gl - WebGL2 rendering context
   * @returns Promise resolving to a WebGL2 device
   * @throws Error if WebGL2 context creation fails
   */
  static async create(
    config: GraphicsDeviceConfig,
    gl: WebGL2RenderingContext,
  ): Promise<WebGL2Device> {
    return new WebGL2Device(config, gl);
  }

  // ==========================================================================
  // Resource Creation
  // ==========================================================================

  createBuffer(descriptor: BufferDescriptor): GraphicsBuffer {
    this.checkNotDestroyed();

    const gl = this.gl;
    const buffer = gl.createBuffer();

    if (!buffer) {
      throw new Error('Failed to create WebGL buffer');
    }

    const resourceId = this._resourceIdCounter++;
    this._buffers.set(resourceId, buffer);

    // Determine target based on usage
    let target: GLenum;
    if (descriptor.usage & 0x10) {
      // INDEX buffer
      target = gl.ELEMENT_ARRAY_BUFFER;
    } else if (descriptor.usage & 0x20) {
      // VERTEX buffer
      target = gl.ARRAY_BUFFER;
    } else if (descriptor.usage & 0x40) {
      // UNIFORM buffer
      target = gl.UNIFORM_BUFFER;
    } else if (descriptor.usage & 0x80) {
      // STORAGE buffer (use uniform buffer as fallback)
      target = gl.UNIFORM_BUFFER;
    } else {
      target = gl.ARRAY_BUFFER;
    }

    return new WebGL2Buffer(gl, buffer, descriptor, resourceId, target);
  }

  createTexture(descriptor: TextureDescriptor): GraphicsTexture {
    this.checkNotDestroyed();

    const gl = this.gl;
    const texture = gl.createTexture();

    if (!texture) {
      throw new Error('Failed to create WebGL texture');
    }

    const resourceId = this._resourceIdCounter++;
    this._textures.set(resourceId, texture);

    return new WebGL2Texture(gl, texture, descriptor, resourceId);
  }

  createSampler(descriptor: SamplerDescriptor): GraphicsSampler {
    this.checkNotDestroyed();

    const gl = this.gl;
    const sampler = gl.createSampler();

    if (!sampler) {
      throw new Error('Failed to create WebGL sampler');
    }

    // Set sampler parameters
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, this.mapAddressMode(descriptor.addressModeU));
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, this.mapAddressMode(descriptor.addressModeV));
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, this.mapAddressMode(descriptor.addressModeW));
    gl.samplerParameteri(
      sampler,
      gl.TEXTURE_MIN_FILTER,
      this.mapFilterMode(descriptor.minFilter, descriptor.mipmapFilter),
    );
    gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, this.mapFilterMode(descriptor.magFilter));

    if (descriptor.lodMinClamp !== undefined) {
      gl.samplerParameterf(sampler, gl.TEXTURE_MIN_LOD, descriptor.lodMinClamp);
    }
    if (descriptor.lodMaxClamp !== undefined) {
      gl.samplerParameterf(sampler, gl.TEXTURE_MAX_LOD, descriptor.lodMaxClamp);
    }
    if (descriptor.maxAnisotropy !== undefined) {
      const ext = gl.getExtension('EXT_texture_filter_anisotropic');
      if (ext) {
        gl.samplerParameterf(
          sampler,
          (ext as any).TEXTURE_MAX_ANISOTROPY_EXT,
          descriptor.maxAnisotropy,
        );
      }
    }
    if (descriptor.compare !== undefined) {
      const ext = gl.getExtension('EXT_shadow_samplers');
      if (ext) {
        gl.samplerParameteri(
          sampler,
          (ext as any).TEXTURE_COMPARE_FUNC,
          this.mapCompareFunction(descriptor.compare),
        );
      }
    }

    return new WebGL2Sampler(gl, sampler);
  }

  createShaderModule(descriptor: ShaderModuleDescriptor): GraphicsShader {
    this.checkNotDestroyed();

    const gl = this.gl;

    // Determine shader type based on code content
    let type: GLenum;
    let shaderSource = descriptor.code;

    if (shaderSource.includes('vertex') || shaderSource.includes('gl_Position')) {
      type = gl.VERTEX_SHADER;
    } else if (shaderSource.includes('fragment') || shaderSource.includes('gl_FragColor')) {
      type = gl.FRAGMENT_SHADER;
    } else {
      // Check for compute shader (not directly supported in WebGL2, use transform feedback)
      type = gl.VERTEX_SHADER; // Will need special handling
    }

    // Convert WGSL to GLSL if needed (this is a placeholder)
    // In production, you'd need a WGSL->GLSL transpiler
    if (shaderSource.includes('@vertex') || shaderSource.includes('@fragment')) {
      // WGSL detected - needs conversion
      console.warn('[WebGL2Device] WGSL shaders require conversion to GLSL');
    }

    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create WebGL shader');
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    // Check compilation errors
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${info}`);
    }

    return new WebGL2Shader(gl, shader, descriptor);
  }

  createRenderPipeline(_descriptor: any): GraphicsPipeline {
    this.checkNotDestroyed();
    // TODO: Implement WebGL2 pipeline creation
    throw new Error('WebGL2 render pipeline creation not yet implemented');
  }

  createComputePipeline(_descriptor: any): ComputePipeline {
    this.checkNotDestroyed();
    // WebGL2 doesn't have native compute shaders
    // Use transform feedback as a workaround
    throw new Error('WebGL2 compute pipelines not directly supported (use transform feedback)');
  }

  createBindGroupLayout(_descriptor: any): BindGroupLayout {
    this.checkNotDestroyed();
    // WebGL2 uses uniform blocks instead of bind groups
    throw new Error('WebGL2 bind group layout creation not yet implemented');
  }

  createPipelineLayout(_descriptor: any): any {
    this.checkNotDestroyed();
    // WebGL2 doesn't have explicit pipeline layouts
    return null;
  }

  createBindGroup(_descriptor: any): BindGroup {
    this.checkNotDestroyed();
    throw new Error('WebGL2 bind group creation not yet implemented');
  }

  createQuerySet(descriptor: any): any {
    this.checkNotDestroyed();
    // WebGL2 has limited query support (occlusion, timer)
    const gl = this.gl;

    if (descriptor.type === 'occlusion') {
      const query = gl.createQuery();
      if (!query) {
        throw new Error('Failed to create occlusion query');
      }
      return new WebGL2Query(gl, query, descriptor);
    }

    throw new Error(`WebGL2 query type "${descriptor.type}" not supported`);
  }

  createCommandEncoder(): CommandEncoder {
    this.checkNotDestroyed();
    return new WebGL2CommandEncoder(this.gl, this);
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  pushErrorScope(groupLabel: string): void {
    // WebGL2 doesn't have error scopes like WebGPU
    // Use debug output if available
    if (this._config.debugMode) {
      console.log(`[WebGL2Device] Push error scope: ${groupLabel}`);
    }
  }

  async popErrorScope(): Promise<any> {
    // WebGL2 doesn't have error scopes like WebGPU
    // Check for GL errors
    const error = this.gl.getError();
    if (error !== this.gl.NO_ERROR) {
      return { error: this.mapGLError(error) };
    }
    return null;
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  resize(): void {
    this.updatePresentationSize();
  }

  loseDevice(): void {
    const ext = this.gl.getExtension('WEBGL_lose_context');
    ext?.loseContext?.();
    this._isDestroyed = true;
  }

  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    const gl = this.gl;

    // Clean up all resources
    for (const [_, buffer] of this._buffers) {
      gl.deleteBuffer(buffer);
    }
    for (const [_, texture] of this._textures) {
      gl.deleteTexture(texture);
    }
    for (const [_, program] of this._programs) {
      gl.deleteProgram(program);
    }
    for (const [_, framebuffer] of this._framebuffers) {
      gl.deleteFramebuffer(framebuffer);
    }
    for (const [_, renderbuffer] of this._renderbuffers) {
      gl.deleteRenderbuffer(renderbuffer);
    }

    this._buffers.clear();
    this._textures.clear();
    this._programs.clear();
    this._framebuffers.clear();
    this._renderbuffers.clear();

    this._isDestroyed = true;
    console.log('[WebGL2Device] Destroyed');
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private checkNotDestroyed(): void {
    if (this._isDestroyed) {
      throw new Error('WebGL2Device has been destroyed');
    }
  }

  private updatePresentationSize(): void {
    const pixelRatio = this.pixelRatio;
    const width = Math.floor(this.canvas.clientWidth * pixelRatio);
    const height = Math.floor(this.canvas.clientHeight * pixelRatio);

    if (width !== this.canvas.width || height !== this.canvas.height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }

    (this.presentationSize as any)[0] = this.canvas.width;
    (this.presentationSize as any)[1] = this.canvas.height;
    (this as any).aspect = this.canvas.width / this.canvas.height;
  }

  private setupErrorHandling(): void {
    // Enable debug output in debug mode
    if (this._config.debugMode) {
      const gl = this.gl;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        console.log('[WebGL2Device] Debug mode enabled');
      }
    }
  }

  private detectFeatures(gl: WebGL2RenderingContext): Set<string> {
    const features = new Set<string>();

    // Core WebGL2 features
    features.add('webgl2');
    features.add('vertex-array-object');
    features.add('instanced-rendering');
    features.add('multiple-render-targets');
    features.add('transform-feedback');

    // Detect extensions
    const extensions = gl.getSupportedExtensions();
    if (extensions) {
      for (const ext of extensions) {
        features.add(ext);
      }
    }

    return features;
  }

  private mapLimits(gl: WebGL2RenderingContext): DeviceLimits {
    const getLimit = (param: number): number => {
      const value = gl.getParameter(param);
      return typeof value === 'number' ? value : 0;
    };

    return {
      maxTextureDimension1D: getLimit(gl.MAX_TEXTURE_SIZE),
      maxTextureDimension2D: getLimit(gl.MAX_TEXTURE_SIZE),
      maxTextureDimension3D: getLimit(gl.MAX_3D_TEXTURE_SIZE),
      maxTextureArrayLayers: getLimit(gl.MAX_ARRAY_TEXTURE_LAYERS),
      maxBindGroups: 8, // WebGL2 has a fixed number of texture image units
      maxDynamicUniformBuffersPerPipelineLayout: 0, // Not directly supported
      maxDynamicStorageBuffersPerPipelineLayout: 0, // Not directly supported
      maxSampledTexturesPerShaderStage: getLimit(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxSamplersPerShaderStage: getLimit(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxStorageBuffersPerShaderStage: 0, // Not directly supported
      maxStorageTexturesPerShaderStage: 0, // Not directly supported
      maxUniformBuffersPerShaderStage: getLimit(gl.MAX_UNIFORM_BUFFER_BINDINGS),
      maxUniformBufferBindingSize: getLimit(gl.MAX_UNIFORM_BLOCK_SIZE),
      maxStorageBufferBindingSize: 0, // Not directly supported
      minUniformBufferOffsetAlignment: getLimit(gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT),
      minStorageBufferOffsetAlignment: 0, // Not directly supported
      maxVertexBuffers: getLimit(gl.MAX_VERTEX_ATTRIBS),
      maxVertexAttributes: getLimit(gl.MAX_VERTEX_ATTRIBS),
      maxVertexBufferArrayStride: 2048, // Reasonable default
    };
  }

  private createAdapterInfo(gl: WebGL2RenderingContext): {
    vendor: string;
    architecture: string;
    device: string;
    description: string;
  } {
    // Simulate GPUAdapterInfo for WebGL2
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let vendor = 'unknown';
    let device = 'unknown';

    if (debugInfo) {
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      device = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    return {
      vendor,
      architecture: 'webgl2',
      device,
      description: 'WebGL2 Rendering Context',
    };
  }

  private mapAddressMode(mode: string): number {
    const gl = this.gl;
    switch (mode) {
      case 'clamp-to-edge':
        return gl.CLAMP_TO_EDGE;
      case 'repeat':
        return gl.REPEAT;
      case 'mirror-repeat':
        return gl.MIRRORED_REPEAT;
      default:
        return gl.CLAMP_TO_EDGE;
    }
  }

  private mapFilterMode(mode: string, mipmapMode?: string): number {
    const gl = this.gl;
    if (mipmapMode === 'linear') {
      return mode === 'linear' ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_LINEAR;
    } else {
      return mode === 'linear' ? gl.LINEAR_MIPMAP_NEAREST : gl.NEAREST_MIPMAP_NEAREST;
    }
  }

  private mapCompareFunction(compare: string): number {
    const gl = this.gl;
    switch (compare) {
      case 'never':
        return gl.NEVER;
      case 'less':
        return gl.LESS;
      case 'equal':
        return gl.EQUAL;
      case 'less-equal':
        return gl.LEQUAL;
      case 'greater':
        return gl.GREATER;
      case 'not-equal':
        return gl.NOTEQUAL;
      case 'greater-equal':
        return gl.GEQUAL;
      case 'always':
        return gl.ALWAYS;
      default:
        return gl.LESS;
    }
  }

  private mapGLError(error: number): string {
    const gl = this.gl;
    switch (error) {
      case gl.INVALID_ENUM:
        return 'INVALID_ENUM';
      case gl.INVALID_VALUE:
        return 'INVALID_VALUE';
      case gl.INVALID_OPERATION:
        return 'INVALID_OPERATION';
      case gl.INVALID_FRAMEBUFFER_OPERATION:
        return 'INVALID_FRAMEBUFFER_OPERATION';
      case gl.OUT_OF_MEMORY:
        return 'OUT_OF_MEMORY';
      case gl.CONTEXT_LOST_WEBGL:
        return 'CONTEXT_LOST_WEBGL';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}

// ============================================================================
// WebGL2 Buffer Implementation
// ============================================================================

class WebGL2Buffer implements GraphicsBuffer {
  readonly label: string;
  readonly size: number;
  readonly usage: number;

  private _gl: WebGL2RenderingContext;
  private _buffer: WebGLBuffer;
  private _target: GLenum;
  private _isDestroyed: boolean = false;

  constructor(
    gl: WebGL2RenderingContext,
    buffer: WebGLBuffer,
    descriptor: BufferDescriptor,
    _resourceId: number,
    target: GLenum,
  ) {
    this._gl = gl;
    this._buffer = buffer;
    this._target = target;
    this.label = descriptor.label ?? 'UnnamedBuffer';
    this.size = descriptor.size;
    this.usage = descriptor.usage;
  }

  destroy(): void {
    if (this._isDestroyed) {
      return;
    }
    this._gl.deleteBuffer(this._buffer);
    this._isDestroyed = true;
  }

  async mapAsync(_mode: number, _offset: number = 0, _size?: number): Promise<ArrayBuffer> {
    this.checkNotDestroyed();
    // WebGL2 doesn't have explicit mapping, use bufferSubData instead
    throw new Error('WebGL2 buffers use explicit write operations, not mapping');
  }

  unmap(): void {
    this.checkNotDestroyed();
    // WebGL2 doesn't have explicit mapping
  }

  write(data: ArrayBufferView, offset: number = 0): void {
    this.checkNotDestroyed();
    const gl = this._gl;
    gl.bindBuffer(this._target, this._buffer);
    gl.bufferSubData(this._target, offset, data);
    gl.bindBuffer(this._target, null);
  }

  read(): ArrayBuffer {
    this.checkNotDestroyed();
    // WebGL2 can't read buffers directly without transform feedback
    throw new Error('WebGL2 cannot read buffers directly');
  }

  get nativeBuffer(): WebGLBuffer {
    return this._buffer;
  }

  get target(): GLenum {
    return this._target;
  }

  private checkNotDestroyed(): void {
    if (this._isDestroyed) {
      throw new Error('WebGL2Buffer has been destroyed');
    }
  }
}

// ============================================================================
// WebGL2 Texture Implementation
// ============================================================================

class WebGL2Texture implements GraphicsTexture {
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly mipLevelCount: number;
  readonly format: GPUTextureFormat;
  readonly usage: number;

  private _gl: WebGL2RenderingContext;
  private _texture: WebGLTexture;
  private _isDestroyed: boolean = false;

  constructor(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    descriptor: TextureDescriptor,
    _resourceId: number,
  ) {
    this._gl = gl;
    this._texture = texture;
    this.label = descriptor.label ?? 'UnnamedTexture';
    const size = descriptor.size;
    this.width = size[0];
    this.height = size[1];
    this.depthOrArrayLayers = size[2] ?? 1;
    this.mipLevelCount = descriptor.mipLevelCount ?? 1;
    this.format = descriptor.format as GPUTextureFormat;
    this.usage = descriptor.usage;

    // Bind and set texture parameters
    const target = this.getTarget();
    gl.bindTexture(target, texture);

    // Set default parameters (can be overridden with sampler)
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindTexture(target, null);
  }

  destroy(): void {
    if (this._isDestroyed) {
      return;
    }
    this._gl.deleteTexture(this._texture);
    this._isDestroyed = true;
  }

  createView(_descriptor?: any): any {
    this.checkNotDestroyed();
    // WebGL2 textures don't have separate view objects
    return this;
  }

  get nativeTexture(): WebGLTexture {
    return this._texture;
  }

  get target(): GLenum {
    return this.getTarget();
  }

  private getTarget(): GLenum {
    const gl = this._gl;
    if (this.depthOrArrayLayers > 1) {
      return gl.TEXTURE_2D_ARRAY;
    }
    return gl.TEXTURE_2D;
  }

  private checkNotDestroyed(): void {
    if (this._isDestroyed) {
      throw new Error('WebGL2Texture has been destroyed');
    }
  }
}

// ============================================================================
// WebGL2 Sampler Implementation
// ============================================================================

class WebGL2Sampler implements GraphicsSampler {
  readonly label: string;

  private _gl: WebGL2RenderingContext;
  private _sampler: WebGLSampler;

  constructor(gl: WebGL2RenderingContext, sampler: WebGLSampler) {
    this._gl = gl;
    this._sampler = sampler;
    this.label = 'UnnamedSampler';
  }

  destroy(): void {
    this._gl.deleteSampler(this._sampler);
  }

  get nativeSampler(): WebGLSampler {
    return this._sampler;
  }
}

// ============================================================================
// WebGL2 Shader Implementation
// ============================================================================

class WebGL2Shader implements GraphicsShader {
  readonly label: string;

  private _gl: WebGL2RenderingContext;
  private _shader: WebGLShader;

  constructor(gl: WebGL2RenderingContext, shader: WebGLShader, descriptor: ShaderModuleDescriptor) {
    this._gl = gl;
    this._shader = shader;
    this.label = descriptor.label ?? 'UnnamedShader';
  }

  async getCompilationInfo(): Promise<any> {
    const gl = this._gl;
    const log = gl.getShaderInfoLog(this._shader);
    return {
      messages: log
        ? [
            {
              message: log,
              type: 'error',
            },
          ]
        : [],
    };
  }

  get nativeShader(): WebGLShader {
    return this._shader;
  }
}

// ============================================================================
// WebGL2 Query Implementation
// ============================================================================

class WebGL2Query implements QuerySet {
  readonly label: string = 'WebGL2Query';
  readonly type: 'occlusion' | 'timestamp' = 'occlusion';
  readonly count: number = 1;

  private _gl: WebGL2RenderingContext;
  private _query: WebGLQuery;

  constructor(gl: WebGL2RenderingContext, query: WebGLQuery, descriptor: any) {
    this._gl = gl;
    this._query = query;
    this.label = descriptor.label ?? 'WebGL2Query';
    this.type = descriptor.type ?? 'occlusion';
    this.count = descriptor.count ?? 1;
  }

  destroy(): void {
    this._gl.deleteQuery(this._query);
  }

  get nativeQuery(): WebGLQuery {
    return this._query;
  }
}

// ============================================================================
// WebGL2 Command Encoder Implementation
// ============================================================================

class WebGL2CommandEncoder implements CommandEncoder {
  readonly label: string = 'WebGL2CommandEncoder';

  private _gl: WebGL2RenderingContext;
  private _commands: Array<() => void> = [];

  constructor(gl: WebGL2RenderingContext, _device: WebGL2Device) {
    this._gl = gl;
  }

  beginRenderPass(_descriptor: any): RenderPassEncoder {
    return new WebGL2RenderPassEncoder(this._gl, this._commands);
  }

  beginComputePass(_descriptor?: any): never {
    // WebGL2 doesn't have compute passes
    throw new Error('WebGL2 does not support compute passes');
  }

  copyBufferToBuffer(
    source: GraphicsBuffer,
    sourceOffset: number,
    destination: GraphicsBuffer,
    destinationOffset: number,
    size: number,
  ): void {
    // WebGL2 buffer-to-buffer copy requires reading and writing
    this._commands.push(() => {
      const gl = this._gl;
      const srcBuffer = (source as WebGL2Buffer).nativeBuffer;
      const dstBuffer = (destination as WebGL2Buffer).nativeBuffer;

      // Read from source
      gl.bindBuffer(gl.COPY_READ_BUFFER, srcBuffer);
      gl.bindBuffer(gl.COPY_WRITE_BUFFER, dstBuffer);
      gl.copyBufferSubData(
        gl.COPY_READ_BUFFER,
        gl.COPY_WRITE_BUFFER,
        sourceOffset,
        destinationOffset,
        size,
      );
      gl.bindBuffer(gl.COPY_READ_BUFFER, null);
      gl.bindBuffer(gl.COPY_WRITE_BUFFER, null);
    });
  }

  copyBufferToTexture(_source: any, _destination: any, _copySize: any): void {
    this._commands.push(() => {
      // Implementation needed
    });
  }

  copyTextureToBuffer(_source: any, _destination: any, _copySize: any): void {
    this._commands.push(() => {
      // Implementation needed
    });
  }

  copyTextureToTexture(_source: any, _destination: any, _copySize: any): void {
    this._commands.push(() => {
      // Implementation needed
    });
  }

  finish(): CommandBuffer {
    return new WebGL2CommandBuffer(this._commands);
  }
}

// ============================================================================
// WebGL2 Render Pass Encoder Implementation
// ============================================================================

class WebGL2RenderPassEncoder implements RenderPassEncoder {
  readonly label: string = 'WebGL2RenderPassEncoder';

  private _gl: WebGL2RenderingContext;
  private _commands: Array<() => void>;

  constructor(gl: WebGL2RenderingContext, commands: Array<() => void>) {
    this._gl = gl;
    this._commands = commands;
  }

  setPipeline(_pipeline: GraphicsPipeline): void {
    this._commands.push(() => {
      // Implementation needed
    });
  }

  setBindGroup(_index: number, _bindGroup: BindGroup, _dynamicOffsets?: number[]): void {
    this._commands.push(() => {
      // Implementation needed
    });
  }

  setIndexBuffer(
    buffer: GraphicsBuffer,
    _indexFormat: IndexFormat,
    _offset?: number,
    _size?: number,
  ): void {
    this._commands.push(() => {
      const gl = this._gl;
      const webglBuffer = (buffer as WebGL2Buffer).nativeBuffer;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webglBuffer);
    });
  }

  setVertexBuffer(_slot: number, buffer: GraphicsBuffer, _offset?: number, _size?: number): void {
    this._commands.push(() => {
      const gl = this._gl;
      const webglBuffer = (buffer as WebGL2Buffer).nativeBuffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, webglBuffer);
    });
  }

  draw(
    vertexCount: number,
    instanceCount?: number,
    firstVertex?: number,
    _firstInstance?: number,
  ): void {
    this._commands.push(() => {
      const gl = this._gl;
      if (instanceCount && instanceCount > 1) {
        gl.drawArraysInstanced(gl.TRIANGLES, firstVertex ?? 0, vertexCount, instanceCount);
      } else {
        gl.drawArrays(gl.TRIANGLES, firstVertex ?? 0, vertexCount);
      }
    });
  }

  drawIndexed(
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    _baseVertex?: number,
    _firstInstance?: number,
  ): void {
    this._commands.push(() => {
      const gl = this._gl;
      if (instanceCount && instanceCount > 1) {
        gl.drawElementsInstanced(
          gl.TRIANGLES,
          indexCount,
          gl.UNSIGNED_SHORT,
          firstIndex ?? 0,
          instanceCount,
        );
      } else {
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, firstIndex ?? 0);
      }
    });
  }

  drawIndirect(indirectBuffer: GraphicsBuffer, _indirectOffset: number): void {
    this._commands.push(() => {
      const gl = this._gl;
      const webglBuffer = (indirectBuffer as WebGL2Buffer).nativeBuffer;
      // WebGL2 indirect drawing requires extension support
      const ext = gl.getExtension('WEBGL_draw_instanced_buffers_vertex_array_object');
      if (ext) {
        gl.bindBuffer((ext as any).DRAW_INDIRECT_BUFFER_WEBGL, webglBuffer);
        // Note: drawArraysIndirect is not standard in WebGL2, use workaround
        console.warn('[WebGL2RenderPassEncoder] Indirect drawing has limited support');
      } else {
        console.warn('[WebGL2RenderPassEncoder] Indirect drawing not supported');
      }
    });
  }

  drawIndexedIndirect(indirectBuffer: GraphicsBuffer, _indirectOffset: number): void {
    this._commands.push(() => {
      const gl = this._gl;
      const webglBuffer = (indirectBuffer as WebGL2Buffer).nativeBuffer;
      // WebGL2 indirect drawing requires extension support
      const ext = gl.getExtension('WEBGL_draw_instanced_buffers_vertex_array_object');
      if (ext) {
        gl.bindBuffer((ext as any).DRAW_INDIRECT_BUFFER_WEBGL, webglBuffer);
        // Note: drawElementsIndirect is not standard in WebGL2, use workaround
        console.warn('[WebGL2RenderPassEncoder] Indexed indirect drawing has limited support');
      } else {
        console.warn('[WebGL2RenderPassEncoder] Indirect drawing not supported');
      }
    });
  }

  insertDebugMarker(markerLabel: string): void {
    // WebGL2 debug markers require extension
    const gl = this._gl;
    const ext = gl.getExtension('WEBGL_debug_marker');
    if (ext) {
      this._commands.push(() => {
        (ext as any).insertEventMarkerEXT(markerLabel);
      });
    }
  }

  popDebugGroup(): void {
    // WebGL2 debug markers require extension
    const gl = this._gl;
    const ext = gl.getExtension('WEBGL_debug_marker');
    if (ext) {
      this._commands.push(() => {
        (ext as any).popGroupMarkerEXT();
      });
    }
  }

  pushDebugGroup(groupLabel: string): void {
    // WebGL2 debug markers require extension
    const gl = this._gl;
    const ext = gl.getExtension('WEBGL_debug_marker');
    if (ext) {
      this._commands.push(() => {
        (ext as any).pushGroupMarkerEXT(groupLabel);
      });
    }
  }

  end(): void {
    // Commands are recorded, will be executed when command buffer is submitted
  }
}

// ============================================================================
// WebGL2 Command Buffer Implementation
// ============================================================================

class WebGL2CommandBuffer implements CommandBuffer {
  readonly label: string = 'WebGL2CommandBuffer';

  private _commands: Array<() => void>;

  constructor(commands: Array<() => void>) {
    this._commands = commands;
  }

  execute(): void {
    for (const command of this._commands) {
      command();
    }
  }
}

// ============================================================================
// WebGL2 Queue Implementation
// ============================================================================

class WebGL2Queue implements Queue {
  readonly label: string = 'WebGL2Queue';

  private _gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl;
  }

  submit(commandBuffers: any[]): void {
    for (const buffer of commandBuffers) {
      if (buffer instanceof WebGL2CommandBuffer) {
        buffer.execute();
      }
    }
  }

  async onSubmittedWorkDone(): Promise<void> {
    // WebGL2 doesn't have explicit work completion
    return Promise.resolve();
  }

  writeBuffer(
    buffer: GraphicsBuffer,
    bufferOffset: number,
    data: ArrayBufferView,
    dataOffset?: number,
    size?: number,
  ): void {
    const gl = this._gl;
    const webglBuffer = buffer as WebGL2Buffer;
    const target = webglBuffer.target;

    gl.bindBuffer(target, webglBuffer.nativeBuffer);
    gl.bufferSubData(target, bufferOffset, data, dataOffset ?? 0, size ?? data.byteLength);
    gl.bindBuffer(target, null);
  }

  writeTexture(_destination: any, _data: ArrayBufferView, _dataLayout: any, _size: any): void {
    // Implementation needed for texture writing
  }

  copyExternalImageToTexture(_source: any, _destination: any, _copySize: any): void {
    // Implementation needed for image copying
  }
}
