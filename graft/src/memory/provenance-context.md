# src/memory/provenance-context.ts · [[memory-system]] [[provenance-aware-context-pruning]]

- ProvenanceContextManager · class · L55-L368 — class ProvenanceContextManager extends ContextManager
- constructor · method · L61-L64 — constructor(config: ProvenanceContextConfig = {})
- setProvenanceGraph · method · L67-L70 — setProvenanceGraph(graph: ProvenanceGraphData): void
- getProvenanceGraph · method · L73-L75 — getProvenanceGraph(): ProvenanceGraphData | null
- setMemoryRetrieval · method · L78-L80 — setMemoryRetrieval(retrieval: MemoryRetrieval): void
- add · method · L85-L106 — override add(message: Message): void
- compressToolResult · method · L115-L155 — compressToolResult( result: string, toolCallId: string, eventId: string, ): CompressionResult
- getReferencedLines · method · L160-L177 — private getReferencedLines(toolCallId: string): number[]
- assembleContext · method · L186-L221 — assembleContext( systemPrompt: string, goalMessage: Message | null, previousTurns: Message[], currentInput: Message, _maxTokens: number, ): Message[]
- calculateBudget · method · L223-L233 — private calculateBudget(_maxTokens: number): TokenBudget
- compressTurnsToSummary · method · L235-L250 — private compressTurnsToSummary(turns: Message[]): string
- retrieveProvenanceScoredMemories · method · L252-L264 — private async retrieveProvenanceScoredMemories(query: string): Promise<Array<{ memory: AnyMemory; score: number; }>>
- enforceBudget · method · L266-L323 — private enforceBudget( messages: Message[], budget: TokenBudget, maxTokens: number, ): Message[]
- createBeforeModelCallHook · method · L332-L367 — createBeforeModelCallHook(): (context: { sessionId: string; messages: Message[] }) => Promise<void>
