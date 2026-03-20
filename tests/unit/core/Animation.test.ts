/**
 * Unit tests for Animation and animation types
 * Tests interpolation, animation composition, timing, and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Animation,
  AnimationBuilder,
  TransformAnimation,
  FadeInAnimation,
  FadeOutAnimation,
  RotateAnimation,
  MoveAnimation,
  ScaleAnimation,
  AnimationGroup,
  CompositionType,
  Timeline,
  type AnimationConfig,
  type InterpolationResult,
  type Alpha,
  smooth,
  type RenderObjectState,
  DEFAULT_TRANSFORM,
  generateObjectId,
  type Point3D,
} from '../../../packages/core/src/types/core';

// Mock render object for testing
class MockRenderObject {
  constructor(private state: RenderObjectState) {}

  getState(): RenderObjectState {
    return { ...this.state };
  }

  withTransform(transform: Partial<typeof DEFAULT_TRANSFORM>): MockRenderObject {
    const newTransform = { ...this.state.transform, ...transform };
    const newState = { ...this.state, transform: newTransform };
    return new MockRenderObject(newState);
  }

  withOpacity(opacity: number): MockRenderObject {
    return this.withTransform({ opacity });
  }

  withPosition(x: number, y: number, z: number = 0): MockRenderObject {
    return this.withTransform({ position: { x, y, z } });
  }

  getBoundingBox() {
    return {
      min: { x: 0, y: 0, z: 0 } as Point3D,
      max: { x: 0, y: 0, z: 0 } as Point3D,
      center: { x: 0, y: 0, z: 0 } as Point3D,
    };
  }

  containsPoint(point: Point3D): boolean {
    return false;
  }

  withZIndex(z: number): MockRenderObject {
    return new MockRenderObject({ ...this.state, z_index: z });
  }

  withVisibility(visible: boolean): MockRenderObject {
    return new MockRenderObject({ ...this.state, visible });
  }

  withStyle(key: string, value: unknown): MockRenderObject {
    const newStyles = new Map(this.state.styles);
    newStyles.set(key, value);
    return new MockRenderObject({ ...this.state, styles: newStyles });
  }
}

describe('Animation', () => {
  let mockObject: MockRenderObject;
  let defaultConfig: AnimationConfig;

  beforeEach(() => {
    const state: RenderObjectState = {
      id: generateObjectId('test'),
      transform: { ...DEFAULT_TRANSFORM },
      visible: true,
      z_index: 0,
      styles: new Map(),
    };
    mockObject = new MockRenderObject(state);
    defaultConfig = {
      duration: 1,
      easing: smooth,
    };
  });

  describe('Basic Animation Properties', () => {
    it('should have a target object', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);

      expect(animation.target).toBe(mockObject);
    });

    it('should have a config object', () => {
      const config: AnimationConfig = { duration: 2, easing: smooth };
      const animation = new FadeInAnimation(mockObject, config);

      expect(animation.config).toEqual(config);
      expect(animation.config.duration).toBe(2);
    });

    it('should calculate total duration including delay', () => {
      const configWithDelay: AnimationConfig = {
        duration: 1,
        easing: smooth,
        delay: 0.5,
      };
      const animation = new FadeInAnimation(mockObject, configWithDelay);

      expect(animation.getTotalDuration()).toBe(1.5);
    });

    it('should return duration when no delay is set', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);

      expect(animation.getTotalDuration()).toBe(1);
    });

    it('should return animation name', () => {
      const namedConfig: AnimationConfig = {
        ...defaultConfig,
        name: 'test-animation',
      };
      const animation = new FadeInAnimation(mockObject, namedConfig);

      expect(animation.getName()).toBe('test-animation');
    });

    it('should return class name when no name is set', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);

      expect(animation.getName()).toBe('FadeInAnimation');
    });
  });

  describe('Animation Interpolation', () => {
    it('should return original object before delay', () => {
      const configWithDelay: AnimationConfig = {
        ...defaultConfig,
        delay: 0.5,
      };
      const animation = new FadeInAnimation(mockObject, configWithDelay);
      const result = animation.interpolate(0.25);

      expect(result.object).toBe(mockObject);
      expect(result.complete).toBe(false);
    });

    it('should return completed object at end of duration', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);
      const result = animation.interpolate(1);

      expect(result.complete).toBe(true);
    });

    it('should return completed object past duration', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);
      const result = animation.interpolate(2);

      expect(result.complete).toBe(true);
    });

    it('should interpolate at mid point', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);
      const result = animation.interpolate(0.5);

      expect(result.complete).toBe(false);
      expect(result.object.getState().transform.opacity).toBeCloseTo(0.5, 5);
    });

    it('should respect easing function', () => {
      const linearConfig: AnimationConfig = {
        ...defaultConfig,
        easing: (t: Alpha) => t, // linear
      };
      const animation = new FadeInAnimation(mockObject, linearConfig);
      const result = animation.interpolate(0.5);

      expect(result.object.getState().transform.opacity).toBeCloseTo(0.5, 5);
    });
  });

  describe('Fade Animations', () => {
    it('should fade in from 0 to 1', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);

      const start = animation.interpolate(0);
      const mid = animation.interpolate(0.5);
      const end = animation.interpolate(1);

      expect(start.object.getState().transform.opacity).toBe(0);
      expect(mid.object.getState().transform.opacity).toBeCloseTo(0.5, 5);
      expect(end.object.getState().transform.opacity).toBe(1);
    });

    it('should fade out from 1 to 0', () => {
      const animation = new FadeOutAnimation(mockObject, defaultConfig);

      const start = animation.interpolate(0);
      const mid = animation.interpolate(0.5);
      const end = animation.interpolate(1);

      expect(start.object.getState().transform.opacity).toBe(1);
      expect(mid.object.getState().transform.opacity).toBeCloseTo(0.5, 5);
      expect(end.object.getState().transform.opacity).toBe(0);
    });
  });

  describe('Transform Animations', () => {
    it('should rotate object around axis', () => {
      const animation = new RotateAnimation(mockObject, 'z', 90, defaultConfig);

      const result = animation.interpolate(0.5);
      expect(result.object.getState().transform.rotation.z).toBe(45);
    });

    it('should move object by delta', () => {
      const delta = { x: 100, y: 50, z: 0 };
      const animation = new MoveAnimation(mockObject, delta, defaultConfig);

      const result = animation.interpolate(0.5);
      expect(result.object.getState().transform.position.x).toBe(50);
      expect(result.object.getState().transform.position.y).toBe(25);
    });

    it('should scale object', () => {
      const scaleFactor = { x: 2, y: 2, z: 1 };
      const animation = new ScaleAnimation(mockObject, scaleFactor, defaultConfig);

      const result = animation.interpolate(0.5);
      expect(result.object.getState().transform.scale.x).toBe(1.5);
      expect(result.object.getState().transform.scale.y).toBe(1.5);
    });

    it('should interpolate between two transform states', () => {
      const endState: RenderObjectState = {
        ...mockObject.getState(),
        transform: {
          position: { x: 100, y: 200, z: 0 },
          rotation: { x: 45, y: 90, z: 180 },
          scale: { x: 2, y: 2, z: 1 },
          opacity: 0.5,
        },
      };

      const animation = new TransformAnimation(mockObject, endState, defaultConfig);
      const result = animation.interpolate(0.5);

      const transform = result.object.getState().transform;
      expect(transform.position.x).toBe(50);
      expect(transform.rotation.z).toBe(90);
      expect(transform.scale.x).toBe(1.5);
      expect(transform.opacity).toBe(0.75);
    });
  });

  describe('Animation Composition', () => {
    let fadeAnim: FadeInAnimation;
    let moveAnim: MoveAnimation;
    let rotateAnim: RotateAnimation;

    beforeEach(() => {
      fadeAnim = new FadeInAnimation(mockObject, { duration: 1, easing: smooth });
      moveAnim = new MoveAnimation(mockObject, { x: 100, y: 0, z: 0 }, {
        duration: 1,
        easing: smooth,
      });
      rotateAnim = new RotateAnimation(mockObject, 'z', 90, {
        duration: 1,
        easing: smooth,
      });
    });

    describe('Parallel Composition', () => {
      it('should execute animations simultaneously', () => {
        const group = new AnimationGroup(
          mockObject,
          [fadeAnim, moveAnim, rotateAnim],
          CompositionType.Parallel
        );

        const result = group.interpolate(0.5);
        const state = result.object.getState();

        expect(state.transform.opacity).toBeCloseTo(0.5, 5);
        expect(state.transform.position.x).toBe(50);
        expect(state.transform.rotation.z).toBe(45);
      });

      it('should complete when all animations complete', () => {
        const group = new AnimationGroup(
          mockObject,
          [fadeAnim, moveAnim],
          CompositionType.Parallel
        );

        expect(group.interpolate(1).complete).toBe(true);
        expect(group.interpolate(0.5).complete).toBe(false);
      });

      it('should have duration equal to longest animation', () => {
        const shortAnim = new FadeInAnimation(mockObject, { duration: 0.5, easing: smooth });
        const longAnim = new MoveAnimation(mockObject, { x: 100, y: 0, z: 0 }, {
          duration: 2,
          easing: smooth,
        });

        const group = new AnimationGroup(
          mockObject,
          [shortAnim, longAnim],
          CompositionType.Parallel
        );

        expect(group.getTotalDuration()).toBe(2);
      });
    });

    describe('Sequence Composition', () => {
      it('should execute animations sequentially', () => {
        const group = new AnimationGroup(
          mockObject,
          [fadeAnim, moveAnim],
          CompositionType.Sequence
        );

        // At halfway point, first animation should be done, second starting
        const result = group.interpolate(0.75); // 0.5 + 0.25
        const state = result.object.getState();

        expect(state.transform.opacity).toBe(1); // First animation complete
        expect(state.transform.position.x).toBeGreaterThan(0); // Second animation started
      });

      it('should have duration equal to sum of animations', () => {
        const group = new AnimationGroup(
          mockObject,
          [fadeAnim, moveAnim, rotateAnim],
          CompositionType.Sequence
        );

        expect(group.getTotalDuration()).toBe(3);
      });

      it('should complete only after all animations complete', () => {
        const group = new AnimationGroup(
          mockObject,
          [fadeAnim, moveAnim],
          CompositionType.Sequence
        );

        expect(group.interpolate(1).complete).toBe(false);
        expect(group.interpolate(2).complete).toBe(true);
      });
    });

    describe('Lagged Composition', () => {
      it('should execute animations with staggered starts', () => {
        const group = new AnimationGroup(
          mockObject,
          [fadeAnim, moveAnim, rotateAnim],
          CompositionType.Lagged
        );

        const result = group.interpolate(0.15); // Second animation should start at 0.1
        const state = result.object.getState();

        expect(state.transform.opacity).toBeGreaterThan(0); // First started
        expect(state.transform.position.x).toBeGreaterThan(0); // Second started
      });

      it('should have duration based on longest animation plus lag', () => {
        const group = new AnimationGroup(
          mockObject,
          [fadeAnim, moveAnim, rotateAnim],
          CompositionType.Lagged
        );

        // Duration is max animation duration + (count - 1) * lag
        expect(group.getTotalDuration()).toBeGreaterThan(1);
      });
    });
  });

  describe('Animation Builder', () => {
    it('should build animation with default config', () => {
      const builder = new AnimationBuilder(
        FadeInAnimation,
        mockObject,
        {}
      );
      const animation = builder.build();

      expect(animation.config.duration).toBe(1);
      expect(animation.config.easing).toBe(smooth);
    });

    it('should build animation with custom duration', () => {
      const animation = AnimationBuilder.animate(FadeInAnimation, mockObject)
        .withDuration(2)
        .build();

      expect(animation.config.duration).toBe(2);
    });

    it('should build animation with custom easing', () => {
      const customEasing = (t: Alpha) => t * t;
      const animation = AnimationBuilder.animate(FadeInAnimation, mockObject)
        .withEasing(customEasing)
        .build();

      expect(animation.config.easing).toBe(customEasing);
    });

    it('should build animation with delay', () => {
      const animation = AnimationBuilder.animate(FadeInAnimation, mockObject)
        .withDelay(0.5)
        .build();

      expect(animation.config.delay).toBe(0.5);
      expect(animation.getTotalDuration()).toBe(1.5);
    });

    it('should build animation with remove on complete flag', () => {
      const animation = AnimationBuilder.animate(FadeInAnimation, mockObject)
        .removeOnComplete(true)
        .build();

      expect(animation.config.removeOnComplete).toBe(true);
    });

    it('should build animation with custom name', () => {
      const animation = AnimationBuilder.animate(FadeInAnimation, mockObject)
        .withName('my-fade')
        .build();

      expect(animation.config.name).toBe('my-fade');
    });

    it('should support fluent chaining', () => {
      const animation = AnimationBuilder.animate(FadeInAnimation, mockObject)
        .withDuration(2)
        .withEasing(smooth)
        .withDelay(0.5)
        .removeOnComplete()
        .withName('chained-animation')
        .build();

      expect(animation.config.duration).toBe(2);
      expect(animation.config.delay).toBe(0.5);
      expect(animation.config.removeOnComplete).toBe(true);
      expect(animation.config.name).toBe('chained-animation');
    });

    it('should create new builder instance on each method call', () => {
      const builder1 = AnimationBuilder.animate(FadeInAnimation, mockObject);
      const builder2 = builder1.withDuration(2);
      const builder3 = builder1.withDuration(3);

      expect(builder1).not.toBe(builder2);
      expect(builder2).not.toBe(builder3);

      const anim2 = builder2.build();
      const anim3 = builder3.build();

      expect(anim2.config.duration).toBe(2);
      expect(anim3.config.duration).toBe(3);
    });
  });

  describe('Timeline', () => {
    let timeline: Timeline;

    beforeEach(() => {
      timeline = new Timeline();
    });

    it('should start with zero duration', () => {
      expect(timeline.getDuration()).toBe(0);
    });

    it('should add marker at specific time', () => {
      const updated = timeline.addMarker(1.5, { label: 'test' });

      expect(updated.getDuration()).toBe(1.5);
      expect(updated.getEvents()).toHaveLength(1);
      expect(updated.getEvents()[0].type).toBe('marker');
    });

    it('should add animation with start and end events', () => {
      const animation = new FadeInAnimation(mockObject, { duration: 1, easing: smooth });
      const updated = timeline.addAnimation(animation, 2);

      expect(updated.getDuration()).toBe(3);
      expect(updated.getEvents()).toHaveLength(2);
    });

    it('should get events in time range', () => {
      const animation = new FadeInAnimation(mockObject, { duration: 1, easing: smooth });
      const updated = timeline
        .addMarker(1)
        .addMarker(2)
        .addMarker(3)
        .addAnimation(animation, 4);

      const events = updated.getEventsInRange(1.5, 2.5);

      expect(events).toHaveLength(1);
      expect(events[0].time).toBe(2);
    });

    it('should handle empty time range', () => {
      const updated = timeline.addMarker(1, { data: 'test' });
      const events = updated.getEventsInRange(2, 3);

      expect(events).toHaveLength(0);
    });

    it('should include events at range boundaries', () => {
      const updated = timeline.addMarker(1).addMarker(2).addMarker(3);
      const events = updated.getEventsInRange(1, 3);

      expect(events).toHaveLength(3);
    });

    it('should create independent timeline on mutation', () => {
      const timeline1 = timeline.addMarker(1);
      const timeline2 = timeline1.addMarker(2);

      expect(timeline1.getEvents()).toHaveLength(1);
      expect(timeline2.getEvents()).toHaveLength(2);
      expect(timeline.getEvents()).toHaveLength(0);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero duration animation', () => {
      const config = { duration: 0, easing: smooth };
      const animation = new FadeInAnimation(mockObject, config);

      const result = animation.interpolate(0);
      expect(result.complete).toBe(true);
    });

    it('should handle negative elapsed time', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);
      const result = animation.interpolate(-1);

      expect(result.object).toBe(mockObject);
      expect(result.complete).toBe(false);
    });

    it('should handle very large duration', () => {
      const config = { duration: Number.MAX_SAFE_INTEGER / 1000, easing: smooth };
      const animation = new FadeInAnimation(mockObject, config);

      expect(animation.getTotalDuration()).toBeGreaterThan(0);
    });

    it('should handle NaN duration', () => {
      const config = { duration: NaN, easing: smooth };
      const animation = new FadeInAnimation(mockObject, config);

      const result = animation.interpolate(0.5);
      expect(result.object.getState().transform.opacity).toBeNaN();
    });

    it('should handle infinite duration', () => {
      const config = { duration: Infinity, easing: smooth };
      const animation = new FadeInAnimation(mockObject, config);

      expect(animation.getTotalDuration()).toBe(Infinity);
    });

    it('should handle animation with zero delay', () => {
      const config: AnimationConfig = { duration: 1, easing: smooth, delay: 0 };
      const animation = new FadeInAnimation(mockObject, config);

      expect(animation.getTotalDuration()).toBe(1);
    });

    it('should handle negative delay', () => {
      const config: AnimationConfig = { duration: 1, easing: smooth, delay: -0.5 };
      const animation = new FadeInAnimation(mockObject, config);

      expect(animation.getTotalDuration()).toBe(0.5);
    });
  });

  describe('Immutability', () => {
    it('should not mutate target object', () => {
      const originalState = mockObject.getState();
      const animation = new FadeInAnimation(mockObject, defaultConfig);

      animation.interpolate(0.5);

      expect(mockObject.getState()).toEqual(originalState);
    });

    it('should return new objects from interpolation', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);

      const result1 = animation.interpolate(0.5);
      const result2 = animation.interpolate(0.5);

      expect(result1.object).not.toBe(result2.object);
      expect(result1.object).not.toBe(mockObject);
    });
  });

  describe('Remove on Complete', () => {
    it('should return correct remover flag', () => {
      const config: AnimationConfig = {
        duration: 1,
        easing: smooth,
        removeOnComplete: true,
      };
      const animation = new FadeInAnimation(mockObject, config);

      expect(animation.isRemover()).toBe(true);
    });

    it('should default to not removing', () => {
      const animation = new FadeInAnimation(mockObject, defaultConfig);

      expect(animation.isRemover()).toBe(false);
    });
  });
});
