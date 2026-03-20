/**
 * Utility Functions and Type Guards
 *
 * This file contains helper functions and type guards used throughout
 * the animation framework.
 *
 * @module types/utils
 */

import type {
  ObjectId,
  Time,
  Alpha,
  Point3D,
  Point2D,
  Transform,
  BoundingBox
} from './core';
import type { RenderObject } from './objects';
import type { Animation, EasingFunction } from './animation';
import type { Scene } from './scene';

/**
 * ============================================================================
 * ID Generation
 * ============================================================================
 */

/**
 * Generate a unique object ID
 *
 * @param prefix Optional prefix for the ID
 * @returns Unique object ID
 */
export function generateObjectId(prefix: string = 'obj'): ObjectId {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ObjectId;
}

/**
 * ============================================================================
 * Type Guards - Core Types
 * ============================================================================
 */

/**
 * Check if a value is a valid ObjectId
 */
export function isObjectId(value: unknown): value is ObjectId {
  return typeof value === 'string' && value.startsWith('obj-');
}

/**
 * Check if a value is a valid Time value
 */
export function isTime(value: unknown): value is Time {
  return typeof value === 'number' && value >= 0;
}

/**
 * Check if a value is a valid Alpha value [0, 1]
 */
export function isValidAlpha(value: unknown): value is Alpha {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

/**
 * ============================================================================
 * Type Guards - Geometric Types
 * ============================================================================
 */

/**
 * Check if a value is a Point3D
 */
export function isPoint3D(value: unknown): value is Point3D {
  return (
    typeof value === 'object' &&
    value !== null &&
    'x' in value &&
    'y' in value &&
    'z' in value &&
    typeof (value as Point3D).x === 'number' &&
    typeof (value as Point3D).y === 'number' &&
    typeof (value as Point3D).z === 'number'
  );
}

/**
 * Check if a value is a Point2D
 */
export function isPoint2D(value: unknown): value is Point2D {
  return (
    typeof value === 'object' &&
    value !== null &&
    'x' in value &&
    'y' in value &&
    typeof (value as Point2D).x === 'number' &&
    typeof (value as Point2D).y === 'number'
  );
}

/**
 * ============================================================================
 * Type Guards - Framework Objects
 * ============================================================================
 */

/**
 * Check if a value is a RenderObject
 */
export function isRenderObject(value: unknown): value is RenderObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getState' in value &&
    'withTransform' in value &&
    'getBoundingBox' in value &&
    'containsPoint' in value &&
    typeof (value as RenderObject).getState === 'function' &&
    typeof (value as RenderObject).withTransform === 'function' &&
    typeof (value as RenderObject).getBoundingBox === 'function' &&
    typeof (value as RenderObject).containsPoint === 'function'
  );
}

/**
 * Check if a value is an Animation
 */
export function isAnimation(value: unknown): value is Animation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    'interpolate' in value &&
    'getTotalDuration' in value &&
    typeof (value as Animation).interpolate === 'function' &&
    typeof (value as Animation).getTotalDuration === 'function'
  );
}

/**
 * Check if a value is an EasingFunction
 */
export function isEasingFunction(value: unknown): value is EasingFunction {
  return typeof value === 'function';
}

/**
 * Check if a value is a Scene
 */
export function isScene(value: unknown): value is Scene {
  return (
    typeof value === 'object' &&
    value !== null &&
    'config' in value &&
    'id' in value &&
    'addObject' in value &&
    'schedule' in value &&
    'updateTo' in value &&
    typeof (value as Scene).addObject === 'function' &&
    typeof (value as Scene).schedule === 'function' &&
    typeof (value as Scene).updateTo === 'function'
  );
}

/**
 * ============================================================================
 * Math Utilities
 * ============================================================================
 */

/**
 * Clamp a value between min and max
 *
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 *
 * @param start Start value
 * @param end End value
 * @param alpha Interpolation factor [0, 1]
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

/**
 * Linear interpolation between two points
 *
 * @param start Start point
 * @param end End point
 * @param alpha Interpolation factor [0, 1]
 * @returns Interpolated point
 */
export function lerpPoint(start: Point3D, end: Point3D, alpha: number): Point3D {
  return {
    x: lerp(start.x, end.x, alpha),
    y: lerp(start.y, end.y, alpha),
    z: lerp(start.z, end.z, alpha)
  };
}

/**
 * Linear interpolation between two transforms
 *
 * @param start Start transform
 * @param end End transform
 * @param alpha Interpolation factor [0, 1]
 * @returns Interpolated transform
 */
export function lerpTransform(start: Transform, end: Transform, alpha: number): Transform {
  return {
    position: lerpPoint(start.position, end.position, alpha),
    rotation: lerpPoint(start.rotation, end.rotation, alpha),
    scale: lerpPoint(start.scale, end.scale, alpha),
    opacity: lerp(start.opacity, end.opacity, alpha)
  };
}

/**
 * Map a value from one range to another
 *
 * @param value Value to map
 * @param inMin Input range minimum
 * @param inMax Input range maximum
 * @param outMin Output range minimum
 * @param outMax Output range maximum
 * @returns Mapped value
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Distance between two points
 *
 * @param a First point
 * @param b Second point
 * @returns Euclidean distance
 */
export function distance(a: Point3D, b: Point3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 2D distance between two points (ignoring z)
 *
 * @param a First point
 * @param b Second point
 * @returns 2D Euclidean distance
 */
export function distance2D(a: Point3D, b: Point3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Angle between two points in degrees
 *
 * @param from Origin point
 * @param to Target point
 * @returns Angle in degrees
 */
export function angle(from: Point3D, to: Point3D): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

/**
 * Normalize an angle to [-180, 180]
 *
 * @param degrees Angle in degrees
 * @returns Normalized angle
 */
export function normalizeAngle(degrees: number): number {
  while (degrees > 180) degrees -= 360;
  while (degrees < -180) degrees += 360;
  return degrees;
}

/**
 * ============================================================================
 * Bounding Box Utilities
 * ============================================================================
 */

/**
 * Create a bounding box from points
 *
 * @param points Array of points
 * @returns Bounding box containing all points
 */
export function boundingBoxFromPoints(points: ReadonlyArray<Point3D>): BoundingBox {
  if (points.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      center: { x: 0, y: 0, z: 0 }
    };
  }

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const zs = points.map(p => p.z);

  return {
    min: {
      x: Math.min(...xs),
      y: Math.min(...ys),
      z: Math.min(...zs)
    },
    max: {
      x: Math.max(...xs),
      y: Math.max(...ys),
      z: Math.max(...zs)
    },
    center: {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
      z: (Math.min(...zs) + Math.max(...zs)) / 2
    }
  };
}

/**
 * Check if a point is inside a bounding box
 *
 * @param point Point to check
 * @param bbox Bounding box
 * @returns True if point is inside
 */
export function pointInBoundingBox(point: Point3D, bbox: BoundingBox): boolean {
  return (
    point.x >= bbox.min.x &&
    point.x <= bbox.max.x &&
    point.y >= bbox.min.y &&
    point.y <= bbox.max.y &&
    point.z >= bbox.min.z &&
    point.z <= bbox.max.z
  );
}

/**
 * Merge two bounding boxes
 *
 * @param a First bounding box
 * @param b Second bounding box
 * @returns Combined bounding box
 */
export function mergeBoundingBoxes(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    min: {
      x: Math.min(a.min.x, b.min.x),
      y: Math.min(a.min.y, b.min.y),
      z: Math.min(a.min.z, b.min.z)
    },
    max: {
      x: Math.max(a.max.x, b.max.x),
      y: Math.max(a.max.y, b.max.y),
      z: Math.max(a.max.z, b.max.z)
    },
    center: {
      x: 0,
      y: 0,
      z: 0
    }
  };
}

/**
 * ============================================================================
 * Color Utilities
 * ============================================================================
 */

/**
 * Parse a hex color to RGB
 *
 * @param hex Hex color string (e.g., "#ff0000")
 * @returns RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color
 *
 * @param r Red component [0, 255]
 * @param g Green component [0, 255]
 * @param b Blue component [0, 255]
 * @returns Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Interpolate between two colors
 *
 * @param color1 Start color (hex)
 * @param color2 End color (hex)
 * @param alpha Interpolation factor [0, 1]
 * @returns Interpolated hex color
 */
export function lerpColor(color1: string, color2: string, alpha: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  return rgbToHex(
    Math.round(lerp(rgb1.r, rgb2.r, alpha)),
    Math.round(lerp(rgb1.g, rgb2.g, alpha)),
    Math.round(lerp(rgb1.b, rgb2.b, alpha))
  );
}

/**
 * ============================================================================
 * Array Utilities
 * ============================================================================
 */

/**
 * Remove duplicates from array
 *
 * @param array Input array
 * @returns Array with duplicates removed
 */
export function unique<T>(array: ReadonlyArray<T>): Array<T> {
  return Array.from(new Set(array));
}

/**
 * Flatten nested arrays
 *
 * @param array Nested array
 * @returns Flattened array
 */
export function flatten<T>(array: ReadonlyArray<ReadonlyArray<T>>): Array<T> {
  return array.flat();
}

/**
 * Chunk array into smaller arrays
 *
 * @param array Input array
 * @param size Chunk size
 * @returns Array of chunks
 */
export function chunk<T>(array: ReadonlyArray<T>, size: number): Array<Array<T>> {
  const chunks: Array<Array<T>> = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * ============================================================================
 * Validation Utilities
 * ============================================================================
 */

/**
 * Validate that a number is within range
 *
 * @param value Value to check
 * @param min Minimum value
 * @param max Maximum value
 * @returns True if value is in range
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate that a string is not empty
 *
 * @param str String to check
 * @returns True if string is not empty
 */
export function nonEmpty(str: string): boolean {
  return str.trim().length > 0;
}

/**
 * ============================================================================
 * Constants
 * ============================================================================
 */

/**
 * Default transform values
 */
export const DEFAULT_TRANSFORM: Transform = Object.freeze({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  opacity: 1
});

/**
 * Zero point
 */
export const ZERO_POINT: Point3D = Object.freeze({ x: 0, y: 0, z: 0 });

/**
 * Unit point
 */
export const UNIT_POINT: Point3D = Object.freeze({ x: 1, y: 1, z: 1 });

/**
 * Common directions
 */
export const UP: Point3D = Object.freeze({ x: 0, y: 1, z: 0 });
export const DOWN: Point3D = Object.freeze({ x: 0, y: -1, z: 0 });
export const LEFT: Point3D = Object.freeze({ x: -1, y: 0, z: 0 });
export const RIGHT: Point3D = Object.freeze({ x: 1, y: 0, z: 0 });
export const FORWARD: Point3D = Object.freeze({ x: 0, y: 0, z: 1 });
export const BACK: Point3D = Object.freeze({ x: 0, y: 0, z: -1 });

/**
 * Mathematical constants
 */
export const PI = Math.PI;
export const TAU = 2 * Math.PI;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
