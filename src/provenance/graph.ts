/**
 * In-memory provenance graph for tracking agent action causality.
 *
 * Provides O(1) node lookup, O(v+e) BFS traversal, and
 * bidirectional edge navigation. Serializable to/from ProvenanceGraphData.
 */

import type {
  ProvenanceEdge,
  ProvenanceGraphData,
  ProvenanceNode,
  ProvenanceNodeType,
} from "./types.ts";

// ============================================================================
// ProvenanceGraph
// ============================================================================

/**
 * Directed acyclic graph of provenance nodes and edges.
 *
 * Nodes are keyed by `node_id`; edges are keyed by source node id
 * for O(1) child lookup. Parent lookup scans the edge list (O(e))
 * but is typically rare in provenance workflows.
 */
export class ProvenanceGraph {
  /** All nodes, keyed by node_id. */
  private readonly nodes: Map<string, ProvenanceNode> = new Map();

  /** Outgoing edges, keyed by source node_id. */
  private readonly edges: Map<string, ProvenanceEdge[]> = new Map();

  /** Session this graph belongs to. */
  private readonly sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  // ---------------------------------------------------------------------------
  // Mutators
  // ---------------------------------------------------------------------------

  /**
   * Add a node to the graph. `node_id` and `timestamp` are auto-generated;
   * `session_id` is set to the graph's session.
   */
  addNode(
    node: Omit<ProvenanceNode, "node_id" | "timestamp">,
  ): ProvenanceNode {
    const complete: ProvenanceNode = {
      ...node,
      node_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.nodes.set(complete.node_id, complete);
    return complete;
  }

  /**
   * Add a directed edge from `from` to `to`.
   * @throws {Error} if either node does not exist or edge would create a cycle.
   */
  addEdge(
    from: string,
    to: string,
    type: ProvenanceEdge["type"] = "causal",
  ): void {
    if (!this.nodes.has(from)) {
      throw new Error(`Source node not found: ${from}`);
    }
    if (!this.nodes.has(to)) {
      throw new Error(`Target node not found: ${to}`);
    }
    if (from === to) {
      throw new Error(`Self-loop not allowed: ${from}`);
    }
    // Check for cycle: if `to` can reach `from`, adding this edge creates a cycle
    if (this.canReach(to, from)) {
      throw new Error(`Adding edge ${from} -> ${to} would create a cycle`);
    }
    const edge: ProvenanceEdge = { from, to, type };
    const outgoing = this.edges.get(from);
    if (outgoing) {
      outgoing.push(edge);
    } else {
      this.edges.set(from, [edge]);
    }
  }

  /**
   * Check if a node can reach another node via existing edges (BFS).
   */
  private canReach(from: string, to: string): boolean {
    const visited = new Set<string>();
    const queue = [from];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === to) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const outgoing = this.edges.get(current);
      if (outgoing) {
        for (const edge of outgoing) {
          if (!visited.has(edge.to)) {
            queue.push(edge.to);
          }
        }
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /** Retrieve a node by id, or undefined if not found. */
  getNode(nodeId: string): ProvenanceNode | undefined {
    return this.nodes.get(nodeId);
  }

  /** Return all direct children (targets of outgoing edges) of the given node. */
  getChildren(nodeId: string): ProvenanceNode[] {
    const outgoing = this.edges.get(nodeId);
    if (!outgoing) return [];
    const children: ProvenanceNode[] = [];
    for (const edge of outgoing) {
      const node = this.nodes.get(edge.to);
      if (node) children.push(node);
    }
    return children;
  }

  /** Return all direct parents (sources of incoming edges) of the given node. */
  getParents(nodeId: string): ProvenanceNode[] {
    const parents: ProvenanceNode[] = [];
    for (const [, outgoing] of this.edges) {
      for (const edge of outgoing) {
        if (edge.to === nodeId) {
          const node = this.nodes.get(edge.from);
          if (node) parents.push(node);
        }
      }
    }
    return parents;
  }

  /**
   * BFS forward from `nodeId`, returning all reachable nodes
   * (including the start node). O(v + e).
   */
  getReachable(nodeId: string): ProvenanceNode[] {
    const start = this.nodes.get(nodeId);
    if (!start) return [];

    const visited = new Set<string>();
    const queue: string[] = [nodeId];
    const result: ProvenanceNode[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.nodes.get(current);
      if (node) result.push(node);

      const outgoing = this.edges.get(current);
      if (outgoing) {
        for (const edge of outgoing) {
          if (!visited.has(edge.to)) {
            queue.push(edge.to);
          }
        }
      }
    }

    return result;
  }

  /** Return all nodes of the given type. */
  getNodesByType(type: ProvenanceNodeType): ProvenanceNode[] {
    const result: ProvenanceNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.node_type === type) {
        result.push(node);
      }
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /** Serialize the graph to a plain object. */
  toJSON(): ProvenanceGraphData {
    return {
      session_id: this.sessionId,
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()).flat(),
    };
  }

  /** Reconstruct a graph from serialized data. */
  static fromJSON(data: ProvenanceGraphData): ProvenanceGraph {
    const graph = new ProvenanceGraph(data.session_id);
    for (const node of data.nodes) {
      graph.nodes.set(node.node_id, node);
    }
    for (const edge of data.edges) {
      // Validate edge references valid nodes
      if (!graph.nodes.has(edge.from)) {
        console.warn(`Skipping edge with unknown source node: ${edge.from}`);
        continue;
      }
      if (!graph.nodes.has(edge.to)) {
        console.warn(`Skipping edge with unknown target node: ${edge.to}`);
        continue;
      }
      const outgoing = graph.edges.get(edge.from);
      if (outgoing) {
        outgoing.push(edge);
      } else {
        graph.edges.set(edge.from, [edge]);
      }
    }
    return graph;
  }

  // ---------------------------------------------------------------------------
  // Disk Persistence
  // ---------------------------------------------------------------------------

  /**
   * Write the provenance graph to disk as JSON.
   * Uses atomic write (temp file + rename) for crash safety.
   */
  async writeToDisk(dataDir: string): Promise<void> {
    await Deno.mkdir(dataDir, { recursive: true });

    const filePath = `${dataDir}/${this.sessionId}.provenance.json`;
    const tempPath = `${filePath}.tmp`;

    const data = this.toJSON();
    const json = JSON.stringify(data, null, 2);

    await Deno.writeTextFile(tempPath, json);
    await Deno.rename(tempPath, filePath);
  }

  /**
   * Load a provenance graph from disk.
   * Returns undefined if the file does not exist.
   */
  static async loadFromDisk(
    dataDir: string,
    sessionId: string,
  ): Promise<ProvenanceGraph | undefined> {
    const filePath = `${dataDir}/${sessionId}.provenance.json`;

    try {
      const json = await Deno.readTextFile(filePath);
      const raw = JSON.parse(json);

      // Validate structure before casting
      if (
        !raw ||
        typeof raw !== "object" ||
        typeof raw.session_id !== "string" ||
        !Array.isArray(raw.nodes) ||
        !Array.isArray(raw.edges)
      ) {
        throw new Error(`Invalid provenance graph data in ${filePath}`);
      }

      return ProvenanceGraph.fromJSON(raw as ProvenanceGraphData);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return undefined;
      }
      throw err;
    }
  }
}
