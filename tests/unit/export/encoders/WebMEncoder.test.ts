/**
 * Unit tests for WebM Encoder
 *
 * Tests WebM video encoding functionality using MediaRecorder API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WebMEncoder,
  createWebMEncoder,
  webMEncoderCapabilities,
} from '../../../../packages/core/src/export/encoders/WebMEncoder';
import type { WebMEncoderOptions } from '../../../../packages/core/src/export/types';

// Mock ImageData for Node.js environment
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

// Mock MediaRecorder
class MockMediaRecorder {
  static isTypeSupported = vi.fn((mimeType: string) => {
    return mimeType.includes('webm');
  });

  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(
    public stream: MediaStream,
    public options?: MediaRecorderOptions,
  ) {}

  start(): void {
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    // Simulate data
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['mock-video-data'], { type: 'video/webm' }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  }

  pause(): void {
    this.state = 'paused';
  }

  resume(): void {
    this.state = 'recording';
  }
}

// Setup global mocks
beforeEach(() => {
  (globalThis as any).MediaRecorder = MockMediaRecorder;
  (globalThis as any).MediaStream = vi.fn();
});

afterEach(() => {
  delete (globalThis as any).MediaRecorder;
  delete (globalThis as any).MediaStream;
  vi.clearAllMocks();
});

describe('WebMEncoder', () => {
  let encoder: WebMEncoder;
  let defaultOptions: WebMEncoderOptions;

  beforeEach(() => {
    defaultOptions = {
      width: 800,
      height: 600,
      bitrate: 2500000,
    };
    encoder = new WebMEncoder(defaultOptions);
  });

  afterEach(() => {
    encoder.dispose();
  });

  describe('Encoder Creation', () => {
    it('should create encoder with default options', () => {
      const defaultEncoder = new WebMEncoder();
      expect(defaultEncoder.name).toBe('webm-mediarecorder');
    });

    it('should create encoder with custom options', () => {
      const customEncoder = new WebMEncoder({
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        quality: 0.9,
      });
      expect(customEncoder).toBeInstanceOf(WebMEncoder);
    });

    it('should use factory function', () => {
      const factoryEncoder = createWebMEncoder(defaultOptions);
      expect(factoryEncoder).toBeInstanceOf(WebMEncoder);
    });
  });

  describe('Capabilities', () => {
    it('should return capabilities', () => {
      const capabilities = encoder.getCapabilities();
      expect(capabilities.format).toBe('webm');
      expect(capabilities.extension).toBe('webm');
      expect(capabilities.mimeType).toContain('video/webm');
      expect(capabilities.supportsAudio).toBe(true);
    });

    it('should check availability', async () => {
      const available = await encoder.isAvailable();
      expect(available).toBe(true);
    });

    it('should return correct availability for capabilities', async () => {
      const available = await webMEncoderCapabilities.isAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('Encoding Validation', () => {
    it('should throw error for empty frames', async () => {
      await expect(encoder.encode([], defaultOptions)).rejects.toThrow('No frames');
    });

    it('should throw error for empty frames array', async () => {
      const emptyFrames: ImageData[] = [];
      await expect(encoder.encode(emptyFrames, defaultOptions)).rejects.toThrow();
    });
  });

  describe('Abort', () => {
    it('should support abort operation', () => {
      expect(() => encoder.abort()).not.toThrow();
    });
  });

  describe('Disposal', () => {
    it('should dispose resources', () => {
      expect(() => encoder.dispose()).not.toThrow();
    });

    it('should cleanup on multiple dispose calls', () => {
      encoder.dispose();
      expect(() => encoder.dispose()).not.toThrow();
    });
  });
});

describe('WebM Encoder - Edge Cases', () => {
  it('should handle when MediaRecorder is not available', async () => {
    delete (globalThis as any).MediaRecorder;

    const encoder = new WebMEncoder();
    const available = await encoder.isAvailable();

    expect(available).toBe(false);
  });

  it('should handle unsupported MIME types', async () => {
    MockMediaRecorder.isTypeSupported.mockReturnValue(false);

    const capabilities = webMEncoderCapabilities;
    const available = await capabilities.isAvailable();

    expect(available).toBe(false);
  });
});

/**
 * Helper function to create mock ImageData
 */
function createMockImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  // Fill with some test data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }
  return new ImageData(data, width, height);
}
