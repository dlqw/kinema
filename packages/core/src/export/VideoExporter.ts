/**
 * Video Exporter - Export scenes as video files
 *
 * Supports WebM and MP4 export using browser APIs.
 *
 * @module export/VideoExporter
 */

import type { Scene } from '../types';
import { Exporter, ExportConfig, ExportProgress, ExportResult } from './Exporter';
import { FrameEncoder, CanvasFrameEncoder } from './FrameEncoder';

/**
 * Video export configuration
 */
export interface VideoExportConfig extends ExportConfig {
  /** Video codec */
  codec?: 'vp8' | 'vp9' | 'h264' | 'av1';
  /** Container format */
  container?: 'webm' | 'mp4';
  /** Video bitrate (bps) */
  bitrate?: number;
  /** Audio bitrate (bps) */
  audioBitrate?: number;
  /** Export duration in seconds */
  duration?: number;
  /** Start time */
  startTime?: number;
}

/**
 * Video export result
 */
export interface VideoExportResult extends ExportResult {
  /** Video duration in seconds */
  duration: number;
  /** Frame rate */
  fps: number;
  /** Resolution */
  resolution: { width: number; height: number };
  /** File size in bytes */
  size?: number;
}

/**
 * Video exporter using MediaRecorder API (browser)
 *
 * @example
 * ```typescript
 * const exporter = new VideoExporter({
 *   output: 'animation.webm',
 *   duration: 5,
 *   fps: 60,
 *   codec: 'vp9'
 * });
 *
 * const result = await exporter.export(scene, (progress) => {
 *   console.log(`Exporting: ${progress.progress * 100}%`);
 * });
 * ```
 */
export class VideoExporter extends Exporter {
  private encoder: FrameEncoder;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor(config: VideoExportConfig) {
    super(config);
    this.encoder = new CanvasFrameEncoder({
      format: 'png',
      backgroundColor: config.backgroundColor
    });
  }

  /**
   * Export scene as video
   */
  async export(
    scene: Scene,
    progressCallback?: (progress: ExportProgress) => void
  ): Promise<VideoExportResult> {
    this.validateConfig();
    this.progressCallback = progressCallback;
    this.resetCancel();
    this.chunks = [];

    // Check for browser support
    if (typeof MediaRecorder === 'undefined') {
      return {
        success: false,
        error: 'MediaRecorder not supported in this environment'
      };
    }

    try {
      const config = this.config as VideoExportConfig;
      const duration = config.duration ?? 5;
      const startTime = config.startTime ?? 0;
      const fps = config.fps ?? scene.config.fps;
      const frameCount = this.getFrameCount(duration, fps);
      const { width, height } = this.getDimensions(scene);

      // Set up canvas for recording
      const canvas = await this.setupCanvas(width, height);

      // Set up MediaRecorder
      const mimeType = this.getMimeType();
      this.mediaRecorder = new MediaRecorder(canvas, {
        mimeType,
        videoBitsPerSecond: config.bitrate
      });

      // Collect recorded chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();

      // Play through the scene
      const frameDelay = 1000 / fps;
      let currentFrame = 0;

      for (let i = 0; i < frameCount; i++) {
        if (this.cancelled) {
          this.mediaRecorder?.stop();
          return {
            success: false,
            error: 'Export was cancelled'
          };
        }

        const time = startTime + (i / fps);

        // Render frame to canvas
        await this.renderToCanvas(scene, time, canvas);

        // Report progress
        currentFrame++;
        this.reportProgress({
          currentFrame,
          totalFrames: frameCount,
          progress: currentFrame / frameCount,
          operation: 'Recording video'
        });

        // Wait for frame timing
        await this.delay(frameDelay);
      }

      // Stop recording
      this.mediaRecorder.stop();

      // Wait for recording to finish
      await new Promise<void>((resolve) => {
        if (this.mediaRecorder) {
          this.mediaRecorder.onstop = () => resolve();
        } else {
          resolve();
        }
      });

      // Create video blob
      const blob = new Blob(this.chunks, { type: mimeType });
      const size = blob.size;

      // Download video
      this.downloadVideo(blob);

      return {
        success: true,
        output: config.output,
        duration,
        fps,
        resolution: { width, height },
        size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get MIME type for codec/container
   */
  private getMimeType(): string {
    const config = this.config as VideoExportConfig;
    const container = config.container ?? 'webm';
    const codec = config.codec ?? 'vp9';

    const mimeTypes: Record<string, string> = {
      'webm-vp8': 'video/webm;codecs=vp8',
      'webm-vp9': 'video/webm;codecs=vp9',
      'webm-av1': 'video/webm;codecs=av1',
      'mp4-h264': 'video/mp4' // H264 is not always supported in browsers
    };

    const key = `${container}-${codec}`;
    return mimeTypes[key] ?? 'video/webm';
  }

  /**
   * Set up canvas for recording
   */
  private async setupCanvas(width: number, height: number): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Render scene to canvas
   */
  private async renderToCanvas(
    scene: Scene,
    time: number,
    canvas: HTMLCanvasElement
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    const objects = this.renderFrame(scene, time);

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.config.backgroundColor) {
      ctx.fillStyle = this.config.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw objects (placeholder - would use renderer)
    for (const obj of objects) {
      if (obj.visible) {
        // This is a placeholder - actual implementation would use the renderer
        this.renderObjectPlaceholder(ctx, obj, canvas.width, canvas.height);
      }
    }
  }

  /**
   * Placeholder object rendering
   */
  private renderObjectPlaceholder(
    ctx: CanvasRenderingContext2D,
    obj: any,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const { position, opacity } = obj.getState().transform;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(position.x + canvasWidth / 2, position.y + canvasHeight / 2);

    // Draw placeholder
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Download the video
   */
  private downloadVideo(blob: Blob): void {
    if (typeof window === 'undefined') return;

    const url = URL.createObjectURL(blob);
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
    return (this.config as VideoExportConfig).container ?? 'webm';
  }
}

/**
 * MP4 Exporter (using FFmpeg.wasm)
 *
 * Provides MP4 export support through FFmpeg.wasm.
 * This requires the FFmpeg.wasm library to be loaded.
 *
 * @example
 * ```typescript
 * const exporter = new MP4Exporter({
 *   output: 'animation.mp4',
 *   duration: 5,
 *   fps: 60
 * });
 *
 * const result = await exporter.export(scene);
 * ```
 */
export class MP4Exporter extends Exporter {
  private encoder: FrameEncoder;

  constructor(config: VideoExportConfig) {
    super({ ...config, container: 'mp4' });
    this.encoder = new CanvasFrameEncoder({
      format: 'png',
      backgroundColor: config.backgroundColor
    });
  }

  /**
   * Export scene as MP4 using FFmpeg.wasm
   */
  async export(
    scene: Scene,
    progressCallback?: (progress: ExportProgress) => void
  ): Promise<VideoExportResult> {
    this.validateConfig();
    this.progressCallback = progressCallback;
    this.resetCancel();

    try {
      // Check for FFmpeg.wasm availability
      if (typeof (globalThis as any).ffmpeg === 'undefined') {
        return {
          success: false,
          error: 'FFmpeg.wasm not loaded. Please load FFmpeg.wasm to use MP4 export.'
        };
      }

      const config = this.config as VideoExportConfig;
      const duration = config.duration ?? 5;
      const startTime = config.startTime ?? 0;
      const fps = config.fps ?? scene.config.fps;
      const frameCount = this.getFrameCount(duration, fps);
      const { width, height } = this.getDimensions(scene);

      this.reportProgress({
        currentFrame: 0,
        totalFrames: frameCount,
        progress: 0,
        operation: 'Initializing FFmpeg'
      });

      const ffmpeg = (globalThis as any).ffmpeg;

      // Initialize FFmpeg
      await ffmpeg.load();

      this.reportProgress({
        currentFrame: 0,
        totalFrames: frameCount,
        progress: 0.1,
        operation: 'Capturing frames'
      });

      // Capture frames as PNG
      const frames: Uint8Array[] = [];
      for (let i = 0; i < frameCount; i++) {
        if (this.cancelled) {
          return {
            success: false,
            error: 'Export was cancelled'
          };
        }

        const time = startTime + (i / fps);

        const encoded = await this.encoder.encodeFrame(
          this.renderFrame(scene, time),
          time,
          i
        );

        // Convert blob to Uint8Array
        const arrayBuffer = await encoded.data.arrayBuffer();
        frames.push(new Uint8Array(arrayBuffer));

        this.reportProgress({
          currentFrame: i + 1,
          totalFrames: frameCount,
          progress: (i + 1) / frameCount * 0.7,
          operation: 'Capturing frames'
        });
      }

      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 0.8,
        operation: 'Encoding video'
      });

      // Write frames to FFmpeg
      for (let i = 0; i < frames.length; i++) {
        const frameData = frames[i];
        await ffmpeg.writeFile(`input_${i.toString().padStart(4, '0')}.png`, frameData);
      }

      // Build FFmpeg command
      const inputPattern = 'input_%04d.png';
      const bitrate = config.bitrate ?? 5_000_000; // 5 Mbps default

      await ffmpeg.exec([
        '-framerate', String(fps),
        '-i', inputPattern,
        '-c:v', 'libx264',
        '-b:v', String(bitrate),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4'
      ]);

      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');

      // Clean up input files
      for (let i = 0; i < frames.length; i++) {
        await ffmpeg.deleteFile(`input_${i.toString().padStart(4, '0')}.png`);
      }

      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 1,
        operation: 'Complete'
      });

      // Create blob and download
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      this.downloadVideo(blob);

      return {
        success: true,
        output: config.output,
        duration,
        fps,
        resolution: { width, height },
        size: blob.size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Download the video
   */
  private downloadVideo(blob: Blob): void {
    if (typeof window === 'undefined') return;

    const url = URL.createObjectURL(blob);
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
    return 'mp4';
  }
}

/**
 * Quick export helpers
 */

/**
 * Export scene as WebM video
 *
 * @param scene - The scene to export
 * @param output - Output file name
 * @param options - Export options
 * @returns Promise resolving to export result
 */
export async function exportAsWebM(
  scene: Scene,
  output: string,
  options: {
    duration?: number;
    fps?: number;
    codec?: 'vp8' | 'vp9';
    bitrate?: number;
  } = {}
): Promise<VideoExportResult> {
  const exporter = new VideoExporter({
    output,
    container: 'webm',
    ...options
  });

  return exporter.export(scene);
}

/**
 * Export scene as MP4 video (requires FFmpeg.wasm)
 *
 * @param scene - The scene to export
 * @param output - Output file name
 * @param options - Export options
 * @returns Promise resolving to export result
 */
export async function exportAsMP4(
  scene: Scene,
  output: string,
  options: {
    duration?: number;
    fps?: number;
    bitrate?: number;
  } = {}
): Promise<VideoExportResult> {
  const exporter = new MP4Exporter({
    output,
    container: 'mp4',
    ...options
  });

  return exporter.export(scene);
}

/**
 * Default export
 */
export default VideoExporter;
export { MP4Exporter, exportAsWebM, exportAsMP4 };
