/**
 * AniMaker Rendering Engine - Resource Cache
 *
 * This module provides a generic LRU (Least Recently Used) cache implementation
 * for GPU resources. Features include:
 * - Automatic resource eviction when cache is full
 * - Resource reference counting
 * - Memory usage tracking
 * - Resource lifecycle management
 *
 * @module resources
 */

import type { GraphicsBuffer, GraphicsTexture, GraphicsSampler } from '../graphics/GraphicsDevice';

/**
 * Resource types that can be cached
 */
export enum ResourceType {
  Buffer = 'buffer',
  Texture = 'texture',
  Sampler = 'sampler',
  Pipeline = 'pipeline',
  Shader = 'shader',
}

/**
 * Cache entry containing resource and metadata
 */
interface CacheEntry<T> {
  /** Cached resource */
  resource: T;
  /** Resource type */
  type: ResourceType;
  /** Resource size in bytes */
  size: number;
  /** Last access timestamp */
  lastAccess: number;
  /** Reference count */
  refCount: number;
  /** Resource key/identifier */
  key: string;
  /** Whether resource is persistent (never evicted) */
  persistent: boolean;
}

/**
 * Cache eviction policy
 */
export enum EvictionPolicy {
  /** Least Recently Used - evict oldest accessed items */
  LRU = 'lru',
  /** Least Frequently Used - evict least accessed items */
  LFU = 'lfu',
  /** First In First Out - evict oldest items */
  FIFO = 'fifo',
}

/**
 * Resource cache configuration
 */
export interface ResourceCacheConfig {
  /** Maximum cache size in bytes (0 = unlimited) */
  maxSize?: number;
  /** Maximum number of resources (0 = unlimited) */
  maxItems?: number;
  /** Eviction policy */
  evictionPolicy?: EvictionPolicy;
  /** Enable automatic garbage collection */
  autoGC?: boolean;
  /** GC interval in milliseconds */
  gcInterval?: number;
  /** Enable memory tracking */
  enableMemoryTracking?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Current number of items in cache */
  itemCount: number;
  /** Total memory used in bytes */
  memoryUsed: number;
  /** Total memory capacity in bytes */
  memoryCapacity: number;
  /** Memory utilization (0-1) */
  memoryUtilization: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Hit rate (0-1) */
  hitRate: number;
  /** Number of evictions */
  evictions: number;
}

/**
 * Resource Cache
 *
 * Generic LRU cache for GPU resources with automatic eviction
 * and memory management.
 *
 * @example
 * ```typescript
 * const cache = new ResourceCache<GraphicsBuffer>({
 *   maxSize: 256 * 1024 * 1024, // 256MB
 *   evictionPolicy: EvictionPolicy.LRU,
 * });
 *
 * // Add resource to cache
 * cache.set('vertex_buffer', buffer, ResourceType.Buffer, 1024);
 *
 * // Get resource from cache
 * const resource = cache.get('vertex_buffer');
 *
 * // Get statistics
 * const stats = cache.getStats();
 * ```
 */
export class ResourceCache<T = GraphicsBuffer | GraphicsTexture | GraphicsSampler> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private config: Required<ResourceCacheConfig>;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
  private gcIntervalId: number | null = null;
  private currentMemoryUsage = 0;

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a resource cache
   *
   * @param config - Cache configuration
   */
  constructor(config: ResourceCacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 256 * 1024 * 1024, // 256MB default
      maxItems: config.maxItems ?? 1000,
      evictionPolicy: config.evictionPolicy ?? EvictionPolicy.LRU,
      autoGC: config.autoGC ?? true,
      gcInterval: config.gcInterval ?? 30000, // 30 seconds
      enableMemoryTracking: config.enableMemoryTracking ?? true,
      verbose: config.verbose ?? false,
    };

    // Setup garbage collection
    if (this.config.autoGC) {
      this.setupGC();
    }

    this.log('[ResourceCache] Created with config:', this.config);
  }

  // ==========================================================================
  // Cache Operations
  // ==========================================================================

  /**
   * Add or update a resource in the cache
   *
   * @param key - Resource key
   * @param resource - Resource to cache
   * @param type - Resource type
   * @param size - Resource size in bytes
   * @param persistent - Whether resource should never be evicted
   */
  set(key: string, resource: T, type: ResourceType, size: number, persistent: boolean = false): void {
    const existingEntry = this.cache.get(key);

    if (existingEntry) {
      // Update existing entry
      existingEntry.resource = resource;
      existingEntry.size = size;
      existingEntry.lastAccess = performance.now();
      existingEntry.persistent = persistent;

      // Update memory usage
      if (this.config.enableMemoryTracking) {
        this.currentMemoryUsage += size - existingEntry.size;
      }

      this.log(`[ResourceCache] Updated resource: ${key} (${this.formatSize(size)})`);
    } else {
      // Check if we need to evict resources
      this.ensureCapacity(size);

      // Create new entry
      const entry: CacheEntry<T> = {
        resource,
        type,
        size,
        lastAccess: performance.now(),
        refCount: 1,
        key,
        persistent,
      };

      this.cache.set(key, entry);
      this.accessOrder.push(key);

      // Update memory usage
      if (this.config.enableMemoryTracking) {
        this.currentMemoryUsage += size;
      }

      this.log(`[ResourceCache] Added resource: ${key} (${this.formatSize(size)})`);
    }

    // Check capacity
    this.checkCapacity();
  }

  /**
   * Get a resource from the cache
   *
   * @param key - Resource key
   * @returns Resource or undefined if not found
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (entry) {
      // Update access time
      entry.lastAccess = performance.now();

      // Update access order for LRU
      if (this.config.evictionPolicy === EvictionPolicy.LRU) {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
          this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
      }

      // Increment reference count
      entry.refCount++;

      // Update statistics
      this.stats.hits++;

      this.log(`[ResourceCache] Cache hit: ${key}`);
      return entry.resource;
    }

    // Cache miss
    this.stats.misses++;
    this.log(`[ResourceCache] Cache miss: ${key}`);
    return undefined;
  }

  /**
   * Check if a resource exists in the cache
   *
   * @param key - Resource key
   * @returns True if resource exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove a resource from the cache
   *
   * @param key - Resource key
   * @returns True if resource was removed
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Destroy resource if it has a destroy method
    if (entry.resource && typeof (entry.resource as any).destroy === 'function') {
      (entry.resource as any).destroy();
    }

    // Remove from cache
    this.cache.delete(key);

    // Remove from access order
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }

    // Update memory usage
    if (this.config.enableMemoryTracking) {
      this.currentMemoryUsage -= entry.size;
    }

    this.log(`[ResourceCache] Removed resource: ${key}`);
    return true;
  }

  /**
   * Clear all resources from the cache
   */
  clear(): void {
    // Destroy all resources
    for (const [key, entry] of this.cache) {
      if (entry.resource && typeof (entry.resource as any).destroy === 'function') {
        (entry.resource as any).destroy();
      }
    }

    this.cache.clear();
    this.accessOrder = [];
    this.currentMemoryUsage = 0;

    this.log('[ResourceCache] Cleared all resources');
  }

  // ==========================================================================
  // Reference Counting
  // ==========================================================================

  /**
   * Increment reference count for a resource
   *
   * @param key - Resource key
   */
  retain(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.refCount++;
      this.log(`[ResourceCache] Retained resource: ${key} (ref count: ${entry.refCount})`);
    }
  }

  /**
   * Decrement reference count for a resource
   *
   * If reference count reaches 0 and resource is not persistent,
   * it may be evicted during the next garbage collection.
   *
   * @param key - Resource key
   */
  release(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.refCount--;
      this.log(`[ResourceCache] Released resource: ${key} (ref count: ${entry.refCount})`);

      // Auto-remove if ref count is 0 and not persistent
      if (entry.refCount <= 0 && !entry.persistent) {
        this.remove(key);
      }
    }
  }

  /**
   * Get reference count for a resource
   *
   * @param key - Resource key
   * @returns Reference count or 0 if not found
   */
  getRefCount(key: string): number {
    const entry = this.cache.get(key);
    return entry?.refCount ?? 0;
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Ensure cache has capacity for a new resource
   *
   * Evicts resources if necessary based on the eviction policy.
   *
   * @param requiredSize - Size required in bytes
   */
  private ensureCapacity(requiredSize: number): void {
    const maxItems = this.config.maxItems;
    const maxSize = this.config.maxSize;

    // Evict by item count
    while (this.cache.size >= maxItems && this.accessOrder.length > 0) {
      this.evictOne();
    }

    // Evict by memory size
    if (this.config.enableMemoryTracking && maxSize > 0) {
      while (
        this.currentMemoryUsage + requiredSize > maxSize &&
        this.accessOrder.length > 0
      ) {
        this.evictOne();
      }
    }
  }

  /**
   * Check if cache is over capacity
   */
  private checkCapacity(): void {
    if (this.config.enableMemoryTracking && this.config.maxSize > 0) {
      if (this.currentMemoryUsage > this.config.maxSize) {
        console.warn(
          `[ResourceCache] Over capacity: ${this.formatSize(this.currentMemoryUsage)} / ${this.formatSize(this.config.maxSize)}`
        );
      }
    }
  }

  /**
   * Evict one resource based on eviction policy
   */
  private evictOne(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    let keyToEvict: string | undefined;

    switch (this.config.evictionPolicy) {
      case EvictionPolicy.LRU:
        // Remove first (least recently accessed)
        keyToEvict = this.accessOrder.shift();
        break;

      case EvictionPolicy.LFU:
        // Find resource with lowest access frequency
        let minAccess = Infinity;
        for (const [key, entry] of this.cache) {
          if (!entry.persistent && entry.refCount <= 0) {
            // Simple heuristic: use refCount as access frequency
            if (entry.refCount < minAccess) {
              minAccess = entry.refCount;
              keyToEvict = key;
            }
          }
        }
        if (keyToEvict) {
          const index = this.accessOrder.indexOf(keyToEvict);
          if (index !== -1) {
            this.accessOrder.splice(index, 1);
          }
        }
        break;

      case EvictionPolicy.FIFO:
        // Remove first added
        keyToEvict = this.accessOrder.shift();
        break;
    }

    if (keyToEvict && this.cache.has(keyToEvict)) {
      const entry = this.cache.get(keyToEvict);
      if (entry && !entry.persistent) {
        this.remove(keyToEvict);
        this.stats.evictions++;
        this.log(`[ResourceCache] Evicted resource: ${keyToEvict}`);
      }
    }
  }

  /**
   * Perform garbage collection
   *
   * Removes resources with zero reference count that are not persistent.
   */
  gc(): void {
    const toRemove: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.refCount <= 0 && !entry.persistent) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      this.remove(key);
    }

    if (toRemove.length > 0) {
      this.log(`[ResourceCache] GC: Removed ${toRemove.length} unreferenced resources`);
    }
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get cache statistics
   *
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const memoryUtilization =
      this.config.maxSize > 0 ? this.currentMemoryUsage / this.config.maxSize : 0;

    return {
      itemCount: this.cache.size,
      memoryUsed: this.currentMemoryUsage,
      memoryCapacity: this.config.maxSize,
      memoryUtilization,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      evictions: this.stats.evictions,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
    this.log('[ResourceCache] Statistics reset');
  }

  /**
   * Get all resource keys
   *
   * @returns Array of resource keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all cached resources
   *
   * @returns Map of keys to resources
   */
  entries(): Map<string, T> {
    const resources = new Map<string, T>();
    for (const [key, entry] of this.cache) {
      resources.set(key, entry.resource);
    }
    return resources;
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Setup garbage collection interval
   */
  private setupGC(): void {
    if (typeof window !== 'undefined') {
      this.gcIntervalId = window.setInterval(() => {
        this.gc();
      }, this.config.gcInterval);
    }
  }

  /**
   * Destroy the cache
   *
   * Releases all resources and stops garbage collection.
   */
  destroy(): void {
    // Stop GC
    if (this.gcIntervalId !== null) {
      clearInterval(this.gcIntervalId);
      this.gcIntervalId = null;
    }

    // Clear all resources
    this.clear();

    this.log('[ResourceCache] Destroyed');
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

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
}

// Re-export types and enums
export { ResourceType, EvictionPolicy };
export type { ResourceCacheConfig, CacheStats };
