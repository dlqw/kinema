/**
 * Exporter Base Class - Abstract foundation for all exporters
 *
 * Defines the interface and common functionality for exporting
 * animations and scenes to various formats.
 *
 * @module export/Exporter
 */

import type { Scene, RenderObject } from '../types';

/**
 * Export configuration options
 */
export interface ExportConfig {
  /** Output file path or name */
  output: string;
  /** Frame rate (fps) */
  fps?: number;
  /** Quality setting [0-1] for formats that support it */
  quality?: number;
  /** Bitrate for video formats (bps) */
  bitrate?: number;
  /** Whether to include audio */
  includeAudio?: boolean;
  /** Output dimensions (optional, uses scene dimensions if not specified) */
  width?: number;
  height?: number;
  /** Background color for output */
  backgroundColor?: string;
}

/**
 * Export progress information
 */
export interface ExportProgress {
  /** Current frame number */
  currentFrame: number;
  /** Total frames to export */
  totalFrames: number;
  /** Progress as percentage [0-1] */
  progress: number;
  /** Current operation being performed */
  operation: string;
  /** Estimated time remaining in seconds */
  eta?: number;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Whether export was successful */
  success: boolean;
  /** Output file path or URL */
  output?: string;
  /** Output size in bytes */
  size?: number;
  /** Duration of exported content in seconds */
  duration?: number;
  /** Error message if export failed */
  error?: string;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: ExportProgress) => void;

/**
 * Abstract base class for all exporters
 *
 * Exporters handle the conversion of scenes and animations
 * to various output formats like video, GIF, or image sequences.
 *
 * @example
 * ```typescript
 * class CustomExporter extends Exporter {
 *   async export(scene: Scene, config: ExportConfig): Promise<ExportResult> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class Exporter {
  protected config: ExportConfig;
  protected progressCallback?: ProgressCallback;
  protected cancelled: boolean = false;

  /**
   * Creates a new Exporter instance
   *
   * @param config - Export configuration
   */
  constructor(config: ExportConfig) {
    this.config = config;
  }

  /**
   * Export a scene to the configured format
   *
   * @param scene - The scene to export
   * @param progressCallback - Optional progress callback
   * @returns Promise resolving to export result
   */
  abstract export(
    scene: Scene,
    progressCallback?: ProgressCallback
  ): Promise<ExportResult>;

  /**
   * Cancel the current export operation
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Check if export was cancelled
   */
  isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Reset cancel state
   */
  resetCancel(): void {
    this.cancelled = false;
  }

  /**
   * Report progress
   *
   * @param progress - Progress information
   */
  protected reportProgress(progress: ExportProgress): void {
    if (this.progressCallback && !this.cancelled) {
      this.progressCallback(progress);
    }
  }

  /**
   * Calculate export dimensions
   *
   * @param scene - The scene being exported
   * @returns Width and height
   */
  protected getDimensions(scene: Scene): { width: number; height: number } {
    return {
      width: this.config.width ?? scene.config.width,
      height: this.config.height ?? scene.config.height
    };
  }

  /**
   * Get total frame count for a duration
   *
   * @param duration - Duration in seconds
   * @param fps - Frames per second
   * @returns Total frame count
   */
  protected getFrameCount(duration: number, fps: number): number {
    return Math.floor(duration * fps);
  }

  /**
   * Render a single frame
   *
   * @param scene - The scene
   * @param time - Time to render at
   * @returns Array of renderable objects at the given time
   */
  protected renderFrame(scene: Scene, time: number): ReadonlyArray<RenderObject> {
    return scene.updateTo(time).getVisibleObjects();
  }

  /**
   * Validate export configuration
   *
   * @throws Error if configuration is invalid
   */
  protected validateConfig(): void {
    if (!this.config.output) {
      throw new Error('Export output path is required');
    }
  }

  /**
   * Get file extension for output format
   */
  abstract getExtension(): string;
}

/**
 * Default export
 */
export default Exporter;
