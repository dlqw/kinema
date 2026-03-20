/**
 * AniMaker Rendering Engine - Core Engine
 *
 * Main entry point for the rendering engine. Manages initialization,
 * frame loop, and coordinates all rendering subsystems.
 */

import type {
  RenderEngineConfig,
  RenderCapability,
  RenderStats,
  GraphicsDevice,
  RenderContext,
} from './types';

import { CapabilityDetector } from './Capability';
import { RenderStatsCollector } from './RenderStats';
import { RenderContextImpl } from './RenderContext';

/**
 * Main rendering engine class
 *
 * @example
 * ```typescript
 * const engine = await RenderEngine.init({
 *   canvas: document.querySelector('canvas'),
 *   devicePixelRatio: window.devicePixelRatio,
 *   apiPreference: RenderAPI.WebGPU,
 * });
 *
 * engine.start();
 * ```
 */
export class RenderEngine {
  private static instance: RenderEngine | null = null;
  private device: GraphicsDevice | null = null;
  private context: RenderContext | null = null;
  private stats: RenderStatsCollector;
  private config: RenderEngineConfig;
  private isRunning: boolean = false;
  private animationFrameId: number = 0;
  private lastFrameTime: number = 0;
  private targetFrameTime: number = 0; // 0 = unlimited

  private constructor(config: RenderEngineConfig) {
    this.config = {
      devicePixelRatio: window.devicePixelRatio || 1,
      powerPreference: 'high-performance',
      apiPreference: RenderAPI.WebGPU,
      debugMode: false,
      antialias: true,
      alpha: true,
      depth: true,
      stencil: false,
      ...config,
    };
    this.stats = new RenderStatsCollector();
  }

  /**
   * Initialize the rendering engine
   *
   * @param config - Engine configuration
   * @returns Promise that resolves when initialization is complete
   */
  static async init(config: RenderEngineConfig = {}): Promise<RenderEngine> {
    if (RenderEngine.instance) {
      console.warn('RenderEngine already initialized. Returning existing instance.');
      return RenderEngine.instance;
    }

    const engine = new RenderEngine(config);

    // Detect GPU capabilities
    const capability = CapabilityDetector.detect();
    if (capability.api === RenderAPI.None) {
      throw new Error(
        'No supported graphics API found. WebGPU or WebGL2 is required.'
      );
    }

    console.log(
      `[RenderEngine] Initializing with ${capability.api.toUpperCase()}...`
    );

    // Initialize render context
    engine.context = await RenderContextImpl.create(engine.config, capability);

    // Get graphics device from context
    engine.device = engine.context.device;

    console.log('[RenderEngine] Initialization complete.');

    RenderEngine.instance = engine;
    return engine;
  }

  /**
   * Get the singleton instance
   * @throws If engine has not been initialized
   */
  static get(): RenderEngine {
    if (!RenderEngine.instance) {
      throw new Error('RenderEngine not initialized. Call RenderEngine.init() first.');
    }
    return RenderEngine.instance;
  }

  /**
   * Get the graphics device
   */
  get graphicsDevice(): GraphicsDevice {
    if (!this.device) {
      throw new Error('Graphics device not available. Engine not initialized.');
    }
    return this.device;
  }

  /**
   * Get the render context
   */
  get renderContext(): RenderContext {
    if (!this.context) {
      throw new Error('Render context not available. Engine not initialized.');
    }
    return this.context;
  }

  /**
   * Get render stats
   */
  get renderStats(): RenderStats {
    return this.stats.currentFrameStats;
  }

  /**
   * Get canvas element
   */
  get canvas(): HTMLCanvasElement {
    return this.context?.canvas || null;
  }

  /**
   * Get canvas width
   */
  get width(): number {
    return this.context?.presentationSize[0] || 0;
  }

  /**
   * Get canvas height
   */
  get height(): number {
    return this.context?.presentationSize[1] || 0;
  }

  /**
   * Get canvas aspect ratio
   */
  get aspect(): number {
    return this.context?.aspect || 1;
  }

  /**
   * Set target frame rate (fps)
   * @param fps - Target frame rate (0 = unlimited)
   */
  setFrameRate(fps: number): void {
    this.targetFrameTime = fps > 0 ? 1000 / fps : 0;
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[RenderEngine] Already running');
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.scheduleNextFrame();
    console.log('[RenderEngine] Started');
  }

  /**
   * Pause the render loop
   */
  pause(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.animationFrameId !== 0) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    console.log('[RenderEngine] Paused');
  }

  /**
   * Resume the render loop
   */
  resume(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.scheduleNextFrame();
    console.log('[RenderEngine] Resumed');
  }

  /**
   * Schedule next frame
   */
  private scheduleNextFrame(): void {
    if (!this.isRunning) {
      return;
    }

    this.animationFrameId = requestAnimationFrame((time) => this.render(time));
  }

  /**
   * Render a single frame
   * @param timestamp - Current timestamp from requestAnimationFrame
   */
  private async render(timestamp: number): void {
    if (!this.isRunning) {
      return;
    }

    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;

    // Frame rate limiting
    if (this.targetFrameTime > 0 && deltaTime < this.targetFrameTime) {
      const delay = this.targetFrameTime - deltaTime;
      await new Promise((resolve) => setTimeout(resolve, delay));
      // Recalculate after delay
      const adjustedTimestamp = performance.now();
      this.lastFrameTime = adjustedTimestamp;
      this.animationFrameId = requestAnimationFrame((t) => this.render(t));
      return;
    }

    this.lastFrameTime = timestamp;

    // Begin frame stats collection
    this.stats.beginFrame();

    try {
      // Update context (handle resize, etc.)
      this.context?.update();

      // TODO: Implement render pipeline
      // This will be implemented when we add the RenderPipeline module
      // await this.renderPipeline.execute(deltaTime);

      // Present frame
      this.context?.present();
    } catch (error) {
      console.error('[RenderEngine] Frame render error:', error);
    }

    // End frame stats collection
    this.stats.endFrame();

    // Schedule next frame
    this.scheduleNextFrame();
  }

  /**
   * Destroy the engine and release all resources
   */
  destroy(): void {
    this.pause();

    if (this.context) {
      this.context.destroy();
      this.context = null;
    }

    this.device = null;
    RenderEngine.instance = null;
    console.log('[RenderEngine] Destroyed');
  }
}

// Re-export types
export * from './types';
export { CapabilityDetector, RenderCapability };
export { RenderStatsCollector, RenderStats };
export { RenderContextImpl as RenderContext };
