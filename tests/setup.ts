/**
 * Vitest setup file
 * Global test configuration and mocks
 */

// Extend expect with custom matchers if needed
// import { expect } from 'vitest';

// Setup mocks for browser APIs that might not be available in Node.js
if (typeof global.HTMLCanvasElement === 'undefined') {
  global.HTMLCanvasElement = class HTMLCanvasElement {
    getContext() {
      return null;
    }
  } as any;
}

if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16) as unknown as number;
  };
}

if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// Performance API mock
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  } as Performance;
}

// ImageData mock for environments that don't have it
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
      if (dataOrWidth instanceof Uint8ClampedArray) {
        this.data = dataOrWidth;
        // If dimensions not provided, calculate from data length
        const pixelCount = dataOrWidth.length / 4;
        if (widthOrHeight !== undefined && height !== undefined) {
          this.width = widthOrHeight;
          this.height = height;
        } else if (widthOrHeight !== undefined) {
          this.width = widthOrHeight;
          this.height = Math.floor(pixelCount / widthOrHeight);
        } else {
          // Square dimensions as fallback
          this.width = Math.floor(Math.sqrt(pixelCount));
          this.height = Math.floor(pixelCount / this.width);
        }
      } else {
        this.width = dataOrWidth;
        this.height = widthOrHeight ?? dataOrWidth;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      }
    }
  } as any;
}

// URL API mock for environments that don't have createObjectURL
// jsdom should have this, but ensure it's available
if (typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = (_blob: Blob): string => {
    return `blob:mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };
  URL.revokeObjectURL = (_url: string): void => {
    // No-op
  };
}

// Ensure URL mock is always available
if (typeof globalThis.URL !== 'undefined') {
  const OriginalURL = globalThis.URL;
  if (typeof OriginalURL.createObjectURL !== 'function') {
    OriginalURL.createObjectURL = (_blob: Blob): string => {
      return `blob:mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    };
    OriginalURL.revokeObjectURL = (_url: string): void => {
      // No-op
    };
  }
}
