/**
 * Export Module - Animation and scene export functionality
 *
 * Provides exporters for various formats including:
 * - Image sequences (PNG, JPEG, WebP)
 * - ZIP archives of images
 * - Animated GIFs
 * - Video (WebM, MP4)
 * - Single images
 *
 * @module export
 */

// Base exporter class
export * from './Exporter';

// Frame encoder
export * from './FrameEncoder';

// Export types
export * from './types';

// Encoder registry (re-exported via encoders barrel, so skip direct export)
// export * from './EncoderRegistry';

// Image export (exportAsImageSequence is also in encoders, so skip direct export)
// export * from './ImageExporter';

// GIF export
export * from './GifExporter';

// Video export
export * from './VideoExporter';

// Encoders (image sequences, ZIP, GIF, and registry)
export * from './encoders';
