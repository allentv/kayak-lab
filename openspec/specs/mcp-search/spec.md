# mcp-search Specification

## Purpose
MCP tool search endpoint (separate from internal tool search) for discovering MCP tools from external MCP servers.

## Requirements

### Requirement: MCP Tool Search

The MCP search endpoint MUST provide a way to discover MCP tools from external MCP servers.

#### Scenario: Search MCP tools by name

- **WHEN** a component searches for MCP tools by name
- **THEN** a list of matching MCP tools is returned
- **AND** only enabled tools are included

#### Scenario: Search MCP tools by capability

- **WHEN** a component searches for MCP tools by capability
- **THEN** a list of matching MCP tools is returned
- **AND** only enabled tools are included

#### Scenario: Search MCP tools by category

- **WHEN** a component searches for MCP tools by category
- **THEN** a list of matching MCP tools is returned
- **AND** only enabled tools are included

### Requirement: MCP Tool Search Results

The MCP search endpoint MUST return results with tool details.

#### Scenario: Search results include tool details

- **WHEN** a component searches for MCP tools
- **THEN** the results include tool name, description, parameter schemas, and source server
- **AND** the results include connection status for each server

#### Scenario: Search results include server status

- **WHEN** a component searches for MCP tools
- **THEN** the results include the connection status for each MCP server
- **AND** the results include the number of tools from each server

### Requirement: MCP Tool Search Events

MCP search operations MUST generate events in the event stream for observability.

#### Scenario: MCP search event

- **WHEN** a component searches for MCP tools
- **THEN** a mcp_search event is emitted with search criteria and timestamp
- **AND** the event is appended to the event stream

#### Scenario: MCP search result event

- **WHEN** a component receives MCP search results
- **THEN** a mcp_search_result event is emitted with result count and timestamp
- **AND** the event is appended to the event stream
