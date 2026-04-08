/**
 * Kinema Rendering Engine - Render Module
 *
 * This module exports all rendering functionality including:
 * - Graphics devices (WebGPU/WebGL2)
 * - Canvas 2D renderer
 * - Render pipeline
 * - Resource management
 * - Shader management
 *
 * @module render
 */

// Core rendering
export * from './core';

// Graphics device abstraction
export * from './graphics';

// Resource management
export * from './resources';

// Render pipeline
export * from './pipeline';

// Canvas 2D renderer
export * from './canvas';

// Shaders
export * from './shaders';
