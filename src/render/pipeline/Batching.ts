/**
 * AniMaker Rendering Engine - Rendering Batching
 *
 * This module provides batching functionality to optimize rendering
 * by combining multiple objects into fewer draw calls.
 *
 * @module pipeline
 */

import type { RenderableObject } from './RenderQueue';
import type { GraphicsDevice } from '../graphics/GraphicsDevice';

/**
 * Batch type
 */
export enum BatchType {
  /** Individual rendering (no batching) */
  Individual = 'individual',
  /** Dynamic batching (combine vertex data) */
  Dynamic = 'dynamic',
  /** Instanced rendering (GPU instancing) */
  Instanced = 'instanced',
  /** Static batching (pre-combined geometry) */
  Static = 'static',
}

/**
 * Render batch
 */
export interface RenderBatch {
  /** Batch type */
  type: BatchType;
  /** Material ID */
  materialId: string;
  /** Mesh ID */
  meshId: string;
  /** Objects in batch */
  objects: RenderableObject[];
  /** Instance data (for instanced batches) */
  instanceData?: Float32Array;
  /** Combined vertex data (for dynamic batches) */
  vertexData?: Float32Array;
  /** Combined index data (for dynamic batches) */
  indexData?: Uint16Array | Uint32Array;
}

/**
 * Batching configuration
 */
export interface BatchingConfig {
  /** Enable dynamic batching */
  enableDynamicBatching?: boolean;
  /** Enable instanced rendering */
  enableInstancing?: boolean;
  /** Enable static batching */
  enableStaticBatching?: boolean;
  /** Maximum dynamic batch size (vertices) */
  maxDynamicBatchSize?: number;
  /** Maximum instance count */
  maxInstanceCount?: number;
  /** Threshold for enabling batching */
  batchingThreshold?: number;
}

/**
 * Batching statistics
 */
export interface BatchingStats {
  /** Number of batches created */
  batchCount: number;
  /** Number of individual draw calls avoided */
  drawCallsSaved: number;
  /** Total vertices in batches */
  totalVertices: number;
  /** Total instances rendered */
  totalInstances: number;
  /** Memory used for batches */
  memoryUsed: number;
}

/**
 * Batching Manager
 *
 * Creates render batches to optimize rendering performance.
 *
 * @example
 * ```typescript
 * const batcher = new BatchingManager(device, {
 *   enableDynamicBatching: true,
 *   enableInstancing: true,
 *   maxInstanceCount: 1000,
 * });
 *
 * const batches = batcher.createBatches(objects);
 * ```
 */
export class BatchingManager {
  private device: GraphicsDevice;
  private config: Required<BatchingConfig>;
  private stats: BatchingStats = this.createEmptyStats();

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a batching manager
   *
   * @param device - Graphics device
   * @param config - Batching configuration
   */
  constructor(device: GraphicsDevice, config: BatchingConfig = {}) {
    this.device = device;

    this.config = {
      enableDynamicBatching: config.enableDynamicBatching ?? true,
      enableInstancing: config.enableInstancing ?? true,
      enableStaticBatching: config.enableStaticBatching ?? false,
      maxDynamicBatchSize: config.maxDynamicBatchSize ?? 65536,
      maxInstanceCount: config.maxInstanceCount ?? 1000,
      batchingThreshold: config.batchingThreshold ?? 3,
    };

    console.log('[BatchingManager] Created with config:', this.config);
  }

  // ==========================================================================
  // Batch Creation
  // ==========================================================================

  /**
   * Create render batches from objects
   *
   * @param objects - Objects to batch
   * @returns Array of render batches
   */
  createBatches(objects: RenderableObject[]): RenderBatch[] {
    this.resetStats();

    if (objects.length === 0) {
      return [];
    }

    // Group objects by material and mesh
    const groups = this.groupObjects(objects);

    // Create batches for each group
    const batches: RenderBatch[] = [];

    for (const group of groups.values()) {
      const groupBatches = this.createBatchesForGroup(group);
      batches.push(...groupBatches);
    }

    return batches;
  }

  /**
   * Create optimized batches (instancing preferred)
   *
   * @param objects - Objects to batch
   * @returns Array of optimized render batches
   */
  createOptimizedBatches(objects: RenderableObject[]): RenderBatch[] {
    if (objects.length === 0) {
      return [];
    }

    // Try instancing first (most efficient)
    if (this.config.enableInstancing) {
      const instancedBatches = this.createInstancedBatches(objects);
      if (instancedBatches.length > 0) {
        return instancedBatches;
      }
    }

    // Fall back to dynamic batching
    if (this.config.enableDynamicBatching) {
      const dynamicBatches = this.createDynamicBatches(objects);
      if (dynamicBatches.length > 0) {
        return dynamicBatches;
      }
    }

    // Individual rendering
    return this.createIndividualBatches(objects);
  }

  // ==========================================================================
  // Instanced Batching
  // ==========================================================================

  /**
   * Create instanced batches
   *
   * @param objects - Objects to batch
   * @returns Array of instanced batches
   */
  createInstancedBatches(objects: RenderableObject[]): RenderBatch[] {
    // Group by material and mesh
    const groups = this.groupObjects(objects);
    const batches: RenderBatch[] = [];

    for (const [key, group] of groups) {
      // Split into batches of maxInstanceCount
      const instanceBatches = this.splitIntoInstanceBatches(group);
      batches.push(...instanceBatches);
    }

    return batches;
  }

  /**
   * Create instance data for objects
   *
   * @param objects - Objects to create instance data for
   * @returns Instance data (matrices, colors, etc.)
   */
  createInstanceData(objects: RenderableObject[]): Float32Array {
    // Create instance data (matrices + other per-instance data)
    const instanceStride = 16; // 4x4 matrix = 16 floats
    const instanceData = new Float32Array(objects.length * instanceStride);

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const offset = i * instanceStride;

      // Get model matrix from object
      const matrix = obj.userData?.modelMatrix || this.getIdentityMatrix();

      // Copy matrix to instance data
      instanceData.set(matrix, offset);
    }

    return instanceData;
  }

  // ==========================================================================
  // Dynamic Batching
  // ==========================================================================

  /**
   * Create dynamic batches
   *
   * @param objects - Objects to batch
   * @returns Array of dynamic batches
   */
  createDynamicBatches(objects: RenderableObject[]): RenderBatch[] {
    const groups = this.groupObjects(objects);
    const batches: RenderBatch[] = [];

    for (const [key, group] of groups) {
      // Check if group is large enough to batch
      if (group.length < this.config.batchingThreshold) {
        continue;
      }

      // Split into batches of maxDynamicBatchSize
      const dynamicBatches = this.splitIntoDynamicBatches(group);
      batches.push(...dynamicBatches);
    }

    return batches;
  }

  /**
   * Combine vertex data for dynamic batch
   *
   * @param objects - Objects to combine
   * @returns Combined vertex data
   */
  combineVertexData(objects: RenderableObject[]): {
    vertexData: Float32Array;
    indexData: Uint16Array | Uint32Array;
    vertexCount: number;
    indexCount: number;
  } {
    // TODO: Implement actual vertex data combination
    // This requires access to mesh vertex data

    const vertexCount = objects.length * 100; // Placeholder
    const indexCount = objects.length * 300; // Placeholder

    return {
      vertexData: new Float32Array(vertexCount * 8), // 8 floats per vertex
      indexData: new Uint16Array(indexCount),
      vertexCount,
      indexCount,
    };
  }

  // ==========================================================================
  // Individual Batching
  // ==========================================================================

  /**
   * Create individual batches (no batching)
   *
   * @param objects - Objects to batch
   * @returns Array of individual batches
   */
  createIndividualBatches(objects: RenderableObject[]): RenderBatch[] {
    return objects.map((obj) => ({
      type: BatchType.Individual,
      materialId: obj.materialId,
      meshId: obj.meshId,
      objects: [obj],
    }));
  }

  // ==========================================================================
  // Grouping
  // ==========================================================================

  /**
   * Group objects by material and mesh
   *
   * @param objects - Objects to group
   * @returns Map of group key to object array
   */
  private groupObjects(objects: RenderableObject[]): Map<string, RenderableObject[]> {
    const groups = new Map<string, RenderableObject[]>();

    for (const obj of objects) {
      const key = this.getGroupKey(obj);
      let group = groups.get(key);
      if (!group) {
        group = [];
        groups.set(key, group);
      }
      group.push(obj);
    }

    return groups;
  }

  /**
   * Get group key for an object
   *
   * @param obj - Object to get key for
   * @returns Group key
   */
  private getGroupKey(obj: RenderableObject): string {
    return `${obj.materialId}_${obj.meshId}`;
  }

  /**
   * Split objects into instance batches
   *
   * @param objects - Objects to split
   * @returns Array of instance batches
   */
  private splitIntoInstanceBatches(objects: RenderableObject[]): RenderBatch[] {
    const batches: RenderBatch[] = [];
    const maxInstances = this.config.maxInstanceCount;

    for (let i = 0; i < objects.length; i += maxInstances) {
      const batchObjects = objects.slice(i, i + maxInstances);
      const instanceData = this.createInstanceData(batchObjects);

      batches.push({
        type: BatchType.Instanced,
        materialId: batchObjects[0].materialId,
        meshId: batchObjects[0].meshId,
        objects: batchObjects,
        instanceData,
      });

      // Update statistics
      this.stats.totalInstances += batchObjects.length;
    }

    return batches;
  }

  /**
   * Split objects into dynamic batches
   *
   * @param objects - Objects to split
   * @returns Array of dynamic batches
   */
  private splitIntoDynamicBatches(objects: RenderableObject[]): RenderBatch[] {
    const batches: RenderBatch[] = [];
    const maxVertices = this.config.maxDynamicBatchSize;

    // Estimate vertices per object
    const verticesPerObject = 100; // Placeholder
    const objectsPerBatch = Math.floor(maxVertices / verticesPerObject);

    for (let i = 0; i < objects.length; i += objectsPerBatch) {
      const batchObjects = objects.slice(i, i + objectsPerBatch);

      // Combine vertex data
      const { vertexData, indexData } = this.combineVertexData(batchObjects);

      batches.push({
        type: BatchType.Dynamic,
        materialId: batchObjects[0].materialId,
        meshId: batchObjects[0].meshId,
        objects: batchObjects,
        vertexData,
        indexData,
      });

      // Update statistics
      this.stats.totalVertices += vertexData.length / 8;
    }

    return batches;
  }

  // ==========================================================================
  // Batching Tests
  // ==========================================================================

  /**
   * Check if objects can be batched together
   *
   * @param objects - Objects to test
   * @returns True if can be batched
   */
  canBatch(objects: RenderableObject[]): boolean {
    if (objects.length < this.config.batchingThreshold) {
      return false;
    }

    // Check if all objects share same material and mesh
    const first = objects[0];
    for (let i = 1; i < objects.length; i++) {
      if (objects[i].materialId !== first.materialId) {
        return false;
      }
      if (objects[i].meshId !== first.meshId) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if objects can be instanced
   *
   * @param objects - Objects to test
   * @returns True if can be instanced
   */
  canInstance(objects: RenderableObject[]): boolean {
    if (!this.config.enableInstancing) {
      return false;
    }

    if (objects.length < this.config.batchingThreshold) {
      return false;
    }

    // Check if device supports instancing
    const maxInstancesSupported = this.device.limits.maxVertexBuffers || 1;
    if (objects.length > maxInstancesSupported) {
      return false;
    }

    return this.canBatch(objects);
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get batching statistics
   *
   * @returns Statistics object
   */
  getStats(): BatchingStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.createEmptyStats();
  }

  /**
   * Create empty stats object
   *
   * @returns Empty stats
   */
  private createEmptyStats(): BatchingStats {
    return {
      batchCount: 0,
      drawCallsSaved: 0,
      totalVertices: 0,
      totalInstances: 0,
      memoryUsed: 0,
    };
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Update batching configuration
   *
   * @param config - New configuration
   */
  updateConfig(config: Partial<BatchingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[BatchingManager] Config updated:', this.config);
  }

  /**
   * Get current configuration
   *
   * @returns Current configuration
   */
  getConfig(): Required<BatchingConfig> {
    return { ...this.config };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get identity matrix
   *
   * @returns Identity matrix
   */
  private getIdentityMatrix(): number[] {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  /**
   * Create batches for a group
   *
   * @param group - Object group
   * @returns Array of batches
   */
  private createBatchesForGroup(group: RenderableObject[]): RenderBatch[] {
    // Try instancing first
    if (this.config.enableInstancing && this.canInstance(group)) {
      return this.splitIntoInstanceBatches(group);
    }

    // Try dynamic batching
    if (this.config.enableDynamicBatching && this.canBatch(group)) {
      return this.splitIntoDynamicBatches(group);
    }

    // Individual rendering
    return this.createIndividualBatches(group);
  }
}

// Re-export enum and types
export { BatchType };
export type { RenderBatch, BatchingConfig, BatchingStats };
