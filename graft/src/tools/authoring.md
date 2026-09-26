# src/tools/authoring.ts · [[tool-calling-system]]

- AuthoringDecision · type · L17-L20 — type AuthoringDecision = | { action: "accept"; definition: IToolDefinition; handler: ToolHandler } | { action: "modify"; definition: IToolDefinition; handler: ToolHandler } | { action: "reject"; reason: string };
- ProposalContext · interface · L23-L30 — interface ProposalContext
- ToolProposal · interface · L33-L40 — interface ToolProposal
- ToolAuthoringEvents · interface · L47-L51 — interface ToolAuthoringEvents
- IToolAuthoring · interface · L60-L67 — interface IToolAuthoring
- ToolAuthoring · class · L76-L137 — class ToolAuthoring implements IToolAuthoring
- constructor · method · L81-L84 — constructor(registry: IToolRegistry, events?: ToolAuthoringEvents)
- propose · method · L86-L95 — propose(definition: IToolDefinition, context: ProposalContext): ToolProposal
- decide · method · L97-L132 — decide(proposal: ToolProposal, decision: AuthoringDecision): void
- pending · method · L134-L136 — pending(): ToolProposal[]
