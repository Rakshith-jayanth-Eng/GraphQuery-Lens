import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, FileJson, X } from 'lucide-react';
import { GraphData } from '../types/graph';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GraphData;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, graphData }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const cypherString = graphData.cypherStatements.join('\n');
  const jsonString = JSON.stringify(
    {
      summary: graphData.summary,
      nodes: graphData.nodes,
      edges: graphData.edges,
      cypher: graphData.cypherStatements,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">Export Knowledge Graph & Cypher</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Option 1: Neo4j Cypher Script (.cql) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Neo4j Cypher Statements</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {graphData.cypherStatements.length} lines of idempotent MERGE clauses & constraints.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => handleCopy(cypherString, 'cypher')}
                className="flex-1 py-1.5 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedType === 'cypher' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Cypher</span>
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  handleDownload(cypherString, `neo4j-graph-${Date.now()}.cql`, 'text/plain')
                }
                className="py-1.5 px-4 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .cql</span>
              </button>
            </div>
          </div>

          {/* Option 2: Graph JSON Data */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Graph Schema JSON</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Full node array ({graphData.nodes.length}), edge topology ({graphData.edges.length}), and properties.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => handleCopy(jsonString, 'json')}
                className="flex-1 py-1.5 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedType === 'json' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  handleDownload(jsonString, `graphquery-data-${Date.now()}.json`, 'application/json')
                }
                className="py-1.5 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
