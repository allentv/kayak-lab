# src/tools/types.ts · [[tool-calling-system]]

- ParameterSchema · interface · L13-L22 — interface ParameterSchema
- ParameterProperty · interface · L25-L34 — interface ParameterProperty
- ToolCapability · interface · L37-L44 — interface ToolCapability
- ToolCategory · interface · L47-L52 — interface ToolCategory
- IToolDefinition · interface · L58-L73 — interface IToolDefinition
- ToolResult · interface · L80-L95 — interface ToolResult
- ToolHandlerContext · interface · L102-L109 — interface ToolHandlerContext
- ToolHandler · type · L112-L115 — type ToolHandler<TParams = Record<string, unknown>> = ( params: TParams, context: ToolHandlerContext, ) => Promise<ToolResult> | ToolResult;
- ToolRegistration · interface · L122-L129 — interface ToolRegistration extends IToolDefinition
