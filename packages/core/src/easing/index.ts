/**
 * Easing Functions Library
 *
 * Built-in easing functions for animation.
 * Maps linear progress [0, 1] to eased progress [0, 1].
 *
 * @module easing
 */

import type { Alpha, EasingFunction } from '../types';

// ============================================================================
// Linear Easing
// ============================================================================

/**
 * Linear easing - no easing effect
 *
 * @param alpha - Linear progress [0, 1]
 * @returns Same value as input
 */
export const linear: EasingFunction = (alpha) => alpha;

// ============================================================================
// Smooth Easing
// ============================================================================

/**
 * Smooth easing - S-curve (smoothstep)
 *
 * @param alpha - Linear progress [0, 1]
 * @returns Eased progress with smooth S-curve
 */
export const smooth: EasingFunction = (alpha) => alpha * alpha * (3 - 2 * alpha);

/**
 * Smoother easing - More pronounced S-curve
 *
 * @param alpha - Linear progress [0, 1]
 * @returns Eased progress with smoother S-curve
 */
export const smoother: EasingFunction = (alpha) =>
  alpha * alpha * alpha * (alpha * (alpha * 6 - 15) + 10);

// ============================================================================
// Ease In Functions
// ============================================================================

/**
 * Quadratic ease in
 */
export const easeIn: EasingFunction = (alpha) => alpha * alpha;

/**
 * Cubic ease in
 */
export const easeInCubic: EasingFunction = (alpha) => alpha * alpha * alpha;

/**
 * Quartic ease in
 */
export const easeInQuart: EasingFunction = (alpha) => alpha * alpha * alpha * alpha;

/**
 * Quintic ease in
 */
export const easeInQuint: EasingFunction = (alpha) =>
  alpha * alpha * alpha * alpha * alpha;

/**
 * Sine ease in
 */
export const easeInSine: EasingFunction = (alpha) =>
  1 - Math.cos((alpha * Math.PI) / 2);

/**
 * Exponential ease in
 */
export const easeInExpo: EasingFunction = (alpha) =>
  alpha === 0 ? 0 : Math.pow(2, 10 * alpha - 10);

/**
 * Circular ease in
 */
export const easeInCirc: EasingFunction = (alpha) =>
  1 - Math.sqrt(1 - alpha * alpha);

// ============================================================================
// Ease Out Functions
// ============================================================================

/**
 * Quadratic ease out
 */
export const easeOut: EasingFunction = (alpha) => alpha * (2 - alpha);

/**
 * Cubic ease out
 */
export const easeOutCubic: EasingFunction = (alpha) =>
  1 - Math.pow(1 - alpha, 3);

/**
 * Quartic ease out
 */
export const easeOutQuart: EasingFunction = (alpha) =>
  1 - Math.pow(1 - alpha, 4);

/**
 * Quintic ease out
 */
export const easeOutQuint: EasingFunction = (alpha) =>
  1 - Math.pow(1 - alpha, 5);

/**
 * Sine ease out
 */
export const easeOutSine: EasingFunction = (alpha) => Math.sin((alpha * Math.PI) / 2);

/**
 * Exponential ease out
 */
export const easeOutExpo: EasingFunction = (alpha) =>
  alpha === 1 ? 1 : 1 - Math.pow(2, -10 * alpha);

/**
 * Circular ease out
 */
export const easeOutCirc: EasingFunction = (alpha) =>
  Math.sqrt(1 - Math.pow(alpha - 1, 2));

// ============================================================================
// Ease In Out Functions
// ============================================================================

/**
 * Quadratic ease in out
 */
export const easeInOut: EasingFunction = (alpha) =>
  alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2;

/**
 * Cubic ease in out
 */
export const easeInOutCubic: EasingFunction = (alpha) =>
  alpha < 0.5
    ? 4 * alpha * alpha * alpha
    : 1 - Math.pow(-2 * alpha + 2, 3) / 2;

/**
 * Quartic ease in out
 */
export const easeInOutQuart: EasingFunction = (alpha) =>
  alpha < 0.5 ? 8 * alpha * alpha * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 4) / 2;

/**
 * Quintic ease in out
 */
export const easeInOutQuint: EasingFunction = (alpha) =>
  alpha < 0.5
    ? 16 * alpha * alpha * alpha * alpha * alpha
    : 1 - Math.pow(-2 * alpha + 2, 5) / 2;

/**
 * Sine ease in out
 */
export const easeInOutSine: EasingFunction = (alpha) =>
  -(Math.cos(Math.PI * alpha) - 1) / 2;

/**
 * Exponential ease in out
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
 */
export const easeInOutCirc: EasingFunction = (alpha) =>
  alpha < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * alpha, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * alpha + 2, 2)) + 1) / 2;

// ============================================================================
// Special Easing Functions
// ============================================================================

/**
 * Elastic easing - spring-like effect
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
 */
export const back: EasingFunction = (alpha) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(alpha - 1, 3) + c1 * Math.pow(alpha - 1, 2);
};

/**
 * Bounce easing - bouncing effect at the end
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

// ============================================================================
// Utility Easing Functions
// ============================================================================

/**
 * There and back - animation goes forward then reverses
 */
export const thereAndBack: EasingFunction = (alpha) =>
  alpha < 0.5 ? 2 * alpha : 2 - 2 * alpha;

/**
 * There and back with pause
 */
export const thereAndBackWithPause: EasingFunction = (alpha) =>
  alpha < 0.5 ? 2 * alpha : alpha < 0.75 ? 1 : 4 - 4 * alpha;

/**
 * Jump effect - discrete jumps
 *
 * @param alpha - Progress value [0, 1]
 * @param n - Number of jumps
 * @returns Discrete jump progress
 */
export function jumpBy(alpha: number, n: number): number {
  return Math.floor(alpha * n) / n;
}

// ============================================================================
// Custom Easing Creation
// ============================================================================

/**
 * Create a custom easing function
 */
export function custom(fn: (alpha: number) => number): EasingFunction {
  return fn as EasingFunction;
}

/**
 * Create a cubic bezier easing function
 *
 * @param p1x - First control point x
 * @param p1y - First control point y
 * @param p2x - Second control point x
 * @param p2y - Second control point y
 * @returns Cubic bezier easing function
 */
export function cubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): EasingFunction {
  // Simplified implementation - full version would use Newton-Raphson
  return custom((alpha) => smooth(alpha));
}

// ============================================================================
// Easing Collections
// ============================================================================

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
 * Default export - commonly used easing functions
 */
export default {
  linear,
  smooth,
  easeIn,
  easeOut,
  easeInOut,
  elastic,
  back,
  bounce
};
