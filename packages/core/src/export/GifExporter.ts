/**
 * GIF Exporter - Export scenes as animated GIFs
 *
 * Uses GifEncoder with gif.js library for high-quality GIF encoding.
 * Falls back to Canvas 2D rendering when gif.js is not available.
 *
 * @module export/GifExporter
 */

import type { Scene } from '../types';
import { Exporter, type ExportProgress, type ExportResult } from './Exporter';
import type { ExportConfig } from './Exporter';
import { CanvasFrameEncoder, type FrameEncoderOptions } from './FrameEncoder';
import { GifEncoder } from './encoders/GifEncoder';
import type { GifEncoderOptions, EncoderProgressCallback } from './types';

/**
 * GIF export configuration
 */
export interface GifExportConfig extends ExportConfig {
  /** Number of times to loop (0 = infinite) */
  loop?: number;
  /** Delay between frames in milliseconds */
  frameDelay?: number;
  /** Dithering method */
  dither?: 'fs' | 'bayer' | 'none';
  /** Color palette size (1-256) */
  colors?: number;
  /** Quality for color quantization (1-20, lower is better) */
  quality?: number;
  /** Export duration in seconds */
  duration?: number;
  /** Start time */
  startTime?: number;
  /** Number of workers for parallel processing */
  workers?: number;
  /** Whether to use transparency */
  transparent?: boolean;
  /** Transparent color */
  transparentColor?: string | null;
}

/**
 * GIF export result
 */
export interface GifExportResult extends ExportResult {
  /** Number of frames in GIF */
  frameCount: number;
  /** GIF duration in seconds */
  gifDuration: number;
  /** File size in bytes */
  size?: number;
}

/**
 * GIF exporter for creating animated GIFs
 *
 * Uses GifEncoder (gif.js) for high-quality encoding with:
 * - Floyd-Steinberg or Bayer dithering
 * - Configurable color palette
 * - Progress callbacks
 * - Abort support
 * - Automatic fallback when gif.js unavailable
 *
 * @example
 * ```typescript
 * const exporter = new GifExporter({
 *   output: 'animation.gif',
 *   duration: 5,
 *   fps: 30,
 *   dither: 'fs',
 *   colors: 256
 * });
 *
 * const result = await exporter.export(scene, (progress) => {
 *   console.log(`Creating GIF: ${Math.round(progress.progress * 100)}%`);
 * });
 * ```
 */
export class GifExporter extends Exporter {
  private frameEncoder: CanvasFrameEncoder;
  private gifEncoder: GifEncoder;
  declare protected config: GifExportConfig;

  constructor(config: GifExportConfig) {
    super(config);
    this.config = config;

    // Frame encoder for capturing scene frames
    const encoderOptions: FrameEncoderOptions = { format: 'png' };
    if (config.backgroundColor !== undefined) {
      encoderOptions.backgroundColor = config.backgroundColor;
    }
    if (config.width !== undefined) {
      encoderOptions.width = config.width;
    }
    if (config.height !== undefined) {
      encoderOptions.height = config.height;
    }
    this.frameEncoder = new CanvasFrameEncoder(encoderOptions);

    // GIF encoder for encoding frames into GIF format
    this.gifEncoder = new GifEncoder();
  }

  /**
   * Export scene as animated GIF
   */
  async export(
    scene: Scene,
    progressCallback?: (progress: ExportProgress) => void,
  ): Promise<GifExportResult> {
    this.validateConfig();
    if (progressCallback !== undefined) {
      this.progressCallback = progressCallback;
    }
    this.resetCancel();

    try {
      const duration = this.config.duration ?? 5;
      const startTime = this.config.startTime ?? 0;
      const fps = this.config.fps ?? scene.config.fps;
      const frameCount = this.getFrameCount(duration, fps);
      const { width, height } = this.getDimensions(scene);

      // Phase 1: Capture frames (0% - 50%)
      const frames: ImageData[] = [];

      for (let i = 0; i < frameCount; i++) {
        if (this.cancelled) {
          return this.createCancelledResult(0, 0);
        }

        const time = startTime + i / fps;

        this.reportProgress({
          currentFrame: i + 1,
          totalFrames: frameCount,
          progress: ((i + 1) / frameCount) * 0.5, // First 50% for frame capture
          operation: 'Capturing frames',
        });

        // Render and capture frame
        const encoded = await this.frameEncoder.encodeFrame(this.renderFrame(scene, time), time, i);

        // Convert Blob to ImageData
        const imageData = await this.blobToImageData(encoded.data as Blob, width, height);
        frames.push(imageData);
      }

      if (this.cancelled) {
        return this.createCancelledResult(frameCount, duration);
      }

      // Phase 2: Encode GIF (50% - 100%)
      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 0.5,
        operation: 'Encoding GIF',
      });

      const gifOptions: GifEncoderOptions = {
        width,
        height,
        loop: this.config.loop ?? 0,
        frameDelay: this.config.frameDelay ?? Math.round(1000 / fps),
        dither: this.config.dither ?? 'fs',
        colors: this.config.colors ?? 256,
        quality: this.config.quality ?? 10,
        workers: this.config.workers ?? 2,
        transparent: this.config.transparent ?? false,
      };

      // Add optional properties only if they're defined
      if (this.config.backgroundColor !== undefined) {
        gifOptions.backgroundColor = this.config.backgroundColor;
      }
      if (this.config.transparentColor !== undefined) {
        gifOptions.transparentColor = this.config.transparentColor;
      }

      // Create progress wrapper for encoding phase
      const encodeProgressCallback: EncoderProgressCallback = (encodeProgress) => {
        if (this.cancelled) {
          this.gifEncoder.abort();
          return;
        }

        this.reportProgress({
          currentFrame: frameCount,
          totalFrames: frameCount,
          progress: 0.5 + encodeProgress * 0.5, // Last 50% for encoding
          operation: 'Encoding GIF',
        });
      };

      const gifBlob = await this.gifEncoder.encode(frames, gifOptions, encodeProgressCallback);

      if (this.cancelled) {
        return this.createCancelledResult(frameCount, duration);
      }

      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 1,
        operation: 'Complete',
      });

      // Download the GIF
      this.downloadGif(gifBlob);

      return {
        success: true,
        output: this.config.output,
        frameCount,
        gifDuration: duration,
        size: gifBlob.size,
      };
    } catch (error) {
      return {
        success: false,
        frameCount: 0,
        gifDuration: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Convert Blob to ImageData
   */
  private async blobToImageData(blob: Blob, width: number, height: number): Promise<ImageData> {
    if (typeof window === 'undefined') {
      // Node.js environment - create mock ImageData
      return new ImageData(width, height);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        URL.revokeObjectURL(img.src);
        resolve(imageData);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Create cancelled result
   */
  private createCancelledResult(frameCount: number, duration: number): GifExportResult {
    return {
      success: false,
      frameCount,
      gifDuration: duration,
      error: 'Export was cancelled',
    };
  }

  /**
   * Cancel the export
   */
  override cancel(): void {
    super.cancel();
    this.gifEncoder.abort();
  }

  /**
   * Download the GIF
   */
  private downloadGif(data: Blob): void {
    if (typeof window === 'undefined') return;

    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.config.output;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return 'gif';
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.frameEncoder.dispose();
    this.gifEncoder.dispose();
  }
}

/**
 * Quick export helper - exports a scene as an animated GIF
 *
 * @param scene - The scene to export
 * @param output - Output file name
 * @param options - Export options
 * @returns Promise resolving to export result
 *
 * @example
 * ```typescript
 * await exportAsGif(scene, 'animation.gif', {
 *   duration: 5,
 *   fps: 30,
 *   quality: 10,
 *   dither: 'fs',
 *   colors: 256
 * });
 * ```
 */
export async function exportAsGif(
  scene: Scene,
  output: string,
  options: {
    duration?: number;
    fps?: number;
    loop?: number;
    quality?: number;
    dither?: 'fs' | 'bayer' | 'none';
    colors?: number;
    startTime?: number;
    workers?: number;
    transparent?: boolean;
    transparentColor?: string;
  } = {},
): Promise<GifExportResult> {
  const exporter = new GifExporter({
    output,
    ...options,
  });

  return exporter.export(scene);
}

/**
 * Default export
 */
export default GifExporter;
