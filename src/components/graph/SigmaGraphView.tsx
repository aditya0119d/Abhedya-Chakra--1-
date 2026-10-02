import React, { useEffect, useRef, useState } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import { TraceEdge, TraceNode } from '../../types/dataset';
import { formatINR } from '../../lib/currency';

interface SigmaGraphViewProps {
  nodes: TraceNode[];
  edges: TraceEdge[];
  selectedAccountId?: string;
  onSelectNode: (accountNumber: string) => void;
  className?: string;
}

const LAYER_COLORS: Record<string, string> = {
  VICTIM: '#475569', // Slate
  L1_COLLECTOR: '#2563eb', // Blue
  L2_DISTRIBUTOR: '#d97706', // Amber
  L3_TERMINAL: '#dc2626', // Crimson
  INTERMEDIARY: '#7c3aed', // Purple/Violet
  LEGITIMATE: '#0d9488', // Teal
};

export const SigmaGraphView: React.FC<SigmaGraphViewProps> = ({
  nodes,
  edges,
  selectedAccountId,
  onSelectNode,
  className = 'h-[540px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TraceNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy prior instance
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    if (nodes.length === 0) return;

    // Create Graphology instance
    const graph = new Graph({ multi: true });

    // Group nodes by hop for deterministic layered column layout
    const hopGroups: Record<number, TraceNode[]> = {};
    nodes.forEach((n) => {
      const h = Math.min(4, n.hop);
      if (!hopGroups[h]) hopGroups[h] = [];
      hopGroups[h].push(n);
    });

    // Add nodes with deterministic precomputed column positions
    Object.keys(hopGroups).forEach((hStr) => {
      const hop = parseInt(hStr, 10);
      const group = hopGroups[hop];
      const count = group.length;
      const x = hop * 350; // column horizontal spacing

      group.forEach((node, idx) => {
        // Vertical centering
        const y = (idx - (count - 1) / 2) * (count > 20 ? 40 : 70);
        const color = LAYER_COLORS[node.layer] || '#71717a';
        const isSelected = node.accountNumber === selectedAccountId;

        graph.addNode(node.accountNumber, {
          x,
          y,
          size: node.hop === 0 ? 14 : isSelected ? 12 : 9,
          label: `${node.accountNumber.slice(0, 4)}...${node.accountNumber.slice(-4)} (${node.layer.slice(0, 2)})`,
          color: isSelected ? '#18181b' : color,
          borderColor: isSelected ? '#d97706' : '#ffffff',
          nodeData: node,
        });
      });
    });

    // Add edges with amount-proportional thickness
    edges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        const thickness = Math.max(1.2, Math.min(6, Math.log10(Math.max(100, edge.amount)) * 1.0));
        graph.addEdgeWithKey(edge.id, edge.source, edge.target, {
          size: thickness,
          color: '#a1a1aa',
          label: formatINR(edge.amount),
          edgeData: edge,
        });
      }
    });

    // Initialize Sigma renderer
    try {
      const sigma = new Sigma(graph, containerRef.current, {
        renderEdgeLabels: false,
        labelRenderedSizeThreshold: 10,
        enableEdgeEvents: false,
        allowInvalidContainer: true,
      });

      // Events
      sigma.on('enterNode', ({ node }) => {
        const nData = graph.getNodeAttribute(node, 'nodeData') as TraceNode;
        if (nData) setHoveredNode(nData);
      });

      sigma.on('leaveNode', () => {
        setHoveredNode(null);
      });

      sigma.on('clickNode', ({ node }) => {
        onSelectNode(node);
      });

      const camera = sigma.getCamera();
      camera.on('updated', () => {
        setZoomLevel(Math.round(camera.ratio * 100) / 100);
      });

      sigmaRef.current = sigma;
    } catch {
      // Graceful fallback handled
    }

    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [nodes, edges, selectedAccountId, onSelectNode]);

  const handleZoomIn = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedZoom({ duration: 150 });
    }
  };

  const handleZoomOut = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedUnzoom({ duration: 150 });
    }
  };

  const handleResetCamera = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedReset({ duration: 150 });
    }
  };

  return (
    <div className={`relative w-full bg-[#f4f4f2] border border-[#e4e4e0] rounded overflow-hidden select-none dark:bg-[#18181b] dark:border-[#27272a] ${className}`}>
      {/* WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Layer Column Headers Overlay */}
      <div className="absolute top-2 left-3 right-3 flex justify-between pointer-events-none text-xs font-mono text-[#71717a] border-b border-[#e4e4e0] pb-1 bg-[#f4f4f2]/90 px-2 py-1 rounded">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#475569] inline-block" />
          HOP 0: VICTIM
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] inline-block" />
          HOP 1: L1 COLLECTOR
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block" />
          HOP 2: L2 DISTRIBUTOR
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block" />
          HOP 3+: L3 TERMINAL
        </span>
      </div>

      {/* Interactive Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 border border-[#e4e4e0] px-2 py-1 rounded shadow-xs text-xs font-mono">
        <button
          onClick={handleZoomIn}
          className="px-2 py-1 hover:bg-[#f4f4f2] border-r border-[#e4e4e0] text-[#18181b]"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 hover:bg-[#f4f4f2] border-r border-[#e4e4e0] text-[#18181b]"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={handleResetCamera}
          className="px-2 py-1 hover:bg-[#f4f4f2] text-[#18181b]"
          title="Reset View"
        >
          Reset
        </button>
        <span className="text-[#71717a] ml-1 pl-2 border-l border-[#e4e4e0]">
          {nodes.length} nodes, {edges.length} edges
        </span>
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredNode && (
        <div className="absolute top-12 left-4 z-20 bg-white/95 border border-[#18181b] p-3 rounded shadow-md text-xs pointer-events-none max-w-xs animate-in fade-in duration-75">
          <div className="flex items-center justify-between border-b border-[#e4e4e0] pb-1.5 mb-1.5">
            <span className="font-mono font-semibold text-[#18181b]">{hoveredNode.accountNumber}</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
              style={{ backgroundColor: LAYER_COLORS[hoveredNode.layer] || '#71717a' }}
            >
              {hoveredNode.layer}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-[#52525b]">
            <p>Bank: <span className="text-[#18181b]">{hoveredNode.bankName}</span></p>
            <p>IFSC: <span className="text-[#18181b]">{hoveredNode.primaryIfsc}</span></p>
            <p>Trace Inflow: <span className="text-[#0d9488] font-semibold">{formatINR(hoveredNode.inflowFromTrace)}</span></p>
            <p>Trace Outflow: <span className="text-[#dc2626] font-semibold">{formatINR(hoveredNode.outflowInTrace)}</span></p>
            {hoveredNode.isHolding && (
              <p className="text-[#b45309] font-bold">
                Retaining: {formatINR(hoveredNode.netHoldingInTrace)}
              </p>
            )}
            {hoveredNode.anomalies.length > 0 && (
              <p className="text-[#dc2626] border-t border-[#e4e4e0] pt-1 mt-1">
                {hoveredNode.anomalies.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
