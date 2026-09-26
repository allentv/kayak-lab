# src/tools/self-improvement.ts · [[tool-calling-system]] [[tool-self-improvement-feedback-loop]]

- SelfImprovementConfig · interface · L17-L24 — interface SelfImprovementConfig
- ToolSuggestion · interface · L37-L48 — interface ToolSuggestion
- ToolUsageRecord · interface · L51-L57 — interface ToolUsageRecord
- SelfImprovementEvents · interface · L64-L68 — interface SelfImprovementEvents
- IToolSelfImprovement · interface · L77-L86 — interface IToolSelfImprovement
- ToolSelfImprovement · class · L95-L280 — class ToolSelfImprovement implements IToolSelfImprovement
- constructor · method · L102-L112 — constructor( registry: IToolRegistry, authoring: ToolAuthoring, events?: SelfImprovementEvents, config?: Partial<SelfImprovementConfig>, )
- recordUsage · method · L114-L116 — recordUsage(record: ToolUsageRecord): void
- analyze · method · L118-L154 — analyze(): ToolSuggestion[]
- getConfig · method · L156-L158 — getConfig(): SelfImprovementConfig
- setConfig · method · L160-L162 — setConfig(config: Partial<SelfImprovementConfig>): void
- analyzeFailurePatterns · method · L164-L194 — private analyzeFailurePatterns(): ToolSuggestion[]
- analyzeSlowTools · method · L196-L225 — private analyzeSlowTools(): ToolSuggestion[]
- analyzeMissingCapabilities · method · L227-L256 — private analyzeMissingCapabilities(): ToolSuggestion[]
- autoCreate · method · L258-L273 — private autoCreate(suggestion: ToolSuggestion): void
- handler · function · L261-L269 — handler: ToolHandler = async ()
- autoImprove · method · L275-L279 — private autoImprove(suggestion: ToolSuggestion): void
