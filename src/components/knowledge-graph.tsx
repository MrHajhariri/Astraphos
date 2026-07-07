"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphNode = {
  id: string;
  type: "PAGE" | "VAULT_FILE";
  title: string;
  href: string;
  degree: number;
};

type GraphLink = {
  source: string;
  target: string;
  type: "WIKI_LINK" | "MANUAL";
};

type GraphMode = "all" | "notes" | "vault";

export function KnowledgeGraph({ nodes, links }: { nodes: GraphNode[]; links: GraphLink[] }) {
  const router = useRouter();
  const graphRef = useRef<{ zoomToFit: (duration?: number, padding?: number) => void } | null>(null);
  const [mode, setMode] = useState<GraphMode>("all");
  const [query, setQuery] = useState("");
  const [connectedOnly, setConnectedOnly] = useState(false);

  const graphData = useMemo(() => {
    const visibleNodes = nodes.filter((node) => {
      if (mode === "notes" && node.type !== "PAGE") return false;
      if (mode === "vault" && node.type !== "VAULT_FILE") return false;
      if (connectedOnly && node.degree === 0) return false;
      if (query && !node.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    return {
      nodes: visibleNodes,
      links: links.filter((link) => visibleIds.has(link.source) && visibleIds.has(link.target)),
    };
  }, [connectedOnly, links, mode, nodes, query]);

  const mostConnected = useMemo(() => [...nodes].sort((a, b) => b.degree - a.degree).slice(0, 8), [nodes]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.18),_transparent_32%),#05070d] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "notes", "vault"] as GraphMode[]).map((item) => (
              <button key={item} onClick={() => setMode(item)} className={`rounded-full px-3 py-1.5 text-sm capitalize transition ${mode === item ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-200 hover:bg-white/15"}`}>
                {item === "all" ? "All" : item}
              </button>
            ))}
            <button onClick={() => setConnectedOnly((value) => !value)} className={`rounded-full px-3 py-1.5 text-sm transition ${connectedOnly ? "bg-cyan-300 text-zinc-950" : "bg-white/10 text-zinc-200 hover:bg-white/15"}`}>
              Connected only
            </button>
          </div>
          <div className="flex gap-2">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter graph..." className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white outline-none placeholder:text-zinc-400 focus:border-cyan-300" />
            <button onClick={() => graphRef.current?.zoomToFit(500, 48)} className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/15">Fit</button>
          </div>
        </div>
        <div className="h-[68vh]">
          <ForceGraph2D
            ref={graphRef as never}
            graphData={graphData}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={5}
            cooldownTicks={90}
            linkColor={(link) => ((link as GraphLink).type === "MANUAL" ? "rgba(161,161,170,0.36)" : "rgba(34,211,238,0.58)")}
            linkWidth={(link) => ((link as GraphLink).type === "MANUAL" ? 1 : 1.6)}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const graphNode = node as GraphNode & { x: number; y: number };
              const radius = Math.min(12, 5 + graphNode.degree * 0.9);
              const color = graphNode.type === "PAGE" ? "#a78bfa" : "#22d3ee";
              ctx.beginPath();
              ctx.arc(graphNode.x, graphNode.y, radius + 5, 0, 2 * Math.PI, false);
              ctx.fillStyle = `${color}22`;
              ctx.fill();
              ctx.beginPath();
              ctx.arc(graphNode.x, graphNode.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();
              ctx.shadowColor = color;
              ctx.shadowBlur = 12;
              ctx.fill();
              ctx.shadowBlur = 0;
              if (globalScale > 0.65 || graphNode.degree > 1) {
                ctx.font = `${12 / globalScale}px Inter, sans-serif`;
                ctx.fillStyle = "rgba(244,244,245,0.92)";
                ctx.fillText(graphNode.title, graphNode.x + radius + 4, graphNode.y + 4);
              }
            }}
            onNodeClick={(node) => router.push((node as GraphNode).href)}
          />
        </div>
      </div>
      <aside className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Most connected</p>
        <div className="mt-3 space-y-2">
          {mostConnected.map((node) => (
            <button key={node.id} onClick={() => router.push(node.href)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-cyan-700">
              <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-200">{node.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${node.type === "PAGE" ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200" : "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200"}`}>{node.degree}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
