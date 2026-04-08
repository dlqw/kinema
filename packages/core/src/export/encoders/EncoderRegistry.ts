/**
 * Encoder Registry - Central registry for all export encoders
 *
 * Provides a unified interface for registering and retrieving
 * export encoders by format.
 *
 * @module export/encoders/EncoderRegistry
 */

import type { ExportConfig, Exporter } from '../Exporter';
import type { ImageSequenceConfig } from './ImageSequenceEncoder';

/**
 * Supported export formats
 */
export type ExportFormat =
  | 'png'
  | 'jpeg'
  | 'webp'
  | 'gif'
  | 'webm'
  | 'mp4'
  | 'png-sequence'
  | 'jpeg-sequence'
  | 'webp-sequence'
  | 'zip-png'
  | 'zip-jpeg'
  | 'zip-webp';

/**
 * Async encoder factory function type
 */
export type AsyncEncoderFactory = (config: ExportConfig) => Promise<Exporter>;

/**
 * Encoder metadata
 */
export interface EncoderMetadata {
  /** Format identifier */
  format: ExportFormat;
  /** Human-readable format name */
  name: string;
  /** File extension */
  extension: string;
  /** MIME type */
  mimeType: string;
  /** Whether format supports transparency */
  supportsTransparency: boolean;
  /** Whether format supports animation */
  supportsAnimation: boolean;
  /** Whether format supports quality setting */
  supportsQuality: boolean;
  /** Default quality for lossy formats */
  defaultQuality?: number;
  /** Format category */
  category: 'image' | 'video' | 'sequence' | 'archive';
  /** Description */
  description: string;
}

/**
 * Encoder registration entry
 */
interface EncoderEntry {
  factory: AsyncEncoderFactory;
  metadata: EncoderMetadata;
}

/**
 * Encoder Registry class
 *
 * Manages registration and retrieval of export encoders.
 *
 * @example
 * ```typescript
 * const registry = EncoderRegistry.getInstance();
 *
 * // Get encoder for PNG format
 * const encoder = await registry.getEncoder('png', { output: 'image.png' });
 *
 * // Get available formats
 * const formats = await registry.getAvailableFormats();
 * ```
 */
export class EncoderRegistry {
  private static instance: EncoderRegistry | null = null;
  private encoders: Map<ExportFormat, EncoderEntry> = new Map();
  private initialized: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): EncoderRegistry {
    if (!EncoderRegistry.instance) {
      EncoderRegistry.instance = new EncoderRegistry();
    }
    return EncoderRegistry.instance;
  }

  /**
   * Initialize default encoders
   */
  private async initializeDefaults(): Promise<void> {
    if (this.initialized) return;

    // Register built-in encoders
    // Image sequence encoders
    this.registerEncoder('png-sequence', {
      factory: async (config: ExportConfig) => {
        const { ImageSequenceEncoder } = await import('./ImageSequenceEncoder');
        return new ImageSequenceEncoder({
          ...config,
          format: 'png',
          outputMode: 'files',
        } as ImageSequenceConfig);
      },
      metadata: {
        format: 'png-sequence',
        name: 'PNG Sequence',
        extension: 'png',
        mimeType: 'image/png',
        supportsTransparency: true,
        supportsAnimation: true,
        supportsQuality: false,
        category: 'sequence',
        description: 'Individual PNG files for each frame',
      },
    });

    this.registerEncoder('jpeg-sequence', {
      factory: async (config: ExportConfig) => {
        const { ImageSequenceEncoder } = await import('./ImageSequenceEncoder');
        return new ImageSequenceEncoder({
          ...config,
          format: 'jpeg',
          outputMode: 'files',
        } as ImageSequenceConfig);
      },
      metadata: {
        format: 'jpeg-sequence',
        name: 'JPEG Sequence',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        supportsTransparency: false,
        supportsAnimation: true,
        supportsQuality: true,
        defaultQuality: 0.9,
        category: 'sequence',
        description: 'Individual JPEG files for each frame',
      },
    });

    this.registerEncoder('webp-sequence', {
      factory: async (config: ExportConfig) => {
        const { ImageSequenceEncoder } = await import('./ImageSequenceEncoder');
        return new ImageSequenceEncoder({
          ...config,
          format: 'webp',
          outputMode: 'files',
        } as ImageSequenceConfig);
      },
      metadata: {
        format: 'webp-sequence',
        name: 'WebP Sequence',
        extension: 'webp',
        mimeType: 'image/webp',
        supportsTransparency: true,
        supportsAnimation: true,
        supportsQuality: true,
        defaultQuality: 0.9,
        category: 'sequence',
        description: 'Individual WebP files for each frame',
      },
    });

    // ZIP archive encoders
    this.registerEncoder('zip-png', {
      factory: async (config: ExportConfig) => {
        const { ImageSequenceEncoder } = await import('./ImageSequenceEncoder');
        return new ImageSequenceEncoder({
          ...config,
          format: 'png',
          outputMode: 'zip',
        } as ImageSequenceConfig);
      },
      metadata: {
        format: 'zip-png',
        name: 'PNG Sequence (ZIP)',
        extension: 'zip',
        mimeType: 'application/zip',
        supportsTransparency: true,
        supportsAnimation: true,
        supportsQuality: false,
        category: 'archive',
        description: 'PNG frames bundled in a ZIP archive',
      },
    });

    this.registerEncoder('zip-jpeg', {
      factory: async (config: ExportConfig) => {
        const { ImageSequenceEncoder } = await import('./ImageSequenceEncoder');
        return new ImageSequenceEncoder({
          ...config,
          format: 'jpeg',
          outputMode: 'zip',
        } as ImageSequenceConfig);
      },
      metadata: {
        format: 'zip-jpeg',
        name: 'JPEG Sequence (ZIP)',
        extension: 'zip',
        mimeType: 'application/zip',
        supportsTransparency: false,
        supportsAnimation: true,
        supportsQuality: true,
        defaultQuality: 0.9,
        category: 'archive',
        description: 'JPEG frames bundled in a ZIP archive',
      },
    });

    this.registerEncoder('zip-webp', {
      factory: async (config: ExportConfig) => {
        const { ImageSequenceEncoder } = await import('./ImageSequenceEncoder');
        return new ImageSequenceEncoder({
          ...config,
          format: 'webp',
          outputMode: 'zip',
        } as ImageSequenceConfig);
      },
      metadata: {
        format: 'zip-webp',
        name: 'WebP Sequence (ZIP)',
        extension: 'zip',
        mimeType: 'application/zip',
        supportsTransparency: true,
        supportsAnimation: true,
        supportsQuality: true,
        defaultQuality: 0.9,
        category: 'archive',
        description: 'WebP frames bundled in a ZIP archive',
      },
    });

    this.initialized = true;
  }

  /**
   * Register an encoder
   *
   * @param format - Format identifier
   * @param entry - Encoder factory and metadata
   */
  registerEncoder(format: ExportFormat, entry: EncoderEntry): void {
    this.encoders.set(format, entry);
  }

  /**
   * Get an encoder for a format
   *
   * @param format - Format identifier
   * @param config - Export configuration
   * @returns Promise resolving to encoder instance
   */
  async getEncoder(format: ExportFormat, config: ExportConfig): Promise<Exporter> {
    await this.initializeDefaults();

    const entry = this.encoders.get(format);
    if (!entry) {
      throw new Error(`Encoder not found for format: ${format}`);
    }

    return entry.factory(config);
  }

  /**
   * Get encoder metadata
   *
   * @param format - Format identifier
   * @returns Encoder metadata or undefined
   */
  async getMetadata(format: ExportFormat): Promise<EncoderMetadata | undefined> {
    await this.initializeDefaults();
    return this.encoders.get(format)?.metadata;
  }

  /**
   * Check if a format is registered
   *
   * @param format - Format identifier
   * @returns Whether format is available
   */
  async hasFormat(format: ExportFormat): Promise<boolean> {
    await this.initializeDefaults();
    return this.encoders.has(format);
  }

  /**
   * Get all available formats
   *
   * @returns Array of format identifiers
   */
  async getAvailableFormats(): Promise<ExportFormat[]> {
    await this.initializeDefaults();
    return Array.from(this.encoders.keys());
  }

  /**
   * Get all encoder metadata
   *
   * @returns Array of encoder metadata
   */
  async getAllMetadata(): Promise<EncoderMetadata[]> {
    await this.initializeDefaults();
    return Array.from(this.encoders.values()).map((entry) => entry.metadata);
  }

  /**
   * Get formats by category
   *
   * @param category - Category to filter by
   * @returns Array of format identifiers
   */
  async getFormatsByCategory(category: EncoderMetadata['category']): Promise<ExportFormat[]> {
    await this.initializeDefaults();
    return Array.from(this.encoders.entries())
      .filter(([_, entry]) => entry.metadata.category === category)
      .map(([format]) => format);
  }

  /**
   * Detect format from file extension
   *
   * @param filename - File name or path
   * @returns Detected format or undefined
   */
  async detectFormat(filename: string): Promise<ExportFormat | undefined> {
    await this.initializeDefaults();

    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return undefined;

    // Map extensions to formats
    const extensionMap: Record<string, ExportFormat> = {
      png: 'png-sequence',
      jpg: 'jpeg-sequence',
      jpeg: 'jpeg-sequence',
      webp: 'webp-sequence',
      gif: 'gif',
      webm: 'webm',
      mp4: 'mp4',
      zip: 'zip-png', // Default to PNG for ZIP
    };

    return extensionMap[ext];
  }

  /**
   * Clear all registered encoders (for testing)
   */
  clear(): void {
    this.encoders.clear();
    this.initialized = false;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    EncoderRegistry.instance = null;
  }
}

/**
 * Get the global encoder registry instance
 */
export function getEncoderRegistry(): EncoderRegistry {
  return EncoderRegistry.getInstance();
}

/**
 * Quick helper to get an encoder
 *
 * @param format - Format identifier
 * @param config - Export configuration
 * @returns Promise resolving to encoder instance
 */
export async function getEncoder(format: ExportFormat, config: ExportConfig): Promise<Exporter> {
  return getEncoderRegistry().getEncoder(format, config);
}

/**
 * Default export
 */
export default EncoderRegistry;
