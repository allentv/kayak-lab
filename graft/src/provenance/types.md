# src/provenance/types.ts · [[provenance-graph-system]]

- ProvenanceNodeType · enum · L13-L19 — enum ProvenanceNodeType
- ProvenanceNode · interface · L28-L41 — interface ProvenanceNode
- GoalNode · interface · L48-L52 — interface GoalNode extends ProvenanceNode
- ExplorationNode · interface · L55-L63 — interface ExplorationNode extends ProvenanceNode
- CommitmentNode · interface · L66-L74 — interface CommitmentNode extends ProvenanceNode
- VerificationNode · interface · L77-L85 — interface VerificationNode extends ProvenanceNode
- PatchProposalNode · interface · L88-L98 — interface PatchProposalNode extends ProvenanceNode
- AnyProvenanceNode · type · L105-L110 — type AnyProvenanceNode = | GoalNode | ExplorationNode | CommitmentNode | VerificationNode | PatchProposalNode;
- ProvenanceEdge · interface · L117-L124 — interface ProvenanceEdge
- ProvenanceGraphData · interface · L131-L138 — interface ProvenanceGraphData
