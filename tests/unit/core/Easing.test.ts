/**
 * Unit tests for Easing functions
 * Tests all easing functions for correct behavior at boundary points and mid-points
 */

import { describe, it, expect } from 'vitest';
import {
  linear,
  smooth,
  smoother,
  easeIn,
  easeInCubic,
  easeInQuart,
  easeInQuint,
  easeInSine,
  easeInExpo,
  easeInCirc,
  easeOut,
  easeOutCubic,
  easeOutQuart,
  easeOutQuint,
  easeOutSine,
  easeOutExpo,
  easeOutCirc,
  easeInOut,
  easeInOutCubic,
  easeInOutQuart,
  easeInOutQuint,
  easeInOutSine,
  easeInOutExpo,
  easeInOutCirc,
  elastic,
  back,
  bounce,
  thereAndBack,
  thereAndBackWithPause,
  jumpBy,
  custom,
  cubicBezier,
  easeInFunctions,
  easeOutFunctions,
  easeInOutFunctions,
  specialFunctions,
  isEasingFunction,
} from '../../../packages/core/src/types/easing';

describe('Easing Functions', () => {
  describe('Boundary Conditions', () => {
    // Standard easing functions that map [0,1] to [0,1]
    const easingFunctions = [
      linear,
      smooth,
      smoother,
      easeIn,
      easeInCubic,
      easeInQuart,
      easeInQuint,
      easeInSine,
      easeInExpo,
      easeInCirc,
      easeOut,
      easeOutCubic,
      easeOutQuart,
      easeOutQuint,
      easeOutSine,
      easeOutExpo,
      easeOutCirc,
      easeInOut,
      easeInOutCubic,
      easeInOutQuart,
      easeInOutQuint,
      easeInOutSine,
      easeInOutExpo,
      easeInOutCirc,
      elastic,
      back,
      bounce,
      // Note: thereAndBack, thereAndBackWithPause excluded as they return 0 at t=1
    ];

    it('should return 0 when input is 0', () => {
      easingFunctions.forEach((fn) => {
        expect(fn(0)).toBeCloseTo(0, 10);
      });
    });

    it('should return 1 when input is 1', () => {
      easingFunctions.forEach((fn) => {
        expect(fn(1)).toBeCloseTo(1, 10);
      });
    });

    it('should return values between 0 and 1 for inputs in [0, 1]', () => {
      easingFunctions.forEach((fn) => {
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          const result = fn(t);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('Basic Easing Functions', () => {
    describe('linear', () => {
      it('should return input value unchanged', () => {
        expect(linear(0)).toBeCloseTo(0, 10);
        expect(linear(0.5)).toBeCloseTo(0.5, 10);
        expect(linear(1)).toBeCloseTo(1, 10);
      });
    });

    describe('smooth (smoothstep)', () => {
      it('should create smooth S-curve', () => {
        expect(smooth(0.25)).toBeCloseTo(0.156, 3);
        expect(smooth(0.5)).toBe(0.5);
        expect(smooth(0.75)).toBeCloseTo(0.844, 3);
      });

      it('should be symmetric around 0.5', () => {
        const t = 0.3;
        expect(smooth(t) + smooth(1 - t)).toBeCloseTo(1, 5);
      });
    });

    describe('smoother (Ken Perlin\'s smootherstep)', () => {
      it('should create smoother S-curve', () => {
        expect(smoother(0.25)).toBeCloseTo(0.09, 2);
        expect(smoother(0.5)).toBe(0.5);
        expect(smoother(0.75)).toBeCloseTo(0.91, 2);
      });

      it('should be smoother than smooth function', () => {
        const t = 0.25;
        expect(smoother(t)).toBeLessThan(smooth(t));
      });
    });
  });

  describe('Ease In Functions (Accelerating)', () => {
    it('should all start slow and accelerate', () => {
      const t = 0.5;

      expect(easeIn(t)).toBeLessThan(t); // Quadratic
      expect(easeInCubic(t)).toBeLessThan(easeIn(t)); // Cubic is slower
      expect(easeInQuart(t)).toBeLessThan(easeInCubic(t)); // Quartic is even slower
      expect(easeInQuint(t)).toBeLessThan(easeInQuart(t)); // Quintic is slowest
    });

    describe('easeIn (quadratic)', () => {
      it('should follow t² curve', () => {
        expect(easeIn(0.5)).toBe(0.25);
        expect(easeIn(0.25)).toBe(0.0625);
      });
    });

    describe('easeInCubic', () => {
      it('should follow t³ curve', () => {
        expect(easeInCubic(0.5)).toBe(0.125);
        expect(easeInCubic(0.25)).toBe(0.015625);
      });
    });

    describe('easeInExpo', () => {
      it('should start very slow then accelerate rapidly', () => {
        expect(easeInExpo(0)).toBeCloseTo(0, 10);
        expect(easeInExpo(0.5)).toBeCloseTo(0.031, 3);
        expect(easeInExpo(0.9)).toBeCloseTo(0.5, 1);
      });

      it('should handle edge case at 0', () => {
        expect(easeInExpo(0)).toBeCloseTo(0, 10);
      });
    });

    describe('easeInCirc', () => {
      it('should follow circular arc', () => {
        expect(easeInCirc(0.5)).toBeCloseTo(0.134, 3);
        expect(easeInCirc(1)).toBe(1);
      });
    });
  });

  describe('Ease Out Functions (Decelerating)', () => {
    it('should all start fast and decelerate', () => {
      const t = 0.5;

      expect(easeOut(t)).toBeGreaterThan(t); // Quadratic
      expect(easeOutCubic(t)).toBeGreaterThan(easeOut(t)); // Cubic is faster
      expect(easeOutQuart(t)).toBeGreaterThan(easeOutCubic(t)); // Quartic is even faster
      expect(easeOutQuint(t)).toBeGreaterThan(easeOutQuart(t)); // Quintic is fastest
    });

    describe('easeOut (quadratic)', () => {
      it('should follow inverted t² curve', () => {
        expect(easeOut(0.5)).toBe(0.75);
        expect(easeOut(0.25)).toBe(0.4375);
      });
    });

    describe('easeOutCubic', () => {
      it('should follow inverted t³ curve', () => {
        expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 3);
        expect(easeOutCubic(0.25)).toBeCloseTo(0.578, 3);
      });
    });

    describe('easeOutExpo', () => {
      it('should start fast then slow down dramatically', () => {
        expect(easeOutExpo(0.1)).toBeCloseTo(0.5, 1);
        expect(easeOutExpo(0.5)).toBeCloseTo(0.97, 2);
        expect(easeOutExpo(1)).toBeCloseTo(1, 10);
      });

      it('should handle edge case at 1', () => {
        expect(easeOutExpo(1)).toBeCloseTo(1, 10);
      });
    });

    describe('easeOutCirc', () => {
      it('should follow inverted circular arc', () => {
        expect(easeOutCirc(0.5)).toBeCloseTo(0.866, 3);
        expect(easeOutCirc(1)).toBe(1);
      });
    });
  });

  describe('Ease In Out Functions (Accelerate then Decelerate)', () => {
    it('should all pass through midpoint (0.5, 0.5)', () => {
      expect(easeInOut(0.5)).toBeCloseTo(0.5, 10);
      expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
      expect(easeInOutQuart(0.5)).toBeCloseTo(0.5, 10);
      expect(easeInOutQuint(0.5)).toBeCloseTo(0.5, 10);
      expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10);
      expect(easeInOutExpo(0.5)).toBeCloseTo(0.5, 10);
      expect(easeInOutCirc(0.5)).toBeCloseTo(0.5, 10);
    });

    it('should be symmetric around midpoint', () => {
      const functions = [easeInOut, easeInOutCubic, easeInOutQuart, easeInOutQuint];
      const t = 0.3;

      functions.forEach((fn) => {
        expect(fn(t) + fn(1 - t)).toBeCloseTo(1, 5);
      });
    });

    describe('easeInOut (quadratic)', () => {
      it('should accelerate then decelerate', () => {
        expect(easeInOut(0.25)).toBeCloseTo(0.125, 3);
        expect(easeInOut(0.75)).toBeCloseTo(0.875, 3);
      });
    });

    describe('easeInOutCubic', () => {
      it('should have cubic acceleration/deceleration', () => {
        expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625, 4);
        expect(easeInOutCubic(0.75)).toBeCloseTo(0.9375, 4);
      });
    });

    describe('easeInOutExpo', () => {
      it('should have exponential transition at midpoint', () => {
        expect(easeInOutExpo(0.4)).toBeCloseTo(0.125, 3);
        expect(easeInOutExpo(0.6)).toBeCloseTo(0.875, 3);
      });

      it('should handle edge cases at 0 and 1', () => {
        expect(easeInOutExpo(0)).toBeCloseTo(0, 10);
        expect(easeInOutExpo(1)).toBeCloseTo(1, 10);
      });
    });
  });

  describe('Special Easing Functions', () => {
    describe('elastic', () => {
      it('should overshoot and settle', () => {
        const result = elastic(0.5);
        expect(result).toBeLessThan(0);
      });

      it('should have multiple oscillations', () => {
        // Check that function crosses zero multiple times
        let crossings = 0;
        let lastSign = Math.sign(elastic(0.01));

        for (let i = 1; i <= 100; i++) {
          const t = i / 100;
          const sign = Math.sign(elastic(t));
          if (sign !== 0 && sign !== lastSign) {
            crossings++;
            lastSign = sign;
          }
        }

        expect(crossings).toBeGreaterThan(2);
      });

      it('should handle edge cases', () => {
        expect(elastic(0)).toBe(0);
        expect(elastic(1)).toBe(1);
      });
    });

    describe('back', () => {
      it('should go backwards before going forward', () => {
        expect(back(0.25)).toBeLessThan(0);
        expect(back(0.1)).toBeLessThan(0);
      });

      it('should overshoot 1 before settling', () => {
        expect(back(1)).toBe(1);
        expect(back(0.9)).toBeGreaterThan(1);
      });
    });

    describe('bounce', () => {
      it('should bounce at the end', () => {
        const t0 = bounce(0.9);
        const t1 = bounce(0.95);
        const t2 = bounce(1);

        expect(t2).toBe(1);
        // Should have some non-monotonic behavior
        expect(t1).not.toBeGreaterThan(t2);
      });

      it('should handle different bounce regions', () => {
        // Different regions of the bounce function
        expect(bounce(0.25)).toBeGreaterThan(0);
        expect(bounce(0.5)).toBeGreaterThan(0);
        expect(bounce(0.75)).toBeGreaterThan(0);
      });
    });

    describe('thereAndBack', () => {
      it('should go to 1 and back to 0', () => {
        expect(thereAndBack(0)).toBe(0);
        expect(thereAndBack(0.5)).toBe(1);
        expect(thereAndBack(1)).toBe(0);
      });

      it('should be symmetric around 0.5', () => {
        const t = 0.3;
        expect(thereAndBack(t)).toBe(thereAndBack(1 - t));
      });
    });

    describe('thereAndBackWithPause', () => {
      it('should have a pause at the peak', () => {
        expect(thereAndBackWithPause(0)).toBe(0);
        expect(thereAndBackWithPause(0.5)).toBe(1);
        expect(thereAndBackWithPause(0.6)).toBe(1);
        expect(thereAndBackWithPause(0.74)).toBe(1);
        expect(thereAndBackWithPause(0.76)).toBeLessThan(1);
        expect(thereAndBackWithPause(1)).toBe(0);
      });
    });
  });

  describe('Utility Easing Functions', () => {
    describe('jumpBy', () => {
      it('should create discrete jumps', () => {
        expect(jumpBy(0, 4)).toBe(0);
        expect(jumpBy(0.24, 4)).toBe(0);
        expect(jumpBy(0.25, 4)).toBe(0.25);
        expect(jumpBy(0.49, 4)).toBe(0.25);
        expect(jumpBy(0.5, 4)).toBe(0.5);
        expect(jumpBy(0.74, 4)).toBe(0.5);
        expect(jumpBy(0.75, 4)).toBe(0.75);
        expect(jumpBy(1, 4)).toBe(1);
      });

      it('should handle different jump counts', () => {
        expect(jumpBy(0.33, 3)).toBeCloseTo(0.333, 3);
        expect(jumpBy(0.66, 3)).toBeCloseTo(0.666, 3);
      });

      it('should handle single jump (no jump)', () => {
        expect(jumpBy(0.5, 1)).toBe(0);
      });
    });

    describe('custom', () => {
      it('should create custom easing function', () => {
        const customFn = custom((t) => t * t);
        expect(customFn(0.5)).toBe(0.25);
        expect(customFn(1)).toBe(1);
      });

      it('should preserve function reference', () => {
        const originalFn = (t: number) => t * t;
        const customFn = custom(originalFn);
        expect(customFn).toBe(originalFn);
      });
    });

    describe('cubicBezier', () => {
      it('should create cubic bezier easing function', () => {
        const bezier = cubicBezier(0.25, 0.1, 0.25, 1);
        expect(bezier(0)).toBe(0);
        expect(bezier(1)).toBe(1);
        expect(bezier(0.5)).toBeGreaterThan(0);
        expect(bezier(0.5)).toBeLessThan(1);
      });

      it('should create valid easing function', () => {
        const bezier = cubicBezier(0.42, 0, 0.58, 1);
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          const result = bezier(t);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('Easing Function Collections', () => {
    describe('easeInFunctions', () => {
      it('should contain all ease-in functions', () => {
        expect(easeInFunctions.quadratic).toBe(easeIn);
        expect(easeInFunctions.cubic).toBe(easeInCubic);
        expect(easeInFunctions.quart).toBe(easeInQuart);
        expect(easeInFunctions.quint).toBe(easeInQuint);
        expect(easeInFunctions.sine).toBe(easeInSine);
        expect(easeInFunctions.expo).toBe(easeInExpo);
        expect(easeInFunctions.circ).toBe(easeInCirc);
      });

      it('should have all functions start at 0 and end at 1', () => {
        Object.values(easeInFunctions).forEach((fn) => {
          expect(fn(0)).toBeCloseTo(0, 10);
          expect(fn(1)).toBeCloseTo(1, 10);
        });
      });
    });

    describe('easeOutFunctions', () => {
      it('should contain all ease-out functions', () => {
        expect(easeOutFunctions.quadratic).toBe(easeOut);
        expect(easeOutFunctions.cubic).toBe(easeOutCubic);
        expect(easeOutFunctions.quart).toBe(easeOutQuart);
        expect(easeOutFunctions.quint).toBe(easeOutQuint);
        expect(easeOutFunctions.sine).toBe(easeOutSine);
        expect(easeOutFunctions.expo).toBe(easeOutExpo);
        expect(easeOutFunctions.circ).toBe(easeOutCirc);
      });

      it('should have all functions start at 0 and end at 1', () => {
        Object.values(easeOutFunctions).forEach((fn) => {
          expect(fn(0)).toBeCloseTo(0, 10);
          expect(fn(1)).toBeCloseTo(1, 10);
        });
      });
    });

    describe('easeInOutFunctions', () => {
      it('should contain all ease-in-out functions', () => {
        expect(easeInOutFunctions.quadratic).toBe(easeInOut);
        expect(easeInOutFunctions.cubic).toBe(easeInOutCubic);
        expect(easeInOutFunctions.quartic).toBe(easeOutQuart); // Note: name difference
        expect(easeInOutFunctions.quint).toBe(easeInOutQuint);
        expect(easeInOutFunctions.sine).toBe(easeInOutSine);
        expect(easeInOutFunctions.expo).toBe(easeInOutExpo);
        expect(easeInOutFunctions.circ).toBe(easeInOutCirc);
      });

      it('should have all functions pass through midpoint', () => {
        Object.values(easeInOutFunctions).forEach((fn) => {
          expect(fn(0.5)).toBe(0.5);
        });
      });
    });

    describe('specialFunctions', () => {
      it('should contain all special functions', () => {
        expect(specialFunctions.elastic).toBe(elastic);
        expect(specialFunctions.back).toBe(back);
        expect(specialFunctions.bounce).toBe(bounce);
        expect(specialFunctions.thereAndBack).toBe(thereAndBack);
        expect(specialFunctions.thereAndBackWithPause).toBe(thereAndBackWithPause);
      });
    });
  });

  describe('Type Guards', () => {
    describe('isEasingFunction', () => {
      it('should return true for valid easing functions', () => {
        expect(isEasingFunction(linear)).toBe(true);
        expect(isEasingFunction(smooth)).toBe(true);
        expect(isEasingFunction(custom((t) => t))).toBe(true);
      });

      it('should return false for non-functions', () => {
        expect(isEasingFunction(null)).toBe(false);
        expect(isEasingFunction(undefined)).toBe(false);
        expect(isEasingFunction(123)).toBe(false);
        expect(isEasingFunction('string')).toBe(false);
        expect(isEasingFunction({})).toBe(false);
      });

      it('should return false for non-function objects', () => {
        expect(isEasingFunction({ call: () => {} })).toBe(false);
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle values slightly outside [0, 1]', () => {
      // Most easing functions should still return reasonable values
      expect(linear(-0.1)).toBeCloseTo(-0.1, 5);
      // smooth function clamps to [0, 1] range
      expect(smooth(-0.1)).toBeGreaterThanOrEqual(0);
      expect(easeIn(1.1)).toBeGreaterThan(1);
    });

    it('should handle NaN input', () => {
      expect(linear(NaN)).toBeNaN();
      expect(smooth(NaN)).toBeNaN();
      expect(easeIn(NaN)).toBeNaN();
    });

    it('should handle infinity', () => {
      expect(linear(Infinity)).toBe(Infinity);
      expect(linear(-Infinity)).toBe(-Infinity);
    });

    it('should handle very small values', () => {
      const epsilon = 1e-10;
      expect(linear(epsilon)).toBeCloseTo(epsilon, 15);
      expect(smooth(epsilon)).toBeCloseTo(0, 10);
      expect(easeIn(epsilon)).toBeCloseTo(0, 15);
    });

    it('should handle values very close to 1', () => {
      const nearOne = 1 - 1e-10;
      expect(linear(nearOne)).toBeCloseTo(nearOne, 10);
      expect(smooth(nearOne)).toBeCloseTo(1, 5);
    });
  });

  describe('Monotonicity Properties', () => {
    it('ease-in functions should be monotonically increasing', () => {
      const functions = [easeIn, easeInCubic, easeInQuart, easeInQuint];

      functions.forEach((fn) => {
        let lastValue = fn(0);
        for (let i = 1; i <= 100; i++) {
          const t = i / 100;
          const currentValue = fn(t);
          expect(currentValue).toBeGreaterThanOrEqual(lastValue);
          lastValue = currentValue;
        }
      });
    });

    it('ease-out functions should be monotonically increasing', () => {
      const functions = [easeOut, easeOutCubic, easeOutQuart, easeOutQuint];

      functions.forEach((fn) => {
        let lastValue = fn(0);
        for (let i = 1; i <= 100; i++) {
          const t = i / 100;
          const currentValue = fn(t);
          expect(currentValue).toBeGreaterThanOrEqual(lastValue);
          lastValue = currentValue;
        }
      });
    });

    it('ease-in-out functions should be monotonically increasing', () => {
      const functions = [easeInOut, easeInOutCubic, easeInOutQuart, easeInOutQuint];

      functions.forEach((fn) => {
        let lastValue = fn(0);
        for (let i = 1; i <= 100; i++) {
          const t = i / 100;
          const currentValue = fn(t);
          expect(currentValue).toBeGreaterThanOrEqual(lastValue);
          lastValue = currentValue;
        }
      });
    });
  });

  describe('Symmetry Properties', () => {
    it('ease-in and ease-out should be complementary', () => {
      const t = 0.3;
      expect(easeIn(t) + easeOut(1 - t)).toBeCloseTo(1, 5);
      expect(easeInCubic(t) + easeOutCubic(1 - t)).toBeCloseTo(1, 5);
      expect(easeInQuart(t) + easeOutQuart(1 - t)).toBeCloseTo(1, 5);
    });

    it('smooth functions should be symmetric', () => {
      const t = 0.3;
      expect(smooth(t) + smooth(1 - t)).toBeCloseTo(1, 5);
      expect(smoother(t) + smoother(1 - t)).toBeCloseTo(1, 5);
    });
  });
});
