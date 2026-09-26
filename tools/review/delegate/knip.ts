import type { Finding, ReviewCheck } from "../types.ts";

/**
 * Delegates to knip for unused exports/dependencies detection.
 * Gracefully skips if knip is not installed.
 */
const check: ReviewCheck = {
  name: "knip",
  description: "Runs knip to detect unused exports and dependencies",
  async run(): Promise<Finding[]> {
    const findings: Finding[] = [];
    try {
      const cmd = new Deno.Command("npx", {
        args: ["--yes", "knip", "--reporter", "json"],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();

      const stdout = new TextDecoder().decode(output.stdout);
      if (!stdout.trim()) return findings;

      const report = JSON.parse(stdout) as {
        unused?: { files?: string[]; symbols?: Array<{ name: string; loc: { file: string; line: number } }> };
        unlisted?: string[];
      };

      // Unused files
      for (const file of report.unused?.files ?? []) {
        findings.push({
          title: "knip: unused file",
          body: `File is not imported anywhere`,
          priority: 3,
          confidence: 0.8,
          file_path: file,
          line_start: 1,
          line_end: 1,
        });
      }

      // Unused symbols
      for (const sym of report.unused?.symbols ?? []) {
        findings.push({
          title: "knip: unused export",
          body: `Export "${sym.name}" is not used`,
          priority: 3,
          confidence: 0.85,
          file_path: sym.loc.file,
          line_start: sym.loc.line,
          line_end: sym.loc.line,
        });
      }

      // Unlisted dependencies
      for (const dep of report.unlisted ?? []) {
        findings.push({
          title: "knip: unlisted dependency",
          body: `Dependency "${dep}" is used but not listed in package.json/deno.json`,
          priority: 2,
          confidence: 0.9,
          file_path: "deno.json",
          line_start: 1,
          line_end: 1,
        });
      }
    } catch {
      // knip not available — skip silently
    }
    return findings;
  },
};

export default check;
