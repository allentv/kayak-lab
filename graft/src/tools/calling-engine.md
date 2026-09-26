# src/tools/calling-engine.ts · [[tool-calling-system]]

- ToolCallingError · class · L20-L32 — class ToolCallingError extends Error
- constructor · method · L23-L31 — constructor( message: string, public readonly toolName: string, cause?: Error, )
- ToolInvocationTimeoutError · class · L34-L39 — class ToolInvocationTimeoutError extends ToolCallingError
- constructor · method · L35-L38 — constructor(toolName: string, timeoutMs: number)
- IToolCallingEngine · interface · L48-L84 — interface IToolCallingEngine
- ToolCallingEngine · class · L93-L215 — class ToolCallingEngine implements IToolCallingEngine
- validate · method · L94-L97 — validate(toolDef: IToolDefinition, params: Record<string, unknown>): void
- invoke · method · L99-L156 — async invoke( toolDef: IToolDefinition, handler: ToolHandler, params: Record<string, unknown>, context: Omit<ToolHandlerContext, "timeout_ms">, timeoutMs?: number, ): Promise<ToolResult>
- formatSuccess · method · L158-L173 — formatSuccess( toolCallId: string, toolName: string, output: unknown, durationMs: number, ): ToolResult
- formatError · method · L175-L190 — formatError( toolCallId: string, toolName: string, error: Error, durationMs: number, ): ToolResult
- invokeWithTimeout · method · L192-L214 — private invokeWithTimeout( fn: () => Promise<unknown> | unknown, timeoutMs: number, toolName: string, ): Promise<unknown>
