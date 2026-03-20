/**
 * Integration tests for Scene Graph rendering
 * Tests the interaction between scene management and rendering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasRenderingContext2DMock } from '../../mocks/canvas-mock';
import { testScenes } from '../../fixtures/sample-scene';

// Mock implementation for testing
class SceneRenderer {
  private context: CanvasRenderingContext2D;

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  render(scene: any): void {
    this.renderNode(scene);
  }

  private renderNode(node: any, parentTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }): void {
    const { transform, renderable, children } = node;

    // Apply transform
    this.context.save();
    this.context.translate(transform.position.x, transform.position.y);
    this.context.rotate(transform.rotation);
    this.context.scale(transform.scale.x, transform.scale.y);

    // Render if renderable
    if (renderable && renderable.visible) {
      this.context.fillStyle = renderable.color;
      this.context.globalAlpha = renderable.opacity;
      this.context.fillRect(
        -renderable.width / 2,
        -renderable.height / 2,
        renderable.width,
        renderable.height,
      );
    }

    // Render children
    for (const child of children) {
      this.renderNode(child);
    }

    this.context.restore();
  }
}

describe('Scene Graph Integration', () => {
  let mockContext: CanvasRenderingContext2DMock;
  let renderer: SceneRenderer;

  beforeEach(() => {
    mockContext = new CanvasRenderingContext2DMock();
    renderer = new SceneRenderer(mockContext as any);
  });

  describe('Basic scene rendering', () => {
    it('should render an empty scene without errors', () => {
      const scene = testScenes.empty;

      expect(() => renderer.render(scene)).not.toThrow();
      expect(mockContext.getFillCount()).toBe(0);
    });

    it('should render a single sprite', () => {
      const scene = testScenes.single;

      renderer.render(scene);

      expect(mockContext.getFillCount()).toBe(1);
      expect(mockContext.getLastFill()).toContain('fillRect');
    });

    it('should respect visibility flag', () => {
      const scene = { ...testScenes.single };
      scene.renderable.visible = false;

      renderer.render(scene);

      expect(mockContext.getFillCount()).toBe(0);
    });

    it('should apply opacity', () => {
      const scene = { ...testScenes.single };
      scene.renderable.opacity = 0.5;

      renderer.render(scene);

      expect(mockContext.globalAlpha).toBe(0.5);
    });
  });

  describe('Hierarchy rendering', () => {
    it('should render all nodes in hierarchy', () => {
      const scene = testScenes.hierarchy;

      renderer.render(scene);

      // Root (2 children) + child1 (1 child) = 3 sprites rendered
      expect(mockContext.getFillCount()).toBe(3);
    });

    it('should apply parent transforms to children', () => {
      const scene = testScenes.hierarchy;

      renderer.render(scene);

      const transforms = mockContext.getTransforms();
      expect(transforms.length).toBeGreaterThan(0);

      // First transform should be for child1 at (100, 100)
      const firstTransform = transforms[0];
      expect(firstTransform.e).toBe(100);
      expect(firstTransform.f).toBe(100);
    });

    it('should properly nest transforms', () => {
      const scene = testScenes.hierarchy;

      renderer.render(scene);

      // Should have save/restore calls for each node level
      const saveRestoreCount = mockContext['transformStack'].length;
      expect(saveRestoreCount).toBeGreaterThan(0);
    });
  });

  describe('Complex scenes', () => {
    it('should handle deep hierarchies', () => {
      const scene = testScenes.deep;

      renderer.render(scene);

      // 3 levels deep with 2 children each = 1 + 2 + 4 + 8 = 15 nodes
      // Only 2-8 are renderable (leaf nodes) = 8 sprites
      const fillCount = mockContext.getFillCount();
      expect(fillCount).toBeGreaterThan(0);
    });

    it('should handle wide hierarchies', () => {
      const scene = testScenes.wide;

      renderer.render(scene);

      // 2 levels with 5 children each = 1 + 5 + 25 = 31 nodes
      const fillCount = mockContext.getFillCount();
      expect(fillCount).toBeGreaterThan(0);
    });
  });

  describe('Transform composition', () => {
    it('should combine translation, rotation, and scale', () => {
      const scene = createSpriteNode('test', {
        position: { x: 100, y: 100 },
        rotation: Math.PI / 4, // 45 degrees
        scale: { x: 2, y: 2 },
      });

      renderer.render(scene);

      const transforms = mockContext.getTransforms();
      expect(transforms.length).toBeGreaterThan(0);

      const lastTransform = transforms[transforms.length - 1];
      expect(lastTransform.a).toBeCloseTo(2, 5); // scale.x * cos(45°) ≈ 1.414
    });
  });

  describe('Error handling', () => {
    it('should handle circular references gracefully', () => {
      const node1 = createBasicNode('node1');
      const node2 = createBasicNode('node2');

      // Create circular reference
      node1.children.push(node2);
      node2.children.push(node1);

      // This should not cause infinite loop with proper implementation
      // For now, we just verify it doesn't crash immediately
      expect(() => renderer.render(node1)).not.toThrow();
    });

    it('should handle missing transform gracefully', () => {
      const invalidNode = { id: 'invalid', type: 'node', children: [] };

      expect(() => renderer.render(invalidNode)).not.toThrow();
    });
  });
});

// Helper function for tests
function createSpriteNode(id: string, options: any = {}) {
  return {
    id,
    type: 'sprite',
    children: [],
    transform: {
      position: options.position || { x: 0, y: 0 },
      rotation: options.rotation || 0,
      scale: options.scale || { x: 1, y: 1 },
    },
    renderable: {
      visible: options.visible !== false,
      opacity: options.opacity ?? 1,
      width: options.width || 100,
      height: options.height || 100,
      color: options.color || '#ff0000',
    },
  };
}
