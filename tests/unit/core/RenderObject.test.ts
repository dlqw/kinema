/**
 * Unit tests for RenderObject and its subclasses
 * Tests immutable update patterns, bounding boxes, and point containment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RenderObject,
  generateObjectId,
  DEFAULT_TRANSFORM,
  type RenderObjectState,
  type Transform,
  type Point3D,
  type BoundingBox,
} from '../../../packages/core/src/types/core';

// Mock implementation of a concrete render object for testing
class TestRectangle extends RenderObject {
  constructor(
    state: RenderObjectState,
    private readonly width: number,
    private readonly height: number
  ) {
    super(state);
  }

  getState(): RenderObjectState {
    return { ...this.state };
  }

  withTransform(transform: Partial<Transform>): RenderObject {
    const newTransform = { ...this.state.transform, ...transform };
    const newState: RenderObjectState = {
      ...this.state,
      transform: newTransform,
    };
    return new TestRectangle(newState, this.width, this.height);
  }

  getBoundingBox(): BoundingBox {
    const pos = this.state.transform.position;
    const halfW = this.width / 2;
    const halfH = this.height / 2;

    return {
      min: { x: pos.x - halfW, y: pos.y - halfH, z: pos.z },
      max: { x: pos.x + halfW, y: pos.y + halfH, z: pos.z },
      center: { x: pos.x, y: pos.y, z: pos.z },
    };
  }

  containsPoint(point: Point3D): boolean {
    const box = this.getBoundingBox();
    return (
      point.x >= box.min.x &&
      point.x <= box.max.x &&
      point.y >= box.min.y &&
      point.y <= box.max.y &&
      point.z === box.min.z
    );
  }

  withZIndex(z: number): RenderObject {
    const newState: RenderObjectState = { ...this.state, z_index: z };
    return new TestRectangle(newState, this.width, this.height);
  }

  withVisibility(visible: boolean): RenderObject {
    const newState: RenderObjectState = { ...this.state, visible };
    return new TestRectangle(newState, this.width, this.height);
  }

  withStyle(key: string, value: unknown): RenderObject {
    const newStyles = new Map(this.state.styles);
    newStyles.set(key, value);
    const newState: RenderObjectState = { ...this.state, styles: newStyles };
    return new TestRectangle(newState, this.width, this.height);
  }
}

// Mock circle implementation
class TestCircle extends RenderObject {
  constructor(state: RenderObjectState, private readonly radius: number) {
    super(state);
  }

  getState(): RenderObjectState {
    return { ...this.state };
  }

  withTransform(transform: Partial<Transform>): RenderObject {
    const newTransform = { ...this.state.transform, ...transform };
    const newState: RenderObjectState = {
      ...this.state,
      transform: newTransform,
    };
    return new TestCircle(newState, this.radius);
  }

  getBoundingBox(): BoundingBox {
    const pos = this.state.transform.position;
    return {
      min: { x: pos.x - this.radius, y: pos.y - this.radius, z: pos.z },
      max: { x: pos.x + this.radius, y: pos.y + this.radius, z: pos.z },
      center: { x: pos.x, y: pos.y, z: pos.z },
    };
  }

  containsPoint(point: Point3D): boolean {
    const pos = this.state.transform.position;
    const dx = point.x - pos.x;
    const dy = point.y - pos.y;
    return dx * dx + dy * dy <= this.radius * this.radius && point.z === pos.z;
  }

  withZIndex(z: number): RenderObject {
    const newState: RenderObjectState = { ...this.state, z_index: z };
    return new TestCircle(newState, this.radius);
  }

  withVisibility(visible: boolean): RenderObject {
    const newState: RenderObjectState = { ...this.state, visible };
    return new TestCircle(newState, this.radius);
  }

  withStyle(key: string, value: unknown): RenderObject {
    const newStyles = new Map(this.state.styles);
    newStyles.set(key, value);
    const newState: RenderObjectState = { ...this.state, styles: newStyles };
    return new TestCircle(newState, this.radius);
  }
}

describe('RenderObject', () => {
  let defaultState: RenderObjectState;
  let rectangle: TestRectangle;

  beforeEach(() => {
    defaultState = {
      id: generateObjectId('rect'),
      transform: { ...DEFAULT_TRANSFORM },
      visible: true,
      z_index: 0,
      styles: new Map(),
    };
    rectangle = new TestRectangle(defaultState, 100, 50);
  });

  describe('Constructor and State', () => {
    it('should create a render object with default state', () => {
      expect(rectangle.id).toBeDefined();
      expect(rectangle.visible).toBe(true);
      expect(rectangle.zIndex).toBe(0);
      expect(rectangle.transform).toEqual(DEFAULT_TRANSFORM);
    });

    it('should return a copy of state via getState()', () => {
      const state1 = rectangle.getState();
      const state2 = rectangle.getState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Different references
    });

    it('should have a unique ID', () => {
      const rect2 = new TestRectangle(
        { ...defaultState, id: generateObjectId('rect') },
        100,
        50
      );

      expect(rectangle.id).not.toBe(rect2.id);
    });
  });

  describe('Immutable Transform Updates', () => {
    it('should create a new instance with updated position', () => {
      const updated = rectangle.withPosition(10, 20, 5);

      expect(updated).not.toBe(rectangle);
      expect(updated.transform.position).toEqual({ x: 10, y: 20, z: 5 });
      expect(rectangle.transform.position).toEqual({ x: 0, y: 0, z: 0 }); // Original unchanged
    });

    it('should create a new instance with updated rotation', () => {
      const updated = rectangle.withRotation(45, 90, 180);

      expect(updated.transform.rotation).toEqual({ x: 45, y: 90, z: 180 });
      expect(rectangle.transform.rotation).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should create a new instance with updated scale', () => {
      const updated = rectangle.withScale(2, 3, 1);

      expect(updated.transform.scale).toEqual({ x: 2, y: 3, z: 1 });
      expect(rectangle.transform.scale).toEqual({ x: 1, y: 1, z: 1 });
    });

    it('should create a new instance with updated opacity', () => {
      const updated = rectangle.withOpacity(0.5);

      expect(updated.transform.opacity).toBe(0.5);
      expect(rectangle.transform.opacity).toBe(1);
    });

    it('should clamp opacity to [0, 1]', () => {
      const clamped1 = rectangle.withOpacity(-0.5);
      const clamped2 = rectangle.withOpacity(1.5);

      expect(clamped1.transform.opacity).toBe(0);
      expect(clamped2.transform.opacity).toBe(1);
    });

    it('should support chaining transform updates', () => {
      const updated = rectangle
        .withPosition(10, 20)
        .withRotation(45)
        .withScale(2)
        .withOpacity(0.7);

      expect(updated.transform.position).toEqual({ x: 10, y: 20, z: 0 });
      expect(updated.transform.rotation).toEqual({ x: 45, y: 0, z: 0 });
      expect(updated.transform.scale).toEqual({ x: 2, y: 1, z: 1 });
      expect(updated.transform.opacity).toBe(0.7);
    });
  });

  describe('Visibility Control', () => {
    it('should create a visible copy with show()', () => {
      const hidden = new TestRectangle({ ...defaultState, visible: false }, 100, 50);
      const visible = hidden.show();

      expect(visible.visible).toBe(true);
      expect(hidden.visible).toBe(false);
    });

    it('should create a hidden copy with hide()', () => {
      const hidden = rectangle.hide();

      expect(hidden.visible).toBe(false);
      expect(rectangle.visible).toBe(true);
    });

    it('should create a copy with specific visibility', () => {
      const hidden = rectangle.withVisibility(false);

      expect(hidden.visible).toBe(false);
      expect(rectangle.visible).toBe(true);
    });
  });

  describe('Z-Index Management', () => {
    it('should create a copy with new z-index', () => {
      const updated = rectangle.withZIndex(10);

      expect(updated.zIndex).toBe(10);
      expect(rectangle.zIndex).toBe(0);
    });
  });

  describe('Style Management', () => {
    it('should create a copy with new style property', () => {
      const styled = rectangle.withStyle('fill', '#ff0000');

      expect(styled.getState().styles.get('fill')).toBe('#ff0000');
      expect(rectangle.getState().styles.has('fill')).toBe(false);
    });

    it('should update existing style property', () => {
      const styled1 = rectangle.withStyle('fill', '#ff0000');
      const styled2 = styled1.withStyle('fill', '#00ff00');

      expect(styled2.getState().styles.get('fill')).toBe('#00ff00');
      expect(styled1.getState().styles.get('fill')).toBe('#ff0000');
    });
  });

  describe('Bounding Box Calculation', () => {
    it('should calculate correct bounding box for rectangle at origin', () => {
      const box = rectangle.getBoundingBox();

      expect(box.min).toEqual({ x: -50, y: -25, z: 0 });
      expect(box.max).toEqual({ x: 50, y: 25, z: 0 });
      expect(box.center).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should calculate correct bounding box for rectangle at position', () => {
      const positioned = rectangle.withPosition(100, 200, 5);
      const box = positioned.getBoundingBox();

      expect(box.min).toEqual({ x: 50, y: 175, z: 5 });
      expect(box.max).toEqual({ x: 150, y: 225, z: 5 });
      expect(box.center).toEqual({ x: 100, y: 200, z: 5 });
    });

    it('should calculate correct bounding box for circle', () => {
      const circle = new TestCircle(defaultState, 50);
      const box = circle.getBoundingBox();

      expect(box.min).toEqual({ x: -50, y: -50, z: 0 });
      expect(box.max).toEqual({ x: 50, y: 50, z: 0 });
      expect(box.center).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('Point Containment', () => {
    it('should detect point inside rectangle at origin', () => {
      expect(rectangle.containsPoint({ x: 0, y: 0, z: 0 })).toBe(true);
      expect(rectangle.containsPoint({ x: 25, y: 10, z: 0 })).toBe(true);
      expect(rectangle.containsPoint({ x: -40, y: -20, z: 0 })).toBe(true);
    });

    it('should detect point outside rectangle at origin', () => {
      expect(rectangle.containsPoint({ x: 60, y: 0, z: 0 })).toBe(false);
      expect(rectangle.containsPoint({ x: 0, y: 30, z: 0 })).toBe(false);
      expect(rectangle.containsPoint({ x: 0, y: 0, z: 1 })).toBe(false);
    });

    it('should detect point inside positioned rectangle', () => {
      const positioned = rectangle.withPosition(100, 200, 5);

      expect(positioned.containsPoint({ x: 100, y: 200, z: 5 })).toBe(true);
      expect(positioned.containsPoint({ x: 125, y: 210, z: 5 })).toBe(true);
      expect(positioned.containsPoint({ x: 100, y: 200, z: 0 })).toBe(false);
    });

    it('should detect point inside circle', () => {
      const circle = new TestCircle(defaultState, 50);

      expect(circle.containsPoint({ x: 0, y: 0, z: 0 })).toBe(true);
      expect(circle.containsPoint({ x: 25, y: 25, z: 0 })).toBe(true);
      expect(circle.containsPoint({ x: 0, y: 50, z: 0 })).toBe(true);
    });

    it('should detect point outside circle', () => {
      const circle = new TestCircle(defaultState, 50);

      expect(circle.containsPoint({ x: 40, y: 40, z: 0 })).toBe(false);
      expect(circle.containsPoint({ x: 0, y: 51, z: 0 })).toBe(false);
    });

    it('should handle edge cases on bounding box', () => {
      expect(rectangle.containsPoint({ x: 50, y: 25, z: 0 })).toBe(true);
      expect(rectangle.containsPoint({ x: -50, y: -25, z: 0 })).toBe(true);
      expect(rectangle.containsPoint({ x: 50.1, y: 25, z: 0 })).toBe(false);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero-sized rectangle', () => {
      const zeroRect = new TestRectangle(defaultState, 0, 0);

      expect(zeroRect.getBoundingBox().min).toEqual({ x: 0, y: 0, z: 0 });
      expect(zeroRect.getBoundingBox().max).toEqual({ x: 0, y: 0, z: 0 });
      expect(zeroRect.containsPoint({ x: 0, y: 0, z: 0 })).toBe(true);
      expect(zeroRect.containsPoint({ x: 0.1, y: 0, z: 0 })).toBe(false);
    });

    it('should handle negative dimensions', () => {
      const negativeRect = new TestRectangle(defaultState, -100, -50);

      // Bounding box should handle negative values
      const box = negativeRect.getBoundingBox();
      expect(box.min.x).toBeGreaterThan(box.max.x);
    });

    it('should handle very large coordinates', () => {
      const large = rectangle.withPosition(Number.MAX_SAFE_INTEGER, 0, 0);

      expect(() => large.getBoundingBox()).not.toThrow();
    });

    it('should handle NaN values gracefully', () => {
      const nanRect = rectangle.withPosition(NaN, NaN, NaN);

      expect(nanRect.transform.position.x).toBeNaN();
    });

    it('should handle infinity values', () => {
      const infRect = rectangle.withPosition(Infinity, -Infinity, 0);

      expect(infRect.transform.position.x).toBe(Infinity);
      expect(infRect.transform.position.y).toBe(-Infinity);
    });
  });

  describe('Immutability Verification', () => {
    it('should not mutate original object when updating', () => {
      const originalState = rectangle.getState();
      rectangle.withPosition(10, 20).withRotation(45).withScale(2);

      expect(rectangle.getState()).toEqual(originalState);
    });

    it('should create independent copies', () => {
      const copy1 = rectangle.withPosition(10, 20);
      const copy2 = copy1.withRotation(45);

      expect(copy2.transform.position).toEqual({ x: 10, y: 20, z: 0 });
      expect(copy1.transform.rotation).toEqual({ x: 0, y: 0, z: 0 });
    });
  });
});
