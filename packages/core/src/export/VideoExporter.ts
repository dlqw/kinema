/**
 * Video Exporter - Export scenes as video files
 *
 * Supports WebM and MP4 export using browser APIs and FFmpeg.wasm.
 * Includes automatic encoder detection and fallback support.
 *
 * @module export/VideoExporter
 */

import type { Scene } from '../types';
import { Exporter, type ExportProgress, type ExportResult } from './Exporter';
import type { ExportConfig } from './Exporter';
import { FrameEncoder, CanvasFrameEncoder, type FrameEncoderOptions } from './FrameEncoder';
import { EncoderRegistry } from './EncoderRegistry';
import {
  WebMEncoder,
  createWebMEncoder,
  webMEncoderCapabilities,
} from './encoders/WebMEncoder';
import {
  Mp4Encoder,
  createMp4Encoder,
  mp4EncoderCapabilities,
} from './encoders/Mp4Encoder';
import type { WebMEncoderOptions, MP4EncoderOptions } from './types';

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
  /** Enable fallback to alternative format if primary not available */
  enableFallback?: boolean;
  /** FFmpeg.wasm configuration (for MP4 export) */
  ffmpegConfig?: {
    coreURL?: string;
    wasmURL?: string;
    workerURL?: string;
  };
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
  /** Actual format used (may differ from requested if fallback occurred) */
  actualFormat?: 'webm' | 'mp4';
}

/**
 * Encoder status information
 */
export interface EncoderStatus {
  /** Encoder name */
  name: string;
  /** Whether encoder is available */
  available: boolean;
  /** Reason if not available */
  reason?: string;
  /** Whether loading is required */
  loadingRequired?: boolean;
}

/**
 * Video exporter using MediaRecorder API (browser)
 *
 * Supports automatic encoder detection and fallback.
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
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private webmEncoder: WebMEncoder | null = null;
  private mp4Encoder: Mp4Encoder | null = null;
  private frameEncoder: FrameEncoder;

  constructor(config: VideoExportConfig) {
    super(config);
    const encoderOptions: FrameEncoderOptions = { format: 'png' };
    if (config.backgroundColor !== undefined) {
      encoderOptions.backgroundColor = config.backgroundColor;
    }
    this.frameEncoder = new CanvasFrameEncoder(encoderOptions);
  }

  /**
   * Check encoder availability
   */
  static async checkEncoderAvailability(format: 'webm' | 'mp4'): Promise<EncoderStatus> {
    if (format === 'webm') {
      const available = await webMEncoderCapabilities.isAvailable();
      return {
        name: 'WebMEncoder',
        available,
        reason: available ? undefined : 'MediaRecorder API not available or no supported codec',
      };
    } else {
      const available = await mp4EncoderCapabilities.isAvailable();
      return {
        name: 'Mp4Encoder',
        available,
        reason: available ? undefined : 'FFmpeg.wasm not loaded',
        loadingRequired: available,
      };
    }
  }

  /**
   * Check all encoder availabilities
   */
  static async checkAllEncoders(): Promise<Record<'webm' | 'mp4', EncoderStatus>> {
    const [webm, mp4] = await Promise.all([
      VideoExporter.checkEncoderAvailability('webm'),
      VideoExporter.checkEncoderAvailability('mp4'),
    ]);
    return { webm, mp4 };
  }

  /**
   * Export scene as video
   */
  async export(
    scene: Scene,
    progressCallback?: (progress: ExportProgress) => void
  ): Promise<VideoExportResult> {
    this.validateConfig();
    if (progressCallback !== undefined) {
      this.progressCallback = progressCallback;
    }
    this.resetCancel();
    this.chunks = [];

    const config = this.config as VideoExportConfig;
    const container = config.container ?? 'webm';
    const enableFallback = config.enableFallback ?? true;

    try {
      // Try to use the requested format
      if (container === 'mp4') {
        return await this.exportAsMP4(scene);
      } else {
        // Try WebM export
        const webmStatus = await VideoExporter.checkEncoderAvailability('webm');

        if (webmStatus.available) {
          return await this.exportAsWebM(scene);
        } else if (enableFallback) {
          // Fallback to MP4 if WebM not available
          this.reportProgress({
            currentFrame: 0,
            totalFrames: 1,
            progress: 0,
            operation: 'WebM not available, falling back to MP4...',
          });

          const mp4Status = await VideoExporter.checkEncoderAvailability('mp4');
          if (mp4Status.available) {
            return await this.exportAsMP4(scene);
          }
        }

        return {
          success: false,
          duration: 0,
          fps: 0,
          resolution: { width: 0, height: 0 },
          error: `No video encoder available. WebM: ${webmStatus.reason}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        duration: 0,
        fps: 0,
        resolution: { width: 0, height: 0 },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Export scene as WebM using MediaRecorder
   */
  private async exportAsWebM(scene: Scene): Promise<VideoExportResult> {
    // Check for browser support
    if (typeof MediaRecorder === 'undefined') {
      return {
        success: false,
        duration: 0,
        fps: 0,
        resolution: { width: 0, height: 0 },
        error: 'MediaRecorder not supported in this environment',
      };
    }

    const config = this.config as VideoExportConfig;
    const duration = config.duration ?? 5;
    const startTime = config.startTime ?? 0;
    const fps = config.fps ?? scene.config.fps;
    const frameCount = this.getFrameCount(duration, fps);
    const { width, height } = this.getDimensions(scene);

    try {
      // Set up canvas for recording
      const canvas = await this.setupCanvas(width, height);

      // Set up MediaRecorder
      const mimeType = this.getBestWebMMimeType();
      const stream = canvas.captureStream(fps);
      const recorderOptions: MediaRecorderOptions = { mimeType };
      if (config.bitrate !== undefined) {
        recorderOptions.videoBitsPerSecond = config.bitrate;
      }

      this.mediaRecorder = new MediaRecorder(stream, recorderOptions);
      this.chunks = [];

      // Collect recorded chunks
      return new Promise((resolve, reject) => {
        this.mediaRecorder!.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.chunks.push(event.data);
          }
        };

        this.mediaRecorder!.onerror = (event) => {
          reject(new Error(`MediaRecorder error: ${(event as ErrorEvent).message}`));
        };

        this.mediaRecorder!.onstop = () => {
          const blob = new Blob(this.chunks, { type: mimeType });
          this.downloadVideo(blob);

          resolve({
            success: true,
            output: config.output,
            duration,
            fps,
            resolution: { width, height },
            size: blob.size,
            actualFormat: 'webm',
          });
        };

        // Start recording
        this.mediaRecorder!.start();

        // Process frames
        this.processWebMFrames(scene, canvas, startTime, fps, frameCount)
          .then(() => {
            if (!this.cancelled && this.mediaRecorder) {
              this.mediaRecorder.stop();
            }
          })
          .catch(reject);
      });
    } catch (error) {
      return {
        success: false,
        duration: 0,
        fps,
        resolution: { width, height },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process frames for WebM recording
   */
  private async processWebMFrames(
    scene: Scene,
    canvas: HTMLCanvasElement,
    startTime: number,
    fps: number,
    frameCount: number
  ): Promise<void> {
    const frameDelay = 1000 / fps;

    for (let i = 0; i < frameCount; i++) {
      if (this.cancelled) {
        throw new Error('Export was cancelled');
      }

      const time = startTime + (i / fps);

      // Render frame to canvas
      await this.renderToCanvas(scene, time, canvas);

      // Report progress
      this.reportProgress({
        currentFrame: i + 1,
        totalFrames: frameCount,
        progress: (i + 1) / frameCount,
        operation: 'Recording video',
      });

      // Wait for frame timing
      await this.delay(frameDelay);
    }
  }

  /**
   * Export scene as MP4 using FFmpeg.wasm
   */
  private async exportAsMP4(scene: Scene): Promise<VideoExportResult> {
    const config = this.config as VideoExportConfig;

    // Create MP4 encoder
    const mp4Options: MP4EncoderOptions = {
      width: config.width,
      height: config.height,
      bitrate: config.bitrate,
      backgroundColor: config.backgroundColor,
    };

    this.mp4Encoder = createMp4Encoder(mp4Options);

    // Check availability
    const status = await this.mp4Encoder.getAvailabilityStatus();
    if (!status.available) {
      return {
        success: false,
        duration: 0,
        fps: 0,
        resolution: { width: 0, height: 0 },
        error: status.reason || 'MP4 encoder not available',
      };
    }

    const duration = config.duration ?? 5;
    const startTime = config.startTime ?? 0;
    const fps = config.fps ?? scene.config.fps;
    const frameCount = this.getFrameCount(duration, fps);
    const { width, height } = this.getDimensions(scene);

    try {
      // Report loading progress
      this.reportProgress({
        currentFrame: 0,
        totalFrames: frameCount,
        progress: 0,
        operation: status.loadingRequired ? 'Loading FFmpeg.wasm...' : 'Initializing encoder',
      });

      // Initialize encoder if needed
      if (status.loadingRequired) {
        await this.mp4Encoder.initialize(config.ffmpegConfig);
      }

      // Report frame capture progress
      this.reportProgress({
        currentFrame: 0,
        totalFrames: frameCount,
        progress: 0.05,
        operation: 'Capturing frames',
      });

      // Capture frames
      const frames: ImageData[] = [];
      const canvas = await this.setupCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      for (let i = 0; i < frameCount; i++) {
        if (this.cancelled) {
          return {
            success: false,
            duration: 0,
            fps,
            resolution: { width, height },
            error: 'Export was cancelled',
          };
        }

        const time = startTime + (i / fps);
        await this.renderToCanvas(scene, time, canvas);

        // Get ImageData
        const imageData = ctx.getImageData(0, 0, width, height);
        frames.push(imageData);

        // Report progress (0.05 to 0.5 for frame capture)
        this.reportProgress({
          currentFrame: i + 1,
          totalFrames: frameCount,
          progress: 0.05 + ((i + 1) / frameCount) * 0.45,
          operation: 'Capturing frames',
        });
      }

      // Encode video
      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 0.5,
        operation: 'Encoding video',
      });

      const blob = await this.mp4Encoder.encode(
        frames,
        {
          width,
          height,
          bitrate: config.bitrate,
          backgroundColor: config.backgroundColor,
        },
        (progress) => {
          this.reportProgress({
            currentFrame: frameCount,
            totalFrames: frameCount,
            progress: 0.5 + progress * 0.5,
            operation: 'Encoding video',
          });
        }
      );

      // Download video
      this.downloadVideo(blob);

      return {
        success: true,
        output: config.output,
        duration,
        fps,
        resolution: { width, height },
        size: blob.size,
        actualFormat: 'mp4',
      };
    } catch (error) {
      return {
        success: false,
        duration: 0,
        fps,
        resolution: { width, height },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get best available WebM MIME type
   */
  private getBestWebMMimeType(): string {
    const config = this.config as VideoExportConfig;
    const preferredCodec = config.codec;

    // Try codecs in order of preference
    const codecs: Array<{ codec: string; mimeType: string }> = [
      { codec: 'av1', mimeType: 'video/webm;codecs=av1' },
      { codec: 'vp9', mimeType: 'video/webm;codecs=vp9' },
      { codec: 'vp8', mimeType: 'video/webm;codecs=vp8' },
    ];

    // If user specified a codec, try it first
    if (preferredCodec) {
      const preferred = codecs.find((c) => c.codec === preferredCodec);
      if (preferred && MediaRecorder.isTypeSupported(preferred.mimeType)) {
        return preferred.mimeType;
      }
    }

    // Find first supported codec
    for (const { mimeType } of codecs) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    // Fallback to basic WebM
    return 'video/webm';
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

    // Draw objects
    for (const obj of objects) {
      if (obj.visible) {
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
    return new Promise((resolve) => setTimeout(resolve, ms));
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
   * Cancel current export
   */
  cancel(): void {
    super.cancel();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.mp4Encoder) {
      this.mp4Encoder.abort();
    }
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return (this.config as VideoExportConfig).container ?? 'webm';
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cancel();
    if (this.webmEncoder) {
      this.webmEncoder.dispose();
      this.webmEncoder = null;
    }
    if (this.mp4Encoder) {
      this.mp4Encoder.dispose();
      this.mp4Encoder = null;
    }
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
  private videoConfig: VideoExportConfig;
  private mp4Encoder: Mp4Encoder | null = null;

  constructor(config: VideoExportConfig) {
    super(config);
    this.videoConfig = { ...config, container: 'mp4' };
    const encoderOptions: FrameEncoderOptions = { format: 'png' };
    if (config.backgroundColor !== undefined) {
      encoderOptions.backgroundColor = config.backgroundColor;
    }
    this.encoder = new CanvasFrameEncoder(encoderOptions);
  }

  /**
   * Check if MP4 export is available
   */
  static async isAvailable(): Promise<boolean> {
    return mp4EncoderCapabilities.isAvailable();
  }

  /**
   * Export scene as MP4 using FFmpeg.wasm
   */
  async export(
    scene: Scene,
    progressCallback?: (progress: ExportProgress) => void
  ): Promise<VideoExportResult> {
    this.validateConfig();
    if (progressCallback !== undefined) {
      this.progressCallback = progressCallback;
    }
    this.resetCancel();

    const config = this.videoConfig;

    // Create MP4 encoder
    const mp4Options: MP4EncoderOptions = {
      width: config.width,
      height: config.height,
      bitrate: config.bitrate,
      backgroundColor: config.backgroundColor,
    };

    this.mp4Encoder = createMp4Encoder(mp4Options);

    // Check availability
    const status = await this.mp4Encoder.getAvailabilityStatus();
    if (!status.available) {
      return {
        success: false,
        duration: 0,
        fps: 0,
        resolution: { width: 0, height: 0 },
        error: status.reason || 'FFmpeg.wasm not loaded. Please load FFmpeg.wasm to use MP4 export.',
      };
    }

    const duration = config.duration ?? 5;
    const startTime = config.startTime ?? 0;
    const fps = config.fps ?? scene.config.fps;
    const frameCount = this.getFrameCount(duration, fps);
    const { width, height } = this.getDimensions(scene);

    try {
      this.reportProgress({
        currentFrame: 0,
        totalFrames: frameCount,
        progress: 0,
        operation: status.loadingRequired ? 'Loading FFmpeg.wasm' : 'Initializing encoder',
      });

      // Initialize encoder if needed
      if (status.loadingRequired) {
        await this.mp4Encoder.initialize(config.ffmpegConfig);
      }

      this.reportProgress({
        currentFrame: 0,
        totalFrames: frameCount,
        progress: 0.1,
        operation: 'Capturing frames',
      });

      // Capture frames as ImageData
      const frames: ImageData[] = [];
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      for (let i = 0; i < frameCount; i++) {
        if (this.cancelled) {
          return {
            success: false,
            duration: 0,
            fps,
            resolution: { width, height },
            error: 'Export was cancelled',
          };
        }

        const time = startTime + (i / fps);

        // Render frame
        const objects = this.renderFrame(scene, time);
        ctx.clearRect(0, 0, width, height);

        if (config.backgroundColor) {
          ctx.fillStyle = config.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw objects
        for (const obj of objects) {
          if (obj.visible) {
            this.renderObjectPlaceholder(ctx, obj, width, height);
          }
        }

        // Get ImageData
        const imageData = ctx.getImageData(0, 0, width, height);
        frames.push(imageData);

        this.reportProgress({
          currentFrame: i + 1,
          totalFrames: frameCount,
          progress: 0.1 + ((i + 1) / frameCount) * 0.6,
          operation: 'Capturing frames',
        });
      }

      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 0.7,
        operation: 'Encoding video',
      });

      // Encode
      const blob = await this.mp4Encoder.encode(
        frames,
        {
          width,
          height,
          bitrate: config.bitrate,
          backgroundColor: config.backgroundColor,
        },
        (progress) => {
          this.reportProgress({
            currentFrame: frameCount,
            totalFrames: frameCount,
            progress: 0.7 + progress * 0.3,
            operation: 'Encoding video',
          });
        }
      );

      this.reportProgress({
        currentFrame: frameCount,
        totalFrames: frameCount,
        progress: 1,
        operation: 'Complete',
      });

      // Download
      this.downloadVideo(blob);

      return {
        success: true,
        output: config.output,
        duration,
        fps,
        resolution: { width, height },
        size: blob.size,
        actualFormat: 'mp4',
      };
    } catch (error) {
      return {
        success: false,
        duration: 0,
        fps: 0,
        resolution: { width: 0, height: 0 },
        error: error instanceof Error ? error.message : String(error),
      };
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

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
   * Cancel export
   */
  cancel(): void {
    super.cancel();
    if (this.mp4Encoder) {
      this.mp4Encoder.abort();
    }
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return 'mp4';
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cancel();
    if (this.mp4Encoder) {
      this.mp4Encoder.dispose();
      this.mp4Encoder = null;
    }
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
    ...options,
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
    ffmpegConfig?: VideoExportConfig['ffmpegConfig'];
  } = {}
): Promise<VideoExportResult> {
  const exporter = new MP4Exporter({
    output,
    container: 'mp4',
    ...options,
  });

  return exporter.export(scene);
}

/**
 * Register video encoders with the registry
 */
export function registerVideoEncoders(registry: EncoderRegistry = EncoderRegistry.getInstance()): void {
  // Register WebM encoder
  registry.register(
    'webm-mediarecorder',
    () => createWebMEncoder(),
    webMEncoderCapabilities,
    100
  );

  // Register MP4 encoder
  registry.register(
    'mp4-ffmpeg',
    () => createMp4Encoder(),
    mp4EncoderCapabilities,
    90
  );
}

/**
 * Default export
 */
export default VideoExporter;
