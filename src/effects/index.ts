/**
 * AniMaker Rendering Engine - Post-Processing Effects Module
 *
 * This module provides post-processing effects for enhancing rendered images.
 *
 * @module effects
 */

// Post-processing manager and base class
export {
  PostProcessingManager,
  PostEffect,
} from './PostProcessing';

export type {
  PostProcessingConfig,
  PostProcessingStats,
  RenderTarget,
} from './PostProcessing';

// Individual effects
export { BloomEffect } from './BloomEffect';
export type { BloomConfig } from './BloomEffect';

export { BlurEffect } from './BlurEffect';
export type { BlurConfig } from './BlurEffect';

export { ColorCorrectionEffect } from './ColorCorrectionEffect';
export type { ColorCorrectionConfig } from './ColorCorrectionEffect';

export { VignetteEffect } from './VignetteEffect';
export type { VignetteConfig } from './VignetteEffect';

export { ChromaticAberrationEffect } from './ChromaticAberrationEffect';
export type { ChromaticAberrationConfig } from './ChromaticAberrationEffect';
