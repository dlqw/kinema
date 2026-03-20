/**
 * RotateAnimation - Rotation animation
 *
 * Animates the rotation of an object around a specified axis.
 *
 * @module animation/RotateAnimation
 */

import type { Alpha, AnimationConfig, Point3D } from '../types';
import { Animation } from './Animation';
import type { RenderObject } from '../core';

/**
 * RotateAnimation rotates an object around a specified axis.
 *
 * @example
 * ```typescript
 * // Rotate 360 degrees around Z axis
 * const rotate = new RotateAnimation(circle, 'z', 360, { duration: 2 });
 *
 * // Rotate 180 degrees around Y axis
 * const rotateY = RotateAnimation.create(rectangle, 'y', 180, 1);
 * ```
 */
export class RotateAnimation extends Animation {
  /**
   * Creates a new RotateAnimation
   *
   * @param target - Target render object
   * @param axis - Axis to rotate around ('x', 'y', or 'z')
   * @param degrees - Total rotation in degrees
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    private readonly axis: 'x' | 'y' | 'z',
    private readonly degrees: number,
    config: AnimationConfig = {}
  ) {
    super(target, config);
  }

  /**
   * Interpolate rotation
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated rotation
   */
  protected interpolateAt(alpha: Alpha): RenderObject {
    const currentRotation = this.target.getState().rotation;
    const newRotation = { ...currentRotation };
    newRotation[this.axis] += this.degrees * alpha;
    return this.target.withTransform({ rotation: newRotation });
  }

  /**
   * Create a rotate animation
   *
   * @param target - Target object
   * @param axis - Axis to rotate around
   * @param degrees - Total rotation in degrees
   * @param duration - Animation duration in seconds
   * @returns A new RotateAnimation
   */
  static create(
    target: RenderObject,
    axis: 'x' | 'y' | 'z',
    degrees: number,
    duration: number = 1
  ): RotateAnimation {
    return new RotateAnimation(target, axis, degrees, { duration });
  }
}

/**
 * Rotate to animation - rotates to a specific angle
 *
 * @example
 * ```typescript
 * // Rotate to 90 degrees around Z axis
 * const rotateTo = new RotateToAnimation(circle, 'z', 90, { duration: 1 });
 * ```
 */
export class RotateToAnimation extends Animation {
  private readonly startRotation: Point3D;

  /**
   * Creates a new RotateToAnimation
   *
   * @param target - Target render object
   * @param axis - Axis to rotate around
   * @param targetDegrees - Target angle in degrees
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    private readonly axis: 'x' | 'y' | 'z',
    private readonly targetDegrees: number,
    config: AnimationConfig = {}
  ) {
    super(target, config);
    this.startRotation = target.getState().rotation;
  }

  /**
   * Interpolate rotation to target
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated rotation
   */
  protected interpolateAt(alpha: Alpha): RenderObject {
    const startAngle = this.startRotation[this.axis];
    const angle = startAngle + (this.targetDegrees - startAngle) * alpha;

    const newRotation = { ...this.target.getState().rotation };
    newRotation[this.axis] = angle;

    return this.target.withTransform({ rotation: newRotation });
  }

  /**
   * Create a rotate to animation
   *
   * @param target - Target object
   * @param axis - Axis to rotate around
   * @param targetDegrees - Target angle in degrees
   * @param duration - Animation duration in seconds
   * @returns A new RotateToAnimation
   */
  static create(
    target: RenderObject,
    axis: 'x' | 'y' | 'z',
    targetDegrees: number,
    duration: number = 1
  ): RotateToAnimation {
    return new RotateToAnimation(target, axis, targetDegrees, { duration });
  }
}

/**
 * Multi-axis rotate animation
 *
 * Rotates around multiple axes simultaneously.
 *
 * @example
 * ```typescript
 * const multiRotate = new MultiRotateAnimation(
 *   cube,
 *   { x: 90, y: 180, z: 45 },
 *   { duration: 2 }
 * );
 * ```
 */
export class MultiRotateAnimation extends Animation {
  private readonly startRotation: Point3D;

  /**
   * Creates a new MultiRotateAnimation
   *
   * @param target - Target render object
   * @param degrees - Rotation degrees for each axis
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    private readonly degrees: Partial<Point3D>,
    config: AnimationConfig = {}
  ) {
    super(target, config);
    this.startRotation = target.getState().rotation;
  }

  /**
   * Interpolate multi-axis rotation
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated rotation
   */
  protected interpolateAt(alpha: Alpha): RenderObject {
    const lerp = (start: number, end: number | undefined): number => {
      if (end === undefined) return start;
      return start + (end - start) * alpha;
    };

    return this.target.withTransform({
      rotation: {
        x: lerp(this.startRotation.x, this.degrees.x),
        y: lerp(this.startRotation.y, this.degrees.y),
        z: lerp(this.startRotation.z, this.degrees.z)
      }
    });
  }

  /**
   * Create a multi-axis rotate animation
   *
   * @param target - Target object
   * @param degrees - Rotation degrees for each axis
   * @param duration - Animation duration in seconds
   * @returns A new MultiRotateAnimation
   */
  static create(
    target: RenderObject,
    degrees: Partial<Point3D>,
    duration: number = 1
  ): MultiRotateAnimation {
    return new MultiRotateAnimation(target, degrees, { duration });
  }
}

// Default export
export default RotateAnimation;
