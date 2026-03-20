/**
 * AniMaker Core Type Definitions
 *
 * This file contains the fundamental type definitions for the AniMaker animation framework.
 * All types are designed with immutability and type safety in mind.
 *
 * @packageDocumentation
 */

/**
 * ============================================================================
 * Brand Types - Type-safe identifiers and numeric values
 * ============================================================================
 */

/**
 * Unique identifier for a render object
 */
export type ObjectId = string & { readonly __brand: unique symbol };

/**
 * Time value in seconds
 */
export type Time = number & { readonly __brand: 'time' };

/**
 * Animation progress value [0, 1]
 */
export type Alpha = number & { readonly __brand: 'alpha' };

/**
 * ============================================================================
 * Basic Geometric Types
 * ============================================================================
 */

/**
 * 3D point in space
 */
export interface Point3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * 2D point (for convenience)
 */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/**
 * Bounding box for render objects
 */
export interface BoundingBox {
  readonly min: Point3D;
  readonly max: Point3D;
  readonly center: Point3D;
}

/**
 * ============================================================================
 * Transform Types
 * ============================================================================
 */

/**
 * Transform state of a render object
 */
export interface Transform {
  readonly position: Point3D;
  readonly rotation: Point3D; // Euler angles in degrees
  readonly scale: Point3D;
  readonly opacity: number; // 0-1
}

/**
 * Default transform state
 */
export const DEFAULT_TRANSFORM: Transform = Object.freeze({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  opacity: 1
});

/**
 * ============================================================================
 * Render Object Types
 * ============================================================================
 */

/**
 * Geometry type enumeration
 */
export enum GeometryType {
  Circle = 'circle',
  Rectangle = 'rectangle',
  Polygon = 'polygon',
  Line = 'line',
  Curve = 'curve',
  Arc = 'arc',
  Ellipse = 'ellipse'
}

/**
 * Stroke style for vector objects
 */
export interface StrokeStyle {
  readonly color: string;
  readonly width: number;
  readonly opacity?: number;
}

/**
 * Fill style for vector objects
 */
export interface FillStyle {
  readonly color: string;
  readonly opacity: number;
}

/**
 * Text font configuration
 */
export interface FontConfig {
  readonly family: string;
  readonly size: number;
  readonly weight?: string;
  readonly style?: 'normal' | 'italic' | 'oblique';
}

/**
 * Render object state
 */
export interface RenderObjectState {
  readonly id: ObjectId;
  readonly transform: Transform;
  readonly visible: boolean;
  readonly z_index: number;
  readonly styles: ReadonlyMap<string, unknown>;
  readonly parentId?: ObjectId;
}

/**
 * ============================================================================
 * Scene Types
 * ============================================================================
 */

/**
 * Scene configuration
 */
export interface SceneConfig {
  readonly width: number;
  readonly height: number;
  readonly backgroundColor?: string;
  readonly fps: number;
}

/**
 * Default scene configuration
 */
export const DEFAULT_SCENE_CONFIG: SceneConfig = Object.freeze({
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
  fps: 60
});

/**
 * Scene snapshot for undo/redo functionality
 */
export interface SceneSnapshot {
  readonly time: number;
  readonly objects: ReadonlyArray<RenderObject>;
  readonly metadata?: ReadonlyMap<string, unknown>;
}

/**
 * Forward declarations for circular dependencies
 */
export interface RenderObject {
  getState(): RenderObjectState;
  withTransform(transform: Partial<Transform>): RenderObject;
  getBoundingBox(): BoundingBox;
  containsPoint(point: Point3D): boolean;
}

export interface Animation {
  readonly target: RenderObject;
  interpolate(elapsedTime: number): InterpolationResult;
  getTotalDuration(): number;
}

export interface InterpolationResult {
  readonly object: RenderObject;
  readonly complete: boolean;
}

/**
 * ============================================================================
 * Common Direction Constants
 * ============================================================================
 */

/**
 * Origin point (0, 0, 0)
 */
export const ORIGIN: Point3D = Object.freeze({ x: 0, y: 0, z: 0 });

/**
 * Unit vectors for common directions
 */
export const UP: Point3D = Object.freeze({ x: 0, y: 1, z: 0 });
export const DOWN: Point3D = Object.freeze({ x: 0, y: -1, z: 0 });
export const LEFT: Point3D = Object.freeze({ x: -1, y: 0, z: 0 });
export const RIGHT: Point3D = Object.freeze({ x: 1, y: 0, z: 0 });
export const IN: Point3D = Object.freeze({ x: 0, y: 0, z: 1 });
export const OUT: Point3D = Object.freeze({ x: 0, y: 0, z: -1 });

/**
 * ============================================================================
 * Helper Functions
 * ============================================================================
 */

/**
 * Generate a unique object ID
 */
export function generateObjectId(prefix: string = 'obj'): ObjectId {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ObjectId;
}

/**
 * Check if a value is a valid Alpha value [0, 1]
 */
export function isValidAlpha(value: number): value is Alpha {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

/**
 * Linear interpolation between two points
 */
export function lerpPoint(start: Point3D, end: Point3D, alpha: number): Point3D {
  return {
    x: lerp(start.x, end.x, alpha),
    y: lerp(start.y, end.y, alpha),
    z: lerp(start.z, end.z, alpha)
  };
}

/**
 * ============================================================================
 * Type Guards
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
 * Check if a value is a valid Alpha value
 */
export function isAlpha(value: unknown): value is Alpha {
  return typeof value === 'number' && value >= 0 && value <= 1;
}
