/**
 * Search capability implementation.
 *
 * Provides codebase search: grep (regex line search) and glob (file pattern
 * matching). Prefers external tools — `rg` (ripgrep) for grep and `fd` for
 * glob — executed via Deno.Command with the working directory as cwd. When
 * the external tools are unavailable, falls back to a pure-TS implementation
 * (recursive file walker + RegExp) that satisfies the same scenarios.
 *
 * Hidden files (starting with `.`) are skipped and `.gitignore` rules are
 * respected by default. Because the meaning of external-tool defaults varies
 * across rg/fd versions, the external tools are always invoked with
 * `--hidden --no-ignore` and the hidden/gitignore filtering is applied by
 * this module, so both paths behave identically.
 *
 * Note: `@std/fs` `expandGlob`/`walk` (checked against @std/fs@1) expose no
 * `gitignore` option and no way to prune ignored directories during
 * traversal, so the fallback uses its own walker with gitignore support.
 */

import {
  ICapability,
  CapabilityContext,
  CapabilityDefinition,
  CapabilityNotInitializedError,
  CapabilityResult,
} from "./capability.ts";
import { globToRegExp, join, relative, resolve } from "@std/path";

// ============================================================================
// Search Types
// ============================================================================

/** A single line matched by grep. Column is the 1-based match position. */
export interface GrepMatch {
  file: string;
  line: number;
  column: number;
  content: string;
}

/** Options for {@link ISearchCapability.grep}. */
export interface GrepOptions {
  /** Case-sensitive search (default: true). Pass `false` for case-insensitive. */
  case?: boolean;
  /** Only search files matching this glob pattern (e.g. "*.ts"). */
  glob?: string;
}

/** Options for {@link ISearchCapability.glob}. */
export interface GlobOptions {
  /** Include hidden files (starting with `.`). Default: false. */
  hidden?: boolean;
  /** Respect `.gitignore` rules. Default: true; `false` includes ignored files. */
  gitignore?: boolean;
}

// ============================================================================
// Search Capability Interface
// ============================================================================

/**
 * Interface for codebase search operations.
 */
export interface ISearchCapability extends ICapability {
  /** Find lines matching a regex pattern in a file or directory (recursive). */
  grep(
    pattern: string,
    path?: string,
    options?: GrepOptions,
  ): Promise<CapabilityResult<GrepMatch[]>>;

  /** Find files matching a glob pattern, relative to the project root. */
  glob(
    pattern: string,
    options?: GlobOptions,
  ): Promise<CapabilityResult<string[]>>;
}

// ============================================================================
// Gitignore matching (pure TS; the single source of ignore semantics)
// ============================================================================

/** A single parsed `.gitignore` pattern. */
interface IgnoreRule {
  negate: boolean;
  /** Pattern only applies to directories (trailing `/`). */
  dirOnly: boolean;
  re: RegExp;
}

/**
 * Parsed `.gitignore` file. Patterns are matched against paths relative to
 * the directory containing the `.gitignore`.
 */
class IgnoreRules {
  constructor(
    /** Directory of this .gitignore, relative to the root ("" = root). */
    readonly dirRel: string,
    private readonly rules: IgnoreRule[],
  ) {
  }

  /**
   * Outcome for a path relative to this .gitignore's directory, or null when
   * no pattern matches. Within one file, the last matching pattern wins.
   */
  matchOutcome(rel: string, isDir: boolean): boolean | null {
    let outcome: boolean | null = null;
    for (const rule of this.rules) {
      if (rule.dirOnly && !isDir) continue;
      if (rule.re.test(rel)) outcome = !rule.negate;
    }
    return outcome;
  }
}

/** Convert a gitignore glob body (one or more `/`-separated segments) to a regex source. */
function gitignoreGlobToSource(pattern: string): string {
  const segments = pattern.split("/");
  let source = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === "**") {
      // `**` matches zero or more path segments; a trailing `**` matches
      // everything inside the preceding directory.
      source += i === segments.length - 1 ? ".+" : "(?:[^/]+/)*";
    } else {
      source += seg
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, ".*")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, "[^/]");
    }
    if (i < segments.length - 1) source += "/";
  }
  return source;
}

/** Parse the `.gitignore` in `absDir` (if any) into rules. */
async function loadIgnoreRules(absDir: string, dirRel: string): Promise<IgnoreRules> {
  const rules: IgnoreRule[] = [];
  try {
    const text = await Deno.readTextFile(join(absDir, ".gitignore"));
    for (const raw of text.split("\n")) {
      const line = raw.replace(/\s+$/, "").replace(/\\#/, "#").replace(/\\!/, "!");
      if (!line || line.startsWith("#")) continue;
      let pattern = line;
      let negate = false;
      if (pattern.startsWith("!")) {
        negate = true;
        pattern = pattern.slice(1);
      }
      const dirOnly = pattern.endsWith("/");
      if (dirOnly) pattern = pattern.slice(0, -1);
      if (!pattern) continue;
      // A leading `/` or any inner `/` anchors the pattern to this directory.
      const anchored = pattern.startsWith("/");
      const body = anchored ? pattern.slice(1) : pattern;
      if (!body) continue;
      const source = gitignoreGlobToSource(body);
      const re = new RegExp(anchored ? `^${source}$` : `^(?:.*/)?${source}$`);
      rules.push({ negate, dirOnly, re });
    }
  } catch {
    // No .gitignore in this directory.
  }
  return new IgnoreRules(dirRel, rules);
}

/**
 * Lazily loads `.gitignore` rules per directory (relative to the root) and
 * decides whether a path is ignored. Rules are consulted from the deepest
 * directory up to the root; the deepest level with a matching pattern wins,
 * matching git's precedence. Ignoring a directory ignores its contents.
 */
class GitignoreIndex {
  #cache = new Map<string, Promise<IgnoreRules>>();

  constructor(private readonly rootAbs: string) {
  }

  rulesFor(dirRel: string): Promise<IgnoreRules> {
    let rules = this.#cache.get(dirRel);
    if (!rules) {
      const abs = dirRel === "" ? this.rootAbs : join(this.rootAbs, dirRel);
      rules = loadIgnoreRules(abs, dirRel);
      this.#cache.set(dirRel, rules);
    }
    return rules;
  }

  async isIgnored(relPath: string, isDir: boolean): Promise<boolean> {
    const segments = relPath.split("/");
    // Deepest directory with a .gitignore decides first.
    for (let depth = segments.length - 1; depth >= 0; depth--) {
      const dirRel = depth === 0 ? "" : segments.slice(0, depth).join("/");
      const rules = await this.rulesFor(dirRel);
      // An ignored ancestor directory excludes everything below it; this
      // check runs before the file-level check, so negations cannot
      // re-include files under an excluded directory (per git).
      for (let k = segments.length - 1; k > depth; k--) {
        const outcome = rules.matchOutcome(segments.slice(depth, k).join("/"), true);
        if (outcome !== null) return outcome;
      }
      const outcome = rules.matchOutcome(segments.slice(depth).join("/"), isDir);
      if (outcome !== null) return outcome;
    }
    return false;
  }
}

// ============================================================================
// File listing and filtering (pure TS)
// ============================================================================

/** Options for hidden/gitignore filtering of a listed file set. */
interface FilterOptions {
  /** Include hidden entries (path segments starting with `.`). */
  hidden: boolean;
  /** Respect `.gitignore` rules found under the root. */
  gitignore: boolean;
}

/**
 * Recursively list ALL regular files under `rootAbs` (no filtering), with
 * paths relative to the root, sorted. Symlinks are skipped: following them
 * risks leaving the search root.
 */
async function listAllFiles(rootAbs: string): Promise<string[]> {
  const files: string[] = [];
  const stack: { abs: string; rel: string }[] = [{ abs: rootAbs, rel: "" }];
  while (stack.length > 0) {
    const level = stack.pop()!;
    let entries;
    try {
      entries = await Array.fromAsync(Deno.readDir(level.abs));
    } catch {
      continue; // Unreadable directory: skip.
    }
    const dirs: { abs: string; rel: string }[] = [];
    for (const entry of entries) {
      const rel = level.rel ? `${level.rel}/${entry.name}` : entry.name;
      if (entry.isDirectory) dirs.push({ abs: join(level.abs, entry.name), rel });
      else if (entry.isFile) files.push(rel);
    }
    // Reverse so the stack pops directories in lexicographic order.
    stack.push(...dirs.reverse());
  }
  return files.sort();
}

/**
 * Apply hidden and gitignore filtering to a set of paths relative to the
 * root. Used for both the external-tool and fallback paths so behavior is
 * identical regardless of the external tools' default filtering.
 */
async function filterFiles(rootAbs: string, files: string[], opts: FilterOptions): Promise<string[]> {
  const index = opts.gitignore ? new GitignoreIndex(rootAbs) : null;
  const kept: string[] = [];
  for (const file of files) {
    if (!opts.hidden && file.split("/").some((seg) => seg.startsWith("."))) continue;
    if (index && await index.isIgnored(file, false)) continue;
    kept.push(file);
  }
  return kept;
}

/**
 * Filter files by a glob using ripgrep semantics: a pattern without a path
 * separator matches the basename; a pattern containing one matches the full
 * relative path.
 */
function filterByGlob(files: string[], pattern: string): string[] {
  const re = globToRegExp(pattern);
  if (pattern.includes("/")) return files.filter((f) => re.test(f));
  return files.filter((f) => re.test(f.split("/").pop() ?? f));
}

// ============================================================================
// External tool integration
// ============================================================================

/** Availability of preferred external search tools. */
interface ExternalTools {
  rg: boolean;
  fd: boolean;
}

/**
 * Probe for `rg` and `fd` by actually spawning them once. `command -v` is not
 * used because the shell's PATH/lookup can differ from Deno's.
 */
async function detectExternalTools(): Promise<ExternalTools> {
  return {
    rg: await spawnWorks("rg", ["--version"]),
    fd: await spawnWorks("fd", ["--version"]),
  };
}

/** Check whether a tool can actually be spawned by Deno.Command. */
async function spawnWorks(tool: string, args: string[]): Promise<boolean> {
  try {
    await new Deno.Command(tool, { args, stdout: "piped", stderr: "piped" }).output();
    return true;
  } catch {
    return false;
  }
}

/**
 * Run an external search tool in `cwd` and return stdout. Exit 1 (no
 * matches) is not an error; exit 2+ throws with the tool's stderr.
 */
async function runExternalTool(tool: "rg" | "fd", cwd: string, args: string[]): Promise<string> {
  const cmd = new Deno.Command(tool, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const output = await cmd.output();
  const stdout = new TextDecoder().decode(output.stdout);
  if (output.code === 0 || output.code === 1) return stdout;
  const stderr = new TextDecoder().decode(output.stderr).trim();
  throw new Error(stderr || `${tool} exited with code ${output.code}`);
}

/** Subset of ripgrep `--json` event shapes used for parsing. */
interface RgSubmatch {
  start?: number;
  end?: number;
}

interface RgMatchData {
  path?: { text?: string };
  lines?: { text?: string };
  line_number?: number;
  submatches?: RgSubmatch[];
}

interface RgEvent {
  type?: string;
  data?: RgMatchData;
}

/** Parse `rg --json` output into GrepMatch entries, sorted deterministically. */
function parseRgJson(stdout: string): GrepMatch[] {
  const matches: GrepMatch[] = [];
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    let event: RgEvent;
    try {
      event = JSON.parse(line) as RgEvent;
    } catch {
      continue;
    }
    if (event.type !== "match" || !event.data) continue;
    const data = event.data;
    const sub = data.submatches?.[0];
    matches.push({
      file: data.path?.text ?? "",
      line: data.line_number ?? 0,
      column: (sub?.start ?? 0) + 1,
      content: (data.lines?.text ?? "").replace(/\r?\n$/, ""),
    });
  }
  return matches.sort(compareMatches);
}

function compareMatches(a: GrepMatch, b: GrepMatch): number {
  return a.file === b.file
    ? a.line === b.line
      ? a.column - b.column
      : a.line - b.line
    : a.file < b.file
    ? -1
    : 1;
}

// ============================================================================
// Search Capability Implementation
// ============================================================================

/**
 * Search capability: grep and glob over the working directory.
 *
 * Uses external `rg`/`fd` when available (probed once per instance) and
 * falls back to a pure-TS walker + RegExp otherwise. Both paths honor the
 * same scenarios; hidden/gitignore filtering is always applied by this
 * module for uniform semantics.
 */
export class SearchCapability implements ISearchCapability {
  readonly definition: CapabilityDefinition = {
    name: "search",
    description: "Codebase search: grep and glob",
    version: "1.0.0",
  };

  private context: CapabilityContext | null = null;
  private tools: Promise<ExternalTools> | null = null;

  /**
   * @param options.useFallback Force the pure-TS fallback implementation
   *   even when external tools are available (used by tests).
   */
  constructor(private readonly options: { useFallback?: boolean } = {}) {
  }

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
  }

  async dispose(): Promise<void> {
    this.context = null;
    this.tools = null;
  }

  async grep(
    pattern: string,
    path?: string,
    options?: GrepOptions,
  ): Promise<CapabilityResult<GrepMatch[]>> {
    this.ensureInitialized();

    try {
      const flags = options?.case === false ? "i" : "";
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, flags);
      } catch {
        return { success: false, error: `Invalid regex pattern: ${pattern}` };
      }

      const cwd = this.workingDirectory();
      const useRg = !this.options.useFallback && (await this.probe()).rg;
      const matches = useRg
        ? await this.rgGrep(cwd, pattern, path, options)
        : await this.fallbackGrep(cwd, regex, path, options);
      return { success: true, data: matches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async glob(
    pattern: string,
    options?: GlobOptions,
  ): Promise<CapabilityResult<string[]>> {
    this.ensureInitialized();

    try {
      const cwd = this.workingDirectory();
      const filterOpts: FilterOptions = {
        hidden: options?.hidden ?? false,
        gitignore: options?.gitignore ?? true,
      };

      // External tools always run with --hidden --no-ignore; this module then
      // applies the requested hidden/gitignore filtering uniformly.
      let listed: string[];
      const tools = this.options.useFallback ? null : await this.probe();
      if (tools?.fd && !pattern.includes("/")) {
        // fd matches basename-style globs against the file name.
        const args = ["--type", "f", "--hidden", "--no-ignore", "--glob", pattern];
        listed = await runListFiles("fd", cwd, args);
      } else if (tools?.rg) {
        // rg's glob matching handles separator patterns (e.g. src/**/*.ts).
        const args = ["--files", "--hidden", "--no-ignore", "--glob", pattern];
        listed = await runListFiles("rg", cwd, args);
      } else {
        listed = await listAllFiles(cwd);
      }
      const kept = await filterFiles(cwd, listed, filterOpts);
      const result = tools ? kept : filterByGlob(kept, pattern);

      return { success: true, data: result.sort() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // --------------------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------------------

  private ensureInitialized(): void {
    if (!this.context) {
      throw new CapabilityNotInitializedError(this.definition.name);
    }
  }

  private workingDirectory(): string {
    return this.context?.working_directory ?? Deno.cwd();
  }

  /** Probe for external tools once per capability instance. */
  private probe(): Promise<ExternalTools> {
    if (!this.tools) this.tools = detectExternalTools();
    return this.tools;
  }

  /** Grep via ripgrep: paths come back relative to the working directory. */
  private async rgGrep(
    cwd: string,
    pattern: string,
    path: string | undefined,
    options: GrepOptions | undefined,
  ): Promise<GrepMatch[]> {
    const args = ["--json", "--no-messages"];
    if (options?.case === false) args.push("-i");
    if (options?.glob) args.push("--glob", options.glob);
    args.push("--", pattern);
    if (path !== undefined) args.push(path);

    return parseRgJson(await runExternalTool("rg", cwd, args));
  }

  /** Grep via the pure-TS fallback: walker + per-line RegExp. */
  private async fallbackGrep(
    cwd: string,
    regex: RegExp,
    path: string | undefined,
    options: GrepOptions | undefined,
  ): Promise<GrepMatch[]> {
    const rootAbs = path === undefined ? cwd : resolve(cwd, path);

    let targets: string[]; // Relative to cwd (the project root).
    const stat = await Deno.stat(rootAbs);
    if (stat.isFile) {
      targets = [relative(cwd, rootAbs)];
    } else if (stat.isDirectory) {
      const baseRel = path === undefined ? "" : relative(cwd, rootAbs);
      targets = (await listAllFiles(rootAbs)).map((rel) =>
        baseRel === "" ? rel : `${baseRel}/${rel}`
      );
    } else {
      throw new Error(`Path is neither a file nor a directory: ${path}`);
    }

    // The grep fallback mirrors ripgrep defaults: skip hidden, respect
    // .gitignore (grep has no option to disable this).
    targets = await filterFiles(cwd, targets, { hidden: false, gitignore: true });
    if (options?.glob) targets = filterByGlob(targets, options.glob);

    const matches: GrepMatch[] = [];
    for (const rel of targets) {
      let content: string;
      try {
        content = await Deno.readTextFile(join(cwd, rel));
      } catch {
        continue; // Unreadable or binary file: skip.
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const match = regex.exec(lines[i]);
        if (match === null) continue;
        matches.push({
          file: rel,
          line: i + 1,
          column: match.index + 1,
          content: lines[i],
        });
      }
    }
    return matches.sort(compareMatches);
  }
}

/** Run a listing tool and split its newline-separated output into paths. */
async function runListFiles(tool: "rg" | "fd", cwd: string, args: string[]): Promise<string[]> {
  const stdout = await runExternalTool(tool, cwd, args);
  return stdout.split("\n").filter((line) => line.length > 0);
}