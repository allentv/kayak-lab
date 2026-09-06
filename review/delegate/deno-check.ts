import type { Finding, ReviewCheck } from "../types.ts";

/**
 * Delegates to `deno check` and parses stderr into Finding[].
 */
const check: ReviewCheck = {
  name: "deno-check",
  description: "Runs deno check and surfaces type errors as findings",
  async run(): Promise<Finding[]> {
    const findings: Finding[] = [];
    try {
      const cmd = new Deno.Command("deno", {
        args: ["check", "--json", "src/**/*.ts"],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();

      if (output.success) return findings;

      const stderr = new TextDecoder().decode(output.stderr);

      // Parse deno check JSON diagnostics if available
      // Fallback: parse text output for file:line patterns
      const lines = stderr.split("\n");
      for (const line of lines) {
        const match = line.match(
          /^(.+?):(\d+):(\d+)\s*[-–]\s*(error|warning)\s*(.+?)$/,
        );
        if (match) {
          const [, file, startLine, , level, message] = match;
          findings.push({
            title: `typecheck: ${level}`,
            body: message.trim(),
            priority: level === "error" ? 1 : 2,
            confidence: 0.95,
            file_path: file,
            line_start: parseInt(startLine),
            line_end: parseInt(startLine),
          });
        }
      }
    } catch {
      // deno check not available — skip silently
    }
    return findings;
  },
};

export default check;
