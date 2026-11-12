export type EntityType =
  | 'SERVICE'
  | 'DATABASE'
  | 'QUEUE'
  | 'GATEWAY'
  | 'CACHE'
  | 'CLIENT'
  | 'INFRASTRUCTURE'
  | 'MONITORING'
  | 'EXTERNAL_API'
  | 'INCIDENT_EVENT'
  | 'COMPONENT'
  | 'STORAGE';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType | string;
  description?: string;
  properties: Record<string, string | number | boolean>;
  // Visual layout coordinates for force simulation
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  isMatched?: boolean;
  isNeighbor?: boolean;
  isPathNode?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  description?: string;
  properties?: Record<string, string | number | boolean>;
  isMatched?: boolean;
  isPathEdge?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  cypherStatements: string[];
  summary: string;
}

export interface NLQueryResponse {
  cypher: string;
  explanation: string;
  matchedNodeIds: string[];
  targetEdges?: string[];
  queryIntent?: string;
}

export interface SamplePreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  sourceText: string;
  initialGraph: GraphData;
  suggestedQuestions: string[];
}
