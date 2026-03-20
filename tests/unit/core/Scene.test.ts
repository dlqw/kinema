/**
 * Unit tests for Scene and scene management functionality
 * Tests object management, time progression, animation scheduling, and snapshots
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Scene,
  SceneBuilder,
  createScene,
  sceneBuilder,
  DEFAULT_SCENE_CONFIG,
  type SceneConfig,
  type SceneSnapshot,
} from '../../../packages/core/src/types/scene';
import {
  type RenderObjectState,
  DEFAULT_TRANSFORM,
  generateObjectId,
  type Point3D,
} from '../../../packages/core/src/types/core';
import { FadeInAnimation, MoveAnimation, smooth } from '../../../packages/core/src/types/animation';

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

  withPosition(x: number, y: number, z: number = 0): MockRenderObject {
    return this.withTransform({ position: { x, y, z } });
  }

  withOpacity(opacity: number): MockRenderObject {
    return this.withTransform({ opacity });
  }

  getBoundingBox() {
    return {
      min: { x: 0, y: 0, z: 0 } as Point3D,
      max: { x: 0, y: 0, z: 0 } as Point3D,
      center: { x: 0, y: 0, z: 0 } as Point3D,
    };
  }

  containsPoint(point: Point3D): boolean {
    const pos = this.state.transform.position;
    return point.x === pos.x && point.y === pos.y && point.z === pos.z;
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

describe('Scene', () => {
  let scene: Scene;
  let testObject1: MockRenderObject;
  let testObject2: MockRenderObject;
  let testObject3: MockRenderObject;

  beforeEach(() => {
    scene = createScene();

    const state1: RenderObjectState = {
      id: generateObjectId('obj1'),
      transform: { ...DEFAULT_TRANSFORM },
      visible: true,
      z_index: 1,
      styles: new Map(),
    };

    const state2: RenderObjectState = {
      id: generateObjectId('obj2'),
      transform: { ...DEFAULT_TRANSFORM, position: { x: 100, y: 100, z: 0 } },
      visible: true,
      z_index: 0,
      styles: new Map(),
    };

    const state3: RenderObjectState = {
      id: generateObjectId('obj3'),
      transform: { ...DEFAULT_TRANSFORM, position: { x: 50, y: 50, z: 0 } },
      visible: true,
      z_index: 2,
      styles: new Map(),
    };

    testObject1 = new MockRenderObject(state1);
    testObject2 = new MockRenderObject(state2);
    testObject3 = new MockRenderObject(state3);
  });

  describe('Scene Creation and Configuration', () => {
    it('should create scene with default config', () => {
      expect(scene.config).toEqual(DEFAULT_SCENE_CONFIG);
      expect(scene.config.width).toBe(1920);
      expect(scene.config.height).toBe(1080);
      expect(scene.config.fps).toBe(60);
    });

    it('should create scene with custom config', () => {
      const customConfig: Partial<SceneConfig> = {
        width: 1280,
        height: 720,
        fps: 30,
        backgroundColor: '#ffffff',
      };
      const customScene = createScene(customConfig);

      expect(customScene.config.width).toBe(1280);
      expect(customScene.config.height).toBe(720);
      expect(customScene.config.fps).toBe(30);
      expect(customScene.config.backgroundColor).toBe('#ffffff');
    });

    it('should have a unique ID', () => {
      const scene2 = createScene();

      expect(scene.id).toBeDefined();
      expect(scene2.id).toBeDefined();
      expect(scene.id).not.toBe(scene2.id);
    });

    it('should start at time 0', () => {
      expect(scene.getTime()).toBe(0);
    });

    it('should have no objects initially', () => {
      expect(scene.getObjects()).toHaveLength(0);
    });
  });

  describe('Object Management', () => {
    it('should add a single object', () => {
      const updated = scene.addObject(testObject1);

      expect(updated.getObjects()).toHaveLength(1);
      expect(updated.getObjects()[0]).toBe(testObject1);
      expect(scene.getObjects()).toHaveLength(0); // Original unchanged
    });

    it('should add multiple objects', () => {
      const updated = scene.addObjects(testObject1, testObject2, testObject3);

      expect(updated.getObjects()).toHaveLength(3);
    });

    it('should get object by ID', () => {
      const updated = scene.addObject(testObject1);

      expect(updated.getObject(testObject1.getState().id)).toBe(testObject1);
    });

    it('should return undefined for non-existent object', () => {
      expect(scene.getObject('non-existent' as any)).toBeUndefined();
    });

    it('should remove a single object', () => {
      const withObjects = scene.addObjects(testObject1, testObject2);
      const removed = withObjects.removeObject(testObject1.getState().id);

      expect(removed.getObjects()).toHaveLength(1);
      expect(removed.getObject(testObject1.getState().id)).toBeUndefined();
    });

    it('should remove multiple objects', () => {
      const withObjects = scene.addObjects(testObject1, testObject2, testObject3);
      const removed = withObjects.removeObjects(
        testObject1.getState().id,
        testObject2.getState().id
      );

      expect(removed.getObjects()).toHaveLength(1);
      expect(removed.getObject(testObject3.getState().id)).toBeDefined();
    });

    it('should clear all objects', () => {
      const withObjects = scene.addObjects(testObject1, testObject2, testObject3);
      const cleared = withObjects.clear();

      expect(cleared.getObjects()).toHaveLength(0);
    });

    it('should sort objects by z-index', () => {
      const updated = scene.addObjects(testObject1, testObject2, testObject3);
      const objects = updated.getObjects();

      expect(objects[0].getState().z_index).toBe(0); // testObject2
      expect(objects[1].getState().z_index).toBe(1); // testObject1
      expect(objects[2].getState().z_index).toBe(2); // testObject3
    });

    it('should handle adding object with existing ID (replace)', () => {
      const withObject1 = scene.addObject(testObject1);
      const modifiedObject1 = testObject1.withPosition(50, 50);
      const withModified = withObject1.addObject(modifiedObject1 as any);

      expect(withModified.getObjects()).toHaveLength(1);
      expect(withModified.getObject(testObject1.getState().id)?.getState().position.x).toBe(50);
    });
  });

  describe('Time Progression', () => {
    it('should update scene time', () => {
      const updated = scene.updateTo(1);

      expect(updated.getTime()).toBe(1);
      expect(scene.getTime()).toBe(0); // Original unchanged
    });

    it('should not update when target time is earlier', () => {
      const forward = scene.updateTo(1);
      const backward = forward.updateTo(0.5);

      expect(backward.getTime()).toBe(1); // Should not go backward
    });

    it('should not update when target time is same', () => {
      const updated = scene.updateTo(0);

      expect(updated.getTime()).toBe(0);
    });

    it('should return same instance when time does not advance', () => {
      const sameTime = scene.updateTo(0);

      expect(sameTime).toBe(scene);
    });
  });

  describe('Animation Scheduling', () => {
    it('should schedule animation with delay', () => {
      const animation = new FadeInAnimation(testObject1, { duration: 1, easing: smooth });
      const scheduled = scene.schedule(animation, 0.5);

      expect(scheduled.getTime()).toBe(0); // Time hasn't advanced yet
    });

    it('should schedule animation without delay', () => {
      const animation = new FadeInAnimation(testObject1, { duration: 1, easing: smooth });
      const scheduled = scene.schedule(animation);

      expect(scheduled).toBeDefined();
    });

    it('should schedule multiple animations simultaneously', () => {
      const anim1 = new FadeInAnimation(testObject1, { duration: 1, easing: smooth });
      const anim2 = new MoveAnimation(testObject2, { x: 100, y: 0, z: 0 }, {
        duration: 1,
        easing: smooth,
      });

      const scheduled = scene.scheduleAll([anim1, anim2]);

      expect(scheduled).toBeDefined();
    });

    it('should activate scheduled animations when time advances', () => {
      const animation = new FadeInAnimation(testObject1, { duration: 1, easing: smooth });
      const scheduled = scene.schedule(animation, 0);
      const updated = scheduled.updateTo(0.5);

      // Object should have been updated by animation
      const obj = updated.getObject(testObject1.getState().id);
      expect(obj?.getState().transform.opacity).toBeCloseTo(0.5, 5);
    });

    it('should respect animation delay before starting', () => {
      const animation = new FadeInAnimation(testObject1, { duration: 1, easing: smooth });
      const scheduled = scene.schedule(animation, 0.5);
      const updated = scheduled.updateTo(0.3);

      // Object should not have changed yet (still in delay period)
      const obj = updated.getObject(testObject1.getState().id);
      expect(obj?.getState().transform.opacity).toBe(1); // Original opacity
    });

    it('should complete animation at end of duration', () => {
      const animation = new FadeInAnimation(testObject1, { duration: 1, easing: smooth });
      const withObject = scene.addObject(testObject1);
      const scheduled = withObject.schedule(animation);
      const updated = scheduled.updateTo(1);

      const obj = updated.getObject(testObject1.getState().id);
      expect(obj?.getState().transform.opacity).toBeCloseTo(1, 5);
    });

    it('should handle animation that removes object on complete', () => {
      const config = { duration: 1, easing: smooth, removeOnComplete: true };
      const animation = new FadeInAnimation(testObject1, config);
      const withObject = scene.addObject(testObject1);
      const scheduled = withObject.schedule(animation);
      const updated = scheduled.updateTo(1);

      expect(updated.getObject(testObject1.getState().id)).toBeUndefined();
    });
  });

  describe('Scene Snapshots', () => {
    it('should create snapshot of current state', () => {
      const withObjects = scene.addObjects(testObject1, testObject2);
      const snapshot = withObjects.createSnapshot();

      expect(snapshot.time).toBe(0);
      expect(snapshot.objects).toHaveLength(2);
      expect(snapshot.objects).toContain(testObject1);
      expect(snapshot.objects).toContain(testObject2);
    });

    it('should restore from snapshot', () => {
      const withObjects = scene.addObjects(testObject1, testObject2);
      const snapshot = withObjects.createSnapshot();

      const cleared = withObjects.clear();
      expect(cleared.getObjects()).toHaveLength(0);

      const restored = cleared.restoreFromSnapshot(snapshot);
      expect(restored.getObjects()).toHaveLength(2);
    });

    it('should restore scene time from snapshot', () => {
      const advanced = scene.updateTo(5);
      const snapshot = advanced.createSnapshot();

      const restored = scene.restoreFromSnapshot(snapshot);
      expect(restored.getTime()).toBe(5);
    });

    it('should create independent snapshot', () => {
      const withObjects = scene.addObject(testObject1);
      const snapshot = withObjects.createSnapshot();

      // Modify scene after snapshot
      const modified = withObjects.addObject(testObject2);

      // Snapshot should be unchanged
      expect(snapshot.objects).toHaveLength(1);
      expect(snapshot.objects[0]).toBe(testObject1);
    });
  });

  describe('Point Finding', () => {
    it('should find objects at a point', () => {
      const withObjects = scene.addObjects(testObject1, testObject2, testObject3);
      const point = { x: 100, y: 100, z: 0 };

      const found = withObjects.findObjectsAtPoint(point);

      expect(found).toContain(testObject2);
    });

    it('should return empty array when no objects at point', () => {
      const withObjects = scene.addObjects(testObject1, testObject2);
      const point = { x: 999, y: 999, z: 0 };

      const found = withObjects.findObjectsAtPoint(point);

      expect(found).toHaveLength(0);
    });

    it('should return topmost object at point', () => {
      const withObjects = scene.addObjects(testObject1, testObject2, testObject3);
      const point = { x: 0, y: 0, z: 0 };

      const topmost = withObjects.getObjectAtPoint(point);

      expect(topmost).toBeDefined();
    });

    it('should return undefined when no object at point', () => {
      const point = { x: 999, y: 999, z: 0 };

      const topmost = scene.getObjectAtPoint(point);

      expect(topmost).toBeUndefined();
    });

    it('should handle z-index when finding topmost object', () => {
      // Objects with same position, different z-index
      const obj1 = new MockRenderObject({
        id: generateObjectId('obj'),
        transform: { ...DEFAULT_TRANSFORM, position: { x: 50, y: 50, z: 0 } },
        visible: true,
        z_index: 0,
        styles: new Map(),
      });

      const obj2 = new MockRenderObject({
        id: generateObjectId('obj'),
        transform: { ...DEFAULT_TRANSFORM, position: { x: 50, y: 50, z: 0 } },
        visible: true,
        z_index: 10,
        styles: new Map(),
      });

      const withObjects = scene.addObjects(obj1 as any, obj2 as any);
      const point = { x: 50, y: 50, z: 0 };

      const topmost = withObjects.getObjectAtPoint(point);

      expect(topmost?.getState().z_index).toBe(10);
    });
  });

  describe('Scene State', () => {
    it('should get current scene state', () => {
      const withObjects = scene.addObjects(testObject1, testObject2);
      const advanced = withObjects.updateTo(1);

      const state = advanced.getState();

      expect(state.time).toBe(1);
      expect(state.objects.size).toBe(2);
    });

    it('should return immutable state', () => {
      const withObjects = scene.addObject(testObject1);
      const state = withObjects.getState();

      // State should be a ReadonlyMap
      expect(state.objects).toBeInstanceOf(Map);
    });
  });

  describe('Scene Builder', () => {
    it('should build scene with fluent API', () => {
      const builtScene = sceneBuilder()
        .withDimensions(1280, 720)
        .withBackgroundColor('#ff0000')
        .withFps(30)
        .build('test-scene');

      expect(builtScene.config.width).toBe(1280);
      expect(builtScene.config.height).toBe(720);
      expect(builtScene.config.backgroundColor).toBe('#ff0000');
      expect(builtScene.config.fps).toBe(30);
      expect(builtScene.id).toBe('test-scene');
    });

    it('should use default values for unspecified config', () => {
      const builtScene = sceneBuilder().withDimensions(800, 600).build();

      expect(builtScene.config.width).toBe(800);
      expect(builtScene.config.height).toBe(600);
      expect(builtScene.config.fps).toBe(60); // Default
    });

    it('should create new builder instance on each call', () => {
      const builder1 = sceneBuilder();
      const builder2 = sceneBuilder();

      expect(builder1).not.toBe(builder2);
    });

    it('should support method chaining', () => {
      const builder = sceneBuilder();

      const result = builder
        .withDimensions(1280, 720)
        .withBackgroundColor('#ffffff')
        .withFps(30);

      expect(result).toBe(builder); // Builder returns itself
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty scene operations', () => {
      const empty = createScene();

      expect(empty.getObjects()).toHaveLength(0);
      expect(empty.updateTo(10).getObjects()).toHaveLength(0);
      expect(empty.clear().getObjects()).toHaveLength(0);
    });

    it('should handle removing non-existent object', () => {
      const updated = scene.removeObject('non-existent' as any);

      expect(updated.getObjects()).toHaveLength(0);
    });

    it('should handle removing objects from empty scene', () => {
      const updated = scene.removeObjects(
        'id1' as any,
        'id2' as any,
        'id3' as any
      );

      expect(updated.getObjects()).toHaveLength(0);
    });

    it('should handle very large time values', () => {
      const updated = scene.updateTo(Number.MAX_SAFE_INTEGER);

      expect(updated.getTime()).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative time values', () => {
      const updated = scene.updateTo(-1);

      expect(updated.getTime()).toBe(0); // Should clamp to 0
    });

    it('should handle zero duration scenes', () => {
      const config: SceneConfig = { width: 100, height: 100, fps: 60 };
      const zeroScene = new Scene(config);

      expect(zeroScene.getTime()).toBe(0);
    });

    it('should handle multiple snapshots', () => {
      const snapshot1 = scene.createSnapshot();
      const withObject = scene.addObject(testObject1);
      const snapshot2 = withObject.createSnapshot();

      expect(snapshot1.time).toBe(0);
      expect(snapshot1.objects).toHaveLength(0);
      expect(snapshot2.time).toBe(0);
      expect(snapshot2.objects).toHaveLength(1);
    });
  });

  describe('Immutability', () => {
    it('should not mutate original scene when adding objects', () => {
      const updated = scene.addObject(testObject1);

      expect(scene.getObjects()).toHaveLength(0);
      expect(updated.getObjects()).toHaveLength(1);
    });

    it('should not mutate original scene when updating time', () => {
      const updated = scene.updateTo(5);

      expect(scene.getTime()).toBe(0);
      expect(updated.getTime()).toBe(5);
    });

    it('should create independent scene instances', () => {
      const scene1 = scene.addObject(testObject1);
      const scene2 = scene1.addObject(testObject2);

      expect(scene.getObjects()).toHaveLength(0);
      expect(scene1.getObjects()).toHaveLength(1);
      expect(scene2.getObjects()).toHaveLength(2);
    });

    it('should not affect original when scheduling animations', () => {
      const animation = new FadeInAnimation(testObject1, { duration: 1, easing: smooth });
      const scheduled = scene.schedule(animation);

      expect(scheduled).not.toBe(scene);
    });
  });
});
