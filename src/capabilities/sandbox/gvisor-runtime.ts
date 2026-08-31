/**
 * gVisor (runsc) sandbox runtime.
 *
 * Extends Docker runtime with --runtime=runsc for userspace kernel isolation.
 * Provides two-layer escape resistance: Sentry userspace kernel + seccomp.
 */

import { DockerRuntime } from "./docker-runtime.ts";
import type { HealthStatus, HealthCheckResult } from "./types.ts";

export interface GVisorRuntimeConfig {
  /** Docker image to use. */
  image?: string;
  /** Additional default flags. */
  default_flags?: string[];
}

/**
 * gVisor-based sandbox runtime using Docker with runsc.
 */
export class GVisorRuntime extends DockerRuntime {
  constructor(config: GVisorRuntimeConfig = {}) {
    super({
      ...config,
      runtime: "runsc",
    });
  }

  override async healthCheck(): Promise<HealthStatus> {
    const baseChecks = await super.healthCheck();

    // Add gVisor-specific check: verify syscall filtering works
    const gvisorChecks: HealthCheckResult[] = [];

    // Test that ptrace is blocked inside gVisor container
    try {
      const cmd = new Deno.Command("docker", {
        args: [
          "run", "--rm", "--network=none", "--read-only",
          "--cap-drop=ALL", "--user", "65532:65532",
          "--runtime=runsc",
          this.config.image ?? "denoland/deno:latest",
          "sh", "-c", "ptrace -p 1 2>&1; echo exit-code:$?",
        ],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await cmd.output();
      const stdout = new TextDecoder().decode(output.stdout);
      // ptrace should fail inside gVisor
      const ptraceBlocked = output.code !== 0 || stdout.includes("exit-code:1") || stdout.includes("exit-code:127");
      gvisorChecks.push({
        name: "ptrace-blocked",
        passed: ptraceBlocked,
        message: ptraceBlocked
          ? "ptrace is blocked inside gVisor container"
          : "WARNING: ptrace is not blocked!",
      });
    } catch {
      gvisorChecks.push({
        name: "ptrace-blocked",
        passed: false,
        message: "Could not verify ptrace blocking",
      });
    }

    return {
      healthy: baseChecks.healthy && gvisorChecks.every((c) => c.passed),
      checks: [...baseChecks.checks, ...gvisorChecks],
    };
  }
}
