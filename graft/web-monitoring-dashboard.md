---
name: Web Monitoring Dashboard
slug: web-monitoring-dashboard
type: system
sources:
  - path: web/components/Layout.tsx
    hash: 3c3c5570cdf98bda9f891f86737b553ed0f08a44e446162d0eaa01e0b5f08be6
  - path: web/fresh.config.ts
    hash: df1d9004052316ab4bea0725f64c816d4ad3c70b4f6b7c8312568588aecdffd6
  - path: web/islands/DashboardIsland.tsx
    hash: 2f9315989344475afe1fd734fbbbd14c8db374d3f53e126dc2906e88daca287f
  - path: web/islands/SessionInspectorIsland.tsx
    hash: b829889a84e287c02c8c1646a3e742e7e410368cd782eb9bb74039e128ae0559
  - path: web/main.ts
    hash: 190df0ec56a5a0242729ff3e46d811c6e18dde7e53c8e8977b6d1332e086e54c
  - path: web/routes/index.tsx
    hash: 70479f0ce2249ed94e3407b4977ab894875b17dfe76a15e08c129fcdcb527468
  - path: 'web/routes/sessions/[harness]/[id].tsx'
    hash: c9cad304d6a0c7851e24523b32d1d4f207964dc2acd3e717ce965b8d99d0b178
sources_digest: a121c1c7563ce9fb7c61f9a8f71d4a1442390dc99172a2b62a33b892c1835195
links:
  - to: aggregation-layer
    relation: uses
    description: UI components fetch aggregated state via getAggregatedState for display.
  - to: harness-connection-manager
    relation: uses
    description: >-
      Dashboard connects to harnesses via WebSocket connections managed by
      harness-connection.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Fresh-based real-time monitoring UI with WebSocket connections to harness instances, displaying session timelines, event streams, and aggregated metrics. Combines client-side islands for interactivity with server-side routing and SQL-backed APIs.

## Related

- uses [[aggregation-layer]] — UI components fetch aggregated state via getAggregatedState for display.
- uses [[harness-connection-manager]] — Dashboard connects to harnesses via WebSocket connections managed by harness-connection.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
