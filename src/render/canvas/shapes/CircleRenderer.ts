/**
 * AniMaker Rendering Engine - Circle Renderer (Canvas 2D)
 *
 * Provides optimized circle rendering for Canvas 2D context.
 *
 * @module render.canvas.shapes
 */

import type { CanvasRenderer } from '../CanvasRenderer';

/**
 * Circle renderer options
 */
export interface CircleOptions {
  /** Fill color */
  fill?: string;
  /** Stroke color */
  stroke?: string;
  /** Line width */
  lineWidth?: number;
  /** Start angle in radians (optional) */
  startAngle?: number;
  /** End angle in radians (optional) */
  endAngle?: number;
  /** Draw counterclockwise */
  counterclockwise?: boolean;
}

/**
 * Circle Renderer
 *
 * Optimized circle rendering for Canvas 2D.
 *
 * @example
 * ```typescript
 * const circleRenderer = new CircleRenderer(renderer);
 *
 * circleRenderer.draw(100, 100, 50, { fill: 'red' });
 * circleRenderer.stroke(200, 200, 30, { stroke: 'blue', lineWidth: 2 });
 * ```
 */
export class CircleRenderer {
  private renderer: CanvasRenderer;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  /**
   * Draw a filled circle
   *
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radius - Circle radius
   * @param options - Rendering options
   */
  draw(x: number, y: number, radius: number, options: CircleOptions = {}): void {
    const ctx = this.renderer.getContext();
    const startAngle = options.startAngle ?? 0;
    const endAngle = options.endAngle ?? Math.PI * 2;
    const counterclockwise = options.counterclockwise ?? false;

    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);

    if (options.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill();
    }

    if (options.stroke) {
      ctx.strokeStyle = options.stroke;
      ctx.lineWidth = options.lineWidth ?? 1;
      ctx.stroke();
    }
  }

  /**
   * Draw a filled circle
   *
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radius - Circle radius
   * @param color - Fill color
   */
  fill(x: number, y: number, radius: number, color: string): void {
    this.draw(x, y, radius, { fill: color });
  }

  /**
   * Draw a stroked circle
   *
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radius - Circle radius
   * @param color - Stroke color
   * @param lineWidth - Line width (optional)
   */
  stroke(x: number, y: number, radius: number, color: string, lineWidth?: number): void {
    this.draw(x, y, radius, { stroke: color, lineWidth });
  }

  /**
   * Draw multiple circles efficiently
   *
   * @param circles - Array of circle definitions
   */
  drawBatch(circles: Array<{
    x: number;
    y: number;
    radius: number;
    options?: CircleOptions;
  }>): void {
    for (const circle of circles) {
      this.draw(circle.x, circle.y, circle.radius, circle.options || {});
    }
  }

  /**
   * Draw an arc segment
   *
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radius - Circle radius
   * @param startAngle - Start angle in radians
   * @param endAngle - End angle in radians
   * @param options - Rendering options
   */
  drawArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    options: CircleOptions = {}
  ): void {
    this.draw(x, y, radius, {
      ...options,
      startAngle,
      endAngle,
    });
  }

  /**
   * Draw an ellipse
   *
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radiusX - Horizontal radius
   * @param radiusY - Vertical radius
   * @param rotation - Rotation in radians
   * @param options - Rendering options
   */
  drawEllipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation = 0,
    options: CircleOptions = {}
  ): void {
    const ctx = this.renderer.getContext();
    const startAngle = options.startAngle ?? 0;
    const endAngle = options.endAngle ?? Math.PI * 2;
    const counterclockwise = options.counterclockwise ?? false;

    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);

    if (options.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill();
    }

    if (options.stroke) {
      ctx.strokeStyle = options.stroke;
      ctx.lineWidth = options.lineWidth ?? 1;
      ctx.stroke();
    }
  }

  /**
   * Draw a filled pie slice
   *
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radius - Circle radius
   * @param startAngle - Start angle in radians
   * @param endAngle - End angle in radians
   * @param color - Fill color
   */
  fillPieSlice(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: string
  ): void {
    this.drawArc(x, y, radius, startAngle, endAngle, { fill: color });
  }

  /**
   * Draw a circle gradient
   *
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radius - Circle radius
   * @param innerColor - Inner gradient color
   * @param outerColor - Outer gradient color
   */
  drawGradient(
    x: number,
    y: number,
    radius: number,
    innerColor: string,
    outerColor: string
  ): void {
    const ctx = this.renderer.getContext();
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(1, outerColor);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}
