## Purpose

Provenance graph data feeds back into context management, replacing positional trimming with provenance-weighted pruning, enabling semantic compression of tool results, and hook-driven dynamic context assembly. This is the primary token-saving mechanism.

## ADDED Requirements

### Requirement: Provenance-Weighted Context Pruning

ContextManager MUST use provenance data to prioritize which messages to keep when trimming.

#### Scenario: Keep messages in successful causal chains
- **WHEN** context needs trimming and provenance graph is available
- **THEN** messages linked to successful outcomes (Verification passed, Commitment completed) are retained with higher priority than messages linked to dead ends

#### Scenario: Deprioritize dead-end explorations
- **WHEN** an Exploration node leads to no subsequent Commitment or leads to a failed Verification
- **THEN** the associated tool result messages are marked as low-priority for pruning

#### Scenario: Preserve Goal context
- **WHEN** context needs trimming
- **THEN** Goal nodes and their directly linked messages are never pruned

#### Scenario: Fallback to positional pruning
- **WHEN** provenance data is insufficient (no graph, fewer than 3 nodes)
- **THEN** the system falls back to existing positional (drop oldest) pruning

### Requirement: Semantic Compression of Tool Results

Tool results MUST be compressible based on what was actually used in downstream reasoning.

#### Scenario: Compress tool result to referenced content
- **WHEN** a tool result exceeds a configurable threshold (default 2000 tokens) and has provenance links
- **THEN** the system compresses the tool result to only content referenced in downstream Commitments

#### Scenario: Compression preserves audit trail
- **WHEN** a tool result is compressed
- **THEN** the compressed version includes a reference to the full original (event ID) for audit recovery

#### Scenario: Small results kept in full
- **WHEN** a tool result is below the compression threshold
- **THEN** it is kept in full without compression

### Requirement: Hook-Driven Context Assembly

A `before_model_call` hook MUST dynamically assemble context based on the current task.

#### Scenario: Task-aware memory retrieval
- **WHEN** a `before_model_call` hook fires
- **THEN** it queries the provenance graph to determine which memories are relevant to the current Goal and retrieves only those

#### Scenario: Context summary injection
- **WHEN** a `before_model_call` hook fires
- **THEN** it can inject a compressed summary of previous turns instead of full message history

#### Scenario: Hook modifies context before model call
- **WHEN** the hook modifies the context object
- **THEN** the model is invoked with the modified context

### Requirement: Provenance-Aware Memory Scoring

MemoryRetrieval MUST rank memories based on their provenance links.

#### Scenario: Successful outcome memories ranked higher
- **WHEN** a memory is linked via provenance to a session that completed successfully
- **THEN** that memory receives a higher relevance score in retrieval results

#### Scenario: Dead-end memories ranked lower
- **WHEN** a memory is linked via provenance to explorations that led to no useful outcome
- **THEN** that memory receives a lower relevance score

#### Scenario: Recency weighted by provenance quality
- **WHEN** two memories have similar recency scores
- **THEN** the one linked to a stronger provenance chain ranks higher

### Requirement: Token Budget Enforcement

The context assembly system MUST respect configurable token budgets.

#### Scenario: Total context within budget
- **WHEN** the assembled context exceeds the configured max_tokens budget
- **THEN** the system prunes lowest-priority messages until within budget

#### Scenario: Budget allocation across sections
- **WHEN** context is assembled
- **THEN** the system allocates budget: system prompt (fixed), active Goal context (high priority), provenance summary (medium), compressed history (lower), retrieved memories (dynamic)
