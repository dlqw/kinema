/**
 * MoveAnimation - Movement animation
 *
 * Animates the position of an object by translating it.
 *
 * @module animation/MoveAnimation
 */

import type { Alpha, AnimationConfig, Point3D } from '../types';
import { Animation } from './Animation';
import type { RenderObject } from '../core';

/**
 * MoveAnimation translates an object by a delta vector.
 *
 * @example
 * ```typescript
 * // Move 100 pixels to the right
 * const moveRight = new MoveAnimation(circle, { x: 100, y: 0, z: 0 }, { duration: 1 });
 *
 * // Move diagonally
 * const moveDiagonal = MoveAnimation.create(rectangle, { x: 50, y: 50, z: 0 }, 2);
 * ```
 */
export class MoveAnimation extends Animation {
  /**
   * Creates a new MoveAnimation
   *
   * @param target - Target render object
   * @param delta - Movement delta vector
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    private readonly delta: Point3D,
    config: AnimationConfig = {}
  ) {
    super(target, config);
  }

  /**
   * Interpolate position by delta
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated position
   */
  protected interpolateAt(alpha: Alpha): RenderObject {
    const current = this.target.getState().position;
    return this.target.withPosition(
      current.x + this.delta.x * alpha,
      current.y + this.delta.y * alpha,
      current.z + this.delta.z * alpha
    );
  }

  /**
   * Create a move animation
   *
   * @param target - Target object
   * @param delta - Movement delta vector
   * @param duration - Animation duration in seconds
   * @returns A new MoveAnimation
   */
  static create(
    target: RenderObject,
    delta: Point3D,
    duration: number = 1
  ): MoveAnimation {
    return new MoveAnimation(target, delta, { duration });
  }

  /**
   * Create a horizontal move animation
   *
   * @param target - Target object
   * @param deltaX - Horizontal movement
   * @param duration - Animation duration in seconds
   * @returns A new MoveAnimation
   */
  static horizontal(
    target: RenderObject,
    deltaX: number,
    duration: number = 1
  ): MoveAnimation {
    return new MoveAnimation(target, { x: deltaX, y: 0, z: 0 }, { duration });
  }

  /**
   * Create a vertical move animation
   *
   * @param target - Target object
   * @param deltaY - Vertical movement
   * @param duration - Animation duration in seconds
   * @returns A new MoveAnimation
   */
  static vertical(
    target: RenderObject,
    deltaY: number,
    duration: number = 1
  ): MoveAnimation {
    return new MoveAnimation(target, { x: 0, y: deltaY, z: 0 }, { duration });
  }
}

/**
 * MoveToAnimation moves an object to a specific position
 *
 * @example
 * ```typescript
 * // Move to a specific position
 * const moveTo = new MoveToAnimation(circle, { x: 100, y: 100, z: 0 }, { duration: 1 });
 *
 * // Move to center
 * const moveToCenter = MoveToAnimation.create(rectangle, { x: 0, y: 0, z: 0 }, 2);
 * ```
 */
export class MoveToAnimation extends Animation {
  private readonly startPosition: Point3D;

  /**
   * Creates a new MoveToAnimation
   *
   * @param target - Target render object
   * @param targetPosition - Target position
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    private readonly targetPosition: Point3D,
    config: AnimationConfig = {}
  ) {
    super(target, config);
    this.startPosition = target.getState().position;
  }

  /**
   * Interpolate position to target
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated position
   */
  protected interpolateAt(alpha: Alpha): RenderObject {
    const lerp = (start: number, end: number): number =>
      start + (end - start) * alpha;

    return this.target.withPosition(
      lerp(this.startPosition.x, this.targetPosition.x),
      lerp(this.startPosition.y, this.targetPosition.y),
      lerp(this.startPosition.z, this.targetPosition.z)
    );
  }

  /**
   * Create a move to animation
   *
   * @param target - Target object
   * @param targetPosition - Target position
   * @param duration - Animation duration in seconds
   * @returns A new MoveToAnimation
   */
  static create(
    target: RenderObject,
    targetPosition: Point3D,
    duration: number = 1
  ): MoveToAnimation {
    return new MoveToAnimation(target, targetPosition, { duration });
  }

  /**
   * Create a move to center animation
   *
   * @param target - Target object
   * @param duration - Animation duration in seconds
   * @returns A new MoveToAnimation to origin
   */
  static toCenter(
    target: RenderObject,
    duration: number = 1
  ): MoveToAnimation {
    return MoveToAnimation.create(target, { x: 0, y: 0, z: 0 }, duration);
  }
}

/**
 * PathAnimation moves an object along a path of points
 *
 * @example
 * ```typescript
 * const path = [
 *   { x: 0, y: 0, z: 0 },
 *   { x: 100, y: 0, z: 0 },
 *   { x: 100, y: 100, z: 0 },
 *   { x: 0, y: 100, z: 0 }
 * ];
 * const pathAnim = new PathAnimation(circle, path, { duration: 4 });
 * ```
 */
export class PathAnimation extends Animation {
  private readonly startPosition: Point3D;

  /**
   * Creates a new PathAnimation
   *
   * @param target - Target render object
   * @param path - Array of points defining the path
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    private readonly path: ReadonlyArray<Point3D>,
    config: AnimationConfig = {}
  ) {
    super(target, config);
    this.startPosition = target.getState().position;

    if (path.length === 0) {
      throw new Error('Path must contain at least one point');
    }
  }

  /**
   * Interpolate position along path
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated position
   */
  protected interpolateAt(alpha: Alpha): RenderObject {
    if (this.path.length === 1) {
      const point = this.path[0];
      return this.target.withPosition(point.x, point.y, point.z);
    }

    // Calculate which segment we're in
    const segmentProgress = alpha * (this.path.length - 1);
    const segmentIndex = Math.floor(segmentProgress);
    const segmentAlpha = segmentProgress - segmentIndex;

    // Get segment endpoints
    const start = segmentIndex === 0
      ? this.startPosition
      : this.path[segmentIndex - 1];
    const end = this.path[segmentIndex];

    // Interpolate within segment
    const lerp = (s: number, e: number): number => s + (e - s) * segmentAlpha;

    return this.target.withPosition(
      lerp(start.x, end.x),
      lerp(start.y, end.y),
      lerp(start.z, end.z)
    );
  }

  /**
   * Create a path animation
   *
   * @param target - Target object
   * @param path - Array of points defining the path
   * @param duration - Animation duration in seconds
   * @returns A new PathAnimation
   */
  static create(
    target: RenderObject,
    path: ReadonlyArray<Point3D>,
    duration: number = 1
  ): PathAnimation {
    return new PathAnimation(target, path, { duration });
  }

  /**
   * Create a circular path animation
   *
   * @param target - Target object
   * @param radius - Circle radius
   * @param center - Circle center
   * @param segments - Number of segments in path
   * @param duration - Animation duration in seconds
   * @returns A new PathAnimation along a circular path
   */
  static circular(
    target: RenderObject,
    radius: number,
    center: Point3D = { x: 0, y: 0, z: 0 },
    segments: number = 16,
    duration: number = 2
  ): PathAnimation {
    const path: Point3D[] = [];

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      path.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        z: center.z
      });
    }

    return PathAnimation.create(target, path, duration);
  }
}

// Default export
export default MoveAnimation;
