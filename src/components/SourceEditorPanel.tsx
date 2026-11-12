import React from 'react';
import {
  FileText,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Cpu,
  Flame,
  Cloud
} from 'lucide-react';
import { SamplePreset } from '../types/graph';
import { SAMPLE_PRESETS } from '../data/presets';

interface SourceEditorPanelProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  onSelectPreset: (preset: SamplePreset) => void;
  activePresetId: string | null;
  onExtractGraph: () => void;
  isExtracting: boolean;
  extractionError: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  nodeCount: number;
  edgeCount: number;
}

export const SourceEditorPanel: React.FC<SourceEditorPanelProps> = ({
  sourceText,
  onSourceTextChange,
  onSelectPreset,
  activePresetId,
  onExtractGraph,
  isExtracting,
  extractionError,
  isCollapsed,
  onToggleCollapse,
  nodeCount,
  edgeCount,
}) => {
  const lineCount = sourceText ? sourceText.split('\n').length : 0;
  const wordCount = sourceText ? sourceText.trim().split(/\s+/).filter(Boolean).length : 0;

  if (isCollapsed) {
    return (
      <div className="h-full border-r border-slate-800 bg-[#0b0f17] flex flex-col items-center py-4 px-2 select-none w-12 shrink-0">
        <button
          onClick={onToggleCollapse}
          title="Expand Architecture Text Editor"
          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors mb-4"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="writing-vertical-lr text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-cyan-500" />
          <span>Source Notes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border-r border-slate-800 bg-[#0b0f17] flex flex-col w-96 lg:w-[420px] shrink-0 select-none">
      {/* Header with Title and Collapse Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-tight">Source Architecture Notes</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            title="Collapse Panel"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Selector Bar */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Sample Architecture Presets
          </span>
          <span className="text-[10px] text-cyan-400/90 font-mono">1-Click Load</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            const Icon =
              preset.id === 'iot-telemetry'
                ? Cpu
                : preset.id === 'incident-postmortem'
                ? Flame
                : Cloud;

            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`flex items-start gap-2.5 p-2 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div
                  className={`p-1.5 rounded-md mt-0.5 ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{preset.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Raw Text Editor Textarea */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Paste system doc, RFC, API spec, or incident log:</span>
          <button
            onClick={() => onSourceTextChange('')}
            className="text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear Text
          </button>
        </div>
        <textarea
          value={sourceText}
          onChange={(e) => onSourceTextChange(e.target.value)}
          placeholder="Paste architecture notes, incident postmortems, or system specs here to extract graph entities, relationships, and Neo4j Cypher statements..."
          className="flex-1 w-full p-3 text-xs font-mono leading-relaxed bg-[#080c14] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 resize-none overflow-y-auto selection:bg-cyan-500/30"
          spellCheck={false}
        />

        {/* Text Metrics Strip */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>{lineCount} lines</span>
            <span>·</span>
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{sourceText.length} chars</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <span>{nodeCount} nodes</span>
            <span>·</span>
            <span>{edgeCount} edges</span>
          </div>
        </div>
      </div>

      {/* Error Alert Display */}
      {extractionError && (
        <div className="mx-4 mb-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">
            <span className="font-semibold block mb-0.5">Extraction Issue:</span>
            <span>{extractionError}</span>
          </div>
        </div>
      )}

      {/* Action Footer: Extract Button */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <button
          onClick={onExtractGraph}
          disabled={isExtracting || !sourceText.trim()}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-xs tracking-wide transition-all shadow-lg ${
            isExtracting || !sourceText.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 hover:shadow-cyan-500/30 font-semibold'
          }`}
        >
          {isExtracting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing Graph & Cypher with Gemini 3.8 Flash...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Extract Graph & Neo4j Cypher</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
