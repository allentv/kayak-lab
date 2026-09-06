import type { FileEntry, ReviewContext } from "./types.ts";

/** Scan src directory and build a shared ReviewContext.
 * Reads each file once; checks consume this without re-reading. */
export async function buildContext(srcRoot: string): Promise<ReviewContext> {
  const files = new Map<string, FileEntry>();
  const sourceToTest = new Map<string, string>();
  const graph = new Map<string, string[]>();

  // Collect all .ts files under srcRoot
  const entries: string[] = [];
  for await (const entry of Deno.readDir(srcRoot)) {
    if (!entry.name.endsWith(".ts")) continue;
    const fullPath = `${srcRoot}/${entry.name}`;
    entries.push(fullPath);
  }

  // Also scan subdirectories (one level deep for __tests__ and modules)
  for await (const entry of Deno.readDir(srcRoot)) {
    if (!entry.isDirectory) continue;
    const dirPath = `${srcRoot}/${entry.name}`;
    for await (const sub of Deno.readDir(dirPath)) {
      if (sub.name.endsWith(".ts")) {
        entries.push(`${dirPath}/${sub.name}`);
      }
      // Scan __tests__ for test pairing
      if (sub.isDirectory && sub.name === "__tests__") {
        const testDir = `${dirPath}/${sub.name}`;
        for await (const test of Deno.readDir(testDir)) {
          if (test.name.endsWith(".ts")) {
            entries.push(`${testDir}/${test.name}`);
          }
        }
      }
    }
  }

  // Read and parse each file
  for (const path of entries) {
    const content = await Deno.readTextFile(path);
    const lines = content.split("\n").length;
    const exports = extractExports(content);
    const imports = extractImports(content);

    files.set(path, { path, content, lines, exports, imports });
    graph.set(path, imports);
  }

  // Build source → test mapping
  for (const [path, entry] of files) {
    if (path.includes("__tests__")) continue;
    if (!entry.path.includes("/src/")) continue;

    const testPath = path
      .replace(/\/src\//, "/src/")
      .replace(/\.ts$/, ".test.ts")
      .replace(/([^/]+)\.ts$/, "__tests__/$1.test.ts");

    if (files.has(testPath)) {
      sourceToTest.set(path, testPath);
    }
  }

  return { files, sourceToTest, graph };
}

/** Extract exported symbol names from content. */
function extractExports(content: string): string[] {
  const exports: string[] = [];
  for (const line of content.split("\n")) {
    // export function name / export const name / export class name / export type name / export interface name
    const m = line.match(
      /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+(\w+)/,
    );
    if (m) exports.push(m[1]);
    // export { name1, name2 }
    const block = line.match(/export\s*\{([^}]+)\}/);
    if (block) {
      for (const sym of block[1].split(",")) {
        const name = sym.trim().split(/\s+as\s+/)[0].trim();
        if (name) exports.push(name);
      }
    }
    // export default
    if (/\bexport\s+default\b/.test(line)) exports.push("default");
  }
  return exports;
}

/** Extract imported module paths from content. */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  for (const line of content.split("\n")) {
    const m = line.match(/from\s+["']([^"']+)["']/);
    if (m) imports.push(m[1]);
    const dynamic = line.match(/import\s*\(\s*["']([^"']+)["']\s*\)/);
    if (dynamic) imports.push(dynamic[1]);
  }
  return imports;
}
