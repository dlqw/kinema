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
