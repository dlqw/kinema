/**
 * AniMaker Rendering Engine - Rectangle Renderer (Canvas 2D)
 *
 * Provides optimized rectangle rendering for Canvas 2D context.
 *
 * @module render.canvas.shapes
 */

import type { CanvasRenderer } from '../CanvasRenderer';

/**
 * Rectangle renderer options
 */
export interface RectangleOptions {
  /** Fill color */
  fill?: string;
  /** Stroke color */
  stroke?: string;
  /** Line width */
  lineWidth?: number;
  /** Corner radius */
  radius?: number | number[];
}

/**
 * Rectangle Renderer
 *
 * Optimized rectangle rendering for Canvas 2D.
 *
 * @example
 * ```typescript
 * const rectRenderer = new RectangleRenderer(renderer);
 *
 * rectRenderer.draw(10, 10, 100, 100, { fill: 'blue' });
 * rectRenderer.stroke(10, 10, 100, 100, { stroke: 'red', lineWidth: 2 });
 * ```
 */
export class RectangleRenderer {
  private renderer: CanvasRenderer;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  /**
   * Draw a rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param options - Rendering options
   */
  draw(x: number, y: number, width: number, height: number, options: RectangleOptions = {}): void {
    const ctx = this.renderer.getContext();

    ctx.beginPath();

    if (options.radius !== undefined) {
      if (typeof options.radius === 'number') {
        ctx.roundRect(x, y, width, height, options.radius);
      } else {
        ctx.roundRect(x, y, width, height, ...options.radius);
      }
    } else {
      ctx.rect(x, y, width, height);
    }

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
   * Draw a filled rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param color - Fill color
   */
  fill(x: number, y: number, width: number, height: number, color: string): void {
    this.draw(x, y, width, height, { fill: color });
  }

  /**
   * Draw a stroked rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param color - Stroke color
   * @param lineWidth - Line width (optional)
   */
  stroke(x: number, y: number, width: number, height: number, color: string, lineWidth?: number): void {
    this.draw(x, y, width, height, { stroke: color, lineWidth });
  }

  /**
   * Draw multiple rectangles efficiently
   *
   * @param rectangles - Array of rectangle definitions
   */
  drawBatch(rectangles: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    options?: RectangleOptions;
  }>): void {
    for (const rect of rectangles) {
      this.draw(rect.x, rect.y, rect.width, rect.height, rect.options || {});
    }
  }

  /**
   * Draw a rounded rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param radius - Corner radius
   * @param options - Rendering options
   */
  drawRounded(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options: RectangleOptions = {}
  ): void {
    this.draw(x, y, width, height, { ...options, radius });
  }

  /**
   * Draw a rectangle with gradient
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param color1 - Start gradient color
   * @param color2 - End gradient color
   * @param vertical - Whether gradient is vertical (default: horizontal)
   */
  drawGradient(
    x: number,
    y: number,
    width: number,
    height: number,
    color1: string,
    color2: string,
    vertical = false
  ): void {
    const ctx = this.renderer.getContext();
    const gradient = vertical
      ? ctx.createLinearGradient(x, y, x, y + height)
      : ctx.createLinearGradient(x, y, x + width, y);

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }

  /**
   * Draw a rectangle with shadow
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param color - Rectangle color
   * @param shadowOffsetX - Shadow X offset
   * @param shadowOffsetY - Shadow Y offset
   * @param shadowBlur - Shadow blur radius
   * @param shadowColor - Shadow color
   */
  drawWithShadow(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    shadowOffsetX = 5,
    shadowOffsetY = 5,
    shadowBlur = 10,
    shadowColor = 'rgba(0, 0, 0, 0.3)'
  ): void {
    const ctx = this.renderer.getContext();

    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.shadowBlur = shadowBlur;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  /**
   * Draw a bordered rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param fillColor - Fill color
   * @param borderColor - Border color
   * @param borderWidth - Border width
   */
  drawBordered(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    borderColor: string,
    borderWidth = 1
  ): void {
    this.draw(x, y, width, height, {
      fill: fillColor,
      stroke: borderColor,
      lineWidth: borderWidth,
    });
  }

  /**
   * Draw an outline rectangle (no fill)
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param color - Outline color
   * @param lineWidth - Line width (optional)
   */
  outline(x: number, y: number, width: number, height: number, color: string, lineWidth?: number): void {
    this.stroke(x, y, width, height, color, lineWidth);
  }
}
