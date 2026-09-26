---
name: Scripts & Setup
slug: scripts-setup
type: system
sources:
  - path: scripts/migrate-jsonl-to-duckdb.ts
    hash: 2d001ac42d0f2b0510ce23cae590a42b3c932b175e9e20c2a4625499abbd3e18
  - path: scripts/sandbox-health-check.sh
    hash: c5e35026e9b5a203b0fc459757144b88fb9ffef2da02dbf6ca9d179ebe44a9e2
  - path: scripts/setup-duckdb.sh
    hash: 880cd8abfab6cdea304ab75fab42d4f610881c6d14011f086522a98127b030a8
  - path: scripts/setup-sandbox.sh
    hash: 0f53c04a1c74a5187f0909c0eb1f214152f04c133cd42595a729183a9141d119
sources_digest: 974657fecee1317749586e93ead2dcffafa3fb4a936714f8e90dbb8f89c5777f
links:
  - to: event-sourcing-core
    relation: produces
    description: Migration script loads events into DuckDB for analysis
  - to: sandboxed-execution
    relation: configures
    description: Setup scripts install and verify gVisor runtime for sandboxed execution
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Infrastructure scripts for environment setup: DuckDB native binding installation, gVisor sandbox configuration with health verification, and JSONL-to-DuckDB data migration. These ensure the runtime dependencies (Docker, gVisor, DuckDB) are properly installed and configured.

## Related

- produces [[event-sourcing-core]] — Migration script loads events into DuckDB for analysis
- configures [[sandboxed-execution]] — Setup scripts install and verify gVisor runtime for sandboxed execution
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
