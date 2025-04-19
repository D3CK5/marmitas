/**
 * Type for event handler functions
 */
export type EventHandler<T> = (event: T) => void;

/**
 * Simple typed event emitter class
 * Allows subscribing to and emitting events with strongly typed event names and payloads
 */
export class EventEmitter<EventName extends string | number | symbol, EventType> {
  private eventHandlers: Map<EventName, Set<EventHandler<EventType>>> = new Map();

  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param handler The function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  public on(eventName: EventName, handler: EventHandler<EventType>): () => void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }

    const handlers = this.eventHandlers.get(eventName)!;
    handlers.add(handler);

    // Return an unsubscribe function
    return () => this.off(eventName, handler);
  }

  /**
   * Subscribe to an event for a single emission
   * @param eventName The name of the event to subscribe to
   * @param handler The function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  public once(eventName: EventName, handler: EventHandler<EventType>): () => void {
    const onceHandler: EventHandler<EventType> = (event) => {
      // Remove this handler after it's called
      this.off(eventName, onceHandler);
      // Call the original handler
      handler(event);
    };

    return this.on(eventName, onceHandler);
  }

  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param handler The handler function to remove
   */
  public off(eventName: EventName, handler: EventHandler<EventType>): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      // Clean up empty sets
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventName);
      }
    }
  }

  /**
   * Unsubscribe all handlers from a specific event
   * @param eventName The name of the event to clear handlers for
   */
  public removeAllListeners(eventName?: EventName): void {
    if (eventName) {
      this.eventHandlers.delete(eventName);
    } else {
      this.eventHandlers.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param eventName The name of the event
   * @returns The number of listeners
   */
  public listenerCount(eventName: EventName): number {
    const handlers = this.eventHandlers.get(eventName);
    return handlers ? handlers.size : 0;
  }

  /**
   * Check if an event has any listeners
   * @param eventName The name of the event
   * @returns True if the event has at least one listener
   */
  public hasListeners(eventName: EventName): boolean {
    return this.listenerCount(eventName) > 0;
  }

  /**
   * Emit an event to all subscribed handlers
   * @param eventName The name of the event to emit
   * @param event The event data to pass to handlers
   */
  protected emit(eventName: EventName, event: EventType): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      // Create a copy of handlers to prevent issues if a handler unsubscribes during emission
      const handlersCopy = Array.from(handlers);
      for (const handler of handlersCopy) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${String(eventName)}:`, error);
        }
      }
    }
  }
} 