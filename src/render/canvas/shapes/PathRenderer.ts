/**
 * AniMaker Rendering Engine - Path Renderer (Canvas 2D)
 *
 * Provides optimized path rendering for Canvas 2D context.
 *
 * @module render.canvas.shapes
 */

import type { CanvasRenderer } from '../CanvasRenderer';

/**
 * Path command types
 */
export type PathCommand =
  | { type: 'move'; x: number; y: number }
  | { type: 'line'; x: number; y: number }
  | { type: 'bezier'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number }
  | { type: 'quadratic'; cpx: number; cpy: number; x: number; y: number }
  | { type: 'arc'; x: number; y: number; radius: number; startAngle: number; endAngle: number; counterclockwise?: boolean }
  | { type: 'close' };

/**
 * Path renderer options
 */
export interface PathOptions {
  /** Fill color */
  fill?: string;
  /** Stroke color */
  stroke?: string;
  /** Line width */
  lineWidth?: number;
  /** Line cap style */
  lineCap?: 'butt' | 'round' | 'square';
  /** Line join style */
  lineJoin?: 'bevel' | 'round' | 'miter';
  /** Miter limit */
  miterLimit?: number;
  /** Line dash pattern */
  lineDash?: number[];
  /** Line dash offset */
  lineDashOffset?: number;
}

/**
 * Path Renderer
 *
 * Optimized path rendering for Canvas 2D.
 *
 * @example
 * ```typescript
 * const pathRenderer = new PathRenderer(renderer);
 *
 * // Create a triangle path
 * pathRenderer.draw([
 *   { type: 'move', x: 100, y: 100 },
 *   { type: 'line', x: 200, y: 200 },
 *   { type: 'line', x: 0, y: 200 },
 *   { type: 'close' },
 * ], { fill: 'green' });
 * ```
 */
export class PathRenderer {
  private renderer: CanvasRenderer;
  private currentPath: PathCommand[] = [];

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  /**
   * Draw a path from commands
   *
   * @param commands - Array of path commands
   * @param options - Rendering options
   */
  draw(commands: PathCommand[], options: PathOptions = {}): void {
    const ctx = this.renderer.getContext();

    ctx.save();

    // Apply path styles
    if (options.lineWidth !== undefined) {
      ctx.lineWidth = options.lineWidth;
    }
    if (options.lineCap) {
      ctx.lineCap = options.lineCap;
    }
    if (options.lineJoin) {
      ctx.lineJoin = options.lineJoin;
    }
    if (options.miterLimit !== undefined) {
      ctx.miterLimit = options.miterLimit;
    }
    if (options.lineDash) {
      ctx.setLineDash(options.lineDash);
    }
    if (options.lineDashOffset !== undefined) {
      ctx.lineDashOffset = options.lineDashOffset;
    }

    // Build path
    ctx.beginPath();
    for (const cmd of commands) {
      this.executeCommand(ctx, cmd);
    }

    // Render
    if (options.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill();
    }
    if (options.stroke) {
      ctx.strokeStyle = options.stroke;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Begin a new path
   */
  begin(): void {
    this.currentPath = [];
  }

  /**
   * Add a move command
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  moveTo(x: number, y: number): void {
    this.currentPath.push({ type: 'move', x, y });
  }

  /**
   * Add a line command
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  lineTo(x: number, y: number): void {
    this.currentPath.push({ type: 'line', x, y });
  }

  /**
   * Add a bezier curve command
   *
   * @param cp1x - First control point X
   * @param cp1y - First control point Y
   * @param cp2x - Second control point X
   * @param cp2y - Second control point Y
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
    this.currentPath.push({
      type: 'bezier',
      cp1x,
      cp1y,
      cp2x,
      cp2y,
      x,
      y,
    });
  }

  /**
   * Add a quadratic curve command
   *
   * @param cpx - Control point X
   * @param cpy - Control point Y
   * @param x - End point X
   * @param y - End point Y
   */
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.currentPath.push({ type: 'quadratic', cpx, cpy, x, y });
  }

  /**
   * Add an arc command
   *
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
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
    counterclockwise = false
  ): void {
    this.currentPath.push({
      type: 'arc',
      x,
      y,
      radius,
      startAngle,
      endAngle,
      counterclockwise,
    });
  }

  /**
   * Close the current path
   */
  close(): void {
    this.currentPath.push({ type: 'close' });
  }

  /**
   * Fill the current path
   *
   * @param color - Fill color
   */
  fill(color: string): void {
    this.draw(this.currentPath, { fill: color });
  }

  /**
   * Stroke the current path
   *
   * @param color - Stroke color
   * @param lineWidth - Line width (optional)
   */
  stroke(color: string, lineWidth?: number): void {
    this.draw(this.currentPath, { stroke: color, lineWidth });
  }

  /**
   * Clear the current path
   */
  clear(): void {
    this.currentPath = [];
  }

  /**
   * Get the current path commands
   *
   * @returns Array of path commands
   */
  getPath(): PathCommand[] {
    return [...this.currentPath];
  }

  /**
   * Execute a path command on a context
   *
   * @param ctx - Canvas context
   * @param cmd - Path command
   */
  private executeCommand(ctx: CanvasRenderingContext2D, cmd: PathCommand): void {
    switch (cmd.type) {
      case 'move':
        ctx.moveTo(cmd.x, cmd.y);
        break;
      case 'line':
        ctx.lineTo(cmd.x, cmd.y);
        break;
      case 'bezier':
        ctx.bezierCurveTo(cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y);
        break;
      case 'quadratic':
        ctx.quadraticCurveTo(cmd.cpx, cmd.cpy, cmd.x, cmd.y);
        break;
      case 'arc':
        ctx.arc(
          cmd.x,
          cmd.y,
          cmd.radius,
          cmd.startAngle,
          cmd.endAngle,
          cmd.counterclockwise ?? false
        );
        break;
      case 'close':
        ctx.closePath();
        break;
    }
  }

  /**
   * Draw a polygon
   *
   * @param points - Array of [x, y] coordinates
   * @param options - Rendering options
   */
  drawPolygon(points: [number, number][], options: PathOptions = {}): void {
    const commands: PathCommand[] = [];

    // Move to first point
    if (points.length > 0) {
      commands.push({ type: 'move', x: points[0][0], y: points[0][1] });

      // Line to remaining points
      for (let i = 1; i < points.length; i++) {
        commands.push({ type: 'line', x: points[i][0], y: points[i][1] });
      }

      // Close path
      commands.push({ type: 'close' });
    }

    this.draw(commands, options);
  }

  /**
   * Draw a regular polygon
   *
   * @param cx - Center X coordinate
   * @param cy - Center Y coordinate
   * @param sides - Number of sides
   * @param radius - Radius
   * @param rotation - Rotation in radians (optional)
   * @param options - Rendering options
   */
  drawRegularPolygon(
    cx: number,
    cy: number,
    sides: number,
    radius: number,
    rotation = 0,
    options: PathOptions = {}
  ): void {
    const commands: PathCommand[] = [];
    const angleStep = (Math.PI * 2) / sides;

    // First point
    const x0 = cx + radius * Math.cos(rotation);
    const y0 = cy + radius * Math.sin(rotation);
    commands.push({ type: 'move', x: x0, y: y0 });

    // Remaining points
    for (let i = 1; i < sides; i++) {
      const angle = rotation + i * angleStep;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      commands.push({ type: 'line', x, y });
    }

    commands.push({ type: 'close' });

    this.draw(commands, options);
  }

  /**
   * Draw a star shape
   *
   * @param cx - Center X coordinate
   * @param cy - Center Y coordinate
   * @param points - Number of points
   * @param outerRadius - Outer radius
   * @param innerRadius - Inner radius
   * @param rotation - Rotation in radians (optional)
   * @param options - Rendering options
   */
  drawStar(
    cx: number,
    cy: number,
    points: number,
    outerRadius: number,
    innerRadius: number,
    rotation = 0,
    options: PathOptions = {}
  ): void {
    const commands: PathCommand[] = [];
    const angleStep = Math.PI / points;

    // First point (outer)
    let angle = rotation;
    commands.push({
      type: 'move',
      x: cx + outerRadius * Math.cos(angle),
      y: cy + outerRadius * Math.sin(angle),
    });

    // Remaining points (alternating inner/outer)
    for (let i = 0; i < points; i++) {
      // Inner point
      angle += angleStep;
      commands.push({
        type: 'line',
        x: cx + innerRadius * Math.cos(angle),
        y: cy + innerRadius * Math.sin(angle),
      });

      // Outer point
      angle += angleStep;
      commands.push({
        type: 'line',
        x: cx + outerRadius * Math.cos(angle),
        y: cy + outerRadius * Math.sin(angle),
      });
    }

    commands.push({ type: 'close' });

    this.draw(commands, options);
  }

  /**
   * Draw a dashed path
   *
   * @param commands - Path commands
   * @param strokeColor - Stroke color
   * @param dashPattern - Dash pattern [dash, gap, ...]
   */
  drawDashed(commands: PathCommand[], strokeColor: string, dashPattern: number[]): void {
    this.draw(commands, {
      stroke: strokeColor,
      lineDash: dashPattern,
    });
  }

  /**
   * Draw a curved line through points
   *
   * @param points - Array of [x, y] coordinates
   * @param tension - Curve tension (0-1)
   * @param options - Rendering options
   */
  drawCurve(
    points: [number, number][],
    tension = 0.5,
    options: PathOptions = {}
  ): void {
    if (points.length < 2) {
      return;
    }

    const commands: PathCommand[] = [];

    // Move to first point
    commands.push({ type: 'move', x: points[0][0], y: points[0][1] });

    // Draw curves through points
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Catmull-Rom spline control points
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;

      commands.push({
        type: 'bezier',
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        x: p2[0],
        y: p2[1],
      });
    }

    this.draw(commands, options);
  }

  /**
   * Draw an arrow
   *
   * @param fromX - Start X coordinate
   * @param fromY - Start Y coordinate
   * @param toX - End X coordinate
   * @param toY - End Y coordinate
   * @param headLength - Arrow head length
   * @param options - Rendering options
   */
  drawArrow(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    headLength = 10,
    options: PathOptions = {}
  ): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const headAngle = Math.PI / 6;

    const commands: PathCommand[] = [
      { type: 'move', x: fromX, y: fromY },
      { type: 'line', x: toX, y: toY },
      {
        type: 'line',
        x: toX - headLength * Math.cos(angle - headAngle),
        y: toY - headLength * Math.sin(angle - headAngle),
      },
      {
        type: 'move',
        x: toX,
        y: toY,
      },
      {
        type: 'line',
        x: toX - headLength * Math.cos(angle + headAngle),
        y: toY - headLength * Math.sin(angle + headAngle),
      },
    ];

    this.draw(commands, { ...options, fill: undefined });
  }
}
