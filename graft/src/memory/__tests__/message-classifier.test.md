# src/memory/__tests__/message-classifier.test.ts

- systemMsg · function · L12-L14 — function systemMsg(content = "system prompt"): Message
- userMsg · function · L16-L18 — function userMsg(content: string): Message
- assistantMsg · function · L20-L22 — function assistantMsg(content: string): Message
- toolMsg · function · L24-L26 — function toolMsg(content: string, toolCallId = "call-1"): Message
- makeGraph · function · L28-L48 — function makeGraph( nodes: { id: string; type: ProvenanceNodeType; meta?: Record<string, unknown> }[], edges: { from: string; to: string }[], ): ProvenanceGraphData
