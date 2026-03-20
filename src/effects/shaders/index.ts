/**
 * AniMaker Rendering Engine - Post-Processing Shaders
 *
 * This module exports shader sources for post-processing effects.
 *
 * @module effects/shaders
 */

// WebGPU shaders (WGSL)
export { default as bloomWGSL } from './webgpu/bloom.wgsl?raw';
export { default as blurWGSL } from './webgpu/blur.wgsl?raw';
export { default as colorCorrectionWGSL } from './webgpu/color_correction.wgsl?raw';
export { default as vignetteWGSL } from './webgpu/vignette.wgsl?raw';
export { default as chromaticAberrationWGSL } from './webgpu/chromatic_aberration.wgsl?raw';

// WebGL2 shaders (GLSL)
export { default as bloomVertGLSL } from './webgl2/bloom.vert?raw';
export { default as bloomFragGLSL } from './webgl2/bloom.frag?raw';
export { default as blurVertGLSL } from './webgl2/blur.vert?raw';
export { default as blurFragGLSL } from './webgl2/blur.frag?raw';
export { default as colorCorrectionVertGLSL } from './webgl2/color_correction.vert?raw';
export { default as colorCorrectionFragGLSL } from './webgl2/color_correction.frag?raw';
export { default as vignetteVertGLSL } from './webgl2/vignette.vert?raw';
export { default as vignetteFragGLSL } from './webgl2/vignette.frag?raw';
export { default as chromaticAberrationVertGLSL } from './webgl2/chromatic_aberration.vert?raw';
export { default as chromaticAberrationFragGLSL } from './webgl2/chromatic_aberration.frag?raw';

// Common vertex shader
export { default as commonVertGLSL } from './common.vert?raw';
