# src/runtime/hooks.ts · [[hook-based-extensibility]] [[runtime-orchestration]]

- HookPoint · enum · L13-L19 — enum HookPoint
- BeforeModelCallContext · interface · L22-L27 — interface BeforeModelCallContext
- AfterToolExecutionContext · interface · L30-L37 — interface AfterToolExecutionContext
- TurnEndContext · interface · L40-L45 — interface TurnEndContext
- SessionStartContext · interface · L48-L51 — interface SessionStartContext
- SessionEndContext · interface · L54-L59 — interface SessionEndContext
- HookContext · type · L62-L67 — type HookContext = | BeforeModelCallContext | AfterToolExecutionContext | TurnEndContext | SessionStartContext | SessionEndContext;
- HookFunction · type · L70-L70 — type HookFunction = (context: HookContext) => Promise<void> | void;
- HookEntry · interface · L73-L79 — interface HookEntry
- HookRegistry · class · L88-L219 — class HookRegistry
- register · method · L100-L115 — register( hookPoint: HookPoint, fn: HookFunction, options?: { sessionId?: string; timeoutMs?: number }, ): string
- unregister · method · L123-L125 — unregister(hookId: string): boolean
- getHooks · method · L134-L145 — getHooks(hookPoint: HookPoint, sessionId?: string): HookEntry[]
- dispatch · method · L157-L175 — async dispatch( hookPoint: HookPoint, context: HookContext, sessionId?: string, ): Promise<void>
- executeWithTimeout · method · L180-L204 — private async executeWithTimeout( fn: HookFunction, context: HookContext, timeoutMs: number, hookId: string, ): Promise<void>
- size · method · L209-L211 — get size(): number
- clear · method · L216-L218 — clear(): void
