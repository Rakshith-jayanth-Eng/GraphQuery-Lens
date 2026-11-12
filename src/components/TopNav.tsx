import React from 'react';
import {
  Network,
  Sparkles,
  Download,
  BookOpen,
  Cpu,
  Layers,
  Database
} from 'lucide-react';

interface TopNavProps {
  onOpenExport: () => void;
  onOpenDocModal: () => void;
  onExtract: () => void;
  isExtracting: boolean;
  activePresetName: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenExport,
  onOpenDocModal,
  onExtract,
  isExtracting,
  activePresetName,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#080c14] select-none shrink-0">
      {/* Zone 1: Single text element wordmark (Display face / Monospace font) */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
          <Network className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="text-base font-bold font-mono tracking-tight text-slate-100 whitespace-nowrap shrink-0">
          GraphQuery Lens
        </div>
      </div>

      {/* Zone 2: 4–5 concise single-line navigation buttons/links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={onOpenExport}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export DDL</span>
        </button>

        <button
          onClick={onOpenDocModal}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Architecture Guide</span>
        </button>

        <span className="text-slate-600">|</span>

        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <span className="text-slate-500">Active Preset:</span>
          <span className="text-cyan-300 font-semibold">{activePresetName}</span>
        </div>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExtract}
          disabled={isExtracting}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            isExtracting
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30'
          }`}
        >
          {isExtracting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extract Graph</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
