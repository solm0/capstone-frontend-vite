import { useEffect, useRef, useCallback } from "react";
import RawToken from "./RawToken";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed: boolean;
  restX: number; // equilibrium position
  restY: number;
  el: HTMLDivElement | null;
}

const DAMPING = 0.85;
// restore spring pulls each token back toward its equilibrium position
const RESTORE_K = 0.015;

export default function Line({ line }: { line: string }) {
  const tokens = line.trim().split(/\s+/);
  const n = tokens.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tokenRefs = useRef<(HTMLDivElement | null)[]>(Array(n).fill(null));

  const nodes = useRef<Node[]>([]);
  const raf = useRef<number>(0);
  const drag = useRef<{ idx: number; ox: number; oy: number } | null>(null);
  const prevPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const stiffness = 0.5;
  const stiffnessRef = useRef(stiffness);
  useEffect(() => { stiffnessRef.current = stiffness; }, [stiffness]);

  // ── init ─────────────────────────────────────────────────────────────────
  const init = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const els = tokenRefs.current as HTMLDivElement[];
    if (els.some((e) => !e)) return;

    const W = line.length * 15 + tokens.length/line.length *100;
    const CY = container.clientHeight / 2;
    const widths = els.map((el) => el.offsetWidth);
    const totalW = widths.reduce((a, b) => a + b, 0);
    const gap = (W - totalW) / (n + 1);

    // nodes: [leftAnchor, token0…tokenN-1, rightAnchor]
    const ns: Node[] = [];
    ns.push({ x: 0, y: CY, vx: 0, vy: 0, fixed: true, restX: 0, restY: CY, el: null });

    let cx = gap;
    for (let i = 0; i < n; i++) {
      const rx = cx + widths[i] / 2;
      ns.push({ x: rx, y: CY, vx: 0, vy: 0, fixed: false, restX: rx, restY: CY, el: els[i] });
      cx += widths[i] + gap;
    }
    ns.push({ x: W, y: CY, vx: 0, vy: 0, fixed: true, restX: W, restY: CY, el: null });

    nodes.current = ns;
    syncDOM();
  }, [n]);

  // ── sync → DOM + SVG ────────────────────────────────────────────────────
  const syncDOM = useCallback(() => {
    const ns = nodes.current;
    if (!ns.length) return;
    const svg = svgRef.current;

    // move token divs
    for (let i = 1; i <= n; i++) {
      const nd = ns[i];
      const el = nd.el;
      if (!el) continue;
      el.style.left = `${nd.x - el.offsetWidth / 2}px`;
      el.style.top  = `${nd.y - el.offsetHeight / 2}px`;
    }

    if (!svg) return;
    const lines = svg.querySelectorAll<SVGLineElement>("line[data-rope]");
    const dots  = svg.querySelectorAll<SVGCircleElement>("circle[data-conn]");

    // rope segments: anchor→token edge, token edge→next token edge, …, token edge→anchor
    lines.forEach((lineEl, i) => {
      const a = ns[i];
      const b = ns[i + 1];
      const x1 = a.el ? a.x + a.el.offsetWidth / 2 : a.x;
      const y1 = a.y;
      const x2 = b.el ? b.x - b.el.offsetWidth / 2 : b.x;
      const y2 = b.y;
      lineEl.setAttribute("x1", String(x1));
      lineEl.setAttribute("y1", String(y1));
      lineEl.setAttribute("x2", String(x2));
      lineEl.setAttribute("y2", String(y2));
    });

    // connection dots: left & right edge of each token
    dots.forEach((dot, i) => {
      const tokenIdx = Math.floor(i / 2) + 1; // node index
      const nd = ns[tokenIdx];
      const el = nd?.el;
      if (!el) return;
      const side = i % 2 === 0 ? -1 : 1; // even=left, odd=right
      dot.setAttribute("cx", String(nd.x + side * el.offsetWidth / 2));
      dot.setAttribute("cy", String(nd.y));
    });
  }, [n]);

  // ── physics tick ─────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const ns = nodes.current;
    const k  = stiffnessRef.current;

    // 1) chain springs (keep tokens connected)
    for (let i = 0; i < ns.length - 1; i++) {
      const a = ns[i];
      const b = ns[i + 1];
      const dx   = b.x - a.x;
      const dy   = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;

      // rest length = gap between edges
      const aHalf = a.el ? a.el.offsetWidth / 2 : 0;
      const bHalf = b.el ? b.el.offsetWidth / 2 : 0;
      const edgeDist = dist - aHalf - bHalf;

      // only push/pull if the chain is stretched or compressed
      const stretch = edgeDist; // restLen = 0 → attract to zero gap
      const fx = (dx / dist) * stretch * k;
      const fy = (dy / dist) * stretch * k;

      if (!a.fixed) { a.vx += fx; a.vy += fy; }
      if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
    }

    // 2) restore spring: pull each token toward its equilibrium (x, y)
    for (let i = 1; i <= n; i++) {
      const nd = ns[i];
      if (nd.fixed) continue;
      nd.vx += (nd.restX - nd.x) * RESTORE_K;
      nd.vy += (nd.restY - nd.y) * RESTORE_K;
    }

    // 3) integrate + damp
    for (const nd of ns) {
      if (nd.fixed) continue;
      nd.vx *= DAMPING;
      nd.vy *= DAMPING;
      nd.x  += nd.vx;
      nd.y  += nd.vy;
    }

    syncDOM();
    raf.current = requestAnimationFrame(tick);
  }, [syncDOM]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      init();
      raf.current = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(raf.current);
    };
  }, [init, tick]);

  // ── drag ─────────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, i: number) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const nd = nodes.current[i + 1];
    drag.current = { idx: i + 1, ox: e.clientX - nd.x, oy: e.clientY - nd.y };
    prevPos.current = { x: nd.x, y: nd.y };
    nd.vx = 0; nd.vy = 0; nd.fixed = true;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!drag.current) return;
    const nd = nodes.current[drag.current.idx];
    prevPos.current = { x: nd.x, y: nd.y };
    nd.x = e.clientX - drag.current.ox;
    nd.y = e.clientY - drag.current.oy;
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    const nd = nodes.current[drag.current.idx];
    nd.vx = nd.x - prevPos.current.x; // release velocity
    nd.vy = nd.y - prevPos.current.y;
    nd.fixed = false;
    drag.current = null;
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col gap-3 select-none h-auto">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: 80 }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        >
          {/* rope segments */}
          {Array.from({ length: n + 1 }).map((_, i) => (
            <line
              key={i}
              data-rope
              strokeWidth="1.5"
              strokeLinecap="square"
              className="stroke-stone-300 opacity-80"
            />
          ))}
          {/* edge dots on each token */}
          {/* {Array.from({ length: n * 2 }).map((_, i) => (
            <circle key={i} data-conn r="3" className="fill-stone-200" />
          ))} */}
          {/* fixed anchor dots */}
          <circle cx="0"    cy="50%" r="3" className="fill-[#555]" />
          {/* <circle cx="100%" cy="50%" r="5" className="fill-stone-500" /> */}
        </svg>

        {tokens.map((token, i) => (
          <div
            key={i}
            ref={(el) => { tokenRefs.current[i] = el; }}
            className="absolute text-base whitespace-nowrap cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => onPointerDown(e, i)}
          >
            <RawToken rawToken={token} />
          </div>
        ))}
      </div>
      
    </div>
  );
}