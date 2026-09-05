/**
 * Kubernetes capability implementation.
 *
 * Provides typed access to Kubernetes API operations using fetch.
 * Supports in-cluster auth (service account token) and explicit token via env vars.
 */

import {
  ICapability,
  CapabilityDefinition,
  CapabilityContext,
  CapabilityResult,
  CapabilityNotInitializedError,
} from "./capability.ts";

// ============================================================================
// Kubernetes Types
// ============================================================================

/** Kubernetes resource status. */
export type ResourceStatus = "Running" | "Pending" | "Succeeded" | "Failed" | "Unknown";

/** Kubernetes resource phase. */
export type ResourcePhase = "Active" | "Terminating" | "Inactive";

/** Kubernetes pod. */
export interface KubernetesPod {
  name: string;
  namespace: string;
  status: ResourceStatus;
  node?: string;
  ip?: string;
  restart_count: number;
  created_at: string;
  labels?: Record<string, string>;
}

/** Kubernetes service. */
export interface KubernetesService {
  name: string;
  namespace: string;
  type: "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
  cluster_ip?: string;
  ports: KubernetesServicePort[];
  created_at: string;
  labels?: Record<string, string>;
}

/** Kubernetes service port. */
export interface KubernetesServicePort {
  name?: string;
  port: number;
  target_port?: number;
  protocol?: string;
}

/** Kubernetes deployment. */
export interface KubernetesDeployment {
  name: string;
  namespace: string;
  replicas: number;
  ready_replicas: number;
  available_replicas: number;
  created_at: string;
  labels?: Record<string, string>;
}

/** Kubernetes namespace. */
export interface KubernetesNamespace {
  name: string;
  status: ResourcePhase;
  created_at: string;
  labels?: Record<string, string>;
}

/** Kubernetes resource event. */
export interface KubernetesEvent {
  type: "Normal" | "Warning";
  reason: string;
  message: string;
  count: number;
  last_timestamp: string;
}

// ============================================================================
// Kubernetes Capability Interface
// ============================================================================

/**
 * Interface for Kubernetes operations.
 */
export interface IKubernetesCapability extends ICapability {
  /** List pods in namespace. */
  listPods(namespace?: string): Promise<CapabilityResult<KubernetesPod[]>>;

  /** Get pod by name. */
  getPod(name: string, namespace?: string): Promise<CapabilityResult<KubernetesPod>>;

  /** Get pod logs. */
  getPodLogs(
    name: string,
    options?: {
      namespace?: string;
      container?: string;
      tail_lines?: number;
      since_seconds?: number;
    },
  ): Promise<CapabilityResult<string>>;

  /** List services in namespace. */
  listServices(namespace?: string): Promise<CapabilityResult<KubernetesService[]>>;

  /** Get service by name. */
  getService(name: string, namespace?: string): Promise<CapabilityResult<KubernetesService>>;

  /** List deployments in namespace. */
  listDeployments(namespace?: string): Promise<CapabilityResult<KubernetesDeployment[]>>;

  /** Get deployment by name. */
  getDeployment(name: string, namespace?: string): Promise<CapabilityResult<KubernetesDeployment>>;

  /** Scale deployment. */
  scaleDeployment(
    name: string,
    replicas: number,
    namespace?: string,
  ): Promise<CapabilityResult<KubernetesDeployment>>;

  /** List namespaces. */
  listNamespaces(): Promise<CapabilityResult<KubernetesNamespace[]>>;

  /** Get namespace by name. */
  getNamespace(name: string): Promise<CapabilityResult<KubernetesNamespace>>;

  /** Get events for a resource. */
  getEvents(
    resourceType: string,
    resourceName: string,
    namespace?: string,
  ): Promise<CapabilityResult<KubernetesEvent[]>>;

  /** Apply manifest (create or update). */
  applyManifest(
    manifest: Record<string, unknown>,
    namespace?: string,
  ): Promise<CapabilityResult<{ success: boolean; message: string }>>;

  /** Delete resource. */
  deleteResource(
    resourceType: string,
    name: string,
    namespace?: string,
  ): Promise<CapabilityResult<{ success: boolean; message: string }>>;
}

// ============================================================================
// Kubernetes Capability Implementation
// ============================================================================

/**
 * Kubernetes capability that executes real K8s API calls via fetch.
 *
 * Auth: reads KUBE_TOKEN env var, or falls back to in-cluster service account token.
 * Server: reads KUBE_API_SERVER env var, or defaults to https://kubernetes.default.svc.
 */
export class KubernetesCapability implements IKubernetesCapability {
  readonly definition: CapabilityDefinition = {
    name: "kubernetes",
    description: "Kubernetes operations",
    version: "1.0.0",
    rateLimit: { maxTokens: 100, refillRateMs: 10_000, refillRate: 10 },
  };

  private context: CapabilityContext | null = null;
  private apiServer = "";
  private token = "";
  private defaultNamespace = "default";

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
    const env: Record<string, string> = context.environment ?? {};

    this.apiServer = env["KUBE_API_SERVER"] ?? "https://kubernetes.default.svc";
    this.defaultNamespace = env["KUBE_NAMESPACE"] ?? "default";

    // Token: explicit env var, or in-cluster service account
    this.token = env["KUBE_TOKEN"] ?? "";
    if (!this.token) {
      try {
        this.token = await Deno.readTextFile(
          "/var/run/secrets/kubernetes.io/serviceaccount/token",
        );
      } catch {
        // Not in cluster — token must be provided via env
      }
    }
  }

  async dispose(): Promise<void> {
    this.context = null;
    this.token = "";
  }

  async listPods(namespace?: string): Promise<CapabilityResult<KubernetesPod[]>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      const data = await this.request("GET", `/api/v1/namespaces/${ns}/pods`);
      const items = (data.items as Record<string, unknown>[] ?? []);

      return { success: true, data: items.map((i) => this.parsePod(i, ns)) };
    } catch (error) {
      return { success: false, error: `Failed to list pods: ${error}` };
    }
  }

  async getPod(name: string, namespace?: string): Promise<CapabilityResult<KubernetesPod>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      const data = await this.request("GET", `/api/v1/namespaces/${ns}/pods/${name}`);
      return { success: true, data: this.parsePod(data, ns) };
    } catch (error) {
      return { success: false, error: `Failed to get pod: ${error}` };
    }
  }

  async getPodLogs(
    name: string,
    options?: {
      namespace?: string;
      container?: string;
      tail_lines?: number;
      since_seconds?: number;
    },
  ): Promise<CapabilityResult<string>> {
    this.ensureInitialized();

    try {
      const ns = options?.namespace ?? this.defaultNamespace;
      const params = new URLSearchParams();
      if (options?.container) params.set("container", options.container);
      if (options?.tail_lines) params.set("tailLines", String(options.tail_lines));
      if (options?.since_seconds) params.set("sinceSeconds", String(options.since_seconds));

      const qs = params.toString();
      const path = `/api/v1/namespaces/${encodeURIComponent(ns)}/pods/${encodeURIComponent(name)}/log${qs ? `?${qs}` : ""}`;
      const response = await fetch(
        `${this.apiServer}${path}`,
        { headers: { Authorization: `Bearer ${this.token}` } },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`K8s API ${response.status}: ${text}`);
      }

      const logs = await response.text();
      return { success: true, data: logs };
    } catch (error) {
      return { success: false, error: `Failed to get pod logs: ${error}` };
    }
  }

  async listServices(namespace?: string): Promise<CapabilityResult<KubernetesService[]>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      const data = await this.request("GET", `/api/v1/namespaces/${ns}/services`);
      const items = (data.items as Record<string, unknown>[] ?? []);

      return { success: true, data: items.map((i) => this.parseService(i, ns)) };
    } catch (error) {
      return { success: false, error: `Failed to list services: ${error}` };
    }
  }

  async getService(name: string, namespace?: string): Promise<CapabilityResult<KubernetesService>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      const data = await this.request("GET", `/api/v1/namespaces/${ns}/services/${name}`);
      return { success: true, data: this.parseService(data, ns) };
    } catch (error) {
      return { success: false, error: `Failed to get service: ${error}` };
    }
  }

  async listDeployments(namespace?: string): Promise<CapabilityResult<KubernetesDeployment[]>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      const data = await this.request("GET", `/apis/apps/v1/namespaces/${ns}/deployments`);
      const items = (data.items as Record<string, unknown>[] ?? []);

      return { success: true, data: items.map((i) => this.parseDeployment(i, ns)) };
    } catch (error) {
      return { success: false, error: `Failed to list deployments: ${error}` };
    }
  }

  async getDeployment(name: string, namespace?: string): Promise<CapabilityResult<KubernetesDeployment>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      const data = await this.request("GET", `/apis/apps/v1/namespaces/${ns}/deployments/${name}`);
      return { success: true, data: this.parseDeployment(data, ns) };
    } catch (error) {
      return { success: false, error: `Failed to get deployment: ${error}` };
    }
  }

  async scaleDeployment(
    name: string,
    replicas: number,
    namespace?: string,
  ): Promise<CapabilityResult<KubernetesDeployment>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      await this.request("PATCH", `/apis/apps/v1/namespaces/${ns}/deployments/${name}/scale`, {
        spec: { replicas },
      }, "application/strategic-merge-patch+json");

      // Fetch updated deployment
      const data = await this.request("GET", `/apis/apps/v1/namespaces/${ns}/deployments/${name}`);
      return { success: true, data: this.parseDeployment(data, ns) };
    } catch (error) {
      return { success: false, error: `Failed to scale deployment: ${error}` };
    }
  }

  async listNamespaces(): Promise<CapabilityResult<KubernetesNamespace[]>> {
    this.ensureInitialized();

    try {
      const data = await this.request("GET", "/api/v1/namespaces");
      const items = (data.items as Record<string, unknown>[] ?? []);

      return { success: true, data: items.map((i) => this.parseNamespace(i)) };
    } catch (error) {
      return { success: false, error: `Failed to list namespaces: ${error}` };
    }
  }

  async getNamespace(name: string): Promise<CapabilityResult<KubernetesNamespace>> {
    this.ensureInitialized();

    try {
      const data = await this.request("GET", `/api/v1/namespaces/${name}`);
      return { success: true, data: this.parseNamespace(data) };
    } catch (error) {
      return { success: false, error: `Failed to get namespace: ${error}` };
    }
  }

  async getEvents(
    resourceType: string,
    resourceName: string,
    namespace?: string,
  ): Promise<CapabilityResult<KubernetesEvent[]>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      const fieldSelector = `involvedObject.kind=${resourceType},involvedObject.name=${resourceName}`;
      const params = new URLSearchParams({ fieldSelector });
      const data = await this.request("GET", `/api/v1/namespaces/${encodeURIComponent(ns)}/events?${params}`);
      const items = (data.items as Record<string, unknown>[] ?? []);

      return { success: true, data: items.map((i) => this.parseEvent(i)) };
    } catch (error) {
      return { success: false, error: `Failed to get events: ${error}` };
    }
  }

  async applyManifest(
    manifest: Record<string, unknown>,
    namespace?: string,
  ): Promise<CapabilityResult<{ success: boolean; message: string }>> {
    this.ensureInitialized();

    try {
      const kind = (manifest.kind as string)?.toLowerCase() ?? "";
      const name = (manifest.metadata as Record<string, unknown>)?.name as string ?? "";
      const ns = (manifest.metadata as Record<string, unknown>)?.namespace as string ?? namespace ?? this.defaultNamespace;

      const apiPath = this.getApiPath(kind, ns, name);
      await this.request("POST", apiPath, manifest);
      return { success: true, data: { success: true, message: `Applied ${kind}/${name}` } };
    } catch (error) {
      return { success: false, error: `Failed to apply manifest: ${error}` };
    }
  }

  async deleteResource(
    resourceType: string,
    name: string,
    namespace?: string,
  ): Promise<CapabilityResult<{ success: boolean; message: string }>> {
    this.ensureInitialized();

    try {
      const ns = namespace ?? this.defaultNamespace;
      const apiPath = this.getApiPath(resourceType.toLowerCase(), ns, name);
      await this.request("DELETE", apiPath);
      return { success: true, data: { success: true, message: `Deleted ${resourceType}/${name}` } };
    } catch (error) {
      return { success: false, error: `Failed to delete resource: ${error}` };
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    contentType = "application/json",
  ): Promise<Record<string, unknown>> {
    const url = `${this.apiServer}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const init: RequestInit = { method, headers };
    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      headers["Content-Type"] = contentType;
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`K8s API ${response.status}: ${text}`);
    }

    if (response.status === 204 || response.headers.get("content-type")?.includes("text/plain")) {
      return {};
    }

    return await response.json() as Record<string, unknown>;
  }

  private parsePod(data: Record<string, unknown>, namespace: string): KubernetesPod {
    const spec = data.spec as Record<string, unknown> ?? {};
    const status = data.status as Record<string, unknown> ?? {};
    const labels = data.metadata as Record<string, unknown> ?? {};
    const podIP = status.podIP as string | undefined;
    const restartCount = ((status.containerStatuses as Array<Record<string, unknown>> ?? [])[0]?.restartCount as number) ?? 0;

    let podStatus: ResourceStatus = "Unknown";
    const phase = status.phase as string | undefined;
    if (phase === "Running") podStatus = "Running";
    else if (phase === "Pending") podStatus = "Pending";
    else if (phase === "Succeeded") podStatus = "Succeeded";
    else if (phase === "Failed") podStatus = "Failed";

    return {
      name: (data.metadata as Record<string, unknown>)?.name as string ?? "",
      namespace,
      status: podStatus,
      node: spec.nodeName as string | undefined,
      ip: podIP,
      restart_count: restartCount,
      created_at: (data.metadata as Record<string, unknown>)?.creationTimestamp as string ?? "",
      labels: (labels.labels as Record<string, string>) ?? {},
    };
  }

  private parseService(data: Record<string, unknown>, namespace: string): KubernetesService {
    const spec = data.spec as Record<string, unknown> ?? {};
    const ports = (spec.ports as Array<Record<string, unknown>> ?? []).map((p) => ({
      name: p.name as string | undefined,
      port: p.port as number,
      target_port: p.targetPort as number | undefined,
      protocol: p.protocol as string | undefined,
    }));

    return {
      name: (data.metadata as Record<string, unknown>)?.name as string ?? "",
      namespace,
      type: (spec.type as KubernetesService["type"]) ?? "ClusterIP",
      cluster_ip: spec.clusterIP as string | undefined,
      ports,
      created_at: (data.metadata as Record<string, unknown>)?.creationTimestamp as string ?? "",
      labels: ((data.metadata as Record<string, unknown>)?.labels as Record<string, string>) ?? {},
    };
  }

  private parseDeployment(data: Record<string, unknown>, namespace: string): KubernetesDeployment {
    const spec = data.spec as Record<string, unknown> ?? {};
    const status = data.status as Record<string, unknown> ?? {};

    return {
      name: (data.metadata as Record<string, unknown>)?.name as string ?? "",
      namespace,
      replicas: (spec.replicas as number) ?? 0,
      ready_replicas: (status.readyReplicas as number) ?? 0,
      available_replicas: (status.availableReplicas as number) ?? 0,
      created_at: (data.metadata as Record<string, unknown>)?.creationTimestamp as string ?? "",
      labels: ((data.metadata as Record<string, unknown>)?.labels as Record<string, string>) ?? {},
    };
  }

  private parseNamespace(data: Record<string, unknown>): KubernetesNamespace {
    const status = data.status as Record<string, unknown> ?? {};

    return {
      name: (data.metadata as Record<string, unknown>)?.name as string ?? "",
      status: (status.phase as ResourcePhase) ?? "Active",
      created_at: (data.metadata as Record<string, unknown>)?.creationTimestamp as string ?? "",
      labels: ((data.metadata as Record<string, unknown>)?.labels as Record<string, string>) ?? {},
    };
  }

  private parseEvent(data: Record<string, unknown>): KubernetesEvent {
    return {
      type: (data.type as "Normal" | "Warning") ?? "Normal",
      reason: data.reason as string ?? "",
      message: data.message as string ?? "",
      count: (data.count as number) ?? 0,
      last_timestamp: (data.lastTimestamp as string) ?? "",
    };
  }

  private getApiPath(kind: string, namespace: string, name: string): string {
    const pluralMap: Record<string, string> = {
      pod: "pods",
      service: "services",
      deployment: "deployments",
      namespace: "namespaces",
      configmap: "configmaps",
      secret: "secrets",
      ingress: "ingresses",
      networkpolicy: "networkpolicies",
      persistentvolumeclaim: "persistentvolumeclaims",
      resourcequota: "resourcequotas",
      limitrange: "limitranges",
      serviceaccount: "serviceaccounts",
      role: "roles",
      rolebinding: "rolebindings",
      clusterrole: "clusterroles",
      clusterrolebinding: "clusterrolebindings",
      job: "jobs",
      cronjob: "cronjobs",
      statefulset: "statefulsets",
      daemonset: "daemonsets",
      replicaset: "replicasets",
      horizontalpodautoscaler: "horizontalpodautoscalers",
      poddisruptionbudget: "poddisruptionbudgets",
      endpoints: "endpoints",
    };

    const encodedName = encodeURIComponent(name);
    const encodedNs = encodeURIComponent(namespace);

    if (kind === "namespace") {
      return `/api/v1/namespaces/${encodedName}`;
    }

    const appsKinds = ["deployment", "statefulset", "daemonset", "replicaset"];
    if (appsKinds.includes(kind)) {
      return `/apis/apps/v1/namespaces/${encodedNs}/${pluralMap[kind]}/${encodedName}`;
    }

    const plural = pluralMap[kind];
    if (!plural) {
      throw new Error(`Unknown resource kind: ${kind}. Add it to the pluralMap.`);
    }

    return `/api/v1/namespaces/${encodedNs}/${plural}/${encodedName}`;
  }

  private ensureInitialized(): void {
    if (!this.context) {
      throw new CapabilityNotInitializedError(this.definition.name);
    }
  }
}
