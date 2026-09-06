## Purpose

Agent runtime hooks that read own event history before/after turns, providing self-awareness for self-evolving agent behavior.

## ADDED Requirements

### Requirement: Pre-Turn Observation

The self-observation layer SHALL query the agent's event history before each model call and surface relevant insights.

#### Scenario: Observe before first turn
- **WHEN** the agent starts its first turn in a session
- **THEN** the observation layer queries recent sessions for tool performance and surfaces a summary

#### Scenario: Observe before subsequent turns
- **WHEN** the agent starts a subsequent turn in a session
- **THEN** the observation layer queries the current session's events and surfaces relevant context

#### Scenario: No history available
- **WHEN** the agent has no prior event history
- **THEN** the observation layer returns an empty observation with no errors

### Requirement: Post-Turn Observation

The self-observation layer SHALL record observations after each model call completes.

#### Scenario: Record post-turn observation
- **WHEN** the agent completes a model call
- **THEN** the observation layer records an `agent.self_observed` event with the observation data

#### Scenario: Record pattern detection
- **WHEN** the observation layer detects a notable pattern (e.g., repeated tool failure)
- **THEN** the observation layer records an `agent.pattern_detected` event

### Requirement: Observation Types

The self-observation layer SHALL support multiple observation types.

#### Scenario: Tool performance observation
- **WHEN** the agent queries tool performance
- **THEN** the observation returns success rates, failure counts, and average durations per tool

#### Scenario: Error pattern observation
- **WHEN** the agent queries error patterns
- **THEN** the observation returns error types, frequencies, and affected tools

#### Scenario: Session context observation
- **WHEN** the agent queries session context
- **THEN** the observation returns current session event count, tool calls, and model invocations

### Requirement: Observation Integration

The self-observation layer SHALL integrate with the agent runtime without modifying existing behavior.

#### Scenario: Runtime accepts optional observation hook
- **WHEN** the agent runtime is constructed with an observation hook
- **THEN** the hook runs before/after each model call

#### Scenario: Runtime works without observation hook
- **WHEN** the agent runtime is constructed without an observation hook
- **THEN** the runtime behaves exactly as before — no observation, no errors
