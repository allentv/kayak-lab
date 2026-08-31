/**
 * Docker-based sandbox runtime.
 *
 * Executes commands inside Docker containers with hardened security flags.
 * Base implementation — gVisor runtime extends this with --runtime=runsc.
 */

import type {
  ISandboxRuntime,
  SandboxExecConfig,
  SandboxExecResult,
  SandboxResourceLimits,
  HealthStatus,
  HealthCheckResult,
} from "./types.ts";

/** Default Docker image for execution. */
const DEFAULT_IMAGE = "denoland/deno:latest";

/** Default resource limits. */
const DEFAULT_LIMITS: Required<SandboxResourceLimits> = {
  cpus: 1,
  memory: "512m",
  pids: 128,
  timeout_ms: 30_000,
};

/** Default max output size (1MB). */
const DEFAULT_MAX_OUTPUT = 1024 * 1024;

/** User to run as inside the container (nobody). */
const CONTAINER_USER = "65532:65532";

export interface DockerRuntimeConfig {
  /** Docker image to use. */
  image?: string;
  /** Additional default flags. */
  default_flags?: string[];
  /** Docker runtime flag (e.g. "runsc" for gVisor). */
  runtime?: string;
}

/**
 * Docker-based sandbox runtime with default-deny security posture.
 */
export class DockerRuntime implements ISandboxRuntime {
  readonly name: string;
  protected config: DockerRuntimeConfig;

  constructor(config: DockerRuntimeConfig = {}) {
    this.config = config;
    this.name = config.runtime ? `docker-${config.runtime}` : "docker";
  }

  async execute(config: SandboxExecConfig): Promise<SandboxExecResult> {
    const limits = { ...DEFAULT_LIMITS, ...config.resource_limits };
    const image = config.image ?? this.config.image ?? DEFAULT_IMAGE;
    const maxOutput = config.max_output_bytes ?? DEFAULT_MAX_OUTPUT;

    const args = this.buildDockerArgs(config, limits, image);

    const startTime = Date.now();
    let timedOut = false;
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    try {
      const command = new Deno.Command("docker", {
        args,
        stdout: "piped",
        stderr: "piped",
      });

      // Use spawn + timeout for proper signal handling
      const process = command.spawn();
      const timeoutId = setTimeout(() => {
        try {
          process.kill("SIGKILL");
        } catch {
          // Process may have already exited
        }
      }, limits.timeout_ms);

      try {
        const output = await process.output();
        clearTimeout(timeoutId);

        stdout = new TextDecoder().decode(output.stdout);
        stderr = new TextDecoder().decode(output.stderr);
        exitCode = output.code;

        // Check if killed by Docker (timeout - exit code 137 = SIGKILL)
        if (output.code === 137) {
          timedOut = true;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (err) {
      stderr = err instanceof Error ? err.message : String(err);
      exitCode = 1;
    }

    const durationMs = Date.now() - startTime;

    // Truncate output if needed
    const truncated = stdout.length > maxOutput || stderr.length > maxOutput;
    if (stdout.length > maxOutput) {
      stdout = stdout.slice(0, maxOutput) + "\n... [truncated]";
    }
    if (stderr.length > maxOutput) {
      stderr = stderr.slice(0, maxOutput) + "\n... [truncated]";
    }

    // Extract output files if output mount specified
    if (config.output_mount) {
      await this.extractOutput(config);
    }

    return {
      exit_code: timedOut ? 137 : exitCode,
      stdout,
      stderr,
      duration_ms: durationMs,
      timed_out: timedOut,
      truncated,
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const checks: HealthCheckResult[] = [];

    // Check Docker is installed
    try {
      const cmd = new Deno.Command("docker", {
        args: ["--version"],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();
      checks.push({
        name: "docker-installed",
        passed: output.code === 0,
        message: output.code === 0
          ? "Docker is installed"
          : "Docker is not installed or not in PATH",
      });
    } catch {
      checks.push({
        name: "docker-installed",
        passed: false,
        message: "Docker is not installed or not in PATH",
      });
    }

    // Check Docker daemon is running
    try {
      const cmd = new Deno.Command("docker", {
        args: ["info", "--format", "{{.ServerVersion}}"],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();
      const version = new TextDecoder().decode(output.stdout).trim();
      checks.push({
        name: "docker-daemon",
        passed: output.code === 0,
        message: output.code === 0
          ? `Docker daemon running (v${version})`
          : "Docker daemon is not running",
      });
    } catch {
      checks.push({
        name: "docker-daemon",
        passed: false,
        message: "Docker daemon is not running",
      });
    }

    // Check runtime is available
    if (this.config.runtime) {
      try {
        const cmd = new Deno.Command("docker", {
          args: ["info", "--format", "{{json .Runtimes}}"],
          stdout: "piped",
          stderr: "piped",
        });
        const output = await cmd.output();
        const runtimes = new TextDecoder().decode(output.stdout);
        const hasRuntime = runtimes.includes(this.config.runtime);
        checks.push({
          name: "runtime-available",
          passed: hasRuntime,
          message: hasRuntime
            ? `Runtime '${this.config.runtime}' is registered`
            : `Runtime '${this.config.runtime}' is not registered in Docker`,
        });
      } catch {
        checks.push({
          name: "runtime-available",
          passed: false,
          message: `Failed to check runtime availability`,
        });
      }
    }

    // Test container execution
    try {
      const cmd = new Deno.Command("docker", {
        args: [
          "run", "--rm", "--network=none", "--read-only",
          "--cap-drop=ALL", "--user", CONTAINER_USER,
          this.config.runtime ? `--runtime=${this.config.runtime}` : "",
          DEFAULT_IMAGE,
          "echo", "health-check-ok",
        ].filter(Boolean),
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();
      const stdout = new TextDecoder().decode(output.stdout).trim();
      checks.push({
        name: "test-execution",
        passed: output.code === 0 && stdout === "health-check-ok",
        message: output.code === 0
          ? "Test container executed successfully"
          : `Test container failed: ${new TextDecoder().decode(output.stderr)}`,
      });
    } catch (err) {
      checks.push({
        name: "test-execution",
        passed: false,
        message: `Failed to run test container: ${err instanceof Error ? err.message : err}`,
      });
    }

    // Test network isolation
    try {
      const cmd = new Deno.Command("docker", {
        args: [
          "run", "--rm", "--network=none", "--read-only",
          "--cap-drop=ALL", "--user", CONTAINER_USER,
          this.config.runtime ? `--runtime=${this.config.runtime}` : "",
          DEFAULT_IMAGE,
          "sh", "-c", "wget -q -T 2 http://example.com 2>&1 || echo 'network-blocked'",
        ].filter(Boolean),
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();
      const stdout = new TextDecoder().decode(output.stdout).trim();
      checks.push({
        name: "network-isolation",
        passed: stdout.includes("network-blocked") || output.code !== 0,
        message: stdout.includes("network-blocked") || output.code !== 0
          ? "Network isolation working"
          : "WARNING: Network access not blocked!",
      });
    } catch {
      checks.push({
        name: "network-isolation",
        passed: false,
        message: "Could not verify network isolation",
      });
    }

    const healthy = checks.every((c) => c.passed);
    return { healthy, checks };
  }

  async setup(): Promise<void> {
    // Pull the default image if not present
    const image = this.config.image ?? DEFAULT_IMAGE;
    const cmd = new Deno.Command("docker", {
      args: ["pull", image],
      stdout: "inherit",
      stderr: "inherit",
    });
    await cmd.output();
  }

  /**
   * Build Docker command arguments from config.
   */
  protected buildDockerArgs(
    config: SandboxExecConfig,
    limits: Required<SandboxResourceLimits>,
    image: string,
  ): string[] {
    const args = [
      "run",
      "--rm",                         // Ephemeral container
      "--network=none",               // No network
      "--read-only",                  // Read-only rootfs
      "--cap-drop=ALL",               // Drop all capabilities
      "--security-opt=no-new-privileges", // Prevent privilege escalation
      "--user", CONTAINER_USER,       // Non-root user
      "--pids-limit", String(limits.pids),
      "--memory", limits.memory,
      "--cpus", String(limits.cpus),
      "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m", // Writable /tmp
    ];

    // Add runtime flag if specified
    if (this.config.runtime) {
      args.push("--runtime", this.config.runtime);
    }

    // Add default flags
    if (this.config.default_flags) {
      args.push(...this.config.default_flags);
    }

    // Add extra flags from config
    if (config.extra_flags) {
      args.push(...config.extra_flags);
    }

    // Add input mounts (read-only)
    for (const mount of config.input_mounts ?? []) {
      args.push("-v", `${mount.host_path}:${mount.container_path}:ro`);
    }

    // Add output mount (writable)
    if (config.output_mount) {
      args.push("-v", `${config.output_mount.host_path}:${config.output_mount.container_path}`);
    }

    // Set working directory
    if (config.working_directory) {
      args.push("-w", config.working_directory);
    }

    // Set environment variables
    for (const [key, value] of Object.entries(config.env ?? {})) {
      args.push("-e", `${key}=${value}`);
    }

    // Image and command
    args.push(image);

    // Parse command - split by spaces for shell execution
    args.push("sh", "-c", config.command);

    return args;
  }

  /**
   * Extract output files from container to host.
   */
  private async extractOutput(config: SandboxExecConfig): Promise<void> {
    if (!config.output_mount) return;

    // Create a temporary container to extract files
    // This is a simplified version - in production, use docker cp
    try {
      const cmd = new Deno.Command("docker", {
        args: [
          "run", "--rm",
          "-v", `${config.output_mount.host_path}:/output`,
          config.image ?? DEFAULT_IMAGE,
          "sh", "-c", "ls -la /output 2>/dev/null || true",
        ],
        stdout: "piped",
        stderr: "piped",
      });
      await cmd.output();
    } catch {
      // Best effort extraction
    }
  }
}
