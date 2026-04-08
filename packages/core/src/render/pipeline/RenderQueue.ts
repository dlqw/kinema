/**
 * Kinema Rendering Engine - Render Queue
 *
 * This module provides render queue management for organizing
 * renderable objects by type (opaque, transparent, overlay, etc.).
 *
 * @module pipeline
 */

/**
 * Render queue type
 */
export enum RenderQueueType {
  /** Background queue (skybox, etc.) - rendered first */
  Background = 'background',
  /** Opaque geometry queue */
  Opaque = 'opaque',
  /** Alpha test queue (cutout materials) */
  AlphaTest = 'alpha-test',
  /** Transparent geometry queue - rendered last */
  Transparent = 'transparent',
  /** Overlay queue (UI, etc.) - rendered after transparency */
  Overlay = 'overlay',
}

/**
 * Renderable object
 */
export interface RenderableObject {
  /** Object ID */
  id: string;
  /** Material ID */
  materialId: string;
  /** Mesh ID */
  meshId: string;
  /** Distance from camera (for sorting) */
  depth: number;
  /** Whether object is visible */
  visible: boolean;
  /** Whether object casts shadows */
  castShadows: boolean;
  /** Bounding sphere (for culling) */
  bounds?: {
    center: [number, number, number];
    radius: number;
  };
  /** User data */
  userData?: Record<string, any>;
}

/**
 * Render Queue
 *
 * Organizes renderable objects by queue type for proper rendering order.
 *
 * @example
 * ```typescript
 * const queue = new RenderQueue(RenderQueueType.Opaque);
 *
 * queue.add({
 *   id: 'object1',
 *   materialId: 'mat1',
 *   meshId: 'mesh1',
 *   depth: 10,
 *   visible: true,
 *   castShadows: true,
 * });
 *
 * const objects = queue.getObjects();
 * queue.clear();
 * ```
 */
export class RenderQueue {
  public readonly type: RenderQueueType;
  private objects: Map<string, RenderableObject> = new Map();
  private sorted: boolean = false;

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a render queue
   *
   * @param type - Queue type
   */
  constructor(type: RenderQueueType) {
    this.type = type;
  }

  // ==========================================================================
  // Object Management
  // ==========================================================================

  /**
   * Add an object to the queue
   *
   * @param object - Object to add
   */
  add(object: RenderableObject): void {
    this.objects.set(object.id, object);
    this.sorted = false;
  }

  /**
   * Remove an object from the queue
   *
   * @param id - Object ID
   * @returns True if object was removed
   */
  remove(id: string): boolean {
    const removed = this.objects.delete(id);
    if (removed) {
      this.sorted = false;
    }
    return removed;
  }

  /**
   * Get an object by ID
   *
   * @param id - Object ID
   * @returns Object or undefined
   */
  get(id: string): RenderableObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Check if queue contains an object
   *
   * @param id - Object ID
   * @returns True if object exists in queue
   */
  has(id: string): boolean {
    return this.objects.has(id);
  }

  /**
   * Get all objects in the queue
   *
   * @returns Array of objects
   */
  getObjects(): RenderableObject[] {
    if (!this.sorted) {
      this.sort();
    }
    return Array.from(this.objects.values());
  }

  /**
   * Get number of objects in queue
   *
   * @returns Object count
   */
  getCount(): number {
    return this.objects.size;
  }

  // ==========================================================================
  // Queue Operations
  // ==========================================================================

  /**
   * Clear all objects from the queue
   */
  clear(): void {
    this.objects.clear();
    this.sorted = false;
  }

  /**
   * Sort objects in the queue
   *
   * Sorting depends on queue type:
   * - Background: No sorting
   * - Opaque: Front-to-back (depth ascending)
   * - AlphaTest: Front-to-back (depth ascending)
   * - Transparent: Back-to-front (depth descending)
   * - Overlay: No sorting
   */
  sort(): void {
    if (this.sorted || this.objects.size === 0) {
      return;
    }

    const objects = Array.from(this.objects.values());

    switch (this.type) {
      case RenderQueueType.Opaque:
      case RenderQueueType.AlphaTest:
        // Front-to-back for Z-buffer efficiency
        objects.sort((a, b) => a.depth - b.depth);
        break;

      case RenderQueueType.Transparent:
        // Back-to-front for correct transparency
        objects.sort((a, b) => b.depth - a.depth);
        break;

      case RenderQueueType.Background:
      case RenderQueueType.Overlay:
        // No sorting needed
        break;
    }

    // Rebuild map with sorted order
    this.objects.clear();
    for (const obj of objects) {
      this.objects.set(obj.id, obj);
    }

    this.sorted = true;
  }

  /**
   * Filter objects by predicate
   *
   * @param predicate - Filter function
   * @returns Filtered array of objects
   */
  filter(predicate: (obj: RenderableObject) => boolean): RenderableObject[] {
    const objects = this.getObjects();
    return objects.filter(predicate);
  }

  /**
   * Get objects that cast shadows
   *
   * @returns Array of shadow-casting objects
   */
  getShadowCasters(): RenderableObject[] {
    return this.filter((obj) => obj.castShadows && obj.visible);
  }

  /**
   * Get visible objects
   *
   * @returns Array of visible objects
   */
  getVisibleObjects(): RenderableObject[] {
    return this.filter((obj) => obj.visible);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Update depth for all objects
   *
   * @param camera - Camera to calculate depth from
   */
  updateDepths(camera: any): void {
    for (const obj of this.objects.values()) {
      // Calculate depth from camera
      // This is a simplified calculation
      // TODO: Implement proper depth calculation
      if (obj.bounds && camera.position) {
        const dx = obj.bounds.center[0] - camera.position[0];
        const dy = obj.bounds.center[1] - camera.position[1];
        const dz = obj.bounds.center[2] - camera.position[2];
        obj.depth = Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
    }
    this.sorted = false;
  }

  /**
   * Get queue statistics
   *
   * @returns Statistics object
   */
  getStats(): {
    type: RenderQueueType;
    objectCount: number;
    visibleCount: number;
    shadowCasterCount: number;
  } {
    const objects = this.getObjects();
    const visible = objects.filter((obj) => obj.visible);
    const shadowCasters = objects.filter((obj) => obj.castShadows);

    return {
      type: this.type,
      objectCount: objects.length,
      visibleCount: visible.length,
      shadowCasterCount: shadowCasters.length,
    };
  }
}

// Types are already exported above with their definitions
