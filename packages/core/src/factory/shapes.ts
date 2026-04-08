/**
 * Shape Factory - Convenient factory functions for creating shapes
 *
 * Provides simplified API for creating common geometric shapes.
 *
 * @module factory/shapes
 */

import type { Point3D, StrokeStyle, FillStyle } from '../types';
import { VectorObject } from '../core';

/**
 * Create a circle
 *
 * @param radius - Circle radius
 * @param options - Optional configuration
 * @returns A new VectorObject representing a circle
 *
 * @example
 * ```typescript
 * const circle = Circle(50);
 * const redCircle = Circle(50, { stroke: { color: 'red', width: 2 } });
 * const filledCircle = Circle(50, {
 *   stroke: { color: 'white', width: 2 },
 *   fill: { color: 'blue', opacity: 0.5 }
 * });
 * ```
 */
export function Circle(
  radius: number,
  options: {
    position?: Point3D;
    stroke?: StrokeStyle;
    fill?: FillStyle;
  } = {},
): VectorObject {
  return VectorObject.circle(
    radius,
    options.position ?? { x: 0, y: 0, z: 0 },
    options.stroke,
    options.fill,
  );
}

/**
 * Create an ellipse
 *
 * @param radiusX - Horizontal radius
 * @param radiusY - Vertical radius
 * @param options - Optional configuration
 * @returns A new VectorObject representing an ellipse
 *
 * @example
 * ```typescript
 * const ellipse = Ellipse(80, 50);
 * const wideEllipse = Ellipse(100, 30, { fill: { color: 'green', opacity: 0.8 } });
 * ```
 */
export function Ellipse(
  radiusX: number,
  radiusY: number,
  options: {
    position?: Point3D;
    stroke?: StrokeStyle;
    fill?: FillStyle;
  } = {},
): VectorObject {
  return VectorObject.ellipse(
    radiusX,
    radiusY,
    options.position ?? { x: 0, y: 0, z: 0 },
    options.stroke,
    options.fill,
  );
}

/**
 * Create a rectangle
 *
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param options - Optional configuration
 * @returns A new VectorObject representing a rectangle
 *
 * @example
 * ```typescript
 * const rect = Rectangle(100, 50);
 * const styledRect = Rectangle(200, 100, {
 *   stroke: { color: '#333', width: 2 },
 *   fill: { color: '#f0f0f0', opacity: 1 }
 * });
 * ```
 */
export function Rectangle(
  width: number,
  height: number,
  options: {
    position?: Point3D;
    stroke?: StrokeStyle;
    fill?: FillStyle;
  } = {},
): VectorObject {
  return VectorObject.rectangle(
    width,
    height,
    options.position ?? { x: 0, y: 0, z: 0 },
    options.stroke,
    options.fill,
  );
}

/**
 * Create a square
 *
 * @param size - Square side length
 * @param options - Optional configuration
 * @returns A new VectorObject representing a square
 *
 * @example
 * ```typescript
 * const square = Square(100);
 * const blueSquare = Square(50, { fill: { color: 'blue', opacity: 1 } });
 * ```
 */
export function Square(
  size: number,
  options: {
    position?: Point3D;
    stroke?: StrokeStyle;
    fill?: FillStyle;
  } = {},
): VectorObject {
  return VectorObject.square(
    size,
    options.position ?? { x: 0, y: 0, z: 0 },
    options.stroke,
    options.fill,
  );
}

/**
 * Create a regular polygon
 *
 * @param sides - Number of sides (minimum 3)
 * @param radius - Distance from center to vertices
 * @param options - Optional configuration
 * @returns A new VectorObject representing a polygon
 *
 * @example
 * ```typescript
 * const pentagon = Polygon(5, 50);
 * const hexagon = Polygon(6, 60, { stroke: { color: 'orange', width: 3 } });
 * ```
 */
export function Polygon(
  sides: number,
  radius: number,
  options: {
    position?: Point3D;
    stroke?: StrokeStyle;
    fill?: FillStyle;
  } = {},
): VectorObject {
  return VectorObject.polygon(
    sides,
    radius,
    options.position ?? { x: 0, y: 0, z: 0 },
    options.stroke,
    options.fill,
  );
}

/**
 * Create a triangle
 *
 * @param size - Distance from center to vertices
 * @param options - Optional configuration
 * @returns A new VectorObject representing a triangle
 *
 * @example
 * ```typescript
 * const triangle = Triangle(50);
 * const filledTriangle = Triangle(60, { fill: { color: 'yellow', opacity: 0.7 } });
 * ```
 */
export function Triangle(
  size: number,
  options: {
    position?: Point3D;
    stroke?: StrokeStyle;
    fill?: FillStyle;
  } = {},
): VectorObject {
  return VectorObject.triangle(
    size,
    options.position ?? { x: 0, y: 0, z: 0 },
    options.stroke,
    options.fill,
  );
}

/**
 * Create a line
 *
 * @param start - Start point
 * @param end - End point
 * @param stroke - Stroke style (required)
 * @returns A new VectorObject representing a line
 *
 * @example
 * ```typescript
 * const line = Line(
 *   { x: -50, y: 0, z: 0 },
 *   { x: 50, y: 0, z: 0 },
 *   { color: 'white', width: 2 }
 * );
 * ```
 */
export function Line(start: Point3D, end: Point3D, stroke: StrokeStyle): VectorObject {
  return VectorObject.line(start, end, stroke);
}

/**
 * Create a path from points
 *
 * @param points - Array of points defining the path
 * @param stroke - Stroke style (required)
 * @param close - Whether to close the path (default: false)
 * @returns A new VectorObject representing a path
 *
 * @example
 * ```typescript
 * const path = Path(
 *   [
 *     { x: 0, y: 0, z: 0 },
 *     { x: 50, y: 50, z: 0 },
 *     { x: 100, y: 0, z: 0 }
 *   ],
 *   { color: 'cyan', width: 2 }
 * );
 * const closedPath = Path(points, { color: 'white', width: 1 }, true);
 * ```
 */
export function Path(
  points: ReadonlyArray<Point3D>,
  stroke: StrokeStyle,
  close: boolean = false,
): VectorObject {
  return VectorObject.path(points, stroke, close);
}

/**
 * Create an arc
 *
 * @param radius - Arc radius
 * @param startAngle - Start angle in radians
 * @param endAngle - End angle in radians
 * @param stroke - Stroke style (required)
 * @param options - Optional configuration
 * @returns A new VectorObject representing an arc
 *
 * @example
 * ```typescript
 * const arc = Arc(50, 0, Math.PI, { color: 'white', width: 2 });
 * const halfCircle = Arc(50, 0, Math.PI, { color: 'yellow', width: 3 });
 * ```
 */
export function Arc(
  radius: number,
  startAngle: number,
  endAngle: number,
  stroke: StrokeStyle,
  options: {
    position?: Point3D;
  } = {},
): VectorObject {
  return VectorObject.arc(
    radius,
    startAngle,
    endAngle,
    options.position ?? { x: 0, y: 0, z: 0 },
    stroke,
  );
}

// ============================================================================
// Color Presets
// ============================================================================

/**
 * Common color presets
 */
export const Colors = {
  white: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  orange: '#ff8000',
  purple: '#8000ff',
  gray: '#808080',
  lightGray: '#c0c0c0',
  darkGray: '#404040',
} as const;

/**
 * Create a stroke style
 *
 * @param color - Stroke color
 * @param width - Stroke width
 * @param opacity - Optional opacity
 * @returns Stroke style object
 */
export function Stroke(color: string, width: number = 1, opacity?: number): StrokeStyle {
  return opacity !== undefined ? { color, width, opacity } : { color, width };
}

/**
 * Create a fill style
 *
 * @param color - Fill color
 * @param opacity - Opacity (default: 1)
 * @returns Fill style object
 */
export function Fill(color: string, opacity: number = 1): FillStyle {
  return { color, opacity };
}

// ============================================================================
// Default export
// ============================================================================

export default {
  Circle,
  Ellipse,
  Rectangle,
  Square,
  Polygon,
  Triangle,
  Line,
  Path,
  Arc,
  Colors,
  Stroke,
  Fill,
};
