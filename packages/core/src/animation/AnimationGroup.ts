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
 * Loop mode for LoopAnimation
 */
export type LoopMode =
  | { readonly type: 'finite'; readonly count: number }
  | { readonly type: 'infinite' };

/**
 * LoopAnimation repeats an animation
 *
 * @example
 * ```typescript
 * const loop = new LoopAnimation(target, rotateAnim, { type: 'finite', count: 3 });
 * const infiniteLoop = LoopAnimation.infinite(pulse);
 * ```
 */
export class LoopAnimation extends Animation {
  private readonly baseAnimation: Animation;
  private readonly loopMode: LoopMode;

  /**
   * Creates a new LoopAnimation
   *
   * @param target - Target object
   * @param baseAnimation - Animation to loop
   * @param loopMode - Loop configuration (finite count or infinite)
   * @param config - Animation configuration
   */
  constructor(
    target: RenderObject,
    baseAnimation: Animation,
    loopMode: LoopMode = { type: 'finite', count: 1 },
    config: AnimationConfig = {},
  ) {
    const baseDuration = baseAnimation.getTotalDuration();
    const duration =
      loopMode.type === 'infinite'
        ? baseDuration > 0
          ? Infinity
          : 0
        : baseDuration * loopMode.count;
    super(target, { ...config, duration });
    this.baseAnimation = baseAnimation;
    this.loopMode = loopMode;
  }

  /**
   * Get the loop count (Infinity for infinite loops)
   */
  get loopCount(): number {
    return this.loopMode.type === 'infinite' ? Infinity : this.loopMode.count;
  }

  /**
   * Check if this is an infinite loop
   */
  get isInfinite(): boolean {
    return this.loopMode.type === 'infinite';
  }

  /**
   * Override interpolate to handle infinite duration correctly.
   *
   * The parent Animation.interpolate() computes progress as
   * `(elapsedTime - delay) / duration`, which yields 0 when duration is Infinity.
   * For infinite loops, we compute progress directly from elapsed time modulo
   * the base animation duration.
   */
  override interpolate(elapsedTime: number): ReturnType<Animation['interpolate']> {
    if (this.loopMode.type !== 'infinite') {
      return super.interpolate(elapsedTime);
    }

    const baseDuration = this.baseAnimation.getTotalDuration();
    const delay = this.config.delay ?? 0;

    if (baseDuration === 0) {
      return this.baseAnimation.interpolate(0);
    }

    // During delay, return original object
    if (elapsedTime < delay) {
      return { object: this.target, complete: false };
    }

    const effectiveElapsed = elapsedTime - delay;
    const loopElapsed = effectiveElapsed % baseDuration;
    return this.baseAnimation.interpolate(loopElapsed);
  }

  /**
   * Interpolate with looping for finite case.
   * Called by parent interpolate() after easing is applied.
   */
  protected override interpolateAt(alpha: Alpha): RenderObject {
    const baseDuration = this.baseAnimation.getTotalDuration();

    if (baseDuration === 0) {
      const { object } = this.baseAnimation.interpolate(0);
      return object;
    }

    const count = this.loopMode.type === 'infinite' ? 1 : this.loopMode.count;
    const loopProgress = alpha * count;
    const currentLoop = Math.floor(loopProgress);
    const loopAlpha = loopProgress - currentLoop;

    const { object } = this.baseAnimation.interpolate(loopAlpha * baseDuration);
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
    return new LoopAnimation(baseAnimation.target, baseAnimation, {
      type: 'finite',
      count: loopCount,
    });
  }

  /**
   * Create an infinite loop animation
   *
   * Note: Infinite loops need special handling in scene rendering.
   * The total duration is set to Infinity, so the timeline must handle
   * termination externally (e.g. via a scene duration cap).
   *
   * @param baseAnimation - Animation to loop
   * @returns A new LoopAnimation with infinite loop
   */
  static infinite(baseAnimation: Animation): LoopAnimation {
    return new LoopAnimation(baseAnimation.target, baseAnimation, { type: 'infinite' });
  }
}

/**
 * Default export
 */
export default AnimationGroup;
