/**
 * AniMaker Rendering Engine - Resources Module
 *
 * This module exports resource management functionality including:
 * - ShaderManager: Shader loading, compilation, and hot-reloading
 * - BufferManager: GPU buffer management (vertex, index, uniform, storage)
 * - TextureManager: GPU texture management (2D, cube, render targets)
 * - ResourceCache: Generic LRU cache for GPU resources
 *
 * @module render/resources
 */

// Shader management
export {
  ShaderManager,
  ShaderLanguage,
  ShaderStage,
  ShaderCompilationStatus,
} from './ShaderManager';

export type {
  ShaderCompilationResult,
  ShaderVariant,
  ShaderDescriptor,
  ShaderManagerConfig,
} from './ShaderManager';

// Buffer management
export {
  BufferManager,
  BufferUsageFlags,
} from './BufferManager';

export type {
  BufferHandle,
  BufferOptions,
  VertexBufferDescriptor,
  VertexAttribute,
  IndexBufferDescriptor,
  UniformBufferDescriptor,
  BufferManagerConfig,
  BufferManagerStats,
} from './BufferManager';

// Texture management
export {
  TextureManager,
  TextureUsageFlags,
} from './TextureManager';

export type {
  TextureHandle,
  SamplerHandle,
  TextureOptions,
  Texture2DDescriptor,
  TextureCubeDescriptor,
  RenderTargetDescriptor,
  TextureManagerConfig,
  TextureManagerStats,
} from './TextureManager';

// Resource cache
export {
  ResourceCache,
  ResourceType,
  EvictionPolicy,
} from './ResourceCache';

export type {
  ResourceCacheConfig,
  CacheStats,
} from './ResourceCache';
