/**
 * Kinema Rendering Engine - Core Module
 *
 * This module exports all core rendering functionality including:
 * - RenderEngine: Main engine entry point
 * - RenderContext: Canvas and presentation management
 * - Capability: GPU capability detection
 * - RenderStats: Performance statistics
 * - Types: Core type definitions
 *
 * @module render/core
 */

// Main engine
export { RenderEngine } from './RenderEngine';

// Context management
export { RenderContextImpl, type RenderContext } from './RenderContext';

// Capability detection
export { CapabilityDetector } from './Capability';
export type {
  RenderCapability as CoreRenderCapability,
  DeviceLimits as CoreDeviceLimits,
} from './Capability';

// Statistics
export { RenderStatsCollector } from './RenderStats';
export type { RenderStats as CoreRenderStats } from './RenderStats';

// Types (exclude VertexAttribute to avoid conflict with ./graphics)
export type {
  TextureFormat,
  TextureDimension,
  AddressMode,
  FilterMode,
  CompareFunction,
  BlendOperation,
  BlendFactor,
  StencilOperation,
  PrimitiveType,
  CullMode,
  FrontFace,
  IndexFormat,
  VertexFormat,
  BufferUsage,
  BufferDescriptor,
  TextureDescriptor,
  TextureViewDescriptor,
  SamplerDescriptor,
  ShaderModuleDescriptor,
  VertexAttribute,
  VertexBufferLayout,
  DepthStencilState,
  StencilStateFace,
  BlendState,
  BlendComponent,
  ColorTargetState,
  PrimitiveState,
  GraphicsBuffer,
  GraphicsTexture,
  GraphicsTextureView,
  GraphicsSampler,
  GraphicsShader,
  GraphicsPipeline,
  ComputePipeline,
  BindGroupLayout,
  BindGroupLayoutEntry,
  BindGroup,
  BindGroupEntry,
  BufferBinding,
  SamplerBinding,
  TextureBinding,
  StorageTextureBinding,
  CommandEncoder,
  RenderPassDescriptor,
  ColorAttachment,
  DepthStencilAttachment,
  ImageCopyTexture,
  ImageCopyBuffer,
  ComputePassDescriptor,
  RenderPassEncoder,
  ComputePassEncoder,
  CommandBuffer,
  QuerySet,
  RenderPassTimestampWrites,
  ComputePassTimestampWrites,
  Queue,
  ImageDataLayout,
  ImageCopyExternalImage,
  RenderContext as IRenderContext,
  RenderEngineConfig,
  RenderCapability,
  DeviceLimits,
  RenderStats,
} from './types';

// Re-export enum as value (remove from type export above)
export { RenderAPI } from './types';
