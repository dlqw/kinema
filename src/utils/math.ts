/**
 * Math utility functions for 2D graphics and animations
 */

/**
 * Linear interpolation between two values
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 * @throws Error if t is not between 0 and 1
 */
export function lerp(start: number, end: number, t: number): number {
  if (t < 0 || t > 1) {
    throw new Error('Interpolation factor t must be between 0 and 1');
  }
  return start + (end - start) * t;
}

/**
 * Clamps a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Checks if two floating point numbers are approximately equal
 * @param a - First number
 * @param b - Second number
 * @param epsilon - Maximum allowed difference (default: 1e-6)
 * @returns True if numbers are approximately equal
 */
export function approxEqual(a: number, b: number, epsilon = 1e-6): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Maps a value from one range to another
 * @param value - Value to map
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Wraps a value within a range
 * @param value - Value to wrap
 * @param min - Range minimum
 * @param max - Range maximum
 * @returns Wrapped value
 */
export function wrap(value: number, min: number, max: number): number {
  const range = max - min;
  return min + (((value - min) % range) + range) % range;
}

/**
 * Calculates distance between two 2D points
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Distance between points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalizes a 2D vector
 * @param x - Vector X component
 * @param y - Vector Y component
 * @returns Normalized vector
 */
export function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: x / len, y: y / len };
}

/**
 * Dot product of two 2D vectors
 * @param x1 - First vector X
 * @param y1 - First vector Y
 * @param x2 - Second vector X
 * @param y2 - Second vector Y
 * @returns Dot product
 */
export function dot(x1: number, y1: number, x2: number, y2: number): number {
  return x1 * x2 + y1 * y2;
}

/**
 * Cross product of two 2D vectors (returns scalar)
 * @param x1 - First vector X
 * @param y1 - First vector Y
 * @param x2 - Second vector X
 * @param y2 - Second vector Y
 * @returns Cross product (Z component)
 */
export function cross(x1: number, y1: number, x2: number, y2: number): number {
  return x1 * y2 - y1 * x2;
}

/**
 * Linearly interpolates between two 2D vectors
 * @param x1 - First vector X
 * @param y1 - First vector Y
 * @param x2 - Second vector X
 * @param y2 - Second vector Y
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated vector
 */
export function lerpVector(x1: number, y1: number, x2: number, y2: number, t: number): {
  x: number;
  y: number;
} {
  return {
    x: lerp(x1, x2, t),
    y: lerp(y1, y2, t),
  };
}
