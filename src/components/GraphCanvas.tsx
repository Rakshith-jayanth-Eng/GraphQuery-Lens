import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Route,
  Camera,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { GraphNode, GraphEdge } from '../types/graph';
import { getTypeStyle, ENTITY_TYPE_STYLES } from '../utils/themeColors';
import {
  calculateShortestPath,
  computeHierarchicalLayout,
  computeRadialLayout,
} from '../utils/graphAlgorithms';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  selectedEdgeId: string | null;
  onSelectEdge: (edgeId: string | null) => void;
  highlightedNodeIds?: string[];
  highlightedEdgeIds?: string[];
  onExportSvg?: () => void;
}

type LayoutMode = 'force' | 'hierarchical' | 'radial';

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  selectedEdgeId,
  onSelectEdge,
  highlightedNodeIds = [],
  highlightedEdgeIds = [],
  onExportSvg,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Viewport transforms (pan & zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Simulation state
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [simNodes, setSimNodes] = useState<(GraphNode & { x: number; y: number; vx: number; vy: number })[]>([]);
  const draggingNodeRef = useRef<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<string>>(new Set());

  // Path finder state
  const [isPathFinderActive, setIsPathFinderActive] = useState(false);
  const [pathStartId, setPathStartId] = useState<string>('');
  const [pathEndId, setPathEndId] = useState<string>('');

  // Hovered node for tooltip
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Available entity types in current graph
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    nodes.forEach((n) => types.add((n.type || 'SERVICE').toUpperCase()));
    return Array.from(types).sort();
  }, [nodes]);

  // Initialize or update simulation nodes with positions
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const cx = clientWidth > 0 ? clientWidth / 2 : 450;
    const cy = clientHeight > 0 ? clientHeight / 2 : 350;

    // Preserve existing positions if possible, else seed organically
    const newSimNodes = nodes.map((n, i) => {
      const existing = simNodes.find((sn) => sn.id === n.id);
      if (existing) {
        return {
          ...n,
          x: existing.x,
          y: existing.y,
          vx: existing.vx * 0.5,
          vy: existing.vy * 0.5,
        };
      }
      const angle = (i / Math.max(nodes.length, 1)) * 2 * Math.PI;
      const radius = 120 + (i % 3) * 60;
      return {
        ...n,
        x: cx + radius * Math.cos(angle) + (Math.random() - 0.5) * 30,
        y: cy + radius * Math.sin(angle) + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
      };
    });

    setSimNodes(newSimNodes);
  }, [nodes]);

  // Apply layout preset when layoutMode changes
  useEffect(() => {
    if (!containerRef.current || simNodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const width = clientWidth || 800;
    const height = clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;

    if (layoutMode === 'hierarchical') {
      const posMap = computeHierarchicalLayout(nodes, edges, width, height);
      setSimNodes((prev) =>
        prev.map((n) => {
          const pos = posMap.get(n.id);
          return pos ? { ...n, x: pos.x, y: pos.y, vx: 0, vy: 0 } : n;
        })
      );
    } else if (layoutMode === 'radial') {
      const posMap = computeRadialLayout(nodes, edges, cx, cy, Math.min(width, height) * 0.35);
      setSimNodes((prev) =>
        prev.map((n) => {
          const pos = posMap.get(n.id);
          return pos ? { ...n, x: pos.x, y: pos.y, vx: 0, vy: 0 } : n;
        })
      );
    }
  }, [layoutMode]);

  // Force simulation loop (Verlet-style link relaxation & charge repulsion)
  useEffect(() => {
    if (layoutMode !== 'force' || simNodes.length === 0) return;

    let animId: number;
    let iteration = 0;
    const maxIterations = 280;

    const tick = () => {
      iteration++;
      setSimNodes((currentNodes) => {
        const nextNodes = currentNodes.map((n) => ({ ...n }));
        const nodeMap = new Map(nextNodes.map((n) => [n.id, n]));
        const k = 140; // ideal spring length
        const repulsiveForce = 4500;
        const damping = 0.86;
        const cx = (containerRef.current?.clientWidth || 800) / 2;
        const cy = (containerRef.current?.clientHeight || 600) / 2;

        // 1. Repulsion between all node pairs
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const na = nextNodes[i];
            const nb = nextNodes[j];
            const dx = nb.x - na.x || (Math.random() - 0.5) * 2;
            const dy = nb.y - na.y || (Math.random() - 0.5) * 2;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq) || 1;

            if (dist < 380) {
              const force = repulsiveForce / (distSq + 120);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (na.id !== draggingNodeRef.current) {
                na.vx -= fx;
                na.vy -= fy;
              }
              if (nb.id !== draggingNodeRef.current) {
                nb.vx += fx;
                nb.vy += fy;
              }
            }
          }
        }

        // 2. Spring attraction along edges
        edges.forEach((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const springForce = (dist - k) * 0.045;
            const fx = (dx / dist) * springForce;
            const fy = (dy / dist) * springForce;

            if (source.id !== draggingNodeRef.current) {
              source.vx += fx;
              source.vy += fy;
            }
            if (target.id !== draggingNodeRef.current) {
              target.vx -= fx;
              target.vy -= fy;
            }
          }
        });

        // 3. Center gravity pull
        nextNodes.forEach((n) => {
          if (n.id === draggingNodeRef.current) return;
          n.vx += (cx - n.x) * 0.007;
          n.vy += (cy - n.y) * 0.007;

          // Apply velocity and damping
          n.vx *= damping;
          n.vy *= damping;
          n.x += n.vx;
          n.y += n.vy;
        });

        return nextNodes;
      });

      if (iteration < maxIterations || draggingNodeRef.current) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [edges, layoutMode, nodes.length]);

  // Compute 1-hop neighbors of currently selected node
  const directNeighborNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const neighbors = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedNodeId) neighbors.add(e.target);
      if (e.target === selectedNodeId) neighbors.add(e.source);
    });
    return neighbors;
  }, [selectedNodeId, edges]);

  // Calculate shortest path if path finder is enabled
  const shortestPathResult = useMemo(() => {
    if (!isPathFinderActive || !pathStartId || !pathEndId) {
      return { pathNodeIds: [], pathEdgeIds: [] };
    }
    return calculateShortestPath(nodes, edges, pathStartId, pathEndId);
  }, [isPathFinderActive, pathStartId, pathEndId, nodes, edges]);

  // Search filter matches
  const searchMatchedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const matched = new Set<string>();
    nodes.forEach((n) => {
      if (
        n.id.toLowerCase().includes(q) ||
        n.label.toLowerCase().includes(q) ||
        (n.type && n.type.toLowerCase().includes(q)) ||
        Object.entries(n.properties || {}).some(
          ([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
        )
      ) {
        matched.add(n.id);
      }
    });
    return matched;
  }, [searchQuery, nodes]);

  // Pan and Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newK = Math.min(Math.max(transform.k * zoomFactor, 0.2), 3.5);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom centered at mouse position
      const newX = mouseX - (mouseX - transform.x) * (newK / transform.k);
      const newY = mouseY - (mouseY - transform.y) * (newK / transform.k);

      setTransform({ x: newX, y: newY, k: newK });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background, not a node
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'bg-grid') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      }));
    } else if (draggingNodeRef.current) {
      // Dragging a node
      const draggedId = draggingNodeRef.current;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseSvgX = (e.clientX - rect.left - transform.x) / transform.k;
      const mouseSvgY = (e.clientY - rect.top - transform.y) / transform.k;

      setSimNodes((prev) =>
        prev.map((n) =>
          n.id === draggedId
            ? { ...n, x: mouseSvgX, y: mouseSvgY, vx: 0, vy: 0 }
            : n
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    draggingNodeRef.current = null;
  };

  // Node Drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    draggingNodeRef.current = nodeId;
    if (isPathFinderActive) {
      if (!pathStartId) {
        setPathStartId(nodeId);
      } else if (!pathEndId && nodeId !== pathStartId) {
        setPathEndId(nodeId);
      } else {
        setPathStartId(nodeId);
        setPathEndId('');
      }
    } else {
      onSelectNode(nodeId === selectedNodeId ? null : nodeId);
    }
  };

  // Zoom control buttons
  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.25 : 0.8;
    setTransform((prev) => ({
      ...prev,
      k: Math.min(Math.max(prev.k * factor, 0.2), 3.5),
    }));
  };

  const handleResetView = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  const handleFitToScreen = () => {
    if (simNodes.length === 0 || !containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    simNodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });

    const padding = 80;
    const graphWidth = Math.max(maxX - minX + padding * 2, 200);
    const graphHeight = Math.max(maxY - minY + padding * 2, 200);

    const scale = Math.min(
      (clientWidth - 40) / graphWidth,
      (clientHeight - 40) / graphHeight,
      1.5
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setTransform({
      x: clientWidth / 2 - centerX * scale,
      y: clientHeight / 2 - centerY * scale,
      k: Math.max(scale, 0.4),
    });
  };

  const toggleTypeFilter = (type: string) => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Map simulated node coordinates for quick edge calculation
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; label: string; type: string }>();
    simNodes.forEach((n) => {
      map.set(n.id, { x: n.x, y: n.y, label: n.label, type: n.type as string });
    });
    return map;
  }, [simNodes]);

  // Export SVG snapshot
  const triggerSvgDownload = () => {
    if (!svgRef.current) return;
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphquery-lens-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#080c14] overflow-hidden select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Background Dot Matrix Pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <pattern id="dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#38bdf8" />
          </pattern>
        </defs>
        <rect id="bg-grid" width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Search & Filter Drawer */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes, props..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-md shadow-lg transition-all w-48 sm:w-60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-xs text-slate-400 hover:text-slate-200"
              >
                ×
              </button>
            )}
          </div>

          {/* Layout Mode Selector */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-700/80 rounded-lg backdrop-blur-md shadow-lg">
            <button
              onClick={() => setLayoutMode('force')}
              title="Force-Directed organic physics"
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                layoutMode === 'force'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Force
            </button>
            <button
              onClick={() => setLayoutMode('hierarchical')}
              title="Hierarchical DAG topological layout"
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                layoutMode === 'hierarchical'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hierarchical
            </button>
            <button
              onClick={() => setLayoutMode('radial')}
              title="Radial concentric cluster layout"
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                layoutMode === 'radial'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Radial
            </button>
          </div>
        </div>

        {/* Right: Path Finder Toggle & Snapshot Export */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Path Finder Toggle */}
          <button
            onClick={() => {
              setIsPathFinderActive(!isPathFinderActive);
              if (isPathFinderActive) {
                setPathStartId('');
                setPathEndId('');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-md shadow-lg transition-all ${
              isPathFinderActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Path Finder</span>
          </button>

          {/* SVG Snapshot Export */}
          <button
            onClick={triggerSvgDownload}
            title="Export Vector SVG"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-lg backdrop-blur-md shadow-lg transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export SVG</span>
          </button>
        </div>
      </div>

      {/* Path Finder Guidance Banner */}
      {isPathFinderActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-slate-900/95 border border-emerald-500/50 rounded-lg shadow-2xl backdrop-blur-md text-xs text-slate-200">
          <Route className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {!pathStartId
              ? 'Click a Source Node on canvas'
              : !pathEndId
              ? `Source: "${nodes.find((n) => n.id === pathStartId)?.label}". Now click a Target Node.`
              : `Path from "${nodes.find((n) => n.id === pathStartId)?.label}" to "${
                  nodes.find((n) => n.id === pathEndId)?.label
                }"`}
          </span>
          {pathStartId && (
            <button
              onClick={() => {
                setPathStartId('');
                setPathEndId('');
              }}
              className="text-emerald-400 hover:underline font-mono text-[11px]"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Bottom Floating Canvas Controls (Zoom In, Zoom Out, Fit, Reset) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg backdrop-blur-md shadow-xl">
        <button
          onClick={() => handleZoom('in')}
          title="Zoom In"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          title="Zoom Out"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitToScreen}
          title="Fit to Screen"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          title="Reset Zoom & Pan"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Left: Entity Type Filter Badges */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-1.5 max-w-xl pointer-events-auto">
        {availableTypes.map((type) => {
          const style = getTypeStyle(type);
          const isSelected = activeTypeFilters.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleTypeFilter(type)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all border ${
                isSelected
                  ? `${style.bgClass} ${style.borderClass} ${style.textClass} ring-1 ${style.ringClass}`
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: style.hex, boxShadow: `0 0 6px ${style.glow}` }}
              />
              <span>{type}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive SVG Canvas Layer */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <defs>
          {/* Neon Glow Filters */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Directional Arrow Markers for All Entity Types */}
          {Object.entries(ENTITY_TYPE_STYLES).map(([type, style]) => (
            <marker
              key={`arrow-${type}`}
              id={`arrow-${type}`}
              viewBox="0 -5 10 10"
              refX="28"
              refY="0"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,-4L10,0L0,4" fill={style.primary} />
            </marker>
          ))}
          <marker
            id="arrow-default"
            viewBox="0 -5 10 10"
            refX="28"
            refY="0"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,-4L10,0L0,4" fill="#64748b" />
          </marker>
          <marker
            id="arrow-path"
            viewBox="0 -5 10 10"
            refX="28"
            refY="0"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0,-4L10,0L0,4" fill="#10b981" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Render Directed Edges */}
          {edges.map((edge) => {
            const source = nodePositionMap.get(edge.source);
            const target = nodePositionMap.get(edge.target);
            if (!source || !target) return null;

            const isEdgeSelected = edge.id === selectedEdgeId;
            const isPathEdge = shortestPathResult.pathEdgeIds.includes(edge.id);
            const isHighlighted =
              highlightedEdgeIds.includes(edge.relationship) ||
              (highlightedNodeIds.includes(edge.source) && highlightedNodeIds.includes(edge.target));
            const isIncidentEdge =
              (selectedNodeId === edge.source || selectedNodeId === edge.target) &&
              Boolean(selectedNodeId);

            // Filter check: dim if types are filtered out
            const isSourceFiltered =
              activeTypeFilters.size > 0 && !activeTypeFilters.has(source.type.toUpperCase());
            const isTargetFiltered =
              activeTypeFilters.size > 0 && !activeTypeFilters.has(target.type.toUpperCase());
            const isDimmed =
              (activeTypeFilters.size > 0 && (isSourceFiltered || isTargetFiltered)) ||
              (selectedNodeId &&
                selectedNodeId !== edge.source &&
                selectedNodeId !== edge.target &&
                !isPathEdge);

            // Smooth Bezier Curve calculation to prevent overlapping bidirectional lines
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const normalX = -dy / dist;
            const normalY = dx / dist;
            const curvature = 24; // curve offset
            const midX = (source.x + target.x) / 2 + normalX * curvature;
            const midY = (source.y + target.y) / 2 + normalY * curvature;

            const pathString = `M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`;

            const targetStyle = getTypeStyle(target.type);
            const markerId = isPathEdge
              ? 'url(#arrow-path)'
              : isIncidentEdge || isEdgeSelected
              ? `url(#arrow-${target.type.toUpperCase()})`
              : 'url(#arrow-default)';

            return (
              <g
                key={edge.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEdge(edge.id === selectedEdgeId ? null : edge.id);
                }}
                className="cursor-pointer group"
              >
                {/* Invisible wide hit target for easier edge clicking */}
                <path d={pathString} stroke="transparent" strokeWidth="16" fill="none" />

                {/* Visible Edge Stroke */}
                <path
                  d={pathString}
                  stroke={
                    isPathEdge
                      ? '#10b981'
                      : isIncidentEdge
                      ? targetStyle.primary
                      : isHighlighted
                      ? '#38bdf8'
                      : isEdgeSelected
                      ? '#06b6d4'
                      : '#334155'
                  }
                  strokeWidth={isPathEdge ? 3.5 : isIncidentEdge || isHighlighted || isEdgeSelected ? 2.5 : 1.5}
                  strokeDasharray={isPathEdge ? '6,4' : undefined}
                  fill="none"
                  markerEnd={markerId}
                  opacity={isDimmed ? 0.18 : 1}
                  className={isPathEdge ? 'animate-pulse' : 'transition-colors duration-150'}
                />

                {/* Relationship Pill Label on Midpoint */}
                <g transform={`translate(${midX}, ${midY})`} opacity={isDimmed ? 0.2 : 0.95}>
                  <rect
                    x={-(edge.relationship.length * 3.4 + 8)}
                    y="-9"
                    width={edge.relationship.length * 6.8 + 16}
                    height="18"
                    rx="9"
                    fill="#0b0f17"
                    stroke={
                      isPathEdge
                        ? '#10b981'
                        : isIncidentEdge
                        ? targetStyle.primary
                        : isEdgeSelected
                        ? '#06b6d4'
                        : '#1e293b'
                    }
                    strokeWidth="1"
                    className="group-hover:stroke-cyan-400 transition-colors"
                  />
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    className="font-mono text-[9px] font-semibold tracking-wider fill-slate-300 pointer-events-none"
                  >
                    {edge.relationship}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Graph Nodes */}
          {simNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isDirectNeighbor = directNeighborNodeIds.has(node.id);
            const isPathNode = shortestPathResult.pathNodeIds.includes(node.id);
            const isHighlighted = highlightedNodeIds.includes(node.id);
            const isSearchMatch = searchMatchedNodeIds.has(node.id);

            const isTypeFiltered =
              activeTypeFilters.size > 0 && !activeTypeFilters.has((node.type || '').toUpperCase());

            const isDimmed =
              (activeTypeFilters.size > 0 && isTypeFiltered) ||
              (selectedNodeId && !isSelected && !isDirectNeighbor && !isPathNode) ||
              (searchQuery.trim().length > 0 && !isSearchMatch);

            const style = getTypeStyle(node.type);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer group"
                opacity={isDimmed ? 0.22 : 1}
              >
                {/* Glow ring on selection or path */}
                {(isSelected || isPathNode || isHighlighted || isSearchMatch) && (
                  <circle
                    r="34"
                    fill="none"
                    stroke={isPathNode ? '#10b981' : isHighlighted ? '#38bdf8' : style.primary}
                    strokeWidth="2.5"
                    strokeDasharray={isSelected ? '4,3' : undefined}
                    opacity="0.8"
                    className="animate-spin-slow"
                  />
                )}

                {/* Outer halo background */}
                <circle
                  r="24"
                  fill="#0b0f17"
                  stroke={
                    isPathNode
                      ? '#10b981'
                      : isSelected
                      ? style.primary
                      : isDirectNeighbor
                      ? style.primary
                      : style.primary
                  }
                  strokeWidth={isSelected || isPathNode ? 3 : 1.8}
                  style={{
                    filter: isSelected || isPathNode ? 'url(#glow-cyan)' : undefined,
                  }}
                  className="transition-all duration-200 group-hover:scale-105"
                />

                {/* Inner decorative fill */}
                <circle r="19" fill={style.primary} fillOpacity={isSelected ? 0.25 : 0.12} />

                {/* Type Initial / Icon Representation */}
                <text
                  textAnchor="middle"
                  dy="4"
                  className="font-mono text-[11px] font-bold fill-slate-100 pointer-events-none select-none tracking-tight"
                >
                  {(node.type || 'S').slice(0, 3)}
                </text>

                {/* Primary Node Label Below Badge */}
                <g transform="translate(0, 34)">
                  <rect
                    x={-(node.label.length * 3.8 + 8)}
                    y="-8"
                    width={node.label.length * 7.6 + 16}
                    height="18"
                    rx="4"
                    fill="#080c14"
                    fillOpacity="0.85"
                    stroke="#1e293b"
                    strokeWidth="1"
                    className="pointer-events-none"
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    className={`font-sans text-[11px] font-semibold tracking-tight pointer-events-none select-none ${
                      isSelected ? 'fill-cyan-300 font-bold' : 'fill-slate-200'
                    }`}
                  >
                    {node.label}
                  </text>
                </g>

                {/* Small Subtitle / ID */}
                <text
                  y="49"
                  textAnchor="middle"
                  className="font-mono text-[9px] fill-slate-500 pointer-events-none select-none"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredNodeId && (
        (() => {
          const node = nodes.find((n) => n.id === hoveredNodeId);
          if (!node) return null;
          const style = getTypeStyle(node.type);
          return (
            <div className="absolute top-20 right-4 z-30 w-72 p-3.5 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none text-left">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-slate-100 text-sm truncate">{node.label}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${style.bgClass} ${style.borderClass} ${style.textClass} border`}
                >
                  {node.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2.5 leading-relaxed line-clamp-2">
                {node.description || 'No description provided.'}
              </p>
              {Object.keys(node.properties || {}).length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  {Object.entries(node.properties).slice(0, 3).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-500">{k}</span>
                      <span className="font-mono text-slate-300 truncate max-w-[140px]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
};
