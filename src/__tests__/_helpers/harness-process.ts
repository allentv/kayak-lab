/**
 * Blackbox E2E test helper: manages a harness subprocess.
 *
 * Starts the harness server on a random port, waits for readiness,
 * and tears down cleanly. No imports from src/.
 */

const RETRY_INTERVAL_MS = 100;
const MAX_RETRIES = 5;

export interface HarnessProcess {
  port: number;
  url: string;
  stop(): Promise<void>;
}

/**
 * Pick a random port in the ephemeral range and verify it's available.
 */
export function findFreePort(): number {
  const min = 30000;
  const max = 40000;
  let port: number;

  // Try up to 50 times to find a free port
  for (let attempt = 0; attempt < 50; attempt++) {
    port = Math.floor(Math.random() * (max - min)) + min;

    try {
      const listener = Deno.listen({ port });
      listener.close();
      return port;
    } catch {
      // Port in use, try again
    }
  }

  throw new Error(`Could not find a free port in range ${min}-${max}`);
}

/**
 * Start the harness server as a subprocess and wait for it to be ready.
 */
export async function startHarness(port?: number): Promise<HarnessProcess> {
  const resolvedPort = port ?? findFreePort();
  const url = `http://localhost:${resolvedPort}`;

  const command = new Deno.Command("deno", {
    args: ["run", "-A", "src/main.ts", "--port", String(resolvedPort)],
    stdout: "piped",
    stderr: "piped",
  });

  const process = command.spawn();

  // Wait for readiness
  await waitForReady(url);

  return {
    port: resolvedPort,
    url,
    async stop() {
      try {
        process.kill("SIGTERM");
      } catch {
        // Process already exited
      }
      try {
        await process.status;
      } catch {
        // Ignore status errors
      }
    },
  };
}

/**
 * Poll /api/health with exponential backoff until the server responds.
 */
async function waitForReady(url: string): Promise<void> {
  let interval = RETRY_INTERVAL_MS;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet
    }

    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, interval);
    await promise;
    interval *= 2;
  }

  throw new Error(
    `Harness server did not become ready after ${MAX_RETRIES} retries`,
  );
}
