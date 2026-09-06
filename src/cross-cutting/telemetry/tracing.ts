/**
 * Distributed tracing manager with OpenTelemetry-compatible export.
 */

import type { Span, TraceContext } from "./types.ts";

/**
 * Manages traces and spans; exports in OpenTelemetry-compatible format.
 */
export class TraceManager {
  private traces: Map<string, Span[]> = new Map();

  createTrace(): string {
    const traceId = this.generateId();
    this.traces.set(traceId, []);
    return traceId;
  }

  startSpan(
    traceId: string,
    name: string,
    parentSpanId?: string,
  ): Span {
    const span: Span = {
      traceId,
      spanId: this.generateId(),
      parentSpanId,
      name,
      startTime: Date.now(),
      status: "unset",
    };

    const spans = this.traces.get(traceId);
    if (spans) {
      spans.push(span);
    }

    return span;
  }

  endSpan(
    traceId: string,
    spanId: string,
    status: "ok" | "error" = "ok",
  ): void {
    const spans = this.traces.get(traceId);
    if (!spans) return;

    const span = spans.find((s) => s.spanId === spanId);
    if (span) {
      span.endTime = Date.now();
      span.status = status;
    }
  }

  getTrace(traceId: string): Span[] {
    return this.traces.get(traceId) ?? [];
  }

  getTraceContext(): TraceContext {
    const traceId = this.generateId();
    const spanId = this.generateId();
    this.traces.set(traceId, []);
    return { traceId, spanId };
  }

  toOpenTelemetry(traceId: string): object {
    const spans = this.getTrace(traceId);

    return {
      resourceSpans: [
        {
          resource: {
            attributes: [],
          },
          scopeSpans: [
            {
              scope: {
                name: "kayak-lab",
                version: "1.0.0",
              },
              spans: spans.map((span) => ({
                traceId: span.traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId ?? "",
                name: span.name,
                startTimeUnixNano: String(span.startTime * 1_000_000),
                endTimeUnixNano: span.endTime
                  ? String(span.endTime * 1_000_000)
                  : undefined,
                status: {
                  code: span.status === "ok"
                    ? "STATUS_CODE_OK"
                    : span.status === "error"
                    ? "STATUS_CODE_ERROR"
                    : "STATUS_CODE_UNSET",
                },
                attributes: span.attributes
                  ? Object.entries(span.attributes).map(([k, v]) => ({
                      key: k,
                      value: { stringValue: String(v) },
                    }))
                  : [],
              })),
            },
          ],
        },
      ],
    };
  }

  private generateId(): string {
    return crypto.randomUUID().replace(/-/g, "");
  }
}
