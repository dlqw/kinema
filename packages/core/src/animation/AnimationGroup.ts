/**
 * AnimationGroup - Animation composition and orchestration
 *
 * Combines multiple animations with different timing behaviors:
 * parallel, sequential, and lagged execution.
 *
 * @module animation/AnimationGroup
 */

import type { Alpha, AnimationConfig, CompositionType } from '../types';
import { Animation } from './Animation';
import type { RenderObject } from '../core';

/**
 * AnimationGroup combines multiple animations.
 *
 * Supports three composition types:
 * - Parallel: All animations run simultaneously
 * - Sequence: Animations run one after another
 * - Lagged: Animations start with staggered delays
 *
 * @example
 * ```typescript
 * // Parallel animations
 * const parallel = new AnimationGroup(
 *   target,
 *   [fadeIn, rotate],
 *   CompositionType.Parallel
 * );
 *
 * // Sequential animations
 * const sequence = AnimationGroup.sequence(target, [move, fadeOut]);
 *
 * // Lagged animations
 * const lagged = AnimationGroup.lagged(target, [anim1, anim2, anim3], 0.2);
 * ```
 */
export class AnimationGroup extends Animation {
  private readonly animations: ReadonlyArray<Animation>;

  /**
   * Creates a new AnimationGroup
   *
   * @param target - Target render object (primary target)
   * @param animations - Array of animations to combine
   * @param compositionType - How to compose the animations
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    animations: ReadonlyArray<Animation>,
    compositionType: CompositionType = 'parallel' as CompositionType,
    config: AnimationConfig = {},
  ) {
    const totalDuration = calculateTotalDuration(animations, compositionType);
    super(target, { ...config, duration: totalDuration });
    this.animations = animations;
    Object.freeze(animations);
  }

  /**
   * Get the array of animations in this group
   */
  get children(): ReadonlyArray<Animation> {
    return this.animations;
  }

  /**
   * Get the number of animations in this group
   */
  get count(): number {
    return this.animations.length;
  }

  /**
   * Interpolate based on composition type
   *
   * @param alpha - Progress value [0, 1]
   * @returns Interpolated object state
   */
  protected override interpolateAt(alpha: Alpha): RenderObject {
    const compositionType = (this as any).compositionType as CompositionType;

    switch (compositionType) {
      case 'parallel' as CompositionType:
        return this.interpolateParallel(alpha);
      case 'Sequence' as CompositionType:
        return this.interpolateSequence(alpha);
      case 'Lagged' as CompositionType:
        return this.interpolateLagged(alpha);
      default:
        return this.interpolateParallel(alpha);
    }
  }

  /**
   * Parallel interpolation - all animations at once
   */
  private interpolateParallel(alpha: Alpha): RenderObject {
    let result = this.target;

    for (const animation of this.animations) {
      const { object } = animation.interpolate(alpha * animation.getTotalDuration());
      result = object;
    }

    return result;
  }

  /**
   * Sequential interpolation - animations in order
   */
  private interpolateSequence(alpha: Alpha): RenderObject {
    const totalDuration = this.config.duration ?? 1;
    const currentTime = alpha * totalDuration;

    let accumulatedTime = 0;
    let result = this.target;

    for (const animation of this.animations) {
      const animDuration = animation.getTotalDuration();
      const animStartTime = accumulatedTime;
      const animEndTime = accumulatedTime + animDuration;

      if (currentTime >= animStartTime) {
        const elapsedTime = Math.min(currentTime - animStartTime, animDuration);
        const { object } = animation.interpolate(elapsedTime);
        result = object;
      }

      accumulatedTime = animEndTime;
    }

    return result;
  }

  /**
   * Lagged interpolation - staggered start times
   */
  private interpolateLagged(alpha: Alpha): RenderObject {
    // Get lag from config or use default
    const lag = this.config.lag ?? 0.1;
    const totalDuration = this.config.duration ?? 1;
    const currentTime = alpha * totalDuration;

    let result = this.target;

    this.animations.forEach((animation, index) => {
      const startTime = index * lag;
      if (currentTime >= startTime) {
        const { object } = animation.interpolate(currentTime - startTime);
        result = object;
      }
    });

    return result;
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create a parallel animation group
   *
   * @param target - Target object
   * @param animations - Animations to run in parallel
   * @param config - Optional configuration
   * @returns A new AnimationGroup with parallel composition
   */
  static parallel(
    target: RenderObject,
    animations: ReadonlyArray<Animation>,
    config: AnimationConfig = {},
  ): AnimationGroup {
    return new AnimationGroup(target, animations, 'parallel' as CompositionType, config);
  }

  /**
   * Create a sequential animation group
   *
   * @param target - Target object
   * @param animations - Animations to run sequentially
   * @param config - Optional configuration
   * @returns A new AnimationGroup with sequential composition
   */
  static sequence(
    target: RenderObject,
    animations: ReadonlyArray<Animation>,
    config: AnimationConfig = {},
  ): AnimationGroup {
    return new AnimationGroup(target, animations, 'Sequence' as CompositionType, config);
  }

  /**
   * Create a lagged animation group
   *
   * @param target - Target object
   * @param animations - Animations to run with staggered starts
   * @param lag - Delay between each animation start (seconds)
   * @param config - Optional configuration
   * @returns A new AnimationGroup with lagged composition
   */
  static lagged(
    target: RenderObject,
    animations: ReadonlyArray<Animation>,
    lag: number = 0.1,
    config: AnimationConfig = {},
  ): AnimationGroup {
    return new AnimationGroup(target, animations, 'Lagged' as CompositionType, {
      ...config,
      lag,
    });
  }

  /**
   * Add an animation to this group
   *
   * @param animation - Animation to add
   * @returns A new AnimationGroup with the animation added
   */
  add(animation: Animation): AnimationGroup {
    return new AnimationGroup(
      this.target,
      [...this.animations, animation],
      (this as any).compositionType,
      this.config,
    );
  }

  /**
   * Get a string representation
   */
  override toString(): string {
    const compositionType = (this as any).compositionType as CompositionType;
    return `AnimationGroup(type=${compositionType}, count=${this.animations.length})`;
  }
}

/**
 * Calculate total duration based on composition type
 */
function calculateTotalDuration(
  animations: ReadonlyArray<Animation>,
  type: CompositionType,
): number {
  if (animations.length === 0) return 0;

  switch (type) {
    case 'parallel' as CompositionType:
    case 'Lagged' as CompositionType:
      // Duration is the longest animation duration
      return Math.max(...animations.map((a) => a.getTotalDuration()));
    case 'Sequence' as CompositionType:
      // Duration is sum of all animation durations
      return animations.reduce((sum, a) => sum + a.getTotalDuration(), 0);
    default:
      return Math.max(...animations.map((a) => a.getTotalDuration()));
  }
}

/**
 * LoopAnimation repeats an animation
 *
 * @example
 * ```typescript
 * const loop = new LoopAnimation(rotate, 3); // Rotate 3 times
 * const infiniteLoop = LoopAnimation.infinite(pulse); // Loop forever
 * ```
 */
export class LoopAnimation extends Animation {
  private readonly baseAnimation: Animation;
  private _loopCount: number;

  /**
   * Creates a new LoopAnimation
   *
   * @param target - Target object
   * @param baseAnimation - Animation to loop
   * @param loopCount - Number of times to loop
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    baseAnimation: Animation,
    loopCount: number,
    config: AnimationConfig = {},
  ) {
    const totalDuration = baseAnimation.getTotalDuration() * loopCount;
    super(target, { ...config, duration: totalDuration });
    this.baseAnimation = baseAnimation;
    this._loopCount = loopCount;
  }

  /**
   * Get the loop count
   */
  get loopCount(): number {
    return this._loopCount;
  }

  /**
   * Check if this is an infinite loop
   */
  get isInfinite(): boolean {
    return this._loopCount === Infinity;
  }

  /**
   * Interpolate with looping
   */
  protected override interpolateAt(alpha: Alpha): RenderObject {
    const loopProgress = alpha * this._loopCount;
    const currentLoop = Math.floor(loopProgress);
    const loopAlpha = loopProgress - currentLoop;

    const { object } = this.baseAnimation.interpolate(
      loopAlpha * this.baseAnimation.getTotalDuration(),
    );

    return object;
  }

  /**
   * Create a finite loop animation
   *
   * @param baseAnimation - Animation to loop
   * @param loopCount - Number of loops
   * @returns A new LoopAnimation
   */
  static create(baseAnimation: Animation, loopCount: number): LoopAnimation {
    return new LoopAnimation(baseAnimation.target, baseAnimation, loopCount);
  }

  /**
   * Create an infinite loop animation
   *
   * Note: Infinite loops need special handling in scene rendering.
   *
   * @param baseAnimation - Animation to loop
   * @returns A new LoopAnimation with infinite loop
   */
  static infinite(baseAnimation: Animation): LoopAnimation {
    const anim = new LoopAnimation(baseAnimation.target, baseAnimation, 1);
    anim._loopCount = Infinity;
    return anim;
  }
}

/**
 * Default export
 */
export default AnimationGroup;
