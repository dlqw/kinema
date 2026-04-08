/**
 * Export Types - Type definitions for the export module
 *
 * @module export/types
 */

/**
 * Progress callback type for encoding operations
 */
export type EncoderProgressCallback = (progress: number) => void;

/**
 * Base encoder options
 */
export interface BaseEncoderOptions {
  /** Output width in pixels */
  width?: number;
  /** Output height in pixels */
  height?: number;
  /** Background color (CSS color string) */
  backgroundColor?: string;
}

/**
 * GIF encoder specific options
 */
export interface GifEncoderOptions extends BaseEncoderOptions {
  /** Number of times to loop (0 = infinite, default: 0) */
  loop?: number;
  /** Delay between frames in milliseconds (default: calculated from fps) */
  frameDelay?: number;
  /** Dithering method: 'fs' (Floyd-Steinberg), 'bayer', or 'none' */
  dither?: 'fs' | 'bayer' | 'none';
  /** Color palette size, 1-256 (default: 256) */
  colors?: number;
  /** Quality for color quantization, lower is better but slower (1-20, default: 10) */
  quality?: number;
  /** Number of workers for parallel processing */
  workers?: number;
  /** Whether to use transparency */
  transparent?: boolean;
  /** Transparent color (if transparency is enabled) */
  transparentColor?: string | null;
}

/**
 * WebM encoder specific options
 */
export interface WebMEncoderOptions extends BaseEncoderOptions {
  /** Video quality [0-1] */
  quality?: number;
  /** Bitrate in bits per second */
  bitrate?: number;
  /** Keyframe interval in frames */
  keyframeInterval?: number;
  /** MIME type for MediaRecorder */
  mimeType?: string;
}

/**
 * MP4 encoder specific options
 */
export interface MP4EncoderOptions extends BaseEncoderOptions {
  /** Video quality [0-1] */
  quality?: number;
  /** Bitrate in bits per second */
  bitrate?: number;
  /** Keyframe interval (GOP size) */
  gopSize?: number;
  /** Video codec */
  codec?: 'h264' | 'h265' | 'vp9';
  /** Audio codec (if audio is included) */
  audioCodec?: 'aac' | 'mp3' | 'opus';
}

/**
 * Image sequence encoder specific options
 */
export interface ImageSequenceEncoderOptions extends BaseEncoderOptions {
  /** Image format */
  format: 'png' | 'jpeg' | 'webp';
  /** Quality for lossy formats [0-1] */
  quality?: number;
  /** File name pattern (use {frame} for frame number) */
  pattern?: string;
}

/**
 * Union type of all encoder options
 */
export type EncoderOptions =
  | GifEncoderOptions
  | WebMEncoderOptions
  | MP4EncoderOptions
  | ImageSequenceEncoderOptions;

/**
 * Supported output formats
 */
export type OutputFormat = 'gif' | 'webm' | 'mp4' | 'png' | 'jpeg' | 'webp';

/**
 * Encoder capability descriptor
 */
export interface EncoderCapability {
  /** Format this encoder produces */
  format: OutputFormat;
  /** MIME type of the output */
  mimeType: string;
  /** File extension */
  extension: string;
  /** Whether this encoder supports transparency */
  supportsTransparency: boolean;
  /** Whether this encoder supports audio */
  supportsAudio: boolean;
  /** Whether this encoder is available in current environment */
  isAvailable: () => boolean | Promise<boolean>;
}

/**
 * Encoder interface that all encoders must implement
 */
export interface Encoder<TOptions extends EncoderOptions = EncoderOptions> {
  /** Encoder name/identifier */
  readonly name: string;

  /** Get encoder capabilities */
  getCapabilities(): EncoderCapability;

  /** Encode frames into output format */
  encode(
    frames: ImageData[],
    options: TOptions,
    onProgress?: EncoderProgressCallback,
  ): Promise<Blob>;

  /** Abort current encoding operation */
  abort?(): void;

  /** Clean up resources */
  dispose?(): void;
}

/**
 * Encoder factory function type
 */
export type EncoderFactory<TOptions extends EncoderOptions = EncoderOptions> = (
  options: TOptions,
) => Encoder<TOptions>;

/**
 * Result of encoder availability check
 */
export interface EncoderAvailabilityResult {
  /** Whether the encoder is available */
  available: boolean;
  /** Reason if not available */
  reason?: string;
  /** Fallback encoder name if available */
  fallback?: string;
}

/**
 * Default GIF encoder options
 */
export const DEFAULT_GIF_OPTIONS: Required<
  Omit<GifEncoderOptions, 'width' | 'height' | 'backgroundColor'>
> = {
  loop: 0,
  frameDelay: 100,
  dither: 'fs',
  colors: 256,
  quality: 10,
  workers: 2,
  transparent: false,
  transparentColor: null,
};

/**
 * Default WebM encoder options
 */
export const DEFAULT_WEBM_OPTIONS: Required<
  Omit<WebMEncoderOptions, 'width' | 'height' | 'backgroundColor'>
> = {
  quality: 0.8,
  bitrate: 2500000,
  keyframeInterval: 60,
  mimeType: 'video/webm;codecs=vp9',
};

/**
 * Default MP4 encoder options
 */
export const DEFAULT_MP4_OPTIONS: Required<
  Omit<MP4EncoderOptions, 'width' | 'height' | 'backgroundColor'>
> = {
  quality: 0.8,
  bitrate: 5000000,
  gopSize: 60,
  codec: 'h264',
  audioCodec: 'aac',
};
