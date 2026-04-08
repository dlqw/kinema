/**
 * Kinema Rendering Engine - Core Type Definitions
 *
 * This file defines the core type system for the rendering engine,
 * providing type safety and API contracts across all rendering components.
 */

import type { GPUTextureFormat } from '../../types/webgpu-types';

// ============================================================================
// Basic Types
// ============================================================================

export type TextureFormat =
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  | 'rgb9e5ufloat'
  | 'rgb10a2unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  | 'depth32float-stencil8';

export type TextureDimension = '1d' | '2d' | '3d' | 'cube';

export type AddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';

export type FilterMode = 'nearest' | 'linear';

export type CompareFunction =
  | 'never'
  | 'less'
  | 'equal'
  | 'less-equal'
  | 'greater'
  | 'not-equal'
  | 'greater-equal'
  | 'always';

export type BlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max';

export type BlendFactor =
  | 'zero'
  | 'one'
  | 'src-color'
  | 'one-minus-src-color'
  | 'src-alpha'
  | 'one-minus-src-alpha'
  | 'dst-color'
  | 'one-minus-dst-color'
  | 'dst-alpha'
  | 'one-minus-dst-alpha'
  | 'src-alpha-saturated'
  | 'constant'
  | 'one-minus-constant';

export type StencilOperation =
  | 'keep'
  | 'zero'
  | 'replace'
  | 'invert'
  | 'increment-clamp'
  | 'decrement-clamp'
  | 'increment-wrap'
  | 'decrement-wrap';

export type PrimitiveType = 'points' | 'lines' | 'line-strip' | 'triangles' | 'triangle-strip';

export type CullMode = 'none' | 'front' | 'back';

export type FrontFace = 'ccw' | 'cw';

export type IndexFormat = 'uint16' | 'uint32';

export type VertexFormat =
  | 'uint8x2'
  | 'uint8x4'
  | 'sint8x2'
  | 'sint8x4'
  | 'unorm8x2'
  | 'unorm8x4'
  | 'snorm8x2'
  | 'snorm8x4'
  | 'uint16x2'
  | 'uint16x4'
  | 'sint16x2'
  | 'sint16x4'
  | 'unorm16x2'
  | 'unorm16x4'
  | 'snorm16x2'
  | 'snorm16x4'
  | 'float16x2'
  | 'float16x4'
  | 'float32'
  | 'float32x2'
  | 'float32x3'
  | 'float32x4'
  | 'uint32'
  | 'uint32x2'
  | 'uint32x3'
  | 'uint32x4'
  | 'sint32'
  | 'sint32x2'
  | 'sint32x3'
  | 'sint32x4';

export const BufferUsage = {
  MAP_READ: 1,
  MAP_WRITE: 2,
  COPY_SRC: 4,
  COPY_DST: 8,
  INDEX: 16,
  VERTEX: 32,
  UNIFORM: 64,
  STORAGE: 128,
  INDIRECT: 256,
} as const;

// ============================================================================
// Descriptor Types
// ============================================================================

export interface BufferDescriptor {
  label?: string;
  size: number;
  usage: number;
  mappedAtCreation?: boolean;
}

export interface TextureDescriptor {
  label?: string;
  size: [number, number] | [number, number, number] | [number, number, number, number];
  dimension: TextureDimension;
  format: TextureFormat;
  mipLevelCount?: number;
  sampleCount?: number;
  usage: number;
}

export interface TextureViewDescriptor {
  label?: string;
  format?: TextureFormat;
  dimension?: TextureDimension;
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  baseMipLevel?: number;
  mipLevelCount?: number;
  baseArrayLayer?: number;
  arrayLayerCount?: number;
}

export interface SamplerDescriptor {
  label?: string;
  addressModeU: AddressMode;
  addressModeV: AddressMode;
  addressModeW: AddressMode;
  magFilter: FilterMode;
  minFilter: FilterMode;
  mipmapFilter: FilterMode;
  lodMinClamp?: number;
  lodMaxClamp?: number;
  maxAnisotropy?: number;
  compare?: CompareFunction;
}

export interface ShaderModuleDescriptor {
  label?: string;
  code: string;
  sourceMap?: object;
}

export interface VertexAttribute {
  shaderLocation: number;
  offset: number;
  format: VertexFormat;
}

export interface VertexBufferLayout {
  arrayStride: number;
  stepMode: 'vertex' | 'instance';
  attributes: VertexAttribute[];
}

export interface DepthStencilState {
  format: TextureFormat;
  depthWriteEnabled: boolean;
  depthCompare: CompareFunction;
  stencilFront?: StencilStateFace;
  stencilBack?: StencilStateFace;
  stencilReadMask?: number;
  stencilWriteMask?: number;
  depthBias?: number;
  depthBiasSlopeScale?: number;
  depthBiasClamp?: number;
}

export interface StencilStateFace {
  compare: CompareFunction;
  failOp: StencilOperation;
  depthFailOp: StencilOperation;
  passOp: StencilOperation;
}

export interface BlendState {
  color: BlendComponent;
  alpha: BlendComponent;
}

export interface BlendComponent {
  operation: BlendOperation;
  srcFactor: BlendFactor;
  dstFactor: BlendFactor;
}

export interface ColorTargetState {
  format: TextureFormat;
  blend?: BlendState;
  writeMask?: number;
}

export interface PrimitiveState {
  topology: PrimitiveType;
  stripIndexFormat?: IndexFormat;
  frontFace: FrontFace;
  cullMode: CullMode;
  unclippedDepth?: boolean;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface GraphicsBuffer {
  readonly label: string;
  readonly size: number;
  readonly usage: number;
  destroy(): void;
  mapAsync(mode: number, offset?: number, size?: number): Promise<ArrayBuffer>;
  unmap(): void;
  write(data: ArrayBufferView, offset?: number): void;
  read(): ArrayBuffer;
}

export interface GraphicsTexture {
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly mipLevelCount: number;
  readonly format: GPUTextureFormat;
  readonly usage: number;
  destroy(): void;
  createView(descriptor?: TextureViewDescriptor): GraphicsTextureView;
}

export interface GraphicsTextureView {
  readonly label: string;
  destroy(): void;
}

export interface GraphicsSampler {
  readonly label: string;
  destroy(): void;
}

export interface GraphicsShader {
  readonly label: string;
  getCompilationInfo(): Promise<ShaderCompilationInfo>;
}

export interface ShaderCompilationInfo {
  messages: CompilationMessage[];
}

export interface CompilationMessage {
  lineNum?: number;
  linePos?: number;
  offset?: number;
  length?: number;
  message: string;
  type: 'error' | 'warning' | 'info';
}

// ============================================================================
// Pipeline Types
// ============================================================================

export interface GraphicsPipeline {
  readonly label: string;
  getBindGroupLayout(index: number): BindGroupLayout;
}

export interface ComputePipeline {
  readonly label: string;
  getBindGroupLayout(index: number): BindGroupLayout;
}

export interface BindGroupLayout {
  readonly label: string;
  entries: BindGroupLayoutEntry[];
}

export interface BindGroupLayoutEntry {
  binding: number;
  visibility: number;
  buffer?: BufferBindingLayout;
  sampler?: SamplerBindingLayout;
  texture?: TextureBindingLayout;
  storageTexture?: StorageTextureBindingLayout;
}

export interface BufferBindingLayout {
  type: 'uniform' | 'storage' | 'read-only-storage';
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
}

export interface SamplerBindingLayout {
  type: 'filtering' | 'non-filtering' | 'comparison';
}

export interface TextureBindingLayout {
  sampleType: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
  viewDimension: TextureDimension;
  multisampled?: boolean;
}

export interface StorageTextureBindingLayout {
  access: 'write-only' | 'read-only' | 'read-write';
  format: TextureFormat;
  viewDimension: TextureDimension;
}

export interface BindGroup {
  readonly label: string;
  destroy(): void;
}

export interface BindGroupEntry {
  binding: number;
  resource: BufferBinding | SamplerBinding | TextureBinding | StorageTextureBinding;
}

export type BufferBinding = { buffer: GraphicsBuffer; offset?: number; size?: number };
export type SamplerBinding = GraphicsSampler;
export type TextureBinding = GraphicsTextureView;
export type StorageTextureBinding = GraphicsTextureView;

// ============================================================================
// Command Encoder Types
// ============================================================================

export interface CommandEncoder {
  readonly label: string;
  beginRenderPass(descriptor: RenderPassDescriptor): RenderPassEncoder;
  beginComputePass(descriptor?: ComputePassDescriptor): ComputePassEncoder;
  copyBufferToBuffer(
    source: GraphicsBuffer,
    sourceOffset: number,
    destination: GraphicsBuffer,
    destinationOffset: number,
    size: number,
  ): void;
  copyBufferToTexture(
    source: ImageCopyBuffer,
    destination: ImageCopyTexture,
    copySize: [number, number] | [number, number, number],
  ): void;
  copyTextureToBuffer(
    source: ImageCopyTexture,
    destination: ImageCopyBuffer,
    copySize: [number, number] | [number, number, number],
  ): void;
  copyTextureToTexture(
    source: ImageCopyTexture,
    destination: ImageCopyTexture,
    copySize: [number, number] | [number, number, number],
  ): void;
  finish(): CommandBuffer;
}

export interface RenderPassDescriptor {
  label?: string;
  colorAttachments: ColorAttachment[];
  depthStencilAttachment?: DepthStencilAttachment;
  occlusionQuerySet?: QuerySet;
  timestampWrites?: RenderPassTimestampWrites;
}

export interface ColorAttachment {
  view: GraphicsTextureView;
  resolveTarget?: GraphicsTextureView;
  clearValue?: [number, number, number, number];
  loadOp: 'load' | 'clear';
  storeOp: 'store' | 'discard';
}

export interface DepthStencilAttachment {
  view: GraphicsTextureView;
  depthClearValue?: number;
  depthLoadOp: 'load' | 'clear';
  depthStoreOp: 'store' | 'discard';
  depthReadOnly?: boolean;
  stencilClearValue?: number;
  stencilLoadOp: 'load' | 'clear';
  stencilStoreOp: 'store' | 'discard';
  stencilReadOnly?: boolean;
}

export interface ImageCopyTexture {
  texture: GraphicsTexture;
  mipLevel?: number;
  origin: [number, number] | [number, number, number] | [number, number, number, number];
  aspect?: 'all' | 'stencil-only' | 'depth-only';
}

export interface ImageCopyBuffer {
  buffer: GraphicsBuffer;
  offset?: number;
  bytesPerRow?: number;
  rowsPerImage?: number;
}

export interface ComputePassDescriptor {
  label?: string;
  timestampWrites?: ComputePassTimestampWrites;
}

export interface RenderPassEncoder {
  readonly label: string;
  setPipeline(pipeline: GraphicsPipeline): void;
  setBindGroup(index: number, bindGroup: BindGroup, dynamicOffsets?: number[]): void;
  setIndexBuffer(
    buffer: GraphicsBuffer,
    indexFormat: IndexFormat,
    offset?: number,
    size?: number,
  ): void;
  setVertexBuffer(slot: number, buffer: GraphicsBuffer, offset?: number, size?: number): void;
  draw(
    vertexCount: number,
    instanceCount?: number,
    firstVertex?: number,
    firstInstance?: number,
  ): void;
  drawIndexed(
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    baseVertex?: number,
    firstInstance?: number,
  ): void;
  drawIndirect(indirectBuffer: GraphicsBuffer, indirectOffset: number): void;
  drawIndexedIndirect(indirectBuffer: GraphicsBuffer, indirectOffset: number): void;
  insertDebugMarker(markerLabel: string): void;
  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  end(): void;
}

export interface ComputePassEncoder {
  readonly label: string;
  setPipeline(pipeline: ComputePipeline): void;
  setBindGroup(index: number, bindGroup: BindGroup, dynamicOffsets?: number[]): void;
  dispatchWorkgroups(
    workgroupCountX: number,
    workgroupCountY?: number,
    workgroupCountZ?: number,
  ): void;
  dispatchWorkgroupsIndirect(indirectBuffer: GraphicsBuffer, indirectOffset: number): void;
  insertDebugMarker(markerLabel: string): void;
  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  end(): void;
}

export interface CommandBuffer {
  readonly label: string;
}

export interface QuerySet {
  readonly label: string;
  readonly type: 'occlusion' | 'timestamp';
  readonly count: number;
  destroy(): void;
}

export interface RenderPassTimestampWrites {
  querySet: QuerySet;
  beginningOfPassWriteIndex: number;
  endOfPassWriteIndex: number;
}

export interface ComputePassTimestampWrites {
  querySet: QuerySet;
  beginningOfPassWriteIndex: number;
  endOfPassWriteIndex: number;
}

// ============================================================================
// Queue Types
// ============================================================================

export interface Queue {
  readonly label: string;
  submit(commandBuffers: CommandBuffer[]): void;
  onSubmittedWorkDone(): Promise<void>;
  writeBuffer(
    buffer: GraphicsBuffer,
    bufferOffset: number,
    data: ArrayBufferView,
    dataOffset?: number,
    size?: number,
  ): void;
  writeTexture(
    destination: ImageCopyTexture,
    data: ArrayBufferView,
    dataLayout: ImageDataLayout,
    size: [number, number] | [number, number, number],
  ): void;
  copyExternalImageToTexture(
    source: ImageCopyExternalImage,
    destination: ImageCopyTexture,
    copySize: [number, number] | [number, number, number],
  ): void;
}

export interface ImageDataLayout {
  offset: number;
  bytesPerRow: number;
  rowsPerImage: number;
}

export interface ImageCopyExternalImage {
  source: ImageBitmap | HTMLCanvasElement | OffscreenCanvas;
  origin?: [number, number] | [number, number, number];
  flipY?: boolean;
}

// ============================================================================
// Graphics Device Types
// ============================================================================

export interface GraphicsDevice {
  readonly label: string;
  readonly adapterInfo: any;
  readonly features: Set<string>;
  readonly limits: DeviceLimits;
  readonly queue: Queue;
  createBuffer(descriptor: BufferDescriptor): GraphicsBuffer;
  createTexture(descriptor: TextureDescriptor): GraphicsTexture;
  createSampler(descriptor: SamplerDescriptor): GraphicsSampler;
  createShaderModule(descriptor: ShaderModuleDescriptor): GraphicsShader;
  createRenderPipeline(descriptor: any): GraphicsPipeline;
  createComputePipeline(descriptor: any): ComputePipeline;
  createBindGroupLayout(descriptor: any): BindGroupLayout;
  createBindGroup(descriptor: any): BindGroup;
  createCommandEncoder(): CommandEncoder;
  createQuerySet(descriptor: any): QuerySet;
  loseDevice(): void;
  destroy(): void;
}

export interface RenderContext {
  readonly canvas: HTMLCanvasElement;
  readonly device: GraphicsDevice;
  readonly presentationSize: [number, number];
  readonly aspect: number;
  readonly presentationFormat: TextureFormat;
  update(): void;
  present(): void;
  destroy(): void;
}

// ============================================================================
// Render Engine Types
// ============================================================================

export enum RenderAPI {
  WebGPU = 'webgpu',
  WebGL2 = 'webgl2',
  None = 'none',
}

export interface RenderEngineConfig {
  canvas?: HTMLCanvasElement;
  devicePixelRatio?: number;
  powerPreference?: 'high-performance' | 'low-power';
  apiPreference?: RenderAPI;
  debugMode?: boolean;
  antialias?: boolean;
  alpha?: boolean;
  depth?: boolean;
  stencil?: boolean;
}

export interface RenderCapability {
  api: RenderAPI;
  features: Set<string>;
  limits: DeviceLimits;
}

export interface DeviceLimits {
  maxTextureDimension1D?: number;
  maxTextureDimension2D?: number;
  maxTextureDimension3D?: number;
  maxTextureArrayLayers?: number;
  maxBindGroups?: number;
  maxDynamicUniformBuffersPerPipelineLayout?: number;
  maxDynamicStorageBuffersPerPipelineLayout?: number;
  maxSampledTexturesPerShaderStage?: number;
  maxSamplersPerShaderStage?: number;
  maxStorageBuffersPerShaderStage?: number;
  maxStorageTexturesPerShaderStage?: number;
  maxUniformBuffersPerShaderStage?: number;
  maxUniformBufferBindingSize?: number;
  maxStorageBufferBindingSize?: number;
  minUniformBufferOffsetAlignment?: number;
  minStorageBufferOffsetAlignment?: number;
  maxVertexBuffers?: number;
  maxVertexAttributes?: number;
  maxVertexBufferArrayStride?: number;
  maxInterStageShaderComponents?: number;
  maxComputeWorkgroupStorageSize?: number;
  maxComputeInvocationsPerWorkgroup?: number;
  maxComputeWorkgroupSizeX?: number;
  maxComputeWorkgroupSizeY?: number;
  maxComputeWorkgroupSizeZ?: number;
  maxComputeWorkgroupsPerDimension?: number;
}

export interface RenderStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  instancedDrawCalls: number;
  computePasses: number;
  triangles: number;
  vertices: number;
  bufferMemory: number;
  textureMemory: number;
  gpuTime: number;
  shadowMapTime: number;
  postProcessingTime: number;
  pipelineChanges: number;
  textureBindings: number;
  bufferUpdates: number;
}
