## Purpose

Event projection protocol for UI surface subscription and delivery. Defines how UI surfaces subscribe to event streams and receive updates.

## ADDED Requirements

### Requirement: Subscription protocol

UI surfaces MUST be able to subscribe to event streams using a standard protocol.

#### Scenario: Subscribe to session
- **WHEN** a UI surface subscribes to a session
- **THEN** it receives all events for that session in order

#### Scenario: Subscribe with filter
- **WHEN** a UI surface subscribes with event type filters
- **THEN** it only receives events matching the specified types

#### Scenario: Unsubscribe
- **WHEN** a UI surface unsubscribes from a session
- **THEN** it stops receiving events and releases resources

### Requirement: Event delivery

Events MUST be delivered to subscribed UI surfaces reliably.

#### Scenario: Ordered delivery
- **WHEN** events are delivered to a UI surface
- **THEN** they are delivered in the same order as the event stream

#### Scenario: Delivery guarantee
- **WHEN** an event is written to the stream
- **THEN** all subscribed UI surfaces receive the event before the write is acknowledged

#### Scenario: Reconnection
- **WHEN** a UI surface reconnects after disconnection
- **THEN** it receives all events since the last received event
