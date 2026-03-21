/**
 * Canvas and DOM mock utilities for testing
 * Provides HTMLCanvasElement and related APIs for Node.js test environment
 */

export function setupCanvasMock() {
  // Mock ImageData if not available (Node.js environment)
  if (typeof ImageData === 'undefined') {
    class MockImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;

      constructor(widthOrData: number | Uint8ClampedArray, height?: number) {
        if (typeof widthOrData === 'number') {
          this.width = widthOrData;
          this.height = height ?? widthOrData;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
          this.data = widthOrData;
          this.width = height ?? Math.sqrt(widthOrData.length / 4) | 0;
          this.height = (widthOrData.length / 4 / this.width) | 0;
        }
      }
    }
    (globalThis as any).ImageData = MockImageData;
  }

  // Mock ImageBitmap if not available
  if (typeof ImageBitmap === 'undefined') {
    (globalThis as any).ImageBitmap = class MockImageBitmap {
      width = 100;
      height = 100;
    };
  }

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

    // Canvas reference (public to avoid TS4094)
    canvas: MockCanvas;

    constructor(canvas: MockCanvas) {
      this.canvas = canvas;
    }

    clearRect(_x: number, _y: number, _w: number, _h: number): void {
      // Mock implementation
    }

    fillRect(_x: number, _y: number, _w: number, _h: number): void {
      // Mock implementation
    }

    strokeRect(_x: number, _y: number, _w: number, _h: number): void {
      // Mock implementation
    }

    fillText(_text: string, _x: number, _y: number, _maxWidth?: number): void {
      // Mock implementation
    }

    strokeText(_text: string, _x: number, _y: number, _maxWidth?: number): void {
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

    moveTo(_x: number, _y: number): void {
      // Mock implementation
    }

    lineTo(_x: number, _y: number): void {
      // Mock implementation
    }

    quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void {
      // Mock implementation
    }

    bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number): void {
      // Mock implementation
    }

    arc(_x: number, _y: number, _radius: number, _startAngle: number, _endAngle: number, _anticlockwise?: boolean): void {
      // Mock implementation
    }

    rect(_x: number, _y: number, _w: number, _h: number): void {
      // Mock implementation
    }

    save(): void {
      // Mock implementation
    }

    restore(): void {
      // Mock implementation
    }

    translate(_x: number, _y: number): void {
      // Mock implementation
    }

    rotate(_angle: number): void {
      // Mock implementation
    }

    scale(_x: number, _y: number): void {
      // Mock implementation
    }

    transform(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): void {
      // Mock implementation
    }

    setTransform(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): void {
      // Mock implementation
    }

    resetTransform(): void {
      // Mock implementation
    }

    createImageData(sw: number, sh: number): ImageData {
      return new ImageData(sw, sh);
    }

    getImageData(_sx: number, _sy: number, sw: number, sh: number): ImageData {
      return new ImageData(sw, sh);
    }

    putImageData(_imageData: ImageData, _dx: number, _dy: number): void {
      // Mock implementation
    }

    drawImage(_image: CanvasImageSource, _dx: number, _dy: number, _dw?: number, _dh?: number, _sx?: number, _sy?: number, _sw?: number, _sh?: number): void {
      // Mock implementation
    }

    createPattern(_image: CanvasImageSource, _repetition: string): CanvasPattern | null {
      return null;
    }

    createLinearGradient(_x0: number, _y0: number, _x1: number, _y1: number): CanvasGradient {
      return {
        addColorStop(_offset: number, _color: string): void {
          // Mock implementation
        },
      } as CanvasGradient;
    }

    createRadialGradient(_x0: number, _y0: number, _r0: number, _x1: number, _y1: number, _r1: number): CanvasGradient {
      return {
        addColorStop(_offset: number, _color: string): void {
          // Mock implementation
        },
      } as CanvasGradient;
    }

    clip(): void {
      // Mock implementation
    }

    isPointInPath(_path: Path2D, _x: number, _y: number): boolean {
      return false;
    }

    isPointInStroke(_path: Path2D, _x: number, _y: number): boolean {
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

    toBlob(callback: (blob: Blob | null) => void, type?: string, _quality?: number): void {
      // Simulate async blob creation
      setTimeout(() => {
        const mockData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header
        const blob = new Blob([mockData], { type: type || 'image/png' });
        callback(blob);
      }, 0);
    }

    toDataURL(type?: string, _quality?: number): string {
      return `data:${type || 'image/png'};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QD0ADQG0UnwjGQAAAABJRU5ErkJggg==`;
    }

    captureStream(_frameRate?: number): MediaStream {
      // Return a mock MediaStream
      return new MockMediaStream();
    }
  }

  // Mock MediaStream
  class MockMediaStream {
    active = true;
    id = 'mock-stream-' + Math.random().toString(36).slice(2);

    getTracks(): MediaStreamTrack[] {
      return [new MockMediaStreamTrack()];
    }

    getVideoTracks(): MediaStreamTrack[] {
      return [new MockMediaStreamTrack()];
    }

    getAudioTracks(): MediaStreamTrack[] {
      return [];
    }
  }

  // Mock MediaStreamTrack
  class MockMediaStreamTrack {
    kind: 'video' | 'audio' = 'video';
    id = 'mock-track-' + Math.random().toString(36).slice(2);
    enabled = true;
    muted = false;
    readyState: 'live' | 'ended' = 'live';

    stop(): void {
      this.readyState = 'ended';
    }
  }

  // Set up global mocks
  global.HTMLCanvasElement = MockCanvas as unknown as typeof HTMLCanvasElement;

  // Mock document.createElement
  if (!global.document) {
    global.document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') {
          return new MockCanvas();
        }
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: () => {},
            remove: () => {},
          };
        }
        return {};
      },
      body: {
        appendChild: () => {},
        removeChild: () => {},
      } as any,
    } as unknown as Document;
  }

  // Mock URL.createObjectURL and URL.revokeObjectURL
  if (typeof global.URL === 'undefined' || !global.URL.createObjectURL) {
    const MockURL = class URL {
      static createObjectURL(_blob: Blob): string {
        return `blob:mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      static revokeObjectURL(_url: string): void {
        // No-op
      }
    };
    global.URL = MockURL as any;
  }

  // Set up global MediaStream mocks
  (globalThis as any).MediaStream = MockMediaStream;
  (globalThis as any).MediaStreamTrack = MockMediaStreamTrack;

  return {
    MockCanvas,
    MockCanvasRenderingContext2D,
    MockMediaStream,
    MockMediaStreamTrack,
  };
}

export function cleanupCanvasMock() {
  // Clean up mocks if needed
  delete (global as unknown as { HTMLCanvasElement?: unknown }).HTMLCanvasElement;
}

// Auto-setup for test environment
setupCanvasMock();
