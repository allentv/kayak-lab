## Purpose

REST API exposure for provenance graph data created in Phase 1, enabling external tools and UIs to query agent reasoning chains.

## Requirements

### Requirement: Provenance Graph API

Provenance data MUST be queryable via REST API.

#### Scenario: GET /api/sessions/:id/provenance
- **WHEN** a client requests the provenance graph for a session
- **THEN** the system returns the full graph (nodes and edges) or 404 if no graph exists

#### Scenario: GET /api/sessions/:id/provenance/nodes?type=goal
- **WHEN** a client requests nodes filtered by type
- **THEN** the system returns only nodes of the specified type

#### Scenario: GET /api/sessions/:id/provenance/chain/:nodeId
- **WHEN** a client requests the causal chain for a specific node
- **THEN** the system returns the ordered path from the originating Goal to the specified node
