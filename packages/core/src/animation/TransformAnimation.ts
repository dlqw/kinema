/**
 * TransformAnimation - Generic transformation animation
 *
 * Animates between two transform states by interpolating
 * position, rotation, scale, and opacity.
 *
 * @module animation/TransformAnimation
 */

import type { Alpha, AnimationConfig, RenderObjectState, Transform } from '../types';
import { Animation } from './Animation';
import type { RenderObject } from '../core';

/**
 * TransformAnimation interpolates between two object states.
 *
 * This is a general-purpose animation that can animate any
 * combination of position, rotation, scale, and opacity.
 *
 * @example
 * ```typescript
 * const start = circle.getState();
 * const end = { ...start, transform: { ...start.transform, position: { x: 100, y: 100, z: 0 } } };
 * const anim = new TransformAnimation(circle, end, { duration: 2 });
 * ```
 */
export class TransformAnimation extends Animation {
  /**
   * Starting object state (captured at creation)
   */
  private readonly startState: RenderObjectState;

  /**
   * Creates a new TransformAnimation
   *
   * @param target - Target render object
   * @param endState - Target end state
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    private readonly endState: RenderObjectState,
    config: AnimationConfig = {},
  ) {
    super(target, config);
    this.startState = target.getState();
    Object.freeze(this.startState);
    Object.freeze(this.endState);
  }

  /**
   * Interpolate at the given alpha value
   *
   * @param alpha - Progress value [0, 1]
   * @returns Interpolated object state
   */
  protected interpolateAt(alpha: Alpha): RenderObject {
    const startTransform = this.startState.transform;
    const endTransform = this.endState.transform;

    const interpolated = this.interpolateTransform(startTransform, endTransform, alpha);

    return this.target.withTransform(interpolated);
  }

  /**
   * Interpolate between two transforms
   *
   * @param start - Starting transform
   * @param end - Ending transform
   * @param alpha - Progress value [0, 1]
   * @returns Interpolated transform
   */
  private interpolateTransform(
    start: Transform,
    end: Transform,
    alpha: number,
  ): Partial<Transform> {
    const lerp = (s: number, e: number): number => s + (e - s) * alpha;

    return {
      position: {
        x: lerp(start.position.x, end.position.x),
        y: lerp(start.position.y, end.position.y),
        z: lerp(start.position.z, end.position.z),
      },
      rotation: {
        x: lerp(start.rotation.x, end.rotation.x),
        y: lerp(start.rotation.y, end.rotation.y),
        z: lerp(start.rotation.z, end.rotation.z),
      },
      scale: {
        x: lerp(start.scale.x, end.scale.x),
        y: lerp(start.scale.y, end.scale.y),
        z: lerp(start.scale.z, end.scale.z),
      },
      opacity: lerp(start.opacity, end.opacity),
    };
  }

  /**
   * Create a transform animation to a specific position
   *
   * @param target - Target object
   * @param position - Target position
   * @param config - Animation configuration
   * @returns A new TransformAnimation
   */
  static toPosition(
    target: RenderObject,
    position: { x: number; y: number; z: number },
    config: AnimationConfig = {},
  ): TransformAnimation {
    const endState = {
      ...target.getState(),
      transform: {
        ...target.getState().transform,
        position,
      },
    };
    return new TransformAnimation(target, endState, config);
  }

  /**
   * Create a transform animation to a specific rotation
   *
   * @param target - Target object
   * @param rotation - Target rotation (degrees)
   * @param config - Animation configuration
   * @returns A new TransformAnimation
   */
  static toRotation(
    target: RenderObject,
    rotation: { x: number; y: number; z: number },
    config: AnimationConfig = {},
  ): TransformAnimation {
    const endState = {
      ...target.getState(),
      transform: {
        ...target.getState().transform,
        rotation,
      },
    };
    return new TransformAnimation(target, endState, config);
  }

  /**
   * Create a transform animation to a specific scale
   *
   * @param target - Target object
   * @param scale - Target scale
   * @param config - Animation configuration
   * @returns A new TransformAnimation
   */
  static toScale(
    target: RenderObject,
    scale: { x: number; y: number; z: number },
    config: AnimationConfig = {},
  ): TransformAnimation {
    const endState = {
      ...target.getState(),
      transform: {
        ...target.getState().transform,
        scale,
      },
    };
    return new TransformAnimation(target, endState, config);
  }

  /**
   * Create a transform animation to a specific opacity
   *
   * @param target - Target object
   * @param opacity - Target opacity [0, 1]
   * @param config - Animation configuration
   * @returns A new TransformAnimation
   */
  static toOpacity(
    target: RenderObject,
    opacity: number,
    config: AnimationConfig = {},
  ): TransformAnimation {
    const endState = {
      ...target.getState(),
      transform: {
        ...target.getState().transform,
        opacity: Math.max(0, Math.min(1, opacity)),
      },
    };
    return new TransformAnimation(target, endState, config);
  }
}

/**
 * Default export
 */
export default TransformAnimation;
