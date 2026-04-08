/**
 * GroupObject - Hierarchical container for render objects
 *
 * Represents a group of render objects that can be manipulated
 * as a single unit. Supports hierarchical scene graphs.
 *
 * @module core/GroupObject
 */

import type { ObjectId, Point3D, BoundingBox, Transform, RenderObjectState } from '../types';
import { RenderObject } from './RenderObject';
import { mergeBoundingBoxes } from '../types/utils';

/**
 * GroupObject represents a hierarchical group of render objects.
 *
 * Groups allow you to organize objects into hierarchies and
 * apply transformations to multiple objects at once.
 *
 * @example
 * ```typescript
 * // Create a group from objects
 * const group = GroupObject.from(circle, rectangle, text);
 *
 * // Create and add children
 * const group = GroupObject.create()
 *   .addChild(circle)
 *   .addChild(rectangle);
 *
 * // Transform entire group
 * const moved = group.withPosition(100, 100);
 * ```
 */
export class GroupObject extends RenderObject {
  /**
   * Creates a new GroupObject instance
   *
   * @param state - The render object state
   * @param children - Array of child objects
   */
  constructor(
    state: RenderObjectState,
    public readonly children: ReadonlyArray<RenderObject>,
  ) {
    super(state);
    Object.freeze(children);

    // Update children with parent reference
    for (const child of children) {
      if ((child as any).state.parentId === undefined) {
        (child as any).state = {
          ...(child as any).state,
          parentId: state.id,
        };
      }
    }
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
   * @returns A new GroupObject with the updated transform
   */
  withTransform(transform: Partial<Transform>): GroupObject {
    return new GroupObject(
      {
        ...this.state,
        transform: { ...this.state.transform, ...transform },
      },
      this.children,
    );
  }

  /**
   * Calculate the bounding box of this group
   *
   * The bounding box encloses all child objects.
   *
   * @returns The combined bounding box of all children
   */
  getBoundingBox(): BoundingBox {
    if (this.children.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        center: { x: 0, y: 0, z: 0 },
      };
    }

    // Merge bounding boxes of all children
    const firstChild = this.children[0]!;
    return this.children.slice(1).reduce((combined, child) => {
      return mergeBoundingBoxes(combined, child.getBoundingBox());
    }, firstChild.getBoundingBox());
  }

  /**
   * Check if a point is contained within this group
   *
   * Returns true if the point is inside any child object.
   *
   * @param point - The point to test
   * @returns True if the point is inside any child
   */
  containsPoint(point: Point3D): boolean {
    return this.children.some((child) => child.containsPoint(point));
  }

  // ==========================================================================
  // GroupObject Specific Methods
  // ==========================================================================

  /**
   * Get the number of children
   */
  get childCount(): number {
    return this.children.length;
  }

  /**
   * Get a child by index
   *
   * @param index - Child index
   * @returns The child at the index, or undefined
   */
  getChild(index: number): RenderObject | undefined {
    return this.children[index];
  }

  /**
   * Find a child by ID
   *
   * @param id - Child object ID
   * @returns The child with the ID, or undefined
   */
  findById(id: ObjectId): RenderObject | undefined {
    // Check direct children
    const directChild = this.children.find((c) => c.id === id);
    if (directChild) return directChild;

    // Search nested groups
    for (const child of this.children) {
      if (child instanceof GroupObject) {
        const nested = child.findById(id);
        if (nested) return nested;
      }
    }

    return undefined;
  }

  /**
   * Get all nested objects (including nested groups)
   *
   * @returns Array of all nested objects in hierarchy order
   */
  getAllObjects(): RenderObject[] {
    const objects: RenderObject[] = [];

    for (const child of this.children) {
      objects.push(child);
      if (child instanceof GroupObject) {
        objects.push(...child.getAllObjects());
      }
    }

    return objects;
  }

  /**
   * Get all objects of a specific type
   *
   * @param constructor - The class constructor to filter by
   * @returns Array of matching objects
   */
  getObjectsOfType<T extends RenderObject>(constructor: new (...args: any[]) => T): T[] {
    return this.getAllObjects().filter((obj) => obj instanceof constructor) as T[];
  }

  /**
   * Add a child object
   *
   * @param child - Child object to add
   * @returns A new GroupObject with the child added
   */
  addChild(child: RenderObject): GroupObject {
    return new GroupObject(this.state, [...this.children, child]);
  }

  /**
   * Add multiple child objects
   *
   * @param children - Child objects to add
   * @returns A new GroupObject with the children added
   */
  addChildren(...children: RenderObject[]): GroupObject {
    return new GroupObject(this.state, [...this.children, ...children]);
  }

  /**
   * Remove a child by ID
   *
   * @param childId - ID of child to remove
   * @returns A new GroupObject with the child removed
   */
  removeChild(childId: ObjectId): GroupObject {
    return new GroupObject(
      this.state,
      this.children.filter((c) => c.id !== childId),
    );
  }

  /**
   * Remove multiple children by ID
   *
   * @param childIds - IDs of children to remove
   * @returns A new GroupObject with the children removed
   */
  removeChildren(...childIds: ObjectId[]): GroupObject {
    const idsToRemove = new Set(childIds);
    return new GroupObject(
      this.state,
      this.children.filter((c) => !idsToRemove.has(c.id)),
    );
  }

  /**
   * Replace all children
   *
   * @param children - New children array
   * @returns A new GroupObject with the replaced children
   */
  withChildren(children: ReadonlyArray<RenderObject>): GroupObject {
    return new GroupObject(this.state, children);
  }

  /**
   * Insert a child at a specific index
   *
   * @param index - Insert position
   * @param child - Child to insert
   * @returns A new GroupObject with the child inserted
   */
  insertChild(index: number, child: RenderObject): GroupObject {
    const newChildren = [...this.children];
    newChildren.splice(index, 0, child);
    return new GroupObject(this.state, newChildren);
  }

  /**
   * Replace a child at a specific index
   *
   * @param index - Child index
   * @param child - New child object
   * @returns A new GroupObject with the child replaced
   */
  replaceChild(index: number, child: RenderObject): GroupObject {
    if (index < 0 || index >= this.children.length) {
      throw new Error(`Index ${index} out of bounds`);
    }

    const newChildren = [...this.children];
    newChildren[index] = child;
    return new GroupObject(this.state, newChildren);
  }

  /**
   * Find objects at a specific point
   *
   * Returns all objects containing the point, ordered by z-index.
   *
   * @param point - Point to test
   * @returns Array of objects containing the point
   */
  findObjectsAtPoint(point: Point3D): RenderObject[] {
    return this.children
      .filter((child) => child.containsPoint(point))
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Get the topmost object at a specific point
   *
   * @param point - Point to test
   * @returns The topmost object containing the point, or undefined
   */
  getTopmostAt(point: Point3D): RenderObject | undefined {
    const objects = this.findObjectsAtPoint(point);
    return objects[objects.length - 1];
  }

  /**
   * Flatten the group (remove hierarchy, keep only descendants)
   *
   * @returns A new GroupObject with flattened children
   */
  flatten(): GroupObject {
    const flattened: RenderObject[] = [];

    for (const child of this.children) {
      if (child instanceof GroupObject) {
        flattened.push(...child.getAllObjects());
      } else {
        flattened.push(child);
      }
    }

    return new GroupObject(this.state, flattened);
  }

  /**
   * Reverse the order of children
   *
   * @returns A new GroupObject with reversed children
   */
  reverseChildren(): GroupObject {
    return new GroupObject(this.state, [...this.children].reverse());
  }

  /**
   * Sort children by z-index
   *
   * @returns A new GroupObject with sorted children
   */
  sortChildrenByZIndex(): GroupObject {
    return new GroupObject(
      this.state,
      [...this.children].sort((a, b) => a.zIndex - b.zIndex),
    );
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create an empty group
   *
   * @param position - Optional initial position
   * @returns A new empty GroupObject
   */
  static create(position?: Point3D): GroupObject {
    return new GroupObject(
      RenderObject.createDefaultState({
        transform: {
          position: position ?? { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
      }),
      [],
    );
  }

  /**
   * Create a group from objects
   *
   * @param objects - Objects to include in the group
   * @returns A new GroupObject containing the objects
   */
  static from(...objects: RenderObject[]): GroupObject {
    return GroupObject.create().addChildren(...objects);
  }

  /**
   * Create a group with automatic centering
   *
   * @param objects - Objects to include in the group
   * @returns A new GroupObject with children centered around origin
   */
  static centered(...objects: RenderObject[]): GroupObject {
    if (objects.length === 0) {
      return GroupObject.create();
    }

    // Calculate combined bounding box
    const firstObject = objects[0]!;
    const bbox = objects
      .slice(1)
      .reduce(
        (combined, obj) => mergeBoundingBoxes(combined, obj.getBoundingBox()),
        firstObject.getBoundingBox(),
      );

    // Calculate offset to center
    const offset = {
      x: -bbox.center.x,
      y: -bbox.center.y,
      z: -bbox.center.z,
    };

    // Shift all objects by offset
    const shifted = objects.map((obj) =>
      obj.withPosition(
        obj.transform.position.x + offset.x,
        obj.transform.position.y + offset.y,
        obj.transform.position.z + offset.z,
      ),
    );

    return GroupObject.from(...shifted);
  }

  /**
   * Create a row layout
   *
   * @param objects - Objects to arrange
   * @param spacing - Horizontal spacing between objects
   * @returns A new GroupObject with objects arranged horizontally
   */
  static row(objects: RenderObject[], spacing: number = 10): GroupObject {
    let xOffset = 0;

    const arranged = objects.map((obj) => {
      const bbox = obj.getBoundingBox();
      const width = bbox.max.x - bbox.min.x;
      const newObj = obj.withPosition(xOffset + width / 2, 0, 0);
      xOffset += width + spacing;
      return newObj;
    });

    return GroupObject.from(...arranged);
  }

  /**
   * Create a column layout
   *
   * @param objects - Objects to arrange
   * @param spacing - Vertical spacing between objects
   * @returns A new GroupObject with objects arranged vertically
   */
  static column(objects: RenderObject[], spacing: number = 10): GroupObject {
    let yOffset = 0;

    const arranged = objects.map((obj) => {
      const bbox = obj.getBoundingBox();
      const height = bbox.max.y - bbox.min.y;
      const newObj = obj.withPosition(0, yOffset + height / 2, 0);
      yOffset += height + spacing;
      return newObj;
    });

    return GroupObject.from(...arranged);
  }

  /**
   * Create a grid layout
   *
   * @param objects - Objects to arrange
   * @param columns - Number of columns
   * @param spacing - Spacing between objects
   * @returns A new GroupObject with objects arranged in a grid
   */
  static grid(objects: RenderObject[], columns: number, spacing: number = 10): GroupObject {
    const arranged: RenderObject[] = [];
    const maxSize = Math.max(
      ...objects.map((obj) => {
        const bbox = obj.getBoundingBox();
        return Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
      }),
    );

    objects.forEach((obj, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = col * (maxSize + spacing);
      const y = row * (maxSize + spacing);
      arranged.push(obj.withPosition(x, y, 0));
    });

    return GroupObject.from(...arranged);
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
      childCount: this.children.length,
      children: this.children.map((c) => ({
        id: c.id,
        type: c.constructor.name,
      })),
    };
  }

  /**
   * Get a string representation
   */
  override toString(): string {
    return `GroupObject(id="${this.state.id}", children=${this.children.length})`;
  }
}

/**
 * Default export
 */
export default GroupObject;
