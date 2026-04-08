/**
 * Color utility functions for converting and manipulating colors
 */

import type { RGB, RGBA } from '../types/core';

/**
 * Parses a hex color string to RGB
 * @param hex - Hex color string (e.g., "#ff0000" or "#f00")
 * @returns RGB object
 * @throws Error if invalid hex color
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Try short form
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (shortResult && shortResult[1] && shortResult[2] && shortResult[3]) {
      return {
        r: parseInt(shortResult[1] + shortResult[1], 16),
        g: parseInt(shortResult[2] + shortResult[2], 16),
        b: parseInt(shortResult[3] + shortResult[3], 16),
      };
    }
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
}

/**
 * Converts RGB to hex color string
 * @param rgb - RGB object
 * @returns Hex color string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number): string => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Converts RGB to RGBA with specified alpha
 * @param rgb - RGB object
 * @param alpha - Alpha value (0-1)
 * @returns RGBA object
 */
export function rgbToRgba(rgb: RGB, alpha: number): RGBA {
  return {
    ...rgb,
    a: alpha,
  };
}

/**
 * Converts RGBA to CSS rgba string
 * @param rgba - RGBA object
 * @returns CSS rgba string
 */
export function rgbaToString(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

/**
 * Parses a CSS color string to RGB
 * Supports: hex, rgb(), rgba()
 * @param color - CSS color string
 * @returns RGB object
 */
export function parseColor(color: string): RGB {
  // Hex color
  if (color.charAt(0) === '#') {
    return hexToRgb(color);
  }

  // rgb() or rgba()
  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Named colors (basic set)
  const namedColors: Record<string, string> = {
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    white: '#ffffff',
    black: '#000000',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    transparent: '#000000',
  };

  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    return hexToRgb(namedColors[lowerColor]);
  }

  throw new Error(`Unsupported color format: ${color}`);
}

/**
 * Blends two colors using linear interpolation
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @param t - Blend factor (0-1)
 * @returns Blended color as hex string
 */
export function blendColors(color1: string, color2: string, t: number): string {
  const rgb1 = typeof color1 === 'string' ? parseColor(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? parseColor(color2) : color2;

  const blended: RGB = {
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * t),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * t),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * t),
  };

  return rgbToHex(blended);
}

/**
 * Adjusts the brightness of a color
 * @param color - Color to adjust (hex string)
 * @param amount - Amount to adjust (-1 to 1)
 * @returns Adjusted color as hex string
 */
export function adjustBrightness(color: string, amount: number): string {
  const rgb = parseColor(color);

  const adjusted: RGB = {
    r: clamp(Math.round(rgb.r + 255 * amount), 0, 255),
    g: clamp(Math.round(rgb.g + 255 * amount), 0, 255),
    b: clamp(Math.round(rgb.b + 255 * amount), 0, 255),
  };

  return rgbToHex(adjusted);
}

/**
 * Converts RGB to HSL
 * @param rgb - RGB object
 * @returns HSL object (h: 0-360, s: 0-1, l: 0-1)
 */
export function rgbToHsl(rgb: RGB): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s, l };
}

/**
 * Converts HSL to RGB
 * @param hsl - HSL object (h: 0-360, s: 0-1, l: 0-1)
 * @returns RGB object
 */
export function hslToRgb(hsl: { h: number; s: number; l: number }): RGB {
  let { h, s, l } = hsl;
  h /= 360;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Import clamp from math utils
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
