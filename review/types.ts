/** A single review finding produced by any check. */
export interface Finding {
  title: string;
  body: string;
  priority: 1 | 2 | 3;
  confidence: number;
  file_path: string;
  line_start: number;
  line_end: number;
}

/** A review check that produces findings from a shared context. */
export interface ReviewCheck {
  name: string;
  description: string;
  run(ctx: ReviewContext): Promise<Finding[]>;
}

/** Pre-computed file metadata shared across all checks. */
export interface FileEntry {
  path: string;
  content: string;
  lines: number;
  exports: string[];
  imports: string[];
}

/** Pre-computed context passed to every check. */
export interface ReviewContext {
  files: Map<string, FileEntry>;
  /** Source file path → test file path (if any). */
  sourceToTest: Map<string, string>;
  /** File path → list of files it imports (dependency graph). */
  graph: Map<string, string[]>;
}
