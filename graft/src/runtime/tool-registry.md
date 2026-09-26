# src/runtime/tool-registry.ts · [[runtime-orchestration]]

- ToolContext · interface · L15-L19 — interface ToolContext
- ToolResult · interface · L22-L28 — interface ToolResult
- ToolHandler · type · L31-L34 — type ToolHandler<TParams = unknown, TResult = unknown> = ( params: TParams, context: ToolContext, ) => Promise<TResult> | TResult;
- ToolRegistration · interface · L37-L43 — interface ToolRegistration
- ToolError · class · L49-L63 — class ToolError extends Error
- constructor · method · L53-L62 — constructor( message: string, toolName: string, cause?: Error, )
- ToolNotFoundError · class · L65-L70 — class ToolNotFoundError extends ToolError
- constructor · method · L66-L69 — constructor(toolName: string)
- ToolTimeoutError · class · L72-L77 — class ToolTimeoutError extends ToolError
- constructor · method · L73-L76 — constructor(toolName: string, timeoutMs: number)
- ToolRegistry · class · L86-L225 — class ToolRegistry
- register · method · L92-L94 — register(registration: ToolRegistration): void
- unregister · method · L99-L101 — unregister(name: string): boolean
- getDefinition · method · L106-L115 — getDefinition(name: string): ToolDefinition | undefined
- getDefinitions · method · L120-L126 — getDefinitions(): ToolDefinition[]
- has · method · L131-L133 — has(name: string): boolean
- invoke · method · L138-L196 — async invoke( toolCall: ToolCall, context: Omit<ToolContext, "tool_call_id">, ): Promise<ToolResult>
- invokeWithTimeout · method · L201-L224 — private invokeWithTimeout( handler: ToolHandler, params: unknown, context: ToolContext, toolName: string, timeoutMs: number, ): Promise<unknown>
