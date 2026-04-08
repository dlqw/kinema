/**
 * Kinema Rendering Engine - Post Processing System
 *
 * This module provides post-processing effects for enhancing rendered images.
 * Effects include bloom, blur, color correction, vignette, chromatic aberration, etc.
 *
 * @module effects
 */

import type {
  GraphicsDevice,
  GraphicsTexture,
  CommandEncoder,
} from '../render/graphics/GraphicsDevice';

/**
 * GPU texture format type alias
 * Represents texture formats supported by WebGPU/WebGL2
 */
type GPUTextureFormat = string;

/**
 * Post-processing configuration
 */
export interface PostProcessingConfig {
  /** Enable post-processing */
  enabled?: boolean;
  /** Render target format */
  format?: GPUTextureFormat;
  /** Sample count for MSAA */
  sampleCount?: number;
  /** Enable HDR */
  hdr?: boolean;
  /** Exposure value for tone mapping */
  exposure?: number;
}

/**
 * Post-processing statistics
 */
export interface PostProcessingStats {
  /** Number of active effects */
  activeEffects: number;
  /** Total render time in milliseconds */
  totalTime: number;
  /** Individual effect times */
  effectTimes: Map<string, number>;
}

/**
 * Render target
 */
export interface RenderTarget {
  /** Target texture */
  texture: GraphicsTexture;
  /** Target width */
  width: number;
  /** Target height */
  height: number;
}

/**
 * Post-Processing Manager
 *
 * Manages a chain of post-processing effects applied to rendered images.
 *
 * @example
 * ```typescript
 * const postProcessing = new PostProcessingManager(device, {
 *   format: 'bgra8unorm',
 *   exposure: 1.0,
 * });
 *
 * // Add effects
 * postProcessing.addEffect(new BloomEffect(device));
 * postProcessing.addEffect(new VignetteEffect(device));
 *
 * // Render post-processing
 * const output = postProcessing.render(inputTexture);
 * ```
 */
export class PostProcessingManager {
  private device: GraphicsDevice;
  private config: Required<PostProcessingConfig>;
  private effects: PostEffect[] = [];
  private stats: PostProcessingStats = {
    activeEffects: 0,
    totalTime: 0,
    effectTimes: new Map(),
  };

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a post-processing manager
   *
   * @param device - Graphics device
   * @param config - Configuration
   */
  constructor(device: GraphicsDevice, config: PostProcessingConfig = {}) {
    this.device = device;

    this.config = {
      enabled: config.enabled ?? true,
      format: config.format ?? 'bgra8unorm',
      sampleCount: config.sampleCount ?? 1,
      hdr: config.hdr ?? false,
      exposure: config.exposure ?? 1.0,
    };

    console.log('[PostProcessing] Created with config:', this.config);
  }

  // ==========================================================================
  // Effect Management
  // ==========================================================================

  /**
   * Add a post-processing effect
   *
   * @param effect - Effect to add
   */
  addEffect(effect: PostEffect): void {
    this.effects.push(effect);
    console.log(`[PostProcessing] Added effect: ${effect.name}`);
  }

  /**
   * Remove a post-processing effect
   *
   * @param effect - Effect to remove
   */
  removeEffect(effect: PostEffect): void {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
      effect.dispose();
      console.log(`[PostProcessing] Removed effect: ${effect.name}`);
    }
  }

  /**
   * Get all effects
   *
   * @returns Array of effects
   */
  getEffects(): PostEffect[] {
    return [...this.effects];
  }

  /**
   * Get an effect by name
   *
   * @param name - Effect name
   * @returns Effect or undefined
   */
  getEffect(name: string): PostEffect | undefined {
    return this.effects.find((e) => e.name === name);
  }

  /**
   * Clear all effects
   */
  clearEffects(): void {
    for (const effect of this.effects) {
      effect.dispose();
    }
    this.effects = [];
    console.log('[PostProcessing] Cleared all effects');
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Apply post-processing to an input texture
   *
   * @param inputTexture - Input texture to process
   * @param outputTexture - Output texture (optional)
   * @returns Processed texture
   */
  render(inputTexture: GraphicsTexture, outputTexture?: GraphicsTexture): GraphicsTexture {
    if (!this.config.enabled || this.effects.length === 0) {
      return inputTexture;
    }

    const startTime = performance.now();

    // Create output target if not provided
    const outputTarget: RenderTarget = outputTexture
      ? { texture: outputTexture, width: outputTexture.width, height: outputTexture.height }
      : this.createRenderTarget(inputTexture);

    // Create command encoder
    const encoder = this.device.createCommandEncoder();

    // Apply each effect in sequence
    let currentTexture = inputTexture;

    for (const effect of this.effects) {
      const effectStartTime = performance.now();

      currentTexture = effect.apply(encoder, currentTexture, outputTarget);

      const effectTime = performance.now() - effectStartTime;
      this.stats.effectTimes.set(effect.name, effectTime);
    }

    // Finish and submit
    const commandBuffer = encoder.finish();
    this.device.queue.submit([commandBuffer]);

    // Update statistics
    this.stats.activeEffects = this.effects.length;
    this.stats.totalTime = performance.now() - startTime;

    return outputTarget.texture;
  }

  /**
   * Render with custom render target
   *
   * @param inputTexture - Input texture
   * @param renderTarget - Custom render target
   * @returns Processed texture
   */
  renderToTarget(inputTexture: GraphicsTexture, renderTarget: RenderTarget): GraphicsTexture {
    return this.render(inputTexture, renderTarget.texture);
  }

  // ==========================================================================
  // Render Targets
  // ==========================================================================

  /**
   * Create a render target
   *
   * @param texture - Source texture
   * @returns Render target
   */
  private createRenderTarget(texture: GraphicsTexture): RenderTarget {
    // TODO: Create intermediate render target
    // This requires TextureManager integration

    return {
      texture: texture,
      width: texture.width,
      height: texture.height,
    };
  }

  /**
   * Set input render target
   *
   * @param _target - Input render target
   * @deprecated Not yet implemented. Will throw if called.
   */
  setInputTarget(_target: RenderTarget): void {
    throw new Error(
      'setInputTarget() is not yet implemented. ' +
        'Use the constructor or addEffect() to configure the post-processing pipeline.',
    );
  }

  /**
   * Set output render target
   *
   * @param _target - Output render target
   * @deprecated Not yet implemented. Will throw if called.
   */
  setOutputTarget(_target: RenderTarget): void {
    throw new Error(
      'setOutputTarget() is not yet implemented. ' +
        'Use the constructor or addEffect() to configure the post-processing pipeline.',
    );
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Update configuration
   *
   * @param config - New configuration
   */
  updateConfig(config: Partial<PostProcessingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[PostProcessing] Config updated:', this.config);
  }

  /**
   * Get configuration
   *
   * @returns Current configuration
   */
  getConfig(): Required<PostProcessingConfig> {
    return { ...this.config };
  }

  /**
   * Enable/disable post-processing
   *
   * @param enabled - Enable state
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    console.log(`[PostProcessing] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Set exposure (for tone mapping)
   *
   * @param exposure - Exposure value
   */
  setExposure(exposure: number): void {
    this.config.exposure = Math.max(0, exposure);
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get post-processing statistics
   *
   * @returns Statistics object
   */
  getStats(): PostProcessingStats {
    return {
      activeEffects: this.stats.activeEffects,
      totalTime: this.stats.totalTime,
      effectTimes: new Map(this.stats.effectTimes),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      activeEffects: 0,
      totalTime: 0,
      effectTimes: new Map(),
    };
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Destroy the post-processing manager
   */
  destroy(): void {
    this.clearEffects();
    console.log('[PostProcessing] Destroyed');
  }
}

/**
 * Post Effect Base Class
 *
 * Base class for all post-processing effects.
 *
 * @example
 * ```typescript
 * class MyEffect extends PostEffect {
 *   constructor(device: GraphicsDevice) {
 *     super(device, 'MyEffect');
 *   }
 *
 *   apply(encoder: CommandEncoder, input: GraphicsTexture, output: RenderTarget): GraphicsTexture {
 *     // Implement effect
 *     return output;
 *   }
 * }
 * }
 * ```
 */
export abstract class PostEffect {
  public readonly name: string;
  protected device: GraphicsDevice;
  protected config: Record<string, any> = {};

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a post effect
   *
   * @param device - Graphics device
   * @param name - Effect name
   */
  protected constructor(device: GraphicsDevice, name: string) {
    this.device = device;
    this.name = name;
  }

  // ==========================================================================
  // Abstract Methods
  // ==========================================================================

  /**
   * Apply the effect to an input texture
   *
   * @param encoder - Command encoder
   * @param input - Input texture
   * @param output - Output render target
   * @returns Output texture
   */
  abstract apply(
    encoder: CommandEncoder,
    input: GraphicsTexture,
    output: RenderTarget,
  ): GraphicsTexture;

  /**
   * Dispose effect resources
   */
  dispose(): void {
    // Override to dispose effect-specific resources
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Set effect parameter
   *
   * @param key - Parameter name
   * @param value - Parameter value
   */
  setParameter(key: string, value: any): void {
    this.config[key] = value;
  }

  /**
   * Get effect parameter
   *
   * @param key - Parameter name
   * @returns Parameter value
   */
  getParameter(key: string): any {
    return this.config[key];
  }

  /**
   * Get all parameters
   *
   * @returns Parameters object
   */
  getParameters(): Record<string, any> {
    return { ...this.config };
  }
}
