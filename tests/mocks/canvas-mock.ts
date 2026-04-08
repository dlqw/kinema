/**
 * Canvas Mock for testing
 * Provides mock implementations for Canvas 2D Context
 */

export class CanvasRenderingContext2DMock {
  private fills: string[] = [];
  private strokes: string[] = [];
  private transformsList: Array<{
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  }> = [];
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

  clearRect(_x: number, _y: number, _w: number, _h: number): void {
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

  moveTo(_x: number, _y: number): void {
    // Path operation
  }

  lineTo(_x: number, _y: number): void {
    // Path operation
  }

  quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void {
    // Path operation
  }

  bezierCurveTo(
    _cp1x: number,
    _cp1y: number,
    _cp2x: number,
    _cp2y: number,
    _x: number,
    _y: number,
  ): void {
    // Path operation
  }

  arc(
    _x: number,
    _y: number,
    _radius: number,
    _startAngle: number,
    _endAngle: number,
    _anticlockwise?: boolean,
  ): void {
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
    this.transformsList.push({ ...this.currentTransform });
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
    this.transformsList.push({ ...this.currentTransform });
  }

  scale(x: number, y: number): void {
    this.currentTransform.a *= x;
    this.currentTransform.b *= x;
    this.currentTransform.c *= y;
    this.currentTransform.d *= y;
    this.transformsList.push({ ...this.currentTransform });
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
    this.transformsList.push({ ...this.currentTransform });
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.currentTransform = { a, b, c, d, e, f };
    this.transformsList.push({ ...this.currentTransform });
  }

  resetTransform(): void {
    this.currentTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    this.transformsList.push({ ...this.currentTransform });
  }

  createLinearGradient(_x0: number, _y0: number, _x1: number, _y1: number): CanvasGradient {
    return {
      addColorStop(_offset: number, _color: string): void {
        // Mock implementation
      },
    };
  }

  createRadialGradient(
    _x0: number,
    _y0: number,
    _r0: number,
    _x1: number,
    _y1: number,
    _r1: number,
  ): CanvasGradient {
    return {
      addColorStop(_offset: number, _color: string): void {
        // Mock implementation
      },
    };
  }

  createPattern(_image: CanvasImageSource, _repetition: string): CanvasPattern {
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
    return [...this.transformsList];
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
    this.transformsList = [];
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
