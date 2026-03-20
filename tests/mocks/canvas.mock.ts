/**
 * Canvas and DOM mock utilities for testing
 * Provides HTMLCanvasElement and related APIs for Node.js test environment
 */

import { vi } from 'vitest';

export function setupCanvasMock() {
  // Mock HTMLCanvasElement
  class MockCanvasRenderingContext2D {
    fillStyle = '';
    strokeStyle = '';
    lineWidth = 1;
    lineCap = 'butt' as const;
    lineJoin = 'miter' as const;
    miterLimit = 10;
    globalAlpha = 1;
    globalCompositeOperation = 'source-over' as const;
    shadowBlur = 0;
    shadowColor = 'rgba(0,0,0,0)';
    shadowOffsetX = 0;
    shadowOffsetY = 0;
    font = '10px sans-serif';
    textAlign = 'start' as const;
    textBaseline = 'alphabetic' as const;
    direction = 'ltr' as const;

    // Transformation matrix
    private transform = [1, 0, 0, 1, 0, 0];

    constructor(private canvas: MockCanvas) {}

    clearRect(x: number, y: number, w: number, h: number): void {
      // Mock implementation
    }

    fillRect(x: number, y: number, w: number, h: number): void {
      // Mock implementation
    }

    strokeRect(x: number, y: number, w: number, h: number): void {
      // Mock implementation
    }

    fillText(text: string, x: number, y: number, maxWidth?: number): void {
      // Mock implementation
    }

    strokeText(text: string, x: number, y: number, maxWidth?: number): void {
      // Mock implementation
    }

    measureText(text: string): { width: number } {
      return { width: text.length * 10 };
    }

    beginPath(): void {
      // Mock implementation
    }

    closePath(): void {
      // Mock implementation
    }

    moveTo(x: number, y: number): void {
      // Mock implementation
    }

    lineTo(x: number, y: number): void {
      // Mock implementation
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
      // Mock implementation
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
      // Mock implementation
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
      // Mock implementation
    }

    rect(x: number, y: number, w: number, h: number): void {
      // Mock implementation
    }

    save(): void {
      // Mock implementation
    }

    restore(): void {
      // Mock implementation
    }

    translate(x: number, y: number): void {
      // Mock implementation
    }

    rotate(angle: number): void {
      // Mock implementation
    }

    scale(x: number, y: number): void {
      // Mock implementation
    }

    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
      // Mock implementation
    }

    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
      // Mock implementation
    }

    resetTransform(): void {
      // Mock implementation
    }

    createImageData(sw: number, sh: number): ImageData {
      return new ImageData(sw, sh);
    }

    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
      return new ImageData(sw, sh);
    }

    putImageData(imageData: ImageData, dx: number, dy: number): void {
      // Mock implementation
    }

    drawImage(image: CanvasImageSource, dx: number, dy: number, dw?: number, dh?: number, sx?: number, sy?: number, sw?: number, sh?: number): void {
      // Mock implementation
    }

    createPattern(image: CanvasImageSource, repetition: string): CanvasPattern | null {
      return null;
    }

    createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
      return {
        addColorStop(offset: number, color: string): void {
          // Mock implementation
        },
      } as any;
    }

    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
      return {
        addColorStop(offset: number, color: string): void {
          // Mock implementation
        },
      } as any;
    }

    clip(): void {
      // Mock implementation
    }

    isPointInPath(path: Path2D, x: number, y: number): boolean {
      return false;
    }

    isPointInStroke(path: Path2D, x: number, y: number): boolean {
      return false;
    }
  }

  class MockCanvas {
    width = 800;
    height = 600;

    getContext(contextType: '2d'): MockCanvasRenderingContext2D | null {
      if (contextType === '2d') {
        return new MockCanvasRenderingContext2D(this);
      }
      return null;
    }

    toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void {
      // Simulate async blob creation
      setTimeout(() => {
        const mockData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header
        const blob = new Blob([mockData], { type: type || 'image/png' });
        callback(blob);
      }, 0);
    }

    toDataURL(type?: string, quality?: number): string {
      return `data:${type || 'image/png'};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QD0ADQG0UnwjGQAAAABJRU5ErkJggg==`;
    }
  }

  // Set up global mocks
  global.HTMLCanvasElement = MockCanvas as any;

  // Mock document.createElement
  if (!global.document) {
    global.document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') {
          return new MockCanvas();
        }
        return {};
      },
    } as any;
  }

  return {
    MockCanvas,
    MockCanvasRenderingContext2D,
  };
}

export function cleanupCanvasMock() {
  // Clean up mocks if needed
  delete (global as any).HTMLCanvasElement;
}

// Auto-setup for test environment
setupCanvasMock();
