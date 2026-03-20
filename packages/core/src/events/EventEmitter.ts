/**
 * Event System - Type-safe event emitter with bubbling support
 *
 * @module events
 */

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * Event listener metadata
 */
interface Listener<T = any> {
  handler: EventHandler<T>;
  once: boolean;
  priority: number;
}

/**
 * Event context for bubbling
 */
export interface EventContext {
  target: any;
  currentTarget: any;
  propagationStopped: boolean;
  immediatePropagationStopped: boolean;
  defaultPrevented: boolean;

  /**
   * Stop event propagation to parent handlers
   */
  stopPropagation(): void;

  /**
   * Stop propagation to other listeners on same target
   */
  stopImmediatePropagation(): void;

  /**
   * Prevent default behavior
   */
  preventDefault(): void;
}

/**
 * Event data with context
 */
export interface EventData<T = any> {
  data: T;
  context: EventContext;
}

/**
 * Typed event map for type-safe event handling
 */
export type EventMap = Record<string, any>;

/**
 * Event emitter options
 */
export interface EventEmitterOptions {
  /**
   * Enable event bubbling
   */
  bubbling?: boolean;

  /**
   * Maximum number of listeners per event
   */
  maxListeners?: number;

  /**
   * Parent emitter for bubbling
   */
  parent?: EventEmitter;
}

/**
 * Default event context implementation
 */
class DefaultEventContext implements EventContext {
  target: any;
  currentTarget: any;
  propagationStopped = false;
  immediatePropagationStopped = false;
  defaultPrevented = false;

  constructor(target: any, currentTarget: any) {
    this.target = target;
    this.currentTarget = currentTarget;
  }

  stopPropagation(): void {
    this.propagationStopped = true;
  }

  stopImmediatePropagation(): void {
    this.immediatePropagationStopped = true;
  }

  preventDefault(): void {
    this.defaultPrevented = true;
  }

  reset(): void {
    this.propagationStopped = false;
    this.immediatePropagationStopped = false;
    this.defaultPrevented = false;
  }
}

/**
 * Type-safe event emitter with support for:
 * - Typed events
 * - Event bubbling
 * - Priority listeners
 * - One-time listeners
 * - Unsubscribe mechanism
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   click: { x: number; y: number };
 *   change: { value: string };
 * }
 *
 * const emitter = new EventEmitter<MyEvents>();
 *
 * emitter.on('click', ({ x, y }) => console.log(x, y));
 * emitter.emit('click', { x: 100, y: 200 });
 *
 * // Unsubscribe
 * const unsubscribe = emitter.on('change', handler);
 * unsubscribe();
 * ```
 */
export class EventEmitter<TEvents extends EventMap = any> implements IDisposable {
  private listeners: Map<keyof TEvents | '*', Listener[]> = new Map();
  private options: Required<EventEmitterOptions>;
  private _parent?: EventEmitter;

  constructor(options: EventEmitterOptions = {}) {
    this.options = {
      bubbling: options.bubbling ?? false,
      maxListeners: options.maxListeners ?? 100,
      parent: options.parent,
    };

    if (options.parent) {
      this._parent = options.parent;
    }
  }

  /**
   * Get parent emitter for bubbling
   */
  get parent(): EventEmitter | undefined {
    return this._parent;
  }

  /**
   * Set parent emitter for bubbling
   */
  setParent(parent: EventEmitter | undefined): this {
    this._parent = parent;
    return this;
  }

  /**
   * Register an event listener
   *
   * @param event - Event name or '*' for all events
   * @param handler - Event handler function
   * @param options - Listener options
   * @returns Unsubscribe function
   */
  on<K extends keyof TEvents | '*'>(
    event: K,
    handler: EventHandler<K extends keyof TEvents ? TEvents[K] : any>,
    options: { once?: boolean; priority?: number } = {}
  ): () => void {
    const { once = false, priority = 0 } = options;

    const listener: Listener = {
      handler,
      once,
      priority,
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const eventListeners = this.listeners.get(event)!;

    // Check max listeners limit
    if (eventListeners.length >= this.options.maxListeners) {
      console.warn(
        `Max listeners (${this.options.maxListeners}) reached for event "${String(event)}"`
      );
    }

    // Insert listener sorted by priority (higher first)
    let insertIndex = eventListeners.length;
    for (let i = 0; i < eventListeners.length; i++) {
      if (priority > eventListeners[i].priority) {
        insertIndex = i;
        break;
      }
    }

    eventListeners.splice(insertIndex, 0, listener);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Register a one-time event listener
   *
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void {
    return this.on(event, handler, { once: true });
  }

  /**
   * Unregister an event listener
   *
   * @param event - Event name
   * @param handler - Event handler function
   */
  off<K extends keyof TEvents | '*'>(
    event: K,
    handler: EventHandler<K extends keyof TEvents ? TEvents[K] : any>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    const index = eventListeners.findIndex((l) => l.handler === handler);
    if (index !== -1) {
      eventListeners.splice(index, 1);
    }

    // Clean up empty listener arrays
    if (eventListeners.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event or all events
   *
   * @param event - Event name (omit to remove all listeners)
   */
  removeAllListeners<K extends keyof TEvents | '*'>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Emit an event
   *
   * @param event - Event name
   * @param data - Event data
   * @param context - Event context (for bubbling)
   * @returns Promise that resolves when all handlers complete
   */
  async emit<K extends keyof TEvents>(
    event: K,
    data: TEvents[K],
    context?: EventContext
  ): Promise<void> {
    const eventListeners = this.listeners.get(event);
    const wildcardListeners = this.listeners.get('*');

    // Create event context if not provided
    let eventContext = context;
    if (!eventContext) {
      eventContext = new DefaultEventContext(this, this);
    }

    const eventData: EventData<TEvents[K]> = {
      data,
      context: eventContext,
    };

    // Execute listeners by priority
    const allListeners = [...(eventListeners || []), ...(wildcardListeners || [])];
    allListeners.sort((a, b) => b.priority - a.priority);

    for (const listener of allListeners) {
      if (eventContext.immediatePropagationStopped) {
        break;
      }

      try {
        await listener.handler(eventData);
      } catch (error) {
        console.error(`Error in event handler for "${String(event)}":`, error);
        // Continue executing other listeners even if one fails
      }

      // Remove one-time listeners
      if (listener.once) {
        this.off(event, listener.handler);
      }
    }

    // Bubble to parent if enabled and propagation not stopped
    if (
      this.options.bubbling &&
      this._parent &&
      !eventContext.propagationStopped
    ) {
      eventContext.currentTarget = this._parent;
      await this._parent.emit(event, data, eventContext);
    }
  }

  /**
   * Emit an event synchronously
   *
   * @param event - Event name
   * @param data - Event data
   * @param context - Event context
   */
  emitSync<K extends keyof TEvents>(
    event: K,
    data: TEvents[K],
    context?: EventContext
  ): void {
    const eventListeners = this.listeners.get(event);
    const wildcardListeners = this.listeners.get('*');

    let eventContext = context;
    if (!eventContext) {
      eventContext = new DefaultEventContext(this, this);
    }

    const eventData: EventData<TEvents[K]> = {
      data,
      context: eventContext,
    };

    const allListeners = [...(eventListeners || []), ...(wildcardListeners || [])];
    allListeners.sort((a, b) => b.priority - a.priority);

    for (const listener of allListeners) {
      if (eventContext.immediatePropagationStopped) {
        break;
      }

      try {
        const result = listener.handler(eventData);
        // Handle both sync and async handlers
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Error in async event handler for "${String(event)}":`, error);
          });
        }
      } catch (error) {
        console.error(`Error in event handler for "${String(event)}":`, error);
      }

      if (listener.once) {
        this.off(event, listener.handler);
      }
    }

    if (
      this.options.bubbling &&
      this._parent &&
      !eventContext.propagationStopped
    ) {
      eventContext.currentTarget = this._parent;
      this._parent.emitSync(event, data, eventContext);
    }
  }

  /**
   * Get listener count for an event
   *
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * Check if there are any listeners for an event
   *
   * @param event - Event name
   * @returns True if listeners exist
   */
  hasListeners<K extends keyof TEvents>(event: K): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Get all event names with listeners
   *
   * @returns Array of event names
   */
  eventNames(): Array<keyof TEvents | '*'> {
    return Array.from(this.listeners.keys());
  }

  /**
   * Clean up and remove all listeners
   */
  dispose(): void {
    this.listeners.clear();
    this._parent = undefined;
  }
}

/**
 * Disposable interface for cleanup
 */
export interface IDisposable {
  dispose(): void;
}

/**
 * Event emitter with synchronous event handling
 * For use cases where async handling is not needed
 */
export class SyncEventEmitter<TEvents extends EventMap = any> extends EventEmitter<TEvents> {
  /**
   * Override emit to be synchronous
   */
  emit<K extends keyof TEvents>(
    event: K,
    data: TEvents[K],
    context?: EventContext
  ): Promise<void> {
    // Call sync version but return empty promise for compatibility
    this.emitSync(event, data, context);
    return Promise.resolve();
  }
}
