/**
 * TextObject - Text renderable object
 *
 * Represents text that can be rendered in a scene with
 * configurable font properties and color.
 *
 * @module core/TextObject
 */

import type { Point3D, BoundingBox, Transform, RenderObjectState, FontConfig } from '../types';
import { RenderObject } from './RenderObject';

/**
 * TextObject represents renderable text.
 *
 * Text objects have configurable font family, size, weight, and style.
 * They support positioning, rotation, scaling, and opacity like other
 * render objects.
 *
 * @example
 * ```typescript
 * // Create simple text
 * const text = TextObject.create('Hello World', {
 *   family: 'Arial',
 *   size: 24
 * });
 *
 * // Create styled text
 * const styled = TextObject.create('Hello', {
 *   family: 'Arial',
 *   size: 32,
 *   weight: 'bold',
 *   style: 'italic'
 * }, '#ff0000');
 *
 * // Position and style
 * const positioned = styled
 *   .withPosition(100, 100)
 *   .withOpacity(0.8);
 * ```
 */
export class TextObject extends RenderObject {
  /**
   * Creates a new TextObject instance
   *
   * @param state - The render object state
   * @param text - The text content
   * @param font - Font configuration
   * @param color - Text color (CSS color string)
   */
  constructor(
    state: RenderObjectState,
    public readonly text: string,
    public readonly font: FontConfig,
    public readonly color: string,
  ) {
    super(state);
    Object.freeze(font);
  }

  // ==========================================================================
  // Required Abstract Methods Implementation
  // ==========================================================================

  /**
   * Get a copy of the current state
   */
  getState(): RenderObjectState {
    return { ...this.state };
  }

  /**
   * Create a new instance with the specified transform applied
   *
   * @param transform - Partial transform to apply
   * @returns A new TextObject with the updated transform
   */
  withTransform(transform: Partial<Transform>): TextObject {
    return new TextObject(
      {
        ...this.state,
        transform: { ...this.state.transform, ...transform },
      },
      this.text,
      this.font,
      this.color,
    );
  }

  /**
   * Calculate the bounding box of this text object
   *
   * Note: This is an approximation. Actual text measurement
   * depends on the rendering backend.
   *
   * @returns The approximate bounding box
   */
  getBoundingBox(): BoundingBox {
    // Approximate text dimensions
    // In a real implementation, this would use canvas/CSS text measurement
    const estimatedWidth = this.text.length * this.font.size * 0.5;
    const estimatedHeight = this.font.size * 1.2; // Line height

    const { position } = this.state.transform;

    return {
      min: {
        x: position.x - estimatedWidth / 2,
        y: position.y - estimatedHeight / 2,
        z: position.z,
      },
      max: {
        x: position.x + estimatedWidth / 2,
        y: position.y + estimatedHeight / 2,
        z: position.z,
      },
      center: position,
    };
  }

  /**
   * Check if a point is contained within this text object
   *
   * @param point - The point to test
   * @returns True if the point is inside the approximate bounding box
   */
  containsPoint(point: Point3D): boolean {
    const bbox = this.getBoundingBox();
    return (
      point.x >= bbox.min.x &&
      point.x <= bbox.max.x &&
      point.y >= bbox.min.y &&
      point.y <= bbox.max.y
    );
  }

  // ==========================================================================
  // TextObject Specific Methods
  // ==========================================================================

  /**
   * Get the text content length
   */
  get length(): number {
    return this.text.length;
  }

  /**
   * Create a copy with updated text
   *
   * @param newText - New text content
   * @returns A new TextObject with the updated text
   */
  withText(newText: string): TextObject {
    return new TextObject(this.state, newText, this.font, this.color);
  }

  /**
   * Create a copy with updated font configuration
   *
   * @param font - New font configuration
   * @returns A new TextObject with the updated font
   */
  withFont(font: FontConfig): TextObject {
    return new TextObject(this.state, this.text, font, this.color);
  }

  /**
   * Create a copy with updated font size
   *
   * @param size - New font size
   * @returns A new TextObject with the updated font size
   */
  withFontSize(size: number): TextObject {
    return new TextObject(this.state, this.text, { ...this.font, size }, this.color);
  }

  /**
   * Create a copy with updated font family
   *
   * @param family - New font family
   * @returns A new TextObject with the updated font family
   */
  withFontFamily(family: string): TextObject {
    return new TextObject(this.state, this.text, { ...this.font, family }, this.color);
  }

  /**
   * Create a copy with updated font weight
   *
   * @param weight - New font weight
   * @returns A new TextObject with the updated font weight
   */
  withFontWeight(weight: string): TextObject {
    return new TextObject(this.state, this.text, { ...this.font, weight }, this.color);
  }

  /**
   * Create a copy with updated color
   *
   * @param color - New text color (CSS color string)
   * @returns A new TextObject with the updated color
   */
  withColor(color: string): TextObject {
    return new TextObject(this.state, this.text, this.font, color);
  }

  /**
   * Create a bold copy
   *
   * @returns A new TextObject with bold weight
   */
  bold(): TextObject {
    return this.withFontWeight('bold');
  }

  /**
   * Create an italic copy
   *
   * @returns A new TextObject with italic style
   */
  italic(): TextObject {
    return new TextObject(this.state, this.text, { ...this.font, style: 'italic' }, this.color);
  }

  /**
   * Create a copy with combined text (append)
   *
   * @param text - Text to append
   * @returns A new TextObject with combined text
   */
  append(text: string): TextObject {
    return this.withText(this.text + text);
  }

  /**
   * Create a copy with combined text (prepend)
   *
   * @param text - Text to prepend
   * @returns A new TextObject with combined text
   */
  prepend(text: string): TextObject {
    return this.withText(text + this.text);
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create a text object
   *
   * @param text - Text content
   * @param font - Font configuration
   * @param color - Text color (default: white)
   * @param position - Initial position (default: origin)
   * @returns A new TextObject
   */
  static create(
    text: string,
    font: FontConfig,
    color: string = '#ffffff',
    position: Point3D = { x: 0, y: 0, z: 0 },
  ): TextObject {
    return new TextObject(
      RenderObject.createDefaultState({
        transform: {
          position,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
      }),
      text,
      font,
      color,
    );
  }

  /**
   * Create a text object with a simplified API
   *
   * @param text - Text content
   * @param fontSize - Font size in pixels
   * @param options - Optional configuration
   * @returns A new TextObject
   */
  static simple(
    text: string,
    fontSize: number,
    options: {
      fontFamily?: string;
      fontWeight?: string;
      fontStyle?: 'normal' | 'italic' | 'oblique';
      color?: string;
      position?: Point3D;
    } = {},
  ): TextObject {
    const font: FontConfig =
      options.fontWeight !== undefined
        ? {
            family: options.fontFamily ?? 'Arial',
            size: fontSize,
            style: options.fontStyle ?? 'normal',
            weight: options.fontWeight,
          }
        : {
            family: options.fontFamily ?? 'Arial',
            size: fontSize,
            style: options.fontStyle ?? 'normal',
          };
    return TextObject.create(text, font, options.color ?? '#ffffff', options.position);
  }

  /**
   * Create a heading text
   *
   * @param text - Heading text
   * @param level - Heading level (1-6, default: 1)
   * @param options - Optional configuration
   * @returns A new TextObject
   */
  static heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6 = 1,
    options: {
      fontFamily?: string;
      color?: string;
      position?: Point3D;
    } = {},
  ): TextObject {
    const sizes: Record<number, number> = { 1: 48, 2: 40, 3: 32, 4: 24, 5: 18, 6: 14 };
    const weights: Record<number, string> = { 1: 'bold', 2: 'bold', 3: 'bold' };

    const weight = weights[level];
    const font: FontConfig =
      weight !== undefined
        ? {
            family: options.fontFamily ?? 'Arial',
            size: sizes[level] as number,
            weight,
          }
        : {
            family: options.fontFamily ?? 'Arial',
            size: sizes[level] as number,
          };

    return TextObject.create(text, font, options.color ?? '#ffffff', options.position);
  }

  /**
   * Create a paragraph text
   *
   * @param text - Paragraph text
   * @param options - Optional configuration
   * @returns A new TextObject
   */
  static paragraph(
    text: string,
    options: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      position?: Point3D;
    } = {},
  ): TextObject {
    return TextObject.create(
      text,
      {
        family: options.fontFamily ?? 'Arial',
        size: options.fontSize ?? 16,
      },
      options.color ?? '#ffffff',
      options.position,
    );
  }

  /**
   * Create a code/monospace text
   *
   * @param text - Code text
   * @param fontSize - Font size (default: 14)
   * @param options - Optional configuration
   * @returns A new TextObject
   */
  static code(
    text: string,
    fontSize: number = 14,
    options: {
      color?: string;
      position?: Point3D;
    } = {},
  ): TextObject {
    return TextObject.create(
      text,
      {
        family: 'monospace',
        size: fontSize,
        weight: 'normal',
      },
      options.color ?? '#00ff00',
      options.position,
    );
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get a JSON-serializable representation
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      text: this.text,
      font: this.font,
      color: this.color,
    };
  }

  /**
   * Get a string representation
   */
  override toString(): string {
    return `TextObject(text="${this.text}", font=${this.font.family}, size=${this.font.size})`;
  }
}

/**
 * Default export
 */
export default TextObject;
