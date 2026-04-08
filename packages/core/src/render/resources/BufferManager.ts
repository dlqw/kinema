/**
 * Kinema Rendering Engine - Buffer Manager
 *
 * This module manages GPU buffer resources including:
 * - Vertex buffers (position, normal, UV, color, etc.)
 * - Index buffers (16-bit and 32-bit indices)
 * - Uniform buffers (shader parameters)
 * - Storage buffers (compute shader data)
 *
 * Features:
 * - Type-safe buffer handles
 * - Automatic buffer pooling
 * - Memory usage tracking
 * - Buffer reuse and recycling
 *
 * @module resources
 */

import type { GraphicsDevice, GraphicsBuffer } from '../graphics/GraphicsDevice';
import type { BufferDescriptor as CoreBufferDescriptor } from '../core/types';
import { ResourceCache, ResourceType, EvictionPolicy } from './ResourceCache';

/**
 * Buffer usage flags
 */
export const BufferUsageFlags = {
  NONE: 0,
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

/**
 * Extended buffer descriptor with additional properties for buffer management
 */
interface InternalBufferDescriptor extends CoreBufferDescriptor {
  /** Number of elements in the buffer */
  elementCount?: number;
  /** Size of each element in bytes */
  elementSize?: number;
  /** Initial data to upload */
  data?: ArrayBufferView;
  /** Make buffer persistent in cache */
  persistent?: boolean;
}

/**
 * Buffer handle
 *
 * Type-safe handle to a GPU buffer resource.
 */
export interface BufferHandle {
  /** Unique buffer identifier */
  id: string;
  /** Buffer usage flags */
  usage: number;
  /** Buffer size in bytes */
  size: number;
  /** Number of elements */
  elementCount: number;
  /** Size of each element in bytes */
  elementSize: number;
  /** Whether buffer is mapped */
  isMapped: boolean;
  /** Reference to the actual buffer resource */
  buffer: GraphicsBuffer;
}

/**
 * Buffer creation options
 */
export interface BufferOptions {
  /** Buffer label for debugging */
  label?: string;
  /** Initial data to upload */
  data?: ArrayBufferView;
  /** Create buffer mapped at creation */
  mappedAtCreation?: boolean;
  /** Make buffer persistent in cache */
  persistent?: boolean;
}

/**
 * Vertex buffer descriptor
 */
export interface VertexBufferDescriptor extends BufferOptions {
  /** Vertex stride in bytes */
  stride: number;
  /** Number of vertices */
  vertexCount: number;
  /** Vertex attributes */
  attributes?: BufferVertexAttribute[];
}

/**
 * Vertex attribute descriptor for vertex buffers
 */
export interface BufferVertexAttribute {
  /** Attribute name (for debugging) */
  name: string;
  /** Attribute location in shader */
  location: number;
  /** Offset in bytes from vertex start */
  offset: number;
  /** Data format (e.g., 'float32x3') */
  format: string;
}

/**
 * Index buffer descriptor
 */
export interface IndexBufferDescriptor extends BufferOptions {
  /** Index format (uint16 or uint32) */
  format: 'uint16' | 'uint32';
  /** Number of indices */
  indexCount: number;
}

/**
 * Uniform buffer descriptor
 */
export interface UniformBufferDescriptor extends BufferOptions {
  /** Buffer size in bytes (must be multiple of minUniformBufferOffsetAlignment) */
  size: number;
  /** Binding point (for dynamic indexing) */
  binding?: number;
}

/**
 * Buffer manager configuration
 */
export interface BufferManagerConfig {
  /** Maximum buffer pool size in bytes */
  maxPoolSize?: number;
  /** Minimum buffer size for pooling */
  minPoolSize?: number;
  /** Enable memory tracking */
  enableMemoryTracking?: boolean;
  /** Enable buffer pooling */
  enablePooling?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Buffer manager statistics
 */
export interface BufferManagerStats {
  /** Total number of buffers */
  totalBuffers: number;
  /** Total memory used in bytes */
  totalMemoryUsed: number;
  /** Number of vertex buffers */
  vertexBufferCount: number;
  /** Number of index buffers */
  indexBufferCount: number;
  /** Number of uniform buffers */
  uniformBufferCount: number;
  /** Number of storage buffers */
  storageBufferCount: number;
  /** Pool statistics */
  pool: {
    totalBuffers: number;
    totalMemory: number;
    hitRate: number;
  };
}

/**
 * Buffer Manager
 *
 * Manages creation, caching, and lifecycle of GPU buffers.
 *
 * @example
 * ```typescript
 * const manager = new BufferManager(device);
 *
 * // Create vertex buffer
 * const vertexBuffer = manager.createVertexBuffer({
 *   stride: 32,
 *   vertexCount: 1000,
 *   data: vertexData,
 * });
 *
 * // Create index buffer
 * const indexBuffer = manager.createIndexBuffer({
 *   format: 'uint16',
 *   indexCount: 3000,
 *   data: indexData,
 * });
 *
 * // Get statistics
 * const stats = manager.getStats();
 * ```
 */
export class BufferManager {
  private device: GraphicsDevice;
  private config: Required<BufferManagerConfig>;
  private bufferCache: ResourceCache<GraphicsBuffer>;
  private bufferIdCounter = 0;
  private buffers: Map<string, BufferHandle> = new Map();

  // Buffer pools for reuse
  private vertexBufferPool: Map<number, GraphicsBuffer[]> = new Map();
  private indexBufferPool: Map<number, GraphicsBuffer[]> = new Map();
  private uniformBufferPool: Map<number, GraphicsBuffer[]> = new Map();

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a buffer manager
   *
   * @param device - Graphics device
   * @param config - Configuration options
   */
  constructor(device: GraphicsDevice, config: BufferManagerConfig = {}) {
    this.device = device;
    this.config = {
      maxPoolSize: config.maxPoolSize ?? 64 * 1024 * 1024, // 64MB
      minPoolSize: config.minPoolSize ?? 1024, // 1KB minimum
      enableMemoryTracking: config.enableMemoryTracking ?? true,
      enablePooling: config.enablePooling ?? true,
      verbose: config.verbose ?? false,
    };

    // Create buffer cache
    this.bufferCache = new ResourceCache<GraphicsBuffer>({
      maxSize: this.config.maxPoolSize * 4, // 4x pool size for cache
      maxItems: 1000,
      evictionPolicy: EvictionPolicy.LRU,
      autoGC: true,
      enableMemoryTracking: this.config.enableMemoryTracking,
      verbose: this.config.verbose,
    });

    this.log('[BufferManager] Created with config:', this.config);
  }

  // ==========================================================================
  // Buffer Creation
  // ==========================================================================

  /**
   * Create a vertex buffer
   *
   * @param descriptor - Vertex buffer descriptor
   * @returns Buffer handle
   */
  createVertexBuffer(descriptor: VertexBufferDescriptor): BufferHandle {
    const size = descriptor.stride * descriptor.vertexCount;
    const usage = BufferUsageFlags.VERTEX | BufferUsageFlags.COPY_DST;

    return this.createBuffer({
      ...descriptor,
      usage,
      size,
      elementCount: descriptor.vertexCount,
      elementSize: descriptor.stride,
    });
  }

  /**
   * Create an index buffer
   *
   * @param descriptor - Index buffer descriptor
   * @returns Buffer handle
   */
  createIndexBuffer(descriptor: IndexBufferDescriptor): BufferHandle {
    const elementSize = descriptor.format === 'uint32' ? 4 : 2;
    const size = elementSize * descriptor.indexCount;
    const usage = BufferUsageFlags.INDEX | BufferUsageFlags.COPY_DST;

    return this.createBuffer({
      ...descriptor,
      usage,
      size,
      elementCount: descriptor.indexCount,
      elementSize,
    });
  }

  /**
   * Create a uniform buffer
   *
   * @param descriptor - Uniform buffer descriptor
   * @returns Buffer handle
   */
  createUniformBuffer(descriptor: UniformBufferDescriptor): BufferHandle {
    // Align size to minUniformBufferOffsetAlignment
    const alignment = this.device.limits.minUniformBufferOffsetAlignment || 256;
    const alignedSize = Math.ceil(descriptor.size / alignment) * alignment;

    const usage = BufferUsageFlags.UNIFORM | BufferUsageFlags.COPY_DST;

    return this.createBuffer({
      ...descriptor,
      usage,
      size: alignedSize,
      elementCount: 1,
      elementSize: alignedSize,
    });
  }

  /**
   * Create a storage buffer
   *
   * @param descriptor - Buffer descriptor
   * @returns Buffer handle
   */
  createStorageBuffer(descriptor: BufferOptions): BufferHandle {
    const usage = BufferUsageFlags.STORAGE | BufferUsageFlags.COPY_DST;

    return this.createBuffer({
      ...descriptor,
      usage,
      size: descriptor.data?.byteLength || 0,
      elementCount: descriptor.data?.byteLength || 0,
      elementSize: 1,
    });
  }

  /**
   * Create a generic buffer
   *
   * @param descriptor - Buffer descriptor
   * @returns Buffer handle
   */
  createBuffer(descriptor: InternalBufferDescriptor): BufferHandle {
    const bufferId = `buffer_${this.bufferIdCounter++}`;

    // Try to get from pool first
    let buffer = this.tryGetFromPool(descriptor.usage, descriptor.size);

    if (!buffer) {
      // Create new buffer
      const gpuDescriptor: CoreBufferDescriptor = {
        label: descriptor.label || bufferId,
        size: descriptor.size,
        usage: descriptor.usage,
        mappedAtCreation: descriptor.mappedAtCreation ?? false,
      };

      buffer = this.device.createBuffer(gpuDescriptor);
    }

    // Upload initial data if provided
    if (descriptor.data && !descriptor.mappedAtCreation) {
      buffer.write(descriptor.data);
    }

    // Create handle
    const handle: BufferHandle = {
      id: bufferId,
      usage: descriptor.usage,
      size: descriptor.size,
      elementCount: descriptor.elementCount || 0,
      elementSize: descriptor.elementSize || 1,
      isMapped: descriptor.mappedAtCreation ?? false,
      buffer,
    };

    // Store handle
    this.buffers.set(bufferId, handle);

    // Add to cache if persistent
    if (descriptor.persistent) {
      this.bufferCache.set(bufferId, buffer, ResourceType.Buffer, descriptor.size, true);
    }

    this.log(`[BufferManager] Created buffer: ${bufferId} (${this.formatSize(descriptor.size)})`);

    return handle;
  }

  // ==========================================================================
  // Buffer Operations
  // ==========================================================================

  /**
   * Update buffer data
   *
   * @param handle - Buffer handle
   * @param data - Data to upload
   * @param offset - Offset in bytes
   */
  updateBuffer(handle: BufferHandle, data: ArrayBufferView, offset: number = 0): void {
    handle.buffer.write(data, offset);
    this.log(`[BufferManager] Updated buffer: ${handle.id} at offset ${offset}`);
  }

  /**
   * Read buffer data
   *
   * @param handle - Buffer handle
   * @returns Buffer data
   */
  readBuffer(handle: BufferHandle): ArrayBuffer {
    return handle.buffer.read();
  }

  /**
   * Map buffer for CPU access
   *
   * @param handle - Buffer handle
   * @param mode - Map mode (read or write)
   * @returns Promise resolving to mapped array buffer
   */
  async mapBuffer(handle: BufferHandle, mode: 'read' | 'write' = 'write'): Promise<ArrayBuffer> {
    const mapMode = mode === 'read' ? 1 : 2; // MAP_READ or MAP_WRITE
    const mapped = await handle.buffer.mapAsync(mapMode);
    handle.isMapped = true;
    return mapped;
  }

  /**
   * Unmap buffer
   *
   * @param handle - Buffer handle
   */
  unmapBuffer(handle: BufferHandle): void {
    handle.buffer.unmap();
    handle.isMapped = false;
  }

  // ==========================================================================
  // Buffer Lifecycle
  // ==========================================================================

  /**
   * Get a buffer handle by ID
   *
   * @param id - Buffer ID
   * @returns Buffer handle or undefined
   */
  getBuffer(id: string): BufferHandle | undefined {
    return this.buffers.get(id);
  }

  /**
   * Return a buffer to the pool
   *
   * @param handle - Buffer handle
   */
  returnBuffer(handle: BufferHandle): void {
    const { id, buffer, usage, size } = handle;

    // Remove from active buffers
    this.buffers.delete(id);

    // Add to appropriate pool
    if (this.config.enablePooling) {
      if (usage & BufferUsageFlags.VERTEX) {
        this.addToPool(this.vertexBufferPool, size, buffer);
      } else if (usage & BufferUsageFlags.INDEX) {
        this.addToPool(this.indexBufferPool, size, buffer);
      } else if (usage & BufferUsageFlags.UNIFORM) {
        this.addToPool(this.uniformBufferPool, size, buffer);
      }
    } else {
      // Destroy buffer if pooling is disabled
      buffer.destroy();
    }

    this.log(`[BufferManager] Returned buffer to pool: ${id}`);
  }

  /**
   * Destroy a buffer
   *
   * @param handle - Buffer handle
   */
  destroyBuffer(handle: BufferHandle): void {
    const { id, buffer } = handle;

    // Remove from active buffers
    this.buffers.delete(id);

    // Remove from cache
    this.bufferCache.remove(id);

    // Destroy buffer
    buffer.destroy();

    this.log(`[BufferManager] Destroyed buffer: ${id}`);
  }

  /**
   * Destroy all buffers
   */
  destroyAll(): void {
    for (const handle of this.buffers.values()) {
      handle.buffer.destroy();
    }
    this.buffers.clear();
    this.bufferCache.clear();

    // Clear pools
    this.vertexBufferPool.clear();
    this.indexBufferPool.clear();
    this.uniformBufferPool.clear();

    this.log('[BufferManager] Destroyed all buffers');
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get buffer manager statistics
   *
   * @returns Statistics object
   */
  getStats(): BufferManagerStats {
    let vertexBufferCount = 0;
    let indexBufferCount = 0;
    let uniformBufferCount = 0;
    let storageBufferCount = 0;

    for (const handle of this.buffers.values()) {
      if (handle.usage & BufferUsageFlags.VERTEX) {
        vertexBufferCount++;
      }
      if (handle.usage & BufferUsageFlags.INDEX) {
        indexBufferCount++;
      }
      if (handle.usage & BufferUsageFlags.UNIFORM) {
        uniformBufferCount++;
      }
      if (handle.usage & BufferUsageFlags.STORAGE) {
        storageBufferCount++;
      }
    }

    const cacheStats = this.bufferCache.getStats();

    return {
      totalBuffers: this.buffers.size,
      totalMemoryUsed: cacheStats.memoryUsed,
      vertexBufferCount,
      indexBufferCount,
      uniformBufferCount,
      storageBufferCount,
      pool: {
        totalBuffers: cacheStats.itemCount,
        totalMemory: cacheStats.memoryUsed,
        hitRate: cacheStats.hitRate,
      },
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Try to get a buffer from the pool
   *
   * @param usage - Buffer usage flags
   * @param size - Required buffer size
   * @returns Buffer from pool or undefined
   */
  private tryGetFromPool(usage: number, size: number): GraphicsBuffer | undefined {
    if (!this.config.enablePooling) {
      return undefined;
    }

    let pool: Map<number, GraphicsBuffer[]> | undefined;

    if (usage & BufferUsageFlags.VERTEX) {
      pool = this.vertexBufferPool;
    } else if (usage & BufferUsageFlags.INDEX) {
      pool = this.indexBufferPool;
    } else if (usage & BufferUsageFlags.UNIFORM) {
      pool = this.uniformBufferPool;
    }

    if (!pool) {
      return undefined;
    }

    // Find a buffer of suitable size
    for (const [poolSize, buffers] of pool) {
      if (poolSize >= size && buffers.length > 0) {
        return buffers.pop();
      }
    }

    return undefined;
  }

  /**
   * Add a buffer to the pool
   *
   * @param pool - Buffer pool
   * @param size - Buffer size
   * @param buffer - Buffer to add
   */
  private addToPool(
    pool: Map<number, GraphicsBuffer[]>,
    size: number,
    buffer: GraphicsBuffer,
  ): void {
    // Only pool buffers above minimum size
    if (size < this.config.minPoolSize) {
      buffer.destroy();
      return;
    }

    // Get or create array for this size
    let buffers = pool.get(size);
    if (!buffers) {
      buffers = [];
      pool.set(size, buffers);
    }

    // Add to pool (limit pool size)
    if (buffers.length < 10) {
      buffers.push(buffer);
    } else {
      buffer.destroy();
    }
  }

  /**
   * Format byte size to human-readable string
   *
   * @param bytes - Size in bytes
   * @returns Formatted string
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Log message if verbose mode is enabled
   *
   * @param message - Message to log
   */
  private log(...message: any[]): void {
    if (this.config.verbose) {
      console.log(...message);
    }
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Destroy the buffer manager
   *
   * Releases all buffers and clears pools.
   */
  destroy(): void {
    this.destroyAll();
    this.bufferCache.destroy();
    this.log('[BufferManager] Destroyed');
  }
}
