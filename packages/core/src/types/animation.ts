/**
 * Animation Type Definitions
 *
 * This file defines all animation-related types and interfaces.
 * Animations represent transitions between object states over time.
 *
 * @module types/animation
 */

import type { RenderObject, ObjectId } from './core';

/**
 * ============================================================================
 * Animation Types
 * ============================================================================
 */

/**
 * Animation progress value [0, 1]
 */
export type Alpha = number & { readonly __brand: 'alpha' };

/**
 * Easing function type - maps linear progress to eased progress
 */
export type EasingFunction = (alpha: Alpha) => Alpha;

/**
 * Animation configuration options
 */
export interface AnimationConfig {
  /** Duration in seconds */
  readonly duration: number;
  /** Easing function to use */
  readonly easing: EasingFunction;
  /** Delay before animation starts (seconds) */
  readonly delay?: number;
  /** Remove target object from scene on completion */
  readonly removeOnComplete?: boolean;
  /** Animation name for debugging */
  readonly name?: string;
}

/**
 * Result of animation interpolation
 */
export interface InterpolationResult<T extends RenderObject = RenderObject> {
  /** Interpolated object state */
  readonly object: T;
  /** Whether animation is complete */
  readonly complete: boolean;
}

/**
 * Animation composition type
 */
export enum CompositionType {
  /** Execute animations simultaneously */
  Parallel = 'parallel',
  /** Execute animations sequentially */
  Sequence = 'sequence',
  /** Execute animations with staggered start times */
  Lagged = 'lagged'
}

/**
 * Timeline event types
 */
export type TimelineEventType = 'animation_start' | 'animation_end' | 'marker';

/**
 * Timeline event
 */
export interface TimelineEvent {
  /** Event time in seconds */
  readonly time: number;
  /** Event type */
  readonly type: TimelineEventType;
  /** Optional event data */
  readonly data?: unknown;
}

/**
 * ============================================================================
 * Animation Classes
 * ============================================================================
 */

/**
 * Abstract base class for all animations
 *
 * @template T The type of render object this animation operates on
 */
export abstract class Animation<T extends RenderObject = RenderObject> {
  constructor(
    /** Target object to animate */
    public readonly target: T,
    /** Animation configuration */
    protected readonly config: AnimationConfig
  ) {}

  /**
   * Get the animation configuration
   */
  get config(): Readonly<AnimationConfig> {
    return this.config;
  }

  /**
   * Get the total duration including delay
   */
  getTotalDuration(): number {
    return (this.config.delay ?? 0) + this.config.duration;
  }

  /**
   * Interpolate at the given elapsed time
   *
   * @param elapsedTime Time in seconds since animation start
   * @returns Interpolation result with object state and completion status
   */
  interpolate(elapsedTime: number): InterpolationResult<T> {
    const delay = this.config.delay ?? 0;

    // Return original object during delay
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
   * Subclasses must implement this method
   *
   * @param alpha Eased progress value [0, 1]
   * @returns Interpolated object state
   */
  protected abstract interpolateAt(alpha: Alpha): T;

  /**
   * Check if this animation removes the target on completion
   */
  isRemover(): boolean {
    return this.config.removeOnComplete ?? false;
  }

  /**
   * Get animation name or class name
   */
  getName(): string {
    return this.config.name ?? this.constructor.name;
  }
}

/**
 * ============================================================================
 * Animation Builder
 * ============================================================================
 */

/**
 * Builder class for creating animations with a fluent API
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
   * @param seconds Duration in seconds
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
   * @param easing Easing function to use
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
   * @param seconds Delay in seconds
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
   * @param value Whether to remove on complete (default: true)
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
   * @param name Animation name for debugging
   */
  withName(name: string): AnimationBuilder<T> {
    return new AnimationBuilder(
      this.AnimationClass,
      this.target,
      { ...this.config, name }
    );
  }

  /**
   * Build the animation instance with current configuration
   */
  build(): T {
    const defaults: AnimationConfig = {
      duration: 1,
      easing: smooth
    };

    return new this.AnimationClass(
      this.target,
      { ...defaults, ...this.config } as AnimationConfig
    );
  }
}

/**
 * ============================================================================
 * Built-in Animation Types
 * ============================================================================
 */

/**
 * Transform animation - interpolates between two object states
 */
export class TransformAnimation extends Animation {
  constructor(
    target: RenderObject,
    private readonly endState: RenderObjectState,
    config: AnimationConfig
  ) {
    super(target, config);
  }

  protected interpolateAt(alpha: Alpha): RenderObject {
    const startTransform = this.target.getState().transform;
    const endTransform = this.endState.transform;

    const lerp = (start: number, end: number): number =>
      start + (end - start) * alpha;

    return this.target.withTransform({
      position: {
        x: lerp(startTransform.position.x, endTransform.position.x),
        y: lerp(startTransform.position.y, endTransform.position.y),
        z: lerp(startTransform.position.z, endTransform.position.z)
      },
      rotation: {
        x: lerp(startTransform.rotation.x, endTransform.rotation.x),
        y: lerp(startTransform.rotation.y, endTransform.rotation.y),
        z: lerp(startTransform.rotation.z, endTransform.rotation.z)
      },
      scale: {
        x: lerp(startTransform.scale.x, endTransform.scale.x),
        y: lerp(startTransform.scale.y, endTransform.scale.y),
        z: lerp(startTransform.scale.z, endTransform.scale.z)
      },
      opacity: lerp(startTransform.opacity, endTransform.opacity)
    });
  }
}

/**
 * Fade in animation - interpolates opacity from 0 to current
 */
export class FadeInAnimation extends Animation {
  protected interpolateAt(alpha: Alpha): RenderObject {
    return this.target.withOpacity(alpha);
  }
}

/**
 * Fade out animation - interpolates opacity from current to 0
 */
export class FadeOutAnimation extends Animation {
  protected interpolateAt(alpha: Alpha): RenderObject {
    return this.target.withOpacity(1 - alpha);
  }
}

/**
 * Rotate animation - rotates object around an axis
 */
export class RotateAnimation extends Animation {
  constructor(
    target: RenderObject,
    private readonly axis: 'x' | 'y' | 'z',
    private readonly degrees: number,
    config: AnimationConfig
  ) {
    super(target, config);
  }

  protected interpolateAt(alpha: Alpha): RenderObject {
    const currentRotation = this.target.getState().rotation;
    const newRotation = { ...currentRotation };
    newRotation[this.axis] += this.degrees * alpha;
    return this.target.withTransform({ rotation: newRotation });
  }
}

/**
 * Move animation - translates object by delta
 */
export class MoveAnimation extends Animation {
  constructor(
    target: RenderObject,
    private readonly delta: Point3D,
    config: AnimationConfig
  ) {
    super(target, config);
  }

  protected interpolateAt(alpha: Alpha): RenderObject {
    const current = this.target.getState().position;
    return this.target.withPosition(
      current.x + this.delta.x * alpha,
      current.y + this.delta.y * alpha,
      current.z + this.delta.z * alpha
    );
  }
}

/**
 * Scale animation - scales object
 */
export class ScaleAnimation extends Animation {
  constructor(
    target: RenderObject,
    private readonly scaleFactor: Point3D,
    config: AnimationConfig
  ) {
    super(target, config);
  }

  protected interpolateAt(alpha: Alpha): RenderObject {
    const current = this.target.getState().scale;
    return this.target.withScale(
      current.x + (this.scaleFactor.x - current.x) * alpha,
      current.y + (this.scaleFactor.y - current.y) * alpha,
      current.z + (this.scaleFactor.z - current.z) * alpha
    );
  }
}

/**
 * ============================================================================
 * Animation Composition
 * ============================================================================
 */

/**
 * Animation group - combines multiple animations
 */
export class AnimationGroup extends Animation {
  constructor(
    target: RenderObject,
    private readonly animations: ReadonlyArray<Animation>,
    private readonly compositionType: CompositionType = CompositionType.Parallel,
    config: AnimationConfig = {}
  ) {
    const totalDuration = calculateTotalDuration(animations, compositionType);
    super(target, { ...config, duration: totalDuration });
  }

  protected interpolateAt(alpha: Alpha): RenderObject {
    switch (this.compositionType) {
      case CompositionType.Parallel:
        return this.interpolateParallel(alpha);
      case CompositionType.Sequence:
        return this.interpolateSequence(alpha);
      case CompositionType.Lagged:
        return this.interpolateLagged(alpha);
    }
  }

  private interpolateParallel(alpha: Alpha): RenderObject {
    let result = this.target;
    for (const animation of this.animations) {
      const { object } = animation.interpolate(
        alpha * animation.getTotalDuration()
      );
      result = object;
    }
    return result;
  }

  private interpolateSequence(alpha: Alpha): RenderObject {
    const totalDuration = this.config.duration;
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

  private interpolateLagged(alpha: Alpha): RenderObject {
    const lag = 0.1; // Default lag between animations
    const totalDuration = this.config.duration;
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
}

/**
 * Calculate total duration based on composition type
 */
function calculateTotalDuration(
  animations: ReadonlyArray<Animation>,
  type: CompositionType
): number {
  switch (type) {
    case CompositionType.Parallel:
    case CompositionType.Lagged:
      return Math.max(...animations.map(a => a.getTotalDuration()));
    case CompositionType.Sequence:
      return animations.reduce((sum, a) => sum + a.getTotalDuration(), 0);
  }
}

/**
 * ============================================================================
 * Timeline
 * ============================================================================
 */

/**
 * Timeline for managing animation events and markers
 */
export class Timeline {
  private events: TimelineEvent[] = [];
  private duration: number = 0;

  /**
   * Add a marker event at the specified time
   *
   * @param time Time in seconds
   * @param data Optional marker data
   */
  addMarker(time: number, data?: unknown): Timeline {
    const newTimeline = new Timeline();
    newTimeline.events = [...this.events, { time, type: 'marker', data }];
    newTimeline.duration = Math.max(this.duration, time);
    return newTimeline;
  }

  /**
   * Add animation events
   *
   * @param animation Animation to add
   * @param startTime Start time in seconds
   */
  addAnimation(animation: Animation, startTime: number): Timeline {
    const endTime = startTime + animation.getTotalDuration();
    const newTimeline = new Timeline();
    newTimeline.events = [
      ...this.events,
      { time: startTime, type: 'animation_start', data: animation },
      { time: endTime, type: 'animation_end', data: animation }
    ];
    newTimeline.duration = Math.max(this.duration, endTime);
    return newTimeline;
  }

  /**
   * Get events in a time range
   *
   * @param start Start time in seconds
   * @param end End time in seconds
   */
  getEventsInRange(start: number, end: number): ReadonlyArray<TimelineEvent> {
    return this.events.filter(e => e.time >= start && e.time <= end);
  }

  /**
   * Get total timeline duration
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Get all events
   */
  getEvents(): ReadonlyArray<TimelineEvent> {
    return this.events;
  }
}

/**
 * ============================================================================
 * Re-exports from core
 * ============================================================================
 */

// Re-export necessary types from core
import type {
  Point3D,
  RenderObjectState,
  Transform
} from './core';

export type { Point3D, RenderObjectState, Transform };

// Re-export easing functions
export { smooth } from './easing';
