import type { Finding, ReviewCheck, ReviewContext } from "../types.ts";

const check: ReviewCheck = {
  name: "test-pairing",
  description: "Flags source files with no corresponding test file",
  async run(ctx: ReviewContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    for (const [, entry] of ctx.files) {
      // Skip test files themselves
      if (entry.path.includes("__tests__")) continue;
      // Only check files under src/
      if (!entry.path.includes("/src/")) continue;

      const hasTest = ctx.sourceToTest.has(entry.path);
      if (hasTest) continue;

      findings.push({
        title: "test-pairing: no test file",
        body: "Source file has no corresponding __tests__/*.test.ts",
        priority: 2,
        confidence: 0.7,
        file_path: entry.path,
        line_start: 1,
        line_end: 1,
      });
    }

    return findings;
  },
};

export default check;
