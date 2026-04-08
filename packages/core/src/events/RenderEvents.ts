/**
 * Render Events
 *
 * Events emitted during rendering process
 *
 * @module events
 */

import type { EventData, EventEmitter } from './EventEmitter';

/**
 * Render start event data
 */
export interface RenderStartData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Canvas element being rendered to
   */
  canvas: HTMLCanvasElement;

  /**
   * Rendering context type
   */
  contextType: '2d' | 'webgl' | 'webgl2' | 'webgpu';

  /**
   * Target frame rate
   */
  targetFPS: number;

  /**
   * Timestamp when rendering started
   */
  timestamp: number;
}

/**
 * Before render event data
 */
export interface BeforeRenderData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Scene or objects to render
   */
  scene: any;

  /**
   * Current frame number
   */
  frameNumber: number;

  /**
   * Timestamp before render
   */
  timestamp: number;

  /**
   * Rendering context
   */
  context: any;

  /**
   * Canvas dimensions
   */
  dimensions: {
    width: number;
    height: number;
  };

  /**
   * Viewport configuration
   */
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * After render event data
 */
export interface AfterRenderData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Scene or objects that were rendered
   */
  scene: any;

  /**
   * Frame number that was rendered
   */
  frameNumber: number;

  /**
   * Timestamp after render
   */
  timestamp: number;

  /**
   * Time taken to render in milliseconds
   */
  renderTime: number;

  /**
   * Number of objects rendered
   */
  objectCount: number;

  /**
   * Number of draw calls made
   */
  drawCalls: number;

  /**
   * Rendering context
   */
  context: any;
}

/**
 * Render error event data
 */
export interface RenderErrorData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Error that occurred
   */
  error: Error;

  /**
   * Error type
   */
  errorType:
    | 'context_loss'
    | 'shader_error'
    | 'buffer_error'
    | 'texture_error'
    | 'draw_error'
    | 'unknown';

  /**
   * Frame number when error occurred
   */
  frameNumber: number;

  /**
   * Object being rendered when error occurred (if applicable)
   */
  object?: any;

  /**
   * Additional error context
   */
  context?: Record<string, any>;

  /**
   * Whether rendering can continue
   */
  recoverable: boolean;
}

/**
 * Render warning event data
 */
export interface RenderWarningData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Warning message
   */
  message: string;

  /**
   * Warning code
   */
  code: string;

  /**
   * Frame number when warning occurred
   */
  frameNumber: number;

  /**
   * Additional context
   */
  context?: Record<string, any>;
}

/**
 * Performance metrics event data
 */
export interface RenderPerformanceData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Current frame number
   */
  frameNumber: number;

  /**
   * Actual frames per second
   */
  fps: number;

  /**
   * Frame time in milliseconds
   */
  frameTime: number;

  /**
   * Time spent rendering in milliseconds
   */
  renderTime: number;

  /**
   * Memory usage (if available)
   */
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };

  /**
   * Number of objects in scene
   */
  objectCount: number;

  /**
   * Number of active animations
   */
  animationCount: number;

  /**
   * GPU memory usage (if available)
   */
  gpuMemory?: {
    used: number;
    total: number;
  };
}

/**
 * Resize event data
 */
export interface RenderResizeData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Old dimensions
   */
  oldSize: {
    width: number;
    height: number;
  };

  /**
   * New dimensions
   */
  newSize: {
    width: number;
    height: number;
  };

  /**
   * Scale factor (device pixel ratio)
   */
  scale: number;

  /**
   * Timestamp when resized
   */
  timestamp: number;
}

/**
 * Context loss event data
 */
export interface ContextLossData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Context type that was lost
   */
  contextType: 'webgl' | 'webgl2' | 'webgpu';

  /**
   * Reason for context loss (if available)
   */
  reason?: string;

  /**
   * Timestamp when context was lost
   */
  timestamp: number;

  /**
   * Whether restoration is possible
   */
  restorable: boolean;
}

/**
 * Context restored event data
 */
export interface ContextRestoredData {
  /**
   * Renderer identifier
   */
  rendererId: string;

  /**
   * Context type that was restored
   */
  contextType: 'webgl' | 'webgl2' | 'webgpu';

  /**
   * Timestamp when context was restored
   */
  timestamp: number;

  /**
   * Time without context in milliseconds
   */
  downtime: number;
}

/**
 * Render events map
 */
export interface RenderEvents {
  /**
   * Emitted when rendering starts
   */
  start: RenderStartData;

  /**
   * Emitted before each render frame
   */
  beforeRender: BeforeRenderData;

  /**
   * Emitted after each render frame
   */
  afterRender: AfterRenderData;

  /**
   * Emitted when a render error occurs
   */
  error: RenderErrorData;

  /**
   * Emitted when a non-fatal warning occurs
   */
  warning: RenderWarningData;

  /**
   * Emitted periodically with performance metrics
   */
  performance: RenderPerformanceData;

  /**
   * Emitted when render canvas is resized
   */
  resize: RenderResizeData;

  /**
   * Emitted when rendering context is lost
   */
  contextLoss: ContextLossData;

  /**
   * Emitted when rendering context is restored
   */
  contextRestored: ContextRestoredData;
}

/**
 * Render event emitter type
 */
export type RenderEventEmitter = EventEmitter<RenderEvents>;

/**
 * Helper type for render event handler
 */
export type RenderEventHandler<K extends keyof RenderEvents> = (
  data: EventData<RenderEvents[K]>,
) => void | Promise<void>;

/**
 * Render event names
 */
export const RenderEventNames = {
  START: 'start',
  BEFORE_RENDER: 'beforeRender',
  AFTER_RENDER: 'afterRender',
  ERROR: 'error',
  WARNING: 'warning',
  PERFORMANCE: 'performance',
  RESIZE: 'resize',
  CONTEXT_LOSS: 'contextLoss',
  CONTEXT_RESTORED: 'contextRestored',
} as const;

/**
 * Create render error data helper
 */
export function createRenderErrorData(
  rendererId: string,
  error: Error,
  errorType: RenderErrorData['errorType'],
  frameNumber: number,
  object: any | undefined,
  recoverable: boolean,
  context?: Record<string, any>,
): RenderErrorData {
  const result: RenderErrorData = {
    rendererId,
    error,
    errorType,
    frameNumber,
    object,
    recoverable,
  };
  if (context !== undefined) {
    result.context = context;
  }
  return result;
}

/**
 * Create performance data helper
 */
export function createRenderPerformanceData(
  rendererId: string,
  frameNumber: number,
  fps: number,
  frameTime: number,
  renderTime: number,
  objectCount: number,
  animationCount: number,
  memoryUsage?: RenderPerformanceData['memoryUsage'],
  gpuMemory?: RenderPerformanceData['gpuMemory'],
): RenderPerformanceData {
  const result: RenderPerformanceData = {
    rendererId,
    frameNumber,
    fps,
    frameTime,
    renderTime,
    objectCount,
    animationCount,
  };
  if (memoryUsage !== undefined) {
    result.memoryUsage = memoryUsage;
  }
  if (gpuMemory !== undefined) {
    result.gpuMemory = gpuMemory;
  }
  return result;
}

/**
 * Create resize data helper
 */
export function createRenderResizeData(
  rendererId: string,
  oldSize: { width: number; height: number },
  newSize: { width: number; height: number },
  scale: number,
  timestamp: number,
): RenderResizeData {
  return {
    rendererId,
    oldSize,
    newSize,
    scale,
    timestamp,
  };
}
