/**
 * File capability implementation.
 *
 * Provides read/write/edit operations on files with safety constraints:
 * all paths are resolved against the sandbox root (context.working_directory),
 * `..` traversal and symlinks escaping the root are rejected, and reads are
 * capped at 10MB.
 */

import {
  ICapability,
  CapabilityDefinition,
  CapabilityContext,
  CapabilityResult,
  CapabilityNotInitializedError,
} from "./capability.ts";
import { dirname, isAbsolute, relative, resolve } from "@std/path";

// ============================================================================
// File Types
// ============================================================================

/** A single entry in a directory listing. */
export interface DirectoryEntry {
  name: string;
  type: "file" | "directory";
}

/** Result payload of a file read: plain text, base64 binary, or directory listing. */
export type FileReadData =
  | string
  | { base64: string; mimeType: string; binary: true }
  | { directory: true; entries: DirectoryEntry[] };

/** Options for range-based reads (1-indexed, inclusive line selection). */
export interface FileReadOptions {
  offset?: number;
  limit?: number;
}

/** Options for surgical edits. */
export interface FileEditOptions {
  replace_all?: boolean;
}

/** Result of a write or edit. */
export interface FileWriteData {
  path: string;
  bytes: number;
}

export interface FileEditData {
  path: string;
  replacements: number;
}

// ============================================================================
// File Capability Interface
// ============================================================================

/**
 * Interface for file operations.
 */
export interface IFileCapability extends ICapability {
  read(
    path: string,
    options?: FileReadOptions,
  ): Promise<CapabilityResult<FileReadData>>;
  write(
    path: string,
    content: string,
  ): Promise<CapabilityResult<FileWriteData>>;
  edit(
    path: string,
    old_string: string,
    new_string: string,
    options?: FileEditOptions,
  ): Promise<CapabilityResult<FileEditData>>;
}

// ============================================================================
// File Capability Implementation
// ============================================================================

/** Maximum number of bytes a read may return. */
const MAX_READ_BYTES = 10 * 1024 * 1024; // 10MB

const MIME_TYPES: Record<string, string> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".ts": "text/typescript",
  ".json": "application/json",
  ".xml": "application/xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".wasm": "application/wasm",
};

/** Size of each String.fromCharCode chunk when building a base64 payload. */
const BASE64_CHUNK_SIZE = 0x8000;

/** Encode bytes as base64 without blowing the call stack on large arrays. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + BASE64_CHUNK_SIZE),
    );
  }
  return btoa(binary);
}

/** Heuristic binary detection: NUL bytes never appear in valid text. */
function looksBinary(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0x00) return true;
  }
  return false;
}

function mimeTypeFor(path: string): string {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

/**
 * File capability that performs real filesystem operations within a sandbox root.
 */
export class FileCapability implements IFileCapability {
  readonly definition: CapabilityDefinition = {
    name: "file",
    description: "File read/write/edit operations",
    version: "1.0.0",
  };

  private context: CapabilityContext | null = null;
  private realRoot: string | null = null;

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
    this.realRoot = null;
  }

  async dispose(): Promise<void> {
    this.context = null;
    this.realRoot = null;
  }

  async read(
    path: string,
    options?: FileReadOptions,
  ): Promise<CapabilityResult<FileReadData>> {
    this.ensureInitialized();

    try {
      const target = this.resolveWithinRoot(path);

      let stat: Deno.FileInfo;
      try {
        stat = await Deno.stat(target);
      } catch {
        return {
          success: false,
          error: `File not found: ${path}`,
          metadata: { status: 404 },
        };
      }

      await this.assertRealPathInsideRoot(target, path);

      if (stat.isDirectory) {
        const entries: DirectoryEntry[] = [];
        for await (const entry of Deno.readDir(target)) {
          entries.push({
            name: entry.name,
            type: entry.isDirectory ? "directory" : "file",
          });
        }
        entries.sort((a, b) => a.name.localeCompare(b.name));
        return { success: true, data: { directory: true, entries } };
      }

      if ((stat.size ?? 0) > MAX_READ_BYTES) {
        return {
          success: false,
          error:
            `File exceeds the 10MB read limit: ${path} is ${stat.size} bytes`,
        };
      }

      const bytes = await Deno.readFile(target);

      if (looksBinary(bytes)) {
        return {
          success: true,
          data: {
            base64: toBase64(bytes),
            mimeType: mimeTypeFor(path),
            binary: true,
          },
        };
      }

      const content = new TextDecoder().decode(bytes);

      if (options?.offset !== undefined || options?.limit !== undefined) {
        return {
          success: true,
          data: selectLines(content, options?.offset, options?.limit),
        };
      }

      return { success: true, data: content };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async write(
    path: string,
    content: string,
  ): Promise<CapabilityResult<FileWriteData>> {
    this.ensureInitialized();

    try {
      const target = this.resolveWithinRoot(path);

      await Deno.mkdir(dirname(target), { recursive: true });

      // Reject pre-existing symlinks pointing outside the root before overwriting.
      try {
        const real = await Deno.realPath(target);
        this.assertInside(await this.getRealRoot(), real, path);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }

      const bytes = new TextEncoder().encode(content);
      await Deno.writeFile(target, bytes);

      return {
        success: true,
        data: { path: target, bytes: bytes.byteLength },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async edit(
    path: string,
    old_string: string,
    new_string: string,
    options?: FileEditOptions,
  ): Promise<CapabilityResult<FileEditData>> {
    this.ensureInitialized();

    try {
      if (old_string === "") {
        return { success: false, error: "old_string must not be empty" };
      }

      const target = this.resolveWithinRoot(path);

      let content: string;
      try {
        content = await Deno.readTextFile(target);
      } catch {
        return {
          success: false,
          error: `File not found: ${path}`,
          metadata: { status: 404 },
        };
      }

      await this.assertRealPathInsideRoot(target, path);

      const occurrences = content.split(old_string).length - 1;
      if (occurrences === 0) {
        return {
          success: false,
          error: `old_string not found in ${path}`,
        };
      }
      if (occurrences > 1 && !options?.replace_all) {
        return {
          success: false,
          error:
            `old_string matches ${occurrences} locations in ${path}; provide a more unique string or pass replace_all`,
        };
      }

      const updated = content.replaceAll(old_string, new_string);
      const bytes = new TextEncoder().encode(updated);
      await Deno.writeFile(target, bytes);

      return {
        success: true,
        data: { path: target, replacements: occurrences },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ------------------------------------------------------------------
  // Safety helpers
  // ------------------------------------------------------------------

  /** Resolve a user path against the sandbox root, rejecting `..` escapes. */
  private resolveWithinRoot(path: string): string {
    const root = resolve(this.context?.working_directory ?? Deno.cwd());
    const target = resolve(root, path);
    this.assertInside(root, target, path);
    return target;
  }

  /**
   * Resolve symlinks on the deepest existing path component and reject the
   * operation if the real target lies outside the sandbox root.
   */
  private async assertRealPathInsideRoot(
    target: string,
    original: string,
  ): Promise<void> {
    const realRoot = await this.getRealRoot();
    let real = target;
    try {
      real = await Deno.realPath(target);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return;
      throw error;
    }
    this.assertInside(realRoot, real, original);
  }

  private async getRealRoot(): Promise<string> {
    if (this.realRoot === null) {
      const root = resolve(this.context?.working_directory ?? Deno.cwd());
      try {
        this.realRoot = await Deno.realPath(root);
      } catch {
        this.realRoot = root;
      }
    }
    return this.realRoot;
  }

  private assertInside(root: string, target: string, original: string): void {
    const rel = relative(root, target);
    if (rel === "" || rel === ".") return;
    if (rel.startsWith("..") || isAbsolute(rel)) {
      throw new Error(
        `Security error: path "${original}" resolves outside the sandbox root`,
      );
    }
  }

  private ensureInitialized(): void {
    if (!this.context) {
      throw new CapabilityNotInitializedError(this.definition.name);
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Select a 1-indexed, inclusive line range from content.
 * offset 50 with limit 100 returns lines 50-149.
 */
function selectLines(
  content: string,
  offset?: number,
  limit?: number,
): string {
  const lines = content.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop(); // trailing newline does not start a new line
  }

  const start = Math.max((offset ?? 1) - 1, 0);
  const end = limit === undefined
    ? lines.length
    : Math.min(start + limit, lines.length);

  return lines.slice(start, end).join("\n");
}