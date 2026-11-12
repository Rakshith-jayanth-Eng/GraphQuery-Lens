import { GraphEdge, GraphNode } from '../types/graph';

export function calculateShortestPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): { pathNodeIds: string[]; pathEdgeIds: string[] } {
  if (!startId || !endId || startId === endId) {
    return { pathNodeIds: [], pathEdgeIds: [] };
  }

  // Build adjacency graph (undirected for reachability or directed)
  const adj = new Map<string, { neighbor: string; edgeId: string }[]>();
  nodes.forEach((n) => adj.set(n.id, []));

  edges.forEach((e) => {
    // Add forward direction
    if (adj.has(e.source)) {
      adj.get(e.source)!.push({ neighbor: e.target, edgeId: e.id });
    }
    // Also allow reverse traversal for dependency tracing
    if (adj.has(e.target)) {
      adj.get(e.target)!.push({ neighbor: e.source, edgeId: e.id });
    }
  });

  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const parent = new Map<string, { prevNode: string; edgeId: string }>();

  let found = false;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === endId) {
      found = true;
      break;
    }

    const neighbors = adj.get(curr) || [];
    for (const { neighbor, edgeId } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, { prevNode: curr, edgeId });
        queue.push(neighbor);
      }
    }
  }

  if (!found) {
    return { pathNodeIds: [], pathEdgeIds: [] };
  }

  const pathNodeIds: string[] = [endId];
  const pathEdgeIds: string[] = [];

  let curr = endId;
  while (curr !== startId) {
    const p = parent.get(curr);
    if (!p) break;
    pathEdgeIds.unshift(p.edgeId);
    curr = p.prevNode;
    pathNodeIds.unshift(curr);
  }

  return { pathNodeIds, pathEdgeIds };
}

export function computeHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return result;

  // Calculate in-degree for topological-like layering
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    children.set(n.id, []);
  });

  edges.forEach((e) => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    if (children.has(e.source)) {
      children.get(e.source)!.push(e.target);
    }
  });

  // Assign layers using BFS from zero-in-degree nodes
  const layers = new Map<number, string[]>();
  const nodeLayer = new Map<string, number>();

  const queue: { id: string; layer: number }[] = [];
  nodes.forEach((n) => {
    if ((inDegree.get(n.id) || 0) === 0) {
      queue.push({ id: n.id, layer: 0 });
      nodeLayer.set(n.id, 0);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    // Cyclic or fully interconnected, pick first node
    queue.push({ id: nodes[0].id, layer: 0 });
    nodeLayer.set(nodes[0].id, 0);
  }

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, layer } = queue.shift()!;
    visited.add(id);

    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer)!.push(id);

    const nextNodes = children.get(id) || [];
    for (const nextId of nextNodes) {
      const nextLayer = layer + 1;
      const currentAssigned = nodeLayer.get(nextId);
      if (currentAssigned === undefined || nextLayer > currentAssigned) {
        nodeLayer.set(nextId, nextLayer);
        queue.push({ id: nextId, layer: nextLayer });
      }
    }
  }

  // Handle any disconnected or leftover nodes
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      const layer = 0;
      if (!layers.has(layer)) layers.set(layer, []);
      layers.get(layer)!.push(n.id);
    }
  });

  const totalLayers = Math.max(...Array.from(layers.keys()), 0) + 1;
  const paddingX = 120;
  const paddingY = 100;
  const usableWidth = Math.max(width - paddingX * 2, 400);
  const usableHeight = Math.max(height - paddingY * 2, 300);

  const stepX = totalLayers > 1 ? usableWidth / (totalLayers - 1) : usableWidth / 2;

  layers.forEach((nodeIds, layerIdx) => {
    const count = nodeIds.length;
    const stepY = count > 1 ? usableHeight / (count - 1) : 0;
    const startY = count === 1 ? height / 2 : paddingY;

    nodeIds.forEach((id, rowIdx) => {
      const x = paddingX + layerIdx * stepX;
      const y = count === 1 ? startY : paddingY + rowIdx * stepY;
      result.set(id, { x, y });
    });
  });

  return result;
}

export function computeRadialLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  centerX: number,
  centerY: number,
  radius: number = 240
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return result;

  // Calculate degrees to place hub nodes in center
  const degrees = new Map<string, number>();
  nodes.forEach((n) => degrees.set(n.id, 0));
  edges.forEach((e) => {
    degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
    degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
  });

  const sortedNodes = [...nodes].sort(
    (a, b) => (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0)
  );

  // If we have a central high-degree node, place in center
  if (sortedNodes.length > 2 && (degrees.get(sortedNodes[0].id) || 0) > 2) {
    const hub = sortedNodes[0];
    result.set(hub.id, { x: centerX, y: centerY });

    const outerNodes = sortedNodes.slice(1);
    const angleStep = (2 * Math.PI) / outerNodes.length;

    outerNodes.forEach((node, i) => {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      result.set(node.id, { x, y });
    });
  } else {
    const angleStep = (2 * Math.PI) / nodes.length;
    nodes.forEach((node, i) => {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      result.set(node.id, { x, y });
    });
  }

  return result;
}
