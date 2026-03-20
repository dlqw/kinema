/**
 * AniMaker Rendering Engine - Canvas 2D Renderer
 *
 * This module provides a Canvas 2D rendering backend as a fallback
 * when WebGL/WebGPU is not available. It maintains API compatibility
 * with the GPU rendering pipeline.
 *
 * @module render.canvas
 */

import type { RenderContext } from '../core/RenderContext';

/**
 * Canvas renderer configuration
 */
export interface CanvasRendererConfig {
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Enable anti-aliasing */
  antialias?: boolean;
  /** Device pixel ratio */
  devicePixelRatio?: number;
  /** Background color */
  backgroundColor?: string;
  /** Enable debug rendering */
  debugMode?: boolean;
}

/**
 * Canvas renderer statistics
 */
export interface CanvasRendererStats {
  /** Number of draw calls */
  drawCalls: number;
  /** Number of shapes rendered */
  shapesRendered: number;
  /** Render time in milliseconds */
  renderTime: number;
}

/**
 * Canvas 2D Renderer
 *
 * Fallback renderer using Canvas 2D API when WebGL/WebGPU is unavailable.
 * Maintains API compatibility with GPU renderers.
 *
 * @example
 * ```typescript
 * const renderer = new CanvasRenderer({
 *   canvas: document.querySelector('canvas'),
 *   antialias: true,
 *   devicePixelRatio: window.devicePixelRatio,
 * });
 *
 * renderer.clear();
 * renderer.beginPath();
 * renderer.rect(10, 10, 100, 100);
 * renderer.fill();
 * ```
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<CanvasRendererConfig>;
  private stats: CanvasRendererStats = {
    drawCalls: 0,
    shapesRendered: 0,
    renderTime: 0,
  };
  private pixelRatio: number;
  private width: number;
  private height: number;

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a Canvas renderer
   *
   * @param config - Renderer configuration
   */
  constructor(config: CanvasRendererConfig) {
    this.config = {
      canvas: config.canvas,
      antialias: config.antialias ?? true,
      devicePixelRatio: config.devicePixelRatio ?? window.devicePixelRatio ?? 1,
      backgroundColor: config.backgroundColor ?? '#000000',
      debugMode: config.debugMode ?? false,
    };

    this.canvas = this.config.canvas;
    this.pixelRatio = Math.min(this.config.devicePixelRatio, 2);

    // Get 2D context
    const context = this.canvas.getContext('2d', {
      alpha: true,
      antialias: this.config.antialias,
    });

    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }

    this.ctx = context;

    // Initialize size
    this.updateSize();

    console.log('[CanvasRenderer] Created with config:', this.config);
  }

  // ==========================================================================
  // Canvas Operations
  // ==========================================================================

  /**
   * Clear the canvas
   *
   * @param color - Clear color (optional, uses background color if not specified)
   */
  clear(color?: string): void {
    const startTime = performance.now();

    this.ctx.fillStyle = color || this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.stats.renderTime += performance.now() - startTime;
  }

  /**
   * Begin a new path
   */
  beginPath(): void {
    this.ctx.beginPath();
  }

  /**
   * Close the current path
   */
  closePath(): void {
    this.ctx.closePath();
  }

  /**
   * Save the current state
   */
  save(): void {
    this.ctx.save();
  }

  /**
   * Restore the previous state
   */
  restore(): void {
    this.ctx.restore();
  }

  // ==========================================================================
  // Transformation
  // ==========================================================================

  /**
   * Translate the origin
   *
   * @param x - X translation
   * @param y - Y translation
   */
  translate(x: number, y: number): void {
    this.ctx.translate(x, y);
  }

  /**
   * Rotate the context
   *
   * @param angle - Rotation angle in radians
   */
  rotate(angle: number): void {
    this.ctx.rotate(angle);
  }

  /**
   * Scale the context
   *
   * @param x - X scale
   * @param y - Y scale
   */
  scale(x: number, y: number): void {
    this.ctx.scale(x, y);
  }

  /**
   * Transform the context
   *
   * @param a - Matrix component a
   * @param b - Matrix component b
   * @param c - Matrix component c
   * @param d - Matrix component d
   * @param e - Matrix component e
   * @param f - Matrix component f
   */
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.ctx.transform(a, b, c, d, e, f);
  }

  /**
   * Set transformation matrix
   *
   * @param matrix - 3x2 transformation matrix (flat array)
   */
  setTransform(matrix: number[]): void {
    this.ctx.setTransform(
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5]
    );
  }

  /**
   * Reset transformation to identity
   */
  resetTransform(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ==========================================================================
  // Style
  // ==========================================================================

  /**
   * Set fill style
   *
   * @param style - Fill color or gradient
   */
  setFillStyle(style: string | CanvasGradient | CanvasPattern): void {
    this.ctx.fillStyle = style;
  }

  /**
   * Set stroke style
   *
   * @param style - Stroke color or gradient
   */
  setStrokeStyle(style: string | CanvasGradient | CanvasPattern): void {
    this.ctx.strokeStyle = style;
  }

  /**
   * Set line width
   *
   * @param width - Line width in pixels
   */
  setLineWidth(width: number): void {
    this.ctx.lineWidth = width;
  }

  /**
   * Set line cap
   *
   * @param cap - Line cap style
   */
  setLineCap(cap: 'butt' | 'round' | 'square'): void {
    this.ctx.lineCap = cap;
  }

  /**
   * Set line join
   *
   * @param join - Line join style
   */
  setLineJoin(join: 'bevel' | 'round' | 'miter'): void {
    this.ctx.lineJoin = join;
  }

  /**
   * Set miter limit
   *
   * @param limit - Miter limit
   */
  setMiterLimit(limit: number): void {
    this.ctx.miterLimit = limit;
  }

  /**
   * Set line dash
   *
   * @param segments - Dash segments
   */
  setLineDash(segments: number[]): void {
    this.ctx.setLineDash(segments);
  }

  /**
   * Set line dash offset
   *
   * @param offset - Dash offset
   */
  setLineDashOffset(offset: number): void {
    this.ctx.lineDashOffset = offset;
  }

  /**
   * Set global alpha
   *
   * @param alpha - Alpha value (0-1)
   */
  setGlobalAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha;
  }

  /**
   * Set global composite operation
   *
   * @param operation - Composite operation
   */
  setGlobalCompositeOperation(operation: GlobalCompositeOperation): void {
    this.ctx.globalCompositeOperation = operation;
  }

  /**
   * Set shadow properties
   *
   * @param offsetX - Shadow X offset
   * @param offsetY - Shadow Y offset
   * @param blur - Shadow blur
   * @param color - Shadow color
   */
  setShadow(offsetX: number, offsetY: number, blur: number, color: string): void {
    this.ctx.shadowOffsetX = offsetX;
    this.ctx.shadowOffsetY = offsetY;
    this.ctx.shadowBlur = blur;
    this.ctx.shadowColor = color;
  }

  // ==========================================================================
  // Path Drawing
  // ==========================================================================

  /**
   * Move to point
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  moveTo(x: number, y: number): void {
    this.ctx.moveTo(x, y);
  }

  /**
   * Line to point
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  lineTo(x: number, y: number): void {
    this.ctx.lineTo(x, y);
  }

  /**
   * Bezier curve to point
   *
   * @param cp1x - Control point 1 X
   * @param cp1y - Control point 1 Y
   * @param cp2x - Control point 2 X
   * @param cp2y - Control point 2 Y
   * @param x - End point X
   * @param y - End point Y
   */
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  /**
   * Quadratic curve to point
   *
   * @param cpx - Control point X
   * @param cpy - Control point Y
   * @param x - End point X
   * @param y - End point Y
   */
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.ctx.quadraticCurveTo(cpx, cpy, x, y);
  }

  /**
   * Arc
   *
   * @param x - Center X
   * @param y - Center Y
   * @param radius - Radius
   * @param startAngle - Start angle in radians
   * @param endAngle - End angle in radians
   * @param counterclockwise - Direction
   */
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void {
    this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
  }

  /**
   * Arc to point
   *
   * @param x1 - X coordinate of first control point
   * @param y1 - Y coordinate of first control point
   * @param x2 - X coordinate of second control point
   * @param y2 - Y coordinate of second control point
   * @param radius - Arc radius
   */
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this.ctx.arcTo(x1, y1, x2, y2, radius);
  }

  /**
   * Ellipse
   *
   * @param x - Center X
   * @param y - Center Y
   * @param radiusX - X radius
   * @param radiusY - Y radius
   * @param rotation - Rotation in radians
   * @param startAngle - Start angle
   * @param endAngle - End angle
   * @param counterclockwise - Direction
   */
  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void {
    this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
  }

  /**
   * Rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   */
  rect(x: number, y: number, width: number, height: number): void {
    this.ctx.rect(x, y, width, height);
  }

  /**
   * Round rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param radii - Corner radii
   */
  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radii: number | number[]
  ): void {
    if (typeof radii === 'number') {
      this.ctx.roundRect(x, y, width, height, radii);
    } else {
      this.ctx.roundRect(x, y, width, height, ...radii);
    }
  }

  // ==========================================================================
  // Fill and Stroke
  // ==========================================================================

  /**
   * Fill the current path
   *
   * @param rule - Fill rule (nonzero or evenodd)
   */
  fill(rule?: 'nonzero' | 'evenodd'): void {
    const startTime = performance.now();
    this.ctx.fill(rule);
    this.stats.drawCalls++;
    this.stats.shapesRendered++;
    this.stats.renderTime += performance.now() - startTime;
  }

  /**
   * Stroke the current path
   */
  stroke(): void {
    const startTime = performance.now();
    this.ctx.stroke();
    this.stats.drawCalls++;
    this.stats.shapesRendered++;
    this.stats.renderTime += performance.now() - startTime;
  }

  /**
   * Clip the current path
   *
   * @param rule - Fill rule (nonzero or evenodd)
   */
  clip(rule?: 'nonzero' | 'evenodd'): void {
    this.ctx.clip(rule);
  }

  // ==========================================================================
  // Direct Shape Drawing
  // ==========================================================================

  /**
   * Fill rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   */
  fillRect(x: number, y: number, width: number, height: number): void {
    const startTime = performance.now();
    this.ctx.fillRect(x, y, width, height);
    this.stats.drawCalls++;
    this.stats.shapesRendered++;
    this.stats.renderTime += performance.now() - startTime;
  }

  /**
   * Stroke rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   */
  strokeRect(x: number, y: number, width: number, height: number): void {
    const startTime = performance.now();
    this.ctx.strokeRect(x, y, width, height);
    this.stats.drawCalls++;
    this.stats.shapesRendered++;
    this.stats.renderTime += performance.now() - startTime;
  }

  /**
   * Clear rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   */
  clearRect(x: number, y: number, width: number, height: number): void {
    this.ctx.clearRect(x, y, width, height);
  }

  /**
   * Draw image
   *
   * @param image - Image to draw
   * @param dx - Destination X
   * @param dy - Destination Y
   */
  drawImage(image: CanvasImageSource, dx: number, dy: number): void;

  /**
   * Draw image with dimensions
   *
   * @param image - Image to draw
   * @param dx - Destination X
   * @param dy - Destination Y
   * @param dWidth - Destination width
   * @param dHeight - Destination height
   */
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number
  ): void;

  /**
   * Draw image with source and destination rectangles
   *
   * @param image - Image to draw
   * @param sx - Source X
   * @param sy - Source Y
   * @param sWidth - Source width
   * @param sHeight - Source height
   * @param dx - Destination X
   * @param dy - Destination Y
   * @param dWidth - Destination width
   * @param dHeight - Destination height
   */
  drawImage(
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sWidth: number,
    sHeight: number,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number
  ): void;

  drawImage(...args: any[]): void {
    const startTime = performance.now();
    this.ctx.drawImage(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
    this.stats.drawCalls++;
    this.stats.shapesRendered++;
    this.stats.renderTime += performance.now() - startTime;
  }

  // ==========================================================================
  // Text
  // ==========================================================================

  /**
   * Fill text
   *
   * @param text - Text string
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param maxWidth - Maximum width (optional)
   */
  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    const startTime = performance.now();
    if (maxWidth !== undefined) {
      this.ctx.fillText(text, x, y, maxWidth);
    } else {
      this.ctx.fillText(text, x, y);
    }
    this.stats.drawCalls++;
    this.stats.shapesRendered++;
    this.stats.renderTime += performance.now() - startTime;
  }

  /**
   * Stroke text
   *
   * @param text - Text string
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param maxWidth - Maximum width (optional)
   */
  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    const startTime = performance.now();
    if (maxWidth !== undefined) {
      this.ctx.strokeText(text, x, y, maxWidth);
    } else {
      this.ctx.strokeText(text, x, y);
    }
    this.stats.drawCalls++;
    this.stats.shapesRendered++;
    this.stats.renderTime += performance.now() - startTime;
  }

  /**
   * Measure text
   *
   * @param text - Text string
   * @returns Text metrics
   */
  measureText(text: string): TextMetrics {
    return this.ctx.measureText(text);
  }

  // ==========================================================================
  // Gradients and Patterns
  // ==========================================================================

  /**
   * Create linear gradient
   *
   * @param x0 - Start X
   * @param y0 - Start Y
   * @param x1 - End X
   * @param y1 - End Y
   * @returns Linear gradient
   */
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    return this.ctx.createLinearGradient(x0, y0, x1, y1);
  }

  /**
   * Create radial gradient
   *
   * @param x0 - Start circle X
   * @param y0 - Start circle Y
   * @param r0 - Start circle radius
   * @param x1 - End circle X
   * @param y1 - End circle Y
   * @param r1 - End circle radius
   * @returns Radial gradient
   */
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): CanvasGradient {
    return this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  /**
   * Create conic gradient
   *
   * @param x - Center X
   * @param y - Center Y
   * @param startAngle - Start angle
   * @returns Conic gradient
   */
  createConicGradient(x: number, y: number, startAngle: number): CanvasGradient {
    return this.ctx.createConicGradient(x, y, startAngle);
  }

  /**
   * Create pattern
   *
   * @param image - Image to create pattern from
   * @param repetition - Repetition type
   * @returns Pattern
   */
  createPattern(
    image: CanvasImageSource,
    repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
  ): CanvasPattern | null {
    return this.ctx.createPattern(image, repetition);
  }

  // ==========================================================================
  // Pixel Operations
  // ==========================================================================

  /**
   * Get image data
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @returns Image data
   */
  getImageData(x: number, y: number, width: number, height: number): ImageData {
    return this.ctx.getImageData(x, y, width, height);
  }

  /**
   * Put image data
   *
   * @param imageData - Image data to put
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param dirtyX - Dirty X (optional)
   * @param dirtyY - Dirty Y (optional)
   * @param dirtyWidth - Dirty width (optional)
   * @param dirtyHeight - Dirty height (optional)
   */
  putImageData(
    imageData: ImageData,
    x: number,
    y: number,
    dirtyX?: number,
    dirtyY?: number,
    dirtyWidth?: number,
    dirtyHeight?: number
  ): void {
    if (dirtyX !== undefined) {
      this.ctx.putImageData(imageData, x, y, dirtyX, dirtyY, dirtyWidth!, dirtyHeight!);
    } else {
      this.ctx.putImageData(imageData, x, y);
    }
  }

  // ==========================================================================
  // Canvas Info
  // ==========================================================================

  /**
   * Get canvas width
   *
   * @returns Canvas width in pixels
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * Get canvas height
   *
   * @returns Canvas height in pixels
   */
  getHeight(): number {
    return this.height;
  }

  /**
   * Get canvas size
   *
   * @returns Canvas size [width, height]
   */
  getSize(): [number, number] {
    return [this.width, this.height];
  }

  /**
   * Get pixel ratio
   *
   * @returns Device pixel ratio
   */
  getPixelRatio(): number {
    return this.pixelRatio;
  }

  /**
   * Get rendering statistics
   *
   * @returns Statistics object
   */
  getStats(): CanvasRendererStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      drawCalls: 0,
      shapesRendered: 0,
      renderTime: 0,
    };
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Update canvas size
   */
  updateSize(): void {
    const clientWidth = this.canvas.clientWidth;
    const clientHeight = this.canvas.clientHeight;

    if (clientWidth > 0 && clientHeight > 0) {
      const newWidth = Math.floor(clientWidth * this.pixelRatio);
      const newHeight = Math.floor(clientHeight * this.pixelRatio);

      if (newWidth !== this.canvas.width || newHeight !== this.canvas.height) {
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.width = newWidth;
        this.height = newHeight;

        // Scale context to match pixel ratio
        this.ctx.scale(this.pixelRatio, this.pixelRatio);

        console.log(`[CanvasRenderer] Resized: ${newWidth}x${newHeight}`);
      }
    }
  }

  /**
   * Resize the canvas
   *
   * @param width - New width
   * @param height - New height
   */
  resize(width: number, height: number): void {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.updateSize();
  }

  /**
   * Destroy the renderer
   */
  destroy(): void {
    // Canvas context will be garbage collected
    console.log('[CanvasRenderer] Destroyed');
  }

  /**
   * Get the underlying 2D context
   *
   * @returns Canvas 2D context
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

// Re-export types
export type { CanvasRendererConfig, CanvasRendererStats };
