---
layout: home

hero:
  name: kayak-lab
  text: Event-sourced agent platform
  tagline: Decouple your AI agent runtime from UI surfaces using immutable event streams
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/allentv/kayak-lab

features:
  - title: Event-Sourced Architecture
    details: Every agent interaction is captured as an ordered stream of immutable events. Reconstruct state, replay sessions, and audit all behavior.
  - title: UI Independence
    details: Agent runtime contains no UI-specific logic. Multiple surfaces — CLI, VS Code, Web, Desktop — project from the same event stream.
  - title: Provider Abstraction
    details: Switch between OpenAI, Anthropic, and local models without changing agent code. Provider-agnostic interface with fallback chains.
  - title: Pluggable Capabilities
    details: Abstract interfaces for Git, GitHub, Shell, Kubernetes. Swap implementations, test with mocks, add new capabilities without touching the runtime.
  - title: Session Lifecycle
    details: Full session state machine — create, pause, resume, complete, fail, cancel. Sessions are recoverable from event streams after crashes.
  - title: Replay & Recovery
    details: Reconstruct any session state from events. Snapshots for fast recovery. Event schema versioning for forward compatibility.
---
