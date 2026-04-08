/**
 * Kinema Rendering Engine - Chromatic Aberration Effect
 *
 * Implements chromatic aberration post-processing effect that simulates
 * color fringing at the edges of bright objects.
 *
 * @module effects
 */

import type {
  GraphicsDevice,
  GraphicsTexture,
  CommandEncoder,
} from '../render/graphics/GraphicsDevice';
import { PostEffect } from './PostProcessing';
import type { RenderTarget } from './PostProcessing';

/**
 * Chromatic aberration configuration
 */
export interface ChromaticAberrationConfig {
  /** Aberration strength (0-1) */
  strength?: number;
  /** Aberration offset (0-0.1) */
  offset?: number;
}

/**
 * Chromatic Aberration Effect
 *
 * Creates a color fringing effect by shifting RGB channels.
 *
 * @example
 * ```typescript
 * const chroma = new ChromaticAberrationEffect(device);
 * chroma.setStrength(0.05);
 * ```
 */
export class ChromaticAberrationEffect extends PostEffect {
  // Reserved for future shader pipeline implementation
  // private pipeline: GraphicsPipeline | null = null;

  // Chromatic aberration parameters
  private strength = 0.05;
  private offset = 0.01;

  constructor(device: GraphicsDevice) {
    super(device, 'ChromaticAberration');
    this.createResources();
  }

  // ==========================================================================
  // Effect Application
  // ==========================================================================

  apply(_encoder: CommandEncoder, input: GraphicsTexture, _output: RenderTarget): GraphicsTexture {
    // TODO: Implement actual chromatic aberration
    // Requires shifting RGB channels separately

    console.log('[ChromaticAberration] Applied (strength:', this.strength, 'offset:', this.offset);

    return input;
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Set aberration strength
   *
   * @param strength - Strength value (0-0.2, default 0.05)
   */
  setStrength(strength: number): void {
    this.strength = Math.max(0, Math.min(0.2, strength));
  }

  /**
   * Set aberration offset
   *
   * @param offset - Offset value (0-0.1, default 0.01)
   */
  setOffset(offset: number): void {
    this.offset = Math.max(0, Math.min(0.1, offset));
  }

  /**
   * Set strength from focal length
   *
   * @param focalLength - Focal length in mm
   */
  setFromFocalLength(focalLength: number): void {
    // Approximate aberration based on focal length
    // Wide angle lenses (short focal length) have more aberration
    const normalizedLength = (focalLength - 20) / (200 - 20); // 20-200mm range
    this.strength = normalizedLength * 0.15;
  }

  /**
   * Set subtle aberration preset
   */
  setSubtle(): void {
    this.strength = 0.02;
    this.offset = 0.005;
  }

  /**
   * Set strong aberration preset
   */
  setStrong(): void {
    this.strength = 0.1;
    this.offset = 0.02;
  }

  /**
   * Disable chromatic aberration
   */
  disable(): void {
    this.strength = 0;
  }

  // ==========================================================================
  // Resource Management
  // ==========================================================================

  private createResources(): void {
    // TODO: Create chromatic aberration pipeline
  }

  override dispose(): void {
    // TODO: Dispose resources
  }
}
