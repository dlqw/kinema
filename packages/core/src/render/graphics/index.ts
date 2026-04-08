/**
 * Kinema Rendering Engine - Graphics Module
 *
 * This module exports all graphics device functionality including:
 * - GraphicsDevice: Unified graphics device interface
 * - GraphicsDeviceFactory: Factory for creating devices
 * - WebGPUDevice: WebGPU implementation
 * - WebGL2Device: WebGL2 fallback implementation
 *
 * @module render/graphics
 */

// Re-export core types (these are needed by effects)
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
  DeviceLimits,
  RenderAPI,
} from '../core/types';
