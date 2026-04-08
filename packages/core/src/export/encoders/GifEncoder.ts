/**
 * GIF Encoder - Encodes frames into animated GIF format
 *
 * Uses gif.js library for high-quality GIF encoding with
 * color quantization and dithering support.
 *
 * @module export/encoders/GifEncoder
 */

import type {
  Encoder,
  EncoderCapability,
  EncoderProgressCallback,
  GifEncoderOptions,
  OutputFormat,
} from '../types';
import { DEFAULT_GIF_OPTIONS } from '../types';

/**
 * gif.js GIF instance interface
 */
interface GIFInstance {
  addFrame(imageData: ImageData | HTMLCanvasElement, options: { delay: number }): void;
  render(): void;
  abort(): void;
  on(event: 'progress', callback: (progress: number) => void): void;
  on(event: 'finished', callback: (blob: Blob) => void): void;
  on(event: 'abort', callback: () => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
}

/**
 * gif.js options interface
 */
interface GIFOptions {
  workers?: number;
  quality?: number;
  width?: number;
  height?: number;
  workerScript?: string;
  background?: string;
  dither?: 'fs' | 'bayer' | 'none' | false;
  repeat?: number;
  transparent?: number | null;
}

/**
 * gif.js constructor interface
 */
interface GIFConstructor {
  new (options: GIFOptions): GIFInstance;
}

/**
 * Type guard to check if GIF constructor is available on window
 */
function getGifConstructor(): GIFConstructor | undefined {
  if (typeof window !== 'undefined') {
    const anyWindow = window as unknown as { GIF?: GIFConstructor };
    return anyWindow.GIF;
  }
  return undefined;
}

/**
 * GIF Encoder using gif.js library
 *
 * Provides high-quality GIF encoding with:
 * - Floyd-Steinberg or Bayer dithering
 * - Configurable color palette (1-256 colors)
 * - Progress callbacks
 * - Abort support
 * - Automatic fallback to Canvas 2D rendering
 *
 * @example
 * ```typescript
 * const encoder = new GifEncoder();
 * const blob = await encoder.encode(frames, {
 *   loop: 0,
 *   frameDelay: 100,
 *   dither: 'fs',
 *   colors: 256,
 * }, (progress) => {
 *   console.log(`Encoding: ${Math.round(progress * 100)}%`);
 * });
 * ```
 */
export class GifEncoder implements Encoder<GifEncoderOptions> {
  readonly name = 'gif.js';
  private gifInstance: GIFInstance | null = null;
  private aborted = false;

  /**
   * Get encoder capabilities
   */
  getCapabilities(): EncoderCapability {
    return {
      format: 'gif' as OutputFormat,
      mimeType: 'image/gif',
      extension: 'gif',
      supportsTransparency: true,
      supportsAudio: false,
      isAvailable: GifEncoder.isAvailable,
    };
  }

  /**
   * Check if gif.js is available
   */
  static async isAvailable(): Promise<boolean> {
    // Check if gif.js is loaded in browser environment
    const GIF = getGifConstructor();
    if (GIF !== undefined) {
      return true;
    }

    // Check if we're in a browser-like environment with Web Workers
    if (typeof Worker !== 'undefined') {
      return true;
    }

    // In Node.js or environments without Workers, use canvas fallback
    return typeof (globalThis as unknown as { ImageData?: unknown }).ImageData !== 'undefined';
  }

  /**
   * Encode frames into GIF format
   *
   * @param frames - Array of ImageData frames to encode
   * @param options - GIF encoding options
   * @param onProgress - Progress callback (0-1)
   * @returns Promise resolving to GIF Blob
   */
  async encode(
    frames: ImageData[],
    options: GifEncoderOptions,
    onProgress?: EncoderProgressCallback,
  ): Promise<Blob> {
    if (!frames || frames.length === 0) {
      throw new Error('No frames provided for GIF encoding');
    }

    // Reset state
    this.aborted = false;

    // Merge options with defaults
    const opts = {
      ...DEFAULT_GIF_OPTIONS,
      ...options,
    } as Required<GifEncoderOptions>;

    // Validate options
    if (opts.colors < 1 || opts.colors > 256) {
      throw new Error('Colors must be between 1 and 256');
    }

    if (opts.quality < 1 || opts.quality > 20) {
      throw new Error('Quality must be between 1 and 20');
    }

    // Try gif.js encoding first
    const GIF = getGifConstructor();
    if (GIF !== undefined) {
      return this.encodeWithGifJs(GIF, frames, opts, onProgress);
    }

    // Fallback to Canvas 2D rendering
    return this.encodeWithCanvas2D(frames, opts, onProgress);
  }

  /**
   * Encode using gif.js library
   */
  private encodeWithGifJs(
    GIF: GIFConstructor,
    frames: ImageData[],
    options: Required<GifEncoderOptions>,
    onProgress?: EncoderProgressCallback,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (this.aborted) {
        reject(new Error('Encoding was aborted'));
        return;
      }

      // Determine dimensions from first frame
      const firstFrame = frames[0];
      if (!firstFrame) {
        reject(new Error('First frame is undefined'));
        return;
      }

      const width = options.width ?? firstFrame.width;
      const height = options.height ?? firstFrame.height;

      // Create gif.js instance
      const gifOptions: GIFOptions = {
        workers: options.workers,
        quality: options.quality,
        width,
        height,
        repeat: options.loop,
        dither: options.dither === 'none' ? false : options.dither,
        background: options.backgroundColor ?? '#000000',
      };

      // Handle transparency
      if (options.transparent && options.transparentColor) {
        gifOptions.transparent = this.parseColor(options.transparentColor);
      }

      let gifInstance: GIFInstance;
      try {
        gifInstance = new GIF(gifOptions);
        this.gifInstance = gifInstance;
      } catch (error) {
        reject(
          new Error(
            `Failed to initialize gif.js: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
        return;
      }

      // Set up event handlers
      gifInstance.on('progress', (progress: number) => {
        if (onProgress && !this.aborted) {
          onProgress(progress);
        }
      });

      gifInstance.on('finished', (blob: Blob) => {
        this.gifInstance = null;
        if (this.aborted) {
          reject(new Error('Encoding was aborted'));
        } else {
          resolve(blob);
        }
      });

      gifInstance.on('abort', () => {
        this.gifInstance = null;
        reject(new Error('Encoding was aborted'));
      });

      gifInstance.on('error', (error: Error) => {
        this.gifInstance = null;
        reject(new Error(`GIF encoding error: ${error.message}`));
      });

      // Add all frames
      try {
        for (const frame of frames) {
          if (this.aborted) break;

          // Create canvas for frame if dimensions differ
          if (frame.width !== width || frame.height !== height) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              // Create temporary canvas with frame data
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = frame.width;
              tempCanvas.height = frame.height;
              const tempCtx = tempCanvas.getContext('2d');

              if (tempCtx) {
                tempCtx.putImageData(frame, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, width, height);
                gifInstance.addFrame(canvas, { delay: options.frameDelay });
                continue;
              }
            }
          }

          gifInstance.addFrame(frame, { delay: options.frameDelay });
        }

        if (this.aborted) {
          gifInstance.abort();
          return;
        }

        // Start rendering
        gifInstance.render();
      } catch (error) {
        this.gifInstance = null;
        reject(
          new Error(
            `Failed to add frames: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    });
  }

  /**
   * Fallback encoding using Canvas 2D (without proper GIF compression)
   *
   * This creates a simple animated format that can be displayed as a GIF.
   * Note: This is a simplified implementation and may not produce optimal GIFs.
   */
  private async encodeWithCanvas2D(
    frames: ImageData[],
    options: Required<GifEncoderOptions>,
    onProgress?: EncoderProgressCallback,
  ): Promise<Blob> {
    // Report initial progress
    if (onProgress) {
      onProgress(0);
    }

    const firstFrame = frames[0];
    if (!firstFrame) {
      throw new Error('No frames available');
    }

    const width = options.width ?? firstFrame.width;
    const height = options.height ?? firstFrame.height;

    // Create a simple GIF header and frames
    // This is a basic implementation for environments without gif.js
    const gifData = this.createSimpleGif(frames, width, height, options);

    // Report progress for each frame
    for (let i = 0; i < frames.length; i++) {
      if (this.aborted) {
        throw new Error('Encoding was aborted');
      }

      if (onProgress) {
        onProgress((i + 1) / frames.length);
      }

      // Small delay to allow progress updates
      await new Promise((resolve) => setTimeout(resolve, 1));
    }

    if (onProgress) {
      onProgress(1);
    }

    return new Blob([gifData.buffer as ArrayBuffer], { type: 'image/gif' });
  }

  /**
   * Create a simple GIF binary (basic implementation)
   *
   * This creates a valid GIF file structure with minimal compression.
   * For production use, gif.js should be used instead.
   */
  private createSimpleGif(
    frames: ImageData[],
    width: number,
    height: number,
    options: Required<GifEncoderOptions>,
  ): Uint8Array {
    const chunks: Uint8Array[] = [];

    // GIF Header
    chunks.push(new TextEncoder().encode('GIF89a'));

    // Logical Screen Descriptor
    const lsd = new Uint8Array(7);
    lsd[0] = width & 0xff;
    lsd[1] = (width >> 8) & 0xff;
    lsd[2] = height & 0xff;
    lsd[3] = (height >> 8) & 0xff;
    // Global Color Table Flag (1), Color Resolution (7 = 8 bits), Sort Flag (0), Size (7 = 256 colors)
    lsd[4] = 0xf7; // 11110111
    lsd[5] = 0; // Background color index
    lsd[6] = 0; // Pixel aspect ratio
    chunks.push(lsd);

    // Global Color Table (256 colors)
    const gct = new Uint8Array(768);
    for (let i = 0; i < 256; i++) {
      gct[i * 3] = i; // Red
      gct[i * 3 + 1] = i; // Green
      gct[i * 3 + 2] = i; // Blue
    }
    chunks.push(gct);

    // Netscape Extension for looping
    if (options.loop !== 1) {
      const appExt = new Uint8Array([
        0x21,
        0xff,
        0x0b, // Application Extension
        ...new TextEncoder().encode('NETSCAPE2.0'),
        0x03,
        0x01, // Sub-block size, loop indicator
        options.loop & 0xff,
        (options.loop >> 8) & 0xff, // Loop count (0 = infinite)
        0x00, // Block terminator
      ]);
      chunks.push(appExt);
    }

    // Add each frame
    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
      const frame = frames[frameIndex];
      if (!frame) continue;

      // Graphic Control Extension
      const gce = new Uint8Array(8);
      gce[0] = 0x21; // Extension Introducer
      gce[1] = 0xf9; // Graphic Control Label
      gce[2] = 0x04; // Block Size
      // Disposal method (1 = don't dispose), User input flag (0), Transparency flag (0)
      gce[3] = options.transparent ? 0x09 : 0x00;
      // Delay time in centiseconds
      const delayCs = Math.round(options.frameDelay / 10);
      gce[4] = delayCs & 0xff;
      gce[5] = (delayCs >> 8) & 0xff;
      gce[6] = 0; // Transparent color index
      gce[7] = 0x00; // Block terminator
      chunks.push(gce);

      // Image Descriptor
      const imgDesc = new Uint8Array(10);
      imgDesc[0] = 0x2c; // Image Separator
      imgDesc[1] = 0;
      imgDesc[2] = 0; // Left position
      imgDesc[3] = 0;
      imgDesc[4] = 0; // Top position
      imgDesc[5] = width & 0xff;
      imgDesc[6] = (width >> 8) & 0xff;
      imgDesc[7] = height & 0xff;
      imgDesc[8] = (height >> 8) & 0xff;
      imgDesc[9] = 0; // No local color table
      chunks.push(imgDesc);

      // Image Data (simplified LZW encoding)
      const imageData = this.lzwEncode(frame.data, width, height, options.colors);
      chunks.push(imageData);
    }

    // GIF Trailer
    chunks.push(new Uint8Array([0x3b]));

    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Simplified LZW encoding for GIF image data
   */
  private lzwEncode(
    imageData: Uint8ClampedArray,
    _width: number,
    _height: number,
    colors: number,
  ): Uint8Array {
    const minCodeSize = Math.max(2, Math.ceil(Math.log2(colors)));
    const chunks: number[] = [];

    // Add minimum code size
    chunks.push(minCodeSize);

    // Initialize code table
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = endCode + 1;
    const codeTable = new Map<string, number>();

    // Initialize with single-pixel codes
    for (let i = 0; i < clearCode; i++) {
      codeTable.set(String(i), i);
    }

    // Convert RGBA to color indices (simplified color quantization)
    const pixels: number[] = [];
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i] ?? 0;
      const g = imageData[i + 1] ?? 0;
      const b = imageData[i + 2] ?? 0;
      // Simple grayscale conversion for color index
      const index = Math.floor((r + g + b) / 3) % colors;
      pixels.push(index);
    }

    // LZW encoding (simplified)
    const outputCodes: number[] = [clearCode]; // Start with clear code

    if (pixels.length > 0) {
      let current = String(pixels[0]);

      for (let i = 1; i < pixels.length; i++) {
        const next = String(pixels[i]);
        const combined = current + ',' + next;

        if (codeTable.has(combined)) {
          current = combined;
        } else {
          // Output current code
          outputCodes.push(codeTable.get(current)!);

          // Add new code if table not full
          if (nextCode < 4096) {
            codeTable.set(combined, nextCode++);

            // Increase code size if needed
            if (nextCode > 1 << codeSize && codeSize < 12) {
              codeSize++;
            }
          } else {
            // Table full, output clear code and reset
            outputCodes.push(clearCode);
            codeSize = minCodeSize + 1;
            nextCode = endCode + 1;
            codeTable.clear();
            for (let j = 0; j < clearCode; j++) {
              codeTable.set(String(j), j);
            }
          }

          current = next;
        }
      }

      // Output last code
      outputCodes.push(codeTable.get(current)!);
    }

    // End code
    outputCodes.push(endCode);

    // Pack codes into bytes
    const subBlocks: Uint8Array[] = [];
    let currentBlock: number[] = [];
    let bitBuffer = 0;
    let bitsInBuffer = 0;

    for (const code of outputCodes) {
      bitBuffer |= code << bitsInBuffer;
      bitsInBuffer += codeSize;

      while (bitsInBuffer >= 8) {
        currentBlock.push(bitBuffer & 0xff);
        bitBuffer >>= 8;
        bitsInBuffer -= 8;

        if (currentBlock.length === 255) {
          subBlocks.push(new Uint8Array([255, ...currentBlock]));
          currentBlock = [];
        }
      }
    }

    // Flush remaining bits
    if (bitsInBuffer > 0) {
      currentBlock.push(bitBuffer & 0xff);
    }

    // Add remaining bytes as sub-block
    if (currentBlock.length > 0) {
      subBlocks.push(new Uint8Array([currentBlock.length, ...currentBlock]));
    }

    // Block terminator
    subBlocks.push(new Uint8Array([0]));

    // Combine all sub-blocks
    const totalLength = subBlocks.reduce((sum, block) => sum + block.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const block of subBlocks) {
      result.set(block, offset);
      offset += block.length;
    }

    return result;
  }

  /**
   * Parse CSS color string to RGB value
   */
  private parseColor(color: string): number {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 6) {
        return parseInt(hex, 16);
      }
      if (hex.length === 3) {
        const r = hex[0] ?? '0';
        const g = hex[1] ?? '0';
        const b = hex[2] ?? '0';
        return parseInt(r + r + g + g + b + b, 16);
      }
    }

    // Handle named colors (basic support)
    const namedColors: Record<string, number> = {
      transparent: 0x000000,
      black: 0x000000,
      white: 0xffffff,
      red: 0xff0000,
      green: 0x00ff00,
      blue: 0x0000ff,
    };

    const lowerColor = color.toLowerCase();
    if (namedColors[lowerColor] !== undefined) {
      return namedColors[lowerColor];
    }

    // Default to black
    return 0x000000;
  }

  /**
   * Abort current encoding operation
   */
  abort(): void {
    this.aborted = true;
    if (this.gifInstance) {
      this.gifInstance.abort();
      this.gifInstance = null;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.abort();
  }
}

/**
 * Factory function to create GifEncoder instances
 */
export function createGifEncoder(_options?: GifEncoderOptions): GifEncoder {
  return new GifEncoder();
}

/**
 * GIF encoder capabilities for registration
 */
export const gifEncoderCapabilities: EncoderCapability = {
  format: 'gif',
  mimeType: 'image/gif',
  extension: 'gif',
  supportsTransparency: true,
  supportsAudio: false,
  isAvailable: GifEncoder.isAvailable,
};

export default GifEncoder;
