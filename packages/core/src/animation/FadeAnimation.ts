/**
 * FadeAnimation - Fade in and fade out animations
 *
 * Animates the opacity of an object from 0 to 1 (fade in)
 * or from 1 to 0 (fade out).
 *
 * @module animation/FadeAnimation
 */

import type { Alpha, AnimationConfig } from '../types';
import { Animation } from './Animation';
import type { RenderObject } from '../core';

/**
 * Fade in animation - opacity from 0 to 1
 *
 * Animates an object's opacity from transparent to fully opaque.
 *
 * @example
 * ```typescript
 * const fadeIn = new FadeInAnimation(circle, { duration: 1 });
 * const fadeInSlow = FadeInAnimation.create(circle, 2);
 * ```
 */
export class FadeInAnimation extends Animation {
  /**
   * Creates a new FadeInAnimation
   *
   * @param target - Target render object
   * @param config - Animation configuration
   */
  constructor(target: RenderObject, config: AnimationConfig = {}) {
    super(target, config);
  }

  /**
   * Interpolate opacity from 0 to current or 1
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated opacity
   */
  protected override interpolateAt(alpha: Alpha): RenderObject {
    return this.target.withOpacity(alpha);
  }

  /**
   * Create a fade in animation
   *
   * @param target - Target object
   * @param duration - Animation duration in seconds
   * @returns A new FadeInAnimation
   */
  static create(target: RenderObject, duration: number = 1): FadeInAnimation {
    return new FadeInAnimation(target, { duration });
  }
}

/**
 * Fade out animation - opacity from current or 1 to 0
 *
 * Animates an object's opacity from fully opaque to transparent.
 *
 * @example
 * ```typescript
 * const fadeOut = new FadeOutAnimation(circle, { duration: 1 });
 * const fadeOutSlow = FadeOutAnimation.create(circle, 2);
 * ```
 */
export class FadeOutAnimation extends Animation {
  /**
   * Creates a new FadeOutAnimation
   *
   * @param target - Target render object
   * @param config - Animation configuration
   */
  constructor(target: RenderObject, config: AnimationConfig = {}) {
    super(target, { ...config, removeOnComplete: config.removeOnComplete ?? true });
  }

  /**
   * Interpolate opacity from 1 to 0
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated opacity
   */
  protected override interpolateAt(alpha: Alpha): RenderObject {
    return this.target.withOpacity(1 - alpha);
  }

  /**
   * Create a fade out animation
   *
   * @param target - Target object
   * @param duration - Animation duration in seconds
   * @param removeOnComplete - Whether to remove object after fade (default: true)
   * @returns A new FadeOutAnimation
   */
  static create(
    target: RenderObject,
    duration: number = 1,
    removeOnComplete: boolean = true,
  ): FadeOutAnimation {
    return new FadeOutAnimation(target, { duration, removeOnComplete });
  }
}

/**
 * Fade to animation - opacity from current to specific value
 *
 * Animates an object's opacity to a specific value.
 *
 * @example
 * ```typescript
 * const fadeToHalf = new FadeToAnimation(circle, 0.5, { duration: 1 });
 * const fadeToQuarter = FadeToAnimation.create(circle, 0.25, 2);
 * ```
 */
export class FadeToAnimation extends Animation {
  private readonly startOpacity: number;

  /**
   * Creates a new FadeToAnimation
   *
   * @param target - Target render object
   * @param targetOpacity - Target opacity value [0, 1]
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    private readonly targetOpacity: number,
    config: AnimationConfig = {},
  ) {
    super(target, config);
    this.startOpacity = target.getState().transform.opacity;
  }

  /**
   * Interpolate opacity from start to target
   *
   * @param alpha - Progress value [0, 1]
   * @returns Object with interpolated opacity
   */
  protected override interpolateAt(alpha: Alpha): RenderObject {
    const opacity = this.startOpacity + (this.targetOpacity - this.startOpacity) * alpha;
    return this.target.withOpacity(opacity);
  }

  /**
   * Create a fade to animation
   *
   * @param target - Target object
   * @param targetOpacity - Target opacity [0, 1]
   * @param duration - Animation duration in seconds
   * @returns A new FadeToAnimation
   */
  static create(
    target: RenderObject,
    targetOpacity: number,
    duration: number = 1,
  ): FadeToAnimation {
    return new FadeToAnimation(target, targetOpacity, { duration });
  }
}

/**
 * Default export
 */
export default FadeInAnimation;
