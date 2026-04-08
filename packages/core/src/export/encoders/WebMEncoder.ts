/**
 * WebM Encoder - WebM video encoding using MediaRecorder API
 *
 * Provides WebM video export using the browser's built-in MediaRecorder API.
 * Supports VP8, VP9, and AV1 codecs with automatic fallback.
 *
 * @module export/encoders/WebMEncoder
 */

import type {
  Encoder,
  EncoderCapability,
  EncoderProgressCallback,
  WebMEncoderOptions,
  OutputFormat,
} from '../types';
import { DEFAULT_WEBM_OPTIONS } from '../types';

/**
 * Supported WebM codecs
 */
type WebMCodec = 'vp8' | 'vp9' | 'av1';

/**
 * MIME type mapping for codecs
 */
const CODEC_MIME_TYPES: Record<WebMCodec, string> = {
  vp8: 'video/webm;codecs=vp8',
  vp9: 'video/webm;codecs=vp9',
  av1: 'video/webm;codecs=av1',
};

/**
 * Check if MediaRecorder API is available
 */
function isMediaRecorderAvailable(): boolean {
  return typeof MediaRecorder !== 'undefined';
}

/**
 * Check if a specific MIME type is supported
 */
function isMimeTypeSupported(mimeType: string): boolean {
  if (!isMediaRecorderAvailable()) {
    return false;
  }
  return MediaRecorder.isTypeSupported(mimeType);
}

/**
 * Find the best available codec
 */
function findBestCodec(): WebMCodec | null {
  // Try codecs in order of preference
  const codecs: WebMCodec[] = ['av1', 'vp9', 'vp8'];

  for (const codec of codecs) {
    const mimeType = CODEC_MIME_TYPES[codec];
    if (isMimeTypeSupported(mimeType)) {
      return codec;
    }
  }

  return null;
}

/**
 * WebM Encoder implementation using MediaRecorder API
 *
 * @example
 * ```typescript
 * const encoder = new WebMEncoder({
 *   width: 1920,
 *   height: 1080,
 *   bitrate: 5000000
 * });
 *
 * if (await encoder.isAvailable()) {
 *   const blob = await encoder.encode(frames, options, onProgress);
 * }
 * ```
 */
export class WebMEncoder implements Encoder<WebMEncoderOptions> {
  readonly name = 'webm-mediarecorder';

  private mediaRecorder: MediaRecorder | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private chunks: Blob[] = [];
  private aborted: boolean = false;
  private options: WebMEncoderOptions;
  private selectedCodec: WebMCodec | null = null;

  constructor(options: WebMEncoderOptions = {}) {
    this.options = {
      ...DEFAULT_WEBM_OPTIONS,
      ...options,
    };
    this.selectedCodec = findBestCodec();
  }

  /**
   * Get encoder capabilities
   */
  getCapabilities(): EncoderCapability {
    const codec = this.selectedCodec;
    const mimeType = codec ? CODEC_MIME_TYPES[codec] : 'video/webm';

    return {
      format: 'webm' as OutputFormat,
      mimeType,
      extension: 'webm',
      supportsTransparency: false,
      supportsAudio: true,
      isAvailable: () => this.isAvailable(),
    };
  }

  /**
   * Check if this encoder is available
   */
  async isAvailable(): Promise<boolean> {
    return isMediaRecorderAvailable() && findBestCodec() !== null;
  }

  /**
   * Get availability info with details
   */
  async getAvailabilityInfo(): Promise<{ available: boolean; reason?: string; codec?: WebMCodec }> {
    if (!isMediaRecorderAvailable()) {
      return {
        available: false,
        reason: 'MediaRecorder API is not available in this environment',
      };
    }

    const codec = findBestCodec();
    if (!codec) {
      return {
        available: false,
        reason: 'No supported WebM codec found (VP8, VP9, or AV1 required)',
      };
    }

    return {
      available: true,
      codec,
    };
  }

  /**
   * Encode frames to WebM video
   *
   * @param frames - Array of ImageData frames to encode
   * @param options - Encoding options
   * @param onProgress - Progress callback
   * @returns Blob containing the WebM video
   */
  async encode(
    frames: ImageData[],
    options: WebMEncoderOptions,
    onProgress?: EncoderProgressCallback,
  ): Promise<Blob> {
    const mergedOptions = { ...this.options, ...options };
    this.aborted = false;
    this.chunks = [];

    // Validate
    if (!frames || frames.length === 0) {
      throw new Error('No frames provided for encoding');
    }

    // Check availability
    const availability = await this.getAvailabilityInfo();
    if (!availability.available) {
      throw new Error(availability.reason || 'WebM encoder not available');
    }

    const codec = availability.codec!;
    const mimeType = CODEC_MIME_TYPES[codec];

    // Setup canvas
    const width = mergedOptions.width ?? frames[0]!.width;
    const height = mergedOptions.height ?? frames[0]!.height;

    this.setupCanvas(width, height);

    // Create MediaRecorder
    const stream = this.canvas!.captureStream(30); // Default to 30fps
    const recorderOptions: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: mergedOptions.bitrate ?? DEFAULT_WEBM_OPTIONS.bitrate,
    };

    // Use selected MIME type
    if (!isMimeTypeSupported(mimeType)) {
      // Fallback to default WebM
      recorderOptions.mimeType = 'video/webm';
    }

    this.mediaRecorder = new MediaRecorder(stream, recorderOptions);

    // Handle data
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
        resolve(blob);
      };

      // Start recording
      this.mediaRecorder!.start();

      // Process frames
      this.processFrames(frames, mergedOptions, onProgress)
        .then(() => {
          if (!this.aborted && this.mediaRecorder) {
            this.mediaRecorder.stop();
          }
        })
        .catch(reject);
    });
  }

  /**
   * Process frames and draw to canvas
   */
  private async processFrames(
    frames: ImageData[],
    options: WebMEncoderOptions,
    onProgress?: EncoderProgressCallback,
  ): Promise<void> {
    const frameDelay = options.keyframeInterval ? 1000 / 30 : 33; // ~30fps default

    for (let i = 0; i < frames.length; i++) {
      if (this.aborted) {
        break;
      }

      const frame = frames[i];

      // Clear canvas
      this.ctx!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);

      // Fill background if specified
      if (options.backgroundColor) {
        this.ctx!.fillStyle = options.backgroundColor;
        this.ctx!.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
      }

      // Draw frame
      this.ctx!.putImageData(frame!, 0, 0);

      // Report progress
      if (onProgress) {
        onProgress(i / frames.length);
      }

      // Wait for frame timing
      await this.delay(frameDelay);
    }
  }

  /**
   * Setup canvas for recording
   */
  private setupCanvas(width: number, height: number): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }

    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Abort current encoding
   */
  abort(): void {
    this.aborted = true;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.abort();
    this.canvas = null;
    this.ctx = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

/**
 * Factory function to create WebM encoder
 */
export function createWebMEncoder(options: WebMEncoderOptions = {}): WebMEncoder {
  return new WebMEncoder(options);
}

/**
 * Encoder capability descriptor for registration
 */
export const webMEncoderCapabilities: EncoderCapability = {
  format: 'webm',
  mimeType: 'video/webm;codecs=vp9',
  extension: 'webm',
  supportsTransparency: false,
  supportsAudio: true,
  isAvailable: async () => {
    if (typeof MediaRecorder === 'undefined') {
      return false;
    }
    return (
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
      MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ||
      MediaRecorder.isTypeSupported('video/webm;codecs=av1')
    );
  },
};

/**
 * Default export
 */
export default WebMEncoder;
