/**
 * Unit tests for MP4 Encoder
 *
 * Tests MP4 video encoding functionality using FFmpeg.wasm
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Mp4Encoder,
  createMp4Encoder,
  mp4EncoderCapabilities,
} from '../../../../packages/core/src/export/encoders/Mp4Encoder';
import type { MP4EncoderOptions } from '../../../../packages/core/src/export/types';

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

// Mock FFmpeg.wasm
class MockFFmpeg {
  loaded = false;
  private files: Map<string, Uint8Array> = new Map();

  async load(options?: any): Promise<void> {
    this.loaded = true;
    return Promise.resolve();
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    this.files.set(path, data);
  }

  async readFile(path: string): Promise<Uint8Array> {
    // Return mock MP4 data
    return new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x20,
      0x66,
      0x74,
      0x79,
      0x70, // ftyp box
      0x69,
      0x73,
      0x6f,
      0x6d, // 'isom'
      0x00,
      0x00,
      0x02,
      0x00,
      0x69,
      0x73,
      0x6f,
      0x6d,
      0x69,
      0x73,
      0x6f,
      0x32,
      0x6d,
      0x70,
      0x34,
      0x31,
      0x00,
      0x00,
      0x00,
      0x00,
    ]);
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(path);
  }

  async exec(args: string[]): Promise<void> {
    // Simulate encoding
    return Promise.resolve();
  }

  on(event: string, callback: (data: any) => void): void {
    // Mock event listener
  }

  off(event: string, callback: (data: any) => void): void {
    // Mock event removal
  }
}

// Setup global mocks
let mockFFmpeg: MockFFmpeg;

beforeEach(() => {
  mockFFmpeg = new MockFFmpeg();
  (globalThis as any).ffmpeg = mockFFmpeg;
  (globalThis as any).FFmpeg = { FFmpeg: MockFFmpeg };
});

afterEach(() => {
  delete (globalThis as any).ffmpeg;
  delete (globalThis as any).FFmpeg;
  delete (globalThis as any).FFmpegWASM;
  vi.clearAllMocks();
});

describe('Mp4Encoder', () => {
  let encoder: Mp4Encoder;
  let defaultOptions: MP4EncoderOptions;

  beforeEach(() => {
    defaultOptions = {
      width: 800,
      height: 600,
      bitrate: 5000000,
    };
    encoder = new Mp4Encoder(defaultOptions);
  });

  afterEach(() => {
    encoder.dispose();
  });

  describe('Encoder Creation', () => {
    it('should create encoder with default options', () => {
      const defaultEncoder = new Mp4Encoder();
      expect(defaultEncoder.name).toBe('mp4-ffmpeg');
    });

    it('should create encoder with custom options', () => {
      const customEncoder = new Mp4Encoder({
        width: 1920,
        height: 1080,
        bitrate: 10000000,
        codec: 'h265',
      });
      expect(customEncoder).toBeInstanceOf(Mp4Encoder);
    });

    it('should use factory function', () => {
      const factoryEncoder = createMp4Encoder(defaultOptions);
      expect(factoryEncoder).toBeInstanceOf(Mp4Encoder);
    });
  });

  describe('Capabilities', () => {
    it('should return capabilities', () => {
      const capabilities = encoder.getCapabilities();
      expect(capabilities.format).toBe('mp4');
      expect(capabilities.extension).toBe('mp4');
      expect(capabilities.mimeType).toBe('video/mp4');
      expect(capabilities.supportsAudio).toBe(true);
    });

    it('should check availability when FFmpeg is available', async () => {
      const available = await encoder.isAvailable();
      expect(available).toBe(true);
    });

    it('should return correct availability for capabilities', async () => {
      const available = await mp4EncoderCapabilities.isAvailable();
      expect(available).toBe(true);
    });

    it('should report loading required when not loaded', async () => {
      mockFFmpeg.loaded = false;

      const status = await encoder.getAvailabilityStatus();

      expect(status.available).toBe(true);
      expect(status.loadingRequired).toBe(true);
    });
  });

  describe('Initialization', () => {
    it('should initialize FFmpeg', async () => {
      mockFFmpeg.loaded = false;

      await encoder.initialize();

      expect(encoder.isReady()).toBe(true);
    });

    it('should not reinitialize if already loaded', async () => {
      mockFFmpeg.loaded = true;

      await encoder.initialize();

      expect(encoder.isReady()).toBe(true);
    });

    it('should report loading state', () => {
      expect(encoder.isLoading()).toBe(false);
    });
  });

  describe('Encoding Validation', () => {
    beforeEach(async () => {
      await encoder.initialize();
    });

    it('should throw error for empty frames', async () => {
      await expect(encoder.encode([], defaultOptions)).rejects.toThrow('No frames provided');
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

describe('MP4 Encoder - Edge Cases', () => {
  it('should handle when FFmpeg is not available', async () => {
    delete (globalThis as any).ffmpeg;
    delete (globalThis as any).FFmpeg;

    const encoder = new Mp4Encoder();
    const available = await encoder.isAvailable();

    expect(available).toBe(false);
  });

  it('should report unavailable when no FFmpeg library', async () => {
    delete (globalThis as any).ffmpeg;
    delete (globalThis as any).FFmpeg;
    delete (globalThis as any).FFmpegWASM;

    const available = await mp4EncoderCapabilities.isAvailable();

    expect(available).toBe(false);
  });

  it('should handle availability with FFmpegWASM global', async () => {
    delete (globalThis as any).ffmpeg;
    delete (globalThis as any).FFmpeg;
    (globalThis as any).FFmpegWASM = {
      FFmpeg: MockFFmpeg,
    };

    const available = await mp4EncoderCapabilities.isAvailable();

    expect(available).toBe(true);
  });
});

/**
 * Helper function to create mock ImageData
 */
function createMockImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  // Fill with some test data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0; // R
    data[i + 1] = 255; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }
  return new ImageData(data, width, height);
}
