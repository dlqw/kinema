/**
 * Integration Test Helpers for Export Module
 * Provides utility functions and mock factories for export testing
 *
 * @module tests/integration/export/test-helpers
 */

import { vi, expect } from 'vitest';
import { Scene } from '../../../packages/core/src/scene/Scene';

/**
 * Mock RenderObject implementation for testing
 */
export class MockRenderObject {
  constructor(
    private _id: string,
    private _visible: boolean = true,
    private _opacity: number = 1,
    private _position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    private _zIndex: number = 0,
    private _color: string = '#ffffff',
  ) {}

  get id(): string {
    return this._id;
  }

  get visible(): boolean {
    return this._visible;
  }

  get zIndex(): number {
    return this._zIndex;
  }

  getState() {
    return {
      id: this._id,
      transform: {
        position: this._position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: this._opacity,
      },
      visible: this._visible,
      z_index: this._zIndex,
      styles: new Map([['color', this._color]]),
    };
  }

  getBoundingBox() {
    return {
      min: { x: -50, y: -50, z: 0 },
      max: { x: 50, y: 50, z: 0 },
      center: { x: 0, y: 0, z: 0 },
    };
  }

  containsPoint(point: { x: number; y: number; z: number }): boolean {
    const bb = this.getBoundingBox();
    return point.x >= bb.min.x && point.x <= bb.max.x && point.y >= bb.min.y && point.y <= bb.max.y;
  }

  clone(): this {
    return new MockRenderObject(
      this._id,
      this._visible,
      this._opacity,
      { ...this._position },
      this._zIndex,
      this._color,
    ) as this;
  }

  // Test helpers
  setVisible(visible: boolean): this {
    return new MockRenderObject(
      this._id,
      visible,
      this._opacity,
      this._position,
      this._zIndex,
      this._color,
    ) as this;
  }

  setOpacity(opacity: number): this {
    return new MockRenderObject(
      this._id,
      this._visible,
      opacity,
      this._position,
      this._zIndex,
      this._color,
    ) as this;
  }

  setPosition(x: number, y: number, z: number = 0): this {
    return new MockRenderObject(
      this._id,
      this._visible,
      this._opacity,
      { x, y, z },
      this._zIndex,
      this._color,
    ) as this;
  }
}

/**
 * Scene factory options
 */
export interface CreateSceneOptions {
  width?: number;
  height?: number;
  fps?: number;
  backgroundColor?: string;
  objectCount?: number;
}

/**
 * Create a test scene with mock objects
 */
export function createTestScene(options: CreateSceneOptions = {}): Scene {
  const { width = 800, height = 600, fps = 30, backgroundColor, objectCount = 1 } = options;

  const config: { width: number; height: number; fps: number; backgroundColor?: string } = {
    width,
    height,
    fps,
  };

  if (backgroundColor !== undefined) {
    config.backgroundColor = backgroundColor;
  }

  let scene = new Scene(config);

  for (let i = 0; i < objectCount; i++) {
    const obj = new MockRenderObject(`obj-${i}`, true, 1, { x: 100 * i, y: 100 * i, z: 0 }, i);
    scene = scene.addObject(obj as unknown as any);
  }

  return scene;
}

/**
 * Create an empty scene for edge case testing
 */
export function createEmptyScene(): Scene {
  return new Scene({ width: 800, height: 600, fps: 30 });
}

/**
 * Create a scene with hidden objects only
 */
export function createSceneWithHiddenObjects(count: number = 3): Scene {
  let scene = new Scene({ width: 800, height: 600, fps: 30 });

  for (let i = 0; i < count; i++) {
    const obj = new MockRenderObject(`hidden-${i}`, false);
    scene = scene.addObject(obj as unknown as any);
  }

  return scene;
}

/**
 * Progress callback mock factory
 */
export function createProgressCallback() {
  return vi.fn();
}

/**
 * Create a mock download link element
 */
export function createMockDownloadLink() {
  return {
    href: '',
    download: '',
    click: vi.fn(),
    remove: vi.fn(),
  };
}

/**
 * Setup mock DOM for download testing
 */
export function setupMockDOM() {
  const mockLink = createMockDownloadLink();

  const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return mockLink as any;
    }
    return {} as any;
  });

  const appendChildSpy = vi
    .spyOn(document.body, 'appendChild')
    .mockImplementation(() => mockLink as any);
  const removeChildSpy = vi
    .spyOn(document.body, 'removeChild')
    .mockImplementation(() => mockLink as any);

  return {
    mockLink,
    createElementSpy,
    appendChildSpy,
    removeChildSpy,
    cleanup: () => {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    },
  };
}

/**
 * Setup mock URL APIs
 */
export function setupMockURL() {
  const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  const revokeObjectURL = vi.fn();

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;

  return {
    createObjectURL,
    revokeObjectURL,
    cleanup: () => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    },
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Assert that progress values increase monotonically
 */
export function assertProgressMonotonic(progressCalls: Array<{ progress: number }>): void {
  let maxProgress = 0;

  for (const call of progressCalls) {
    // Allow small variance for floating point
    expect(call.progress).toBeGreaterThanOrEqual(maxProgress - 0.01);
    maxProgress = Math.max(maxProgress, call.progress);
  }

  // Final progress should be 1 (or very close)
  if (progressCalls.length > 0) {
    const lastProgress = progressCalls[progressCalls.length - 1]!.progress;
    expect(lastProgress).toBeGreaterThanOrEqual(0.99);
  }
}

/**
 * Validate export result structure
 */
export function validateExportResult(
  result: any,
  expectedType: 'gif' | 'imageSequence' | 'video',
): void {
  expect(result).toBeDefined();
  expect(typeof result.success).toBe('boolean');

  if (result.success) {
    expect(result.output).toBeDefined();

    switch (expectedType) {
      case 'gif':
        expect(typeof result.frameCount).toBe('number');
        expect(typeof result.gifDuration).toBe('number');
        break;
      case 'imageSequence':
        expect(Array.isArray(result.frames)).toBe(true);
        expect(typeof result.frameCount).toBe('number');
        break;
      case 'video':
        expect(typeof result.duration).toBe('number');
        expect(typeof result.fps).toBe('number');
        expect(result.resolution).toBeDefined();
        break;
    }
  } else {
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  }
}

/**
 * Create test frames (ImageData) for encoding tests
 */
export function createTestFrames(
  count: number,
  width: number = 100,
  height: number = 100,
): ImageData[] {
  const frames: ImageData[] = [];

  for (let i = 0; i < count; i++) {
    const data = new Uint8ClampedArray(width * height * 4);

    // Fill with varying colors
    for (let j = 0; j < data.length; j += 4) {
      data[j] = (i * 30) % 256; // R
      data[j + 1] = (i * 20) % 256; // G
      data[j + 2] = (i * 10) % 256; // B
      data[j + 3] = 255; // A
    }

    frames.push(new ImageData(data, width, height));
  }

  return frames;
}

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
}

/**
 * Test configuration presets
 */
export const testPresets = {
  quickExport: {
    duration: 0.1,
    fps: 10,
  },
  standardExport: {
    duration: 0.5,
    fps: 30,
  },
  highQualityExport: {
    duration: 1,
    fps: 60,
    quality: 1.0,
  },
  lowQualityExport: {
    duration: 0.5,
    fps: 15,
    quality: 0.5,
  },
  gif: {
    colors: 256,
    dither: 'fs' as const,
    quality: 10,
  },
  jpeg: {
    quality: 0.9,
  },
  webp: {
    quality: 0.85,
  },
};

/**
 * Format-specific test configurations
 */
export const formatConfigs = {
  gif: {
    output: 'test.gif',
    ...testPresets.quickExport,
    ...testPresets.gif,
  },
  webm: {
    output: 'test.webm',
    ...testPresets.quickExport,
  },
  mp4: {
    output: 'test.mp4',
    ...testPresets.quickExport,
  },
  png: {
    output: 'test',
    format: 'png' as const,
    ...testPresets.quickExport,
  },
  jpeg: {
    output: 'test',
    format: 'jpeg' as const,
    ...testPresets.quickExport,
    ...testPresets.jpeg,
  },
  webp: {
    output: 'test',
    format: 'webp' as const,
    ...testPresets.quickExport,
    ...testPresets.webp,
  },
};
