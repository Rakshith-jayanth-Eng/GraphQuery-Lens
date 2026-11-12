import React, { useState, useEffect } from 'react';
import { SAMPLE_PRESETS } from './data/presets';
import { GraphData, NLQueryResponse, SamplePreset } from './types/graph';
import { TopNav } from './components/TopNav';
import { SourceEditorPanel } from './components/SourceEditorPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { CypherStudioPanel } from './components/CypherStudioPanel';
import { ExportModal } from './components/ExportModal';
import { DocModal } from './components/DocModal';

export default function App() {
  // Initialize with the Distributed IoT Telemetry Pipeline preset as requested
  const defaultPreset = SAMPLE_PRESETS[0];

  const [activePresetId, setActivePresetId] = useState<string | null>(defaultPreset.id);
  const [sourceText, setSourceText] = useState<string>(defaultPreset.sourceText);
  const [graphData, setGraphData] = useState<GraphData>(defaultPreset.initialGraph);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(defaultPreset.suggestedQuestions);

  // Selection & highlighting
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<string[]>([]);

  // Extraction state
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // NL Query state
  const [isQueryingNL, setIsQueryingNL] = useState<boolean>(false);
  const [activeNLResponse, setActiveNLResponse] = useState<NLQueryResponse | null>(null);

  // Collapsible panels
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);

  // Switch preset
  const handleSelectPreset = (preset: SamplePreset) => {
    setActivePresetId(preset.id);
    setSourceText(preset.sourceText);
    setGraphData(preset.initialGraph);
    setSuggestedQuestions(preset.suggestedQuestions);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHighlightedNodeIds([]);
    setHighlightedEdgeIds([]);
    setActiveNLResponse(null);
    setExtractionError(null);
  };

  // Trigger server-side Gemini 3.8 Flash extraction
  const handleExtractGraph = async () => {
    if (!sourceText.trim()) return;

    setIsExtracting(true);
    setExtractionError(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHighlightedNodeIds([]);
    setHighlightedEdgeIds([]);

    try {
      const response = await fetch('/api/extract-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server failed to extract knowledge graph.');
      }

      setGraphData({
        summary: data.summary || 'Extracted knowledge graph topology.',
        nodes: data.nodes || [],
        edges: data.edges || [],
        cypherStatements: data.cypherStatements || [],
      });

      // Update active preset indicator to custom if user edited text
      setActivePresetId(null);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractionError(
        err.message || 'Failed to extract graph. Please ensure your GEMINI_API_KEY is configured in Settings > Secrets.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Run Natural Language to Cypher query translation
  const handleExecuteNLQuery = async (question: string): Promise<NLQueryResponse | null> => {
    setIsQueryingNL(true);
    try {
      const response = await fetch('/api/nl-to-cypher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: question,
          graphContext: {
            nodes: graphData.nodes,
            edges: graphData.edges,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to translate natural language query to Cypher.');
      }

      setActiveNLResponse(data);
      if (Array.isArray(data.matchedNodeIds)) {
        setHighlightedNodeIds(data.matchedNodeIds);
      }
      if (Array.isArray(data.targetEdges)) {
        setHighlightedEdgeIds(data.targetEdges);
      }

      return data;
    } catch (err: any) {
      console.error('NL Query Error:', err);
      throw err;
    } finally {
      setIsQueryingNL(false);
    }
  };

  const handleClearHighlights = () => {
    setHighlightedNodeIds([]);
    setHighlightedEdgeIds([]);
    setActiveNLResponse(null);
  };

  const currentPresetName =
    SAMPLE_PRESETS.find((p) => p.id === activePresetId)?.name || 'Custom Architecture';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <TopNav
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenDocModal={() => setIsDocModalOpen(true)}
        onExtract={handleExtractGraph}
        isExtracting={isExtracting}
        activePresetName={currentPresetName}
      />

      {/* Main 3-Panel Split Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Panel 1: Left Technical Architecture Source Editor */}
        <SourceEditorPanel
          sourceText={sourceText}
          onSourceTextChange={(val) => {
            setSourceText(val);
            if (activePresetId) setActivePresetId(null);
          }}
          onSelectPreset={handleSelectPreset}
          activePresetId={activePresetId}
          onExtractGraph={handleExtractGraph}
          isExtracting={isExtracting}
          extractionError={extractionError}
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          nodeCount={graphData.nodes.length}
          edgeCount={graphData.edges.length}
        />

        {/* Panel 2: Center Interactive SVG Graph Canvas Visualizer */}
        <div className="flex-1 h-full relative overflow-hidden">
          <GraphCanvas
            nodes={graphData.nodes}
            edges={graphData.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              if (id) setSelectedEdgeId(null);
            }}
            selectedEdgeId={selectedEdgeId}
            onSelectEdge={(id) => {
              setSelectedEdgeId(id);
              if (id) setSelectedNodeId(null);
            }}
            highlightedNodeIds={highlightedNodeIds}
            highlightedEdgeIds={highlightedEdgeIds}
            onExportSvg={() => setIsExportModalOpen(true)}
          />
        </div>

        {/* Panel 3: Right Cypher Studio & Property Inspector */}
        <CypherStudioPanel
          cypherStatements={graphData.cypherStatements}
          summary={graphData.summary}
          nodes={graphData.nodes}
          edges={graphData.edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={setSelectedEdgeId}
          suggestedQuestions={suggestedQuestions}
          onExecuteNLQuery={handleExecuteNLQuery}
          isQueryingNL={isQueryingNL}
          activeNLResponse={activeNLResponse}
          onClearHighlights={handleClearHighlights}
          isCollapsed={isRightCollapsed}
          onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
        />
      </div>

      {/* Export Modal (.cql & JSON) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        graphData={graphData}
      />

      {/* Architecture & Cypher Guide Modal */}
      <DocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />
    </div>
  );
}
