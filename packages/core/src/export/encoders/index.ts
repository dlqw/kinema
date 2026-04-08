/**
 * Encoders Module - Export encoders for various formats
 *
 * This module provides encoder implementations for different
 * export formats including video (WebM, MP4), GIF, and image sequences.
 *
 * @module export/encoders
 */

// WebM Encoder (MediaRecorder API)
export { WebMEncoder, createWebMEncoder, webMEncoderCapabilities } from './WebMEncoder';

// MP4 Encoder (FFmpeg.wasm)
export { Mp4Encoder, createMp4Encoder, mp4EncoderCapabilities } from './Mp4Encoder';

// GIF Encoder
export { GifEncoder, createGifEncoder, gifEncoderCapabilities } from './GifEncoder';

// Image Sequence Encoder
export {
  ImageSequenceEncoder,
  exportAsImageSequence,
  exportAsImageZip,
  type ImageSequenceFormat,
  type ImageSequenceOutputMode,
  type ImageSequenceConfig,
  type ImageSequenceResult,
} from './ImageSequenceEncoder';

// Encoder Registry
export {
  EncoderRegistry,
  getEncoderRegistry,
  getEncoder,
  type ExportFormat,
  type EncoderMetadata,
} from './EncoderRegistry';

// Re-export types
export type {
  Encoder,
  EncoderOptions,
  GifEncoderOptions,
  WebMEncoderOptions,
  MP4EncoderOptions,
  EncoderProgressCallback,
  EncoderCapability,
  OutputFormat,
} from '../types';

// Default export
export { WebMEncoder as default } from './WebMEncoder';
