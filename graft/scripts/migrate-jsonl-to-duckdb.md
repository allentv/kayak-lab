# scripts/migrate-jsonl-to-duckdb.ts · [[scripts-setup]]

- DuckDBDatabase · interface · L24-L27 — Interface defining the connection management operations for a DuckDB database instance.
- DuckDBConnection · interface · L29-L34 — Interface for executing SQL commands and preparing statements against a DuckDB database connection.
- DuckDBStatement · interface · L36-L39 — Interface for running parameterized SQL statements and cleaning up prepared statement resources.
- DuckDBRow · type · L41-L41 — Type alias representing a database row as a key-value map with unknown values.
- getJsonlFiles · function · L47-L55 — Scans a directory to collect all JSONL files for migration processing.
- parseJsonlFile · function · L57-L61 — Reads and parses a JSONL file into an array of JavaScript objects for database insertion.
- createSchema · function · L63-L90 — Creates the database tables (events, memories, snapshots) needed to store migrated event data.
- insertEventsBatch · function · L92-L120 — Inserts a batch of parsed event objects into the events table with proper field mapping and defaults.
- verifyMigration · function · L122-L144 — Validates the migration by comparing event counts from JSONL files against the database to ensure data integrity.
- migrate · function · L150-L197 — Orchestrates the complete migration workflow from file discovery to schema creation, batch insertion, and optional verification.
