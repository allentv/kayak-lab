/**
 * DuckDB test setup.
 *
 * Imports the duckdb npm package and exposes it on globalThis.__duckdb
 * so that DuckDBPersistenceBackend can find it. Import this module
 * at the top of any test file that instantiates DuckDB backends.
 *
 * If the duckdb native binary is not installed, the import will throw
 * and the test will be skipped with a clear error.
 */
import duckdb from "duckdb";

// DuckDBPersistenceBackend reads globalThis.__duckdb at construction time
// and calls `new duckdbModule(dbPath)`. The default export is a namespace
// object; Database is the constructor.
const g = globalThis as Record<string, unknown>;
g.__duckdb = duckdb.Database;
