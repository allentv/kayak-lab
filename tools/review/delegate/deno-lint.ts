import type { Finding, ReviewCheck } from "../types.ts";

/**
 * Delegates to `deno lint` and parses output into Finding[].
 */
const check: ReviewCheck = {
  name: "deno-lint",
  description: "Runs deno lint and surfaces warnings as findings",
  async run(): Promise<Finding[]> {
    const findings: Finding[] = [];
    try {
      const cmd = new Deno.Command("deno", {
        args: ["lint", "--json"],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();

      // deno lint --json outputs JSON diagnostics
      const stdout = new TextDecoder().decode(output.stdout);
      if (!stdout.trim()) return findings;

      const diagnostics = JSON.parse(stdout) as Array<{
        range?: { filename: string; start: { line: number }; end: { line: number } };
        message: string;
        code: string;
      }>;

      for (const diag of diagnostics) {
        if (!diag.range) continue;
        findings.push({
          title: `lint: ${diag.code}`,
          body: diag.message,
          priority: 2,
          confidence: 0.9,
          file_path: diag.range.filename,
          line_start: diag.range.start.line,
          line_end: diag.range.end.line,
        });
      }
    } catch {
      // deno lint not available or parse error — skip silently
    }
    return findings;
  },
};

export default check;
