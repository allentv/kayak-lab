/**
 * Kayak-lab Web Monitoring UI
 *
 * Fresh-based web UI that connects to one or more harness instances
 * and provides a unified real-time monitoring dashboard.
 *
 * Usage:
 *   deno run -A web/main.ts --connect localhost:9001
 *   deno run -A web/main.ts --connect localhost:9001,localhost:9002
 */

import { App } from "fresh";

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliArgs {
  harnessUrls: string[];
  port: number;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    harnessUrls: [],
    port: parseInt(Deno.env.get("UI_PORT") ?? "8000", 10),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--connect" && i + 1 < args.length) {
      const urls = args[++i].split(",").map((u) => u.trim());
      result.harnessUrls = urls;
    } else if (arg === "--port" && i + 1 < args.length) {
      result.port = parseInt(args[++i], 10);
    }
  }

  return result;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = parseArgs(Deno.args);

  console.log("Starting kayak-lab web UI...");
  console.log(`  Port: ${args.port}`);
  console.log(`  Harnesses: ${args.harnessUrls.length > 0 ? args.harnessUrls.join(", ") : "none configured"}`);

  // Store harness URLs in environment for routes to access
  Deno.env.set("HARNESS_URLS", JSON.stringify(args.harnessUrls));

  // Start Fresh server
  const app = new App();
  await app.listen({ port: args.port });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  Deno.exit(1);
});
