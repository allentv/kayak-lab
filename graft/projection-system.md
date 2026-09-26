---
name: Projection System
slug: projection-system
type: system
sources:
  - path: src/projection/__tests__/desktop.test.ts
    hash: e5b536817a8efa9347ce3acccc8fc5848f7f4b6bae804836ef9e6283e7b9a038
  - path: src/projection/__tests__/protocol.test.ts
    hash: 93d3219b3195339150f63f1233485a604f28af06eb213c3291519552c1a3e6d3
  - path: src/projection/__tests__/rest-api.test.ts
    hash: 49756be0c290bdc9c7cab8b99e719691e2f773b896d2651240698b19f5b39283
  - path: src/projection/__tests__/vscode.test.ts
    hash: 40479acb32d73fac1f2cb27a2af85ea673081566e2f667a288281875c9a50232
  - path: src/projection/__tests__/web.test.ts
    hash: 3853c1ced7f31456afca01233951652ed91129f97bd0b1ad8077db6a98dc0c9a
  - path: src/projection/__tests__/websocket-server.test.ts
    hash: d8a2123466ce4aa551d188493f7ee4f00fa99c514c48a844a180b805de80bee7
  - path: src/projection/desktop.ts
    hash: 0a8128816a6e07c437b34173da66cf7dfdf7bc7b5058424621ebf6a64f0643c2
  - path: src/projection/mod.ts
    hash: dd46e4d84375723319f84a29b2e0ec3c07c4f787c41ff6a1cb928db5fdca1e16
  - path: src/projection/protocol.ts
    hash: fbd69382aedad9ac32644194f825e4c45004e9acf2fec88ac703b6b970725f54
  - path: src/projection/rest-api.ts
    hash: 10c582275de33245dd178ccf48ca57cf3bc98a619d897ec33413d829562f5451
  - path: src/projection/terminal.ts
    hash: 680e1f7d56156ad3738940df9cf124ebbb32ebbf466400d2756f6be9025df051
  - path: src/projection/vscode.ts
    hash: 11f5b5be10fb44919e2f6a92bbf193100620f9bc4fbf9de54659a4d723be6888
  - path: src/projection/web.ts
    hash: 12b8e872b0697349feae11e4ff55156d2e57401097c6e48e37b02747989657bf
  - path: src/projection/websocket-server.ts
    hash: b0fb869ea7caf8516807774ff0c42679aea3489ddee7d75f4abbd85348a41f8a
sources_digest: 1a6e4922e6fb99c5bb8983150ad45e949829f45ae0d5049842fa57b51e5e97a2
links:
  - to: memory-system
    relation: depends_on
    description: >-
      REST API projection optionally uses AttestationService and ProvenanceGraph
      for verification and lineage tracking.
  - to: runtime-orchestration
    relation: depends_on
    description: >-
      Projection protocols subscribe to IEventStream from runtime; WebSocket
      server reads from IEventStore; REST API uses ISessionManager and
      IEventStore.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Multi-platform UI surface layer that subscribes to event streams and renders agent state. Includes protocol for subscription management, WebSocket server for real-time delivery, and implementations for terminal, VS Code, web, desktop (Tauri), and REST API. Handles backpressure, gap recovery, and authentication.

## Related

- depends on [[memory-system]] — REST API projection optionally uses AttestationService and ProvenanceGraph for verification and lineage tracking.
- depends on [[runtime-orchestration]] — Projection protocols subscribe to IEventStream from runtime; WebSocket server reads from IEventStore; REST API uses ISessionManager and IEventStore.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
