---
name: Test Utilities
slug: test-utilities
type: system
sources:
  - path: src/__test-utils__/fixtures/mod.ts
    hash: 895cb379127fa83df84a2782fb8e9c6fff8a1635e6f5bc8d7efcbf3b447e2593
  - path: src/__test-utils__/harness/mod.ts
    hash: ed6e25afcb71d457c6d5abd84811ac89ba2a6188746418dc46d46d338bb0d89d
  - path: src/__test-utils__/helpers/mod.ts
    hash: 862c8fbb2749b3810e363abed2be8a5fdc1001ca6c640b300aa0455a87aa074e
  - path: src/__test-utils__/mocks/mod.ts
    hash: 9849b44982bdd384935c0390246d485929697848a43481d8641e465cb262f35d
  - path: src/__tests__/_helpers/harness-client.ts
    hash: f4f94f68f93b4f82d1df7e518fc5103498e54015edee3fb4cddafd5a28266163
  - path: src/__tests__/_helpers/harness-process.ts
    hash: ce84bac11b2758323d10287ccd57bab4cd17032ba1cbd1ecce2170170089b9be
sources_digest: 3a494d0aa81295504c20d3fa4692f94662c0a50a40f1fa72134193247896dc08
links:
  - to: concrete-capabilities
    relation: validates
    description: Mocks simulate capability behavior for isolated testing
  - to: event-sourcing-core
    relation: validates
    description: Harness creates test environments with EventStream and SessionManager
generator:
  version: 1
covers:
  - symbol: HealthResponse
    kind: interface
    at: 'src/__tests__/_helpers/harness-client.ts:L12-L17'
  - symbol: SessionSummary
    kind: interface
    at: 'src/__tests__/_helpers/harness-client.ts:L19-L26'
  - symbol: SessionDetail
    kind: interface
    at: 'src/__tests__/_helpers/harness-client.ts:L28-L30'
  - symbol: EventRecord
    kind: interface
    at: 'src/__tests__/_helpers/harness-client.ts:L32-L39'
  - symbol: CapabilitySummary
    kind: interface
    at: 'src/__tests__/_helpers/harness-client.ts:L41-L45'
  - symbol: CorsHeaders
    kind: interface
    at: 'src/__tests__/_helpers/harness-client.ts:L47-L50'
  - symbol: HarnessClient
    kind: class
    at: 'src/__tests__/_helpers/harness-client.ts:L56-L166'
  - symbol: constructor
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L57-L57'
  - symbol: getHealth
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L61-L67'
  - symbol: createSession
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L71-L83'
  - symbol: patchSession
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L85-L100'
  - symbol: getSessions
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L102-L108'
  - symbol: getSession
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L110-L119'
  - symbol: getSessionEvents
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L121-L136'
  - symbol: getCapabilities
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L140-L146'
  - symbol: options
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L150-L165'
  - symbol: HttpError
    kind: class
    at: 'src/__tests__/_helpers/harness-client.ts:L172-L180'
  - symbol: constructor
    kind: method
    at: 'src/__tests__/_helpers/harness-client.ts:L173-L179'
  - symbol: HarnessProcess
    kind: interface
    at: 'src/__tests__/_helpers/harness-process.ts:L11-L15'
  - symbol: findFreePort
    kind: function
    at: 'src/__tests__/_helpers/harness-process.ts:L20-L39'
  - symbol: startHarness
    kind: function
    at: 'src/__tests__/_helpers/harness-process.ts:L44-L75'
  - symbol: stop
    kind: method
    at: 'src/__tests__/_helpers/harness-process.ts:L62-L73'
  - symbol: waitForReady
    kind: function
    at: 'src/__tests__/_helpers/harness-process.ts:L80-L102'
---
<!-- context:generated:start -->
## Summary

Comprehensive testing infrastructure: mocks for all capabilities (Git, GitHub, Shell, Model, EventStore), fixture loaders, session builders, event generators, assertions, and a full integration harness that creates in-memory runtime environments with configurable model responses.

## Related

- validates [[concrete-capabilities]] — Mocks simulate capability behavior for isolated testing
- validates [[event-sourcing-core]] — Harness creates test environments with EventStream and SessionManager
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
