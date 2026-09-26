# src/runtime/dynamic-tool-registry.ts · [[dynamic-tool-management]] [[runtime-orchestration]]

- ToolState · interface · L17-L23 — interface ToolState
- ToolAction · interface · L26-L31 — interface ToolAction
- PatternMapping · interface · L34-L38 — interface PatternMapping
- ToolLifecycleHooks · interface · L41-L45 — interface ToolLifecycleHooks
- IDynamicToolRegistry · interface · L51-L58 — interface IDynamicToolRegistry
- DynamicToolRegistry · class · L64-L232 — class DynamicToolRegistry implements IDynamicToolRegistry
- constructor · method · L86-L92 — constructor( private readonly eventStream: IEventStream, _toolRegistry: ToolRegistry, hooks: ToolLifecycleHooks = {}, )
- evaluatePatterns · method · L94-L129 — async evaluatePatterns(report: AnalysisReport): Promise<ToolAction[]>
- enableTool · method · L131-L157 — async enableTool(name: string, reason: string): Promise<void>
- disableTool · method · L159-L191 — async disableTool(name: string, reason: string): Promise<void>
- updateTool · method · L193-L209 — async updateTool(name: string, changes: Record<string, unknown>): Promise<void>
- getToolState · method · L211-L213 — getToolState(name: string): ToolState | undefined
- getAllToolStates · method · L215-L217 — getAllToolStates(): ToolState[]
- executeAction · method · L219-L231 — private async executeAction(action: ToolAction): Promise<void>
