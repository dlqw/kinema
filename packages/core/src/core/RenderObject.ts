/**
 * RenderObject - Base class for all renderable objects
 *
 * This abstract class defines the interface and common functionality
 * for all objects that can be rendered in a scene.
 *
 * @module core/RenderObject
 */

import type {
  ObjectId,
  Point3D,
  BoundingBox,
  Transform,
  RenderObjectState
} from '../types';
import { generateObjectId, DEFAULT_TRANSFORM } from '../types';

/**
 * Abstract base class for all renderable objects.
 *
 * All render objects are immutable - operations that modify state
 * return new instances rather than modifying the existing object.
 *
 * @example
 * ```typescript
 * const circle = new VectorObject(...);
 * const moved = circle.withPosition(100, 100);
 * // circle is unchanged, moved is a new instance
 * ```
 */
export abstract class RenderObject {
  /**
   * Creates a new RenderObject instance
   *
   * @param state - The immutable state of the object
   */
  protected constructor(protected readonly state: RenderObjectState) {
    Object.freeze(state);
    Object.freeze(state.transform);
  }

  /**
   * Get the unique identifier of this object
   */
  get id(): ObjectId {
    return this.state.id;
  }

  /**
   * Get the current transform state
   */
  get transform(): Transform {
    return this.state.transform;
  }

  /**
   * Get the z-index (rendering order)
   *
   * Objects with higher z-index are rendered on top.
   * Objects with the same z-index are rendered in order of addition.
   */
  get zIndex(): number {
    return this.state.z_index;
  }

  /**
   * Check if the object is visible
   */
  get visible(): boolean {
    return this.state.visible;
  }

  /**
   * Get the parent object ID if this object is part of a group
   */
  get parentId(): ObjectId | undefined {
    return this.state.parentId;
  }

  /**
   * Get a copy of the current state
   *
   * @returns A shallow copy of the object's state
   */
  abstract getState(): RenderObjectState;

  /**
   * Create a new instance with the specified transform applied
   *
   * This is the primary method for updating an object's transform.
   * Subclasses must implement this to return a new instance with
   * the updated transform.
   *
   * @param transform - Partial transform to apply
   * @returns A new instance with the updated transform
   */
  abstract withTransform(transform: Partial<Transform>): RenderObject;

  /**
   * Calculate the bounding box of this object
   *
   * The bounding box represents the axis-aligned bounding box (AABB)
   * that contains all points of the object in its current transform.
   *
   * @returns The bounding box with min, max, and center points
   */
  abstract getBoundingBox(): BoundingBox;

  /**
   * Check if a point is contained within this object
   *
   * This performs a point-in-object test, which may be approximate
   * for complex shapes.
   *
   * @param point - The point to test in world coordinates
   * @returns True if the point is inside the object
   */
  abstract containsPoint(point: Point3D): boolean;

  // ==========================================================================
  // Convenience Methods - Transform Operations
  // ==========================================================================

  /**
   * Create a new instance with the specified position
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate (default: 0)
   * @returns A new instance with the updated position
   */
  withPosition(x: number, y: number, z: number = 0): RenderObject {
    return this.withTransform({ position: { x, y, z } });
  }

  /**
   * Create a new instance with the specified rotation
   *
   * @param x - Rotation around X axis in degrees
   * @param y - Rotation around Y axis in degrees
   * @param z - Rotation around Z axis in degrees
   * @returns A new instance with the updated rotation
   */
  withRotation(x: number, y: number, z: number): RenderObject {
    return this.withTransform({ rotation: { x, y, z } });
  }

  /**
   * Create a new instance with the specified scale
   *
   * @param x - Scale factor for X axis
   * @param y - Scale factor for Y axis
   * @param z - Scale factor for Z axis (default: 1)
   * @returns A new instance with the updated scale
   */
  withScale(x: number, y: number, z: number = 1): RenderObject {
    return this.withTransform({ scale: { x, y, z } });
  }

  /**
   * Create a new instance with the specified opacity
   *
   * @param opacity - Opacity value from 0 (transparent) to 1 (opaque)
   * @returns A new instance with the updated opacity
   */
  withOpacity(opacity: number): RenderObject {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    return this.withTransform({ opacity: clampedOpacity });
  }

  /**
   * Create a new instance with the specified z-index
   *
   * @param z - The new z-index value
   * @returns A new instance with the updated z-index
   */
  withZIndex(z: number): RenderObject {
    return this.withNewState({ ...this.state, z_index: z });
  }

  // ==========================================================================
  // Convenience Methods - Visibility and Style
  // ==========================================================================

  /**
   * Create a visible copy of this object
   *
   * @returns A new instance that is visible
   */
  show(): RenderObject {
    return this.withVisibility(true);
  }

  /**
   * Create a hidden copy of this object
   *
   * @returns A new instance that is not visible
   */
  hide(): RenderObject {
    return this.withVisibility(false);
  }

  /**
   * Create a copy with the specified visibility
   *
   * @param visible - Whether the object should be visible
   * @returns A new instance with the updated visibility
   */
  withVisibility(visible: boolean): RenderObject {
    return this.withNewState({ ...this.state, visible });
  }

  /**
   * Create a copy with a custom style property
   *
   * @param key - The style property key
   * @param value - The style property value
   * @returns A new instance with the updated style
   */
  withStyle(key: string, value: unknown): RenderObject {
    const newStyles = new Map(this.state.styles);
    newStyles.set(key, value);
    return this.withNewState({ ...this.state, styles: newStyles });
  }

  /**
   * Remove a style property
   *
   * @param key - The style property key to remove
   * @returns A new instance without the specified style property
   */
  withoutStyle(key: string): RenderObject {
    const newStyles = new Map(this.state.styles);
    newStyles.delete(key);
    return this.withNewState({ ...this.state, styles: newStyles });
  }

  /**
   * Get a style property value
   *
   * @param key - The style property key
   * @param defaultValue - Default value if key doesn't exist
   * @returns The style property value or default
   */
  getStyle<T = unknown>(key: string, defaultValue?: T): T | undefined {
    return (this.state.styles.get(key) as T) ?? defaultValue;
  }

  // ==========================================================================
  // Protected Helper Methods
  // ==========================================================================

  /**
   * Create a new instance with updated state
   *
   * This is a protected helper method for subclasses to create
   * new instances with modified state.
   *
   * @param newState - The new state (partial or complete)
   * @returns A new instance with the updated state
   */
  protected withNewState(newState: Partial<RenderObjectState>): RenderObject {
    const mergedState: RenderObjectState = {
      ...this.state,
      ...newState,
      styles: newState.styles ?? this.state.styles
    };
    return new (this.constructor as any)(mergedState);
  }

  /**
   * Create a default render object state
   *
   * @param override - Optional state properties to override
   * @returns A new render object state
   */
  protected static createDefaultState(
    override: Partial<RenderObjectState> = {}
  ): RenderObjectState {
    return {
      id: generateObjectId(),
      transform: { ...DEFAULT_TRANSFORM },
      visible: true,
      z_index: 0,
      styles: new Map(),
      ...override
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Clone this object
   *
   * @returns A new instance with the same state
   */
  clone(): RenderObject {
    return this.withNewState({});
  }

  /**
   * Check if this object equals another by ID
   *
   * @param other - The other object to compare
   * @returns True if the objects have the same ID
   */
  equals(other: RenderObject): boolean {
    return this.state.id === other.state.id;
  }

  /**
   * Get a string representation of this object
   *
   * @returns String representation including type and ID
   */
  toString(): string {
    return `${this.constructor.name}(id="${this.state.id}")`;
  }

  /**
   * Get a JSON-serializable representation of this object
   *
   * @returns Plain object representation
   */
  toJSON(): Record<string, unknown> {
    return {
      type: this.constructor.name,
      id: this.state.id,
      transform: this.state.transform,
      visible: this.state.visible,
      zIndex: this.state.z_index,
      parentId: this.state.parentId
    };
  }
}

/**
 * Default export
 */
export default RenderObject;
