/**
 * ResearchMap — the interactive map of research directions (the differentiator).
 * Not a citation graph: an editorial map where each node is a plain-language
 * research direction. Click a node → side panel with description + a link to
 * its articles. Built on React Flow, laid out in concentric branches.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";

type ApiNode = {
  id: string;
  slug: string;
  name: string;
  description: string;
  branch: "foundations" | "methods" | "applied" | "society";
  isBranch: boolean;
  parentId: string | null;
  articleCount: number;
  momentum: number;
};

type ApiResponse = { nodes: ApiNode[]; edges: { id: string; source: string; target: string }[] };

const BRANCH_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  foundations: { bg: "#eef6f8", border: "#7aaeb6", label: "Foundations" },
  methods: { bg: "#fcf0e6", border: "#e8bc6e", label: "Methods & Models" },
  applied: { bg: "#f2f7f0", border: "#adcba4", label: "AI for Good" },
  society: { bg: "#f6f3fa", border: "#9b8fc0", label: "Safety & Society" },
};

const BRANCH_ANGLE: Record<string, number> = {
  foundations: -135,
  methods: -45,
  applied: 45,
  society: 135,
};

// Custom node: a rounded "marginalia" card sized by momentum.
function DirectionNode({ data }: NodeProps) {
  const color = BRANCH_COLORS[data.branch] ?? BRANCH_COLORS.foundations;
  const hot = data.hot && data.momentum > 0;
  return (
    <div
      style={{
        background: data.isBranch ? color.border : color.bg,
        border: `2.5px solid #2a3d66`,
        borderRadius: 14,
        padding: data.isBranch ? "12px 18px" : "9px 14px",
        boxShadow: "3px 3px 0 rgba(42,61,102,0.3)",
        fontWeight: data.isBranch ? 800 : 700,
        fontSize: data.isBranch ? 15 : 13,
        color: "#2a3d66",
        minWidth: data.isBranch ? 150 : 110,
        textAlign: "center",
        cursor: "pointer",
        outline: hot ? "3px solid #f8d29c" : "none",
        outlineOffset: 2,
        opacity: data.dimmed ? 0.35 : 1,
        transition: "opacity .2s ease",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div>{data.name}</div>
      {!data.isBranch && data.articleCount > 0 && (
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
          {data.articleCount} {data.articleCount === 1 ? "read" : "reads"}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { direction: DirectionNode };

export default function ResearchMap() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [selected, setSelected] = useState<ApiNode | null>(null);
  const [hotOnly, setHotOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/map")
      .then((r) => r.json())
      .then((d: ApiResponse) => setData(d))
      .catch(() => setError("Couldn't load the map. Please refresh."));
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };

    // Layout: center hub, four branch anchors around it, children fanned out.
    const byParent = new Map<string, ApiNode[]>();
    for (const n of data.nodes) {
      if (n.parentId) {
        const arr = byParent.get(n.parentId) ?? [];
        arr.push(n);
        byParent.set(n.parentId, arr);
      }
    }

    const positioned: Node[] = [];
    const branchNodes = data.nodes.filter((n) => n.isBranch);
    const q = query.trim().toLowerCase();

    for (const branch of branchNodes) {
      const angle = (BRANCH_ANGLE[branch.branch] ?? 0) * (Math.PI / 180);
      const bx = Math.cos(angle) * 320;
      const by = Math.sin(angle) * 240;
      const matches = q ? branch.name.toLowerCase().includes(q) : false;
      positioned.push({
        id: branch.id,
        type: "direction",
        position: { x: bx, y: by },
        data: {
          ...branch,
          hot: hotOnly,
          dimmed: q ? !matches && !(byParent.get(branch.id) ?? []).some((c) => c.name.toLowerCase().includes(q)) : false,
        },
      });

      const children = byParent.get(branch.id) ?? [];
      const spread = 150;
      children.forEach((child, i) => {
        const offset = (i - (children.length - 1) / 2) * spread;
        const perpAngle = angle + Math.PI / 2;
        const cx = bx + Math.cos(angle) * 220 + Math.cos(perpAngle) * offset;
        const cy = by + Math.sin(angle) * 220 + Math.sin(perpAngle) * offset;
        const childMatch = q ? child.name.toLowerCase().includes(q) : false;
        positioned.push({
          id: child.id,
          type: "direction",
          position: { x: cx, y: cy },
          data: {
            ...child,
            hot: hotOnly,
            dimmed: hotOnly ? child.momentum === 0 : q ? !childMatch : false,
          },
        });
      });
    }

    const flowEdges: Edge[] = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      style: { stroke: "#2a3d66", strokeWidth: 2, opacity: 0.4 },
    }));

    return { nodes: positioned, edges: flowEdges };
  }, [data, hotOnly, query]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      const found = data?.nodes.find((n) => n.id === node.id) ?? null;
      setSelected(found);
    },
    [data],
  );

  if (error) {
    return <div className="map-fallback">{error} <a href="/directions">Browse directions as a list →</a></div>;
  }

  return (
    <div className="map-shell">
      <div className="map-toolbar">
        <input
          className="map-search"
          placeholder="Search a direction…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search directions"
        />
        <label className="map-hot">
          <input type="checkbox" checked={hotOnly} onChange={(e) => setHotOnly(e.target.checked)} />
          Show what's hot now
        </label>
        <div className="map-legend">
          {Object.entries(BRANCH_COLORS).map(([k, v]) => (
            <span key={k} className="legend-item">
              <span className="legend-dot" style={{ background: v.border }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      <div className="map-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.3}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#9fc5cb" gap={28} size={1.5} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {selected && (
          <aside className="map-panel">
            <button className="map-panel-close" onClick={() => setSelected(null)} aria-label="Close">
              &times;
            </button>
            <span className="chip">{BRANCH_COLORS[selected.branch]?.label}</span>
            <h3>{selected.name}</h3>
            <p>{selected.description}</p>
            <div className="map-panel-stat">
              {selected.articleCount > 0
                ? `${selected.articleCount} explained ${selected.articleCount === 1 ? "paper" : "papers"}`
                : "No explained papers yet — check back soon."}
            </div>
            <a className="btn btn-primary" href={`/directions/${selected.slug}`}>
              Open this direction →
            </a>
          </aside>
        )}
      </div>
    </div>
  );
}
