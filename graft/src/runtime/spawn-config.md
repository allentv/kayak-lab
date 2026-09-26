# src/runtime/spawn-config.ts · [[runtime-orchestration]]

- SpawnConfigBuilder · class · L27-L130 — class SpawnConfigBuilder
- constructor · method · L33-L35 — constructor(registry: ProfileRegistry)
- fromProfile · method · L38-L42 — fromProfile(name: string): this
- withModel · method · L45-L48 — withModel(model: string): this
- withThinking · method · L51-L54 — withThinking(level: "off" | "low" | "medium" | "high"): this
- withTools · method · L57-L60 — withTools(tools: string[]): this
- withContext · method · L63-L66 — withContext(context: string): this
- withSystemPrompt · method · L69-L72 — withSystemPrompt(prompt: string): this
- withMaxContextMessages · method · L75-L78 — withMaxContextMessages(n: number): this
- withMaxTokens · method · L81-L84 — withMaxTokens(max: number): this
- withTemperature · method · L87-L90 — withTemperature(temp: number): this
- withStreaming · method · L93-L96 — withStreaming(streaming: boolean): this
- withMaxIterations · method · L99-L102 — withMaxIterations(n: number): this
- withToolTimeout · method · L105-L108 — withToolTimeout(ms: number): this
- build · method · L111-L129 — build(): SpawnConfig
- createSpawnConfig · function · L135-L137 — function createSpawnConfig(registry: ProfileRegistry): SpawnConfigBuilder
