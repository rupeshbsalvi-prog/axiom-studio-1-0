// ----------------------------------------------------
// ReasoningGraphEngine.ts — Brain X Reasoning Graph Operations
//
// Location: src/app/studios/brain-x/mission/
// Layer:    Studio (NOT platform)
//
// Provides graph construction, traversal, and analysis operations
// on ReasoningGraph objects. Brain X reasons about dependencies,
// uncertainty, alternatives, and verification chains.
//
// All methods are pure functions over ReasoningGraph — no side effects,
// no StateService access, no EventBus. This makes the engine fully
// testable in isolation.
// ----------------------------------------------------

import type {
  ReasoningGraph,
  ReasoningNode,
  ReasoningEdge,
  EdgeRelationship,
  NodeType,
  NodeStatus,
} from "./MissionTypes";
import { generateId } from "./MissionTypes";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUCTION
// ─────────────────────────────────────────────────────────────────────────────

/** Create an empty ReasoningGraph. */
export function createReasoningGraph(): ReasoningGraph {
  return { nodes: [], edges: [] };
}

/** Add a node to the graph. Returns a new graph (immutable). */
export function addNode(
  graph: ReasoningGraph,
  objectiveId: string,
  type: NodeType,
  rationale?: string,
): ReasoningGraph {
  const node: ReasoningNode = {
    id: generateId("node"),
    objectiveId,
    type,
    status: "pending",
    rationale,
  };
  return { ...graph, nodes: [...graph.nodes, node] };
}

/** Add a typed edge between two nodes. Returns a new graph (immutable). */
export function addEdge(
  graph: ReasoningGraph,
  from: string,
  to: string,
  relationship: EdgeRelationship,
  rationale?: string,
): ReasoningGraph {
  if (from === to) {
    throw new Error(`ReasoningGraphEngine: self-loop detected on node "${from}"`);
  }
  const fromExists = graph.nodes.some((n) => n.id === from);
  const toExists = graph.nodes.some((n) => n.id === to);
  if (!fromExists) throw new Error(`ReasoningGraphEngine: source node "${from}" not found`);
  if (!toExists) throw new Error(`ReasoningGraphEngine: target node "${to}" not found`);

  const edge: ReasoningEdge = { from, to, relationship, rationale };
  return { ...graph, edges: [...graph.edges, edge] };
}

/** Update the status of a node. Returns a new graph (immutable). */
export function updateNodeStatus(
  graph: ReasoningGraph,
  nodeId: string,
  status: NodeStatus,
  output?: unknown,
): ReasoningGraph {
  const nodes = graph.nodes.map((n) =>
    n.id === nodeId ? { ...n, status, ...(output !== undefined ? { output } : {}) } : n,
  );
  return { ...graph, nodes };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAVERSAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Topological sort of all nodes in the graph.
 *
 * Uses Kahn's algorithm. "depends-on" and "blocks" edges define ordering.
 * Other relationship types (enables, alternative, derived-from, verifies)
 * are included in the ordering but with relaxed constraints.
 *
 * Returns nodes in execution order (predecessors before successors).
 * Throws if the graph contains a cycle.
 */
export function topologicalSort(graph: ReasoningGraph): ReasoningNode[] {
  const ORDERING_RELATIONSHIPS: EdgeRelationship[] = ["depends-on", "blocks", "derived-from"];

  // Build in-degree map for ordering edges only
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const node of graph.nodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  for (const edge of graph.edges) {
    if (ORDERING_RELATIONSHIPS.includes(edge.relationship)) {
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
      adjList.get(edge.from)?.push(edge.to);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const sorted: ReasoningNode[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);

    for (const neighbor of adjList.get(id) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== graph.nodes.length) {
    throw new Error("ReasoningGraphEngine: cycle detected in reasoning graph");
  }

  return sorted;
}

/**
 * Find all nodes that are currently executable.
 *
 * A node is executable when:
 * - Its status is "pending"
 * - All predecessor nodes (via depends-on / blocks / derived-from edges) are "completed"
 */
export function findExecutableNodes(graph: ReasoningGraph): ReasoningNode[] {
  const BLOCKING_RELATIONSHIPS: EdgeRelationship[] = ["depends-on", "blocks", "derived-from"];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  return graph.nodes.filter((node) => {
    if (node.status !== "pending") return false;

    const blockingEdges = graph.edges.filter(
      (e) => e.to === node.id && BLOCKING_RELATIONSHIPS.includes(e.relationship),
    );

    return blockingEdges.every((edge) => {
      const predecessor = nodeMap.get(edge.from);
      return predecessor?.status === "completed";
    });
  });
}

/**
 * Find the critical path — the longest dependency chain in the graph.
 * Returns node ids in order from start to end of the critical path.
 */
export function findCriticalPath(graph: ReasoningGraph): string[] {
  const ORDERING_RELATIONSHIPS: EdgeRelationship[] = ["depends-on", "blocks", "derived-from"];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // For each node, compute the longest path length from any source
  const pathLength = new Map<string, number>();
  const predecessor = new Map<string, string | null>();

  for (const node of graph.nodes) {
    pathLength.set(node.id, 0);
    predecessor.set(node.id, null);
  }

  try {
    const sorted = topologicalSort(graph);
    for (const node of sorted) {
      const outgoing = graph.edges.filter(
        (e) => e.from === node.id && ORDERING_RELATIONSHIPS.includes(e.relationship),
      );
      for (const edge of outgoing) {
        const newLength = (pathLength.get(node.id) ?? 0) + 1;
        if (newLength > (pathLength.get(edge.to) ?? 0)) {
          pathLength.set(edge.to, newLength);
          predecessor.set(edge.to, node.id);
        }
      }
    }
  } catch {
    return []; // cycle — no critical path
  }

  // Find the node with the maximum path length
  let maxLen = -1;
  let endNode: string | null = null;
  for (const [id, len] of pathLength.entries()) {
    if (len > maxLen) {
      maxLen = len;
      endNode = id;
    }
  }

  if (endNode === null) return graph.nodes.map((n) => n.id);

  // Trace back from endNode
  const path: string[] = [];
  let current: string | null = endNode;
  while (current !== null) {
    path.unshift(current);
    current = predecessor.get(current) ?? null;
  }

  return path;
}

/**
 * Find alternative paths for a given node.
 * Returns all nodes connected via "alternative" edges.
 */
export function findAlternatives(graph: ReasoningGraph, nodeId: string): ReasoningNode[] {
  const alternativeIds = graph.edges
    .filter((e) => e.relationship === "alternative" && (e.from === nodeId || e.to === nodeId))
    .map((e) => (e.from === nodeId ? e.to : e.from));

  return graph.nodes.filter((n) => alternativeIds.includes(n.id));
}

/**
 * Find all nodes that verify a given node's output.
 * Returns nodes connected via "verifies" edges pointing to nodeId.
 */
export function findVerifiers(graph: ReasoningGraph, nodeId: string): ReasoningNode[] {
  const verifierIds = graph.edges
    .filter((e) => e.relationship === "verifies" && e.to === nodeId)
    .map((e) => e.from);

  return graph.nodes.filter((n) => verifierIds.includes(n.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/** Check if the graph contains any cycles (returns true if cycle exists). */
export function hasCycle(graph: ReasoningGraph): boolean {
  try {
    topologicalSort(graph);
    return false;
  } catch {
    return true;
  }
}

/** Returns summary statistics about the current graph state. */
export function graphStats(graph: ReasoningGraph): {
  total: number;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  skipped: number;
  completionPercent: number;
} {
  const counts = { pending: 0, active: 0, completed: 0, failed: 0, skipped: 0 };
  for (const node of graph.nodes) {
    counts[node.status] = (counts[node.status] ?? 0) + 1;
  }
  const total = graph.nodes.length;
  const completionPercent = total === 0 ? 0 : Math.round((counts.completed / total) * 100);
  return { total, ...counts, completionPercent };
}

/** Returns true if all non-skipped nodes are completed or the graph is empty. */
export function isGraphComplete(graph: ReasoningGraph): boolean {
  return graph.nodes.every((n) => n.status === "completed" || n.status === "skipped");
}
