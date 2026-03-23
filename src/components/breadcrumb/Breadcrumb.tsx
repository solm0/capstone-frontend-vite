import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { TreeNode } from "../../types";

// ── 스타일 변수 ──────────────────────────────────────────────────────────────
const STYLE = {
  font:                "'xtypewriter', monospace",
  fontSize:            "15px",

  circleRInner:        3,
  circleRHover:        4.5,
  circleColorInternal: "#585a5c",
  circleColorLeaf:     "#E5FF00",

  textColor:           "#585a5c",
  textHaloColor:       "#e7e5e4",
  textHaloWidth:       3,

  linkColor:           "#585a5c",
  linkWidth:           1,

  duration:            280,
  depthSpacing:        160,
};

const MARGIN = { top: 32, right: 120, bottom: 32, left: 100 };

// ── 데이터 ───────────────────────────────────────────────────────────────────
const data: TreeNode = {
  lemma: "любовь",
  children: [
    {
      lemma: "умирать",
      children: [
        { lemma: "смерть",  children: [{ lemma: "конец" }, { lemma: "тишина" }] },
        { lemma: "жизнь",   children: [{ lemma: "дышать" }, { lemma: "кровь" }] },
        { lemma: "причина" },
      ],
    },
    {
      lemma: "сердце",
      children: [
        { lemma: "боль",  children: [{ lemma: "гемоглобин", children: [
        { lemma: "боль",  children: [{ lemma: "гемоглобин" }, { lemma: "врач" }] },
        { lemma: "ночь",  children: [{ lemma: "темнота" }, { lemma: "одиночество", children: [
        { lemma: "боль",  children: [{ lemma: "гемоглобин" }, { lemma: "врач" }] },
        { lemma: "ночь",  children: [{ lemma: "темнота" }, { lemma: "одиночество" }] },
      ], }] },
      ], }, { lemma: "врач" }] },
        { lemma: "ночь",  children: [{ lemma: "темнота" }, { lemma: "одиночество" }] },
      ],
    },
    {
      lemma: "эпоха",
      children: [
        { lemma: "трезвость", children: [{ lemma: "насмешка" }] },
        { lemma: "теперь",    children: [{ lemma: "время" }, { lemma: "мир" }] },
      ],
    },
    {
      lemma: "мама",
      children: [
        { lemma: "неотложка", children: [{ lemma: "помощь" }, { lemma: "плечо" }] },
        { lemma: "зов" },
      ],
    },
  ],
};

export type D3Node = d3.HierarchyPointNode<TreeNode> & {
  x0?: number;
  y0?: number;
};

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function Breadcrumb({
  activeNode, setActiveNode,
}: {
  activeNode: D3Node | null;
  setActiveNode: (activeNode: D3Node | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);

  const activeNodeRef = useRef<D3Node | null>(null);
  const updateRef = useRef<((source: D3Node) => void) | null>(null);

  const setActive = useCallback((node: D3Node | null) => {
    activeNodeRef.current = node;
    setActiveNode(node);
    if (updateRef.current) {
      updateRef.current(node ?? ({} as D3Node));
    }
  }, []);

  useEffect(() => {
    const el        = svgRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const svg = d3.select(el);
    svg.selectAll("*").remove();

    // ── zoom / pan 설정 ────────────────────────────────────────────────────
    svg.append("defs").html(`
    <pattern id="dotgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <line x1="12" y1="0" x2="12" y2="24" stroke="#d7d9d8" stroke-width="1"/>
      <line x1="0" y1="12" x2="24" y2="12" stroke="#d7d9d8" stroke-width="1"/>
    </pattern>
  `);

    const zoomG = svg.append("g").attr("class", "zoom-layer");

    svg.insert("rect", ":first-child")
      .attr("id", "dot-bg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#dotgrid)");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on("zoom", (event) => {
        zoomG.attr("transform", event.transform);
        svg.select("#dotgrid")
          .attr("patternTransform", event.transform.toString());
      });

    svg
      .call(zoom)
      .on("dblclick.zoom", () => {
        svg.transition().duration(400)
          .call(zoom.transform, d3.zoomIdentity)
          .on("end", () => {
            svg.select("#dotgrid").attr("patternTransform", null);
          });
      });

    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(MARGIN.left, MARGIN.top)
    );

    const g         = zoomG.append("g");
    const linkGroup = g.append("g").attr("fill", "none");
    const nodeGroup = g.append("g");

    const treeLayout = d3.tree<TreeNode>().nodeSize([22, STYLE.depthSpacing]);

    const root = d3.hierarchy(data) as D3Node;
    root.x0 = 0;
    root.y0 = 0;

    let uid = 0;

    function diagonal(s: { x: number; y: number }, t: { x: number; y: number }) {
      return `M ${s.y} ${s.x}
              C ${(s.y + t.y) / 2} ${s.x},
                ${(s.y + t.y) / 2} ${t.x},
                ${t.y} ${t.x}`;
    }

    function isInternal(d: D3Node) {
      return !!d.children;
    }

    function getActivePath(active: D3Node | null): Set<string> {
      if (!active) return new Set();
      const ids = new Set<string>();
      (active.ancestors() as D3Node[]).forEach((n) => {
        if (n.id) ids.add(n.id as unknown as string);
      });
      return ids;
    }

    function applyOpacity(
      nodeSelection: d3.Selection<SVGGElement, D3Node, SVGGElement, unknown>,
      linkSelection: d3.Selection<SVGPathElement, d3.HierarchyLink<TreeNode>, SVGGElement, unknown>,
      activeIds: Set<string>,
      hoveredId: string | null
    ) {
      const hasActive = activeIds.size > 0;

      nodeSelection.style("opacity", (d) => {
        if (!hasActive) return "1";
        const id = d.id as unknown as string;
        if (id === hoveredId) return "1";
        return activeIds.has(id) ? "1" : "0.5";
      });

      linkSelection.style("opacity", (d) => {
        if (!hasActive) return "1";
        const sourceId = (d.source as D3Node).id as unknown as string;
        const targetId = (d.target as D3Node).id as unknown as string;
        return activeIds.has(sourceId) && activeIds.has(targetId) ? "1" : "0.4";
      });
    }

    const BTN_W = 20, BTN_H = 20;
    const BTN_OFFSET_X = -30;
    const BTN_OFFSET_Y = -30;

    const fo = nodeGroup.append("foreignObject")
      .attr("width", BTN_W)
      .attr("height", BTN_H)
      .attr("x", 0).attr("y", 0)
      .style("display", "none")
      .style("pointer-events", "all");

    const foDiv = fo.append("xhtml:div")
      .style("display", "flex");

    const deleteBtn = foDiv.append("xhtml:button")
      .style("width",  `${BTN_W}px`)
      .style("height", `${BTN_H}px`)
      .style("border", "1px solid #fca5a5")
      .style("border-radius", "4px")
      .style("background", "#fff1f2")
      .style("cursor", "pointer")
      .style("font-size", "11px")
      .style("color", "#dc2626")
      .style("padding", "0")
      .style("line-height", "1")
      .text("×");

    let hoveredNode: D3Node | null = null;
    let hoveredId: string | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    function showButtons(d: D3Node) {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      hoveredNode = d;
      fo
        .attr("width", BTN_W)
        .attr("x", d.y + BTN_OFFSET_X)
        .attr("y", d.x + BTN_OFFSET_Y)
        .style("display", null);
    }

    function scheduleHide() {
      hideTimer = setTimeout(() => {
        fo.style("display", "none");
        hoveredNode = null;
      }, 150);
    }

    fo.on("mouseenter", () => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    }).on("mouseleave", scheduleHide);

    deleteBtn.on("click", (event) => {
      event.stopPropagation();
      if (!hoveredNode) return;
      console.log("delete node:", hoveredNode.data.lemma);
      fo.style("display", "none");
      hoveredNode = null;
      hoveredId = null;
    });

    // ── update ────────────────────────────────────────────────────────────
    function update(source: D3Node) {
      treeLayout(root as d3.HierarchyNode<TreeNode>);
      const nodes = (root as d3.HierarchyNode<TreeNode>).descendants() as D3Node[];
      const links = (root as d3.HierarchyNode<TreeNode>).links();

      nodes.forEach((d) => { d.y = d.depth * STYLE.depthSpacing; });

      svg
        .attr("width",  container.clientWidth)
        .attr("height", container.clientHeight);

      // 링크
      const link = linkGroup
        .selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>("path.link")
        .data(links, (d) => (d.target as D3Node).id as unknown as string);

      const linkEnter = link.enter().append("path")
        .attr("class", "link")
        .attr("stroke", STYLE.linkColor)
        .attr("stroke-width", STYLE.linkWidth)
        .attr("d", () => {
          const o = { x: source.x0 ?? 0, y: source.y0 ?? 0 };
          return diagonal(o, o);
        });

      link.merge(linkEnter).transition().duration(STYLE.duration)
        .attr("d", (d) =>
          diagonal(
            { x: (d.source as D3Node).x ?? 0, y: (d.source as D3Node).y ?? 0 },
            { x: (d.target as D3Node).x ?? 0, y: (d.target as D3Node).y ?? 0 }
          )
        );

      link.exit().transition().duration(STYLE.duration)
        .attr("d", () => {
          const o = { x: source.x ?? 0, y: source.y ?? 0 };
          return diagonal(o, o);
        })
        .remove();

      // 노드
      const node = nodeGroup
        .selectAll<SVGGElement, D3Node>("g.node")
        .data(nodes, (d) => {
          if (!d.id) d.id = ++uid as unknown as string;
          return d.id as unknown as string;
        });

      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", `translate(${source.y0 ?? 0},${source.x0 ?? 0})`)
        .style("cursor", "pointer");

      nodeEnter.append("circle")
        .attr("r", STYLE.circleRInner)
        .attr("fill", (d) => isInternal(d) ? STYLE.circleColorInternal : STYLE.circleColorLeaf);

      nodeEnter.append("text")
        .attr("dy", "0.32em")
        .attr("x", (d) => (isInternal(d) ? -6 : 6))
        .attr("text-anchor", (d) => (isInternal(d) ? "end" : "start"))
        .style("font-family", STYLE.font)
        .style("font-size", STYLE.fontSize)
        .attr("stroke", STYLE.textHaloColor)
        .attr("stroke-width", STYLE.textHaloWidth)
        .attr("paint-order", "stroke")
        .attr("fill", STYLE.textColor)
        .text((d) => d.data.lemma);

      const nodeUpdate = node.merge(nodeEnter);

      nodeUpdate.transition().duration(STYLE.duration)
        .attr("transform", (d) => `translate(${d.y ?? 0},${d.x ?? 0})`);

      nodeUpdate.select("circle")
        .attr("fill", (d) => isInternal(d) ? STYLE.circleColorInternal : STYLE.circleColorLeaf);

      nodeUpdate.select("text")
        .attr("x", (d) => (isInternal(d) ? -6 : 6))
        .attr("text-anchor", (d) => (isInternal(d) ? "end" : "start"));

      nodeUpdate.on("click", (_event, d) => {
        fo.style("display", "none");
        hoveredNode = null;
        hoveredId = null;
        setActive(d);
      });

      nodeUpdate
        .on("mouseenter", function (_e, d) {
          d3.select(this).select("circle").attr("r", STYLE.circleRHover);
          hoveredId = d.id as unknown as string;
          showButtons(d);

          const activeIds = getActivePath(activeNodeRef.current);
          const allNodes  = nodeGroup.selectAll<SVGGElement, D3Node>("g.node");
          const allLinks  = linkGroup.selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>("path.link");
          applyOpacity(allNodes, allLinks, activeIds, hoveredId);
        })
        .on("mouseleave", function () {
          d3.select(this).select("circle").attr("r", STYLE.circleRInner);
          hoveredId = null;
          scheduleHide();

          const activeIds = getActivePath(activeNodeRef.current);
          const allNodes  = nodeGroup.selectAll<SVGGElement, D3Node>("g.node");
          const allLinks  = linkGroup.selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>("path.link");
          applyOpacity(allNodes, allLinks, activeIds, null);
        });

      node.exit().transition().duration(STYLE.duration)
        .attr("transform", `translate(${source.y ?? 0},${source.x ?? 0})`)
        .style("opacity", 0)
        .remove();

      nodeGroup.node()?.appendChild(fo.node()!);

      const activeIds = getActivePath(activeNodeRef.current);
      const allNodes  = nodeGroup.selectAll<SVGGElement, D3Node>("g.node");
      const allLinks  = linkGroup.selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>("path.link");
      applyOpacity(allNodes, allLinks, activeIds, hoveredId);

      nodes.forEach((d) => { d.x0 = d.x; d.y0 = d.y; });
    }

    updateRef.current = update;

    update(root);

    const ro = new ResizeObserver(() => {
      svg
        .attr("width",  container.clientWidth)
        .attr("height", container.clientHeight);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [setActive]);

  useEffect(() => {
    if (updateRef.current) {
      updateRef.current(activeNodeRef.current ?? ({} as D3Node));
    }
  }, [activeNode]);

  return (
    <div className="relative w-auto h-auto p-5">
      <div
        ref={containerRef}
        className="relative bg-[#e7e9e8] rounded-3xl shadow-inner drop-shadow-sm"
        style={{
          width: "100%",
          height: "200px",
          overflow: "hidden",
          cursor: "grab",
        }}
      >
        <svg
          ref={svgRef}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}