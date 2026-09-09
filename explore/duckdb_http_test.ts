/**
 * DuckDB Exploration: Connectivity & Query Ergonomics via HTTP API
 *
 * Tests:
 * 1. HTTP connectivity to DuckDB
 * 2. Table creation & data loading
 * 3. JSON ingestion (simulating JSONL events)
 * 4. Query patterns matching kayak-lab's query engine
 * 5. Cross-table joins (events × memories)
 * 6. Performance characteristics
 */

const DUCKDB_URL = "http://127.0.0.1:9876";

async function query(sql: string): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  const resp = await fetch(`${DUCKDB_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  
  const text = await resp.text();
  
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }
  
  try {
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (e) {
    throw new Error(`Failed to parse response: ${text.substring(0, 200)}`);
  }
}

// ============================================================================
// 1. Connectivity
// ============================================================================

console.log("=== DuckDB HTTP Connectivity Test ===\n");

const health = await fetch(`${DUCKDB_URL}/health`);
const healthData = await health.json();
console.log(`Health check: ${JSON.stringify(healthData)}`);
console.log("✅ Connected to DuckDB via HTTP\n");

// ============================================================================
// 2. Schema Setup
// ============================================================================

console.log("=== Schema Setup ===\n");

await query("DROP TABLE IF EXISTS events");
await query("DROP TABLE IF EXISTS memories");
await query("DROP TABLE IF EXISTS loaded_events");

await query(`
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

await query(`
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

// Generate and insert events in batches
let seq = 0;
const batchSize = 500;

for (let batch = 0; batch < sessions.length; batch++) {
  const values: string[] = [];
  
  for (let i = 0; i < 50; i++) {
    const sessionId = sessions[batch];
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

    values.push(
      `('session-${String(batch).padStart(3, "0")}', ${seq++}, '${eventType}', '${payload.replace(/'/g, "''")}'::JSON, '${timestamp}'::TIMESTAMP)`
    );
  }

  await query(`
    INSERT INTO events (session_id, sequence, event_type, payload, timestamp)
    VALUES ${values.join(",\n")}
  `);
}

const eventCount = await query("SELECT COUNT(*) as count FROM events");
console.log(`✅ Inserted ${eventCount.rows[0].count} events`);

// Insert memories
await query(`
  INSERT INTO memories (type, session_id, content) VALUES
  ('semantic', 'session-001', 'User prefers dark mode interface'),
  ('semantic', 'session-002', 'Project uses TypeScript with strict mode'),
  ('procedural', 'session-003', 'Always run tests before committing'),
  ('episodic', 'session-004', 'User reported error with LSP connection'),
  ('semantic', 'session-005', 'Code review requires 2 approvals')
`);

const memoryCount = await query("SELECT COUNT(*) as count FROM memories");
console.log(`✅ Inserted ${memoryCount.rows[0].count} memories\n`);

// ============================================================================
// 4. Query Ergonomics - Matching kayak-lab patterns
// ============================================================================

console.log("=== Query Ergonomics Test ===\n");

// Pattern 1: Tool performance metrics (from query-engine.ts)
console.log("--- Tool Performance Metrics ---");
const toolPerf = await query(`
  SELECT 
    json_extract_string(payload, '$.tool_name') as tool_name,
    COUNT(*) as total_invocations,
    COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'true' THEN 1 END) as success_count,
    COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'false' THEN 1 END) as failure_count,
    ROUND(
      COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'true' THEN 1 END) * 100.0 / COUNT(*),
      2
    ) as success_rate,
    ROUND(AVG(CAST(json_extract(payload, '$.duration_ms') AS DOUBLE)), 2) as avg_duration_ms
  FROM events
  WHERE event_type IN ('tool.invocation', 'tool.success', 'tool.failure')
  GROUP BY tool_name
  ORDER BY total_invocations DESC
`);
console.table(toolPerf.rows);

// Pattern 2: Session summaries (from query-engine.ts)
console.log("\n--- Session Summaries ---");
const sessionSummaries = await query(`
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
console.table(sessionSummaries.rows);

// Pattern 3: Event type distribution (from query-engine.ts)
console.log("\n--- Event Type Distribution ---");
const eventDist = await query(`
  SELECT 
    event_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM events), 2) as percentage
  FROM events
  GROUP BY event_type
  ORDER BY count DESC
`);
console.table(eventDist.rows);

// Pattern 4: Error patterns (from query-engine.ts)
console.log("\n--- Error Patterns ---");
const errorPatterns = await query(`
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
console.table(errorPatterns.rows);

// Pattern 5: Time-series aggregation (dashboard pattern)
console.log("\n--- Hourly Event Volume (Last 7 Days) ---");
const hourlyVolume = await query(`
  SELECT 
    date_trunc('hour', timestamp) as hour,
    COUNT(*) as event_count,
    COUNT(CASE WHEN event_type LIKE 'error%' THEN 1 END) as error_count
  FROM events
  WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  GROUP BY date_trunc('hour', timestamp)
  ORDER BY hour
  LIMIT 10
`);
console.table(hourlyVolume.rows);

// ============================================================================
// 5. Cross-Table Joins (Events × Memories)
// ============================================================================

console.log("\n=== Cross-Table Joins ===\n");

console.log("--- Sessions with Related Memories ---");
const crossJoin = await query(`
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
console.table(crossJoin.rows);

// Pattern 6: Complex multi-dimensional analysis
console.log("\n--- Tool Usage by Session (Pivot) ---");
const pivotQuery = await query(`
  SELECT 
    session_id,
    COUNT(CASE WHEN json_extract_string(payload, '$.tool_name') = 'shell' THEN 1 END) as shell_calls,
    COUNT(CASE WHEN json_extract_string(payload, '$.tool_name') = 'read' THEN 1 END) as read_calls,
    COUNT(CASE WHEN json_extract_string(payload, '$.tool_name') = 'write' THEN 1 END) as write_calls,
    COUNT(CASE WHEN json_extract_string(payload, '$.tool_name') = 'edit' THEN 1 END) as edit_calls,
    COUNT(CASE WHEN json_extract_string(payload, '$.tool_name') = 'grep' THEN 1 END) as grep_calls,
    COUNT(CASE WHEN json_extract_string(payload, '$.tool_name') = 'glob' THEN 1 END) as glob_calls,
    COUNT(CASE WHEN json_extract_string(payload, '$.tool_name') = 'lsp' THEN 1 END) as lsp_calls
  FROM events
  WHERE event_type LIKE 'tool.%'
  GROUP BY session_id
  ORDER BY session_id
  LIMIT 5
`);
console.table(pivotQuery.rows);

// ============================================================================
// 6. JSON/JSONL Ingestion Test
// ============================================================================

console.log("\n=== JSON/JSONL Ingestion ===\n");

// Create test JSONL data
const jsonlData = sessions.slice(0, 5).map((sid) =>
  JSON.stringify({
    session_id: sid,
    event_type: "session.created",
    payload: { state: "active" },
    timestamp: new Date().toISOString(),
  })
).join("\n");

// Write to temp file and load with DuckDB
const tmpPath = "/tmp/kayak_test_events.jsonl";
await Deno.writeTextFile(tmpPath, jsonlData);

await query(`
  CREATE TABLE loaded_events AS 
  SELECT * FROM read_json_auto('${tmpPath}')
`);

const loadedCount = await query("SELECT COUNT(*) as count FROM loaded_events");
console.log(`✅ Loaded ${loadedCount.rows[0].count} events from JSONL`);

// Clean up
await Deno.remove(tmpPath);

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
  await query(`
    INSERT INTO events (session_id, sequence, event_type, payload, timestamp)
    VALUES ${chunk.join(",\n")}
  `);
}

const bulkDuration = performance.now() - bulkStart;
console.log(`✅ Inserted 10,000 events in ${bulkDuration.toFixed(2)}ms`);
console.log(`   Rate: ${(10000 / (bulkDuration / 1000)).toFixed(0)} events/sec`);

// Final count
const finalCount = await query("SELECT COUNT(*) as count FROM events");
console.log(`\nTotal events in database: ${finalCount.rows[0].count}`);

// ============================================================================
// 8. Window Functions & Advanced Analytics
// ============================================================================

console.log("\n=== Advanced Analytics ===\n");

console.log("--- Rolling Error Rate (per session) ---");
const rollingStats = await query(`
  WITH session_errors AS (
    SELECT 
      session_id,
      timestamp,
      CASE WHEN event_type IN ('tool.failure', 'error') THEN 1 ELSE 0 END as is_error,
      ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp) as event_num
    FROM events
  )
  SELECT 
    session_id,
    event_num,
    is_error,
    ROUND(
      AVG(is_error) OVER (
        PARTITION BY session_id 
        ORDER BY event_num 
        ROWS BETWEEN 9 PRECEDING AND CURRENT ROW
      ), 3
    ) as rolling_error_rate_10
  FROM session_errors
  WHERE session_id = 'session-000'
  LIMIT 10
`);
console.table(rollingStats.rows);

console.log("\n✅ Exploration complete");
