import { buildContext } from "./context.ts";
import { loadChecks, loadDelegates } from "./registry.ts";
import { formatFindings } from "./formatter.ts";
import type { Finding } from "./types.ts";

const ROOT_DIR = new URL("../", import.meta.url).pathname;
const SRC_DIR = `${ROOT_DIR}src`;
const CHECKS_DIR = `${ROOT_DIR}review/checks`;
const DELEGATE_DIR = `${ROOT_DIR}review/delegate`;

function parseArgs(args: string[]): {
  only: string[];
  skip: string[];
  failOn: number | null;
} {
  const only: string[] = [];
  const skip: string[] = [];
  let failOn: number | null = null;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === "--only" && args[i + 1]) {
      only.push(args[++i]);
    } else if (args[i] === "--skip" && args[i + 1]) {
      skip.push(args[++i]);
    } else if (args[i] === "--fail-on" && args[i + 1]) {
      failOn = parseInt(args[++i]);
    }
  }

  return { only, skip, failOn };
}

async function preflight(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const checks: Array<{ name: string; cmd: string[] }> = [
    { name: "deno lint", cmd: ["lint"] },
    { name: "deno check", cmd: ["check", "src/**/*.ts"] },
    { name: "deno test", cmd: ["test", "--allow-read", "--allow-env"] },
  ];

  for (const { name, cmd } of checks) {
    const command = new Deno.Command("deno", {
      args: cmd,
      stdout: "piped",
      stderr: "piped",
    });
    const output = await command.output();

    if (!output.success) {
      const stderr = new TextDecoder().decode(output.stderr);
      findings.push({
        title: `preflight: ${name} failed`,
        body: stderr.slice(0, 500),
        priority: 1,
        confidence: 1,
        file_path: name,
        line_start: 1,
        line_end: 1,
      });
    }
  }

  return findings;
}

async function main() {
  const { only, skip, failOn } = parseArgs(Deno.args);

  // Build shared context
  const ctx = await buildContext(SRC_DIR);

  // Load all checks (custom + delegates)
  const customChecks = await loadChecks(CHECKS_DIR);
  const delegateChecks = await loadDelegates(DELEGATE_DIR);
  const allChecks = [...delegateChecks, ...customChecks];

  // Filter checks
  const enabledChecks = allChecks.filter((c) => {
    if (only.length > 0 && !only.includes(c.name)) return false;
    if (skip.includes(c.name)) return false;
    return true;
  });

  // Run preflight (always, unless skipped)
  const preflightFindings = skip.includes("preflight") ? [] : await preflight();

  // Run all enabled checks in parallel
  const results = await Promise.all(
    enabledChecks.map(async (c) => {
      try {
        return await c.run(ctx);
      } catch (err) {
        console.error(`Check "${c.name}" failed: ${err}`);
        return [] as Finding[];
      }
    }),
  );

  const allFindings = [...preflightFindings, ...results.flat()];

  // Output
  console.log(formatFindings(allFindings));

  // CI exit code
  if (failOn !== null) {
    const hasBlocking = allFindings.some((f) => f.priority <= failOn);
    if (hasBlocking) {
      Deno.exit(1);
    }
  }
}

main();
