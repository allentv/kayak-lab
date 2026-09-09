## 1. Provenance-Aware ContextManager

- [ ] 1.1 Create `src/memory/provenance-context.ts` with ProvenanceContextManager extending ContextManager. Add `setProvenanceGraph(graph)`. Verify: unit test — without graph, falls back to positional pruning (identical to base class).
- [ ] 1.2 Implement provenance-weighted scoring in `trim()`: base priorities (system=1000, goal=900, commitment=800, verification=700, exploration=500, other=300) + outcome scores (success=+200, failure=-100, dead_end=-200, no_link=0). Verify: unit test — 10 messages with known provenance, assert correct pruning order.
- [ ] 1.3 Goal messages never pruned. Verify: unit test — context at max capacity with Goal message, assert Goal retained after trim.
- [ ] 1.4 Fallback when graph has <3 nodes. Verify: unit test — graph with 1-2 nodes, assert positional pruning used.

## 2. Tool Result Compression

- [ ] 2.1 Add `compressToolResult(result, provenanceGraph)` to ProvenanceContextManager. When result > 2000 tokens and has provenance links, compress to referenced content. Verify: unit test — 3000-token result compressed to ~500 tokens; referenced lines preserved.
- [ ] 2.2 Compression preserves audit reference: compressed result includes `full_reference: event_id`. Verify: unit test — compressed result has full_reference field; original recoverable.
- [ ] 2.3 Small results (<2000 tokens) kept in full. Verify: unit test — 1000-token result unchanged after compression attempt.
- [ ] 2.4 Compression applied in context assembly: when adding tool result to context, compress if applicable. Verify: integration test — context contains compressed tool results, total tokens < original.

## 3. Hook-Driven Context Assembly

- [ ] 3.1 Implement `before_model_call` hook in ProvenanceContextManager: queries provenance graph for current Goal, retrieves relevant memories, assembles context sections. Verify: unit test — hook produces context with system, goal, summary, memories, input sections.
- [ ] 3.2 Context summary injection: hook compresses previous turns to summary based on provenance chain. Verify: unit test — 10-turn context compressed to ~3 summary messages; key decisions preserved.
- [ ] 3.3 Token budget enforcement: assembled context respects max_tokens. Allocation: system (fixed), goal (25%), summary (15%), history (40%), memories (20%). Verify: unit test — context within budget; no section exceeds allocation.
- [ ] 3.4 Hook wired into AgentRuntime: registered at `before_model_call` point. Model receives assembled context. Verify: integration test — run 3-turn session, assert model receives correctly assembled context.

## 4. Memory Integration

- [ ] 4.1 Add `provenanceScore` to memory retrieval results. Score: +1.0 success-linked, -0.5 dead-end-linked, 0 unlinked. Verify: unit test — memory with success link scores higher than unlinked; dead-end linked scores lower.
- [ ] 4.2 Update MemoryRetrieval ranking: `final_score = relevance_score + 0.3 * provenance_score`. Verify: unit test — two memories with same relevance, different provenance scores, correct ranking order.
- [ ] 4.3 ProvenanceContextManager integrates with MemoryRetrieval: `before_model_call` hook uses provenance-scored retrieval. Verify: integration test — hook retrieves top-5 memories by provenance score, not just relevance.

## 5. Testing Pyramid Validation

- [ ] 5.1 Unit test suite: scoring formula, compression logic, budget allocation, memory scoring. Run `deno test src/memory/provenance-context.ts` — all pass.
- [ ] 5.2 Integration test: full agent loop with ProvenanceContextManager. Assert context assembled correctly at each turn. Assert tool results compressed when applicable.
- [ ] 5.3 Token usage comparison: run identical 10-turn session with old ContextManager vs ProvenanceContextManager. Assert token reduction ≥50%. Document exact numbers.
- [ ] 5.4 Regression test: run 5 different task types (read-only, edit-only, mixed, failed, long session). Assert agent completes all successfully with new context manager. Assert no quality degradation (same final responses or better).
- [ ] 5.5 Edge cases: empty provenance graph, session with only explorations (no commitments), session with only failed tool calls, context at exactly max capacity.
- [ ] 5.6 Performance: context assembly before model call (<10μs); tool result compression (<1ms for 5000-token result); memory retrieval with provenance scoring (<5ms).
- [ ] 5.7 Backward compat: run existing test suite with ProvenanceContextManager — all existing tests pass. Positional fallback works correctly.
