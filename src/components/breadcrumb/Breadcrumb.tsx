"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

// ── 스타일 변수 ──────────────────────────────────────────────────────────────
const STYLE = {
  font:                "'xtypewriter', monospace",
  fontSize:            "15px",

  circleRInner:        3,
  circleRHover:        4.5,
  circleColorInternal: "#555",
  circleColorLeaf:     "#E5FF00",

  textColor:           "#44403c",
  textHaloColor:       "#e7e5e4",
  textHaloWidth:       3,

  linkColor:           "#d6d3cd",
  linkWidth:           1,

  duration:            280,
  depthSpacing:        160,
};

const MARGIN = { top: 32, right: 120, bottom: 32, left: 100 };

// ── 데이터 ───────────────────────────────────────────────────────────────────
interface TreeNode {
  lemma: string;
  children?: TreeNode[];
}

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

type D3Node = d3.HierarchyPointNode<TreeNode> & {
  x0?: number;
  y0?: number;
  _children?: D3Node["children"];
};

function onNodeAction(d: D3Node) {
  console.log("action on node:", d.data.lemma);
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function Breadcrumb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el        = svgRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const svg       = d3.select(el);
    svg.selectAll("*").remove();

    const g         = svg.append("g");
    const linkGroup = g.append("g").attr("fill", "none");
    const nodeGroup = g.append("g");

    // nodeSize 기반 레이아웃: 각 노드에 고정 간격 부여
    const treeLayout = d3.tree<TreeNode>().nodeSize([22, STYLE.depthSpacing]);

    const root = d3.hierarchy(data) as D3Node;
    root.x0 = 0;
    root.y0 = 0;

    function collapse(d: D3Node) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = undefined;
      }
    }
    root.children?.forEach(collapse);

    let uid = 0;

    function diagonal(s: { x: number; y: number }, t: { x: number; y: number }) {
      return `M ${s.y} ${s.x}
              C ${(s.y + t.y) / 2} ${s.x},
                ${(s.y + t.y) / 2} ${t.x},
                ${t.y} ${t.x}`;
    }

    function isInternal(d: D3Node) {
      return !!(d.children || d._children);
    }

    // ── hover 버튼 ────────────────────────────────────────────────────────
    const BTN_W = 20, BTN_H = 20, BTN_GAP = 4;
    const BTN_OFFSET_X = -30;
    const BTN_OFFSET_Y = -30;

    const fo = nodeGroup.append("foreignObject")
      .attr("width", BTN_W * 2 + BTN_GAP)
      .attr("height", BTN_H)
      .attr("x", 0).attr("y", 0)
      .style("display", "none")
      .style("pointer-events", "all");

    const foDiv = fo.append("xhtml:div")
      .style("display", "flex")
      .style("gap", `${BTN_GAP}px`);

    const actionBtn = foDiv.append("xhtml:button")
      .style("width",  `${BTN_W}px`)
      .style("height", `${BTN_H}px`)
      .style("border", "1px solid #d6d3cd")
      .style("border-radius", "4px")
      .style("background", "#fafaf9")
      .style("cursor", "pointer")
      .style("font-size", "11px")
      .style("color", "#44403c")
      .style("padding", "0")
      .style("line-height", "1")
      .text("★");

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
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    function showButtons(d: D3Node) {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      hoveredNode = d;
      const hasAction = isInternal(d);
      actionBtn.style("display", hasAction ? "block" : "none");
      fo
        .attr("width", hasAction ? BTN_W * 2 + BTN_GAP : BTN_W)
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

    actionBtn.on("click", (event) => {
      event.stopPropagation();
      if (!hoveredNode) return;
      onNodeAction(hoveredNode);
      fo.style("display", "none");
      hoveredNode = null;
    });

    deleteBtn.on("click", (event) => {
      event.stopPropagation();
      if (!hoveredNode) return;
      console.log("delete node:", hoveredNode.data.lemma);
      fo.style("display", "none");
      hoveredNode = null;
    });

    // ── update ────────────────────────────────────────────────────────────
    function update(source: D3Node) {
      treeLayout(root as d3.HierarchyNode<TreeNode>);
      const nodes = (root as d3.HierarchyNode<TreeNode>).descendants() as D3Node[];
      const links = (root as d3.HierarchyNode<TreeNode>).links();

      nodes.forEach((d) => { d.y = d.depth * STYLE.depthSpacing; });

      // 노드 전체 bounding box 계산
      const xs = nodes.map((d) => d.x ?? 0);
      const ys = nodes.map((d) => d.y ?? 0);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      // g 오프셋: minX가 음수면 위쪽 노드가 잘리므로 보정
      const offsetX = MARGIN.left;
      const offsetY = MARGIN.top - minX;
      g.attr("transform", `translate(${offsetX},${offsetY})`);

      // SVG를 콘텐츠 크기에 맞게 확장 (컨테이너보다 작아지지 않도록)
      const contentW = maxY + offsetX + MARGIN.right;
      const contentH = (maxX - minX) + MARGIN.top + MARGIN.bottom;
      svg
        .attr("width",  Math.max(container.clientWidth,  contentW))
        .attr("height", Math.max(container.clientHeight, contentH));

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
        if (d.children) {
          d._children = d.children;
          d.children  = undefined;
        } else if (d._children) {
          d.children  = d._children;
          d._children = undefined;
        }
        fo.style("display", "none");
        hoveredNode = null;
        update(d);
      });

      nodeUpdate
        .on("mouseenter", function (_e, d) {
          d3.select(this).select("circle").attr("r", STYLE.circleRHover);
          showButtons(d);
        })
        .on("mouseleave", function () {
          d3.select(this).select("circle").attr("r", STYLE.circleRInner);
          scheduleHide();
        });

      node.exit().transition().duration(STYLE.duration)
        .attr("transform", `translate(${source.y ?? 0},${source.x ?? 0})`)
        .style("opacity", 0)
        .remove();

      nodeGroup.node()?.appendChild(fo.node()!);
      nodes.forEach((d) => { d.x0 = d.x; d.y0 = d.y; });
    }

    update(root);

    const ro = new ResizeObserver(() => update(root));
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-scroll custom-scrollbar"
      style={{
        width: "100%",
        height: "300px",
        overflow: "scroll",
      }}
    >
      <svg ref={svgRef} style={{ display: "block" }} />
    </div>
  );
}