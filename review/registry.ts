import type { ReviewCheck } from "./types.ts";

/**
 * Discover and load all checks from review/checks/ directory.
 * Each file must export a default ReviewCheck object.
 */
export async function loadChecks(
  checksDir: string,
): Promise<ReviewCheck[]> {
  const checks: ReviewCheck[] = [];

  for await (const entry of Deno.readDir(checksDir)) {
    if (!entry.name.endsWith(".ts") || entry.name.startsWith("_")) continue;
    if (entry.name.endsWith(".test.ts")) continue;

    const mod = await import(`${checksDir}/${entry.name}`);
    if (mod.default && typeof mod.default.run === "function") {
      checks.push(mod.default as ReviewCheck);
    }
  }

  return checks;
}

/**
 * Discover and load all delegate parsers from review/delegate/ directory.
 * Each file must export a default function returning Promise<Finding[]>.
 */
export async function loadDelegates(
  delegateDir: string,
): Promise<ReviewCheck[]> {
  const delegates: ReviewCheck[] = [];

  for await (const entry of Deno.readDir(delegateDir)) {
    if (!entry.name.endsWith(".ts") || entry.name.startsWith("_")) continue;
    if (entry.name.endsWith(".test.ts")) continue;

    const mod = await import(`${delegateDir}/${entry.name}`);
    if (mod.default && typeof mod.default.run === "function") {
      delegates.push(mod.default as ReviewCheck);
    }
  }

  return delegates;
}
