import { assertEquals, assertExists } from "@std/assert";
import { KubernetesCapability } from "../kubernetes.ts";
import type { CapabilityContext } from "../capability.ts";

/** Start a mock K8s API server. */
function startMockServer(): { url: string; close: () => Promise<void> } {
  let deployReplicas = 3;

  const server = Deno.serve({ port: 0, onListen: () => {} }, (req) => {
    const url = new URL(req.url);
    const path = url.pathname;

    // GET /api/v1/namespaces/{ns}/pods
    if (req.method === "GET" && path.match(/^\/api\/v1\/namespaces\/[^/]+\/pods$/)) {
      return Response.json({
        items: [
          {
            metadata: { name: "pod-1", creationTimestamp: "2026-01-01T00:00:00Z", labels: { app: "web" } },
            spec: { nodeName: "node-1" },
            status: { phase: "Running", podIP: "10.0.0.1", containerStatuses: [{ restartCount: 2 }] },
          },
          {
            metadata: { name: "pod-2", creationTimestamp: "2026-01-02T00:00:00Z", labels: {} },
            spec: {},
            status: { phase: "Pending" },
          },
        ],
      });
    }

    // GET /api/v1/namespaces/{ns}/pods/{name}
    if (req.method === "GET" && path.match(/^\/api\/v1\/namespaces\/[^/]+\/pods\/[^/]+$/)) {
      return Response.json({
        metadata: { name: "pod-1", creationTimestamp: "2026-01-01T00:00:00Z", labels: { app: "web" } },
        spec: { nodeName: "node-1" },
        status: { phase: "Running", podIP: "10.0.0.1", containerStatuses: [{ restartCount: 0 }] },
      });
    }

    // GET /api/v1/namespaces/{ns}/pods/{name}/log
    if (req.method === "GET" && path.match(/^\/api\/v1\/namespaces\/[^/]+\/pods\/[^/]+\/log/)) {
      return new Response("line 1\nline 2\nline 3\n", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // GET /api/v1/namespaces/{ns}/services
    if (req.method === "GET" && path.match(/^\/api\/v1\/namespaces\/[^/]+\/services$/)) {
      return Response.json({
        items: [
          {
            metadata: { name: "svc-1", creationTimestamp: "2026-01-01T00:00:00Z", labels: { env: "prod" } },
            spec: { type: "ClusterIP", clusterIP: "10.0.0.10", ports: [{ name: "http", port: 80, targetPort: 8080, protocol: "TCP" }] },
          },
        ],
      });
    }

    // GET /apis/apps/v1/namespaces/{ns}/deployments
    if (req.method === "GET" && path.match(/^\/apis\/apps\/v1\/namespaces\/[^/]+\/deployments$/)) {
      return Response.json({
        items: [
          {
            metadata: { name: "deploy-1", creationTimestamp: "2026-01-01T00:00:00Z", labels: { app: "web" } },
            spec: { replicas: 3 },
            status: { readyReplicas: 2, availableReplicas: 2 },
          },
        ],
      });
    }

    // GET /apis/apps/v1/namespaces/{ns}/deployments/{name}
    if (req.method === "GET" && path.match(/^\/apis\/apps\/v1\/namespaces\/[^/]+\/deployments\/[^/]+$/)) {
      return Response.json({
        metadata: { name: "deploy-1", creationTimestamp: "2026-01-01T00:00:00Z", labels: { app: "web" } },
        spec: { replicas: deployReplicas },
        status: { readyReplicas: deployReplicas, availableReplicas: deployReplicas },
      });
    }

    // PATCH /apis/apps/v1/namespaces/{ns}/deployments/{name}/scale
    if (req.method === "PATCH" && path.match(/^\/apis\/apps\/v1\/namespaces\/[^/]+\/deployments\/[^/]+\/scale$/)) {
      deployReplicas = 5;
      return Response.json({
        metadata: { name: "deploy-1" },
        spec: { replicas: deployReplicas },
        status: { readyReplicas: deployReplicas, availableReplicas: deployReplicas },
      });
    }

    // GET /api/v1/namespaces
    if (req.method === "GET" && path === "/api/v1/namespaces") {
      return Response.json({
        items: [
          {
            metadata: { name: "default", creationTimestamp: "2026-01-01T00:00:00Z" },
            status: { phase: "Active" },
          },
          {
            metadata: { name: "kube-system", creationTimestamp: "2026-01-01T00:00:00Z" },
            status: { phase: "Active" },
          },
        ],
      });
    }

    // GET /api/v1/namespaces/error-ns (returns 500 — must be before general namespace handler)
    if (req.method === "GET" && path === "/api/v1/namespaces/error-ns") {
      return Response.json({ kind: "Status", status: "Failure", message: "internal error", code: 500 }, { status: 500 });
    }

    // GET /api/v1/namespaces/{name}
    if (req.method === "GET" && path.match(/^\/api\/v1\/namespaces\/[^/]+$/) && !path.includes("/pods") && !path.includes("/services") && !path.includes("/events")) {
      return Response.json({
        metadata: { name: "default", creationTimestamp: "2026-01-01T00:00:00Z" },
        status: { phase: "Active" },
      });
    }

    // GET /api/v1/namespaces/{ns}/events
    if (req.method === "GET" && path.match(/^\/api\/v1\/namespaces\/[^/]+\/events/)) {
      return Response.json({
        items: [
          {
            type: "Normal",
            reason: "Scheduled",
            message: "Successfully assigned pod",
            count: 1,
            lastTimestamp: "2026-01-01T00:00:00Z",
          },
        ],
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  });

  const addr = server.addr as Deno.NetAddr;
  return {
    url: `http://127.0.0.1:${addr.port}`,
    close: async () => {
      await server.shutdown();
    },
  };
}

Deno.test("KubernetesCapability", async (t) => {
  const mock = startMockServer();
  const context: CapabilityContext = {
    session_id: "test-session",
    environment: {
      KUBE_API_SERVER: mock.url,
      KUBE_TOKEN: "test-token",
      KUBE_NAMESPACE: "default",
    },
  };

  try {
    await t.step("initializes with config", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);
      assertEquals(k8s.definition.name, "kubernetes");
    });

    await t.step("listPods returns pods", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.listPods();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 2);
      assertEquals(result.data[0].name, "pod-1");
      assertEquals(result.data[0].status, "Running");
      assertEquals(result.data[0].node, "node-1");
      assertEquals(result.data[0].ip, "10.0.0.1");
      assertEquals(result.data[0].restart_count, 2);
    });

    await t.step("getPod returns a single pod", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.getPod("pod-1");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.name, "pod-1");
      assertEquals(result.data.status, "Running");
    });

    await t.step("getPodLogs returns log text", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.getPodLogs("pod-1");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.includes("line 1"), true);
    });

    await t.step("listServices returns services", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.listServices();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].name, "svc-1");
      assertEquals(result.data[0].type, "ClusterIP");
      assertEquals(result.data[0].ports.length, 1);
      assertEquals(result.data[0].ports[0].port, 80);
    });

    await t.step("listDeployments returns deployments", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.listDeployments();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].name, "deploy-1");
      assertEquals(result.data[0].replicas, 3);
      assertEquals(result.data[0].ready_replicas, 2);
    });

    await t.step("scaleDeployment updates replicas", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.scaleDeployment("deploy-1", 5);
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.replicas, 5);
    });

    await t.step("listNamespaces returns namespaces", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.listNamespaces();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 2);
      assertEquals(result.data[0].name, "default");
    });

    await t.step("getEvents returns events", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.getEvents("Pod", "pod-1");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].type, "Normal");
      assertEquals(result.data[0].reason, "Scheduled");
    });

    await t.step("propagates API errors as failure results", async () => {
      const k8s = new KubernetesCapability();
      await k8s.initialize(context);

      const result = await k8s.getNamespace("error-ns");
      assertEquals(result.success, false);
      assertExists(result.error);
    });

    await t.step("fails when not initialized", async () => {
      const k8s = new KubernetesCapability();

      let threw = false;
      try {
        await k8s.listPods();
      } catch (e) {
        threw = e instanceof Error && e.name === "CapabilityNotInitializedError";
      }
      assertEquals(threw, true);
    });
  } finally {
    await mock.close();
  }
});
