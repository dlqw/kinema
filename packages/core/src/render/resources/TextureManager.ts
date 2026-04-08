/**
 * Kinema Rendering Engine - Texture Manager
 *
 * This module manages GPU texture resources including:
 * - 2D textures (color, normal, roughness, etc.)
 * - Cube textures (environment maps, skyboxes)
 * - Render targets (framebuffer attachments)
 * - Texture samplers
 *
 * Features:
 * - Type-safe texture handles
 * - Automatic texture compression detection
 * - Mipmap generation
 * - Texture caching and pooling
 *
 * @module resources
 */

import type { GraphicsDevice, GraphicsTexture, GraphicsSampler } from '../graphics/GraphicsDevice';
import type {
  TextureDescriptor,
  SamplerDescriptor,
  TextureFormat,
  TextureDimension,
} from '../core/types';
import { ResourceCache, ResourceType } from './ResourceCache';

/**
 * Texture usage flags
 */
export const TextureUsageFlags = {
  NONE: 0,
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
  RENDER_ATTACHMENT: 16,
} as const;

/**
 * Texture handle
 *
 * Type-safe handle to a GPU texture resource.
 */
export interface TextureHandle {
  /** Unique texture identifier */
  id: string;
  /** Texture width */
  width: number;
  /** Texture height */
  height: number;
  /** Texture depth or array layers */
  depthOrArrayLayers: number;
  /** Number of mip levels */
  mipLevelCount: number;
  /** Texture format */
  format: TextureFormat;
  /** Texture dimension */
  dimension: TextureDimension;
  /** Texture usage flags */
  usage: number;
  /** Whether texture has a sampler */
  hasSampler: boolean;
  /** Reference to the actual texture resource */
  texture: GraphicsTexture;
}

/**
 * Sampler handle
 */
export interface SamplerHandle {
  /** Unique sampler identifier */
  id: string;
  /** Reference to the actual sampler resource */
  sampler: GraphicsSampler;
}

/**
 * Texture creation options
 */
export interface TextureOptions {
  /** Texture label for debugging */
  label?: string;
  /** Initial data to upload */
  data?: ArrayBufferView | ImageBitmap | HTMLCanvasElement | HTMLImageElement;
  /** Mipmap level count (0 = generate all) */
  mipLevelCount?: number;
  /** Make texture persistent in cache */
  persistent?: boolean;
}

/**
 * 2D texture descriptor
 */
export interface Texture2DDescriptor extends TextureOptions {
  /** Texture width */
  width: number;
  /** Texture height */
  height: number;
  /** Texture format */
  format?: TextureFormat;
  /** Enable automatic mipmap generation */
  generateMipmaps?: boolean;
}

/**
 * Cube texture descriptor
 */
export interface TextureCubeDescriptor extends TextureOptions {
  /** Cube face size */
  size: number;
  /** Texture format */
  format?: TextureFormat;
  /** Data for each face (+X, -X, +Y, -Y, +Z, -Z) */
  faces?: (ArrayBufferView | ImageBitmap | HTMLCanvasElement | HTMLImageElement)[];
}

/**
 * Render target descriptor
 */
export interface RenderTargetDescriptor {
  /** Render target width */
  width: number;
  /** Render target height */
  height: number;
  /** Texture label for debugging */
  label?: string;
  /** Texture format */
  format?: TextureFormat;
  /** Sample count for MSAA */
  sampleCount?: number;
  /** Create depth buffer */
  depth?: boolean;
  /** Depth buffer format */
  depthFormat?: 'depth24plus' | 'depth32float';
}

/**
 * Texture manager configuration
 */
export interface TextureManagerConfig {
  /** Maximum texture cache size in bytes */
  maxCacheSize?: number;
  /** Enable automatic mipmap generation */
  autoGenerateMipmaps?: boolean;
  /** Enable texture compression */
  enableCompression?: boolean;
  /** Default sampler settings */
  defaultSampler?: SamplerDescriptor;
  /** Enable memory tracking */
  enableMemoryTracking?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Texture manager statistics
 */
export interface TextureManagerStats {
  /** Total number of textures */
  totalTextures: number;
  /** Total memory used in bytes */
  totalMemoryUsed: number;
  /** Number of 2D textures */
  texture2DCount: number;
  /** Number of cube textures */
  textureCubeCount: number;
  /** Number of render targets */
  renderTargetCount: number;
  /** Cache statistics */
  cache: {
    totalTextures: number;
    totalMemory: number;
    hitRate: number;
  };
}

/**
 * Texture Manager
 *
 * Manages creation, caching, and lifecycle of GPU textures.
 *
 * @example
 * ```typescript
 * const manager = new TextureManager(device);
 *
 * // Create 2D texture from image
 * const texture = await manager.createTexture2D({
 *   width: 512,
 *   height: 512,
 *   data: imageBitmap,
 *   generateMipmaps: true,
 * });
 *
 * // Create sampler
 * const sampler = manager.createSampler({
 *   addressModeU: 'repeat',
 *   addressModeV: 'repeat',
 *   magFilter: 'linear',
 *   minFilter: 'linear',
 * });
 * ```
 */
export class TextureManager {
  private device: GraphicsDevice;
  private config: Required<TextureManagerConfig>;
  private textureCache: ResourceCache<GraphicsTexture>;
  private samplerCache: ResourceCache<GraphicsSampler>;
  private textureIdCounter = 0;
  private samplerIdCounter = 0;
  private textures: Map<string, TextureHandle> = new Map();
  private samplers: Map<string, SamplerHandle> = new Map();

  // Default sampler
  private defaultSampler: GraphicsSampler;

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Create a texture manager
   *
   * @param device - Graphics device
   * @param config - Configuration options
   */
  constructor(device: GraphicsDevice, config: TextureManagerConfig = {}) {
    this.device = device;

    this.config = {
      maxCacheSize: config.maxCacheSize ?? 512 * 1024 * 1024, // 512MB
      autoGenerateMipmaps: config.autoGenerateMipmaps ?? true,
      enableCompression: config.enableCompression ?? true,
      defaultSampler: config.defaultSampler ?? this.getDefaultSamplerDescriptor(),
      enableMemoryTracking: config.enableMemoryTracking ?? true,
      verbose: config.verbose ?? false,
    };

    // Create texture cache
    this.textureCache = new ResourceCache<GraphicsTexture>({
      maxSize: this.config.maxCacheSize,
      maxItems: 500,
      evictionPolicy: 'lru' as any,
      autoGC: true,
      enableMemoryTracking: this.config.enableMemoryTracking,
      verbose: this.config.verbose,
    });

    // Create sampler cache
    this.samplerCache = new ResourceCache<GraphicsSampler>({
      maxSize: 10 * 1024 * 1024, // 10MB (samplers are small)
      maxItems: 100,
      evictionPolicy: 'lru' as any,
      autoGC: true,
      enableMemoryTracking: false,
      verbose: this.config.verbose,
    });

    // Create default sampler
    this.defaultSampler = this.device.createSampler(this.config.defaultSampler);

    this.log('[TextureManager] Created with config:', this.config);
  }

  // ==========================================================================
  // Texture Creation
  // ==========================================================================

  /**
   * Create a 2D texture
   *
   * @param descriptor - Texture descriptor
   * @returns Promise resolving to texture handle
   */
  async createTexture2D(descriptor: Texture2DDescriptor): Promise<TextureHandle> {
    const textureId = `texture2d_${this.textureIdCounter++}`;

    // Calculate mip levels
    const mipLevelCount =
      descriptor.mipLevelCount ??
      (descriptor.generateMipmaps
        ? this.calculateMipLevels(descriptor.width, descriptor.height)
        : 1);

    // Create texture descriptor
    const textureDescriptor: TextureDescriptor = {
      label: descriptor.label || textureId,
      size: [descriptor.width, descriptor.height],
      dimension: '2d',
      format: descriptor.format || 'bgra8unorm',
      mipLevelCount,
      usage:
        TextureUsageFlags.TEXTURE_BINDING |
        TextureUsageFlags.COPY_DST |
        TextureUsageFlags.RENDER_ATTACHMENT,
    };

    // Create texture
    const texture = this.device.createTexture(textureDescriptor);

    // Upload data if provided
    if (descriptor.data) {
      await this.uploadTextureData(texture, descriptor);
    }

    // Create handle
    const handle: TextureHandle = {
      id: textureId,
      width: descriptor.width,
      height: descriptor.height,
      depthOrArrayLayers: 1,
      mipLevelCount,
      format: textureDescriptor.format,
      dimension: textureDescriptor.dimension,
      usage: textureDescriptor.usage,
      hasSampler: false,
      texture,
    };

    // Generate mipmaps if requested
    if (descriptor.generateMipmaps && this.config.autoGenerateMipmaps) {
      this.generateMipmaps(handle);
    }

    // Store handle
    this.textures.set(textureId, handle);

    // Add to cache if persistent
    if (descriptor.persistent) {
      this.textureCache.set(
        textureId,
        texture,
        ResourceType.Texture,
        this.calculateTextureSize(
          descriptor.width,
          descriptor.height,
          textureDescriptor.format,
          mipLevelCount,
        ),
        true,
      );
    }

    this.log(
      `[TextureManager] Created 2D texture: ${textureId} (${descriptor.width}x${descriptor.height})`,
    );

    return handle;
  }

  /**
   * Create a cube texture
   *
   * @param descriptor - Cube texture descriptor
   * @returns Promise resolving to texture handle
   */
  async createTextureCube(descriptor: TextureCubeDescriptor): Promise<TextureHandle> {
    const textureId = `texturecube_${this.textureIdCounter++}`;

    // Calculate mip levels
    const mipLevelCount = this.calculateMipLevels(descriptor.size, descriptor.size);

    // Create texture descriptor
    const textureDescriptor: TextureDescriptor = {
      label: descriptor.label || textureId,
      size: [descriptor.size, descriptor.size, 6],
      dimension: 'cube',
      format: descriptor.format || 'bgra8unorm',
      mipLevelCount,
      usage:
        TextureUsageFlags.TEXTURE_BINDING |
        TextureUsageFlags.COPY_DST |
        TextureUsageFlags.RENDER_ATTACHMENT,
    };

    // Create texture
    const texture = this.device.createTexture(textureDescriptor);

    // Upload face data if provided
    if (descriptor.faces && descriptor.faces.length === 6) {
      await this.uploadCubeTextureData(texture, descriptor);
    }

    // Create handle
    const handle: TextureHandle = {
      id: textureId,
      width: descriptor.size,
      height: descriptor.size,
      depthOrArrayLayers: 6,
      mipLevelCount,
      format: textureDescriptor.format,
      dimension: textureDescriptor.dimension,
      usage: textureDescriptor.usage,
      hasSampler: false,
      texture,
    };

    // Store handle
    this.textures.set(textureId, handle);

    this.log(
      `[TextureManager] Created cube texture: ${textureId} (${descriptor.size}x${descriptor.size})`,
    );

    return handle;
  }

  /**
   * Create a render target
   *
   * @param descriptor - Render target descriptor
   * @returns Texture handle for the render target
   */
  createRenderTarget(descriptor: RenderTargetDescriptor): TextureHandle {
    const textureId = `rendertarget_${this.textureIdCounter++}`;

    // Create color texture
    const textureDescriptor: TextureDescriptor = {
      label: `${descriptor.label || textureId}_color`,
      size: [descriptor.width, descriptor.height],
      dimension: '2d',
      format: descriptor.format || 'bgra8unorm',
      mipLevelCount: 1,
      sampleCount: descriptor.sampleCount ?? 1,
      usage:
        TextureUsageFlags.RENDER_ATTACHMENT |
        TextureUsageFlags.TEXTURE_BINDING |
        TextureUsageFlags.COPY_SRC,
    };

    const texture = this.device.createTexture(textureDescriptor);

    // Create handle
    const handle: TextureHandle = {
      id: textureId,
      width: descriptor.width,
      height: descriptor.height,
      depthOrArrayLayers: 1,
      mipLevelCount: 1,
      format: textureDescriptor.format,
      dimension: textureDescriptor.dimension,
      usage: textureDescriptor.usage,
      hasSampler: false,
      texture,
    };

    // Store handle
    this.textures.set(textureId, handle);

    this.log(
      `[TextureManager] Created render target: ${textureId} (${descriptor.width}x${descriptor.height})`,
    );

    return handle;
  }

  // ==========================================================================
  // Sampler Creation
  // ==========================================================================

  /**
   * Create a texture sampler
   *
   * @param descriptor - Sampler descriptor
   * @returns Sampler handle
   */
  createSampler(descriptor: Partial<SamplerDescriptor> = {}): SamplerHandle {
    const samplerId = `sampler_${this.samplerIdCounter++}`;

    // Merge with defaults
    const fullDescriptor: SamplerDescriptor = {
      label: descriptor.label || samplerId,
      addressModeU: descriptor.addressModeU || 'clamp-to-edge',
      addressModeV: descriptor.addressModeV || 'clamp-to-edge',
      addressModeW: descriptor.addressModeW || 'clamp-to-edge',
      magFilter: descriptor.magFilter || 'linear',
      minFilter: descriptor.minFilter || 'linear',
      mipmapFilter: descriptor.mipmapFilter || 'linear',
      ...(descriptor.lodMinClamp !== undefined && { lodMinClamp: descriptor.lodMinClamp }),
      ...(descriptor.lodMaxClamp !== undefined && { lodMaxClamp: descriptor.lodMaxClamp }),
      ...(descriptor.maxAnisotropy !== undefined && { maxAnisotropy: descriptor.maxAnisotropy }),
      ...(descriptor.compare !== undefined && { compare: descriptor.compare }),
    };

    // Create sampler
    const sampler = this.device.createSampler(fullDescriptor);

    // Create handle
    const handle: SamplerHandle = {
      id: samplerId,
      sampler,
    };

    // Store handle
    this.samplers.set(samplerId, handle);

    // Add to cache
    const samplerSize = 32; // Approximate sampler size
    this.samplerCache.set(samplerId, sampler, ResourceType.Sampler, samplerSize, false);

    this.log(`[TextureManager] Created sampler: ${samplerId}`);

    return handle;
  }

  /**
   * Get the default sampler
   *
   * @returns Default sampler handle
   */
  getDefaultSampler(): SamplerHandle {
    return {
      id: 'default',
      sampler: this.defaultSampler,
    };
  }

  // ==========================================================================
  // Texture Operations
  // ==========================================================================

  /**
   * Upload data to a texture
   *
   * @param handle - Texture handle
   * @param data - Data to upload
   * @param mipLevel - Mipmap level
   * @param arrayLayer - Array layer (for texture arrays)
   */
  async uploadTextureData(
    texture: GraphicsTexture,
    descriptor: Texture2DDescriptor,
    mipLevel: number = 0,
    arrayLayer: number = 0,
  ): Promise<void> {
    if (!descriptor.data) {
      return;
    }

    // Get image data
    let imageData: ImageBitmap | HTMLCanvasElement | HTMLImageElement;

    if (ArrayBuffer.isView(descriptor.data)) {
      // Raw data - need to convert to ImageBitmap or upload directly
      // This depends on the graphics device implementation
      return;
    } else {
      imageData = descriptor.data as ImageBitmap | HTMLCanvasElement | HTMLImageElement;
    }

    // Upload using device queue
    const imageBitmap =
      imageData instanceof ImageBitmap ? imageData : await createImageBitmap(imageData);

    this.device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      {
        texture,
        mipLevel,
        origin: [0, 0, arrayLayer],
      },
      [descriptor.width, descriptor.height],
    );
  }

  /**
   * Upload cube texture face data
   *
   * @param texture - Cube texture
   * @param descriptor - Cube texture descriptor
   */
  async uploadCubeTextureData(
    texture: GraphicsTexture,
    descriptor: TextureCubeDescriptor,
  ): Promise<void> {
    if (!descriptor.faces || descriptor.faces.length !== 6) {
      return;
    }

    const size = descriptor.size;

    for (let face = 0; face < 6; face++) {
      const faceData = descriptor.faces[face];
      if (!faceData) {
        continue;
      }

      // Convert to ImageBitmap if needed
      let imageBitmap: ImageBitmap;

      if (faceData instanceof ImageBitmap) {
        imageBitmap = faceData;
      } else if (faceData instanceof HTMLCanvasElement || faceData instanceof HTMLImageElement) {
        imageBitmap = await createImageBitmap(faceData);
      } else {
        continue; // Skip raw data for now
      }

      // Upload face data
      this.device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        {
          texture,
          mipLevel: 0,
          origin: [0, 0, face],
        },
        [size, size],
      );
    }
  }

  /**
   * Generate mipmaps for a texture
   *
   * @param handle - Texture handle
   */
  generateMipmaps(handle: TextureHandle): void {
    // TODO: Implement mipmap generation
    // This may require a compute shader or render pass
    this.log(`[TextureManager] Generating mipmaps for: ${handle.id}`);
  }

  // ==========================================================================
  // Texture Lifecycle
  // ==========================================================================

  /**
   * Get a texture handle by ID
   *
   * @param id - Texture ID
   * @returns Texture handle or undefined
   */
  getTexture(id: string): TextureHandle | undefined {
    return this.textures.get(id);
  }

  /**
   * Get a sampler handle by ID
   *
   * @param id - Sampler ID
   * @returns Sampler handle or undefined
   */
  getSampler(id: string): SamplerHandle | undefined {
    return this.samplers.get(id);
  }

  /**
   * Destroy a texture
   *
   * @param handle - Texture handle
   */
  destroyTexture(handle: TextureHandle): void {
    const { id, texture } = handle;

    // Remove from active textures
    this.textures.delete(id);

    // Remove from cache
    this.textureCache.remove(id);

    // Destroy texture
    texture.destroy();

    this.log(`[TextureManager] Destroyed texture: ${id}`);
  }

  /**
   * Destroy a sampler
   *
   * @param handle - Sampler handle
   */
  destroySampler(handle: SamplerHandle): void {
    const { id, sampler } = handle;

    // Remove from active samplers
    this.samplers.delete(id);

    // Remove from cache
    this.samplerCache.remove(id);

    // Destroy sampler
    sampler.destroy();

    this.log(`[TextureManager] Destroyed sampler: ${id}`);
  }

  /**
   * Destroy all textures and samplers
   */
  destroyAll(): void {
    for (const [_id, handle] of this.textures) {
      handle.texture.destroy();
    }
    for (const [_id, handle] of this.samplers) {
      handle.sampler.destroy();
    }

    this.textures.clear();
    this.samplers.clear();
    this.textureCache.clear();
    this.samplerCache.clear();

    this.log('[TextureManager] Destroyed all textures and samplers');
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get texture manager statistics
   *
   * @returns Statistics object
   */
  getStats(): TextureManagerStats {
    let texture2DCount = 0;
    let textureCubeCount = 0;
    let renderTargetCount = 0;

    for (const handle of this.textures.values()) {
      if (handle.dimension === '2d') {
        if (handle.usage & TextureUsageFlags.RENDER_ATTACHMENT) {
          renderTargetCount++;
        } else {
          texture2DCount++;
        }
      } else if (handle.dimension === 'cube') {
        textureCubeCount++;
      }
    }

    const textureCacheStats = this.textureCache.getStats();

    return {
      totalTextures: this.textures.size,
      totalMemoryUsed: textureCacheStats.memoryUsed,
      texture2DCount,
      textureCubeCount,
      renderTargetCount,
      cache: {
        totalTextures: textureCacheStats.itemCount,
        totalMemory: textureCacheStats.memoryUsed,
        hitRate: textureCacheStats.hitRate,
      },
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Calculate number of mip levels
   *
   * @param width - Texture width
   * @param height - Texture height
   * @returns Number of mip levels
   */
  private calculateMipLevels(width: number, height: number): number {
    return Math.floor(Math.log2(Math.max(width, height))) + 1;
  }

  /**
   * Calculate texture size in bytes
   *
   * @param width - Texture width
   * @param height - Texture height
   * @param format - Texture format
   * @param mipLevels - Number of mip levels
   * @returns Size in bytes
   */
  private calculateTextureSize(
    width: number,
    height: number,
    format: TextureFormat,
    mipLevels: number,
  ): number {
    // Get bytes per pixel for format
    const bytesPerPixel = this.getBytesPerPixel(format);

    // Calculate size including mip levels
    let totalSize = 0;
    let mipWidth = width;
    let mipHeight = height;

    for (let i = 0; i < mipLevels; i++) {
      totalSize += mipWidth * mipHeight * bytesPerPixel;
      mipWidth = Math.max(1, mipWidth / 2);
      mipHeight = Math.max(1, mipHeight / 2);
    }

    return totalSize;
  }

  /**
   * Get bytes per pixel for a texture format
   *
   * @param format - Texture format
   * @returns Bytes per pixel
   */
  private getBytesPerPixel(format: TextureFormat): number {
    switch (format) {
      case 'rgba8unorm':
      case 'rgba8unorm-srgb':
      case 'bgra8unorm':
      case 'bgra8unorm-srgb':
        return 4;
      case 'rgb9e5ufloat':
      case 'rgb10a2unorm':
        return 4;
      case 'depth24plus':
      case 'depth24plus-stencil8':
        return 4;
      case 'depth32float':
      case 'depth32float-stencil8':
        return 4;
      default:
        return 4;
    }
  }

  /**
   * Get default sampler descriptor
   *
   * @returns Default sampler descriptor
   */
  private getDefaultSamplerDescriptor(): SamplerDescriptor {
    return {
      label: 'default_sampler',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      addressModeW: 'repeat',
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    };
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
   * Destroy the texture manager
   *
   * Releases all textures and samplers.
   */
  destroy(): void {
    this.destroyAll();
    this.textureCache.destroy();
    this.samplerCache.destroy();
    this.defaultSampler.destroy();
    this.log('[TextureManager] Destroyed');
  }
}
