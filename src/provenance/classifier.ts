/**
 * Rule-based tool call classifier for the provenance graph.
 *
 * Maps tool names (and optionally their arguments) to ProvenanceNodeType
 * categories.  Exported as a deterministic, side-effect-free function
 * together with a RULES array for testability.
 */

import { ProvenanceNodeType } from "./types.ts";

// ============================================================================
// Rules
// ============================================================================

/**
 * A single classification rule.
 *
 * - `pattern`:  Regular expression or plain string matched against the tool name
 *   (case-insensitive when a string).
 * - `type`:     The node type to assign when the rule matches.
 * - `checkArgs`: When `true`, the function also inspects the `args` object
 *   passed to `classifyToolCall`.  The exact check is implementation-defined
 *   per rule (currently used by the "bash" verification/build rules).
 */
export interface ClassifierRule {
  pattern: RegExp | string;
  type: ProvenanceNodeType;
  checkArgs?: boolean;
}

/**
 * Ordered list of classification rules.
 *
 * The first matching rule wins.  Rules are evaluated top-to-bottom, so
 * ordering matters for overlapping patterns (e.g. the bash-specific rules
 * appear before the catch-all).
 */
export const RULES: ClassifierRule[] = [
  // Read-only / exploration tools ------------------------------------------------
  {
    pattern: /^(read|grep|glob|list_directory|search)$/i,
    type: ProvenanceNodeType.Exploration,
  },

  // Mutating / commitment tools --------------------------------------------------
  {
    pattern: /^(edit|write|create_file|mkdir)$/i,
    type: ProvenanceNodeType.Commitment,
  },

  // Bash: verification commands ---------------------------------------------------
  {
    pattern: /^bash$/i,
    type: ProvenanceNodeType.Verification,
    checkArgs: true,
  },

  // Bash: build/install commands → Exploration -----------------------------------
  {
    pattern: /^bash$/i,
    type: ProvenanceNodeType.Exploration,
    checkArgs: true,
  },

  // Catch-all → Exploration ------------------------------------------------------
  {
    pattern: /.*/i,
    type: ProvenanceNodeType.Exploration,
  },
];

// ============================================================================
// Classifier
// ============================================================================

/**
 * Classify a tool call into a provenance node type.
 *
 * Rules are evaluated in order; the first match wins.  When multiple
 * bash-specific rules exist the caller should inspect the return value
 * directly—here we resolve them by inspecting `args.command`.
 *
 * @param toolName  The name of the tool being called.
 * @param args      Optional arguments dictionary; inspected for bash rules.
 * @returns         The matching {@link ProvenanceNodeType}.
 */
export function classifyToolCall(
  toolName: string,
  args?: Record<string, unknown>,
): ProvenanceNodeType {
  for (const rule of RULES) {
    const nameMatches = rule.pattern instanceof RegExp
      ? rule.pattern.test(toolName)
      : rule.pattern.toLowerCase() === toolName.toLowerCase();

    if (!nameMatches) continue;

    if (!rule.checkArgs) {
      return rule.type;
    }

    // Args-aware rules — only the "bash" tool reaches here.
    const command = typeof args?.command === "string" ? args.command : "";

    // Verification: bash commands that contain test/check/lint as a primary action
    // Match: `deno test`, `npm run test`, `cargo check`, `run check --lint`
    // Skip: `echo "test"`, `curl /test`, `cat check.txt`
    if (rule.type === ProvenanceNodeType.Verification) {
      // Match verification keywords as standalone words (word boundaries)
      const isVerification = /\b(test|check|lint|verify|assert)\b/i.test(command) &&
        // Exclude false positives where keyword is inside quotes or paths
        !/["'`].*\b(test|check|lint|verify|assert)\b.*["'`]/i.test(command) &&
        !/\/.*\b(test|check|lint|verify|assert)\b/i.test(command);
      if (isVerification) {
        return ProvenanceNodeType.Verification;
      }
    }

    // Exploration: bash with install / build / compile
    if (
      rule.type === ProvenanceNodeType.Exploration &&
      command !== "" &&
      /(install|build|compile)/i.test(command)
    ) {
      return ProvenanceNodeType.Exploration;
    }

    // Bash rule matched on name but args didn't satisfy a sub-check —
    // skip this rule and let the next one decide.
  }

  // Should never be reached because the catch-all rule is always last,
  // but return a safe default.
  return ProvenanceNodeType.Exploration;
}
