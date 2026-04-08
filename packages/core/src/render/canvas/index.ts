/**
 * Kinema Rendering Engine - Canvas 2D Renderer Module
 *
 * This module exports Canvas 2D rendering functionality as a fallback
 * when WebGL/WebGPU is not available.
 *
 * @module render.canvas
 */

// Main renderer
export { CanvasRenderer } from './CanvasRenderer';

export type { CanvasRendererConfig, CanvasRendererStats } from './CanvasRenderer';

// Context management
export { CanvasContextImpl, CanvasContextFactory } from './CanvasContext';

export type { CanvasContextConfig } from './CanvasContext';

// Shape renderers
export { CircleRenderer } from './shapes/CircleRenderer';

export { RectangleRenderer } from './shapes/RectangleRenderer';

export { PathRenderer } from './shapes/PathRenderer';

export type { CircleOptions } from './shapes/CircleRenderer';

export type { RectangleOptions } from './shapes/RectangleRenderer';

export type { PathOptions, PathCommand } from './shapes/PathRenderer';
