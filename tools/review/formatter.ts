import type { Finding } from "./types.ts";

const PRIORITY_COLOR: Record<number, string> = {
  1: "\x1b[31m", // red
  2: "\x1b[33m", // yellow
  3: "\x1b[36m", // cyan
};

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

/**
 * Format findings grouped by file path, with a summary line.
 */
export function formatFindings(findings: Finding[]): string {
  if (findings.length === 0) {
    return `\x1b[32m✓ No findings\x1b[0m`;
  }

  // Group by file path
  const grouped = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = grouped.get(f.file_path) ?? [];
    list.push(f);
    grouped.set(f.file_path, list);
  }

  const lines: string[] = [];

  // Show all critical findings
  let warningCount = 0;
  const maxWarnings = 50;

  for (const [file, fileFindings] of grouped) {
    const sorted = fileFindings.sort((a, b) => a.priority - b.priority);
    const critical = sorted.filter((f) => f.priority === 1);
    const warnings = sorted.filter((f) => f.priority === 2);

    // Always show critical
    if (critical.length > 0) {
      lines.push(`${BOLD}${file}${RESET}`);
      for (const f of critical) {
        const loc = `L${f.line_start}${f.line_start !== f.line_end ? `-L${f.line_end}` : ""}`;
        lines.push(`  \x1b[31mCRIT\x1b[0m \x1b[2m${loc}\x1b[0m ${f.title}`);
        lines.push(`    \x1b[2m${f.body}\x1b[0m`);
      }
      lines.push("");
    }

    // Show warnings up to limit
    if (warnings.length > 0 && warningCount < maxWarnings) {
      if (critical.length === 0) {
        lines.push(`${BOLD}${file}${RESET}`);
      }
      for (const f of warnings) {
        if (warningCount >= maxWarnings) break;
        const loc = `L${f.line_start}${f.line_start !== f.line_end ? `-L${f.line_end}` : ""}`;
        lines.push(`  \x1b[33mWARN\x1b[0m \x1b[2m${loc}\x1b[0m ${f.title}`);
        warningCount++;
      }
      lines.push("");
    }
  }

  // Summary
  const byPriority = { 1: 0, 2: 0, 3: 0 };
  for (const f of findings) byPriority[f.priority as keyof typeof byPriority]++;

  const parts: string[] = [];
  if (byPriority[1]) parts.push(`${PRIORITY_COLOR[1]}${byPriority[1]} critical${RESET}`);
  if (byPriority[2]) parts.push(`${PRIORITY_COLOR[2]}${byPriority[2]} warnings${RESET}`);
  if (byPriority[3]) parts.push(`${PRIORITY_COLOR[3]}${byPriority[3]} info${RESET}`);

  lines.push(`${BOLD}Summary:${RESET} ${findings.length} findings (${parts.join(", ")})`);

  return lines.join("\n");
}
