# src/store/causal-graph.ts · [[causal-graph-analysis]] [[event-sourcing-persistence-system]]

- CausalGraphNode · interface · L15-L18 — interface CausalGraphNode
- buildCausalGraph · function · L28-L50 — function buildCausalGraph( events: readonly BaseEvent[], ): Map<string, CausalGraphNode>
- findDownstream · function · L60-L89 — function findDownstream( eventId: string, events: readonly BaseEvent[], ): BaseEvent[]
- findIndependentChains · function · L95-L140 — function findIndependentChains( events: readonly BaseEvent[], ): string[][]
- getCausalParents · function · L150-L154 — function getCausalParents(event: BaseEvent): string[]
