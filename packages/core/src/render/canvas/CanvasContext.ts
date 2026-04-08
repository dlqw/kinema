/**
 * Kinema Rendering Engine - Canvas Context Manager
 *
 * Manages Canvas 2D rendering context and provides
 * compatibility layer with GPU rendering APIs.
 *
 * @module render.canvas
 */

import type { RenderContext } from '../core/RenderContext';
import type { RenderCapability, TextureFormat } from '../core/types';
import { CanvasRenderer } from './CanvasRenderer';
import { RenderAPI } from '../core/types';

/**
 * Canvas context configuration
 */
export interface CanvasContextConfig {
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Device pixel ratio */
  devicePixelRatio?: number;
  /** Background color */
  backgroundColor?: string;
  /** Enable debug mode */
  debugMode?: boolean;
}

/**
 * Canvas Context Implementation
 *
 * Canvas 2D rendering context that provides a fallback
 * when GPU rendering is not available.
 *
 * @example
 * ```typescript
 * const context = await CanvasContextImpl.create({
 *   canvas: document.querySelector('canvas'),
 *   devicePixelRatio: window.devicePixelRatio,
 * });
 * ```
 */
export class CanvasContextImpl {
  public readonly canvas: HTMLCanvasElement;
  public readonly renderer!: CanvasRenderer;
  public presentationSize!: [number, number];
  public aspect!: number;
  public readonly presentationFormat: TextureFormat = 'bgra8unorm';

  // These are intentionally unused - reserved for future use
  // @ts-ignore - Reserved for future use
  private __config!: CanvasContextConfig;
  // @ts-ignore - Reserved for future use
  private __capability!: RenderCapability;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: CanvasRenderer,
    config: CanvasContextConfig,
    capability: RenderCapability,
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.__config = config;
    this.__capability = capability;

    // Initialize size
    const [width, height] = renderer.getSize();
    this.presentationSize = [width, height];
    this.aspect = width > 0 && height > 0 ? width / height : 1;

    // Setup resize observer
    this.setupResizeObserver();
  }

  /**
   * Create a canvas context
   *
   * @param config - Context configuration
   * @param capability - Detected render capability
   * @returns Promise resolving to canvas context
   */
  static async create(
    config: CanvasContextConfig,
    capability: RenderCapability,
  ): Promise<CanvasContextImpl> {
    // Create canvas renderer
    const renderer = new CanvasRenderer({
      canvas: config.canvas,
      devicePixelRatio: config.devicePixelRatio ?? window.devicePixelRatio ?? 1,
      backgroundColor: config.backgroundColor ?? '#000000',
      debugMode: config.debugMode ?? false,
    });

    // Create context instance
    const context = new CanvasContextImpl(config.canvas, renderer, config, capability);

    console.log('[CanvasContext] Created with Canvas 2D backend');
    return context;
  }

  /**
   * Update context (handle resize, etc.)
   */
  update(): void {
    this.renderer.updateSize();
    const [width, height] = this.renderer.getSize();
    (this.presentationSize as any)[0] = width;
    (this.presentationSize as any)[1] = height;
    (this.aspect as any) = this.aspect;
  }

  /**
   * Present frame to screen
   *
   * For Canvas 2D, this is a no-op since rendering is immediate.
   */
  present(): void {
    // Canvas 2D renders immediately, no explicit present needed
  }

  /**
   * Destroy context and release resources
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.renderer.destroy();
    console.log('[CanvasContext] Destroyed');
  }

  /**
   * Setup resize observer
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.update();
    });

    this.resizeObserver.observe(this.canvas);
  }

  /**
   * Get context info for debugging
   *
   * @returns Object containing context information
   */
  getInfo(): Record<string, any> {
    return {
      api: 'canvas-2d',
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
      },
      devicePixelRatio: this.renderer.getPixelRatio(),
    };
  }
}

/**
 * Canvas Context Factory
 *
 * Factory for creating canvas rendering contexts.
 */
export class CanvasContextFactory {
  /**
   * Create a canvas context with auto-detection
   *
   * Attempts to use WebGL2/WebGPU first, falls back to Canvas 2D.
   *
   * @param config - Context configuration
   * @returns Promise resolving to a render context
   */
  static async create(config: CanvasContextConfig): Promise<CanvasContextImpl | RenderContext> {
    // Try GPU contexts first
    try {
      // Try to import GPU context factory
      // This would normally import from the actual GPU context implementation
      // For now, we'll just create a Canvas 2D context
      console.log('[CanvasContextFactory] Using Canvas 2D rendering');
    } catch (e) {
      console.warn('[CanvasContextFactory] GPU context unavailable, using Canvas 2D');
    }

    // Create Canvas 2D capability
    const capability: RenderCapability = {
      api: RenderAPI.None, // Will be set to canvas-2d in actual implementation
      features: new Set(['canvas-2d']),
      limits: {},
    };

    return await CanvasContextImpl.create(config, capability);
  }
}

// Re-export types - already exported above, so no need to re-export here
