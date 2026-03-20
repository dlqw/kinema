/**
 * Unit tests for Animation system
 * Tests base Animation class, animation types, and animation groups
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Animation,
  FadeInAnimation,
  FadeOutAnimation,
  MoveAnimation,
  RotateAnimation,
  ScaleAnimation,
  AnimationGroup,
  smooth,
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  type AnimationConfig,
  type EasingFunction,
  type Alpha,
} from '../../../packages/core/src/types/animation';
import type { RenderObjectState, DEFAULT_TRANSFORM } from '../../../packages/core/src/types/core';

// Mock RenderObject for testing
class MockRenderObject {
  constructor(
    public id: string = 'test-obj',
    public visible: boolean = true,
    public opacity: number = 1,
    public position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    public rotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    public scale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 }
  ) {}

  getState(): RenderObjectState {
    return {
      id: this.id,
      transform: {
        position: this.position,
        rotation: this.rotation,
        scale: this.scale,
        opacity: this.opacity,
      },
      visible: this.visible,
      z_index: 0,
      styles: new Map(),
    };
  }

  withOpacity(opacity: number): MockRenderObject {
    return new MockRenderObject(
      this.id,
      this.visible,
      opacity,
      this.position,
      this.rotation,
      this.scale
    );
  }

  withPosition(x: number, y: number, z: number = 0): MockRenderObject {
    return new MockRenderObject(
      this.id,
      this.visible,
      this.opacity,
      { x, y, z },
      this.rotation,
      this.scale
    );
  }

  withRotation(x: number, y: number, z: number): MockRenderObject {
    return new MockRenderObject(
      this.id,
      this.visible,
      this.opacity,
      this.position,
      { x, y, z },
      this.scale
    );
  }

  withScale(x: number, y: number, z: number = 1): MockRenderObject {
    return new MockRenderObject(
      this.id,
      this.visible,
      this.opacity,
      this.position,
      this.rotation,
      { x, y, z }
    );
  }
}

describe('Animation Base Class', () => {
  let mockObject: MockRenderObject;
  let testConfig: AnimationConfig;

  beforeEach(() => {
    mockObject = new MockRenderObject();
    testConfig = {
      duration: 1,
      easing: smooth,
    };
  });

  describe('Animation Creation', () => {
    it('should create animation with config', () => {
      const animation = new FadeInAnimation(mockObject, testConfig);
      expect(animation).toBeInstanceOf(Animation);
      expect(animation.target).toBe(mockObject);
    });

    it('should store animation config', () => {
      const animation = new FadeInAnimation(mockObject, testConfig);
      expect(animation.config.duration).toBe(1);
      expect(animation.config.easing).toBe(smooth);
    });

    it('should calculate total duration', () => {
      const animation = new FadeInAnimation(mockObject, testConfig);
      expect(animation.getTotalDuration()).toBe(1);
    });

    it('should include delay in total duration', () => {
      const configWithDelay: AnimationConfig = {
        ...testConfig,
        delay: 0.5,
      };
      const animation = new FadeInAnimation(mockObject, configWithDelay);
      expect(animation.getTotalDuration()).toBe(1.5);
    });
  });

  describe('Animation Interpolation', () => {
    it('should return original object during delay', () => {
      const configWithDelay: AnimationConfig = {
        ...testConfig,
        delay: 0.5,
      };
      const animation = new FadeInAnimation(mockObject, configWithDelay);

      const result = animation.interpolate(0.25);
      expect(result.object).toBe(mockObject);
      expect(result.complete).toBe(false);
    });

    it('should start interpolation after delay', () => {
      const configWithDelay: AnimationConfig = {
        ...testConfig,
        delay: 0.5,
      };
      const animation = new FadeInAnimation(mockObject, configWithDelay);

      const result = animation.interpolate(0.75);
      expect(result.object).not.toBe(mockObject);
      expect(result.complete).toBe(false);
    });

    it('should complete animation at end of duration', () => {
      const animation = new FadeInAnimation(mockObject, testConfig);

      const result = animation.interpolate(1);
      expect(result.complete).toBe(true);
    });

    it('should handle elapsed time beyond duration', () => {
      const animation = new FadeInAnimation(mockObject, testConfig);

      const result = animation.interpolate(2);
      expect(result.complete).toBe(true);
    });
  });

  describe('Animation Properties', () => {
    it('should check if animation removes on complete', () => {
      const removerConfig: AnimationConfig = {
        ...testConfig,
        removeOnComplete: true,
      };
      const animation = new FadeInAnimation(mockObject, removerConfig);
      expect(animation.isRemover()).toBe(true);
    });

    it('should not remove by default', () => {
      const animation = new FadeInAnimation(mockObject, testConfig);
      expect(animation.isRemover()).toBe(false);
    });

    it('should get animation name', () => {
      const namedConfig: AnimationConfig = {
        ...testConfig,
        name: 'test-fade',
      };
      const animation = new FadeInAnimation(mockObject, namedConfig);
      expect(animation.getName()).toBe('test-fade');
    });

    it('should use class name when no name provided', () => {
      const animation = new FadeInAnimation(mockObject, testConfig);
      expect(animation.getName()).toBe('FadeInAnimation');
    });
  });
});

describe('FadeInAnimation', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject('test', true, 0);
  });

  it('should fade in from opacity 0 to 1', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 1,
      easing: linear,
    });

    const result = animation.interpolate(0.5);
    expect(result.object.getState().transform.opacity).toBeCloseTo(0.5, 5);
  });

  it('should start at opacity 0', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 1,
      easing: linear,
    });

    const result = animation.interpolate(0);
    expect(result.object.getState().transform.opacity).toBeCloseTo(0, 5);
  });

  it('should end at opacity 1', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 1,
      easing: linear,
    });

    const result = animation.interpolate(1);
    expect(result.object.getState().transform.opacity).toBeCloseTo(1, 5);
  });
});

describe('FadeOutAnimation', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject('test', true, 1);
  });

  it('should fade out from opacity 1 to 0', () => {
    const animation = new FadeOutAnimation(mockObject, {
      duration: 1,
      easing: linear,
    });

    const result = animation.interpolate(0.5);
    expect(result.object.getState().transform.opacity).toBeCloseTo(0.5, 5);
  });
});

describe('MoveAnimation', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject('test', true, 1, { x: 0, y: 0, z: 0 });
  });

  it('should move to target position', () => {
    const animation = new MoveAnimation(
      mockObject,
      { x: 100, y: 50, z: 25 },
      { duration: 1, easing: linear }
    );

    const result = animation.interpolate(1);
    const pos = result.object.getState().transform.position;
    expect(pos.x).toBeCloseTo(100, 5);
    expect(pos.y).toBeCloseTo(50, 5);
    expect(pos.z).toBeCloseTo(25, 5);
  });

  it('should interpolate position linearly', () => {
    const animation = new MoveAnimation(
      mockObject,
      { x: 100, y: 0, z: 0 },
      { duration: 1, easing: linear }
    );

    const result = animation.interpolate(0.5);
    expect(result.object.getState().transform.position.x).toBeCloseTo(50, 5);
  });
});

describe('RotateAnimation', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject('test', true, 1);
  });

  it('should rotate to target rotation', () => {
    const animation = new RotateAnimation(
      mockObject,
      'z',
      90,
      { duration: 1, easing: linear }
    );

    const result = animation.interpolate(1);
    expect(result.object.getState().transform.rotation.z).toBeCloseTo(90, 5);
  });

  it('should support rotation on different axes', () => {
    const xAnim = new RotateAnimation(mockObject, 'x', 45, {
      duration: 1,
      easing: linear,
    });
    const yAnim = new RotateAnimation(mockObject, 'y', 30, {
      duration: 1,
      easing: linear,
    });

    const xResult = xAnim.interpolate(1);
    const yResult = yAnim.interpolate(1);

    expect(xResult.object.getState().transform.rotation.x).toBeCloseTo(45, 5);
    expect(yResult.object.getState().transform.rotation.y).toBeCloseTo(30, 5);
  });
});

describe('ScaleAnimation', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject('test', true, 1);
  });

  it('should scale to target scale', () => {
    const animation = new ScaleAnimation(mockObject, 2, {
      duration: 1,
      easing: linear,
    });

    const result = animation.interpolate(1);
    const scale = result.object.getState().transform.scale;
    expect(scale.x).toBeCloseTo(2, 5);
    expect(scale.y).toBeCloseTo(2, 5);
    expect(scale.z).toBeCloseTo(2, 5);
  });
});

describe('AnimationGroup', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject();
  });

  describe('Parallel Animations', () => {
    it('should run multiple animations simultaneously', () => {
      const fadeAnim = new FadeInAnimation(mockObject, {
        duration: 1,
        easing: linear,
      });
      const moveAnim = new MoveAnimation(
        mockObject,
        { x: 100, y: 0, z: 0 },
        { duration: 1, easing: linear }
      );

      const group = AnimationGroup.parallel(mockObject, [fadeAnim, moveAnim]);

      const result = group.interpolate(0.5);
      expect(result.object.getState().transform.opacity).toBeCloseTo(0.5, 5);
      expect(result.object.getState().transform.position.x).toBeCloseTo(50, 5);
    });
  });

  describe('Sequential Animations', () => {
    it('should run animations in sequence', () => {
      const move1 = new MoveAnimation(mockObject, { x: 50, y: 0, z: 0 }, {
        duration: 0.5,
        easing: linear,
      });
      const move2 = new MoveAnimation(mockObject, { x: 100, y: 0, z: 0 }, {
        duration: 0.5,
        easing: linear,
      });

      const group = AnimationGroup.sequence(mockObject, [move1, move2]);

      // At 0.25 (first animation half done)
      const result1 = group.interpolate(0.25);
      expect(result1.object.getState().transform.position.x).toBeCloseTo(25, 5);

      // At 0.75 (second animation half done)
      const result2 = group.interpolate(0.75);
      expect(result2.object.getState().transform.position.x).toBeCloseTo(75, 5);
    });

    it('should complete all animations at end', () => {
      const anim1 = new FadeInAnimation(mockObject, {
        duration: 0.5,
        easing: linear,
      });
      const anim2 = new FadeOutAnimation(mockObject, {
        duration: 0.5,
        easing: linear,
      });

      const group = AnimationGroup.sequence(mockObject, [anim1, anim2]);

      const result = group.interpolate(1);
      expect(result.complete).toBe(true);
    });
  });
});

describe('Animation Duration and Timing', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject();
  });

  it('should calculate correct total duration for single animation', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 2,
      easing: linear,
    });
    expect(animation.getTotalDuration()).toBe(2);
  });

  it('should include delay in total duration', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 1,
      delay: 0.5,
      easing: linear,
    });
    expect(animation.getTotalDuration()).toBe(1.5);
  });

  it('should calculate parallel group duration (max of all)', () => {
    const shortAnim = new FadeInAnimation(mockObject, {
      duration: 0.5,
      easing: linear,
    });
    const longAnim = new MoveAnimation(mockObject, { x: 100, y: 0, z: 0 }, {
      duration: 1.5,
      easing: linear,
    });

    const group = AnimationGroup.parallel(mockObject, [shortAnim, longAnim]);
    expect(group.getTotalDuration()).toBeCloseTo(1.5, 5);
  });

  it('should calculate sequential group duration (sum of all)', () => {
    const anim1 = new FadeInAnimation(mockObject, {
      duration: 0.5,
      easing: linear,
    });
    const anim2 = new MoveAnimation(mockObject, { x: 100, y: 0, z: 0 }, {
      duration: 0.7,
      easing: linear,
    });

    const group = AnimationGroup.sequence(mockObject, [anim1, anim2]);
    expect(group.getTotalDuration()).toBeCloseTo(1.2, 5);
  });
});

describe('Animation Builder Pattern', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject();
  });

  it('should support builder pattern for animation configuration', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 1,
      easing: smooth,
    });

    expect(animation.config.duration).toBe(1);
    expect(animation.config.easing).toBe(smooth);
  });
});

describe('Edge Cases and Error Handling', () => {
  let mockObject: MockRenderObject;

  beforeEach(() => {
    mockObject = new MockRenderObject();
  });

  it('should handle zero duration gracefully', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 0,
      easing: linear,
    });

    const result = animation.interpolate(0);
    expect(result.complete).toBe(true);
  });

  it('should handle negative elapsed time', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 1,
      easing: linear,
    });

    const result = animation.interpolate(-0.5);
    expect(result.object).toBe(mockObject);
    expect(result.complete).toBe(false);
  });

  it('should handle very large duration', () => {
    const animation = new FadeInAnimation(mockObject, {
      duration: 1000,
      easing: linear,
    });

    expect(animation.getTotalDuration()).toBe(1000);
  });
});
