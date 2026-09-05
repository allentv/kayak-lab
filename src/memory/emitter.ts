/**
 * Minimal typed event emitter for the memory subsystem.
 *
 * Provides on/off/emit with typed event maps. No external dependencies.
 */

/** Handler function type. */
type Handler<T> = (event: T) => void;

/**
 * Typed event emitter.
 *
 * @example
 * ```ts
 * interface MyEvents { foo: { x: number }; bar: string }
 * const emitter = new TypedEmitter<MyEvents>();
 * emitter.on("foo", (e) => console.log(e.x));
 * emitter.emit("foo", { x: 1 });
 * ```
 */
export class TypedEmitter<Events> {
  private handlers = new Map<keyof Events, Set<Handler<any>>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const set = this.handlers.get(event);
    if (set) {
      for (const handler of set) {
        try {
          handler(data);
        } catch {
          // Handler error does not abort remaining handlers
        }
      }
    }
  }

  /** Remove all handlers. */
  removeAllListeners(): void {
    this.handlers.clear();
  }
}
