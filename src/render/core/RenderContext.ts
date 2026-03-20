/**
 * AniMaker Rendering Engine - Render Context
 *
 * Manages the canvas, presentation context, and frame presentation.
 * This module integrates with GraphicsDevice to provide a unified
 * rendering context abstraction.
 */

import type { RenderEngineConfig } from './types';
import type { RenderCapability } from './Capability';
import type { GraphicsDevice, GraphicsDeviceConfig } from '../graphics/GraphicsDevice';
import { GraphicsDeviceFactory } from '../graphics/GraphicsDevice';

/**
 * Render Context Interface
 *
 * Defines the contract for render context implementations.
 */
export interface RenderContext {
  /** Canvas element being rendered to */
  readonly canvas: HTMLCanvasElement;

  /** Graphics device for rendering */
  readonly device: GraphicsDevice;

  /** Current presentation size [width, height] */
  readonly presentationSize: [number, number];

  /** Current aspect ratio (width / height) */
  readonly aspect: number;

  /** Presentation format for the canvas */
  readonly presentationFormat: GPUTextureFormat;

  /**
   * Update context (handle resize, etc.)
   */
  update(): void;

  /**
   * Present frame to screen
   */
  present(): void;

  /**
   * Destroy context and release resources
   */
  destroy(): void;
}

/**
 * Render Context Implementation
 *
 * Manages the canvas element and GPU presentation context.
 * Integrates with GraphicsDevice to provide a unified rendering interface.
 */
export class RenderContextImpl implements RenderContext {
  public readonly canvas: HTMLCanvasElement;
  public readonly device: GraphicsDevice;
  public readonly presentationSize: [number, number];
  public readonly aspect: number;
  public readonly presentationFormat: GPUTextureFormat;

  private config: RenderEngineConfig;
  private capability: RenderCapability;
  private resizeObserver: ResizeObserver | null = null;

  private constructor(
    canvas: HTMLCanvasElement,
    device: GraphicsDevice,
    config: RenderEngineConfig,
    capability: RenderCapability
  ) {
    this.canvas = canvas;
    this.device = device;
    this.config = config;
    this.capability = capability;
    this.presentationFormat = device.presentationFormat;

    // Use device's presentation size
    (this.presentationSize as any)[0] = device.presentationSize[0];
    (this.presentationSize as any)[1] = device.presentationSize[1];
    (this.aspect as any) = device.aspect;

    // Setup resize observer
    this.setupResizeObserver();
  }

  /**
   * Create a render context
   *
   * @param config - Engine configuration
   * @param capability - Detected render capability
   * @returns Promise resolving to a render context
   *
   * @example
   * ```typescript
   * const context = await RenderContextImpl.create(
   *   { canvas: document.querySelector('canvas') },
   *   capability
   * );
   * ```
   */
  static async create(
    config: RenderEngineConfig,
    capability: RenderCapability
  ): Promise<RenderContextImpl> {
    // Create or get canvas
    const canvas = RenderContextImpl.createCanvas(config);

    // Create graphics device configuration
    const deviceConfig: GraphicsDeviceConfig = {
      canvas,
      powerPreference: config.powerPreference ?? 'high-performance',
      devicePixelRatio: config.devicePixelRatio ?? window.devicePixelRatio ?? 1,
      debugMode: config.debugMode ?? false,
      apiPreference: config.apiPreference ?? 'webgpu',
      antialias: config.antialias ?? true,
      alpha: config.alpha ?? true,
      depth: config.depth ?? true,
      stencil: config.stencil ?? false,
    };

    // Create graphics device
    const device = await GraphicsDeviceFactory.create(deviceConfig);

    // Create context instance
    const context = new RenderContextImpl(canvas, device, config, capability);

    console.log('[RenderContext] Created with', device.api.toUpperCase());

    return context;
  }

  /**
   * Create canvas element
   *
   * Creates a new canvas element if one is not provided in the config.
   * The canvas is automatically sized to fill the viewport.
   *
   * @param config - Engine configuration
   * @returns Canvas element
   */
  private static createCanvas(config: RenderEngineConfig): HTMLCanvasElement {
    if (config.canvas) {
      // Use provided canvas
      return config.canvas;
    }

    // Create new canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'animaker-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    canvas.style.objectFit = 'cover';
    canvas.style.display = 'block';

    // Append to body
    document.body.appendChild(canvas);

    console.log('[RenderContext] Created new canvas element');

    return canvas;
  }

  /**
   * Setup resize observer
   *
   * Monitors canvas size changes and updates the device accordingly.
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateSize();
    });

    this.resizeObserver.observe(this.canvas);
  }

  /**
   * Update canvas size
   *
   * Called when the canvas is resized. Updates the device's presentation size.
   */
  private updateSize(): void {
    const pixelRatio = this.config.devicePixelRatio || window.devicePixelRatio || 1;
    const clientWidth = this.canvas.clientWidth;
    const clientHeight = this.canvas.clientHeight;

    if (clientWidth > 0 && clientHeight > 0) {
      const newWidth = Math.floor(clientWidth * pixelRatio);
      const newHeight = Math.floor(clientHeight * pixelRatio);

      // Only update if size actually changed
      if (newWidth !== this.device.presentationSize[0] || newHeight !== this.device.presentationSize[1]) {
        // Update device
        this.device.resize();

        // Update presentation size from device
        (this.presentationSize as any)[0] = this.device.presentationSize[0];
        (this.presentationSize as any)[1] = this.device.presentationSize[1];
        (this.aspect as any) = this.device.aspect;

        console.log(
          `[RenderContext] Resize: ${this.presentationSize[0]}x${this.presentationSize[1]}`
        );
      }
    }
  }

  /**
   * Update context (handle resize, etc.)
   *
   * Called each frame to ensure context is up to date.
   */
  update(): void {
    // Size is automatically handled by ResizeObserver
    // Additional per-frame updates can be added here
  }

  /**
   * Present frame to screen
   *
   * Called at the end of each frame to present the rendered image.
   * For WebGPU, presentation is automatic. For WebGL2, we may need to flush.
   */
  present(): void {
    // WebGPU handles presentation automatically
    // WebGL2 may need explicit flush in some cases
    if (this.device.api === 'webgl2') {
      const gl = (this.device as any).gl;
      if (gl) {
        gl.flush();
      }
    }
  }

  /**
   * Destroy context and release resources
   *
   * Clean up all resources and event listeners.
   */
  destroy(): void {
    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Destroy graphics device
    this.device.destroy();

    // Remove canvas if we created it
    if (!this.config.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    console.log('[RenderContext] Destroyed');
  }

  /**
   * Get context info for debugging
   *
   * @returns Object containing context information
   */
  getInfo(): Record<string, any> {
    return {
      api: this.device.api,
      canvas: {
        width: this.canvas.width,
        height: this.canvas.height,
        clientWidth: this.canvas.clientWidth,
        clientHeight: this.canvas.clientHeight,
      },
      presentation: {
        width: this.presentationSize[0],
        height: this.presentationSize[1],
        aspect: this.aspect,
        format: this.presentationFormat,
      },
      device: {
        label: this.device.label,
        features: Array.from(this.device.features),
        limits: this.device.limits,
      },
    };
  }
}

// Re-export types
export type { RenderContext };
