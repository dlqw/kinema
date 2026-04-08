/**
 * Animation Factory - Convenient factory functions for creating animations
 *
 * Provides simplified API for creating common animations.
 *
 * @module factory/animations
 */

import type { AnimationConfig, EasingFunction, Point3D } from '../types';
import type { RenderObject } from '../core';
import { FadeInAnimation, FadeOutAnimation, FadeToAnimation } from '../animation/FadeAnimation';
import { RotateAnimation, RotateToAnimation } from '../animation/RotateAnimation';
import { MoveAnimation, MoveToAnimation } from '../animation/MoveAnimation';
import { TransformAnimation } from '../animation/TransformAnimation';
import { AnimationGroup } from '../animation/AnimationGroup';

// ============================================================================
// Fade Animations
// ============================================================================

/**
 * Create a fade in animation
 *
 * @param target - Target object
 * @param options - Optional configuration
 * @returns A new FadeInAnimation
 *
 * @example
 * ```typescript
 * const fadeIn = fade(circle);
 * const slowFadeIn = fade(circle, { duration: 2 });
 * const delayedFade = fade(circle, { delay: 0.5, easing: Easing.smooth });
 * ```
 */
export function fade(
  target: RenderObject,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): FadeInAnimation {
  return new FadeInAnimation(target, {
    duration: options.duration ?? 1,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

/**
 * Create a fade out animation
 *
 * @param target - Target object
 * @param options - Optional configuration
 * @returns A new FadeOutAnimation
 *
 * @example
 * ```typescript
 * const fadeOut = fadeOut(circle);
 * const slowFadeOut = fadeOut(circle, { duration: 2, remove: true });
 * ```
 */
export function fadeOut(
  target: RenderObject,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
    remove?: boolean;
  } = {},
): FadeOutAnimation {
  return new FadeOutAnimation(target, {
    duration: options.duration ?? 1,
    removeOnComplete: options.remove ?? true,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

/**
 * Create a fade to specific opacity animation
 *
 * @param target - Target object
 * @param opacity - Target opacity [0, 1]
 * @param options - Optional configuration
 * @returns A new FadeToAnimation
 *
 * @example
 * ```typescript
 * const fadeToHalf = fadeTo(circle, 0.5);
 * const fadeToQuarter = fadeTo(circle, 0.25, { duration: 2 });
 * ```
 */
export function fadeTo(
  target: RenderObject,
  opacity: number,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): FadeToAnimation {
  return new FadeToAnimation(target, opacity, {
    duration: options.duration ?? 1,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

// ============================================================================
// Move Animations
// ============================================================================

/**
 * Create a move animation
 *
 * @param target - Target object
 * @param delta - Movement delta
 * @param options - Optional configuration
 * @returns A new MoveAnimation
 *
 * @example
 * ```typescript
 * const moveRight = move(circle, { x: 100, y: 0, z: 0 });
 * const moveUp = move(rectangle, { x: 0, y: -50, z: 0 }, { duration: 2 });
 * ```
 */
export function move(
  target: RenderObject,
  delta: Point3D,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): MoveAnimation {
  return new MoveAnimation(target, delta, {
    duration: options.duration ?? 1,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

/**
 * Create a move to animation
 *
 * @param target - Target object
 * @param position - Target position
 * @param options - Optional configuration
 * @returns A new MoveToAnimation
 *
 * @example
 * ```typescript
 * const moveToCenter = moveTo(circle, { x: 0, y: 0, z: 0 });
 * const moveToTop = moveTo(rectangle, { x: 0, y: 100, z: 0 }, { duration: 2 });
 * ```
 */
export function moveTo(
  target: RenderObject,
  position: Point3D,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): MoveToAnimation {
  return new MoveToAnimation(target, position, {
    duration: options.duration ?? 1,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

/**
 * Move horizontally
 *
 * @param target - Target object
 * @param deltaX - Horizontal movement
 * @param options - Optional configuration
 * @returns A new MoveAnimation
 */
export function moveX(
  target: RenderObject,
  deltaX: number,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): MoveAnimation {
  return new MoveAnimation(
    target,
    { x: deltaX, y: 0, z: 0 },
    {
      duration: options.duration ?? 1,
      ...(options.delay !== undefined && { delay: options.delay }),
      ...(options.easing !== undefined && { easing: options.easing }),
    },
  );
}

/**
 * Move vertically
 *
 * @param target - Target object
 * @param deltaY - Vertical movement
 * @param options - Optional configuration
 * @returns A new MoveAnimation
 */
export function moveY(
  target: RenderObject,
  deltaY: number,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): MoveAnimation {
  return new MoveAnimation(
    target,
    { x: 0, y: deltaY, z: 0 },
    {
      duration: options.duration ?? 1,
      ...(options.delay !== undefined && { delay: options.delay }),
      ...(options.easing !== undefined && { easing: options.easing }),
    },
  );
}

// ============================================================================
// Rotate Animations
// ============================================================================

/**
 * Create a rotate animation
 *
 * @param target - Target object
 * @param axis - Axis to rotate around
 * @param degrees - Rotation in degrees
 * @param options - Optional configuration
 * @returns A new RotateAnimation
 *
 * @example
 * ```typescript
 * const rotate360 = rotate(circle, 'z', 360);
 * const rotateY = rotate(cube, 'y', 180, { duration: 2 });
 * ```
 */
export function rotate(
  target: RenderObject,
  axis: 'x' | 'y' | 'z',
  degrees: number,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): RotateAnimation {
  return new RotateAnimation(target, axis, degrees, {
    duration: options.duration ?? 1,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

/**
 * Create a rotate to animation
 *
 * @param target - Target object
 * @param axis - Axis to rotate around
 * @param targetDegrees - Target angle in degrees
 * @param options - Optional configuration
 * @returns A new RotateToAnimation
 */
export function rotateTo(
  target: RenderObject,
  axis: 'x' | 'y' | 'z',
  targetDegrees: number,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): RotateToAnimation {
  return new RotateToAnimation(target, axis, targetDegrees, {
    duration: options.duration ?? 1,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

/**
 * Rotate around Z axis (2D rotation)
 *
 * @param target - Target object
 * @param degrees - Rotation in degrees
 * @param options - Optional configuration
 * @returns A new RotateAnimation
 */
export function spin(
  target: RenderObject,
  degrees: number,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): RotateAnimation {
  return rotate(target, 'z', degrees, options);
}

// ============================================================================
// Scale Animations
// ============================================================================

/**
 * Create a scale animation (via TransformAnimation)
 *
 * @param target - Target object
 * @param scale - Target scale
 * @param options - Optional configuration
 * @returns A TransformAnimation that scales the object
 *
 * @example
 * ```typescript
 * const doubleSize = scale(circle, { x: 2, y: 2, z: 1 });
 * const shrink = scale(rectangle, { x: 0.5, y: 0.5, z: 1 });
 * ```
 */
export function scale(
  target: RenderObject,
  scale: Point3D,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): TransformAnimation {
  const endState = {
    ...target.getState(),
    transform: {
      ...target.getState().transform,
      scale,
    },
  };

  return new TransformAnimation(target, endState, {
    duration: options.duration ?? 1,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

/**
 * Scale uniformly on all axes
 *
 * @param target - Target object
 * @param factor - Scale factor
 * @param options - Optional configuration
 * @returns A TransformAnimation
 */
export function scaleBy(
  target: RenderObject,
  factor: number,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
  } = {},
): TransformAnimation {
  return scale(target, { x: factor, y: factor, z: factor }, options);
}

// ============================================================================
// Transform Animations
// ============================================================================

/**
 * Create a transform animation to a specific position
 *
 * @param target - Target object
 * @param position - Target position
 * @param options - Optional configuration
 * @returns A TransformAnimation
 */
export function transformTo(
  target: RenderObject,
  position: Point3D,
  options: {
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
    rotation?: Point3D;
    scale?: Point3D;
    opacity?: number;
  } = {},
): TransformAnimation {
  const endState = {
    ...target.getState(),
    transform: {
      position,
      rotation: options.rotation ?? target.getState().transform.rotation,
      scale: options.scale ?? target.getState().transform.scale,
      opacity: options.opacity ?? target.getState().transform.opacity,
    },
  };

  return new TransformAnimation(target, endState, {
    duration: options.duration ?? 1,
    ...(options.delay !== undefined && { delay: options.delay }),
    ...(options.easing !== undefined && { easing: options.easing }),
  });
}

// ============================================================================
// Animation Composition
// ============================================================================

/**
 * Run animations in parallel
 *
 * @param target - Target object
 * @param animations - Array of animations to run
 * @param options - Optional configuration
 * @returns An AnimationGroup
 *
 * @example
 * ```typescript
 * const parallelAnim = parallel(circle, [
 *   fade(circle),
 *   rotate(circle, 'z', 360)
 * ]);
 * ```
 */
export function parallel(
  target: RenderObject,
  animations: ReadonlyArray<any>,
  options: {
    duration?: number;
    delay?: number;
  } = {},
): AnimationGroup {
  const config: AnimationConfig = {
    ...(options.duration !== undefined && { duration: options.duration }),
    ...(options.delay !== undefined && { delay: options.delay }),
  };
  return AnimationGroup.parallel(target, animations, config);
}

/**
 * Run animations sequentially
 *
 * @param target - Target object
 * @param animations - Array of animations to run in order
 * @param options - Optional configuration
 * @returns An AnimationGroup
 *
 * @example
 * ```typescript
 * const sequenceAnim = sequence(circle, [
 *   fade(circle, { duration: 0.5 }),
 *   move(circle, { x: 100, y: 0, z: 0 }, { duration: 1 }),
 *   fadeOut(circle, { duration: 0.5 })
 * ]);
 * ```
 */
export function sequence(
  target: RenderObject,
  animations: ReadonlyArray<any>,
  options: {
    delay?: number;
  } = {},
): AnimationGroup {
  const config: AnimationConfig = {
    ...(options.delay !== undefined && { delay: options.delay }),
  };
  return AnimationGroup.sequence(target, animations, config);
}

/**
 * Run animations with staggered delays
 *
 * @param target - Target object
 * @param animations - Array of animations
 * @param lag - Delay between each animation start
 * @param options - Optional configuration
 * @returns An AnimationGroup
 *
 * @example
 * ```typescript
 * const staggeredAnim = stagger(circle, [
 *   fade(circle1),
 *   fade(circle2),
 *   fade(circle3)
 * ], 0.2);
 * ```
 */
export function stagger(
  target: RenderObject,
  animations: ReadonlyArray<any>,
  lag: number = 0.1,
  options: {
    delay?: number;
  } = {},
): AnimationGroup {
  const config: AnimationConfig = {
    ...(options.delay !== undefined && { delay: options.delay }),
  };
  return AnimationGroup.lagged(target, animations, lag, config);
}

// ============================================================================
// Default export
// ============================================================================

export default {
  // Fade
  fade,
  fadeOut,
  fadeTo,

  // Move
  move,
  moveTo,
  moveX,
  moveY,

  // Rotate
  rotate,
  rotateTo,
  spin,

  // Scale
  scale,
  scaleBy,

  // Transform
  transformTo,

  // Composition
  parallel,
  sequence,
  stagger,
};
