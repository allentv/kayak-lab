import type { Finding, ReviewCheck } from "../types.ts";

/**
 * Delegates to madge for circular dependency detection.
 * Gracefully skips if madge is not installed.
 */
const check: ReviewCheck = {
  name: "madge",
  description: "Runs madge to detect circular dependencies",
  async run(): Promise<Finding[]> {
    const findings: Finding[] = [];
    try {
      const cmd = new Deno.Command("npx", {
        args: ["--yes", "madge", "--circular", "--json", "src/"],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();

      const stdout = new TextDecoder().decode(output.stdout);
      if (!stdout.trim()) return findings;

      const report = JSON.parse(stdout) as { circular?: string[][] };

      for (const cycle of report.circular ?? []) {
        // Report the first file in the cycle as the finding location
        const file = cycle[0];
        findings.push({
          title: "madge: circular dependency",
          body: `Cycle: ${cycle.join(" → ")}`,
          priority: 2,
          confidence: 0.95,
          file_path: file,
          line_start: 1,
          line_end: 1,
        });
      }
    } catch {
      // madge not available — skip silently
    }
    return findings;
  },
};

export default check;
