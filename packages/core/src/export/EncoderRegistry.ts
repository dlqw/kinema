/**
 * Encoder Registry - Central registry for output encoders
 *
 * Provides a unified interface for discovering and using encoders
 * across different output formats.
 *
 * @module export/EncoderRegistry
 */

import type {
  Encoder,
  EncoderFactory,
  EncoderOptions,
  EncoderCapability,
  OutputFormat,
  EncoderAvailabilityResult,
} from './types';

/**
 * Encoder entry in the registry
 */
interface EncoderEntry {
  /** Factory function to create encoder instances */
  factory: EncoderFactory;
  /** Encoder capabilities */
  capabilities: EncoderCapability;
  /** Priority (higher = preferred when multiple encoders available) */
  priority: number;
}

/**
 * Encoder Registry
 *
 * Singleton registry for managing output encoders.
 * Supports registration, discovery, and automatic format detection.
 *
 * @example
 * ```typescript
 * // Register a GIF encoder
 * EncoderRegistry.register('gif', gifEncoderFactory, gifCapabilities, 10);
 *
 * // Get best available encoder for a format
 * const encoder = EncoderRegistry.getEncoder('gif', options);
 * ```
 */
export class EncoderRegistry {
  private static instance: EncoderRegistry | null = null;
  private encoders: Map<string, EncoderEntry> = new Map();
  private availabilityCache: Map<string, EncoderAvailabilityResult> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of the registry
   */
  static getInstance(): EncoderRegistry {
    if (!EncoderRegistry.instance) {
      EncoderRegistry.instance = new EncoderRegistry();
    }
    return EncoderRegistry.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance(): void {
    EncoderRegistry.instance = null;
  }

  /**
   * Register an encoder
   *
   * @param name - Unique encoder name
   * @param factory - Factory function to create encoder instances
   * @param capabilities - Encoder capabilities
   * @param priority - Priority for encoder selection (higher = preferred)
   */
  register(
    name: string,
    factory: EncoderFactory,
    capabilities: EncoderCapability,
    priority: number = 0,
  ): void {
    if (this.encoders.has(name)) {
      console.warn(`Encoder "${name}" is already registered. Overwriting.`);
    }

    this.encoders.set(name, {
      factory,
      capabilities,
      priority,
    });

    // Clear availability cache when registering new encoder
    this.availabilityCache.clear();
  }

  /**
   * Unregister an encoder
   *
   * @param name - Encoder name to unregister
   */
  unregister(name: string): boolean {
    const deleted = this.encoders.delete(name);
    if (deleted) {
      this.availabilityCache.clear();
    }
    return deleted;
  }

  /**
   * Check if an encoder is registered
   *
   * @param name - Encoder name
   */
  has(name: string): boolean {
    return this.encoders.has(name);
  }

  /**
   * Get encoder capabilities by name
   *
   * @param name - Encoder name
   */
  getCapabilities(name: string): EncoderCapability | undefined {
    return this.encoders.get(name)?.capabilities;
  }

  /**
   * Get all registered encoder names
   */
  getRegisteredEncoders(): string[] {
    return Array.from(this.encoders.keys());
  }

  /**
   * Get all encoders that produce a specific format
   *
   * @param format - Output format
   */
  getEncodersForFormat(format: OutputFormat): string[] {
    const result: string[] = [];

    for (const [name, entry] of this.encoders) {
      if (entry.capabilities.format === format) {
        result.push(name);
      }
    }

    // Sort by priority (higher first)
    result.sort((a, b) => {
      const priorityA = this.encoders.get(a)?.priority ?? 0;
      const priorityB = this.encoders.get(b)?.priority ?? 0;
      return priorityB - priorityA;
    });

    return result;
  }

  /**
   * Check encoder availability
   *
   * @param name - Encoder name
   */
  async checkAvailability(name: string): Promise<EncoderAvailabilityResult> {
    // Check cache first
    if (this.availabilityCache.has(name)) {
      return this.availabilityCache.get(name)!;
    }

    const entry = this.encoders.get(name);
    if (!entry) {
      const result: EncoderAvailabilityResult = {
        available: false,
        reason: `Encoder "${name}" not found in registry`,
      };
      this.availabilityCache.set(name, result);
      return result;
    }

    try {
      const isAvailable = await entry.capabilities.isAvailable();
      const result: EncoderAvailabilityResult = isAvailable
        ? { available: true }
        : { available: false, reason: 'Encoder not available in current environment' };
      this.availabilityCache.set(name, result);
      return result;
    } catch (error) {
      const result: EncoderAvailabilityResult = {
        available: false,
        reason: error instanceof Error ? error.message : 'Unknown error checking availability',
      };
      this.availabilityCache.set(name, result);
      return result;
    }
  }

  /**
   * Get best available encoder for a format
   *
   * @param format - Output format
   * @returns Encoder name or undefined if none available
   */
  async getBestEncoderForFormat(format: OutputFormat): Promise<string | undefined> {
    const encoders = this.getEncodersForFormat(format);

    for (const name of encoders) {
      const availability = await this.checkAvailability(name);
      if (availability.available) {
        return name;
      }
    }

    return undefined;
  }

  /**
   * Create an encoder instance
   *
   * @param name - Encoder name
   * @param options - Encoder options
   * @returns Encoder instance or undefined if not available
   */
  async createEncoder<TOptions extends EncoderOptions>(
    name: string,
    options: TOptions,
  ): Promise<Encoder<TOptions> | undefined> {
    const availability = await this.checkAvailability(name);

    if (!availability.available) {
      console.warn(`Encoder "${name}" not available: ${availability.reason}`);
      return undefined;
    }

    const entry = this.encoders.get(name);
    if (!entry) {
      return undefined;
    }

    return entry.factory(options) as Encoder<TOptions>;
  }

  /**
   * Create the best available encoder for a format
   *
   * @param format - Output format
   * @param options - Encoder options
   * @returns Encoder instance or undefined if none available
   */
  async createBestEncoder<TOptions extends EncoderOptions>(
    format: OutputFormat,
    options: TOptions,
  ): Promise<Encoder<TOptions> | undefined> {
    const bestName = await this.getBestEncoderForFormat(format);
    if (!bestName) {
      return undefined;
    }

    return this.createEncoder(bestName, options);
  }

  /**
   * Get fallback encoder for a format
   *
   * @param format - Output format
   * @returns Fallback encoder name or undefined
   */
  async getFallbackEncoder(format: OutputFormat): Promise<string | undefined> {
    const encoders = this.getEncodersForFormat(format);

    // Skip the first (best) encoder, find next available
    for (let i = 1; i < encoders.length; i++) {
      const encoderName = encoders[i];
      if (!encoderName) continue;

      const availability = await this.checkAvailability(encoderName);
      if (availability.available) {
        return encoderName;
      }
    }

    return undefined;
  }

  /**
   * Clear all registered encoders
   */
  clear(): void {
    this.encoders.clear();
    this.availabilityCache.clear();
  }

  /**
   * Get MIME type for a format
   *
   * @param format - Output format
   */
  getMimeType(format: OutputFormat): string {
    const mimeTypes: Record<OutputFormat, string> = {
      gif: 'image/gif',
      webm: 'video/webm',
      mp4: 'video/mp4',
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };
    return mimeTypes[format];
  }

  /**
   * Get file extension for a format
   *
   * @param format - Output format
   */
  getExtension(format: OutputFormat): string {
    return format;
  }

  /**
   * Detect format from file name or MIME type
   *
   * @param input - File name or MIME type
   */
  detectFormat(input: string): OutputFormat | undefined {
    const lower = input.toLowerCase();

    // Check MIME type
    if (lower.includes('gif')) return 'gif';
    if (lower.includes('webm')) return 'webm';
    if (lower.includes('mp4')) return 'mp4';
    if (lower.includes('png')) return 'png';
    if (lower.includes('jpeg') || lower.includes('jpg')) return 'jpeg';
    if (lower.includes('webp')) return 'webp';

    // Check file extension
    if (lower.endsWith('.gif')) return 'gif';
    if (lower.endsWith('.webm')) return 'webm';
    if (lower.endsWith('.mp4')) return 'mp4';
    if (lower.endsWith('.png')) return 'png';
    if (lower.endsWith('.jpeg') || lower.endsWith('.jpg')) return 'jpeg';
    if (lower.endsWith('.webp')) return 'webp';

    return undefined;
  }
}

// Export singleton instance getter
export const getEncoderRegistry = (): EncoderRegistry => EncoderRegistry.getInstance();

// Export for convenience
export default EncoderRegistry;
