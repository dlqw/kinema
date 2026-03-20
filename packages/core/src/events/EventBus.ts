/**
 * Event Bus
 *
 * Centralized event management for the entire framework
 * Enables cross-component communication without tight coupling
 *
 * @module events
 */

import type {
  EventEmitter,
  EventData,
  EventHandler,
  EventMap,
  IDisposable,
} from './EventEmitter';
import { EventEmitter as EventEmitterImpl } from './EventEmitter';

/**
 * Global event channels
 */
export enum EventChannel {
  /**
   * Animation lifecycle events
   */
  ANIMATION = 'animation',

  /**
   * Scene management events
   */
  SCENE = 'scene',

  /**
   * Rendering events
   */
  RENDER = 'render',

  /**
   * User input events
   */
  INPUT = 'input',

  /**
   * Timeline events
   */
  TIMELINE = 'timeline',

  /**
   * Export events
   */
  EXPORT = 'export',

  /**
   * System events (errors, warnings, etc.)
   */
  SYSTEM = 'system',
}

/**
 * Event bus configuration
 */
export interface EventBusConfig {
  /**
   * Enable event logging
   */
  logging?: boolean;

  /**
   * Log prefix
   */
  logPrefix?: string;

  /**
   * Maximum listeners per event
   */
  maxListeners?: number;

  /**
   * Enable history tracking
   */
  historyEnabled?: boolean;

  /**
   * Maximum history size
   */
  maxHistorySize?: number;
}

/**
 * Event history entry
 */
interface HistoryEntry<T = any> {
  channel: EventChannel;
  event: string;
  data: T;
  timestamp: number;
}

/**
 * Global event bus for framework-wide event communication
 *
 * The event bus provides:
 * - Centralized event management across all components
 * - Channel-based event organization
 * - Event history for debugging
 * - Type-safe event handling
 *
 * @example
 * ```typescript
 * // Subscribe to events
 * EventBus.on(EventChannel.ANIMATION, 'start', (data) => {
 *   console.log('Animation started:', data);
 * });
 *
 * // Emit events
 * EventBus.emit(EventChannel.ANIMATION, 'start', { animationId: 'abc', ... });
 *
 * // Unsubscribe
 * const unsubscribe = EventBus.on(EventChannel.SCENE, 'update', handler);
 * unsubscribe();
 * ```
 */
export class EventBus implements IDisposable {
  private static instance: EventBus;
  private channels: Map<EventChannel, EventEmitter>;
  private config: Required<EventBusConfig>;
  private history: HistoryEntry[] = [];

  private constructor(config: EventBusConfig = {}) {
    this.config = {
      logging: config.logging ?? false,
      logPrefix: config.logPrefix ?? '[EventBus]',
      maxListeners: config.maxListeners ?? 50,
      historyEnabled: config.historyEnabled ?? false,
      maxHistorySize: config.maxHistorySize ?? 1000,
    };

    this.channels = new Map();

    // Initialize all channels
    Object.values(EventChannel).forEach((channel) => {
      this.channels.set(
        channel,
        new EventEmitterImpl({
          maxListeners: this.config.maxListeners,
        })
      );
    });
  }

  /**
   * Get the singleton event bus instance
   */
  static getInstance(config?: EventBusConfig): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  /**
   * Reset the event bus instance (useful for testing)
   */
  static reset(): void {
    if (EventBus.instance) {
      EventBus.instance.dispose();
      EventBus.instance = EventBus as any; // Clear the singleton
    }
  }

  /**
   * Get event emitter for a specific channel
   */
  getChannel(channel: EventChannel): EventEmitter {
    const emitter = this.channels.get(channel);
    if (!emitter) {
      throw new Error(`Event channel "${channel}" not found`);
    }
    return emitter;
  }

  /**
   * Subscribe to an event on a channel
   *
   * @param channel - Event channel
   * @param event - Event name
   * @param handler - Event handler
   * @param options - Listener options
   * @returns Unsubscribe function
   */
  on<K extends EventMap>(
    channel: EventChannel,
    event: string,
    handler: EventHandler,
    options: { once?: boolean; priority?: number } = {}
  ): () => void {
    const emitter = this.getChannel(channel);
    const unsubscribe = emitter.on(event, handler, options);

    if (this.config.logging) {
      console.log(
        `${this.config.logPrefix} Subscribed to ${channel}:${event}`,
        options
      );
    }

    return unsubscribe;
  }

  /**
   * Subscribe to an event once
   *
   * @param channel - Event channel
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  once<K extends EventMap>(
    channel: EventChannel,
    event: string,
    handler: EventHandler
  ): () => void {
    return this.on(channel, event, handler, { once: true });
  }

  /**
   * Unsubscribe from an event
   *
   * @param channel - Event channel
   * @param event - Event name
   * @param handler - Event handler
   */
  off(channel: EventChannel, event: string, handler: EventHandler): void {
    const emitter = this.getChannel(channel);
    emitter.off(event, handler);

    if (this.config.logging) {
      console.log(`${this.config.logPrefix} Unsubscribed from ${channel}:${event}`);
    }
  }

  /**
   * Emit an event on a channel
   *
   * @param channel - Event channel
   * @param event - Event name
   * @param data - Event data
   */
  async emit<T = any>(channel: EventChannel, event: string, data: T): Promise<void> {
    const emitter = this.getChannel(channel);

    // Add to history if enabled
    if (this.config.historyEnabled) {
      this.addToHistory(channel, event, data);
    }

    if (this.config.logging) {
      console.log(`${this.config.logPrefix} Emitting ${channel}:${event}`, data);
    }

    await emitter.emit(event, data);
  }

  /**
   * Emit an event synchronously
   *
   * @param channel - Event channel
   * @param event - Event name
   * @param data - Event data
   */
  emitSync<T = any>(channel: EventChannel, event: string, data: T): void {
    const emitter = this.getChannel(channel);

    if (this.config.historyEnabled) {
      this.addToHistory(channel, event, data);
    }

    if (this.config.logging) {
      console.log(`${this.config.logPrefix} Emitting (sync) ${channel}:${event}`, data);
    }

    emitter.emitSync(event, data);
  }

  /**
   * Get listener count for an event
   *
   * @param channel - Event channel
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount(channel: EventChannel, event: string): number {
    const emitter = this.getChannel(channel);
    return emitter.listenerCount(event as any);
  }

  /**
   * Check if an event has listeners
   *
   * @param channel - Event channel
   * @param event - Event name
   * @returns True if listeners exist
   */
  hasListeners(channel: EventChannel, event: string): boolean {
    return this.listenerCount(channel, event) > 0;
  }

  /**
   * Remove all listeners from a channel
   *
   * @param channel - Event channel
   * @param event - Optional event name (omit to clear all)
   */
  clear(channel: EventChannel, event?: string): void {
    const emitter = this.getChannel(channel);
    emitter.removeAllListeners(event as any);

    if (this.config.logging) {
      console.log(
        `${this.config.logPrefix} Cleared ${event ? event + ' from ' : ''}${channel}`
      );
    }
  }

  /**
   * Get event history
   *
   * @param channel - Optional channel filter
   * @param event - Optional event filter
   * @returns History entries
   */
  getHistory(
    channel?: EventChannel,
    event?: string
  ): ReadonlyArray<HistoryEntry> {
    let filtered = this.history;

    if (channel) {
      filtered = filtered.filter((entry) => entry.channel === channel);
    }

    if (event) {
      filtered = filtered.filter((entry) => entry.event === event);
    }

    return filtered;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Add entry to history
   */
  private addToHistory<T>(channel: EventChannel, event: string, data: T): void {
    this.history.push({
      channel,
      event,
      data,
      timestamp: Date.now(),
    });

    // Trim history if needed
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Configure the event bus
   */
  configure(config: Partial<EventBusConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clean up all channels and listeners
   */
  dispose(): void {
    for (const emitter of this.channels.values()) {
      emitter.dispose();
    }
    this.channels.clear();
    this.history = [];
  }
}

/**
 * Convenience access to global event bus
 */
export const EventBusInstance = EventBus.getInstance();

/**
 * Event decorator for automatic event emission
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @EmitEvent(EventChannel.ANIMATION, 'start')
 *   startAnimation() {
 *     // This will automatically emit 'start' event on ANIMATION channel
 *     return { animationId: 'abc', duration: 1000 };
 *   }
 * }
 * ```
 */
export function EmitEvent(channel: EventChannel, event: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      if (result !== undefined) {
        await EventBus.getInstance().emit(channel, event, result);
      }

      return result;
    };

    return descriptor;
  };
}
