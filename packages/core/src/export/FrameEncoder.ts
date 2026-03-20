/**
 * Frame Encoder - Encodes individual frames for export
 *
 * Handles encoding of frames to various image formats.
 *
 * @module export/FrameEncoder
 */

import type { RenderObject, BoundingBox } from '../types';
import type { ExportConfig } from './Exporter';

/**
 * Frame encoding options
 */
export interface FrameEncoderOptions {
  /** Image format */
  format?: 'png' | 'jpeg' | 'webp';
  /** Quality [0-1] for lossy formats */
  quality?: number;
  /** Output dimensions */
  width?: number;
  height?: number;
  /** Background color */
  backgroundColor?: string;
  /** Whether to use transparency */
  transparent?: boolean;
}

/**
 * Encoded frame result
 */
export interface EncodedFrame {
  /** The encoded image data */
  data: Blob | ArrayBuffer;
  /** Frame timestamp in seconds */
  timestamp: number;
  /** Frame number */
  frameNumber: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Abstract frame encoder
 *
 * Encodes renderable objects to image data.
 */
export abstract class FrameEncoder {
  protected options: FrameEncoderOptions;

  constructor(options: FrameEncoderOptions = {}) {
    this.options = {
      format: 'png',
      quality: 0.9,
      transparent: true,
      ...options
    };
  }

  /**
   * Encode a frame
   *
   * @param objects - Objects to render in the frame
   * @param timestamp - Frame timestamp
   * @param frameNumber - Frame sequence number
   * @returns Encoded frame data
   */
  abstract encodeFrame(
    objects: ReadonlyArray<RenderObject>,
    timestamp: number,
    frameNumber: number
  ): Promise<EncodedFrame>;

  /**
   * Get the encoder's image format
   */
  getFormat(): string {
    return this.options.format ?? 'png';
  }

  /**
   * Get MIME type for the format
   */
  getMimeType(): string {
    const format = this.getFormat();
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp'
    };
    return mimeTypes[format] ?? 'image/png';
  }

  /**
   * Calculate output dimensions
   */
  protected calculateDimensions(objects: ReadonlyArray<RenderObject>): { width: number; height: number } {
    if (objects.length === 0) {
      return { width: this.options.width ?? 1920, height: this.options.height ?? 1080 };
    }

    // Calculate bounding box of all objects
    const boundingBox = this.calculateBoundingBox(objects);

    return {
      width: this.options.width ?? Math.ceil(boundingBox.max.x - boundingBox.min.x),
      height: this.options.height ?? Math.ceil(boundingBox.max.y - boundingBox.min.y)
    };
  }

  /**
   * Calculate bounding box of objects
   */
  protected calculateBoundingBox(objects: ReadonlyArray<RenderObject>): BoundingBox {
    if (objects.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        center: { x: 0, y: 0, z: 0 }
      };
    }

    const boxes = objects.map(obj => obj.getBoundingBox());

    return {
      min: {
        x: Math.min(...boxes.map(b => b.min.x)),
        y: Math.min(...boxes.map(b => b.min.y)),
        z: Math.min(...boxes.map(b => b.min.z))
      },
      max: {
        x: Math.max(...boxes.map(b => b.max.x)),
        y: Math.max(...boxes.map(b => b.max.y)),
        z: Math.max(...boxes.map(b => b.max.z))
      },
      center: {
        x: 0,
        y: 0,
        z: 0
      }
    };
  }
}

/**
 * Canvas-based frame encoder for browser environments
 *
 * Uses HTML5 Canvas API to render frames.
 */
export class CanvasFrameEncoder extends FrameEncoder {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  /**
   * Initialize the canvas
   */
  private ensureCanvas(width: number, height: number): void {
    if (!this.canvas || this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext('2d');
    }
  }

  /**
   * Encode a frame using Canvas API
   */
  async encodeFrame(
    objects: ReadonlyArray<RenderObject>,
    timestamp: number,
    frameNumber: number
  ): Promise<EncodedFrame> {
    const { width, height } = this.calculateDimensions(objects);

    this.ensureCanvas(width, height);

    if (!this.ctx) {
      throw new Error('Failed to create canvas context');
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Fill background
    if (this.options.backgroundColor && !this.options.transparent) {
      this.ctx.fillStyle = this.options.backgroundColor;
      this.ctx.fillRect(0, 0, width, height);
    }

    // Render objects (placeholder - actual implementation would delegate to renderer)
    // This is a simplified implementation
    for (const obj of objects) {
      if (obj.visible) {
        this.renderObject(this.ctx, obj, width, height);
      }
    }

    // Encode to blob
    const mimeType = this.getMimeType();
    const quality = this.options.quality ?? 0.9;

    const data = await new Promise<Blob>((resolve, reject) => {
      this.canvas!.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to encode frame')),
        mimeType,
        quality
      );
    });

    return {
      data,
      timestamp,
      frameNumber,
      width,
      height
    };
  }

  /**
   * Render a single object (placeholder implementation)
   * Actual implementation would use the renderer subsystem
   */
  private renderObject(
    ctx: CanvasRenderingContext2D,
    obj: RenderObject,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    // This is a placeholder - actual rendering would be done by
    // the renderer subsystem
    const { position, opacity } = obj.getState().transform;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(position.x + canvasWidth / 2, position.y + canvasHeight / 2);

    // Draw a simple placeholder
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.canvas) {
      this.canvas = null;
      this.ctx = null;
    }
  }
}

/**
 * Default export
 */
export default FrameEncoder;
