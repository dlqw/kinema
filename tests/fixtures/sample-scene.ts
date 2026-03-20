/**
 * Sample scene fixture for testing
 * Provides pre-configured scene objects for testing
 */

import type { SceneNode, Transform, Renderable } from '../../src/types/core';

/**
 * Creates a basic node with transform
 */
export function createBasicNode(id: string): SceneNode {
  return {
    id,
    type: 'node',
    children: [],
    transform: {
      position: { x: 0, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
    },
  };
}

/**
 * Creates a renderable node (sprite)
 */
export function createSpriteNode(
  id: string,
  options: {
    position?: { x: number; y: number };
    rotation?: number;
    scale?: { x: number; y: number };
    width?: number;
    height?: number;
    color?: string;
  } = {},
): SceneNode & Renderable {
  const {
    position = { x: 0, y: 0 },
    rotation = 0,
    scale = { x: 1, y: 1 },
    width = 100,
    height = 100,
    color = '#ff0000',
  } = options;

  return {
    id,
    type: 'sprite',
    children: [],
    transform: {
      position,
      rotation,
      scale,
    },
    renderable: {
      visible: true,
      opacity: 1,
      width,
      height,
      color,
    },
  };
}

/**
 * Creates a simple scene hierarchy
 */
export function createSceneHierarchy(): SceneNode {
  const root = createBasicNode('root');

  const child1 = createSpriteNode('child1', {
    position: { x: 100, y: 100 },
    color: '#ff0000',
  });

  const child2 = createSpriteNode('child2', {
    position: { x: 200, y: 100 },
    color: '#00ff00',
  });

  const grandchild = createSpriteNode('grandchild', {
    position: { x: 50, y: 50 },
    width: 50,
    height: 50,
    color: '#0000ff',
  });

  child1.children.push(grandchild);
  root.children.push(child1, child2);

  return root;
}

/**
 * Creates a complex scene for stress testing
 */
export function createComplexScene(depth: number, childrenPerNode: number): SceneNode {
  function createNode(currentDepth: number, id: string): SceneNode {
    const node = createBasicNode(id);

    if (currentDepth < depth) {
      for (let i = 0; i < childrenPerNode; i++) {
        const childId = `${id}-${i}`;
        node.children.push(createNode(currentDepth + 1, childId));
      }
    }

    return node;
  }

  return createNode(0, 'root');
}

/**
 * Predefined test scenes
 */
export const testScenes = {
  empty: createBasicNode('empty-root'),
  single: createSpriteNode('single-sprite'),
  hierarchy: createSceneHierarchy(),
  deep: createComplexScene(3, 2),
  wide: createComplexScene(2, 5),
} as const;
