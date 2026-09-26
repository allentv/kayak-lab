# src/mcp/search.ts · [[model-context-protocol-mcp-integration]]

Provides search functionality for MCP tools by name, capability, and category with server status information.

- MCPSearch · class · L28-L105 — Search interface for MCP tools that searches across the MCP registry and provides server status.
- constructor · method · L32-L39 — Initializes the search instance with registry and client dependencies.
- search · method · L41-L91 — Performs filtered search across MCP tools by name, capability, and category while building server status summaries.
- getClientState · method · L93-L96 — Retrieves the connection state of a specific MCP server client.
- on · method · L98-L100 — Registers event listeners for search-related events.
- off · method · L102-L104 — Removes event listeners for search-related events.
