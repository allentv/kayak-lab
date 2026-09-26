# src/memory/emitter.ts · [[memory-system]]

- Handler · type · L8-L8 — type Handler<T> = (event: T) => void;
- TypedEmitter · class · L21-L54 — class TypedEmitter<Events>
- on · method · L24-L31 — on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void
- off · method · L33-L35 — off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void
- emit · method · L37-L48 — emit<K extends keyof Events>(event: K, data: Events[K]): void
- removeAllListeners · method · L51-L53 — removeAllListeners(): void
