/**
 * High-Level API - Fluent, chainable animation API
 *
 * Provides a convenient, chainable API for creating animations
 * and scenes with minimal boilerplate.
 *
 * @module api
 */

import type { Point3D, EasingFunction, SceneConfig, StrokeStyle, FillStyle } from '../types';
import type { RenderObject } from '../core';
import type { Scene } from '../scene';
import type { Animation } from '../animation';
import { GroupObject } from '../core';
import { Scene as SceneClass } from '../scene';
import { AnimationGroup } from '../animation';
import * as animations from '../factory/animations';

// ============================================================================
// Object Chain API
// ============================================================================

/**
 * Chainable wrapper for RenderObject
 *
 * Provides a fluent API for object manipulation and animation creation.
 *
 * @example
 * ```typescript
 * const circle = Chain.create(VectorObject.circle(50))
 *   .position(100, 100)
 *   .rotate(45)
 *   .scale(2)
 *   .opacity(0.8)
 *   .stroke({ color: 'red', width: 2 })
 *   .fill({ color: 'blue', opacity: 0.5 })
 *   .value();
 * ```
 */
export class Chain<T extends RenderObject = RenderObject> {
  constructor(public readonly object: T) {}

  /**
   * Get the wrapped object
   */
  value(): T {
    return this.object;
  }

  // ==========================================================================
  // Transform Methods
  // ==========================================================================

  /**
   * Set position
   */
  position(x: number, y: number, z: number = 0): Chain<T> {
    return new Chain(this.object.withPosition(x, y, z) as T);
  }

  /**
   * Move by delta
   */
  move(dx: number, dy: number, dz: number = 0): Chain<T> {
    const pos = this.object.getState().transform.position;
    return new Chain(this.object.withPosition(pos.x + dx, pos.y + dy, pos.z + dz) as T);
  }

  /**
   * Set rotation
   */
  rotation(x: number, y: number, z: number): Chain<T> {
    return new Chain(this.object.withRotation(x, y, z) as T);
  }

  /**
   * Rotate by delta
   */
  rotate(dx: number, dy: number = 0, dz: number = 0): Chain<T> {
    const rot = this.object.getState().transform.rotation;
    return new Chain(this.object.withRotation(rot.x + dx, rot.y + dy, rot.z + dz) as T);
  }

  /**
   * Set scale
   */
  scale(x: number, y: number, z?: number): Chain<T> {
    return new Chain(this.object.withScale(x, y, z ?? 1) as T);
  }

  /**
   * Scale by factor
   */
  scaleBy(factor: number): Chain<T> {
    const s = this.object.getState().transform.scale;
    return new Chain(this.object.withScale(s.x * factor, s.y * factor, s.z * factor) as T);
  }

  /**
   * Set opacity
   */
  opacity(value: number): Chain<T> {
    return new Chain(this.object.withOpacity(value) as T);
  }

  /**
   * Show object
   */
  show(): Chain<T> {
    return new Chain(this.object.show() as T);
  }

  /**
   * Hide object
   */
  hide(): Chain<T> {
    return new Chain(this.object.hide() as T);
  }

  /**
   * Set z-index
   */
  zIndex(z: number): Chain<T> {
    return new Chain(this.object.withZIndex(z) as T);
  }

  // ==========================================================================
  // Style Methods
  // ==========================================================================

  /**
   * Set stroke style
   */
  stroke(stroke: StrokeStyle): Chain<T> {
    if ('withStroke' in this.object) {
      return new Chain((this.object as any).withStroke(stroke) as T);
    }
    return this;
  }

  /**
   * Set fill style
   */
  fill(fill: FillStyle): Chain<T> {
    if ('withFill' in this.object) {
      return new Chain((this.object as any).withFill(fill) as T);
    }
    return this;
  }

  /**
   * Set style property
   */
  style(key: string, value: unknown): Chain<T> {
    return new Chain(this.object.withStyle(key, value) as T);
  }

  // ==========================================================================
  // Group Methods
  // ==========================================================================

  /**
   * Add to a group
   */
  addTo(group: GroupObject): Chain<GroupObject> {
    return new Chain(group.addChild(this.object));
  }

  // ==========================================================================
  // Static Factory
  // ==========================================================================

  /**
   * Create a chain from an object
   */
  static create<T extends RenderObject>(object: T): Chain<T> {
    return new Chain(object);
  }

  /**
   * Chain multiple objects
   */
  static chain<T extends RenderObject>(...objects: T[]): Chain<T>[] {
    return objects.map((obj) => new Chain(obj));
  }
}

// ============================================================================
// Scene Builder API
// ============================================================================

/**
 * Fluent scene builder
 *
 * @example
 * ```typescript
 * const scene = SceneBuild
 *   .config({ width: 1920, height: 1080, fps: 60 })
 *   .add(circle, rectangle, text)
 *   .animate(fadeIn, { delay: 0 })
 *   .animate(rotate, { delay: 1, duration: 2 })
 *   .build();
 * ```
 */
export class SceneBuild {
  private constructor(
    private config?: Partial<SceneConfig>,
    private objects: RenderObject[] = [],
    private animations: Array<{ animation: Animation; delay: number }> = [],
  ) {}

  /**
   * Set scene configuration
   */
  static config(config: Partial<SceneConfig>): SceneBuild {
    return new SceneBuild(config);
  }

  /**
   * Add objects to the scene
   */
  add(...objects: RenderObject[]): SceneBuild {
    return new SceneBuild(this.config, [...this.objects, ...objects], this.animations);
  }

  /**
   * Schedule an animation
   */
  animate(animation: Animation, delay: number = 0): SceneBuild {
    return new SceneBuild(this.config, this.objects, [...this.animations, { animation, delay }]);
  }

  /**
   * Build the scene
   */
  build(): Scene {
    const config: { width: number; height: number; fps: number; backgroundColor?: string } = {
      width: this.config?.width ?? 1920,
      height: this.config?.height ?? 1080,
      fps: this.config?.fps ?? 60,
    };
    if (this.config?.backgroundColor !== undefined) {
      config.backgroundColor = this.config.backgroundColor;
    }
    const scene = new SceneClass(config);

    // Add objects
    let result = scene;
    for (const obj of this.objects) {
      result = result.addObject(obj);
    }

    // Schedule animations
    for (const { animation, delay } of this.animations) {
      result = result.schedule(animation, delay);
    }

    return result;
  }
}

// ============================================================================
// Animation Sequence Builder
// ============================================================================

/**
 * Builder for creating animation sequences
 *
 * @example
 * ```typescript
 * const animation = AnimationSequence.on(circle)
 *   .then(fadeIn, { duration: 0.5 })
 *   .then(rotate, { duration: 1, degrees: 360 })
 *   .then(moveTo, { duration: 1, position: { x: 100, y: 0, z: 0 } })
 *   .then(fadeOut, { duration: 0.5 })
 *   .build();
 * ```
 */
export class AnimationSequence {
  private constructor(
    private target: RenderObject,
    private steps: Array<{
      animation: (target: RenderObject, options?: any) => Animation;
      options: any;
    }> = [],
  ) {}

  /**
   * Start a sequence on an object
   */
  static on(object: RenderObject): AnimationSequence {
    return new AnimationSequence(object);
  }

  /**
   * Add a step to the sequence
   */
  then(
    animation: (target: RenderObject, options?: any) => Animation,
    options: any = {},
  ): AnimationSequence {
    return new AnimationSequence(this.target, [...this.steps, { animation, options }]);
  }

  /**
   * Fade in
   */
  fadeIn(options: { duration?: number; easing?: EasingFunction } = {}): AnimationSequence {
    return this.then((t) => animations.fade(t, options), options);
  }

  /**
   * Fade out
   */
  fadeOut(options: { duration?: number; easing?: EasingFunction } = {}): AnimationSequence {
    return this.then((t) => animations.fadeOut(t, options), options);
  }

  /**
   * Move
   */
  move(
    delta: Point3D,
    options: { duration?: number; easing?: EasingFunction } = {},
  ): AnimationSequence {
    return this.then((t) => animations.move(t, delta, options), options);
  }

  /**
   * Move to
   */
  moveTo(
    position: Point3D,
    options: { duration?: number; easing?: EasingFunction } = {},
  ): AnimationSequence {
    return this.then((t) => animations.moveTo(t, position, options), options);
  }

  /**
   * Rotate
   */
  rotate(
    degrees: number,
    options: { axis?: 'x' | 'y' | 'z'; duration?: number; easing?: EasingFunction } = {},
  ): AnimationSequence {
    return this.then((t) => animations.rotate(t, options.axis ?? 'z', degrees, options), options);
  }

  /**
   * Scale
   */
  scale(
    factor: number,
    options: { duration?: number; easing?: EasingFunction } = {},
  ): AnimationSequence {
    return this.then((t) => animations.scaleBy(t, factor, options), options);
  }

  /**
   * Wait/delay
   */
  wait(duration: number): AnimationSequence {
    return this.then(
      () => ({ interpolate: () => ({ object: this.target, complete: false }) }) as any,
      { duration },
    );
  }

  /**
   * Build the sequence as an AnimationGroup
   */
  build(): Animation {
    const anims = this.steps.map(({ animation, options }) => animation(this.target, options));
    return AnimationGroup.sequence(this.target, anims);
  }
}

// ============================================================================
// Timeline Builder
// ============================================================================

/**
 * Builder for creating complex animation timelines
 *
 * @example
 * ```typescript
 * const timeline = Timeline.create()
 *   .at(0, fadeIn, circle)
 *   .at(1, rotate, circle, { degrees: 360 })
 *   .at(2, fadeOut, circle)
 *   .at(0, fadeIn, rectangle)
 *   .build(scene);
 * ```
 */
export class Timeline {
  private constructor(
    private events: Array<{
      time: number;
      animation: (target: RenderObject, options?: any) => Animation;
      target: RenderObject;
      options?: any;
    }> = [],
  ) {}

  /**
   * Create a new timeline
   */
  static create(): Timeline {
    return new Timeline();
  }

  /**
   * Add an event at a specific time
   */
  at(
    time: number,
    animation: (target: RenderObject, options?: any) => Animation,
    target: RenderObject,
    options?: any,
  ): Timeline {
    return new Timeline([...this.events, { time, animation, target, options }]);
  }

  /**
   * Build the timeline and apply to a scene
   */
  build(scene: Scene): Scene {
    // Sort events by time
    const sorted = [...this.events].sort((a, b) => a.time - b.time);

    // Apply animations to scene
    return sorted.reduce((s, event) => {
      const anim = event.animation(event.target, event.options);
      return s.schedule(anim, event.time);
    }, scene);
  }

  /**
   * Get total timeline duration
   */
  getDuration(): number {
    if (this.events.length === 0) return 0;
    return Math.max(...this.events.map((e) => e.time));
  }
}

// ============================================================================
// Quick Create Functions
// ============================================================================

/**
 * Quickly create and manipulate an object
 *
 * @example
 * ```typescript
 * const circle = quick(VectorObject.circle(50))
 *   .at(100, 100)
 *   .rotate(45)
 *   .value();
 * ```
 */
export function quick<T extends RenderObject>(object: T): Chain<T> {
  return Chain.create(object);
}

/**
 * Create an animation sequence
 *
 * @example
 * ```typescript
 * const animation = seq(circle)
 *   .fadeIn({ duration: 0.5 })
 *   .rotate(360, { duration: 1 })
 *   .fadeOut({ duration: 0.5 })
 *   .build();
 * ```
 */
export function seq(object: RenderObject): AnimationSequence {
  return AnimationSequence.on(object);
}

/**
 * Create a parallel animation group
 *
 * @example
 * ```typescript
 * const animation = para(circle, [
 *   () => fade(circle),
 *   () => rotate(circle, 'z', 360)
 * ]);
 * ```
 */
export function para(
  target: RenderObject,
  animationList: Array<(target: RenderObject) => Animation>,
): Animation {
  const anims = animationList.map((fn) => fn(target));
  return AnimationGroup.parallel(target, anims);
}

// ============================================================================
// Default export
// ============================================================================

export default {
  Chain,
  SceneBuild,
  AnimationSequence,
  Timeline,
  quick,
  seq,
  para,
};
