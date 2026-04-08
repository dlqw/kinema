/**
 * Kinema Rendering Engine - WebGPU Device Implementation
 *
 * This module implements the GraphicsDevice interface for WebGPU.
 *
 * @module graphics.webgpu
 */

import type { GraphicsDevice, GraphicsDeviceConfig } from '../GraphicsDevice';

import {
  RenderAPI,
  type BufferDescriptor,
  type GraphicsBuffer,
  type TextureDescriptor,
  type GraphicsTexture,
  type SamplerDescriptor,
  type GraphicsSampler,
  type ShaderModuleDescriptor,
  type GraphicsShader,
  type GraphicsPipeline,
  type ComputePipeline,
  type BindGroupLayout,
  type BindGroup,
  type CommandEncoder,
  type Queue,
  type DeviceLimits,
} from '../../core/types';

import type {
  GPUAdapter,
  GPUAdapterInfo,
  GPUBindGroup,
  GPUBindGroupLayout,
  GPUBuffer,
  GPUBufferDescriptor,
  GPUCommandBuffer,
  GPUCommandEncoder,
  GPUCompareFunction,
  GPUComputePassEncoder,
  GPUComputePipeline,
  GPUCanvasContext,
  GPUDevice,
  GPUDeviceLostInfo,
  GPUExtent3D,
  GPUFeatureName,
  GPUIndexFormat,
  GPUMapModeFlags,
  GPUQueue,
  GPURenderPassEncoder,
  GPURenderPipeline,
  GPUSampler,
  GPUSamplerDescriptor,
  GPUShaderModule,
  GPUShaderModuleDescriptor,
  GPUSupportedLimits,
  GPUTexture,
  GPUTextureDescriptor,
  GPUTextureDimension,
  GPUTextureFormat,
  GPUUncapturedErrorEvent,
} from '../../../types/webgpu-types';

/**
 * WebGPU Device Implementation
 *
 * Implements GraphicsDevice interface using the WebGPU API.
 *
 * @example
 * ```typescript
 * const device = await WebGPUDevice.create({
 *   canvas: document.querySelector('canvas'),
 *   powerPreference: 'high-performance',
 * });
 * ```
 */
export class WebGPUDevice implements GraphicsDevice {
  // ==========================================================================
  // Public Properties
  // ==========================================================================

  readonly label: string = 'WebGPUDevice';
  readonly api: RenderAPI = RenderAPI.WebGPU;
  readonly canvas: HTMLCanvasElement;
  readonly presentationFormat: GPUTextureFormat;
  readonly pixelRatio: number;

  /** Native WebGPU adapter */
  public readonly adapter: GPUAdapter;

  /** Native WebGPU device */
  public readonly device: GPUDevice;

  /** WebGPU context for the canvas */
  public readonly context: GPUCanvasContext;

  /** Adapter information */
  readonly adapterInfo: GPUAdapterInfo | null = null;

  /** Supported features */
  readonly features: Set<string>;

  /** Device limits */
  readonly limits: DeviceLimits;

  /** Command queue */
  readonly queue: Queue;

  /** Current presentation size */
  readonly presentationSize: [number, number] = [0, 0];

  /** Current aspect ratio */
  readonly aspect: number = 1;

  private _isDestroyed: boolean = false;

  // ==========================================================================
  // Constructor
  // ==========================================================================

  public readonly _config: GraphicsDeviceConfig;

  private constructor(
    config: GraphicsDeviceConfig,
    adapter: GPUAdapter,
    device: GPUDevice,
    context: GPUCanvasContext,
    adapterInfo: GPUAdapterInfo,
  ) {
    this._config = config;
    this.canvas = config.canvas;
    this.adapter = adapter;
    this.device = device;
    this.context = context;
    this.adapterInfo = adapterInfo;
    this.pixelRatio = config.devicePixelRatio ?? window.devicePixelRatio ?? 1;

    // Set presentation format
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    // Collect features
    this.features = new Set<string>();
    for (const feature of device.features) {
      this.features.add(feature);
    }

    // Map limits
    this.limits = this.mapLimits(device.limits);

    // Create queue wrapper
    this.queue = new WebGPUQueue(device.queue);

    // Setup error handling
    this.setupErrorHandling();

    // Initialize presentation size
    this.updatePresentationSize();

    // Log device info
    console.log('[WebGPUDevice] Initialized:', {
      vendor: adapterInfo.vendor,
      architecture: adapterInfo.architecture,
      device: adapterInfo.device,
      description: adapterInfo.description,
      features: Array.from(this.features).slice(0, 10).join(', '),
      ...(this.features.size > 10 ? { more: `+${this.features.size - 10} more` } : {}),
    });
  }

  // ==========================================================================
  // Static Factory
  // ==========================================================================

  /**
   * Create a WebGPU device
   *
   * @param config - Device configuration
   * @returns Promise resolving to a WebGPU device
   * @throws Error if WebGPU is not available or device creation fails
   */
  static async create(config: GraphicsDeviceConfig): Promise<WebGPUDevice> {
    // Check WebGPU availability
    if (!navigator.gpu) {
      throw new Error('WebGPU is not available in this browser');
    }

    // Request adapter
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: config.powerPreference ?? 'high-performance',
    });

    if (!adapter) {
      throw new Error('Failed to request WebGPU adapter');
    }

    // Get adapter info
    const adapterInfo = adapter.info;

    // Determine required features
    const requiredFeatures: GPUFeatureName[] = [];
    if (config.requiredFeatures) {
      for (const feature of config.requiredFeatures) {
        if (adapter.features.has(feature as GPUFeatureName)) {
          requiredFeatures.push(feature as GPUFeatureName);
        } else {
          console.warn(`[WebGPUDevice] Feature "${feature}" not supported by adapter`);
        }
      }
    }

    // Determine required limits
    const requiredLimits: Record<string, number> = {};
    if (config.requiredLimits) {
      for (const [limit, value] of Object.entries(config.requiredLimits)) {
        const adapterLimit = (adapter.limits as any)[limit];
        if (adapterLimit !== undefined && value <= adapterLimit) {
          requiredLimits[limit] = value;
        } else {
          console.warn(
            `[WebGPUDevice] Limit "${limit}" value ${value} exceeds adapter limit ${adapterLimit}`,
          );
        }
      }
    }

    // Request device
    const device = await adapter.requestDevice({
      requiredFeatures,
      requiredLimits,
    });

    if (!device) {
      throw new Error('Failed to request WebGPU device');
    }

    // Configure canvas context
    const canvas = config.canvas;
    const context = canvas.getContext('webgpu') as unknown as GPUCanvasContext;

    if (!context) {
      throw new Error('Failed to get WebGPU context from canvas');
    }

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    // Configure context
    context.configure({
      device,
      format: presentationFormat,
      alphaMode: config.alpha ? 'premultiplied' : 'opaque',
      colorSpace: 'srgb',
    });

    // Create device instance
    return new WebGPUDevice(config, adapter, device, context, adapterInfo);
  }

  // ==========================================================================
  // Resource Creation
  // ==========================================================================

  createBuffer(descriptor: BufferDescriptor): GraphicsBuffer {
    this.checkNotDestroyed();

    const bufferDescriptor: GPUBufferDescriptor = {
      ...(descriptor.label !== undefined && { label: descriptor.label }),
      size: descriptor.size,
      usage: descriptor.usage,
      mappedAtCreation: descriptor.mappedAtCreation ?? false,
    };

    const buffer = this.device.createBuffer(bufferDescriptor);
    return new WebGPUBuffer(this.device, buffer, descriptor);
  }

  createTexture(descriptor: TextureDescriptor): GraphicsTexture {
    this.checkNotDestroyed();

    const textureDescriptor: GPUTextureDescriptor = {
      ...(descriptor.label !== undefined && { label: descriptor.label }),
      size: descriptor.size as GPUExtent3D,
      dimension: descriptor.dimension as GPUTextureDimension,
      format: descriptor.format as GPUTextureFormat,
      mipLevelCount: descriptor.mipLevelCount ?? 1,
      sampleCount: descriptor.sampleCount ?? 1,
      usage: descriptor.usage,
    };

    const texture = this.device.createTexture(textureDescriptor);
    return new WebGPUTexture(this.device, texture, descriptor);
  }

  createSampler(descriptor: SamplerDescriptor): GraphicsSampler {
    this.checkNotDestroyed();

    const samplerDescriptor: GPUSamplerDescriptor = {
      addressModeU: descriptor.addressModeU,
      addressModeV: descriptor.addressModeV,
      addressModeW: descriptor.addressModeW,
      magFilter: descriptor.magFilter,
      minFilter: descriptor.minFilter,
      mipmapFilter: descriptor.mipmapFilter,
      ...(descriptor.label !== undefined && { label: descriptor.label }),
      ...(descriptor.lodMinClamp !== undefined && { lodMinClamp: descriptor.lodMinClamp }),
      ...(descriptor.lodMaxClamp !== undefined && { lodMaxClamp: descriptor.lodMaxClamp }),
      ...(descriptor.maxAnisotropy !== undefined && { maxAnisotropy: descriptor.maxAnisotropy }),
      ...(descriptor.compare !== undefined && {
        compare: descriptor.compare as GPUCompareFunction,
      }),
    };

    const sampler = this.device.createSampler(samplerDescriptor);
    return new WebGPUSampler(sampler);
  }

  createShaderModule(descriptor: ShaderModuleDescriptor): GraphicsShader {
    this.checkNotDestroyed();

    const shaderDescriptor: GPUShaderModuleDescriptor = {
      ...(descriptor.label !== undefined && { label: descriptor.label }),
      code: descriptor.code,
    };

    const module = this.device.createShaderModule(shaderDescriptor);
    return new WebGPUShader(module);
  }

  createRenderPipeline(descriptor: any): GraphicsPipeline {
    this.checkNotDestroyed();
    const pipeline = this.device.createRenderPipeline(descriptor);
    return new WebGPURenderPipeline(pipeline);
  }

  createComputePipeline(descriptor: any): ComputePipeline {
    this.checkNotDestroyed();
    const pipeline = this.device.createComputePipeline(descriptor);
    return new WebGPUComputePipeline(pipeline);
  }

  createBindGroupLayout(descriptor: any): BindGroupLayout {
    this.checkNotDestroyed();
    const layout = this.device.createBindGroupLayout(descriptor);
    return new WebGPUBindGroupLayout(layout);
  }

  createPipelineLayout(descriptor: any): any {
    this.checkNotDestroyed();
    return this.device.createPipelineLayout(descriptor);
  }

  createBindGroup(descriptor: any): BindGroup {
    this.checkNotDestroyed();
    const bindGroup = this.device.createBindGroup(descriptor);
    return new WebGPUBindGroup(bindGroup);
  }

  createRenderBundleEncoder(descriptor: any): any {
    this.checkNotDestroyed();
    return this.device.createRenderBundleEncoder(descriptor);
  }

  createQuerySet(descriptor: any): any {
    this.checkNotDestroyed();
    return this.device.createQuerySet(descriptor);
  }

  // ==========================================================================
  // Command Encoding
  // ==========================================================================

  createCommandEncoder(): CommandEncoder {
    this.checkNotDestroyed();
    const encoder = this.device.createCommandEncoder();
    return new WebGPUCommandEncoder(this.device, encoder);
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  pushErrorScope(groupLabel: string): void {
    this.checkNotDestroyed();
    this.device.pushErrorScope(groupLabel as GPUErrorFilter);
  }

  async popErrorScope(): Promise<any> {
    this.checkNotDestroyed();
    return await this.device.popErrorScope();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  resize(): void {
    this.updatePresentationSize();
  }

  loseDevice(): void {
    this.device.destroy();
    this._isDestroyed = true;
  }

  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this.device.destroy();
    this._isDestroyed = true;
    console.log('[WebGPUDevice] Destroyed');
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private checkNotDestroyed(): void {
    if (this._isDestroyed) {
      throw new Error('WebGPUDevice has been destroyed');
    }
  }

  private updatePresentationSize(): void {
    const pixelRatio = this.pixelRatio;
    const width = Math.floor(this.canvas.clientWidth * pixelRatio);
    const height = Math.floor(this.canvas.clientHeight * pixelRatio);

    if (width !== this.canvas.width || height !== this.canvas.height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    (this.presentationSize as any)[0] = this.canvas.width;
    (this.presentationSize as any)[1] = this.canvas.height;
    (this as any).aspect = this.canvas.width / this.canvas.height;
  }

  private setupErrorHandling(): void {
    // Handle uncaptured errors
    this.device.onuncapturederror = (event: GPUUncapturedErrorEvent): void => {
      console.error('[WebGPUDevice] Uncaptured error:', event.error);
    };

    // Handle device loss
    void this.device.lost.then((info: GPUDeviceLostInfo): void => {
      console.warn('[WebGPUDevice] Device lost:', info);
      this._isDestroyed = true;
    });
  }

  private mapLimits(limits: GPUSupportedLimits): DeviceLimits {
    return {
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
  }
}

// ============================================================================
// WebGPU Buffer Implementation
// ============================================================================

class WebGPUBuffer implements GraphicsBuffer {
  readonly label: string;
  readonly size: number;
  readonly usage: number;

  private _device: GPUDevice;
  private _buffer: GPUBuffer;
  private _isDestroyed: boolean = false;

  constructor(device: GPUDevice, buffer: GPUBuffer, descriptor: BufferDescriptor) {
    this._device = device;
    this._buffer = buffer;
    this.label = descriptor.label ?? 'UnnamedBuffer';
    this.size = descriptor.size;
    this.usage = descriptor.usage;
  }

  destroy(): void {
    if (this._isDestroyed) {
      return;
    }
    this._buffer.destroy();
    this._isDestroyed = true;
  }

  async mapAsync(mode: number, offset: number = 0, size?: number): Promise<ArrayBuffer> {
    this.checkNotDestroyed();
    await this._buffer.mapAsync(mode as GPUMapModeFlags, offset, size);
    return this._buffer.getMappedRange(offset, size);
  }

  unmap(): void {
    this.checkNotDestroyed();
    this._buffer.unmap();
  }

  write(data: ArrayBufferView, offset: number = 0): void {
    this.checkNotDestroyed();
    this._device.queue.writeBuffer(this._buffer, offset, data as GPUAllowSharedBufferSource);
  }

  read(): ArrayBuffer {
    this.checkNotDestroyed();
    return this._buffer.getMappedRange();
  }

  get nativeBuffer(): GPUBuffer {
    return this._buffer;
  }

  private checkNotDestroyed(): void {
    if (this._isDestroyed) {
      throw new Error('WebGPUBuffer has been destroyed');
    }
  }
}

// ============================================================================
// WebGPU Texture Implementation
// ============================================================================

class WebGPUTexture implements GraphicsTexture {
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly mipLevelCount: number;
  readonly format: GPUTextureFormat;
  readonly usage: number;

  private _texture: GPUTexture;
  private _isDestroyed: boolean = false;

  constructor(_device: GPUDevice, texture: GPUTexture, descriptor: TextureDescriptor) {
    this._texture = texture;
    this.label = descriptor.label ?? 'UnnamedTexture';
    const size = descriptor.size;
    this.width = size[0];
    this.height = size[1];
    this.depthOrArrayLayers = size[2] ?? 1;
    this.mipLevelCount = descriptor.mipLevelCount ?? 1;
    this.format = descriptor.format as GPUTextureFormat;
    this.usage = descriptor.usage;
  }

  destroy(): void {
    if (this._isDestroyed) {
      return;
    }
    this._texture.destroy();
    this._isDestroyed = true;
  }

  createView(descriptor?: any): any {
    this.checkNotDestroyed();
    return this._texture.createView(descriptor);
  }

  get nativeTexture(): GPUTexture {
    return this._texture;
  }

  private checkNotDestroyed(): void {
    if (this._isDestroyed) {
      throw new Error('WebGPUTexture has been destroyed');
    }
  }
}

// ============================================================================
// WebGPU Sampler Implementation
// ============================================================================

class WebGPUSampler implements GraphicsSampler {
  readonly label: string;

  private _sampler: GPUSampler;

  constructor(sampler: GPUSampler) {
    this._sampler = sampler;
    this.label = sampler.label ?? 'UnnamedSampler';
  }

  destroy(): void {
    // Samplers don't need explicit destruction in WebGPU
  }

  get nativeSampler(): GPUSampler {
    return this._sampler;
  }
}

// ============================================================================
// WebGPU Shader Implementation
// ============================================================================

class WebGPUShader implements GraphicsShader {
  readonly label: string;

  private _module: GPUShaderModule;

  constructor(module: GPUShaderModule) {
    this._module = module;
    this.label = module.label ?? 'UnnamedShader';
  }

  async getCompilationInfo(): Promise<any> {
    return await this._module.getCompilationInfo();
  }

  get nativeModule(): GPUShaderModule {
    return this._module;
  }
}

// ============================================================================
// WebGPU Render Pipeline Implementation
// ============================================================================

class WebGPURenderPipeline implements GraphicsPipeline {
  readonly label: string;

  private _pipeline: GPURenderPipeline;

  constructor(pipeline: GPURenderPipeline) {
    this._pipeline = pipeline;
    this.label = pipeline.label ?? 'UnnamedRenderPipeline';
  }

  getBindGroupLayout(index: number): BindGroupLayout {
    return new WebGPUBindGroupLayout(this._pipeline.getBindGroupLayout(index));
  }

  get nativePipeline(): GPURenderPipeline {
    return this._pipeline;
  }
}

// ============================================================================
// WebGPU Compute Pipeline Implementation
// ============================================================================

class WebGPUComputePipeline implements ComputePipeline {
  readonly label: string;

  private _pipeline: GPUComputePipeline;

  constructor(pipeline: GPUComputePipeline) {
    this._pipeline = pipeline;
    this.label = pipeline.label ?? 'UnnamedComputePipeline';
  }

  getBindGroupLayout(index: number): BindGroupLayout {
    return new WebGPUBindGroupLayout(this._pipeline.getBindGroupLayout(index));
  }

  get nativePipeline(): GPUComputePipeline {
    return this._pipeline;
  }
}

// ============================================================================
// WebGPU Bind Group Layout Implementation
// ============================================================================

class WebGPUBindGroupLayout implements BindGroupLayout {
  readonly label: string;
  readonly entries: any[];

  private _layout: GPUBindGroupLayout;

  constructor(layout: GPUBindGroupLayout) {
    this._layout = layout;
    this.label = layout.label ?? 'UnnamedBindGroupLayout';
    // Entries are not accessible from the layout object
    this.entries = [];
  }

  get nativeLayout(): GPUBindGroupLayout {
    return this._layout;
  }
}

// ============================================================================
// WebGPU Bind Group Implementation
// ============================================================================

class WebGPUBindGroup implements BindGroup {
  readonly label: string;

  private _bindGroup: GPUBindGroup;

  constructor(bindGroup: GPUBindGroup) {
    this._bindGroup = bindGroup;
    this.label = bindGroup.label ?? 'UnnamedBindGroup';
  }

  destroy(): void {
    // Bind groups don't need explicit destruction in WebGPU
  }

  get nativeBindGroup(): GPUBindGroup {
    return this._bindGroup;
  }
}

// ============================================================================
// WebGPU Command Encoder Implementation
// ============================================================================

class WebGPUCommandEncoder implements CommandEncoder {
  readonly label: string;

  private _encoder: GPUCommandEncoder;

  constructor(_device: GPUDevice, encoder: GPUCommandEncoder) {
    this._encoder = encoder;
    this.label = encoder.label ?? 'UnnamedCommandEncoder';
  }

  beginRenderPass(descriptor: any): any {
    return new WebGPURenderPassEncoder(this._encoder.beginRenderPass(descriptor));
  }

  beginComputePass(descriptor?: any): any {
    return new WebGPUComputePassEncoder(this._encoder.beginComputePass(descriptor));
  }

  copyBufferToBuffer(
    source: GraphicsBuffer,
    sourceOffset: number,
    destination: GraphicsBuffer,
    destinationOffset: number,
    size: number,
  ): void {
    const srcBuffer = (source as WebGPUBuffer).nativeBuffer;
    const dstBuffer = (destination as WebGPUBuffer).nativeBuffer;
    this._encoder.copyBufferToBuffer(srcBuffer, sourceOffset, dstBuffer, destinationOffset, size);
  }

  copyBufferToTexture(source: any, destination: any, copySize: any): void {
    this._encoder.copyBufferToTexture(source, destination, copySize);
  }

  copyTextureToBuffer(source: any, destination: any, copySize: any): void {
    this._encoder.copyTextureToBuffer(source, destination, copySize);
  }

  copyTextureToTexture(source: any, destination: any, copySize: any): void {
    this._encoder.copyTextureToTexture(source, destination, copySize);
  }

  finish(): any {
    return new WebGPUCommandBuffer(this._encoder.finish());
  }

  get nativeEncoder(): GPUCommandEncoder {
    return this._encoder;
  }
}

// ============================================================================
// WebGPU Render Pass Encoder Implementation
// ============================================================================

class WebGPURenderPassEncoder {
  private _encoder: GPURenderPassEncoder;

  constructor(encoder: GPURenderPassEncoder) {
    this._encoder = encoder;
  }

  setPipeline(pipeline: GraphicsPipeline): void {
    this._encoder.setPipeline((pipeline as WebGPURenderPipeline).nativePipeline);
  }

  setBindGroup(index: number, bindGroup: BindGroup, dynamicOffsets?: number[]): void {
    this._encoder.setBindGroup(
      index,
      (bindGroup as WebGPUBindGroup).nativeBindGroup,
      dynamicOffsets,
    );
  }

  setIndexBuffer(
    buffer: GraphicsBuffer,
    indexFormat: GPUIndexFormat,
    offset?: number,
    size?: number,
  ): void {
    this._encoder.setIndexBuffer((buffer as WebGPUBuffer).nativeBuffer, indexFormat, offset, size);
  }

  setVertexBuffer(slot: number, buffer: GraphicsBuffer, offset?: number, size?: number): void {
    this._encoder.setVertexBuffer(slot, (buffer as WebGPUBuffer).nativeBuffer, offset, size);
  }

  draw(
    vertexCount: number,
    instanceCount?: number,
    firstVertex?: number,
    firstInstance?: number,
  ): void {
    this._encoder.draw(vertexCount, instanceCount, firstVertex, firstInstance);
  }

  drawIndexed(
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    baseVertex?: number,
    firstInstance?: number,
  ): void {
    this._encoder.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance);
  }

  drawIndirect(indirectBuffer: GraphicsBuffer, indirectOffset: number): void {
    this._encoder.drawIndirect((indirectBuffer as WebGPUBuffer).nativeBuffer, indirectOffset);
  }

  drawIndexedIndirect(indirectBuffer: GraphicsBuffer, indirectOffset: number): void {
    this._encoder.drawIndexedIndirect(
      (indirectBuffer as WebGPUBuffer).nativeBuffer,
      indirectOffset,
    );
  }

  insertDebugMarker(markerLabel: string): void {
    this._encoder.insertDebugMarker(markerLabel);
  }

  popDebugGroup(): void {
    this._encoder.popDebugGroup();
  }

  pushDebugGroup(groupLabel: string): void {
    this._encoder.pushDebugGroup(groupLabel);
  }

  end(): void {
    this._encoder.end();
  }
}

// ============================================================================
// WebGPU Compute Pass Encoder Implementation
// ============================================================================

class WebGPUComputePassEncoder {
  private _encoder: GPUComputePassEncoder;

  constructor(encoder: GPUComputePassEncoder) {
    this._encoder = encoder;
  }

  setPipeline(pipeline: ComputePipeline): void {
    this._encoder.setPipeline((pipeline as WebGPUComputePipeline).nativePipeline);
  }

  setBindGroup(index: number, bindGroup: BindGroup, dynamicOffsets?: number[]): void {
    this._encoder.setBindGroup(
      index,
      (bindGroup as WebGPUBindGroup).nativeBindGroup,
      dynamicOffsets,
    );
  }

  dispatchWorkgroups(
    workgroupCountX: number,
    workgroupCountY?: number,
    workgroupCountZ?: number,
  ): void {
    this._encoder.dispatchWorkgroups(workgroupCountX, workgroupCountY, workgroupCountZ);
  }

  dispatchWorkgroupsIndirect(indirectBuffer: GraphicsBuffer, indirectOffset: number): void {
    this._encoder.dispatchWorkgroupsIndirect(
      (indirectBuffer as WebGPUBuffer).nativeBuffer,
      indirectOffset,
    );
  }

  insertDebugMarker(markerLabel: string): void {
    this._encoder.insertDebugMarker(markerLabel);
  }

  popDebugGroup(): void {
    this._encoder.popDebugGroup();
  }

  pushDebugGroup(groupLabel: string): void {
    this._encoder.pushDebugGroup(groupLabel);
  }

  end(): void {
    this._encoder.end();
  }
}

// ============================================================================
// WebGPU Command Buffer Implementation
// ============================================================================

class WebGPUCommandBuffer {
  readonly label: string;

  private _buffer: GPUCommandBuffer;

  constructor(buffer: GPUCommandBuffer) {
    this._buffer = buffer;
    this.label = buffer.label ?? 'UnnamedCommandBuffer';
  }

  get nativeBuffer(): GPUCommandBuffer {
    return this._buffer;
  }
}

// ============================================================================
// WebGPU Queue Implementation
// ============================================================================

class WebGPUQueue implements Queue {
  readonly label: string;

  private _queue: GPUQueue;

  constructor(queue: GPUQueue) {
    this._queue = queue;
    this.label = queue.label ?? 'UnnamedQueue';
  }

  submit(commandBuffers: any[]): void {
    const nativeBuffers = commandBuffers.map((cb) => (cb as WebGPUCommandBuffer).nativeBuffer);
    this._queue.submit(nativeBuffers);
  }

  async onSubmittedWorkDone(): Promise<void> {
    await this._queue.onSubmittedWorkDone();
  }

  writeBuffer(
    buffer: GraphicsBuffer,
    bufferOffset: number,
    data: ArrayBufferView,
    dataOffset?: number,
    size?: number,
  ): void {
    this._queue.writeBuffer(
      (buffer as WebGPUBuffer).nativeBuffer,
      bufferOffset,
      data as GPUAllowSharedBufferSource,
      dataOffset,
      size,
    );
  }

  writeTexture(destination: any, data: ArrayBufferView, dataLayout: any, size: any): void {
    this._queue.writeTexture(destination, data as GPUAllowSharedBufferSource, dataLayout, size);
  }

  copyExternalImageToTexture(source: any, destination: any, copySize: any): void {
    this._queue.copyExternalImageToTexture(source, destination, copySize);
  }

  get nativeQueue(): GPUQueue {
    return this._queue;
  }
}
