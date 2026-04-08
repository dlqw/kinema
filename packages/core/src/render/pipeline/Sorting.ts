/**
 * Kinema Rendering Engine - Rendering Sorting
 *
 * This module provides sorting functionality for optimizing rendering
 * by reducing state changes and ensuring correct rendering order.
 *
 * @module pipeline
 */

import type { RenderableObject } from './RenderQueue';

/**
 * Sort key generator options
 */
export interface SortKeyOptions {
  /** Material ID priority */
  materialPriority?: number;
  /** Depth priority */
  depthPriority?: number;
  /** Transparency priority */
  transparencyPriority?: number;
}

/**
 * Sort criteria
 */
export enum SortCriteria {
  /** Sort by material ID (minimize state changes) */
  Material = 'material',
  /** Sort by depth (front-to-back or back-to-front) */
  Depth = 'depth',
  /** Sort by transparency */
  Transparency = 'transparency',
  /** Sort by shader */
  Shader = 'shader',
  /** Custom sort function */
  Custom = 'custom',
}

/**
 * Rendering Sorter
 *
 * Provides various sorting strategies for renderable objects.
 *
 * @example
 * ```typescript
 * const sorter = new RenderSorter();
 *
 * // Sort opaque objects (front-to-back, by material)
 * const opaqueSorted = sorter.sortOpaque(objects);
 *
 * // Sort transparent objects (back-to-front)
 * const transparentSorted = sorter.sortTransparent(objects);
 * ```
 */
export class RenderSorter {
  // ==========================================================================
  // Opaque Sorting
  // ==========================================================================

  /**
   * Sort opaque objects for optimal rendering
   *
   * Sorts by material first (to minimize state changes), then by depth
   * (front-to-back for Z-buffer efficiency).
   *
   * @param objects - Objects to sort
   * @returns Sorted objects
   */
  sortOpaque(objects: RenderableObject[]): RenderableObject[] {
    return [...objects].sort((a, b) => {
      // Primary sort by material
      if (a.materialId !== b.materialId) {
        return (a.materialId || '').localeCompare(b.materialId || '');
      }

      // Secondary sort by depth (front-to-back)
      return (a.depth || 0) - (b.depth || 0);
    });
  }

  /**
   * Sort opaque objects with custom priorities
   *
   * @param objects - Objects to sort
   * @param options - Sort options
   * @returns Sorted objects
   */
  sortOpaqueWithOptions(objects: RenderableObject[], options: SortKeyOptions): RenderableObject[] {
    return [...objects].sort((a, b) => {
      const keyA = this.generateSortKey(a, options);
      const keyB = this.generateSortKey(b, options);
      return keyA - keyB;
    });
  }

  // ==========================================================================
  // Transparent Sorting
  // ==========================================================================

  /**
   * Sort transparent objects for correct rendering
   *
   * Sorts back-to-front to ensure correct alpha blending.
   *
   * @param objects - Objects to sort
   * @returns Sorted objects
   */
  sortTransparent(objects: RenderableObject[]): RenderableObject[] {
    return [...objects].sort((a, b) => {
      // Sort by depth (back-to-front)
      return (b.depth || 0) - (a.depth || 0);
    });
  }

  /**
   * Sort transparent objects with material grouping
   *
   * Groups by material while maintaining back-to-front order
   * within each material group.
   *
   * @param objects - Objects to sort
   * @returns Sorted objects
   */
  sortTransparentGrouped(objects: RenderableObject[]): RenderableObject[] {
    // Group by material
    const groups = new Map<string, RenderableObject[]>();

    for (const obj of objects) {
      const materialId = obj.materialId || 'default';
      let group = groups.get(materialId);
      if (!group) {
        group = [];
        groups.set(materialId, group);
      }
      group.push(obj);
    }

    // Sort each group back-to-front
    for (const group of groups.values()) {
      group.sort((a, b) => (b.depth || 0) - (a.depth || 0));
    }

    // Flatten groups
    const sorted: RenderableObject[] = [];
    for (const group of groups.values()) {
      sorted.push(...group);
    }

    return sorted;
  }

  // ==========================================================================
  // General Sorting
  // ==========================================================================

  /**
   * Sort objects by specified criteria
   *
   * @param objects - Objects to sort
   * @param criteria - Sort criteria
   * @param reverse - Whether to reverse sort order
   * @returns Sorted objects
   */
  sortBy(
    objects: RenderableObject[],
    criteria: SortCriteria,
    reverse: boolean = false,
  ): RenderableObject[] {
    const sorted = [...objects];

    switch (criteria) {
      case SortCriteria.Material:
        sorted.sort((a, b) => (a.materialId || '').localeCompare(b.materialId || ''));
        break;

      case SortCriteria.Depth:
        sorted.sort((a, b) => (a.depth || 0) - (b.depth || 0));
        break;

      case SortCriteria.Transparency:
        // Sort by whether material is transparent
        sorted.sort((a, b) => {
          const aTrans = this.isTransparent(a);
          const bTrans = this.isTransparent(b);
          if (aTrans !== bTrans) {
            return aTrans ? 1 : -1;
          }
          return 0;
        });
        break;

      case SortCriteria.Shader:
        sorted.sort((a, b) => {
          const aShader = (a.userData?.['shaderId'] || '') as string;
          const bShader = (b.userData?.['shaderId'] || '') as string;
          return aShader.localeCompare(bShader);
        });
        break;

      case SortCriteria.Custom:
        // No custom sort, return as-is
        break;
    }

    return reverse ? sorted.reverse() : sorted;
  }

  /**
   * Sort objects with custom comparator
   *
   * @param objects - Objects to sort
   * @param comparator - Custom comparison function
   * @returns Sorted objects
   */
  sortCustom(
    objects: RenderableObject[],
    comparator: (a: RenderableObject, b: RenderableObject) => number,
  ): RenderableObject[] {
    return [...objects].sort(comparator);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Separate objects into opaque and transparent
   *
   * @param objects - Objects to separate
   * @returns Object with opaque and transparent arrays
   */
  separateByTransparency(objects: RenderableObject[]): {
    opaque: RenderableObject[];
    transparent: RenderableObject[];
  } {
    const opaque: RenderableObject[] = [];
    const transparent: RenderableObject[] = [];

    for (const obj of objects) {
      if (this.isTransparent(obj)) {
        transparent.push(obj);
      } else {
        opaque.push(obj);
      }
    }

    return { opaque, transparent };
  }

  /**
   * Group objects by material
   *
   * @param objects - Objects to group
   * @returns Map of material ID to objects
   */
  groupByMaterial(objects: RenderableObject[]): Map<string, RenderableObject[]> {
    const groups = new Map<string, RenderableObject[]>();

    for (const obj of objects) {
      const materialId = obj.materialId || 'default';
      let group = groups.get(materialId);
      if (!group) {
        group = [];
        groups.set(materialId, group);
      }
      group.push(obj);
    }

    return groups;
  }

  /**
   * Generate sort key for an object
   *
   * @param obj - Object to generate key for
   * @param options - Sort options
   * @returns Numeric sort key
   */
  generateSortKey(obj: RenderableObject, options: SortKeyOptions): number {
    let key = 0;

    // Material priority (bits 0-15)
    const materialPriority = options.materialPriority ?? 0;
    const materialHash = this.hashString(obj.materialId || '');
    key |= (materialHash & 0xffff) << (materialPriority * 16);

    // Depth priority (bits 16-31)
    const depthPriority = options.depthPriority ?? 16;
    const depth = Math.floor((obj.depth || 0) * 100);
    key |= (depth & 0xffff) << depthPriority;

    // Transparency priority (bits 32-47)
    const transPriority = options.transparencyPriority ?? 32;
    const isTrans = this.isTransparent(obj) ? 1 : 0;
    key |= isTrans << transPriority;

    return key >>> 0; // Convert to unsigned
  }

  /**
   * Check if object is transparent
   *
   * @param obj - Object to check
   * @returns True if transparent
   */
  private isTransparent(obj: RenderableObject): boolean {
    // Check user data for transparency flag
    if (obj.userData?.['transparent'] !== undefined) {
      return obj.userData['transparent'] as boolean;
    }

    // Check material ID for transparency indicators
    const materialId = obj.materialId?.toLowerCase() || '';
    return (
      materialId.includes('transparent') ||
      materialId.includes('glass') ||
      materialId.includes('water')
    );
  }

  /**
   * Hash string to number
   *
   * @param str - String to hash
   * @returns Hash value
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // ==========================================================================
  // State Change Optimization
  // ==========================================================================

  /**
   * Sort to minimize state changes
   *
   * Analyzes objects and sorts to minimize rendering state changes
   * (pipeline changes, bind group changes, texture changes).
   *
   * @param objects - Objects to sort
   * @returns Sorted objects
   */
  sortForStateChanges(objects: RenderableObject[]): RenderableObject[] {
    return [...objects].sort((a, b) => {
      // Primary: material (affects pipeline and bind groups)
      if (a.materialId !== b.materialId) {
        return (a.materialId || '').localeCompare(b.materialId || '');
      }

      // Secondary: mesh (affects vertex buffers)
      if (a.meshId !== b.meshId) {
        return (a.meshId || '').localeCompare(b.meshId || '');
      }

      // Tertiary: depth (for Z-buffer efficiency)
      return (a.depth || 0) - (b.depth || 0);
    });
  }

  /**
   * Calculate state change statistics
   *
   * @param objects - Objects to analyze
   * @returns State change statistics
   */
  calculateStateChanges(objects: RenderableObject[]): {
    materialChanges: number;
    meshChanges: number;
    totalChanges: number;
  } {
    if (objects.length === 0) {
      return { materialChanges: 0, meshChanges: 0, totalChanges: 0 };
    }

    let materialChanges = 0;
    let meshChanges = 0;
    let lastMaterial = objects[0]!.materialId;
    let lastMesh = objects[0]!.meshId;

    for (let i = 1; i < objects.length; i++) {
      const obj = objects[i]!;
      if (obj.materialId !== lastMaterial) {
        materialChanges++;
        lastMaterial = obj.materialId;
      }
      if (obj.meshId !== lastMesh) {
        meshChanges++;
        lastMesh = obj.meshId;
      }
    }

    return {
      materialChanges,
      meshChanges,
      totalChanges: materialChanges + meshChanges,
    };
  }

  /**
   * Optimize rendering order
   *
   * Automatically determines the best sorting strategy based on
   * object properties and returns sorted objects.
   *
   * @param objects - Objects to optimize
   * @returns Optimized object order
   */
  optimizeRenderingOrder(objects: RenderableObject[]): RenderableObject[] {
    // Separate by transparency
    const { opaque, transparent } = this.separateByTransparency(objects);

    // Sort opaque for state changes
    const sortedOpaque = this.sortForStateChanges(opaque);

    // Sort transparent back-to-front
    const sortedTransparent = this.sortTransparent(transparent);

    // Combine (opaque first, then transparent)
    return [...sortedOpaque, ...sortedTransparent];
  }
}

// Types are already exported above with their definitions
