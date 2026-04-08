/**
 * Render Object Type Definitions
 *
 * This file defines all renderable object types.
 * Render objects are the visual elements that can be displayed in a scene.
 *
 * @module types/objects
 */

import type { Point3D, BoundingBox, Transform, ObjectId } from './core';

/**
 * ============================================================================
 * Geometry Types
 * ============================================================================
 */

/**
 * Geometry type enumeration
 */
export enum GeometryType {
  Circle = 'circle',
  Rectangle = 'rectangle',
  Square = 'square',
  Polygon = 'polygon',
  Triangle = 'triangle',
  Line = 'line',
  Curve = 'curve',
  Arc = 'arc',
  Ellipse = 'ellipse',
  Path = 'path',
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
 * ============================================================================
 * Render Object State
 * ============================================================================
 */

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
  /** Position in 3D space */
  readonly position: Point3D;
  /** Rotation in 3D space */
  readonly rotation: Point3D;
  /** Scale in 3D space */
  readonly scale: Point3D;
}

/**
 * ============================================================================
 * Render Object Base Class
 * ============================================================================
 */

/**
 * Abstract base class for all renderable objects
 *
 * All render objects are immutable - state changes return new instances.
 */
export abstract class RenderObject {
  protected constructor(protected readonly state: RenderObjectState) {}

  /**
   * Get the unique identifier
   */
  get id(): ObjectId {
    return this.state.id;
  }

  /**
   * Get the current transform
   */
  get transform(): Transform {
    return this.state.transform;
  }

  /**
   * Get the z-index
   */
  get zIndex(): number {
    return this.state.z_index;
  }

  /**
   * Check if visible
   */
  get visible(): boolean {
    return this.state.visible;
  }

  /**
   * Get a copy of the current state
   */
  abstract getState(): RenderObjectState;

  /**
   * Create a new instance with the specified transform
   */
  abstract withTransform(transform: Partial<Transform>): RenderObject;

  /**
   * Calculate the bounding box
   */
  abstract getBoundingBox(): BoundingBox;

  /**
   * Check if a point is contained within this object
   */
  abstract containsPoint(point: Point3D): boolean;

  // Convenience methods

  /**
   * Create a new instance with the specified position
   */
  withPosition(x: number, y: number, z: number = 0): RenderObject {
    return this.withTransform({ position: { x, y, z } });
  }

  /**
   * Create a new instance with the specified rotation
   */
  withRotation(x: number, y: number, z: number): RenderObject {
    return this.withTransform({ rotation: { x, y, z } });
  }

  /**
   * Create a new instance with the specified scale
   */
  withScale(x: number, y: number, z: number = 1): RenderObject {
    return this.withTransform({ scale: { x, y, z } });
  }

  /**
   * Create a new instance with the specified opacity
   */
  withOpacity(opacity: number): RenderObject {
    return this.withTransform({
      opacity: Math.max(0, Math.min(1, opacity)),
    });
  }

  /**
   * Create a new instance with the specified z-index
   */
  withZIndex(z: number): RenderObject {
    return this.withNewState({
      ...this.state,
      z_index: z,
    });
  }

  /**
   * Create a visible copy
   */
  show(): RenderObject {
    return this.withNewState({
      ...this.state,
      visible: true,
    });
  }

  /**
   * Create a hidden copy
   */
  hide(): RenderObject {
    return this.withNewState({
      ...this.state,
      visible: false,
    });
  }

  /**
   * Create a copy with custom style
   */
  withStyle(key: string, value: unknown): RenderObject {
    const newStyles = new Map(this.state.styles);
    newStyles.set(key, value);
    return this.withNewState({
      ...this.state,
      styles: newStyles,
    });
  }

  /**
   * Create a copy with new state (protected helper)
   */
  protected withNewState(newState: Partial<RenderObjectState>): RenderObject {
    return new (this.constructor as any)({
      ...this.state,
      ...newState,
    });
  }
}

/**
 * ============================================================================
 * Vector Object
 * ============================================================================
 */

/**
 * Vector graphics object (shapes, lines, curves)
 */
export class VectorObject extends RenderObject {
  constructor(
    state: RenderObjectState,
    public readonly geometryType: GeometryType,
    public readonly points: ReadonlyArray<Point3D>,
    public readonly stroke?: StrokeStyle,
    public readonly fill?: FillStyle,
  ) {
    super(state);
  }

  getState(): RenderObjectState {
    return { ...this.state };
  }

  withTransform(transform: Partial<Transform>): VectorObject {
    return new VectorObject(
      {
        ...this.state,
        transform: { ...this.state.transform, ...transform },
      },
      this.geometryType,
      this.points,
      this.stroke,
      this.fill,
    );
  }

  getBoundingBox(): BoundingBox {
    if (this.points.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        center: { x: 0, y: 0, z: 0 },
      };
    }

    const xs = this.points.map((p) => p.x);
    const ys = this.points.map((p) => p.y);
    const zs = this.points.map((p) => p.z);

    return {
      min: {
        x: Math.min(...xs),
        y: Math.min(...ys),
        z: Math.min(...zs),
      },
      max: {
        x: Math.max(...xs),
        y: Math.max(...ys),
        z: Math.max(...zs),
      },
      center: {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
        z: (Math.min(...zs) + Math.max(...zs)) / 2,
      },
    };
  }

  containsPoint(point: Point3D): boolean {
    // Simplified point-in-polygon test
    // Full implementation would use ray casting algorithm
    const bbox = this.getBoundingBox();
    return (
      point.x >= bbox.min.x &&
      point.x <= bbox.max.x &&
      point.y >= bbox.min.y &&
      point.y <= bbox.max.y
    );
  }

  /**
   * Create a circle
   */
  static circle(
    radius: number,
    center: Point3D = { x: 0, y: 0, z: 0 },
    stroke?: StrokeStyle,
    fill?: FillStyle,
  ): VectorObject {
    const points: Point3D[] = [];
    const segments = 64;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        z: center.z,
      });
    }

    return new VectorObject(
      {
        id: generateObjectId('circle'),
        transform: {
          position: center,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
        visible: true,
        z_index: 0,
        styles: new Map(),
        position: center,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      GeometryType.Circle,
      points,
      stroke,
      fill,
    );
  }

  /**
   * Create a rectangle
   */
  static rectangle(
    width: number,
    height: number,
    center: Point3D = { x: 0, y: 0, z: 0 },
    stroke?: StrokeStyle,
    fill?: FillStyle,
  ): VectorObject {
    const hw = width / 2;
    const hh = height / 2;

    return new VectorObject(
      {
        id: generateObjectId('rect'),
        transform: {
          position: center,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
        visible: true,
        z_index: 0,
        styles: new Map(),
        position: center,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      GeometryType.Rectangle,
      [
        { x: center.x - hw, y: center.y - hh, z: center.z },
        { x: center.x + hw, y: center.y - hh, z: center.z },
        { x: center.x + hw, y: center.y + hh, z: center.z },
        { x: center.x - hw, y: center.y + hh, z: center.z },
      ],
      stroke,
      fill,
    );
  }

  /**
   * Create a line
   */
  static line(start: Point3D, end: Point3D, stroke: StrokeStyle): VectorObject {
    return new VectorObject(
      {
        id: generateObjectId('line'),
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
        visible: true,
        z_index: 0,
        styles: new Map(),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      GeometryType.Line,
      [start, end],
      stroke,
    );
  }
}

/**
 * ============================================================================
 * Text Object
 * ============================================================================
 */

/**
 * Text render object
 */
export class TextObject extends RenderObject {
  constructor(
    state: RenderObjectState,
    public readonly text: string,
    public readonly font: FontConfig,
    public readonly color: string,
  ) {
    super(state);
  }

  getState(): RenderObjectState {
    return { ...this.state };
  }

  withTransform(transform: Partial<Transform>): TextObject {
    return new TextObject(
      {
        ...this.state,
        transform: { ...this.state.transform, ...transform },
      },
      this.text,
      this.font,
      this.color,
    );
  }

  getBoundingBox(): BoundingBox {
    // Simplified - actual implementation would measure text
    const estimatedWidth = this.text.length * this.font.size * 0.5;
    const estimatedHeight = this.font.size;

    const { position } = this.state.transform;

    return {
      min: {
        x: position.x - estimatedWidth / 2,
        y: position.y - estimatedHeight / 2,
        z: position.z,
      },
      max: {
        x: position.x + estimatedWidth / 2,
        y: position.y + estimatedHeight / 2,
        z: position.z,
      },
      center: position,
    };
  }

  containsPoint(point: Point3D): boolean {
    const bbox = this.getBoundingBox();
    return (
      point.x >= bbox.min.x &&
      point.x <= bbox.max.x &&
      point.y >= bbox.min.y &&
      point.y <= bbox.max.y
    );
  }

  /**
   * Create a text object
   */
  static create(text: string, font: FontConfig, color: string = '#ffffff'): TextObject {
    return new TextObject(
      {
        id: generateObjectId('text'),
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
        visible: true,
        z_index: 0,
        styles: new Map(),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      text,
      font,
      color,
    );
  }

  /**
   * Change the text
   */
  withText(newText: string): TextObject {
    return new TextObject(this.state, newText, this.font, this.color);
  }
}

/**
 * ============================================================================
 * Group Object
 * ============================================================================
 */

/**
 * Group of render objects - supports hierarchical structure
 */
export class GroupObject extends RenderObject {
  constructor(
    state: RenderObjectState,
    public readonly children: ReadonlyArray<RenderObject>,
  ) {
    super(state);
  }

  getState(): RenderObjectState {
    return { ...this.state };
  }

  withTransform(transform: Partial<Transform>): GroupObject {
    return new GroupObject(
      {
        ...this.state,
        transform: { ...this.state.transform, ...transform },
      },
      this.children,
    );
  }

  getBoundingBox(): BoundingBox {
    if (this.children.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        center: { x: 0, y: 0, z: 0 },
      };
    }

    const boxes = this.children.map((c) => c.getBoundingBox());

    return {
      min: {
        x: Math.min(...boxes.map((b) => b.min.x)),
        y: Math.min(...boxes.map((b) => b.min.y)),
        z: Math.min(...boxes.map((b) => b.min.z)),
      },
      max: {
        x: Math.max(...boxes.map((b) => b.max.x)),
        y: Math.max(...boxes.map((b) => b.max.y)),
        z: Math.max(...boxes.map((b) => b.max.z)),
      },
      center: {
        x: 0,
        y: 0,
        z: 0,
      },
    };
  }

  containsPoint(point: Point3D): boolean {
    return this.children.some((c) => c.containsPoint(point));
  }

  /**
   * Add a child object
   */
  addChild(child: RenderObject): GroupObject {
    return new GroupObject(this.state, [...this.children, child]);
  }

  /**
   * Remove a child by ID
   */
  removeChild(childId: ObjectId): GroupObject {
    return new GroupObject(
      this.state,
      this.children.filter((c) => c.getState().id !== childId),
    );
  }

  /**
   * Replace all children
   */
  withChildren(children: ReadonlyArray<RenderObject>): GroupObject {
    return new GroupObject(this.state, children);
  }

  /**
   * Create an empty group
   */
  static create(): GroupObject {
    return new GroupObject(
      {
        id: generateObjectId('group'),
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
        visible: true,
        z_index: 0,
        styles: new Map(),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      [],
    );
  }

  /**
   * Create a group from objects
   */
  static from(...objects: RenderObject[]): GroupObject {
    return GroupObject.create().withChildren(objects);
  }
}

/**
 * ============================================================================
 * Helper Functions
 * ============================================================================
 */

/**
 * Generate a unique object ID
 */
function generateObjectId(prefix: string = 'obj'): ObjectId {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ObjectId;
}

/**
 * Export generateObjectId for external use
 */
export { generateObjectId };
