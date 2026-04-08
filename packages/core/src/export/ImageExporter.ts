/**
 * Image Exporter - Export scenes as image sequences
 *
 * Exports animations as sequences of individual images (PNG, JPEG, WebP).
 *
 * @module export/ImageExporter
 */

import type { Scene } from '../types';
import { Exporter, ExportProgress, ExportResult } from './Exporter';
import type { ExportConfig } from './Exporter';
import {
  FrameEncoder,
  EncodedFrame,
  CanvasFrameEncoder,
  type FrameEncoderOptions,
} from './FrameEncoder';

/**
 * Image sequence export configuration
 */
export interface ImageExportConfig extends ExportConfig {
  /** Image format */
  format?: 'png' | 'jpeg' | 'webp';
  /** Number padding (e.g., 4 = 0001.png) */
  padding?: number;
  /** File name pattern (e.g., 'frame_%s.png') */
  pattern?: string;
  /** Export duration in seconds */
  duration?: number;
  /** Start time */
  startTime?: number;
}

/**
 * Image sequence export result
 */
export interface ImageExportResult extends ExportResult {
  /** Number of frames exported */
  frameCount: number;
  /** Path to the directory containing images */
  directory?: string;
  /** List of exported frame file names */
  frames?: string[];
}

/**
 * Image exporter for creating image sequences
 *
 * @example
 * ```typescript
 * const exporter = new ImageExporter({
 *   output: './frames/frame_%04d.png',
 *   format: 'png',
 *   duration: 5,
 *   fps: 60
 * });
 *
 * const result = await exporter.export(scene, (progress) => {
 *   console.log(`Exporting: ${progress.progress * 100}%`);
 * });
 * ```
 */
export class ImageExporter extends Exporter {
  private encoder: FrameEncoder;

  constructor(config: ImageExportConfig) {
    super(config);
    const encoderOptions: FrameEncoderOptions = {};
    if (config.format !== undefined) {
      encoderOptions.format = config.format;
    }
    if (config.backgroundColor !== undefined) {
      encoderOptions.backgroundColor = config.backgroundColor;
    }
    this.encoder = new CanvasFrameEncoder(encoderOptions);
  }

  /**
   * Export scene as image sequence
   */
  async export(
    scene: Scene,
    progressCallback?: (progress: ExportProgress) => void,
  ): Promise<ImageExportResult> {
    this.validateConfig();
    if (progressCallback !== undefined) {
      this.progressCallback = progressCallback;
    }
    this.resetCancel();

    try {
      const config = this.config as ImageExportConfig;
      const duration = config.duration ?? 5;
      const startTime = config.startTime ?? 0;
      const fps = config.fps ?? scene.config.fps;
      const frameCount = this.getFrameCount(duration, fps);
      const padding = config.padding ?? 4;
      const frames: string[] = [];

      let currentFrame = 0;

      for (let i = 0; i < frameCount; i++) {
        if (this.cancelled) {
          return {
            success: false,
            frameCount: 0,
            error: 'Export was cancelled',
          };
        }

        const time = startTime + i / fps;
        const frameNumber = i;

        // Render and encode frame
        const encoded = await this.encoder.encodeFrame(
          this.renderFrame(scene, time),
          time,
          frameNumber,
        );

        // Save frame (in browser, would trigger download; in Node.js, would write to disk)
        const fileName = this.getFileName(frameNumber, padding);
        frames.push(fileName);

        // Trigger download in browser
        this.downloadFrame(encoded, fileName);

        // Report progress
        currentFrame++;
        this.reportProgress({
          currentFrame,
          totalFrames: frameCount,
          progress: currentFrame / frameCount,
          operation: 'Encoding frames',
        });
      }

      return {
        success: true,
        output: config.output,
        frameCount,
        frames,
      };
    } catch (error) {
      return {
        success: false,
        frameCount: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get file name for a frame
   */
  private getFileName(frameNumber: number, padding: number): string {
    const config = this.config as ImageExportConfig;
    const pattern = config.pattern ?? `frame_%0${padding}d.${this.encoder.getFormat()}`;
    return pattern.replace('%s', String(frameNumber).padStart(padding, '0'));
  }

  /**
   * Download a single frame (browser implementation)
   */
  private downloadFrame(encoded: EncodedFrame, fileName: string): void {
    if (typeof window === 'undefined') return;

    const url = URL.createObjectURL(encoded.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return this.encoder.getFormat();
  }
}

/**
 * Single image exporter - exports one frame as an image
 *
 * @example
 * ```typescript
 * const exporter = new SingleImageExporter({
 *   output: 'snapshot.png',
 *   time: 2.5
 * });
 *
 * const result = await exporter.export(scene);
 * ```
 */
export class SingleImageExporter extends Exporter {
  private encoder: FrameEncoder;

  constructor(config: ExportConfig & { time?: number; format?: 'png' | 'jpeg' | 'webp' }) {
    super(config);
    const encoderOptions: FrameEncoderOptions = {};
    if (config.format !== undefined) {
      encoderOptions.format = config.format;
    }
    if (config.backgroundColor !== undefined) {
      encoderOptions.backgroundColor = config.backgroundColor;
    }
    this.encoder = new CanvasFrameEncoder(encoderOptions);
  }

  /**
   * Export a single frame
   */
  async export(
    scene: Scene,
    progressCallback?: (progress: ExportProgress) => void,
  ): Promise<ExportResult> {
    this.validateConfig();
    if (progressCallback !== undefined) {
      this.progressCallback = progressCallback;
    }
    this.resetCancel();

    try {
      const time = (this.config as any).time ?? 0;

      this.reportProgress({
        currentFrame: 1,
        totalFrames: 1,
        progress: 0.5,
        operation: 'Rendering frame',
      });

      const encoded = await this.encoder.encodeFrame(this.renderFrame(scene, time), time, 0);

      // Download the image
      const fileName = this.config.output;
      this.downloadFrame(encoded, fileName);

      this.reportProgress({
        currentFrame: 1,
        totalFrames: 1,
        progress: 1,
        operation: 'Complete',
      });

      return {
        success: true,
        output: fileName,
        size: encoded.data instanceof ArrayBuffer ? encoded.data.byteLength : encoded.data.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Download the frame
   */
  private downloadFrame(encoded: EncodedFrame, fileName: string): void {
    if (typeof window === 'undefined') return;

    const url = URL.createObjectURL(encoded.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return this.encoder.getFormat();
  }
}

/**
 * Quick export helper - exports a scene as a single image
 *
 * @param scene - The scene to export
 * @param output - Output file name
 * @param options - Export options
 * @returns Promise resolving to export result
 *
 * @example
 * ```typescript
 * await exportAsImage(scene, 'snapshot.png', { time: 2.5 });
 * ```
 */
export async function exportAsImage(
  scene: Scene,
  output: string,
  options: {
    time?: number;
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
  } = {},
): Promise<ExportResult> {
  const exporter = new SingleImageExporter({
    output,
    ...options,
  });

  return exporter.export(scene);
}

/**
 * Quick export helper - exports a scene as an image sequence
 *
 * @param scene - The scene to export
 * @param output - Output pattern (e.g., 'frame_%04d.png')
 * @param options - Export options
 * @returns Promise resolving to export result
 *
 * @example
 * ```typescript
 * await exportAsImageSequence(scene, 'frames/frame_%04d.png', {
 *   duration: 5,
 *   fps: 60
 * });
 * ```
 */
export async function exportAsImageSequence(
  scene: Scene,
  output: string,
  options: {
    duration?: number;
    fps?: number;
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
    startTime?: number;
  } = {},
): Promise<ImageExportResult> {
  const exporter = new ImageExporter({
    output,
    ...options,
  });

  return exporter.export(scene);
}

/**
 * Default export
 */
export default ImageExporter;
