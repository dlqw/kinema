/**
 * Canvas Mock for testing
 * Provides mock implementations for Canvas 2D Context
 */

export class CanvasRenderingContext2DMock {
  private fills: string[] = [];
  private strokes: string[] = [];
  private transforms: Array<{ a: number; b: number; c: number; d: number; e: number; f: number }> =
    [];
  private transformStack: Array<{
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  }> = [];

  // State properties
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth = 1;
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  globalAlpha = 1;
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  font = '10px sans-serif';
  textAlign: CanvasTextAlign = 'start';
  textBaseline: CanvasTextBaseline = 'alphabetic';

  // Current transform matrix
  private currentTransform = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
  };

  fillRect(x: number, y: number, w: number, h: number): void {
    this.fills.push(`fillRect(${x}, ${y}, ${w}, ${h})`);
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this.strokes.push(`strokeRect(${x}, ${y}, ${w}, ${h})`);
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    // Clear operation - no tracking needed
  }

  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    this.fills.push(`fillText("${text}", ${x}, ${y}${maxWidth ? `, ${maxWidth}` : ''})`);
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    this.strokes.push(`strokeText("${text}", ${x}, ${y}${maxWidth ? `, ${maxWidth}` : ''})`);
  }

  beginPath(): void {
    // Path operation
  }

  closePath(): void {
    // Path operation
  }

  moveTo(x: number, y: number): void {
    // Path operation
  }

  lineTo(x: number, y: number): void {
    // Path operation
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    // Path operation
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    // Path operation
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    // Path operation
  }

  fill(): void {
    this.fills.push('fill()');
  }

  stroke(): void {
    this.strokes.push('stroke()');
  }

  save(): void {
    this.transformStack.push({ ...this.currentTransform });
  }

  restore(): void {
    const saved = this.transformStack.pop();
    if (saved) {
      this.currentTransform = saved;
    }
  }

  translate(x: number, y: number): void {
    this.currentTransform.e += x;
    this.currentTransform.f += y;
    this.transforms.push({ ...this.currentTransform });
  }

  rotate(angle: number): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const { a, b, c, d, e, f } = this.currentTransform;
    this.currentTransform = {
      a: a * cos - c * sin,
      b: b * cos - d * sin,
      c: a * sin + c * cos,
      d: b * sin + d * cos,
      e,
      f,
    };
    this.transforms.push({ ...this.currentTransform });
  }

  scale(x: number, y: number): void {
    this.currentTransform.a *= x;
    this.currentTransform.b *= x;
    this.currentTransform.c *= y;
    this.currentTransform.d *= y;
    this.transforms.push({ ...this.currentTransform });
  }

  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    const current = this.currentTransform;
    this.currentTransform = {
      a: current.a * a + current.c * b,
      b: current.b * a + current.d * b,
      c: current.a * c + current.c * d,
      d: current.b * c + current.d * d,
      e: current.e + current.a * e + current.c * f,
      f: current.f + current.b * e + current.d * f,
    };
    this.transforms.push({ ...this.currentTransform });
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.currentTransform = { a, b, c, d, e, f };
    this.transforms.push({ ...this.currentTransform });
  }

  resetTransform(): void {
    this.currentTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    this.transforms.push({ ...this.currentTransform });
  }

  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    return {
      addColorStop(offset: number, color: string): void {
        // Mock implementation
      },
    };
  }

  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
    return {
      addColorStop(offset: number, color: string): void {
        // Mock implementation
      },
    };
  }

  createPattern(image: CanvasImageSource, repetition: string): CanvasPattern {
    return {} as CanvasPattern;
  }

  // Test helpers
  getFillCount(): number {
    return this.fills.length;
  }

  getStrokeCount(): number {
    return this.strokes.length;
  }

  getTransforms(): Array<{ a: number; b: number; c: number; d: number; e: number; f: number }> {
    return [...this.transforms];
  }

  getLastFill(): string | undefined {
    return this.fills[this.fills.length - 1];
  }

  getLastStroke(): string | undefined {
    return this.strokes[this.strokes.length - 1];
  }

  reset(): void {
    this.fills = [];
    this.strokes = [];
    this.transforms = [];
    this.transformStack = [];
    this.currentTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  }
}

export class CanvasMock {
  width = 800;
  height = 600;
  getContext(contextType: '2d'): CanvasRenderingContext2DMock | null {
    if (contextType === '2d') {
      return new CanvasRenderingContext2DMock();
    }
    return null;
  }
}
