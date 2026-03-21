/**
 * MP4 Encoder - MP4 video encoding using FFmpeg.wasm
 *
 * Provides MP4 video export through FFmpeg.wasm library.
 * Supports H.264, H.265, and VP9 codecs in MP4 container.
 *
 * @module export/encoders/Mp4Encoder
 */

import type {
  Encoder,
  EncoderCapability,
  EncoderProgressCallback,
  MP4EncoderOptions,
  OutputFormat,
} from '../types';
import { DEFAULT_MP4_OPTIONS } from '../types';

/**
 * FFmpeg.wasm interface
 */
interface FFmpegInterface {
  loaded: boolean;
  load(options?: FFmpegLoadOptions): Promise<void>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  readFile(path: string): Promise<Uint8Array>;
  deleteFile(path: string): Promise<void>;
  exec(args: string[]): Promise<void>;
  on(event: string, callback: (data: { progress: number }) => void): void;
  off(event: string, callback: (data: { progress: number }) => void): void;
}

/**
 * FFmpeg.wasm load options
 */
interface FFmpegLoadOptions {
  coreURL?: string;
  wasmURL?: string;
  workerURL?: string;
  log?: boolean;
}

/**
 * FFmpeg instance holder
 */
let ffmpegInstance: FFmpegInterface | null = null;
let ffmpegLoadPromise: Promise<void> | null = null;

/**
 * Check if FFmpeg.wasm is available
 */
function isFFmpegAvailable(): boolean {
  return ffmpegInstance !== null || typeof (globalThis as any).FFmpeg !== 'undefined';
}

/**
 * Get or create FFmpeg instance
 */
async function getFFmpeg(): Promise<FFmpegInterface | null> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  // Check global FFmpeg
  const globalFFmpeg = (globalThis as any).ffmpeg;
  if (globalFFmpeg) {
    ffmpegInstance = globalFFmpeg;
    return ffmpegInstance;
  }

  // Check for FFmpegWASM library
  const FFmpegWASM = (globalThis as any).FFmpegWASM;
  if (FFmpegWASM) {
    try {
      ffmpegInstance = new FFmpegWASM.FFmpeg();
      return ffmpegInstance;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Load FFmpeg.wasm
 */
async function loadFFmpeg(
  config?: FFmpegLoadOptions,
  onProgress?: (progress: number) => void
): Promise<FFmpegInterface | null> {
  // Return existing promise if loading
  if (ffmpegLoadPromise) {
    await ffmpegLoadPromise;
    return ffmpegInstance;
  }

  const ffmpeg = await getFFmpeg();
  if (!ffmpeg) {
    return null;
  }

  if (ffmpeg.loaded) {
    return ffmpeg;
  }

  // Start loading
  ffmpegLoadPromise = ffmpeg.load({
    coreURL: config?.coreURL,
    wasmURL: config?.wasmURL,
    workerURL: config?.workerURL,
    log: config?.log ?? false,
  });

  // Setup progress handler
  if (onProgress) {
    const progressHandler = (data: { progress: number }) => {
      onProgress(data.progress);
    };
    ffmpeg.on('progress', progressHandler);
  }

  try {
    await ffmpegLoadPromise;
    return ffmpeg;
  } catch (error) {
    ffmpegLoadPromise = null;
    throw error;
  }
}

/**
 * MP4 Encoder implementation using FFmpeg.wasm
 *
 * @example
 * ```typescript
 * const encoder = new Mp4Encoder({
 *   width: 1920,
 *   height: 1080,
 *   bitrate: 5000000,
 *   codec: 'h264'
 * });
 *
 * if (await encoder.isAvailable()) {
 *   const blob = await encoder.encode(frames, options, onProgress);
 * }
 * ```
 */
export class Mp4Encoder implements Encoder<MP4EncoderOptions> {
  readonly name = 'mp4-ffmpeg';

  private ffmpeg: FFmpegInterface | null = null;
  private loading: boolean = false;
  private aborted: boolean = false;
  private options: MP4EncoderOptions;
  private loadProgressCallback?: (progress: number) => void;

  constructor(options: MP4EncoderOptions = {}) {
    this.options = {
      ...DEFAULT_MP4_OPTIONS,
      ...options,
    };
  }

  /**
   * Set load progress callback (called during FFmpeg loading)
   */
  setLoadProgressCallback(callback: (progress: number) => void): void {
    this.loadProgressCallback = callback;
  }

  /**
   * Get encoder capabilities
   */
  getCapabilities(): EncoderCapability {
    return {
      format: 'mp4' as OutputFormat,
      mimeType: 'video/mp4',
      extension: 'mp4',
      supportsTransparency: false,
      supportsAudio: true,
      isAvailable: () => this.isAvailable(),
    };
  }

  /**
   * Check if this encoder is available
   */
  async isAvailable(): Promise<boolean> {
    return isFFmpegAvailable();
  }

  /**
   * Get detailed availability status
   */
  async getAvailabilityStatus(): Promise<{
    available: boolean;
    reason?: string;
    loadingRequired: boolean;
  }> {
    const ffmpeg = await getFFmpeg();

    if (!ffmpeg) {
      return {
        available: false,
        reason: 'FFmpeg.wasm not loaded. Please load FFmpeg.wasm library first.',
        loadingRequired: true,
      };
    }

    if (!ffmpeg.loaded) {
      return {
        available: true,
        reason: 'FFmpeg.wasm available but needs to be loaded',
        loadingRequired: true,
      };
    }

    return {
      available: true,
      loadingRequired: false,
    };
  }

  /**
   * Initialize the encoder (load FFmpeg if needed)
   */
  async initialize(config?: {
    coreURL?: string;
    wasmURL?: string;
    workerURL?: string;
  }): Promise<void> {
    const status = await this.getAvailabilityStatus();

    if (!status.available) {
      throw new Error(status.reason || 'FFmpeg.wasm not available');
    }

    if (status.loadingRequired) {
      this.loading = true;
      try {
        this.ffmpeg = await loadFFmpeg({
          coreURL: config?.coreURL,
          wasmURL: config?.wasmURL,
          workerURL: config?.workerURL,
        }, this.loadProgressCallback);

        if (!this.ffmpeg) {
          throw new Error('Failed to initialize FFmpeg.wasm');
        }
      } finally {
        this.loading = false;
      }
    } else {
      this.ffmpeg = await getFFmpeg();
    }
  }

  /**
   * Check if encoder is loading
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Check if encoder is ready
   */
  isReady(): boolean {
    return this.ffmpeg !== null && this.ffmpeg.loaded;
  }

  /**
   * Encode frames to MP4 video
   *
   * @param frames - Array of ImageData frames to encode
   * @param options - Encoding options
   * @param onProgress - Progress callback
   * @returns Blob containing the MP4 video
   */
  async encode(
    frames: ImageData[],
    options: MP4EncoderOptions,
    onProgress?: EncoderProgressCallback
  ): Promise<Blob> {
    const mergedOptions = { ...this.options, ...options };
    this.aborted = false;

    // Validate
    if (!frames || frames.length === 0) {
      throw new Error('No frames provided for encoding');
    }

    // Ensure FFmpeg is loaded
    if (!this.ffmpeg || !this.ffmpeg.loaded) {
      await this.initialize();
    }

    if (!this.ffmpeg) {
      throw new Error('FFmpeg.wasm not initialized');
    }

    // Report progress - starting
    onProgress?.(0);

    // Convert frames to PNG data
    const frameFiles: string[] = [];
    const totalFrames = frames.length;

    for (let i = 0; i < totalFrames; i++) {
      if (this.aborted) {
        throw new Error('Encoding was aborted');
      }

      const frame = frames[i];
      const pngData = await this.imageDataToPNG(frame);
      const fileName = `input_${i.toString().padStart(6, '0')}.png`;

      await this.ffmpeg.writeFile(fileName, pngData);
      frameFiles.push(fileName);

      // Report progress (0-70% for frame writing)
      onProgress?.((i + 1) / totalFrames * 0.7);
    }

    // Report progress - encoding
    onProgress?.(0.7);

    // Build FFmpeg command
    const inputPattern = 'input_%06d.png';
    const bitrate = mergedOptions.bitrate ?? DEFAULT_MP4_OPTIONS.bitrate;
    const codec = mergedOptions.codec ?? DEFAULT_MP4_OPTIONS.codec;
    const gopSize = mergedOptions.gopSize ?? DEFAULT_MP4_OPTIONS.gopSize;

    // Map codec to FFmpeg codec name
    const codecMap: Record<string, string> = {
      h264: 'libx264',
      h265: 'libx265',
      vp9: 'libvpx-vp9',
    };

    const ffmpegCodec = codecMap[codec] ?? 'libx264';

    // Setup progress monitoring
    let encodingProgress = 0;
    const progressHandler = (data: { progress: number }) => {
      encodingProgress = data.progress;
      // Report progress (70-95% for encoding)
      onProgress?.(0.7 + encodingProgress * 0.25);
    };

    this.ffmpeg.on('progress', progressHandler);

    try {
      // Execute FFmpeg command
      await this.ffmpeg.exec([
        '-framerate', '30', // Default to 30fps
        '-i', inputPattern,
        '-c:v', ffmpegCodec,
        '-b:v', String(bitrate),
        '-g', String(gopSize),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4'
      ]);

      // Report progress - reading output
      onProgress?.(0.95);

      // Read output file
      const data = await this.ffmpeg.readFile('output.mp4');

      // Clean up input files
      for (const fileName of frameFiles) {
        try {
          await this.ffmpeg.deleteFile(fileName);
        } catch {
          // Ignore cleanup errors
        }
      }

      // Clean up output file
      try {
        await this.ffmpeg.deleteFile('output.mp4');
      } catch {
        // Ignore cleanup errors
      }

      // Report progress - done
      onProgress?.(1);

      // Create blob
      return new Blob([data.buffer], { type: 'video/mp4' });

    } finally {
      this.ffmpeg.off('progress', progressHandler);
    }
  }

  /**
   * Convert ImageData to PNG Uint8Array
   */
  private async imageDataToPNG(imageData: ImageData): Promise<Uint8Array> {
    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert frame to PNG'));
          return;
        }

        const arrayBuffer = await blob.arrayBuffer();
        resolve(new Uint8Array(arrayBuffer));
      }, 'image/png');
    });
  }

  /**
   * Abort current encoding
   */
  abort(): void {
    this.aborted = true;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.abort();
    this.ffmpeg = null;
  }
}

/**
 * Factory function to create MP4 encoder
 */
export function createMp4Encoder(options: MP4EncoderOptions = {}): Mp4Encoder {
  return new Mp4Encoder(options);
}

/**
 * Encoder capability descriptor for registration
 */
export const mp4EncoderCapabilities: EncoderCapability = {
  format: 'mp4',
  mimeType: 'video/mp4',
  extension: 'mp4',
  supportsTransparency: false,
  supportsAudio: true,
  isAvailable: async () => {
    // Check if FFmpeg.wasm is available globally
    if (typeof (globalThis as any).ffmpeg !== 'undefined') {
      return true;
    }
    if (typeof (globalThis as any).FFmpegWASM !== 'undefined') {
      return true;
    }
    return false;
  },
};

/**
 * Default export
 */
export default Mp4Encoder;
