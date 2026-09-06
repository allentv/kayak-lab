import type { Finding, ReviewCheck, ReviewContext } from "../types.ts";

const check: ReviewCheck = {
  name: "reexports",
  description: "Checks that mod.ts re-exports all public symbols from sibling files",
  async run(ctx: ReviewContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Find all mod.ts files
    for (const [modPath, modEntry] of ctx.files) {
      if (!modPath.endsWith("/mod.ts")) continue;

      const modDir = modPath.replace(/\/mod\.ts$/, "");
      const modExports = new Set(modEntry.exports);

      // Check sibling files in the same directory
      for (const [filePath, fileEntry] of ctx.files) {
        if (filePath === modPath) continue;
        if (!filePath.startsWith(modDir + "/")) continue;
        if (filePath.includes("__tests__")) continue;
        // Skip other mod.ts files
        if (filePath.endsWith("/mod.ts")) continue;

        for (const sym of fileEntry.exports) {
          if (sym === "default") continue; // default exports are special
          if (modExports.has(sym)) continue;

          findings.push({
            title: "reexports: missing from mod.ts",
            body: `Symbol "${sym}" exported from ${filePath.replace(modDir + "/", "")} but not re-exported in mod.ts`,
            priority: 2,
            confidence: 0.8,
            file_path: modPath,
            line_start: 1,
            line_end: 1,
          });
        }
      }
    }

    return findings;
  },
};

export default check;
