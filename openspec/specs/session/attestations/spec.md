## Purpose

Structured session-end audit nodes recording model breakdown, token counts, cost attribution, duration, and lines changed. Enables cost tracking, model performance comparison, and compliance auditing.

## Requirements

### Requirement: Attestation Creation

An attestation MUST be created when a session ends.

#### Scenario: Attestation emitted as event
- **WHEN** a session transitions to "completed" or "cancelled"
- **THEN** a `session.attestation` event is emitted with aggregated session metrics

#### Scenario: Attestation includes model breakdown
- **WHEN** an attestation is created
- **THEN** it includes per-model metrics: model_name, provider, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, and estimated_cost_usd

#### Scenario: Attestation includes session summary
- **WHEN** an attestation is created
- **THEN** it includes session_id, duration_ms, total_tool_calls, total_model_invocations, files_changed (count), lines_added, and lines_removed

#### Scenario: Attestation includes provenance summary
- **WHEN** an attestation is created and provenance graph exists
- **THEN** it includes total_goals, total_explorations, total_commitments, total_verifications, and exploration_to_commitment_ratio

### Requirement: Cost Calculation

Cost MUST be calculated from model pricing data and token usage.

#### Scenario: Cost calculated from token counts
- **WHEN** model usage events exist for a session
- **THEN** cost is calculated as (input_tokens × input_price + output_tokens × output_price + cache_read_tokens × cache_read_price) per model

#### Scenario: Missing pricing data
- **WHEN** a model's pricing data is not available
- **THEN** the cost for that model is recorded as null, and the total excludes it

#### Scenario: Cumulative cost across model calls
- **WHEN** multiple model calls use the same model
- **THEN** token counts and cost are aggregated across all calls

### Requirement: Attestation Persistence

Attestations MUST be persisted and queryable.

#### Scenario: Stored alongside session events
- **WHEN** an attestation is created
- **THEN** it is written to the session's data directory as structured JSON

#### Scenario: Queryable via EventQueryEngine
- **WHEN** a query requests attestations
- **THEN** the system returns matching attestations with full metrics

#### Scenario: Chains across resumed sessions
- **WHEN** a session is resumed and multiple attestation periods exist
- **THEN** each attestation includes a `previous_attestation` field linking to the prior one

### Requirement: Attestation REST API

Attestations MUST be accessible via REST API.

#### Scenario: GET /api/sessions/:id/attestation
- **WHEN** a client requests the attestation for a session
- **THEN** the system returns the attestation JSON or 404 if not yet created

#### Scenario: GET /api/attestations
- **WHEN** a client requests attestations across sessions
- **THEN** the system returns a list sortable by cost, duration, or date
