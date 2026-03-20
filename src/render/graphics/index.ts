/**
 * AniMaker Rendering Engine - Graphics Module
 *
 * This module exports all graphics device functionality including:
 * - GraphicsDevice: Unified graphics device interface
 * - GraphicsDeviceFactory: Factory for creating devices
 * - WebGPUDevice: WebGPU implementation
 * - WebGL2Device: WebGL2 fallback implementation
 *
 * @module render/graphics
 */

// Graphics device interface and factory
export {
  GraphicsDevice,
  GraphicsDeviceFactory,
  type GraphicsDeviceConfig,
} from './GraphicsDevice';

// WebGPU implementation
export { WebGPUDevice } from './webgpu/WebGPUDevice';

// WebGL2 implementation
export { WebGL2Device } from './webgl2/WebGL2Device';

// Re-export core types
export type {
  GraphicsDevice as IGraphicsDevice,
  GraphicsBuffer,
  GraphicsTexture,
  GraphicsSampler,
  GraphicsShader,
  GraphicsPipeline,
  ComputePipeline,
  BindGroupLayout,
  BindGroup,
  CommandEncoder,
  Queue,
} from '../core/types';
