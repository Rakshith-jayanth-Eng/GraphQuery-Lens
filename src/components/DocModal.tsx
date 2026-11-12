import React from 'react';
import { BookOpen, X, Terminal, Cpu, Database, Network } from 'lucide-react';

interface DocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocModal: React.FC<DocModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              GraphQuery Lens — Architecture & Cypher Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed font-sans">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              <span>How It Works</span>
            </h4>
            <p className="text-slate-400">
              GraphQuery Lens ingests unstructured technical text (system architecture specs, incident postmortems, API docs) and leverages <strong>Google Gemini 3.8 Flash</strong> on the server to extract typed graph schemas.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Neo4j Cypher Schema Standards</span>
            </h4>
            <ul className="space-y-2 text-slate-400 list-disc list-inside">
              <li>
                <strong className="text-slate-200">Uniqueness Constraints:</strong> Emits <code className="text-purple-300">CREATE CONSTRAINT IF NOT EXISTS</code> to ensure unique entity identifiers.
              </li>
              <li>
                <strong className="text-slate-200">Idempotent Node Creation:</strong> Uses <code className="text-cyan-300">MERGE (n:Type &#123;id: ...&#125;)</code> with <code className="text-cyan-300">ON CREATE SET</code> and <code className="text-cyan-300">ON MATCH SET</code> to prevent duplicate records when re-running migrations.
              </li>
              <li>
                <strong className="text-slate-200">Typed Relationships:</strong> Pairs <code className="text-amber-300">MATCH</code> on endpoints with <code className="text-amber-300">MERGE (a)-[r:REL_TYPE]-&gt;(b)</code> preserving protocols, latency thresholds, and cipher suites.
              </li>
            </ul>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-4 space-y-2">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Natural Language to Cypher Translation</span>
            </h4>
            <p className="text-slate-400">
              Under the "NL to Cypher" tab, enter questions like <em>"Which services are single points of failure without failover replicas?"</em> or <em>"Find all databases receiving metrics from Flink"</em>. Gemini synthesizes executable Cypher queries and directly highlights matching nodes in the interactive canvas.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-4 space-y-2 font-mono text-[11px]">
            <div className="text-slate-400 font-semibold mb-1">Local Environment (.env):</div>
            <pre className="p-3 bg-[#080c14] border border-slate-800 rounded text-slate-300">
              {`GEMINI_API_KEY="your-google-gemini-api-key"\nPORT=3000`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
