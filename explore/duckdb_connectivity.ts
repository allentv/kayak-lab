/**
 * DuckDB Exploration: Connectivity & Query Ergonomics in Deno
 *
 * Tests:
 * 1. WASM-based DuckDB initialization
 * 2. Table creation & data loading
 * 3. JSON ingestion (simulating JSONL events)
 * 4. Query patterns matching kayak-lab's query engine
 * 5. Cross-table joins (events × memories)
 * 6. Performance characteristics
 */

import * as duckdb from "npm:@duckdb/duckdb-wasm";

// ============================================================================
// 1. Initialization
// ============================================================================

console.log("=== DuckDB WASM Connectivity Test ===\n");

// Get bundles
const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

console.log(`Selected bundle: ${bundle.mainWorker}`);
console.log(`Module: ${bundle.mainModule}`);

// Create worker and database
const worker = await duckdb.createWorker(bundle.mainWorker);
const db = await duckdb.createAsyncDuckDB(bundle.mainModule, worker);
const conn = await db.connect();

console.log("✅ Connected to DuckDB WASM\n");

// ============================================================================
// 2. Table Creation & Data Loading
// ============================================================================

console.log("=== Schema Setup ===\n");

await conn.query(`
  CREATE TABLE events (
    id VARCHAR DEFAULT (uuid()),
    session_id VARCHAR NOT NULL,
    sequence INTEGER NOT NULL,
    event_type VARCHAR NOT NULL,
    payload JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON
  );
`);

await conn.query(`
  CREATE TABLE memories (
    id VARCHAR DEFAULT (uuid()),
    type VARCHAR NOT NULL,
    session_id VARCHAR,
    content VARCHAR NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("✅ Tables created: events, memories\n");

// ============================================================================
// 3. Data Loading (simulating kayak-lab sessions)
// ============================================================================

console.log("=== Loading Test Data ===\n");

// Generate realistic event data
const eventTypes = [
  "session.created",
  "session.started",
  "tool.invocation",
  "tool.success",
  "tool.failure",
  "model.invocation",
  "model.response",
  "error",
  "session.completed",
];

const toolNames = ["shell", "read", "write", "edit", "grep", "glob", "lsp"];

const sessions = Array.from({ length: 20 }, (_, i) => `session-${String(i).padStart(3, "0")}`);

// Insert events in batches
const eventRows: string[] = [];
let seq = 0;

for (const sessionId of sessions) {
  const numEvents = Math.floor(Math.random() * 50) + 20; // 20-70 events per session
  
  for (let i = 0; i < numEvents; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const toolName = toolNames[Math.floor(Math.random() * toolNames.length)];
    const durationMs = Math.floor(Math.random() * 5000) + 10;
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const payload = JSON.stringify({
      tool_name: toolName,
      duration_ms: durationMs,
      success: !eventType.includes("failure"),
      tokens_used: Math.floor(Math.random() * 10000),
    });

    eventRows.push(
      `('${sessionId}', ${seq++}, '${eventType}', '${payload}'::JSON, '${timestamp}'::TIMESTAMP)`
    );
  }
}

await conn.query(`
  INSERT INTO events (session_id, sequence, event_type, payload, timestamp)
  VALUES ${eventRows.join(",\n")}
`);

const eventCount = await conn.query("SELECT COUNT(*) as count FROM events");
console.log(`✅ Inserted ${eventCount.toArray()[0].count} events`);

// Insert memories
const memoryRows = [
  ("semantic", "session-001", "User prefers dark mode interface"),
  ("semantic", "session-002", "Project uses TypeScript with strict mode"),
  ("procedural", "session-003", "Always run tests before committing"),
  ("episodic", "session-004", "User reported error with LSP connection"),
  ("semantic", "session-005", "Code review requires 2 approvals"),
].map(([type, sid, content]) => `('${type}', '${sid}', '${content}')`);

await conn.query(`
  INSERT INTO memories (type, session_id, content)
  VALUES ${memoryRows.join(",\n")}
`);

const memoryCount = await conn.query("SELECT COUNT(*) as count FROM memories");
console.log(`✅ Inserted ${memoryCount.toArray()[0].count} memories\n`);

// ============================================================================
// 4. Query Ergonomics - Matching kayak-lab patterns
// ============================================================================

console.log("=== Query Ergonomics Test ===\n");

// Pattern 1: Tool performance metrics (from query-engine.ts)
console.log("--- Tool Performance Metrics ---");
const toolPerf = await conn.query(`
  SELECT 
    json_extract_string(payload, '$.tool_name') as tool_name,
    COUNT(*) as total_invocations,
    COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'true' THEN 1 END) as success_count,
    COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'false' THEN 1 END) as failure_count,
    ROUND(
      COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'true' THEN 1 END) * 100.0 / COUNT(*),
      2
    ) as success_rate,
    ROUND(AVG(json_extract(payload, '$.duration_ms')), 2) as avg_duration_ms
  FROM events
  WHERE event_type IN ('tool.invocation', 'tool.success', 'tool.failure')
  GROUP BY tool_name
  ORDER BY total_invocations DESC
`);

console.log(toolPerf.toString());

// Pattern 2: Session summaries (from query-engine.ts)
console.log("\n--- Session Summaries ---");
const sessionSummaries = await conn.query(`
  SELECT 
    session_id,
    COUNT(*) as total_events,
    MIN(timestamp) as started_at,
    MAX(timestamp) as last_event_at,
    ROUND(EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) * 1000, 0) as duration_ms,
    COUNT(CASE WHEN event_type LIKE 'tool.%' THEN 1 END) as tool_call_count,
    COUNT(CASE WHEN event_type LIKE 'model.%' THEN 1 END) as model_invocation_count
  FROM events
  GROUP BY session_id
  ORDER BY total_events DESC
  LIMIT 5
`);

console.log(sessionSummaries.toString());

// Pattern 3: Event type distribution (from query-engine.ts)
console.log("\n--- Event Type Distribution ---");
const eventDist = await conn.query(`
  SELECT 
    event_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM events), 2) as percentage
  FROM events
  GROUP BY event_type
  ORDER BY count DESC
`);

console.log(eventDist.toString());

// Pattern 4: Error patterns (from query-engine.ts)
console.log("\n--- Error Patterns ---");
const errorPatterns = await conn.query(`
  SELECT 
    event_type as error_type,
    json_extract_string(payload, '$.tool_name') as tool_name,
    COUNT(*) as count,
    MAX(timestamp) as last_occurrence
  FROM events
  WHERE event_type IN ('tool.failure', 'error')
  GROUP BY error_type, tool_name
  ORDER BY count DESC
`);

console.log(errorPatterns.toString());

// ============================================================================
// 5. Cross-Table Joins (Events × Memories)
// ============================================================================

console.log("\n=== Cross-Table Joins ===\n");

console.log("--- Sessions with Related Memories ---");
const crossJoin = await conn.query(`
  SELECT 
    e.session_id,
    COUNT(DISTINCT e.id) as event_count,
    COUNT(DISTINCT m.id) as memory_count,
    ARRAY_AGG(DISTINCT m.type) as memory_types
  FROM events e
  LEFT JOIN memories m ON e.session_id = m.session_id
  GROUP BY e.session_id
  HAVING memory_count > 0
  ORDER BY event_count DESC
`);

console.log(crossJoin.toString());

// ============================================================================
// 6. JSON Ingestion (simulating JSONL file loading)
// ============================================================================

console.log("\n=== JSON/JSONL Ingestion ===\n");

// Create a temporary JSONL file
const jsonlPath = "/tmp/kayak_events.jsonl";
const jsonlLines = sessions.slice(0, 5).map((sid) =>
  JSON.stringify({
    session_id: sid,
    event_type: "session.created",
    payload: { state: "active" },
    timestamp: new Date().toISOString(),
  })
).join("\n");

await Deno.writeTextFile(jsonlPath, jsonlLines);
console.log(`✅ Wrote ${sessions.length} sessions to ${jsonlPath}`);

// Load JSONL with DuckDB
await conn.query(`
  CREATE TABLE loaded_events AS 
  SELECT * FROM read_json_auto('${jsonlPath}')
`);

const loadedCount = await conn.query("SELECT COUNT(*) as count FROM loaded_events");
console.log(`✅ Loaded ${loadedCount.toArray()[0].count} events from JSONL`);

// Clean up
await Deno.remove(jsonlPath);

// ============================================================================
// 7. Performance: Bulk Insert Benchmark
// ============================================================================

console.log("\n=== Performance Test ===\n");

console.log("--- Bulk Insert (10,000 events) ---");
const bulkStart = performance.now();

const bulkRows: string[] = [];
for (let i = 0; i < 10000; i++) {
  const sid = `session-bulk-${i % 100}`;
  const eventType = eventTypes[i % eventTypes.length];
  const timestamp = new Date(Date.now() - i * 1000).toISOString();
  bulkRows.push(
    `('${sid}', ${i}, '${eventType}', '{}'::JSON, '${timestamp}'::TIMESTAMP)`
  );
}

// Insert in chunks of 1000
for (let i = 0; i < bulkRows.length; i += 1000) {
  const chunk = bulkRows.slice(i, i + 1000);
  await conn.query(`
    INSERT INTO events (session_id, sequence, event_type, payload, timestamp)
    VALUES ${chunk.join(",\n")}
  `);
}

const bulkDuration = performance.now() - bulkStart;
console.log(`✅ Inserted 10,000 events in ${bulkDuration.toFixed(2)}ms`);
console.log(`   Rate: ${(10000 / (bulkDuration / 1000)).toFixed(0)} events/sec`);

// Final count
const finalCount = await conn.query("SELECT COUNT(*) as count FROM events");
console.log(`\nTotal events in database: ${finalCount.toArray()[0].count}`);

// ============================================================================
// Cleanup
// ============================================================================

await conn.close();
await db.terminate();
await worker.terminate();

console.log("\n✅ Exploration complete");
