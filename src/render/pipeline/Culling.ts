/**
 * AniMaker Rendering Engine - Frustum Culling
 *
 * This module provides frustum and occlusion culling functionality
 * to optimize rendering by skipping objects that are not visible.
 *
 * @module pipeline
 */

import type { RenderableObject } from './RenderQueue';

/**
 * Camera interface
 */
export interface Camera {
  /** Camera position */
  position: [number, number, number];
  /** View matrix */
  viewMatrix: Float32Array;
  /** Projection matrix */
  projectionMatrix: Float32Array;
  /** View-projection matrix */
  viewProjectionMatrix: Float32Array;
  /** Near plane distance */
  near: number;
  /** Far plane distance */
  far: number;
  /** Field of view (radians) */
  fov?: number;
  /** Aspect ratio */
  aspect?: number;
  /** Orthographic size (if orthographic) */
  orthoSize?: number;
  /** Whether camera is orthographic */
  isOrthographic?: boolean;
}

/**
 * Bounding sphere
 */
export interface BoundingSphere {
  /** Sphere center */
  center: [number, number, number];
  /** Sphere radius */
  radius: number;
}

/**
 * Bounding box (AABB)
 */
export interface BoundingBox {
  /** Minimum corner */
  min: [number, number, number];
  /** Maximum corner */
  max: [number, number, number];
}

/**
 * Frustum planes
 */
interface FrustumPlanes {
  left: [number, number, number, number];
  right: [number, number, number, number];
  top: [number, number, number, number];
  bottom: [number, number, number, number];
  near: [number, number, number, number];
  far: [number, number, number, number];
}

/**
 * Culling result
 */
export interface CullingResult {
  /** Number of objects tested */
  tested: number;
  /** Number of objects culled */
  culled: number;
  /** Number of objects visible */
  visible: number;
  /** Culling time in milliseconds */
  time: number;
}

/**
 * Frustum Culler
 *
 * Performs frustum culling on renderable objects.
 *
 * @example
 * ```typescript
 * const culler = new FrustumCuller();
 *
 * // Update frustum from camera
 * culler.updateFromCamera(camera);
 *
 * // Test objects
 * const result = culler.cull(objects);
 * console.log(`Culled: ${result.culled}/${result.tested}`);
 * ```
 */
export class FrustumCuller {
  private frustumPlanes: FrustumPlanes | null = null;
  private lastCameraHash: number = 0;

  // ==========================================================================
  // Culling Methods
  // ==========================================================================

  /**
   * Update frustum planes from camera
   *
   * @param camera - Camera to extract frustum from
   */
  updateFromCamera(camera: Camera): void {
    // Calculate camera hash to detect changes
    const cameraHash = this.hashCamera(camera);
    if (cameraHash === this.lastCameraHash && this.frustumPlanes) {
      return; // Frustum hasn't changed
    }

    this.lastCameraHash = cameraHash;
    this.frustumPlanes = this.extractPlanes(camera);
  }

  /**
   * Cull objects against frustum
   *
   * @param objects - Objects to test
   * @returns Array of visible objects
   */
  cull(objects: RenderableObject[]): RenderableObject[] {
    if (!this.frustumPlanes) {
      return objects; // No frustum, return all
    }

    const visible: RenderableObject[] = [];

    for (const obj of objects) {
      if (!obj.bounds || !obj.visible) {
        if (obj.visible) {
          visible.push(obj);
        }
        continue;
      }

      if (this.testSphere(obj.bounds)) {
        visible.push(obj);
      }
    }

    return visible;
  }

  /**
   * Cull objects with detailed results
   *
   * @param objects - Objects to test
   * @returns Culling result and visible objects
   */
  cullWithResult(objects: RenderableObject[]): {
    result: CullingResult;
    visible: RenderableObject[];
  } {
    const startTime = performance.now();

    if (!this.frustumPlanes) {
      return {
        result: {
          tested: objects.length,
          culled: 0,
          visible: objects.length,
          time: performance.now() - startTime,
        },
        visible: objects,
      };
    }

    let tested = 0;
    let culled = 0;
    const visible: RenderableObject[] = [];

    for (const obj of objects) {
      if (!obj.visible) {
        continue;
      }

      tested++;

      if (!obj.bounds || this.testSphere(obj.bounds)) {
        visible.push(obj);
      } else {
        culled++;
      }
    }

    return {
      result: {
        tested,
        culled,
        visible: visible.length,
        time: performance.now() - startTime,
      },
      visible,
    };
  }

  // ==========================================================================
  // Test Methods
  // ==========================================================================

  /**
   * Test bounding sphere against frustum
   *
   * @param sphere - Bounding sphere to test
   * @returns True if sphere intersects frustum
   */
  testSphere(sphere: BoundingSphere): boolean {
    if (!this.frustumPlanes) {
      return true;
    }

    const { center, radius } = sphere;
    const planes = this.frustumPlanes;

    // Test against each plane
    for (const planeName of Object.keys(planes) as Array<keyof FrustumPlanes>) {
      const plane = planes[planeName];
      const distance = this.distanceToPlane(center, plane);

      if (distance < -radius) {
        // Sphere is completely outside this plane
        return false;
      }
    }

    return true;
  }

  /**
   * Test bounding box against frustum
   *
   * @param box - Bounding box to test
   * @returns True if box intersects frustum
   */
  testBox(box: BoundingBox): boolean {
    if (!this.frustumPlanes) {
      return true;
    }

    const { min, max } = box;
    const planes = this.frustumPlanes;

    // Test each corner of the box against each plane
    for (const planeName of Object.keys(planes) as Array<keyof FrustumPlanes>) {
      const plane = planes[planeName];

      // Find the corner most likely to be outside
      const corner = this.getNegativeCorner(min, max, plane);

      if (this.distanceToPlane(corner, plane) < 0) {
        return false;
      }
    }

    return true;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Extract frustum planes from camera matrices
   *
   * @param camera - Camera
   * @returns Frustum planes
   */
  private extractPlanes(camera: Camera): FrustumPlanes {
    const vp = camera.viewProjectionMatrix;

    // Extract planes from view-projection matrix
    // Each plane is (a, b, c, d) where ax + by + cz + d = 0
    const planes: FrustumPlanes = {
      // Left plane: column 4 + column 1
      left: [
        vp[3] + vp[0],
        vp[7] + vp[4],
        vp[11] + vp[8],
        vp[15] + vp[12],
      ],
      // Right plane: column 4 - column 1
      right: [
        vp[3] - vp[0],
        vp[7] - vp[4],
        vp[11] - vp[8],
        vp[15] - vp[12],
      ],
      // Bottom plane: column 4 + column 2
      bottom: [
        vp[3] + vp[1],
        vp[7] + vp[5],
        vp[11] + vp[9],
        vp[15] + vp[13],
      ],
      // Top plane: column 4 - column 2
      top: [
        vp[3] - vp[1],
        vp[7] - vp[5],
        vp[11] - vp[9],
        vp[15] - vp[13],
      ],
      // Near plane: column 4 + column 3
      near: [
        vp[3] + vp[2],
        vp[7] + vp[6],
        vp[11] + vp[10],
        vp[15] + vp[14],
      ],
      // Far plane: column 4 - column 3
      far: [
        vp[3] - vp[2],
        vp[7] - vp[6],
        vp[11] - vp[10],
        vp[15] - vp[14],
      ],
    };

    // Normalize planes
    for (const planeName of Object.keys(planes) as Array<keyof FrustumPlanes>) {
      const plane = planes[planeName];
      const length = Math.sqrt(plane[0] ** 2 + plane[1] ** 2 + plane[2] ** 2);
      planes[planeName] = [
        plane[0] / length,
        plane[1] / length,
        plane[2] / length,
        plane[3] / length,
      ];
    }

    return planes;
  }

  /**
   * Calculate distance from point to plane
   *
   * @param point - 3D point
   * @param plane - Plane (a, b, c, d)
   * @returns Signed distance
   */
  private distanceToPlane(
    point: [number, number, number],
    plane: [number, number, number, number]
  ): number {
    return (
      plane[0] * point[0] + plane[1] * point[1] + plane[2] * point[2] + plane[3]
    );
  }

  /**
   * Get corner of bounding box most likely to be outside
   *
   * @param min - Minimum corner
   * @param max - Maximum corner
   * @param plane - Plane to test against
   * @returns Corner coordinates
   */
  private getNegativeCorner(
    min: [number, number, number],
    max: [number, number, number],
    plane: [number, number, number, number]
  ): [number, number, number] {
    return [
      plane[0] >= 0 ? max[0] : min[0],
      plane[1] >= 0 ? max[1] : min[1],
      plane[2] >= 0 ? max[2] : min[2],
    ];
  }

  /**
   * Calculate hash of camera state
   *
   * @param camera - Camera
   * @returns Hash value
   */
  private hashCamera(camera: Camera): number {
    // Simple hash of camera position
    const pos = camera.position;
    return (
      Math.floor(pos[0] * 100) ^
      Math.floor(pos[1] * 100) ^
      Math.floor(pos[2] * 100)
    );
  }
}

/**
 * Occlusion Culler
 *
 * Performs occlusion culling using GPU queries or software approximation.
 *
 * @example
 * ```typescript
 * const culler = new OcclusionCuller();
 *
 * // Software occlusion culling (simplified)
 * const result = culler.cullSoftware(objects, camera);
 * ```
 */
export class OcclusionCuller {
  private hardwareOcclusionSupported: boolean = false;

  constructor() {
    // Detect hardware occlusion query support
    this.hardwareOcclusionSupported = this.detectOcclusionSupport();
  }

  /**
   * Cull objects using software occlusion approximation
   *
   * @param objects - Objects to test
   * @param camera - Camera
   * @returns Visible objects
   */
  cullSoftware(objects: RenderableObject[], camera: Camera): RenderableObject[] {
    // Simplified software occlusion culling
    // Sort objects by depth (far to near)
    const sorted = [...objects].sort((a, b) => (b.depth || 0) - (a.depth || 0));

    const visible: RenderableObject[] = [];
    const occluders: BoundingBox[] = [];

    for (const obj of sorted) {
      if (!obj.bounds || !obj.visible) {
        if (obj.visible) {
          visible.push(obj);
        }
        continue;
      }

      // Check if occluded by any previous object
      if (this.isOccluded(obj.bounds, occluders)) {
        continue;
      }

      visible.push(obj);

      // Large objects become occluders
      if (this.isLargeObject(obj)) {
        occluders.push.getBounds?.() || this.boundsFromSphere(obj.bounds));
      }
    }

    return visible;
  }

  /**
   * Check if bounding sphere is occluded
   *
   * @param bounds - Bounding sphere
   * @param occluders - List of occluder bounding boxes
   * @returns True if occluded
   */
  private isOccluded(
    bounds: BoundingSphere,
    occluders: BoundingBox[]
  ): boolean {
    // Simplified occlusion test
    // TODO: Implement proper occlusion testing
    return false;
  }

  /**
   * Check if object is large enough to be an occluder
   *
   * @param obj - Object to test
   * @returns True if large
   */
  private isLargeObject(obj: RenderableObject): boolean {
    if (!obj.bounds) {
      return false;
    }
    // Objects with radius > 10 units are considered large
    return obj.bounds.radius > 10;
  }

  /**
   * Convert bounding sphere to bounding box
   *
   * @param sphere - Bounding sphere
   * @returns Bounding box
   */
  private boundsFromSphere(sphere: BoundingSphere): BoundingBox {
    const { center, radius } = sphere;
    return {
      min: [
        center[0] - radius,
        center[1] - radius,
        center[2] - radius,
      ],
      max: [
        center[0] + radius,
        center[1] + radius,
        center[2] + radius,
      ],
    };
  }

  /**
   * Detect hardware occlusion query support
   *
   * @returns True if supported
   */
  private detectOcclusionSupport(): boolean {
    // Check if WebGPU or WebGL2 supports occlusion queries
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      // WebGPU: check for occlusion-query feature
      return true; // Simplified
    }
    // WebGL2: check for EXT_occlusion_query_boolean extension
    return false;
  }
}

// Re-export types
export type { Camera, BoundingSphere, BoundingBox, CullingResult };
