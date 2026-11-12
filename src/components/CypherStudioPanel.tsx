import React, { useState } from 'react';
import {
  Code2,
  SearchCode,
  SlidersHorizontal,
  Copy,
  Check,
  Download,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Terminal,
  ArrowRight,
  ArrowLeft,
  Key,
  Database,
  Layers,
  HelpCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { GraphNode, GraphEdge, NLQueryResponse } from '../types/graph';
import { getTypeStyle } from '../utils/themeColors';

interface CypherStudioPanelProps {
  cypherStatements: string[];
  summary: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  selectedEdgeId: string | null;
  onSelectEdge: (edgeId: string | null) => void;
  suggestedQuestions: string[];
  onExecuteNLQuery: (question: string) => Promise<NLQueryResponse | null>;
  isQueryingNL: boolean;
  activeNLResponse: NLQueryResponse | null;
  onClearHighlights: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type TabType = 'cypher' | 'nl_query' | 'inspector';

export const CypherStudioPanel: React.FC<CypherStudioPanelProps> = ({
  cypherStatements,
  summary,
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  selectedEdgeId,
  onSelectEdge,
  suggestedQuestions,
  onExecuteNLQuery,
  isQueryingNL,
  activeNLResponse,
  onClearHighlights,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('cypher');
  const [copiedCypher, setCopiedCypher] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [customNLQuery, setCustomNLQuery] = useState('');
  const [queryError, setQueryError] = useState<string | null>(null);

  // Switch to inspector tab automatically when a node or edge is clicked
  React.useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      setActiveTab('inspector');
    }
  }, [selectedNodeId, selectedEdgeId]);

  const fullCypherText = cypherStatements.join('\n');

  const handleCopyCypher = () => {
    navigator.clipboard.writeText(fullCypherText);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  const handleCopyNLQueryCypher = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleDownloadCql = () => {
    const blob = new Blob([fullCypherText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphquery-schema-${Date.now()}.cql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunNLQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setQueryError(null);
    try {
      await onExecuteNLQuery(queryText);
    } catch (err: any) {
      setQueryError(err.message || 'Failed to generate Cypher query');
    }
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : null;

  // Incoming and Outgoing edges for selected node
  const incomingEdges = selectedNode ? edges.filter((e) => e.target === selectedNode.id) : [];
  const outgoingEdges = selectedNode ? edges.filter((e) => e.source === selectedNode.id) : [];

  if (isCollapsed) {
    return (
      <div className="h-full border-l border-slate-800 bg-[#0b0f17] flex flex-col items-center py-4 px-2 select-none w-12 shrink-0">
        <button
          onClick={onToggleCollapse}
          title="Expand Cypher Studio & Inspector"
          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="writing-vertical-lr text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-cyan-500" />
          <span>Cypher Studio</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border-l border-slate-800 bg-[#0b0f17] flex flex-col w-96 lg:w-[460px] shrink-0 select-none">
      {/* Top Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('cypher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'cypher'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cypher DDL</span>
          </button>

          <button
            onClick={() => setActiveTab('nl_query')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'nl_query'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SearchCode className="w-3.5 h-3.5 text-purple-400" />
            <span>NL to Cypher</span>
            {activeNLResponse && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'inspector'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Inspector</span>
            {(selectedNodeId || selectedEdgeId) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          title="Collapse Panel"
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tab 1: Neo4j Cypher Statements */}
      {activeTab === 'cypher' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/30">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono text-slate-300">Neo4j Cypher Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCypher}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-200 rounded transition-colors"
              >
                {copiedCypher ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadCql}
                title="Download .cql file"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.cql</span>
              </button>
            </div>
          </div>

          {/* Formatted Code Block with Line Numbers */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed bg-[#080c14]">
            {cypherStatements.length === 0 ? (
              <div className="text-slate-500 italic py-8 text-center">
                No Cypher statements generated yet. Click "Extract Graph & Cypher" on the left panel.
              </div>
            ) : (
              <div className="space-y-1">
                {cypherStatements.map((stmt, idx) => {
                  const isComment = stmt.startsWith('//');
                  const isConstraint = stmt.startsWith('CREATE CONSTRAINT');
                  const isMerge = stmt.startsWith('MERGE');
                  const isMatch = stmt.startsWith('MATCH');

                  return (
                    <div key={idx} className="flex items-start gap-3 group">
                      <span className="text-[10px] text-slate-600 select-none w-6 text-right shrink-0 pt-0.5">
                        {idx + 1}
                      </span>
                      <div
                        className={`flex-1 break-all ${
                          isComment
                            ? 'text-slate-500 italic'
                            : isConstraint
                            ? 'text-purple-400 font-semibold'
                            : isMerge
                            ? 'text-cyan-300'
                            : isMatch
                            ? 'text-amber-300'
                            : 'text-slate-200'
                        }`}
                      >
                        {stmt || '\u00A0'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer note on Neo4j execution */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="font-mono">Idempotent MERGE syntax</span>
            <span className="text-slate-500">Ready for Neo4j Browser & AuraDB</span>
          </div>
        </div>
      )}

      {/* Tab 2: Natural Language to Cypher Translator */}
      {activeTab === 'nl_query' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Query Input Section */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/40">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Ask questions in natural English:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customNLQuery}
                onChange={(e) => setCustomNLQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunNLQuery(customNLQuery);
                }}
                placeholder="e.g. Find all queues connected to stream processors..."
                className="flex-1 px-3 py-2 text-xs bg-[#080c14] border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50"
              />
              <button
                onClick={() => handleRunNLQuery(customNLQuery)}
                disabled={isQueryingNL || !customNLQuery.trim()}
                className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  isQueryingNL || !customNLQuery.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                }`}
              >
                {isQueryingNL ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Translate</span>
                )}
              </button>
            </div>

            {/* Quick Suggestion Pills */}
            {suggestedQuestions && suggestedQuestions.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] font-mono text-slate-500 block mb-1">
                  Preset Queries:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCustomNLQuery(q);
                        handleRunNLQuery(q);
                      }}
                      className="px-2 py-1 text-[11px] bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-purple-300 rounded text-left transition-colors truncate max-w-full"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Result / Output Section */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#080c14]">
            {queryError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
                {queryError}
              </div>
            )}

            {activeNLResponse ? (
              <div className="space-y-4">
                {/* Generated Cypher Block */}
                <div className="border border-purple-500/30 rounded-xl bg-purple-950/10 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-purple-300 uppercase tracking-wider font-semibold">
                      Generated Cypher Query
                    </span>
                    <button
                      onClick={() => handleCopyNLQueryCypher(activeNLResponse.cypher)}
                      className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-100 font-mono"
                    >
                      {copiedQuery ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedQuery ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-[#080c14] border border-purple-500/20 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {activeNLResponse.cypher}
                  </pre>
                </div>

                {/* Plain-English Explanation */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-3.5">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Explanation
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeNLResponse.explanation}
                  </p>
                </div>

                {/* Graph Highlighted Nodes Indicator */}
                <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>
                      Highlighted <strong>{activeNLResponse.matchedNodeIds?.length || 0}</strong> matching nodes in canvas
                    </span>
                  </div>
                  <button
                    onClick={onClearHighlights}
                    className="text-[11px] font-mono text-cyan-400 hover:underline"
                  >
                    Clear Highlights
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic py-12 text-center text-xs space-y-2">
                <SearchCode className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Type a question above or click a preset query to translate plain English into Cypher and highlight matching nodes in the canvas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Entity & Property Inspector */}
      {activeTab === 'inspector' && (
        <div className="flex-1 flex flex-col overflow-y-auto p-4 bg-[#080c14] space-y-4">
          {selectedNode ? (
            (() => {
              const style = getTypeStyle(selectedNode.type);
              return (
                <div className="space-y-4">
                  {/* Node Identity Card */}
                  <div className={`p-4 rounded-xl border ${style.borderClass} ${style.bgClass}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-base font-semibold text-slate-100">
                          {selectedNode.label}
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">
                          id: "{selectedNode.id}"
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium ${style.bgClass} ${style.borderClass} ${style.textClass} border`}
                      >
                        {selectedNode.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedNode.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Properties Table */}
                  <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-3.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                      Node Properties & Attributes
                    </span>
                    {Object.keys(selectedNode.properties || {}).length > 0 ? (
                      <div className="divide-y divide-slate-800/80">
                        {Object.entries(selectedNode.properties).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between py-2 text-xs">
                            <span className="font-mono text-slate-400">{k}</span>
                            <span className="font-mono text-slate-200 font-medium">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No custom properties</span>
                    )}
                  </div>

                  {/* Outgoing Connections */}
                  <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-3.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold flex items-center justify-between">
                      <span>Outgoing Relationships ({outgoingEdges.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </span>
                    {outgoingEdges.length > 0 ? (
                      <div className="space-y-2">
                        {outgoingEdges.map((e) => {
                          const targetNode = nodes.find((n) => n.id === e.target);
                          return (
                            <div
                              key={e.id}
                              onClick={() => onSelectNode(e.target)}
                              className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                            >
                              <span className="font-mono text-cyan-300 font-medium">
                                -[:{e.relationship}]-&gt;
                              </span>
                              <span className="text-slate-200 truncate ml-2 font-semibold">
                                {targetNode?.label || e.target}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">None (terminal node)</span>
                    )}
                  </div>

                  {/* Incoming Connections */}
                  <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-3.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold flex items-center justify-between">
                      <span>Incoming Relationships ({incomingEdges.length})</span>
                      <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                    </span>
                    {incomingEdges.length > 0 ? (
                      <div className="space-y-2">
                        {incomingEdges.map((e) => {
                          const sourceNode = nodes.find((n) => n.id === e.source);
                          return (
                            <div
                              key={e.id}
                              onClick={() => onSelectNode(e.source)}
                              className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-200 truncate font-semibold">
                                {sourceNode?.label || e.source}
                              </span>
                              <span className="font-mono text-amber-300 font-medium ml-2">
                                -[:{e.relationship}]-&gt;
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">None (root / source node)</span>
                    )}
                  </div>

                  {/* Cypher Match Snippet for this node */}
                  <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-3.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                      Targeted Cypher Match
                    </span>
                    <pre className="p-2.5 bg-[#080c14] border border-slate-800 rounded text-[11px] font-mono text-cyan-300 overflow-x-auto">
                      {`MATCH (n:${selectedNode.type} {id: "${selectedNode.id}"})\nRETURN n, [(n)-[r]->(m) | {rel: type(r), target: m.id}] AS downstream;`}
                    </pre>
                  </div>
                </div>
              );
            })()
          ) : selectedEdge ? (
            (() => {
              const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
              const targetNode = nodes.find((n) => n.id === selectedEdge.target);
              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                    <div className="font-mono text-xs text-cyan-300 font-bold mb-1">
                      RELATIONSHIP: {selectedEdge.relationship}
                    </div>
                    <div className="text-xs text-slate-300 mb-3">
                      {selectedEdge.description || 'Directed relationship between entities.'}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono p-2 bg-[#080c14] rounded border border-slate-800">
                      <span className="text-slate-300">{sourceNode?.label || selectedEdge.source}</span>
                      <span className="text-cyan-400">→</span>
                      <span className="text-slate-300">{targetNode?.label || selectedEdge.target}</span>
                    </div>
                  </div>

                  {/* Edge Properties */}
                  <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-3.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                      Edge Properties
                    </span>
                    {Object.keys(selectedEdge.properties || {}).length > 0 ? (
                      <div className="divide-y divide-slate-800/80">
                        {Object.entries(selectedEdge.properties || {}).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between py-2 text-xs">
                            <span className="font-mono text-slate-400">{k}</span>
                            <span className="font-mono text-slate-200">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No custom edge properties</span>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="space-y-4">
              {/* Graph Summary Card */}
              <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-4">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Graph Topology Summary
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {summary || 'Extract an architecture document or select a preset to analyze graph metrics.'}
                </p>
              </div>

              {/* Topology Metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    Total Nodes
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {nodes.length}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    Directed Edges
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {edges.length}
                  </span>
                </div>
              </div>

              {/* Interactive Help Prompt */}
              <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
                <SlidersHorizontal className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Click any node or relationship on the canvas to inspect its schema properties, degree connectivity, and downstream dependencies.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
