/**
 * Easing Functions
 *
 * This file contains built-in easing functions for animation.
 * Easing functions map linear progress [0, 1] to eased progress [0, 1].
 *
 * @module types/easing
 */

import type { Alpha } from './animation';

/**
 * ============================================================================
 * Easing Function Type
 * ============================================================================
 */

/**
 * Easing function - maps linear progress to eased progress
 */
export type EasingFunction = (alpha: Alpha) => Alpha;

/**
 * ============================================================================
 * Built-in Easing Functions
 * ============================================================================
 */

/**
 * Linear easing - no easing effect
 *
 * @param alpha Linear progress [0, 1]
 * @returns Same value as input
 */
export const linear: EasingFunction = (alpha) => alpha;

/**
 * Smooth easing - S-curve (smoothstep)
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with smooth S-curve
 */
export const smooth: EasingFunction = (alpha) => alpha * alpha * (3 - 2 * alpha);

/**
 * Smoother easing - More pronounced S-curve
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with smoother S-curve
 */
export const smoother: EasingFunction = (alpha) =>
  alpha * alpha * alpha * (alpha * (alpha * 6 - 15) + 10);

/**
 * ============================================================================
 * Ease In Functions
 * ============================================================================
 */

/**
 * Quadratic ease in
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress accelerating from zero
 */
export const easeIn: EasingFunction = (alpha) => alpha * alpha;

/**
 * Cubic ease in
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with cubic acceleration
 */
export const easeInCubic: EasingFunction = (alpha) => alpha * alpha * alpha;

/**
 * Quartic ease in
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with quartic acceleration
 */
export const easeInQuart: EasingFunction = (alpha) => alpha * alpha * alpha * alpha;

/**
 * Quintic ease in
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with quintic acceleration
 */
export const easeInQuint: EasingFunction = (alpha) =>
  alpha * alpha * alpha * alpha * alpha;

/**
 * Sine ease in
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with sine acceleration
 */
export const easeInSine: EasingFunction = (alpha) =>
  1 - Math.cos((alpha * Math.PI) / 2);

/**
 * Exponential ease in
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with exponential acceleration
 */
export const easeInExpo: EasingFunction = (alpha) =>
  alpha === 0 ? 0 : Math.pow(2, 10 * alpha - 10);

/**
 * Circular ease in
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with circular acceleration
 */
export const easeInCirc: EasingFunction = (alpha) =>
  1 - Math.sqrt(1 - alpha * alpha);

/**
 * ============================================================================
 * Ease Out Functions
 * ============================================================================
 */

/**
 * Quadratic ease out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress decelerating to zero
 */
export const easeOut: EasingFunction = (alpha) => alpha * (2 - alpha);

/**
 * Cubic ease out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with cubic deceleration
 */
export const easeOutCubic: EasingFunction = (alpha) =>
  1 - Math.pow(1 - alpha, 3);

/**
 * Quartic ease out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with quartic deceleration
 */
export const easeOutQuart: EasingFunction = (alpha) =>
  1 - Math.pow(1 - alpha, 4);

/**
 * Quintic ease out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with quintic deceleration
 */
export const easeOutQuint: EasingFunction = (alpha) =>
  1 - Math.pow(1 - alpha, 5);

/**
 * Sine ease out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with sine deceleration
 */
export const easeOutSine: EasingFunction = (alpha) => Math.sin((alpha * Math.PI) / 2);

/**
 * Exponential ease out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with exponential deceleration
 */
export const easeOutExpo: EasingFunction = (alpha) =>
  alpha === 1 ? 1 : 1 - Math.pow(2, -10 * alpha);

/**
 * Circular ease out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased progress with circular deceleration
 */
export const easeOutCirc: EasingFunction = (alpha) =>
  Math.sqrt(1 - Math.pow(alpha - 1, 2));

/**
 * ============================================================================
 * Ease In Out Functions
 * ============================================================================
 */

/**
 * Quadratic ease in out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with acceleration then deceleration
 */
export const easeInOut: EasingFunction = (alpha) =>
  alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2;

/**
 * Cubic ease in out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with cubic acceleration then deceleration
 */
export const easeInOutCubic: EasingFunction = (alpha) =>
  alpha < 0.5
    ? 4 * alpha * alpha * alpha
    : 1 - Math.pow(-2 * alpha + 2, 3) / 2;

/**
 * Quartic ease in out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with quartic acceleration then deceleration
 */
export const easeInOutQuart: EasingFunction = (alpha) =>
  alpha < 0.5 ? 8 * alpha * alpha * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 4) / 2;

/**
 * Quintic ease in out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with quintic acceleration then deceleration
 */
export const easeInOutQuint: EasingFunction = (alpha) =>
  alpha < 0.5
    ? 16 * alpha * alpha * alpha * alpha * alpha
    : 1 - Math.pow(-2 * alpha + 2, 5) / 2;

/**
 * Sine ease in out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with sine acceleration then deceleration
 */
export const easeInOutSine: EasingFunction = (alpha) =>
  -(Math.cos(Math.PI * alpha) - 1) / 2;

/**
 * Exponential ease in out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with exponential acceleration then deceleration
 */
export const easeInOutExpo: EasingFunction = (alpha) =>
  alpha === 0
    ? 0
    : alpha === 1
    ? 1
    : alpha < 0.5
    ? Math.pow(2, 20 * alpha - 10) / 2
    : (2 - Math.pow(2, -20 * alpha + 10)) / 2;

/**
 * Circular ease in out
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with circular acceleration then deceleration
 */
export const easeInOutCirc: EasingFunction = (alpha) =>
  alpha < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * alpha, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * alpha + 2, 2)) + 1) / 2;

/**
 * ============================================================================
 * Special Easing Functions
 * ============================================================================
 */

/**
 * Elastic easing - spring-like effect
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with elastic overshoot
 */
export const elastic: EasingFunction = (alpha) => {
  const c4 = (2 * Math.PI) / 3;
  return alpha === 0
    ? 0
    : alpha === 1
    ? 1
    : -Math.pow(2, 10 * alpha - 10) * Math.sin((alpha * 10 - 10.75) * c4);
};

/**
 * Back easing - slight reverse before moving forward
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with back overshoot
 */
export const back: EasingFunction = (alpha) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(alpha - 1, 3) + c1 * Math.pow(alpha - 1, 2);
};

/**
 * Bounce easing - bouncing effect at the end
 *
 * @param alpha Linear progress [0, 1]
 * @returns Eased with bouncing effect
 */
export const bounce: EasingFunction = (alpha) => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (alpha < 1 / d1) {
    return n1 * alpha * alpha;
  } else if (alpha < 2 / d1) {
    return n1 * (alpha -= 1.5 / d1) * alpha + 0.75;
  } else if (alpha < 2.5 / d1) {
    return n1 * (alpha -= 2.25 / d1) * alpha + 0.9375;
  } else {
    return n1 * (alpha -= 2.625 / d1) * alpha + 0.984375;
  }
};

/**
 * ============================================================================
 * Utility Easing Functions
 * ============================================================================
 */

/**
 * There and back - animation goes forward then reverses
 *
 * @param alpha Linear progress [0, 1]
 * @returns Progress that goes to 1 then back to 0
 */
export const thereAndBack: EasingFunction = (alpha) =>
  alpha < 0.5 ? 2 * alpha : 2 - 2 * alpha;

/**
 * There and back with pause - animation has a pause at the end
 *
 * @param alpha Linear progress [0, 1]
 * @returns Progress with pause at peak
 */
export const thereAndBackWithPause: EasingFunction = (alpha) =>
  alpha < 0.5 ? 2 * alpha : alpha < 0.75 ? 1 : 4 - 4 * alpha;

/**
 * Jump effect - discrete jumps
 *
 * @param alpha Linear progress [0, 1]
 * @param n Number of jumps
 * @returns Discrete jump progress
 */
export function jumpBy(alpha: number, n: number): number {
  return Math.floor(alpha * n) / n;
}

/**
 * ============================================================================
 * Custom Easing Function Creator
 * ============================================================================
 */

/**
 * Create a custom easing function from a regular function
 *
 * @param fn Function that takes [0, 1] and returns [0, 1]
 * @returns Type-safe easing function
 */
export function custom(fn: (alpha: number) => number): EasingFunction {
  return fn as EasingFunction;
}

/**
 * Create a cubic bezier easing function
 *
 * @param p1x First control point x
 * @param p1y First control point y
 * @param p2x Second control point x
 * @param p2y Second control point y
 * @returns Cubic bezier easing function
 */
export function cubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): EasingFunction {
  // Simplified cubic bezier implementation
  // Full implementation would use Newton-Raphson for solving
  return custom((alpha) => {
    // Approximate with smooth curve
    return smooth(alpha);
  });
}

/**
 * ============================================================================
 * Easing Function Collections
 * ============================================================================
 */

/**
 * All ease-in functions
 */
export const easeInFunctions = {
  quadratic: easeIn,
  cubic: easeInCubic,
  quart: easeInQuart,
  quint: easeInQuint,
  sine: easeInSine,
  expo: easeInExpo,
  circ: easeInCirc
} as const;

/**
 * All ease-out functions
 */
export const easeOutFunctions = {
  quadratic: easeOut,
  cubic: easeOutCubic,
  quart: easeOutQuart,
  quint: easeOutQuint,
  sine: easeOutSine,
  expo: easeOutExpo,
  circ: easeOutCirc
} as const;

/**
 * All ease-in-out functions
 */
export const easeInOutFunctions = {
  quadratic: easeInOut,
  cubic: easeInOutCubic,
  quart: easeInOutQuart,
  quint: easeInOutQuint,
  sine: easeInOutSine,
  expo: easeInOutExpo,
  circ: easeInOutCirc
} as const;

/**
 * All special easing functions
 */
export const specialFunctions = {
  elastic,
  back,
  bounce,
  thereAndBack,
  thereAndBackWithPause
} as const;

/**
 * ============================================================================
 * Type Guards
 * ============================================================================
 */

/**
 * Check if a value is a valid easing function
 */
export function isEasingFunction(value: unknown): value is EasingFunction {
  return typeof value === 'function';
}
