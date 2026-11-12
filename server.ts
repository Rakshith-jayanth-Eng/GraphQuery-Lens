import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK with user-agent header
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    model: 'gemini-3.8-flash',
  });
});

// Extract Knowledge Graph and Neo4j Cypher statements from technical text
app.post('/api/extract-graph', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required for graph extraction.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
    }

    const systemInstruction = `You are a Principal Graph Architect and Neo4j Engineer.
Analyze the provided technical text (system architecture, API documentation, or incident postmortem) and extract:
1. Strongly typed entities (nodes) representing services, databases, queues, gateways, caches, clients, infrastructure, components, or monitoring layers.
2. Directed relationships (edges) between entities describing communication protocols, data flows, dependency chains, or incident propagation.
3. Production-grade Neo4j Cypher statements with idempotent MERGE clauses for all nodes and relationships, as well as unique ID constraints.
4. An executive summary describing the extracted topology.

Standard node types to categorize under:
SERVICE, DATABASE, QUEUE, GATEWAY, CACHE, CLIENT, INFRASTRUCTURE, MONITORING, EXTERNAL_API, INCIDENT_EVENT, COMPONENT, STORAGE.

Entity IDs must be snake_case alphanumeric strings (e.g., auth_service, pgbouncer_pool, kafka_ingest).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Extract the knowledge graph and Neo4j Cypher statements from the following technical text:\n\n${text}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Concise architectural summary of the extracted graph.',
            },
            nodes: {
              type: Type.ARRAY,
              description: 'List of extracted entities and system components.',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique snake_case identifier.' },
                  label: { type: Type.STRING, description: 'Display name of the entity.' },
                  type: { type: Type.STRING, description: 'Category: SERVICE, DATABASE, QUEUE, GATEWAY, CACHE, etc.' },
                  description: { type: Type.STRING, description: 'Short technical responsibility or role.' },
                  properties: {
                    type: Type.ARRAY,
                    description: 'Key-value pairs of technical attributes, protocols, ports, versions, etc.',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        value: { type: Type.STRING },
                      },
                      required: ['key', 'value'],
                    },
                  },
                },
                required: ['id', 'label', 'type'],
              },
            },
            edges: {
              type: Type.ARRAY,
              description: 'Directed relationships connecting entities.',
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING, description: 'Source node id.' },
                  target: { type: Type.STRING, description: 'Target node id.' },
                  relationship: { type: Type.STRING, description: 'UPPER_SNAKE_CASE verb e.g. CALLS, STREAMS_TO, WRITES_TO.' },
                  description: { type: Type.STRING, description: 'Description of the data flow or contract.' },
                  properties: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        value: { type: Type.STRING },
                      },
                      required: ['key', 'value'],
                    },
                  },
                },
                required: ['source', 'target', 'relationship'],
              },
            },
            cypherStatements: {
              type: Type.ARRAY,
              description: 'Valid, executable Neo4j Cypher statements (CREATE CONSTRAINT, MERGE nodes, MERGE edges).',
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'nodes', 'edges', 'cypherStatements'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Empty response received from Gemini.');
    }

    const parsed = JSON.parse(rawText);

    // Transform array-of-pairs properties into clean objects for client consumption
    const formattedNodes = (parsed.nodes || []).map((node: any) => {
      const propMap: Record<string, string> = {};
      if (Array.isArray(node.properties)) {
        node.properties.forEach((p: any) => {
          if (p && p.key) propMap[p.key] = String(p.value ?? '');
        });
      }
      return {
        id: node.id,
        label: node.label,
        type: (node.type || 'SERVICE').toUpperCase(),
        description: node.description || '',
        properties: propMap,
      };
    });

    const formattedEdges = (parsed.edges || []).map((edge: any, idx: number) => {
      const propMap: Record<string, string> = {};
      if (Array.isArray(edge.properties)) {
        edge.properties.forEach((p: any) => {
          if (p && p.key) propMap[p.key] = String(p.value ?? '');
        });
      }
      return {
        id: `e_${idx + 1}_${edge.source}_${edge.target}`,
        source: edge.source,
        target: edge.target,
        relationship: edge.relationship.toUpperCase().replace(/\s+/g, '_'),
        description: edge.description || '',
        properties: propMap,
      };
    });

    return res.json({
      summary: parsed.summary,
      nodes: formattedNodes,
      edges: formattedEdges,
      cypherStatements: parsed.cypherStatements || [],
    });
  } catch (error: any) {
    console.error('Error in /api/extract-graph:', error);
    return res.status(500).json({
      error: error.message || 'Failed to extract knowledge graph and Cypher.',
      details: error.statusText || String(error),
    });
  }
});

// Translate natural language questions into Neo4j Cypher queries and node highlights
app.post('/api/nl-to-cypher', async (req, res) => {
  try {
    const { query, graphContext } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query prompt is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
    }

    const systemInstruction = `You are a Neo4j Cypher and Graph Database Specialist.
Given a user query and the current graph schema (nodes and relationships), generate:
1. An accurate, idiomatic Neo4j Cypher query solving the question (e.g. MATCH, WHERE, RETURN, shortestPath, aggregations).
2. A plain-English explanation of how the query works.
3. An array of node IDs from the current graph that match or are relevant to the query criteria, so the UI can highlight them in the canvas visualizer.
4. An optional list of relationship types or target edges to highlight.`;

    const contextPayload = {
      nodes: (graphContext?.nodes || []).map((n: any) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        properties: n.properties,
      })),
      edges: (graphContext?.edges || []).map((e: any) => ({
        source: e.source,
        target: e.target,
        relationship: e.relationship,
      })),
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User Query: "${query}"\n\nCurrent Knowledge Graph Context:\n${JSON.stringify(contextPayload, null, 2)}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cypher: {
              type: Type.STRING,
              description: 'Executable Neo4j Cypher query.',
            },
            explanation: {
              type: Type.STRING,
              description: 'Clear explanation of the query structure, clauses, and filters.',
            },
            matchedNodeIds: {
              type: Type.ARRAY,
              description: 'Array of node IDs that answer or match this query in the current graph.',
              items: { type: Type.STRING },
            },
            targetEdges: {
              type: Type.ARRAY,
              description: 'Relationship types involved in the path or query.',
              items: { type: Type.STRING },
            },
            queryIntent: {
              type: Type.STRING,
              description: 'Short intent category (e.g., Shortest Path, Failure Analysis, Queue Discovery).',
            },
          },
          required: ['cypher', 'explanation', 'matchedNodeIds'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Empty response received from Gemini.');
    }

    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/nl-to-cypher:', error);
    return res.status(500).json({
      error: error.message || 'Failed to translate natural language to Cypher.',
    });
  }
});

// Mount Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GraphQuery Lens server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
