/**
 * Kinema Rendering Engine - Shaders Module
 *
 * This module exports shader utilities and built-in shader sources.
 *
 * @module render/shaders
 */

// Common utilities
export {
  detectShaderLanguage,
  detectShaderStage,
  getShaderExtension,
  validateShaderSource,
  preprocessShader,
  extractShaderMetadata,
  generateShaderHash,
  formatShaderError,
} from './common/utils';

export type { ShaderLanguageDetection } from './common/utils';
