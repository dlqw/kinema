/**
 * Encoder Registry Integration Tests
 * Tests encoder registration, discovery, and format detection
 *
 * Covers:
 * - Encoder registration and unregistration
 * - Encoder discovery by format
 * - Availability checking
 * - Format auto-detection
 * - Fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupCanvasMock } from '../../mocks/canvas.mock';
import { EncoderRegistry } from '../../../packages/core/src/export/EncoderRegistry';
import type {
  Encoder,
  EncoderOptions,
  EncoderCapability,
  EncoderFactory,
  OutputFormat,
} from '../../../packages/core/src/export/types';

// Setup canvas mock
setupCanvasMock();

/**
 * Mock encoder for testing
 */
class MockEncoder implements Encoder<EncoderOptions> {
  readonly name: string;
  private capabilities: EncoderCapability;
  private disposed = false;

  constructor(name: string, capabilities: EncoderCapability) {
    this.name = name;
    this.capabilities = capabilities;
  }

  getCapabilities(): EncoderCapability {
    return this.capabilities;
  }

  async encode(
    _frames: ImageData[],
    _options: EncoderOptions,
    _onProgress?: (progress: number) => void,
  ): Promise<Blob> {
    return new Blob(['mock'], { type: this.capabilities.mimeType });
  }

  abort(): void {
    // Mock implementation
  }

  dispose(): void {
    this.disposed = true;
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}

/**
 * Create mock encoder factory
 */
function createMockEncoderFactory(
  name: string,
  format: OutputFormat,
  available: boolean = true,
): { factory: EncoderFactory; capabilities: EncoderCapability } {
  const capabilities: EncoderCapability = {
    format,
    mimeType: `${format === 'gif' ? 'image' : 'video'}/${format}`,
    extension: format,
    supportsTransparency: ['gif', 'png', 'webp'].includes(format),
    supportsAudio: ['webm', 'mp4'].includes(format),
    isAvailable: () => Promise.resolve(available),
  };

  const factory: EncoderFactory = () => new MockEncoder(name, capabilities);

  return { factory, capabilities };
}

describe('Encoder Registry Integration Tests', () => {
  let registry: EncoderRegistry;

  beforeEach(() => {
    // Get fresh registry instance
    EncoderRegistry.resetInstance();
    registry = EncoderRegistry.getInstance();
  });

  afterEach(() => {
    registry.clear();
    EncoderRegistry.resetInstance();
  });

  // ==========================================================================
  // Registration Tests
  // ==========================================================================

  describe('Encoder Registration', () => {
    it('should register a new encoder', () => {
      const { factory, capabilities } = createMockEncoderFactory('test-gif', 'gif');

      registry.register('test-gif', factory, capabilities, 10);

      expect(registry.has('test-gif')).toBe(true);
      expect(registry.getCapabilities('test-gif')).toEqual(capabilities);
    });

    it('should unregister an encoder', () => {
      const { factory, capabilities } = createMockEncoderFactory('test-webm', 'webm');

      registry.register('test-webm', factory, capabilities);
      expect(registry.has('test-webm')).toBe(true);

      const result = registry.unregister('test-webm');
      expect(result).toBe(true);
      expect(registry.has('test-webm')).toBe(false);
    });

    it('should overwrite existing encoder with warning', () => {
      const { factory: factory1, capabilities: caps1 } = createMockEncoderFactory(
        'encoder-v1',
        'gif',
      );
      const { factory: factory2, capabilities: caps2 } = createMockEncoderFactory(
        'encoder-v2',
        'gif',
      );

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      registry.register('duplicate', factory1, caps1);
      registry.register('duplicate', factory2, caps2);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('already registered'));
      expect(registry.getCapabilities('duplicate')).toEqual(caps2);

      warnSpy.mockRestore();
    });

    it('should return all registered encoder names', () => {
      const encoders = [
        createMockEncoderFactory('enc1', 'gif'),
        createMockEncoderFactory('enc2', 'webm'),
        createMockEncoderFactory('enc3', 'mp4'),
      ];

      encoders.forEach(({ factory, capabilities }, index) => {
        registry.register(`enc${index + 1}`, factory, capabilities);
      });

      const names = registry.getRegisteredEncoders();
      expect(names).toContain('enc1');
      expect(names).toContain('enc2');
      expect(names).toContain('enc3');
      expect(names.length).toBe(3);
    });

    it('should clear all encoders', () => {
      const { factory, capabilities } = createMockEncoderFactory('clear-test', 'gif');
      registry.register('clear-test', factory, capabilities);

      registry.clear();

      expect(registry.getRegisteredEncoders().length).toBe(0);
    });
  });

  // ==========================================================================
  // Discovery Tests
  // ==========================================================================

  describe('Encoder Discovery', () => {
    beforeEach(() => {
      // Register multiple encoders for different formats
      const gifEncoders = [
        createMockEncoderFactory('gif-encoder-1', 'gif'),
        createMockEncoderFactory('gif-encoder-2', 'gif'),
      ];
      const webmEncoders = [createMockEncoderFactory('webm-encoder-1', 'webm')];

      gifEncoders.forEach(({ factory, capabilities }, index) => {
        registry.register(`gif-${index + 1}`, factory, capabilities, 10 - index);
      });

      webmEncoders.forEach(({ factory, capabilities }) => {
        registry.register('webm-1', factory, capabilities);
      });
    });

    it('should find encoders by format', () => {
      const gifEncoders = registry.getEncodersForFormat('gif');

      expect(gifEncoders.length).toBe(2);
      expect(gifEncoders).toContain('gif-1');
      expect(gifEncoders).toContain('gif-2');
    });

    it('should sort encoders by priority', () => {
      const gifEncoders = registry.getEncodersForFormat('gif');

      // Higher priority should come first
      expect(gifEncoders[0]).toBe('gif-1'); // priority 10
      expect(gifEncoders[1]).toBe('gif-2'); // priority 9
    });

    it('should return empty array for unknown format', () => {
      const encoders = registry.getEncodersForFormat('unknown' as OutputFormat);
      expect(encoders.length).toBe(0);
    });

    it('should get best encoder for format', async () => {
      const bestEncoder = await registry.getBestEncoderForFormat('gif');

      expect(bestEncoder).toBe('gif-1');
    });

    it('should return undefined if no encoder available', async () => {
      // Register unavailable encoder
      const { factory, capabilities } = createMockEncoderFactory('unavailable', 'png', false);
      registry.register('unavailable', factory, capabilities);

      const best = await registry.getBestEncoderForFormat('png');
      expect(best).toBeUndefined();
    });
  });

  // ==========================================================================
  // Availability Tests
  // ==========================================================================

  describe('Availability Checking', () => {
    it('should check encoder availability', async () => {
      const { factory, capabilities } = createMockEncoderFactory('available', 'gif', true);
      registry.register('available', factory, capabilities);

      const result = await registry.checkAvailability('available');

      expect(result.available).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return reason for unavailable encoder', async () => {
      const { factory, capabilities } = createMockEncoderFactory('unavailable', 'webm', false);
      registry.register('unavailable', factory, capabilities);

      const result = await registry.checkAvailability('unavailable');

      expect(result.available).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should return not found for unknown encoder', async () => {
      const result = await registry.checkAvailability('nonexistent');

      expect(result.available).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should cache availability results', async () => {
      const { factory, capabilities } = createMockEncoderFactory('cached', 'gif');
      let checkCount = 0;

      const cachingCapabilities: EncoderCapability = {
        ...capabilities,
        isAvailable: async () => {
          checkCount++;
          return true;
        },
      };

      registry.register('cached', factory, cachingCapabilities);

      // Check multiple times
      await registry.checkAvailability('cached');
      await registry.checkAvailability('cached');
      await registry.checkAvailability('cached');

      // Should only call isAvailable once due to cache
      expect(checkCount).toBe(1);
    });

    it('should clear cache on new registration', async () => {
      const { factory, capabilities } = createMockEncoderFactory('cache-clear', 'gif');
      let checkCount = 0;

      const countingCapabilities: EncoderCapability = {
        ...capabilities,
        isAvailable: async () => {
          checkCount++;
          return true;
        },
      };

      registry.register('cache-clear', factory, countingCapabilities);
      await registry.checkAvailability('cache-clear');
      expect(checkCount).toBe(1);

      // Register another encoder
      const { factory: factory2, capabilities: caps2 } = createMockEncoderFactory(
        'new-encoder',
        'gif',
      );
      registry.register('new-encoder', factory2, caps2);

      // Should recheck availability
      await registry.checkAvailability('cache-clear');
      expect(checkCount).toBe(2);
    });
  });

  // ==========================================================================
  // Encoder Creation Tests
  // ==========================================================================

  describe('Encoder Creation', () => {
    it('should create encoder instance', async () => {
      const { factory, capabilities } = createMockEncoderFactory('creatable', 'gif');
      registry.register('creatable', factory, capabilities);

      const encoder = await registry.createEncoder('creatable', { width: 100, height: 100 });

      expect(encoder).toBeDefined();
      expect(encoder?.name).toBe('creatable');
    });

    it('should return undefined for unavailable encoder', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { factory, capabilities } = createMockEncoderFactory('unavailable', 'gif', false);
      registry.register('unavailable', factory, capabilities);

      const encoder = await registry.createEncoder('unavailable', {});

      expect(encoder).toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should create best encoder for format', async () => {
      const { factory: f1, capabilities: c1 } = createMockEncoderFactory('best-gif-1', 'gif');
      const { factory: f2, capabilities: c2 } = createMockEncoderFactory('best-gif-2', 'gif');

      registry.register('best-gif-1', f1, c1, 5);
      registry.register('best-gif-2', f2, c2, 10); // Higher priority

      const encoder = await registry.createBestEncoder('gif', {});

      expect(encoder?.name).toBe('best-gif-2');
    });
  });

  // ==========================================================================
  // Format Detection Tests
  // ==========================================================================

  describe('Format Detection', () => {
    it('should detect format from file extension', () => {
      expect(registry.detectFormat('animation.gif')).toBe('gif');
      expect(registry.detectFormat('video.webm')).toBe('webm');
      expect(registry.detectFormat('movie.mp4')).toBe('mp4');
      expect(registry.detectFormat('image.png')).toBe('png');
      expect(registry.detectFormat('photo.jpeg')).toBe('jpeg');
      expect(registry.detectFormat('photo.jpg')).toBe('jpeg');
      expect(registry.detectFormat('image.webp')).toBe('webp');
    });

    it('should detect format from MIME type', () => {
      expect(registry.detectFormat('image/gif')).toBe('gif');
      expect(registry.detectFormat('video/webm')).toBe('webm');
      expect(registry.detectFormat('video/mp4')).toBe('mp4');
      expect(registry.detectFormat('image/png')).toBe('png');
      expect(registry.detectFormat('image/jpeg')).toBe('jpeg');
      expect(registry.detectFormat('image/webp')).toBe('webp');
    });

    it('should detect format case-insensitively', () => {
      expect(registry.detectFormat('ANIMATION.GIF')).toBe('gif');
      expect(registry.detectFormat('Video.WebM')).toBe('webm');
      expect(registry.detectFormat('VIDEO/MP4')).toBe('mp4');
    });

    it('should return undefined for unknown format', () => {
      expect(registry.detectFormat('document.pdf')).toBeUndefined();
      expect(registry.detectFormat('unknown/format')).toBeUndefined();
    });

    it('should get correct MIME type for format', () => {
      expect(registry.getMimeType('gif')).toBe('image/gif');
      expect(registry.getMimeType('webm')).toBe('video/webm');
      expect(registry.getMimeType('mp4')).toBe('video/mp4');
      expect(registry.getMimeType('png')).toBe('image/png');
      expect(registry.getMimeType('jpeg')).toBe('image/jpeg');
      expect(registry.getMimeType('webp')).toBe('image/webp');
    });

    it('should get correct extension for format', () => {
      expect(registry.getExtension('gif')).toBe('gif');
      expect(registry.getExtension('webm')).toBe('webm');
      expect(registry.getExtension('mp4')).toBe('mp4');
    });
  });

  // ==========================================================================
  // Fallback Tests
  // ==========================================================================

  describe('Fallback Mechanism', () => {
    it('should get fallback encoder', async () => {
      const { factory: f1, capabilities: c1 } = createMockEncoderFactory('primary', 'gif', false);
      const { factory: f2, capabilities: c2 } = createMockEncoderFactory('fallback', 'gif', true);

      registry.register('primary', f1, c1, 10);
      registry.register('fallback', f2, c2, 5);

      const fallbackName = await registry.getFallbackEncoder('gif');

      expect(fallbackName).toBe('fallback');
    });

    it('should return undefined if no fallback available', async () => {
      const { factory, capabilities } = createMockEncoderFactory('only-one', 'gif', false);
      registry.register('only-one', factory, capabilities);

      const fallback = await registry.getFallbackEncoder('gif');

      expect(fallback).toBeUndefined();
    });
  });

  // ==========================================================================
  // Video Encoder Registration Tests
  // ==========================================================================

  describe('Video Encoder Registration', () => {
    it('should manually register video encoders', () => {
      // Manually register mock video encoders
      const webmCaps = createMockEncoderFactory('webm-test', 'webm');
      const mp4Caps = createMockEncoderFactory('mp4-test', 'mp4');

      registry.register('webm-test', webmCaps.factory, webmCaps.capabilities);
      registry.register('mp4-test', mp4Caps.factory, mp4Caps.capabilities);

      const encoders = registry.getRegisteredEncoders();
      expect(encoders).toContain('webm-test');
      expect(encoders).toContain('mp4-test');
    });

    it('should find WebM encoder after registration', async () => {
      const { factory, capabilities } = createMockEncoderFactory('webm-manual', 'webm');
      registry.register('webm-manual', factory, capabilities);

      const webmEncoders = registry.getEncodersForFormat('webm');
      expect(webmEncoders.length).toBeGreaterThan(0);
    });

    it('should find MP4 encoder after registration', async () => {
      const { factory, capabilities } = createMockEncoderFactory('mp4-manual', 'mp4');
      registry.register('mp4-manual', factory, capabilities);

      const mp4Encoders = registry.getEncodersForFormat('mp4');
      expect(mp4Encoders.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Singleton Tests
  // ==========================================================================

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = EncoderRegistry.getInstance();
      const instance2 = EncoderRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = EncoderRegistry.getInstance();
      EncoderRegistry.resetInstance();
      const instance2 = EncoderRegistry.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle encoder with error in isAvailable', async () => {
      const { factory, capabilities } = createMockEncoderFactory('error-encoder', 'gif');
      const errorCapabilities: EncoderCapability = {
        ...capabilities,
        isAvailable: async () => {
          throw new Error('Availability check failed');
        },
      };

      registry.register('error-encoder', factory, errorCapabilities);

      const result = await registry.checkAvailability('error-encoder');

      expect(result.available).toBe(false);
      expect(result.reason).toContain('Availability check failed');
    });

    it('should handle unregister of non-existent encoder', () => {
      const result = registry.unregister('nonexistent');
      expect(result).toBe(false);
    });

    it('should handle empty registry operations', () => {
      expect(registry.getRegisteredEncoders()).toEqual([]);
      expect(registry.getEncodersForFormat('gif')).toEqual([]);
      expect(registry.has('anything')).toBe(false);
    });

    it('should handle zero priority encoder', async () => {
      const { factory, capabilities } = createMockEncoderFactory('zero-priority', 'gif');
      registry.register('zero-priority', factory, capabilities, 0);

      const encoder = await registry.createEncoder('zero-priority', {});
      expect(encoder).toBeDefined();
    });
  });
});
