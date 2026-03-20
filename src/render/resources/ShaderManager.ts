/**
 * AniMaker Rendering Engine - Shader Manager
 *
 * This module provides a unified interface for managing shaders across
 * WebGPU (WGSL) and WebGL2 (GLSL). It handles:
 * - Shader loading and compilation
 * - Shader caching and hot-reloading
 * - Error reporting and diagnostics
 * - Shader variant generation
 *
 * @module resources
 */

import type { GraphicsDevice, GraphicsShader } from '../graphics/GraphicsDevice';
import type { ShaderModuleDescriptor } from '../core/types';

/**
 * Shader source type
 */
export enum ShaderLanguage {
  WGSL = 'wgsl',
  GLSL = 'glsl',
}

/**
 * Shader stage type
 */
export enum ShaderStage {
  Vertex = 'vertex',
  Fragment = 'fragment',
  Compute = 'compute',
}

/**
 * Shader compilation status
 */
export enum ShaderCompilationStatus {
  Success = 'success',
  Error = 'error',
  Pending = 'pending',
}

/**
 * Shader compilation result
 */
export interface ShaderCompilationResult {
  /** Compilation status */
  status: ShaderCompilationStatus;
  /** Compiled shader (null if failed) */
  shader: GraphicsShader | null;
  /** Error message (null if successful) */
  error: string | null;
  /** Compilation warnings */
  warnings: string[];
  /** Compilation time in milliseconds */
  compilationTime: number;
}

/**
 * Shader variant definition
 *
 * Defines a variant of a base shader with different preprocessor defines.
 */
export interface ShaderVariant {
  /** Variant identifier */
  name: string;
  /** Preprocessor defines */
  defines: Record<string, string | number | boolean>;
}

/**
 * Shader module descriptor
 *
 * Extended descriptor that includes additional metadata.
 */
export interface ShaderDescriptor extends ShaderModuleDescriptor {
  /** Shader language (WGSL or GLSL) */
  language: ShaderLanguage;
  /** Shader stage */
  stage: ShaderStage;
  /** Entry point function name */
  entryPoint?: string;
  /** Preprocessor defines */
  defines?: Record<string, string | number | boolean>;
  /** Associated file path (for hot-reloading) */
  filePath?: string;
}

/**
 * Shader library entry
 *
 * Represents a shader in the library cache.
 */
interface ShaderLibraryEntry {
  /** Shader descriptor */
  descriptor: ShaderDescriptor;
  /** Compiled shader */
  shader: GraphicsShader;
  /** Compilation result */
  result: ShaderCompilationResult;
  /** Reference count */
  refCount: number;
  /** Last modified timestamp */
  lastModified: number;
}

/**
 * Shader Manager Configuration
 */
export interface ShaderManagerConfig {
  /** Enable hot-reloading in development mode */
  enableHotReload?: boolean;
  /** Hot-reload poll interval in milliseconds */
  hotReloadInterval?: number;
  /** Enable shader caching */
  enableCaching?: boolean;
  /** Maximum cache size (number of shaders) */
  maxCacheSize?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Shader Manager
 *
 * Manages shader loading, compilation, caching, and hot-reloading.
 *
 * @example
 * ```typescript
 * const manager = new ShaderManager(device, {
 *   enableHotReload: true,
 *   verbose: true,
 * });
 *
 * // Load and compile a shader
 * const result = await manager.loadShader({
 *   label: 'BasicShader',
 *   language: ShaderLanguage.WGSL,
 *   stage: ShaderStage.Vertex,
 *   code: wgslCode,
 * });
 *
 * // Get a shader variant
 * const variant = await manager.getShaderVariant('BasicShader', {
 *   USE_SKINNING: true,
 *   MAX_BONES: 128,
 * });
 * ```
 */
export class ShaderManager {
  private device: GraphicsDevice;
  private config: Required<ShaderManagerConfig>;
  private shaderLibrary: Map<string, ShaderLibraryEntry> = new Map();
  private hotReloadIntervalId: number | null = null;
  private fileWatcherMap: Map<string, FileSystemFileHandle> = new Map();

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a shader manager
   *
   * @param device - Graphics device
   * @param config - Configuration options
   */
  constructor(device: GraphicsDevice, config: ShaderManagerConfig = {}) {
    this.device = device;

    // Apply defaults
    this.config = {
      enableHotReload: config.enableHotReload ?? false,
      hotReloadInterval: config.hotReloadInterval ?? 1000,
      enableCaching: config.enableCaching ?? true,
      maxCacheSize: config.maxCacheSize ?? 100,
      verbose: config.verbose ?? false,
    };

    // Setup hot-reloading if enabled
    if (this.config.enableHotReload) {
      this.setupHotReload();
    }

    this.log('[ShaderManager] Created with config:', this.config);
  }

  // ==========================================================================
  // Shader Loading
  // ==========================================================================

  /**
   * Load and compile a shader
   *
   * @param descriptor - Shader descriptor
   * @returns Promise resolving to compilation result
   */
  async loadShader(descriptor: ShaderDescriptor): Promise<ShaderCompilationResult> {
    const startTime = performance.now();

    this.log(`[ShaderManager] Loading shader: ${descriptor.label || 'unnamed'}`);

    // Check cache first
    if (this.config.enableCaching && descriptor.label) {
      const cached = this.shaderLibrary.get(descriptor.label);
      if (cached && cached.lastModified > 0) {
        // Check if file has been modified
        const currentModified = descriptor.filePath
          ? await this.getFileModifiedTime(descriptor.filePath)
          : cached.lastModified;

        if (currentModified <= cached.lastModified) {
          this.log(`[ShaderManager] Using cached shader: ${descriptor.label}`);
          return cached.result;
        }
      }
    }

    // Process shader source (apply defines)
    const processedSource = this.processShaderSource(
      descriptor.code,
      descriptor.defines || {}
    );

    // Create shader module
    const moduleDescriptor: ShaderModuleDescriptor = {
      label: descriptor.label,
      code: processedSource,
    };

    let shader: GraphicsShader | null = null;
    let error: string | null = null;
    let warnings: string[] = [];

    try {
      shader = this.device.createShaderModule(moduleDescriptor);

      // Get compilation info
      const compilationInfo = await shader.getCompilationInfo();
      warnings = compilationInfo.messages
        .filter((m) => m.type === 'warning')
        .map((m) => m.message);

      const errors = compilationInfo.messages.filter((m) => m.type === 'error');
      if (errors.length > 0) {
        error = errors.map((e) => e.message).join('\n');
        shader = null;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      shader = null;
    }

    const compilationTime = performance.now() - startTime;
    const result: ShaderCompilationResult = {
      status: shader ? ShaderCompilationStatus.Success : ShaderCompilationStatus.Error,
      shader,
      error,
      warnings,
      compilationTime,
    };

    // Cache the shader if successful
    if (shader && this.config.enableCaching && descriptor.label) {
      this.cacheShader(descriptor, shader, result);
    }

    // Log result
    if (result.status === ShaderCompilationStatus.Success) {
      this.log(
        `[ShaderManager] Shader compiled successfully in ${compilationTime.toFixed(2)}ms: ${descriptor.label}`
      );
      if (warnings.length > 0) {
        this.log(`[ShaderManager] Warnings:\n${warnings.join('\n')}`);
      }
    } else {
      console.error(`[ShaderManager] Shader compilation failed: ${descriptor.label}`);
      console.error(result.error);
    }

    return result;
  }

  /**
   * Load a shader from a file
   *
   * @param filePath - Path to the shader file
   * @param label - Shader label (defaults to file name)
   * @returns Promise resolving to compilation result
   */
  async loadShaderFromFile(
    filePath: string,
    label?: string
  ): Promise<ShaderCompilationResult> {
    const shaderLabel = label || filePath.split('/').pop() || 'unnamed';
    const language = this.detectShaderLanguage(filePath);
    const stage = this.detectShaderStage(filePath);

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch shader file: ${response.statusText}`);
      }

      const code = await response.text();

      const descriptor: ShaderDescriptor = {
        label: shaderLabel,
        language,
        stage,
        code,
        filePath,
      };

      return await this.loadShader(descriptor);
    } catch (e) {
      return {
        status: ShaderCompilationStatus.Error,
        shader: null,
        error: e instanceof Error ? e.message : String(e),
        warnings: [],
        compilationTime: 0,
      };
    }
  }

  // ==========================================================================
  // Shader Variants
  // ==========================================================================

  /**
   * Get or create a shader variant
   *
   * Creates a variant of a base shader with different preprocessor defines.
   *
   * @param baseLabel - Label of the base shader
   * @param defines - Preprocessor defines for the variant
   * @param variantLabel - Label for the variant (optional)
   * @returns Promise resolving to compilation result
   */
  async getShaderVariant(
    baseLabel: string,
    defines: Record<string, string | number | boolean>,
    variantLabel?: string
  ): Promise<ShaderCompilationResult> {
    const baseEntry = this.shaderLibrary.get(baseLabel);
    if (!baseEntry) {
      return {
        status: ShaderCompilationStatus.Error,
        shader: null,
        error: `Base shader not found: ${baseLabel}`,
        warnings: [],
        compilationTime: 0,
      };
    }

    // Generate variant label
    const label = variantLabel || this.generateVariantLabel(baseLabel, defines);

    // Check if variant already exists
    const cached = this.shaderLibrary.get(label);
    if (cached) {
      return cached.result;
    }

    // Create variant descriptor
    const descriptor: ShaderDescriptor = {
      ...baseEntry.descriptor,
      label,
      defines: { ...baseEntry.descriptor.defines, ...defines },
    };

    return await this.loadShader(descriptor);
  }

  /**
   * Get all shader variants
   *
   * @returns Map of variant labels to compilation results
   */
  getVariants(): Map<string, ShaderCompilationResult> {
    const variants = new Map<string, ShaderCompilationResult>();
    for (const [label, entry] of this.shaderLibrary) {
      variants.set(label, entry.result);
    }
    return variants;
  }

  // ==========================================================================
  // Shader Management
  // ==========================================================================

  /**
   * Get a shader from the library
   *
   * @param label - Shader label
   * @returns Shader or null if not found
   */
  getShader(label: string): GraphicsShader | null {
    const entry = this.shaderLibrary.get(label);
    return entry?.shader || null;
  }

  /**
   * Remove a shader from the library
   *
   * @param label - Shader label
   * @returns True if shader was removed
   */
  removeShader(label: string): boolean {
    const entry = this.shaderLibrary.get(label);
    if (entry) {
      entry.shader.destroy?.();
      this.shaderLibrary.delete(label);
      this.log(`[ShaderManager] Removed shader: ${label}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all shaders from the library
   */
  clear(): void {
    for (const [label, entry] of this.shaderLibrary) {
      entry.shader.destroy?.();
    }
    this.shaderLibrary.clear();
    this.log('[ShaderManager] Cleared all shaders');
  }

  /**
   * Get library statistics
   *
   * @returns Library statistics
   */
  getStats(): {
    totalShaders: number;
    totalSize: number;
    cacheHitRate: number;
  } {
    let totalSize = 0;
    for (const entry of this.shaderLibrary.values()) {
      // Estimate size based on code length
      totalSize += entry.descriptor.code.length * 2; // 2 bytes per character
    }

    return {
      totalShaders: this.shaderLibrary.size,
      totalSize,
      cacheHitRate: 0, // TODO: Implement cache hit tracking
    };
  }

  // ==========================================================================
  // Hot Reload
  // ==========================================================================

  /**
   * Setup hot-reloading
   */
  private setupHotReload(): void {
    if (typeof window === 'undefined') {
      return; // Not in browser
    }

    this.hotReloadIntervalId = window.setInterval(async () => {
      await this.checkForUpdates();
    }, this.config.hotReloadInterval);

    this.log('[ShaderManager] Hot-reload enabled');
  }

  /**
   * Check for shader file updates
   */
  private async checkForUpdates(): Promise<void> {
    for (const [label, entry] of this.shaderLibrary) {
      if (entry.descriptor.filePath) {
        const modifiedTime = await this.getFileModifiedTime(entry.descriptor.filePath);
        if (modifiedTime > entry.lastModified) {
          this.log(`[ShaderManager] Reloading shader: ${label}`);
          await this.reloadShader(label);
        }
      }
    }
  }

  /**
   * Reload a shader
   *
   * @param label - Shader label
   */
  async reloadShader(label: string): Promise<boolean> {
    const entry = this.shaderLibrary.get(label);
    if (!entry || !entry.descriptor.filePath) {
      return false;
    }

    const result = await this.loadShaderFromFile(entry.descriptor.filePath, label);
    return result.status === ShaderCompilationStatus.Success;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Process shader source with defines
   *
   * @param source - Shader source code
   * @param defines - Preprocessor defines
   * @returns Processed source code
   */
  private processShaderSource(
    source: string,
    defines: Record<string, string | number | boolean>
  ): string {
    if (Object.keys(defines).length === 0) {
      return source;
    }

    // Generate #define directives
    const defineLines = Object.entries(defines).map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? `#define ${key}` : `// #define ${key} (disabled)`;
      } else {
        return `#define ${key} ${value}`;
      }
    });

    // Insert defines at the beginning of the shader
    return defineLines.join('\n') + '\n' + source;
  }

  /**
   * Detect shader language from file extension
   *
   * @param filePath - File path
   * @returns Detected language
   */
  private detectShaderLanguage(filePath: string): ShaderLanguage {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'wgsl':
        return ShaderLanguage.WGSL;
      case 'vert':
      case 'frag':
      case 'glsl':
        return ShaderLanguage.GLSL;
      default:
        // Default to WGSL for WebGPU
        return this.device.api === 'webgpu' ? ShaderLanguage.WGSL : ShaderLanguage.GLSL;
    }
  }

  /**
   * Detect shader stage from file name
   *
   * @param filePath - File path
   * @returns Detected stage
   */
  private detectShaderStage(filePath: string): ShaderStage {
    const name = filePath.toLowerCase();
    if (name.includes('.vert.') || name.endsWith('.vert')) {
      return ShaderStage.Vertex;
    } else if (name.includes('.frag.') || name.endsWith('.frag')) {
      return ShaderStage.Fragment;
    } else if (name.includes('.comp.') || name.endsWith('.comp')) {
      return ShaderStage.Compute;
    }
    // Default to vertex shader
    return ShaderStage.Vertex;
  }

  /**
   * Generate a variant label
   *
   * @param baseLabel - Base shader label
   * @param defines - Preprocessor defines
   * @returns Variant label
   */
  private generateVariantLabel(
    baseLabel: string,
    defines: Record<string, string | number | boolean>
  ): string {
    const parts = Object.entries(defines)
      .filter(([_, value]) => value !== false)
      .map(([key, value]) => `${key}=${value}`);
    return parts.length > 0 ? `${baseLabel}_${parts.join('_')}` : baseLabel;
  }

  /**
   * Get file modification time
   *
   * @param filePath - File path
   * @returns Modification timestamp
   */
  private async getFileModifiedTime(filePath: string): Promise<number> {
    try {
      const response = await fetch(filePath, { method: 'HEAD' });
      const lastModified = response.headers.get('Last-Modified');
      if (lastModified) {
        return new Date(lastModified).getTime();
      }
    } catch (e) {
      // Ignore errors
    }
    return 0;
  }

  /**
   * Cache a shader
   *
   * @param descriptor - Shader descriptor
   * @param shader - Compiled shader
   * @param result - Compilation result
   */
  private cacheShader(
    descriptor: ShaderDescriptor,
    shader: GraphicsShader,
    result: ShaderCompilationResult
  ): void {
    // Check cache size limit
    if (this.shaderLibrary.size >= this.config.maxCacheSize) {
      // Remove least recently used shader (simple FIFO for now)
      const firstKey = this.shaderLibrary.keys().next().value;
      if (firstKey) {
        this.removeShader(firstKey);
      }
    }

    this.shaderLibrary.set(descriptor.label || 'unnamed', {
      descriptor,
      shader,
      result,
      refCount: 1,
      lastModified: descriptor.filePath
        ? Date.now()
        : 0,
    });
  }

  /**
   * Log message if verbose mode is enabled
   *
   * @param message - Message to log
   */
  private log(...message: any[]): void {
    if (this.config.verbose) {
      console.log(...message);
    }
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Destroy the shader manager
   *
   * Releases all resources and stops hot-reloading.
   */
  destroy(): void {
    // Stop hot-reloading
    if (this.hotReloadIntervalId !== null) {
      clearInterval(this.hotReloadIntervalId);
      this.hotReloadIntervalId = null;
    }

    // Clear all shaders
    this.clear();

    this.log('[ShaderManager] Destroyed');
  }
}

// Re-export types
export { ShaderLanguage, ShaderStage, ShaderCompilationStatus };
export type {
  ShaderCompilationResult,
  ShaderVariant,
  ShaderDescriptor,
  ShaderManagerConfig,
};
