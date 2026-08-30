## Purpose

Rule-based policy engine that evaluates agent actions against defined policies before execution. Controls what agents can do, what resources they can access, and what operations require approval.

## ADDED Requirements

### Requirement: Policy rules

The policy engine MUST evaluate agent actions against a set of defined rules.

#### Scenario: Rule evaluation
- **WHEN** an agent attempts an action (tool invocation, capability access)
- **THEN** the policy engine evaluates the action against all matching rules

#### Scenario: Allow rule
- **WHEN** a matching rule has effect `allow`
- **THEN** the action is permitted

#### Scenario: Deny rule
- **WHEN** a matching rule has effect `deny`
- **THEN** the action is blocked and an error is returned

#### Scenario: Deny overrides allow
- **WHEN** both allow and deny rules match an action
- **THEN** the deny rule takes precedence

### Requirement: Policy types

The policy engine MUST support different policy types.

#### Scenario: Capability policy
- **WHEN** a capability execution is evaluated
- **THEN** policies can restrict by capability name, operation, and parameters

#### Scenario: Resource policy
- **WHEN** a file or resource access is evaluated
- **THEN** policies can restrict by path pattern, operation (read/write/execute)

#### Scenario: Time-based policy
- **WHEN** a time-based policy is defined
- **THEN** actions are only allowed during specified time windows

### Requirement: Approval workflow

The policy engine MUST support requiring human approval for sensitive operations.

#### Scenario: Approval required
- **WHEN** a policy requires approval for an action
- **THEN** the action is queued and the user is notified

#### Scenario: Approval granted
- **WHEN** the user approves the queued action
- **THEN** the action is executed

#### Scenario: Approval denied
- **WHEN** the user denies the queued action
- **THEN** the action is blocked and the agent is notified
