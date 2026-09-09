## 1. Causal Events Foundation

- [ ] 1.1 Add `causal_parents?: string[]` field to `BaseEvent` interface in `src/types/events.ts`. Verify: `deno check src/types/events.ts` passes; existing event creation tests still pass.
- [ ] 1.2 Update `EventStream.append()` to accept optional `causalParents` parameter. Store on event. Verify: unit test — event without causal_parents defaults to `[]`; event with parents stores them correctly.
- [ ] 1.3 Add `buildCausalGraph(sessionId)` to `EventStore`. Returns `Map<string, { event: BaseEvent, children: string[] }>`. Verify: unit test — 5 events with known parents, assert adjacency list correctness.
- [ ] 1.4 Add `findDownstream(eventId)` and `findIndependentChains(sessionId)` to EventStore. Verify: unit test — downstream returns correct transitive closure; independent chains correctly identified.
- [ ] 1.5 Backward compatibility tests: load events without causal_parents from disk, verify treated as roots. Mixed sessions (some with parents, some without) work correctly.

## 2. Provenance Graph Module

- [ ] 2.1 Create `src/provenance/types.ts`: ProvenanceNode types (Goal, Exploration, Commitment, Verification, PatchProposal), edge types, graph interfaces. Verify: `deno check src/provenance/types.ts` passes.
- [ ] 2.2 Create `src/provenance/classifier.ts`: rule-based tool call classifier. Verify: unit tests for each classification rule — read→Exploration, edit→Commitment, bash test→Verification, bash build→Execution, unknown→Exploration.
- [ ] 2.3 Create `src/provenance/graph.ts`: ProvenanceGraph class with `addNode()`, `addEdge()`, `getNode()`, `getChildren()`, `getParents()`, `getReachable()`, `getNodesByType()`. Verify: unit tests — O(1) lookup, O(v+e) traversal, 50-node test graph.
- [ ] 2.4 Add JSONL persistence: `writeToDisk(dataDir)` and `loadFromDisk(dataDir)`. Verify: round-trip test — write graph, load it, assert all nodes and edges match. Edge case: empty graph, graph with 1 node.
- [ ] 2.5 Create `src/provenance/mod.ts` barrel export. Verify: all types and classes exported, `deno check src/provenance/mod.ts` passes.

## 3. Provenance-EventStream Integration

- [ ] 3.1 Wire ProvenanceGraph into AgentRuntime: on user input → create Goal node; on tool call → classify and create Exploration/Commitment/Verification node with correct edges. Verify: integration test — 3-turn session produces correct graph structure.
- [ ] 3.2 PatchProposal creation at turn end: aggregate Commitments and Verifications, link to PatchProposal. Verify: integration test — turn with 2 tool calls produces PatchProposal with correct edges.
- [ ] 3.3 ProvenanceGraph persistence on session end: graph written to disk. Verify: integration test — session end writes JSON file, session resume loads it correctly.
- [ ] 3.4 Causal parents on events: when provenance node is created, the corresponding event gets `causal_parents` set. Verify: integration test — event stream contains correct causal parent references.

## 4. Testing Pyramid Validation

- [ ] 4.1 Unit test suite: all classifier rules, all graph operations, all EventStore graph methods. Run `deno test src/provenance/` — all pass.
- [ ] 4.2 Integration test: full agent loop (3 turns, 2 tool calls per turn) with provenance recording. Assert graph structure matches expected DAG. Assert events have correct causal_parents.
- [ ] 4.3 Edge case tests: empty session (no tool calls), single-turn session, session with only explorations (no commitments), session with failed tool calls.
- [ ] 4.4 Performance test: create 500-node provenance graph, measure addNode/addEdge time (<1ms each), measure traversal time (<5ms for full graph).
- [ ] 4.5 Backward compat: run existing test suite with new modules wired in — all existing tests pass without modification.
