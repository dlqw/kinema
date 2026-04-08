/**
 * Kinema Rendering Engine - Pipeline Module
 *
 * This module exports the rendering pipeline functionality including:
 * - RenderPipeline: Main pipeline orchestration
 * - RenderPass: Individual render pass abstraction
 * - RenderQueue: Render queue management
 * - FrustumCuller/OcclusionCuller: Culling systems
 * - RenderSorter: Sorting optimization
 * - BatchingManager: Batch creation
 *
 * @module pipeline
 */

// Main pipeline
export { RenderPipeline } from './RenderPipeline';

export type { PipelineConfig, RenderPassConfig, PipelineStats } from './RenderPipeline';

// Render pass
export { RenderPass, RenderPassType } from './RenderPass';

export type {
  RenderPassConfig as PassConfig,
  ColorAttachmentConfig,
  DepthStencilAttachmentConfig,
  RenderBatch,
} from './RenderPass';

// Render queue
export { RenderQueue, RenderQueueType } from './RenderQueue';

export type { RenderableObject } from './RenderQueue';

// Culling
export { FrustumCuller, OcclusionCuller } from './Culling';

export type { Camera, BoundingSphere, BoundingBox, CullingResult } from './Culling';

// Sorting
export { RenderSorter, SortCriteria } from './Sorting';

export type { SortKeyOptions } from './Sorting';

// Batching
export { BatchingManager, BatchType } from './Batching';

export type { RenderBatch as BatchRenderBatch, BatchingConfig, BatchingStats } from './Batching';
