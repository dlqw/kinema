/**
 * Kinema Core Package - Utilities Module
 *
 * This module exports utility functions for math and color operations.
 *
 * @module utils
 */

// Math utilities
export {
  lerp,
  clamp,
  degToRad,
  radToDeg,
  approxEqual,
  mapRange,
  wrap,
  distance,
  normalize,
  dot,
  cross,
  lerpVector,
} from './math';

// Color utilities
export {
  hexToRgb,
  rgbToHex,
  rgbToRgba,
  rgbaToString,
  parseColor,
  blendColors,
  adjustBrightness,
  rgbToHsl,
  hslToRgb,
} from './color';
