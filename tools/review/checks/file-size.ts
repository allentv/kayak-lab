import type { Finding, ReviewCheck, ReviewContext } from "../types.ts";

const DEFAULT_THRESHOLD = 400;

const check: ReviewCheck = {
  name: "file-size",
  description: "Flags source files exceeding a line threshold as decomposition candidates",
  async run(ctx: ReviewContext): Promise<Finding[]> {
    const findings: Finding[] = [];
    const threshold = DEFAULT_THRESHOLD;

    for (const [, entry] of ctx.files) {
      // Skip test files — only check source files
      if (entry.path.includes("__tests__")) continue;
      if (entry.lines <= threshold) continue;

      findings.push({
        title: "file-size: exceeds threshold",
        body: `${entry.lines} lines (threshold: ${threshold})`,
        priority: 2,
        confidence: 1,
        file_path: entry.path,
        line_start: 1,
        line_end: entry.lines,
      });
    }

    return findings;
  },
};

export default check;
