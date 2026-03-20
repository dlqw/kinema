/**
 * Animation - Base class for all animations
 *
 * This abstract class defines the interface and common functionality
 * for all animations that transition between object states over time.
 *
 * @module animation/Animation
 */

import type {
  Alpha,
  EasingFunction,
  AnimationConfig,
  InterpolationResult
} from '../types';
import type { RenderObject } from '../core';

/**
 * Default animation configuration
 */
const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 1.0,
  easing: (alpha: Alpha) => alpha, // linear
  delay: 0,
  removeOnComplete: false
};

/**
 * Abstract base class for all animations.
 *
 * Animations represent transitions between states over time.
 * They use easing functions to control the interpolation curve.
 *
 * @template T The type of render object this animation operates on
 *
 * @example
 * ```typescript
 * class CustomAnimation extends Animation<MyObject> {
 *   protected interpolateAt(alpha: Alpha): MyObject {
 *     // Return object state at given alpha [0, 1]
 *   }
 * }
 * ```
 */
export abstract class Animation<T extends RenderObject = RenderObject> {
  /**
   * Creates a new Animation instance
   *
   * @param target - The target render object to animate
   * @param config - Animation configuration
   */
  constructor(
    public readonly target: T,
    protected readonly config: AnimationConfig
  ) {
    Object.freeze(config);
  }

  /**
   * Get the animation configuration
   */
  get config(): Readonly<AnimationConfig> {
    return this.config;
  }

  /**
   * Get the animation duration in seconds
   */
  get duration(): number {
    return this.config.duration;
  }

  /**
   * Get the delay before animation starts
   */
  get delay(): number {
    return this.config.delay ?? 0;
  }

  /**
   * Check if this animation removes the target on completion
   */
  get removeOnComplete(): boolean {
    return this.config.removeOnComplete ?? false;
  }

  /**
   * Get the animation name for debugging
   */
  get name(): string {
    return this.config.name ?? this.constructor.name;
  }

  /**
   * Get the total duration including delay
   *
   * @returns Total duration in seconds
   */
  getTotalDuration(): number {
    return (this.config.delay ?? 0) + this.config.duration;
  }

  /**
   * Interpolate at the given elapsed time
   *
   * This method handles delay, applies easing, and delegates to
   * interpolateAt for the actual interpolation logic.
   *
   * @param elapsedTime - Time in seconds since animation start
   * @returns Interpolation result with object state and completion flag
   */
  interpolate(elapsedTime: number): InterpolationResult<T> {
    const delay = this.config.delay ?? 0;

    // During delay, return original object
    if (elapsedTime < delay) {
      return { object: this.target, complete: false };
    }

    // Calculate progress
    const progress = Math.min(
      (elapsedTime - delay) / this.config.duration,
      1
    ) as Alpha;

    // Apply easing function
    const easedAlpha = this.config.easing(progress);

    // Perform interpolation
    const result = this.interpolateAt(easedAlpha);

    return {
      object: result,
      complete: progress >= 1
    };
  }

  /**
   * Interpolate at the given alpha value [0, 1]
   *
   * Subclasses must implement this method to define the actual
   * interpolation logic.
   *
   * @param alpha - Eased progress value [0, 1]
   * @returns The interpolated object state
   */
  protected abstract interpolateAt(alpha: Alpha): T;

  /**
   * Create a builder for fluent animation construction
   *
   * @param target - The target object to animate
   * @param config - Optional configuration overrides
   * @returns An animation builder
   */
  static builder<T extends Animation>(
    this: new (...args: any[]) => T,
    target: RenderObject,
    config: Partial<AnimationConfig> = {}
  ): AnimationBuilder<T> {
    return new AnimationBuilder(this, target, config);
  }

  /**
   * Get a string representation
   */
  toString(): string {
    return `${this.name}(target="${this.target.id}", duration=${this.config.duration}s)`;
  }
}

/**
 * Animation builder for fluent API
 *
 * @template T The animation type to build
 */
export class AnimationBuilder<T extends Animation> {
  constructor(
    private readonly AnimationClass: new (...args: any[]) => T,
    private readonly target: RenderObject,
    private readonly config: Partial<AnimationConfig>
  ) {}

  /**
   * Set the animation duration
   *
   * @param seconds - Duration in seconds
   * @returns A new builder with updated duration
   */
  withDuration(seconds: number): AnimationBuilder<T> {
    return new AnimationBuilder(
      this.AnimationClass,
      this.target,
      { ...this.config, duration: seconds }
    );
  }

  /**
   * Set the easing function
   *
   * @param easing - Easing function to use
   * @returns A new builder with updated easing
   */
  withEasing(easing: EasingFunction): AnimationBuilder<T> {
    return new AnimationBuilder(
      this.AnimationClass,
      this.target,
      { ...this.config, easing }
    );
  }

  /**
   * Set the delay before animation starts
   *
   * @param seconds - Delay in seconds
   * @returns A new builder with updated delay
   */
  withDelay(seconds: number): AnimationBuilder<T> {
    return new AnimationBuilder(
      this.AnimationClass,
      this.target,
      { ...this.config, delay: seconds }
    );
  }

  /**
   * Set whether to remove the target on completion
   *
   * @param value - Whether to remove on complete (default: true)
   * @returns A new builder with updated remove flag
   */
  removeOnComplete(value: boolean = true): AnimationBuilder<T> {
    return new AnimationBuilder(
      this.AnimationClass,
      this.target,
      { ...this.config, removeOnComplete: value }
    );
  }

  /**
   * Set the animation name
   *
   * @param name - Animation name for debugging
   * @returns A new builder with updated name
   */
  withName(name: string): AnimationBuilder<T> {
    return new AnimationBuilder(
      this.AnimationClass,
      this.target,
      { ...this.config, name }
    );
  }

  /**
   * Build the animation instance
   *
   * @returns A new animation instance with current configuration
   */
  build(): T {
    const fullConfig: AnimationConfig = {
      ...DEFAULT_ANIMATION_CONFIG,
      ...this.config
    };

    return new this.AnimationClass(this.target as any, fullConfig);
  }
}

/**
 * Helper function to create animation config with defaults
 *
 * @param config - Partial configuration
 * @returns Complete animation configuration
 */
export function createAnimationConfig(
  config: Partial<AnimationConfig> = {}
): AnimationConfig {
  return {
    ...DEFAULT_ANIMATION_CONFIG,
    ...config
  };
}

/**
 * Default export
 */
export default Animation;
