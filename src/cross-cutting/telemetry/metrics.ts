/**
 * Metrics collector with counters, gauges, and histograms.
 */

import type { MetricValue, MetricsConfig } from "./types.ts";

/**
 * Collects counters, gauges, and histograms; exports to Prometheus text format.
 */
export class MetricsCollector {
  private config: MetricsConfig;
  private metrics: Map<string, MetricValue[]> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor(config?: MetricsConfig) {
    this.config = config ?? {};
  }

  // ---------------------------------------------------------------------------
  // Counters
  // ---------------------------------------------------------------------------

  increment(name: string, labels?: Record<string, string>): void {
    const key = this.metricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  decrement(name: string, labels?: Record<string, string>): void {
    const key = this.metricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) - 1);
  }

  // ---------------------------------------------------------------------------
  // Gauges
  // ---------------------------------------------------------------------------

  gauge(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    const key = this.metricKey(name, labels);
    const entry: MetricValue = {
      name: key,
      value,
      labels,
      timestamp: Date.now(),
    };

    const arr = this.metrics.get(name) ?? [];
    arr.push(entry);
    this.metrics.set(name, arr);
  }

  // ---------------------------------------------------------------------------
  // Histograms
  // ---------------------------------------------------------------------------

  histogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    const key = this.metricKey(name, labels);
    const arr = this.histograms.get(key) ?? [];
    arr.push(value);
    this.histograms.set(key, arr);
  }

  // ---------------------------------------------------------------------------
  // Retrieval
  // ---------------------------------------------------------------------------

  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  getGauge(name: string): MetricValue | undefined {
    const arr = this.metrics.get(name);
    return arr?.[arr.length - 1];
  }

  getHistogram(name: string): { count: number; sum: number; avg: number } {
    const values = this.histograms.get(name) ?? [];
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    return { count, sum, avg: count > 0 ? sum / count : 0 };
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  toPrometheus(): string {
    const lines: string[] = [];
    const pfx = this.config.prefix ? `${this.config.prefix}_` : "";

    for (const [key, value] of this.counters) {
      lines.push(`# TYPE ${pfx}${key} counter`);
      lines.push(`${pfx}${key} ${value}`);
    }

    for (const [name, entries] of this.metrics) {
      const latest = entries[entries.length - 1];
      if (latest) {
        lines.push(`# TYPE ${pfx}${name} gauge`);
        lines.push(`${pfx}${name} ${latest.value}`);
      }
    }

    for (const [key, values] of this.histograms) {
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      lines.push(`# TYPE ${pfx}${key} histogram`);
      lines.push(`${pfx}${key}_count ${count}`);
      lines.push(`${pfx}${key}_sum ${sum}`);
    }

    return lines.join("\n");
  }

  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.histograms.clear();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private metricKey(
    name: string,
    labels?: Record<string, string>,
  ): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    const suffix = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${name}{${suffix}}`;
  }
}
