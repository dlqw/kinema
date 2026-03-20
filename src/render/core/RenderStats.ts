/**
 * AniMaker Rendering Engine - Performance Statistics
 *
 * Collects and reports rendering performance metrics.
 */

import type { RenderStats } from './types';

/**
 * Render Statistics Collector
 *
 * Tracks frame time, draw calls, resource usage, and other performance metrics.
 */
export class RenderStatsCollector {
  private stats: RenderStats;
  private frameStartTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private framesSinceUpdate: number = 0;
  private accumulatedTime: number = 0;

  // GPU timing queries (will be implemented with GraphicsDevice)
  private currentPassStartTime: number = 0;
  private passTimings: Map<string, number> = new Map();

  constructor() {
    this.stats = this.createEmptyStats();
  }

  /**
   * Get current frame statistics
   */
  get currentFrameStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Begin frame statistics collection
   */
  beginFrame(): void {
    this.frameStartTime = performance.now();
    this.framesSinceUpdate++;
    this.accumulatedTime += this.stats.frameTime;

    // Reset per-frame counters
    this.stats.drawCalls = 0;
    this.stats.instancedDrawCalls = 0;
    this.stats.computePasses = 0;
    this.stats.triangles = 0;
    this.stats.vertices = 0;
    this.stats.pipelineChanges = 0;
    this.stats.textureBindings = 0;
    this.stats.bufferUpdates = 0;
  }

  /**
   * End frame statistics collection
   */
  endFrame(): void {
    const frameEndTime = performance.now();
    this.stats.frameTime = frameEndTime - this.frameStartTime;

    // Update FPS every 500ms
    if (frameEndTime - this.fpsUpdateTime >= 500) {
      this.stats.fps = Math.round((this.framesSinceUpdate * 1000) / (frameEndTime - this.fpsUpdateTime));
      this.fpsUpdateTime = frameEndTime;
      this.framesSinceUpdate = 0;
    }

    this.frameCount++;
  }

  /**
   * Record a draw call
   */
  recordDrawCall(instanceCount: number = 1, isInstanced: boolean = false): void {
    this.stats.drawCalls++;
    if (isInstanced) {
      this.stats.instancedDrawCalls++;
    }
  }

  /**
   * Record geometry statistics
   */
  recordGeometry(vertexCount: number, triangleCount: number): void {
    this.stats.vertices += vertexCount;
    this.stats.triangles += triangleCount;
  }

  /**
   * Record a compute pass
   */
  recordComputePass(): void {
    this.stats.computePasses++;
  }

  /**
   * Record a pipeline change
   */
  recordPipelineChange(): void {
    this.stats.pipelineChanges++;
  }

  /**
   * Record texture binding
   */
  recordTextureBinding(): void {
    this.stats.textureBindings++;
  }

  /**
   * Record buffer update
   */
  recordBufferUpdate(size: number): void {
    this.stats.bufferUpdates++;
    this.stats.bufferMemory += size;
  }

  /**
   * Begin timing a render pass
   */
  beginRenderPass(label: string): void {
    this.currentPassStartTime = performance.now();
  }

  /**
   * End timing a render pass
   */
  endRenderPass(label: string): void {
    const duration = performance.now() - this.currentPassStartTime;
    this.passTimings.set(label, duration);

    // Update specific timing based on label
    switch (label) {
      case 'shadow':
        this.stats.shadowMapTime = duration;
        break;
      case 'post-processing':
        this.stats.postProcessingTime = duration;
        break;
    }
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.stats = this.createEmptyStats();
    this.frameCount = 0;
    this.framesSinceUpdate = 0;
    this.accumulatedTime = 0;
    this.passTimings.clear();
  }

  /**
   * Get a summary of statistics
   */
  getSummary(): string {
    return `
Render Statistics:
  FPS: ${this.stats.fps}
  Frame Time: ${this.stats.frameTime.toFixed(2)}ms
  Draw Calls: ${this.stats.drawCalls}
  Instanced Calls: ${this.stats.instancedDrawCalls}
  Compute Passes: ${this.stats.computePasses}
  Triangles: ${this.stats.triangles.toLocaleString()}
  Vertices: ${this.stats.vertices.toLocaleString()}
  Buffer Memory: ${(this.stats.bufferMemory / 1024 / 1024).toFixed(2)} MB
  Texture Memory: ${(this.stats.textureMemory / 1024 / 1024).toFixed(2)} MB
  Pipeline Changes: ${this.stats.pipelineChanges}
    `.trim();
  }

  /**
   * Create empty stats object
   */
  private createEmptyStats(): RenderStats {
    return {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      instancedDrawCalls: 0,
      computePasses: 0,
      triangles: 0,
      vertices: 0,
      bufferMemory: 0,
      textureMemory: 0,
      gpuTime: 0,
      shadowMapTime: 0,
      postProcessingTime: 0,
      pipelineChanges: 0,
      textureBindings: 0,
      bufferUpdates: 0,
    };
  }
}

export type { RenderStats };
