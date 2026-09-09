/**
 * Unit tests for the provenance tool-call classifier.
 */

import { assertEquals } from "@std/assert";
import {
  classifyToolCall,
  RULES,
} from "../classifier.ts";
import { ProvenanceNodeType } from "../types.ts";

// ============================================================================
// Exploration — read-only tools
// ============================================================================

Deno.test("classifyToolCall", async (t) => {
  await t.step("classifies read-only tools as Exploration", () => {
    const explorations = ["read", "grep", "glob", "list_directory", "search"];

    for (const name of explorations) {
      assertEquals(
        classifyToolCall(name),
        ProvenanceNodeType.Exploration,
        `Expected "${name}" → Exploration`,
      );
    }
  });

  await t.step("classifies read-only tools case-insensitively", () => {
    assertEquals(classifyToolCall("READ"), ProvenanceNodeType.Exploration);
    assertEquals(classifyToolCall("Grep"), ProvenanceNodeType.Exploration);
    assertEquals(classifyToolCall("GLOB"), ProvenanceNodeType.Exploration);
  });

  // --------------------------------------------------------------------------
  // Commitment — mutating tools
  // --------------------------------------------------------------------------

  await t.step("classifies mutating tools as Commitment", () => {
    const commitments = ["edit", "write", "create_file", "mkdir"];

    for (const name of commitments) {
      assertEquals(
        classifyToolCall(name),
        ProvenanceNodeType.Commitment,
        `Expected "${name}" → Commitment`,
      );
    }
  });

  await t.step("classifies mutating tools case-insensitively", () => {
    assertEquals(classifyToolCall("EDIT"), ProvenanceNodeType.Commitment);
    assertEquals(classifyToolCall("Write"), ProvenanceNodeType.Commitment);
  });

  // --------------------------------------------------------------------------
  // Verification — bash with verification commands
  // --------------------------------------------------------------------------

  await t.step("classifies bash verification commands as Verification", () => {
    const verifyCommands = [
      "test",
      "check",
      "lint",
      "verify",
      "assert",
      "deno test",
      "run check --lint",
      "npm run verify",
    ];

    for (const command of verifyCommands) {
      assertEquals(
        classifyToolCall("bash", { command }),
        ProvenanceNodeType.Verification,
        `Expected bash + "${command}" → Verification`,
      );
    }
  });

  // --------------------------------------------------------------------------
  // Exploration — bash with build/install commands
  // --------------------------------------------------------------------------

  await t.step("classifies bash build commands as Exploration", () => {
    const buildCommands = [
      "install",
      "build",
      "compile",
      "cargo build",
      "pip install -e .",
      "deno compile main.ts",
    ];

    for (const command of buildCommands) {
      assertEquals(
        classifyToolCall("bash", { command }),
        ProvenanceNodeType.Exploration,
        `Expected bash + "${command}" → Exploration`,
      );
    }
  });

  // --------------------------------------------------------------------------
  // Default — unknown tools → Exploration
  // --------------------------------------------------------------------------

  await t.step("classifies unknown tools as Exploration (default)", () => {
    assertEquals(
      classifyToolCall("some_unknown_tool"),
      ProvenanceNodeType.Exploration,
    );
    assertEquals(
      classifyToolCall("custom_action"),
      ProvenanceNodeType.Exploration,
    );
  });

  // --------------------------------------------------------------------------
  // Bash without matching args
  // --------------------------------------------------------------------------

  await t.step("classifies bash with no command as Exploration (default)", () => {
    assertEquals(
      classifyToolCall("bash"),
      ProvenanceNodeType.Exploration,
    );
  });

  await t.step("classifies bash with non-matching command as Exploration", () => {
    assertEquals(
      classifyToolCall("bash", { command: "echo hello" }),
      ProvenanceNodeType.Exploration,
    );
  });

  await t.step("classifies bash with non-string command as Exploration", () => {
    assertEquals(
      classifyToolCall("bash", { command: 123 }),
      ProvenanceNodeType.Exploration,
    );
  });

  // --------------------------------------------------------------------------
  // RULES array
  // --------------------------------------------------------------------------

  await t.step("RULES is a non-empty array", () => {
    assertEquals(Array.isArray(RULES), true);
    assertEquals(RULES.length > 0, true);
  });

  await t.step("every rule has pattern, type, and optional checkArgs", () => {
    for (const rule of RULES) {
      assertEquals(
        rule.pattern instanceof RegExp || typeof rule.pattern === "string",
        true,
        `Rule pattern must be RegExp or string`,
      );
      assertEquals(
        Object.values(ProvenanceNodeType).includes(rule.type),
        true,
        `Rule type must be a valid ProvenanceNodeType`,
      );
      if (rule.checkArgs !== undefined) {
        assertEquals(typeof rule.checkArgs, "boolean");
      }
    }
  });
});
