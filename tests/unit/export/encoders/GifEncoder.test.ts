/**
 * Unit tests for GifEncoder
 * Tests GIF encoding functionality with progress callbacks and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GifEncoder,
  createGifEncoder,
  gifEncoderCapabilities,
} from '../../../../packages/core/src/export/encoders/GifEncoder';
import type {
  GifEncoderOptions,
  EncoderProgressCallback,
} from '../../../../packages/core/src/export/types';

// Helper to create test ImageData
function createTestImageData(
  width: number = 100,
  height: number = 100,
  color: number = 128,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color; // R
    data[i + 1] = color; // G
    data[i + 2] = color; // B
    data[i + 3] = 255; // A
  }
  return new ImageData(data, width, height);
}

describe('GifEncoder', () => {
  let encoder: GifEncoder;

  beforeEach(() => {
    encoder = new GifEncoder();
  });

  afterEach(() => {
    encoder.dispose();
  });

  describe('GifEncoder Creation', () => {
    it('should create encoder instance', () => {
      expect(encoder).toBeInstanceOf(GifEncoder);
    });

    it('should have correct name', () => {
      expect(encoder.name).toBe('gif.js');
    });

    it('should be created via factory function', () => {
      const factoryEncoder = createGifEncoder();
      expect(factoryEncoder).toBeInstanceOf(GifEncoder);
    });
  });

  describe('Encoder Capabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = encoder.getCapabilities();

      expect(capabilities.format).toBe('gif');
      expect(capabilities.mimeType).toBe('image/gif');
      expect(capabilities.extension).toBe('gif');
      expect(capabilities.supportsTransparency).toBe(true);
      expect(capabilities.supportsAudio).toBe(false);
      expect(capabilities.isAvailable).toBeTypeOf('function');
    });

    it('should check availability', async () => {
      const isAvailable = await GifEncoder.isAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should have exported capabilities object', () => {
      expect(gifEncoderCapabilities.format).toBe('gif');
      expect(gifEncoderCapabilities.mimeType).toBe('image/gif');
      expect(gifEncoderCapabilities.supportsTransparency).toBe(true);
    });
  });

  describe('GIF Encoding', () => {
    it('should throw error for empty frames', async () => {
      await expect(encoder.encode([], {})).rejects.toThrow('No frames provided');
    });

    it('should throw error for null frames', async () => {
      await expect(encoder.encode(null as unknown as ImageData[], {})).rejects.toThrow(
        'No frames provided',
      );
    });

    it('should encode single frame', async () => {
      const frame = createTestImageData(100, 100);
      const result = await encoder.encode([frame], {
        width: 100,
        height: 100,
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/gif');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should encode multiple frames', async () => {
      const frames = [
        createTestImageData(50, 50, 100),
        createTestImageData(50, 50, 150),
        createTestImageData(50, 50, 200),
      ];

      const result = await encoder.encode(frames, {
        width: 50,
        height: 50,
        frameDelay: 100,
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/gif');
    });

    it('should use frame dimensions when options dimensions not provided', async () => {
      const frame = createTestImageData(80, 60);
      const result = await encoder.encode([frame], {});

      expect(result).toBeInstanceOf(Blob);
    });

    it('should validate colors option', async () => {
      const frame = createTestImageData(50, 50);

      await expect(encoder.encode([frame], { colors: 0 })).rejects.toThrow(
        'Colors must be between 1 and 256',
      );
      await expect(encoder.encode([frame], { colors: 300 })).rejects.toThrow(
        'Colors must be between 1 and 256',
      );
    });

    it('should validate quality option', async () => {
      const frame = createTestImageData(50, 50);

      await expect(encoder.encode([frame], { quality: 0 })).rejects.toThrow(
        'Quality must be between 1 and 20',
      );
      await expect(encoder.encode([frame], { quality: 25 })).rejects.toThrow(
        'Quality must be between 1 and 20',
      );
    });

    it('should accept valid colors option', async () => {
      const frame = createTestImageData(50, 50);

      const result = await encoder.encode([frame], { colors: 128 });
      expect(result).toBeInstanceOf(Blob);
    });

    it('should accept valid quality option', async () => {
      const frame = createTestImageData(50, 50);

      const result = await encoder.encode([frame], { quality: 15 });
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Progress Callback', () => {
    it('should call progress callback during encoding', async () => {
      const frame = createTestImageData(50, 50);
      const progressCallback = vi.fn<EncoderProgressCallback>();

      await encoder.encode([frame], { width: 50, height: 50 }, progressCallback);

      // Progress should be called at least once (for completion)
      expect(progressCallback).toHaveBeenCalled();

      // Last progress should be 1 (complete)
      const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1];
      expect(lastCall[0]).toBe(1);
    });

    it('should report progress for multiple frames', async () => {
      const frames = [
        createTestImageData(50, 50, 50),
        createTestImageData(50, 50, 100),
        createTestImageData(50, 50, 150),
      ];

      const progressValues: number[] = [];
      const progressCallback: EncoderProgressCallback = (progress) => {
        progressValues.push(progress);
      };

      await encoder.encode(frames, { width: 50, height: 50 }, progressCallback);

      // Should have some progress updates
      expect(progressValues.length).toBeGreaterThan(0);

      // First progress should be >= 0
      expect(progressValues[0]).toBeGreaterThanOrEqual(0);

      // Last progress should be 1
      expect(progressValues[progressValues.length - 1]).toBe(1);
    });
  });

  describe('Encoding Options', () => {
    it('should apply default options', async () => {
      const frame = createTestImageData(50, 50);

      const result = await encoder.encode([frame], {});
      expect(result).toBeInstanceOf(Blob);
    });

    it('should apply loop option', async () => {
      const frame = createTestImageData(50, 50);

      // Loop 0 = infinite
      const result = await encoder.encode([frame], { loop: 0 });
      expect(result).toBeInstanceOf(Blob);
    });

    it('should apply frameDelay option', async () => {
      const frame = createTestImageData(50, 50);

      const result = await encoder.encode([frame], { frameDelay: 200 });
      expect(result).toBeInstanceOf(Blob);
    });

    it('should apply dither option', async () => {
      const frame = createTestImageData(50, 50);

      // Test with Floyd-Steinberg dithering
      const resultFs = await encoder.encode([frame], { dither: 'fs' });
      expect(resultFs).toBeInstanceOf(Blob);

      // Test with Bayer dithering
      const resultBayer = await encoder.encode([frame], { dither: 'bayer' });
      expect(resultBayer).toBeInstanceOf(Blob);

      // Test without dithering
      const resultNone = await encoder.encode([frame], { dither: 'none' });
      expect(resultNone).toBeInstanceOf(Blob);
    });

    it('should apply transparency option', async () => {
      const frame = createTestImageData(50, 50);

      const result = await encoder.encode([frame], {
        transparent: true,
        transparentColor: '#000000',
      });

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Abort Functionality', () => {
    it('should have abort method', () => {
      expect(encoder.abort).toBeDefined();
      expect(() => encoder.abort()).not.toThrow();
    });

    it('should reset abort state on new encode', async () => {
      const frame = createTestImageData(50, 50);

      // First encode
      await encoder.encode([frame], {});

      // Abort (won't do anything since encoding is complete)
      encoder.abort();

      // Second encode should work
      const result = await encoder.encode([frame], {});
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Resource Management', () => {
    it('should have dispose method', () => {
      expect(encoder.dispose).toBeDefined();
      expect(() => encoder.dispose()).not.toThrow();
    });

    it('should be safe to dispose multiple times', () => {
      encoder.dispose();
      encoder.dispose();
      encoder.dispose();
      // Should not throw
    });
  });

  describe('GIF Format Validation', () => {
    it('should produce valid GIF header', async () => {
      const frame = createTestImageData(10, 10);
      const result = await encoder.encode([frame], { width: 10, height: 10 });

      // Read the blob as ArrayBuffer
      const buffer = await result.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // GIF files start with "GIF" magic number
      expect(bytes[0]).toBe(0x47); // 'G'
      expect(bytes[1]).toBe(0x49); // 'I'
      expect(bytes[2]).toBe(0x46); // 'F'
    });

    it('should produce valid GIF89a version', async () => {
      const frame = createTestImageData(10, 10);
      const result = await encoder.encode([frame], { width: 10, height: 10 });

      const buffer = await result.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Version "89a"
      expect(bytes[3]).toBe(0x38); // '8'
      expect(bytes[4]).toBe(0x39); // '9'
      expect(bytes[5]).toBe(0x61); // 'a'
    });

    it('should end with GIF trailer', async () => {
      const frame = createTestImageData(10, 10);
      const result = await encoder.encode([frame], { width: 10, height: 10 });

      const buffer = await result.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // GIF files end with 0x3B
      expect(bytes[bytes.length - 1]).toBe(0x3b);
    });
  });

  describe('Edge Cases', () => {
    it('should handle 1x1 frame', async () => {
      const frame = createTestImageData(1, 1);
      const result = await encoder.encode([frame], { width: 1, height: 1 });
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle non-square frames', async () => {
      const frame = createTestImageData(200, 50);
      const result = await encoder.encode([frame], { width: 200, height: 50 });
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle many frames', async () => {
      // Create 30 frames (1 second at 30fps)
      const frames: ImageData[] = [];
      for (let i = 0; i < 30; i++) {
        frames.push(createTestImageData(32, 32, (i * 8) % 256));
      }

      const result = await encoder.encode(frames, { width: 32, height: 32 });
      expect(result).toBeInstanceOf(Blob);
      // GIF should have reasonable size for small animation
      expect(result.size).toBeGreaterThan(100);
    });

    it('should handle large color values', async () => {
      const frame = createTestImageData(50, 50, 255);
      const result = await encoder.encode([frame], { colors: 256 });
      expect(result).toBeInstanceOf(Blob);
    });
  });
});

describe('GifEncoderOptions Type', () => {
  it('should accept all options', () => {
    const options: GifEncoderOptions = {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      loop: 0,
      frameDelay: 100,
      dither: 'fs',
      colors: 256,
      quality: 10,
      workers: 2,
      transparent: true,
      transparentColor: '#000000',
    };

    expect(options.width).toBe(800);
    expect(options.height).toBe(600);
    expect(options.loop).toBe(0);
    expect(options.colors).toBe(256);
  });

  it('should accept partial options', () => {
    const options: GifEncoderOptions = {
      width: 100,
      height: 100,
    };

    expect(options.width).toBe(100);
    expect(options.backgroundColor).toBeUndefined();
  });
});
