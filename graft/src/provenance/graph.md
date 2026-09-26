# src/provenance/graph.ts · [[provenance-graph-system]]

- ProvenanceGraph · class · L26-L286 — class ProvenanceGraph
- constructor · method · L36-L38 — constructor(sessionId: string)
- addNode · method · L48-L58 — addNode( node: Omit<ProvenanceNode, "node_id" | "timestamp">, ): ProvenanceNode
- addEdge · method · L64-L89 — addEdge( from: string, to: string, type: ProvenanceEdge["type"] = "causal", ): void
- canReach · method · L94-L112 — private canReach(from: string, to: string): boolean
- getNode · method · L119-L121 — getNode(nodeId: string): ProvenanceNode | undefined
- getChildren · method · L124-L133 — getChildren(nodeId: string): ProvenanceNode[]
- getParents · method · L136-L147 — getParents(nodeId: string): ProvenanceNode[]
- getReachable · method · L153-L180 — getReachable(nodeId: string): ProvenanceNode[]
- getNodesByType · method · L183-L191 — getNodesByType(type: ProvenanceNodeType): ProvenanceNode[]
- toJSON · method · L198-L204 — toJSON(): ProvenanceGraphData
- fromJSON · method · L207-L230 — static fromJSON(data: ProvenanceGraphData): ProvenanceGraph
- writeToDisk · method · L240-L251 — async writeToDisk(dataDir: string): Promise<void>
- loadFromDisk · method · L257-L285 — static async loadFromDisk( dataDir: string, sessionId: string, ): Promise<ProvenanceGraph | undefined>
