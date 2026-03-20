/**
 * Unit tests for Math utilities
 * Testing: lerp, clamp, degToRad, radToDeg
 */

import { describe, it, expect } from 'vitest';

describe('MathUtils', () => {
  describe('lerp (linear interpolation)', () => {
    const lerp = (start: number, end: number, t: number): number => {
      if (t < 0 || t > 1) {
        throw new Error('t must be between 0 and 1');
      }
      return start + (end - start) * t;
    };

    it('should return start value when t is 0', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(5, 15, 0)).toBe(5);
    });

    it('should return end value when t is 1', () => {
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(5, 15, 1)).toBe(15);
    });

    it('should return midpoint when t is 0.5', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
      expect(lerp(-20, -10, 0.5)).toBe(-15);
    });

    it('should throw error when t is out of range', () => {
      expect(() => lerp(0, 10, -0.1)).toThrow('t must be between 0 and 1');
      expect(() => lerp(0, 10, 1.1)).toThrow('t must be between 0 and 1');
    });

    it('should handle floating point precision', () => {
      const result = lerp(0, 1, 0.333333);
      expect(result).toBeCloseTo(0.333333, 5);
    });
  });

  describe('clamp', () => {
    const clamp = (value: number, min: number, max: number): number => {
      return Math.min(Math.max(value, min), max);
    };

    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should clamp to min when below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, -50, 50)).toBe(-50);
    });

    it('should clamp to max when above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, -50, 50)).toBe(50);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-30, -50, -10)).toBe(-30);
      expect(clamp(-60, -50, -10)).toBe(-50);
      expect(clamp(0, -50, -10)).toBe(-10);
    });
  });

  describe('degToRad', () => {
    const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

    it('should convert 0 degrees to 0 radians', () => {
      expect(degToRad(0)).toBe(0);
    });

    it('should convert 180 degrees to PI radians', () => {
      expect(degToRad(180)).toBe(Math.PI);
    });

    it('should convert 360 degrees to 2*PI radians', () => {
      expect(degToRad(360)).toBe(2 * Math.PI);
    });

    it('should convert 90 degrees to PI/2 radians', () => {
      expect(degToRad(90)).toBe(Math.PI / 2);
    });

    it('should handle negative degrees', () => {
      expect(degToRad(-180)).toBe(-Math.PI);
    });
  });

  describe('radToDeg', () => {
    const radToDeg = (radians: number): number => (radians * 180) / Math.PI;

    it('should convert 0 radians to 0 degrees', () => {
      expect(radToDeg(0)).toBe(0);
    });

    it('should convert PI radians to 180 degrees', () => {
      expect(radToDeg(Math.PI)).toBe(180);
    });

    it('should convert 2*PI radians to 360 degrees', () => {
      expect(radToDeg(2 * Math.PI)).toBe(360);
    });

    it('should convert PI/2 radians to 90 degrees', () => {
      expect(radToDeg(Math.PI / 2)).toBe(90);
    });

    it('should handle negative radians', () => {
      expect(radToDeg(-Math.PI)).toBe(-180);
    });

    it('should be inverse of degToRad', () => {
      const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;
      const degrees = 45;
      const converted = radToDeg(degToRad(degrees));
      expect(converted).toBeCloseTo(degrees, 10);
    });
  });
});
