/**
 * Unit tests for EncoderRegistry
 * Tests encoder registration, retrieval, and format management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  EncoderRegistry,
  getEncoderRegistry,
  getEncoder,
  type ExportFormat,
  type EncoderMetadata,
} from '../../../packages/core/src/export/encoders/EncoderRegistry';
import { setupCanvasMock } from '../../mocks/canvas.mock';

// Setup canvas mock before tests
setupCanvasMock();

describe('EncoderRegistry', () => {
  let registry: EncoderRegistry;

  beforeEach(() => {
    // Reset singleton for each test
    EncoderRegistry.resetInstance();
    registry = EncoderRegistry.getInstance();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EncoderRegistry.getInstance();
      const instance2 = EncoderRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance correctly', () => {
      const instance1 = EncoderRegistry.getInstance();
      EncoderRegistry.resetInstance();
      const instance2 = EncoderRegistry.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('getEncoderRegistry', () => {
    it('should return registry instance', () => {
      const registryInstance = getEncoderRegistry();
      expect(registryInstance).toBeInstanceOf(EncoderRegistry);
    });
  });

  describe('Default Encoders', () => {
    it('should have default formats registered', async () => {
      const formats = await registry.getAvailableFormats();

      expect(formats).toContain('png-sequence');
      expect(formats).toContain('jpeg-sequence');
      expect(formats).toContain('webp-sequence');
      expect(formats).toContain('zip-png');
      expect(formats).toContain('zip-jpeg');
      expect(formats).toContain('zip-webp');
    });

    it('should have correct metadata for PNG sequence', async () => {
      const metadata = await registry.getMetadata('png-sequence');

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('PNG Sequence');
      expect(metadata?.extension).toBe('png');
      expect(metadata?.mimeType).toBe('image/png');
      expect(metadata?.supportsTransparency).toBe(true);
      expect(metadata?.supportsAnimation).toBe(true);
      expect(metadata?.supportsQuality).toBe(false);
      expect(metadata?.category).toBe('sequence');
    });

    it('should have correct metadata for JPEG sequence', async () => {
      const metadata = await registry.getMetadata('jpeg-sequence');

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('JPEG Sequence');
      expect(metadata?.extension).toBe('jpg');
      expect(metadata?.supportsTransparency).toBe(false);
      expect(metadata?.supportsQuality).toBe(true);
      expect(metadata?.defaultQuality).toBe(0.9);
    });

    it('should have correct metadata for ZIP formats', async () => {
      const metadata = await registry.getMetadata('zip-png');

      expect(metadata).toBeDefined();
      expect(metadata?.extension).toBe('zip');
      expect(metadata?.mimeType).toBe('application/zip');
      expect(metadata?.category).toBe('archive');
    });
  });

  describe('Encoder Retrieval', () => {
    it('should get encoder for PNG sequence', async () => {
      const encoder = await registry.getEncoder('png-sequence', {
        output: 'test',
      });

      expect(encoder).toBeDefined();
      expect(encoder.getExtension()).toBe('png');
    });

    it('should get encoder for ZIP output', async () => {
      const encoder = await registry.getEncoder('zip-jpeg', {
        output: 'test',
        quality: 0.8,
      });

      expect(encoder).toBeDefined();
      expect(encoder.getExtension()).toBe('zip');
    });

    it('should throw error for unknown format', async () => {
      await expect(
        registry.getEncoder('unknown-format' as ExportFormat, { output: 'test' }),
      ).rejects.toThrow('Encoder not found');
    });
  });

  describe('Format Detection', () => {
    it('should detect PNG format from extension', async () => {
      const format = await registry.detectFormat('animation.png');
      expect(format).toBe('png-sequence');
    });

    it('should detect JPEG format from extension', async () => {
      const format = await registry.detectFormat('animation.jpg');
      expect(format).toBe('jpeg-sequence');
    });

    it('should detect JPEG format from .jpeg extension', async () => {
      const format = await registry.detectFormat('animation.jpeg');
      expect(format).toBe('jpeg-sequence');
    });

    it('should detect WebP format from extension', async () => {
      const format = await registry.detectFormat('animation.webp');
      expect(format).toBe('webp-sequence');
    });

    it('should detect ZIP format from extension', async () => {
      const format = await registry.detectFormat('frames.zip');
      expect(format).toBe('zip-png');
    });

    it('should return undefined for unknown extension', async () => {
      const format = await registry.detectFormat('animation.xyz');
      expect(format).toBeUndefined();
    });

    it('should return undefined for file without extension', async () => {
      const format = await registry.detectFormat('animation');
      expect(format).toBeUndefined();
    });
  });

  describe('Format Queries', () => {
    it('should check if format exists', async () => {
      expect(await registry.hasFormat('png-sequence')).toBe(true);
      expect(await registry.hasFormat('jpeg-sequence')).toBe(true);
      expect(await registry.hasFormat('unknown' as ExportFormat)).toBe(false);
    });

    it('should get all available formats', async () => {
      const formats = await registry.getAvailableFormats();

      expect(Array.isArray(formats)).toBe(true);
      expect(formats.length).toBeGreaterThan(0);
    });

    it('should get all metadata', async () => {
      const metadata = await registry.getAllMetadata();

      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata.length).toBeGreaterThan(0);

      metadata.forEach((m) => {
        expect(m).toHaveProperty('format');
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('extension');
        expect(m).toHaveProperty('mimeType');
        expect(m).toHaveProperty('category');
      });
    });
  });

  describe('Category Filtering', () => {
    it('should get sequence formats', async () => {
      const formats = await registry.getFormatsByCategory('sequence');

      expect(formats).toContain('png-sequence');
      expect(formats).toContain('jpeg-sequence');
      expect(formats).toContain('webp-sequence');
    });

    it('should get archive formats', async () => {
      const formats = await registry.getFormatsByCategory('archive');

      expect(formats).toContain('zip-png');
      expect(formats).toContain('zip-jpeg');
      expect(formats).toContain('zip-webp');
    });
  });

  describe('Custom Registration', () => {
    it('should register custom encoder', async () => {
      const customMetadata: EncoderMetadata = {
        format: 'custom-format',
        name: 'Custom Format',
        extension: 'cst',
        mimeType: 'application/custom',
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        category: 'image',
        description: 'A custom format for testing',
      };

      registry.registerEncoder('custom-format' as ExportFormat, {
        factory: async () => ({ getExtension: () => 'cst' }) as any,
        metadata: customMetadata,
      });

      expect(await registry.hasFormat('custom-format' as ExportFormat)).toBe(true);
      expect(await registry.getMetadata('custom-format' as ExportFormat)).toEqual(customMetadata);
    });

    it('should clear all encoders', async () => {
      // Verify default encoders exist
      expect(await registry.hasFormat('png-sequence')).toBe(true);

      // Clear
      registry.clear();

      // Re-initialize (will load defaults again)
      const formats = await registry.getAvailableFormats();
      expect(formats).toContain('png-sequence');
    });
  });
});

describe('getEncoder helper', () => {
  beforeEach(() => {
    EncoderRegistry.resetInstance();
  });

  it('should get encoder using helper function', async () => {
    const encoder = await getEncoder('png-sequence', { output: 'test' });
    expect(encoder).toBeDefined();
    expect(encoder.getExtension()).toBe('png');
  });
});

describe('EncoderMetadata', () => {
  let registry: EncoderRegistry;

  beforeEach(() => {
    EncoderRegistry.resetInstance();
    registry = EncoderRegistry.getInstance();
  });

  it('should have complete metadata for all formats', async () => {
    const formats = await registry.getAvailableFormats();

    for (const format of formats) {
      const metadata = await registry.getMetadata(format);

      expect(metadata).toBeDefined();
      expect(metadata!.format).toBe(format);
      expect(typeof metadata!.name).toBe('string');
      expect(typeof metadata!.extension).toBe('string');
      expect(typeof metadata!.mimeType).toBe('string');
      expect(typeof metadata!.supportsTransparency).toBe('boolean');
      expect(typeof metadata!.supportsAnimation).toBe('boolean');
      expect(typeof metadata!.supportsQuality).toBe('boolean');
      expect(['image', 'video', 'sequence', 'archive']).toContain(metadata!.category);
      expect(typeof metadata!.description).toBe('string');
    }
  });
});
