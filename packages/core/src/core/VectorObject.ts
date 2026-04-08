/**
 * VectorObject - Vector graphics renderable object
 *
 * Represents vector graphics shapes like circles, rectangles, polygons,
 * lines, and curves. These objects are defined by a series of points
 * and can have stroke and fill styles.
 *
 * @module core/VectorObject
 */

import type {
  Point3D,
  BoundingBox,
  Transform,
  RenderObjectState,
  StrokeStyle,
  FillStyle,
} from '../types';
import { GeometryType } from '../types';
import { RenderObject } from './RenderObject';
import { boundingBoxFromPoints } from '../types/utils';

/**
 * VectorObject represents vector graphics defined by points.
 *
 * This class supports various geometric shapes and provides
 * factory methods for common shapes.
 *
 * @example
 * ```typescript
 * // Create a circle
 * const circle = VectorObject.circle(100, { x: 0, y: 0, z: 0 });
 *
 * // Create a rectangle
 * const rect = VectorObject.rectangle(200, 100);
 *
 * // Create with custom style
 * const styledRect = VectorObject.rectangle(
 *   200, 100,
 *   { x: 0, y: 0, z: 0 },
 *   { color: '#ff0000', width: 2 },
 *   { color: '#0000ff', opacity: 0.5 }
 * );
 * ```
 */
export class VectorObject extends RenderObject {
  /**
   * Creates a new VectorObject instance
   *
   * @param state - The render object state
   * @param geometryType - The type of geometry
   * @param points - Array of points defining the shape
   * @param stroke - Optional stroke style
   * @param fill - Optional fill style
   */
  constructor(
    state: RenderObjectState,
    public readonly geometryType: GeometryType,
    public readonly points: ReadonlyArray<Point3D>,
    public readonly stroke?: StrokeStyle,
    public readonly fill?: FillStyle,
  ) {
    super(state);
    Object.freeze(points);
  }

  // ==========================================================================
  // Required Abstract Methods Implementation
  // ==========================================================================

  /**
   * Get a copy of the current state
   */
  getState(): RenderObjectState {
    return { ...this.state };
  }

  /**
   * Create a new instance with the specified transform applied
   *
   * @param transform - Partial transform to apply
   * @returns A new VectorObject with the updated transform
   */
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

  /**
   * Calculate the bounding box of this vector object
   *
   * @returns The axis-aligned bounding box
   */
  getBoundingBox(): BoundingBox {
    return boundingBoxFromPoints(this.points);
  }

  /**
   * Check if a point is contained within this vector object
   *
   * Uses a simplified bounding box test. For more accurate
   * point-in-polygon testing, use pointInPolygon method.
   *
   * @param point - The point to test
   * @returns True if the point is inside the bounding box
   */
  containsPoint(point: Point3D): boolean {
    const bbox = this.getBoundingBox();
    return (
      point.x >= bbox.min.x &&
      point.x <= bbox.max.x &&
      point.y >= bbox.min.y &&
      point.y <= bbox.max.y
    );
  }

  // ==========================================================================
  // VectorObject Specific Methods
  // ==========================================================================

  /**
   * Get the number of points in this vector object
   */
  get pointCount(): number {
    return this.points.length;
  }

  /**
   * Get a point at the specified index
   *
   * @param index - The point index
   * @returns The point at the index, or undefined
   */
  getPoint(index: number): Point3D | undefined {
    return this.points[index];
  }

  /**
   * Create a copy with updated stroke style
   *
   * @param stroke - New stroke style
   * @returns A new VectorObject with the updated stroke
   */
  withStroke(stroke: StrokeStyle): VectorObject {
    return new VectorObject(this.state, this.geometryType, this.points, stroke, this.fill);
  }

  /**
   * Create a copy without stroke
   *
   * @returns A new VectorObject without stroke
   */
  withoutStroke(): VectorObject {
    return new VectorObject(this.state, this.geometryType, this.points, undefined, this.fill);
  }

  /**
   * Create a copy with updated fill style
   *
   * @param fill - New fill style
   * @returns A new VectorObject with the updated fill
   */
  withFill(fill: FillStyle): VectorObject {
    return new VectorObject(this.state, this.geometryType, this.points, this.stroke, fill);
  }

  /**
   * Create a copy without fill
   *
   * @returns A new VectorObject without fill
   */
  withoutFill(): VectorObject {
    return new VectorObject(this.state, this.geometryType, this.points, this.stroke, undefined);
  }

  /**
   * Create a copy with updated points
   *
   * @param points - New array of points
   * @returns A new VectorObject with the updated points
   */
  withPoints(points: ReadonlyArray<Point3D>): VectorObject {
    return new VectorObject(this.state, this.geometryType, points, this.stroke, this.fill);
  }

  /**
   * Check if this vector object has a stroke
   */
  hasStroke(): boolean {
    return this.stroke !== undefined;
  }

  /**
   * Check if this vector object has a fill
   */
  hasFill(): boolean {
    return this.fill !== undefined;
  }

  // ==========================================================================
  // Factory Methods - Common Shapes
  // ==========================================================================

  /**
   * Create a circle
   *
   * @param radius - Circle radius
   * @param center - Center position (default: origin)
   * @param stroke - Optional stroke style
   * @param fill - Optional fill style
   * @returns A new VectorObject representing a circle
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
      RenderObject.createDefaultState({
        transform: {
          position: center,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
      }),
      GeometryType.Circle,
      points,
      stroke,
      fill,
    );
  }

  /**
   * Create an ellipse
   *
   * @param radiusX - Horizontal radius
   * @param radiusY - Vertical radius
   * @param center - Center position (default: origin)
   * @param stroke - Optional stroke style
   * @param fill - Optional fill style
   * @returns A new VectorObject representing an ellipse
   */
  static ellipse(
    radiusX: number,
    radiusY: number,
    center: Point3D = { x: 0, y: 0, z: 0 },
    stroke?: StrokeStyle,
    fill?: FillStyle,
  ): VectorObject {
    const points: Point3D[] = [];
    const segments = 64;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push({
        x: center.x + radiusX * Math.cos(angle),
        y: center.y + radiusY * Math.sin(angle),
        z: center.z,
      });
    }

    return new VectorObject(
      RenderObject.createDefaultState({
        transform: {
          position: center,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
      }),
      GeometryType.Ellipse,
      points,
      stroke,
      fill,
    );
  }

  /**
   * Create a rectangle
   *
   * @param width - Rectangle width
   * @param height - Rectangle height
   * @param center - Center position (default: origin)
   * @param stroke - Optional stroke style
   * @param fill - Optional fill style
   * @returns A new VectorObject representing a rectangle
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
      RenderObject.createDefaultState({
        transform: {
          position: center,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
      }),
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
   * Create a square
   *
   * @param size - Square side length
   * @param center - Center position (default: origin)
   * @param stroke - Optional stroke style
   * @param fill - Optional fill style
   * @returns A new VectorObject representing a square
   */
  static square(
    size: number,
    center: Point3D = { x: 0, y: 0, z: 0 },
    stroke?: StrokeStyle,
    fill?: FillStyle,
  ): VectorObject {
    return VectorObject.rectangle(size, size, center, stroke, fill);
  }

  /**
   * Create a regular polygon
   *
   * @param sides - Number of sides (minimum 3)
   * @param radius - Distance from center to vertices
   * @param center - Center position (default: origin)
   * @param stroke - Optional stroke style
   * @param fill - Optional fill style
   * @returns A new VectorObject representing a regular polygon
   */
  static polygon(
    sides: number,
    radius: number,
    center: Point3D = { x: 0, y: 0, z: 0 },
    stroke?: StrokeStyle,
    fill?: FillStyle,
  ): VectorObject {
    if (sides < 3) {
      throw new Error('Polygon must have at least 3 sides');
    }

    const points: Point3D[] = [];

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        z: center.z,
      });
    }

    return new VectorObject(
      RenderObject.createDefaultState({
        transform: {
          position: center,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
      }),
      GeometryType.Polygon,
      points,
      stroke,
      fill,
    );
  }

  /**
   * Create a triangle
   *
   * @param size - Distance from center to vertices
   * @param center - Center position (default: origin)
   * @param stroke - Optional stroke style
   * @param fill - Optional fill style
   * @returns A new VectorObject representing a triangle
   */
  static triangle(
    size: number,
    center: Point3D = { x: 0, y: 0, z: 0 },
    stroke?: StrokeStyle,
    fill?: FillStyle,
  ): VectorObject {
    return VectorObject.polygon(3, size, center, stroke, fill);
  }

  /**
   * Create a line
   *
   * @param start - Start point
   * @param end - End point
   * @param stroke - Stroke style (required)
   * @returns A new VectorObject representing a line
   */
  static line(start: Point3D, end: Point3D, stroke: StrokeStyle): VectorObject {
    return new VectorObject(
      RenderObject.createDefaultState(),
      GeometryType.Line,
      [start, end],
      stroke,
    );
  }

  /**
   * Create a path from points
   *
   * @param points - Array of points defining the path
   * @param stroke - Stroke style (required)
   * @param close - Whether to close the path (default: false)
   * @returns A new VectorObject representing a path
   */
  static path(
    points: ReadonlyArray<Point3D>,
    stroke: StrokeStyle,
    close: boolean = false,
  ): VectorObject {
    const pathPoints = close && points.length > 2 ? [...points, points[0]!] : points;

    return new VectorObject(
      RenderObject.createDefaultState(),
      GeometryType.Curve,
      pathPoints,
      stroke,
    );
  }

  /**
   * Create an arc
   *
   * @param radius - Arc radius
   * @param startAngle - Start angle in radians
   * @param endAngle - End angle in radians
   * @param center - Center position (default: origin)
   * @param stroke - Stroke style (required)
   * @returns A new VectorObject representing an arc
   */
  static arc(
    radius: number,
    startAngle: number,
    endAngle: number,
    center: Point3D = { x: 0, y: 0, z: 0 },
    stroke: StrokeStyle,
  ): VectorObject {
    const points: Point3D[] = [];
    const segments = 32;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + t * (endAngle - startAngle);
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        z: center.z,
      });
    }

    return new VectorObject(
      RenderObject.createDefaultState({
        transform: {
          position: center,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
      }),
      GeometryType.Arc,
      points,
      stroke,
    );
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get a JSON-serializable representation
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      geometryType: this.geometryType,
      pointCount: this.points.length,
      hasStroke: this.hasStroke(),
      hasFill: this.hasFill(),
    };
  }
}

/**
 * Default export
 */
export default VectorObject;
