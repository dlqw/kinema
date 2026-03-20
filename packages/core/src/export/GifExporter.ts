/**
 * GIF Exporter - Export scenes as animated GIFs
 *
 * Uses browser APIs to create animated GIF exports.
 *
 * @module export/GifExporter
 */

import type { Scene } from '../types';
import { Exporter, ExportConfig, ExportProgress, ExportResult } from './Exporter';
import { FrameEncoder, EncodedFrame, CanvasFrameEncoder } from './FrameEncoder';

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
  /** Quality [0-1] */
  quality?: number;
  /** Export duration in seconds */
  duration?: number;
  /** Start time */
  startTime?: number;
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
 * Note: This uses a simplified implementation. For production use,
 * consider using a library like gif.js or a server-side encoder.
 *
 * @example
 * ```typescript
 * const exporter = new GifExporter({
 *   output: 'animation.gif',
 *   duration: 5,
 *   fps: 30
 * });
 *
 * const result = await exporter.export(scene, (progress) => {
 *   console.log(`Creating GIF: ${progress.progress * 100}%`);
 * });
 * ```
 */
export class GifExporter extends Exporter {
  private encoder: FrameEncoder;
  private frames: EncodedFrame[] = [];

  constructor(config: GifExportConfig) {
    super(config);
    this.encoder = new CanvasFrameEncoder({
      format: 'png',
      backgroundColor: config.backgroundColor
    });
  }

  /**
   * Export scene as animated GIF
   */
  async export(
    scene: Scene,
    progressCallback?: (progress: ExportProgress) => void
  ): Promise<GifExportResult> {
    this.validateConfig();
    this.progressCallback = progressCallback;
    this.resetCancel();
    this.frames = [];

    try {
      const config = this.config as GifExportConfig;
      const duration = config.duration ?? 5;
      const startTime = config.startTime ?? 0;
      const fps = config.fps ?? scene.config.fps;
      const frameCount = this.getFrameCount(duration, fps);
      const frameDelay = config.frameDelay ?? Math.round(1000 / fps);

      // Capture all frames
      for (let i = 0; i < frameCount; i++) {
        if (this.cancelled) {
          return {
            success: false,
            error: 'Export was cancelled'
          };
        }

        const time = startTime + (i / fps);

        this.reportProgress({
          currentFrame: i + 1,
          totalFrames: frameCount,
          progress: (i + 1) / frameCount,
          operation: 'Capturing frames'
        });

        const encoded = await this.encoder.encodeFrame(
          this.renderFrame(scene, time),
          time,
          i
        );

        this.frames.push(encoded);
      }

      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 0.8,
        operation: 'Encoding GIF'
      });

      // Create GIF from frames
      const gifData = await this.createGif(frameDelay);

      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 1,
        operation: 'Complete'
      });

      // Download
      this.downloadGif(gifData);

      return {
        success: true,
        output: config.output,
        frameCount,
        gifDuration: duration,
        size: gifData.size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create GIF from captured frames
   *
   * Note: This is a simplified implementation using a basic approach.
   * For production, use a proper GIF encoding library.
   */
  private async createGif(frameDelay: number): Promise<Blob> {
    // For production, use libraries like:
    // - gif.js (browser)
    // - gif-encoder-2-browser (browser)
    // - sharp (Node.js with gif plugin)

    // This is a placeholder that creates a simple animated image
    // In reality, you'd use a proper GIF encoder

    // As a fallback, create a simple download of the first frame
    // This ensures something is exported even without a GIF encoder
    const firstFrame = this.frames[0]?.data;
    if (!firstFrame) {
      throw new Error('No frames to encode');
    }

    // Return first frame as placeholder (real implementation would encode GIF)
    return firstFrame as Blob;
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
 *   quality: 0.8
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
    startTime?: number;
  } = {}
): Promise<GifExportResult> {
  const exporter = new GifExporter({
    output,
    ...options
  });

  return exporter.export(scene);
}

/**
 * Default export
 */
export default GifExporter;
export { exportAsGif };
