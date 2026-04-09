// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import RawToken from "./RawToken";

// ── 레이아웃 / 애니메이션 변수 ────────────────────────────────────────────────
const ORBIT_RX_RATIO     = 0.24;   // 타원 궤도 가로 반지름 (컨테이너 너비 비율)
const ORBIT_RY_RATIO     = 0.28;   // 타원 궤도 세로 반지름 (컨테이너 높이 비율)
const ANT_OFFSET_X_RATIO = 0.38;   // antonym 가로 거리 (컨테이너 너비 비율)
const ANT_ROW_GAP        = 44;     // antonym 세로 간격 (px)
const BOB_AMP            = 8;      // 위아래 진폭 (px)
const BOB_SPEED          = 0.001; // 위아래 속도
const ORBIT_SPEED        = 0.00006;// 타원 공전 속도
const LINK_CENTER_GAP = 50; // 중심에서 선이 시작하는 거리 (px)
const HULL_ROUND = 0.1; // 0 = 각짐, 1 = 최대 곡률

// ── 타입 ─────────────────────────────────────────────────────────────────────
type Pos = { x: number; y: number };

type SynMeta = { word: string; baseAngle: number; bobPhase: number };
type AntMeta = { word: string; baseX: number; baseY: number; bobPhase: number };

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function LemmaRelationships({
  data,
  onSelect,
  lemma,
}: {
  data: { synonyms: string[]; antonyms: string[] };
  onSelect: (rawToken: string) => void;
  lemma: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const animRef      = useRef<number | null>(null);
  const synMetaRef   = useRef<SynMeta[]>([]);
  const antMetaRef   = useRef<AntMeta[]>([]);

  const [centerPos,    setCenterPos]    = useState<Pos>({ x: 0, y: 0 });
  const [synPositions, setSynPositions] = useState<Pos[]>([]);
  const [antPositions, setAntPositions] = useState<Pos[]>([]);

  const synonyms = data.synonyms ?? [];
  const antonyms = data.antonyms ?? [];

  useEffect(() => {
    const container = containerRef.current!;
    const W  = container.clientWidth  || 600;
    const H  = container.clientHeight || 440;
    const cx = W / 2, cy = H / 2;

    setCenterPos({ x: cx, y: cy });

    // bobPhase 초기화 (lemma/data 바뀔 때만)
    synMetaRef.current = synonyms.map((word, i) => ({
      word,
      baseAngle: (2 * Math.PI * i) / Math.max(synonyms.length, 1),
      bobPhase: Math.random() * Math.PI * 2,
    }));
    antMetaRef.current = antonyms.map((word, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const row  = Math.floor(i / 2);
      return {
        word,
        baseX: cx + side * (W * ANT_OFFSET_X_RATIO),
        baseY: cy - (antonyms.length / 2 - row - 0.5) * ANT_ROW_GAP,
        bobPhase: Math.random() * Math.PI * 2,
      };
    });

    // SVG 초기화
    const svg = d3.select(svgRef.current!);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const hullLayer    = svg.append("g");
    const synLinkLayer = svg.append("g");
    const antLinkLayer = svg.append("g");

    const synLinks = synLinkLayer.selectAll("line")
      .data(synMetaRef.current).enter().append("line")

    const antLinks = antLinkLayer.selectAll("line")
      .data(antMetaRef.current).enter().append("line")
      .attr("stroke", "#585a5c").attr("stroke-width", 1.3)
      .attr("stroke-dasharray", "3 5").attr("opacity", 0.38);

    const hullPath = hullLayer.append("path")
      .attr("fill", "#E5FF0080")

    const orbitRx = W * ORBIT_RX_RATIO;
    const orbitRy = H * ORBIT_RY_RATIO;

    let t0: number | null = null;

    function tick(ts: number) {
      if (t0 === null) t0 = ts;
      const t = ts - t0;

      const sp: [number, number][] = synMetaRef.current.map((d) => {
        const angle = d.baseAngle + t * ORBIT_SPEED;
        const bob   = Math.sin(t * BOB_SPEED + d.bobPhase) * BOB_AMP;
        return [cx + orbitRx * Math.cos(angle), cy + orbitRy * Math.sin(angle) + bob];
      });

      const ap: [number, number][] = antMetaRef.current.map((d) => {
        const bob = Math.sin(t * BOB_SPEED * 0.85 + d.bobPhase) * BOB_AMP;
        return [d.baseX, d.baseY + bob];
      });

      antLinks.each(function (_, i) {
        const [tx, ty] = ap[i];
        const dx = tx - cx, dy = ty - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        d3.select(this)
          .attr("x1", cx + (dx / dist) * LINK_CENTER_GAP)
          .attr("y1", cy + (dy / dist) * LINK_CENTER_GAP)
          .attr("x2", tx - (dx / dist) * LINK_CENTER_GAP)
          .attr("y2", ty - (dy / dist) * LINK_CENTER_GAP);
      });

      if (sp.length >= 3) {
        const hull = d3.polygonHull(sp);
        if (hull) {
          const padded = hull.map(([px, py]) => {
            const dx = px - cx, dy = py - cy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            return [px + (dx / dist) * 20, py + (dy / dist) * 20] as [number, number];
          });

          const n = padded.length;
          const d = padded.map((p, i) => {
            const prev = padded[(i - 1 + n) % n];
            const next = padded[(i + 1) % n];
            // 이웃 꼭짓점 방향으로 당긴 제어점
            const cp1x = p[0] + (next[0] - prev[0]) * HULL_ROUND;
            const cp1y = p[1] + (next[1] - prev[1]) * HULL_ROUND;
            return { p, cp1: [cp1x, cp1y] };
          });

          const path = d.map(({ p, cp1 }, i) => {
            const prev = d[(i - 1 + n) % n];
            // 이전 꼭짓점의 cp1을 반전시켜 cp2로 사용
            const cp2x = p[0] - (d[(i + 1) % n].p[0] - prev.p[0]) * HULL_ROUND;
            const cp2y = p[1] - (d[(i + 1) % n].p[1] - prev.p[1]) * HULL_ROUND;
            return `${i === 0 ? "M" : "C"} ${prev.cp1[0]},${prev.cp1[1]} ${cp2x},${cp2y} ${p[0]},${p[1]}`;
          }).join(" ") + " Z";

          hullPath.attr("d", path);
        }
      } else {
        hullPath.attr("d", "");
      }

      setSynPositions(sp.map(([x, y]) => ({ x, y })));
      setAntPositions(ap.map(([x, y]) => ({ x, y })));

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [lemma, synonyms.join(","), antonyms.join(",")]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "440px",
        overflow: "hidden",
      }}
    >
      {/* SVG: 선 + hull만 (pointer-events: none) */}
      <svg
        ref={svgRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* 중심 lemma */}
      <NodeOverlay x={centerPos.x} y={centerPos.y}>
        <RawToken rawToken={lemma} onSelect={onSelect} />
      </NodeOverlay>

      {/* synonym 노드들 */}
      {synPositions.map((pos, i) => (
        <NodeOverlay key={synonyms[i]} x={pos.x} y={pos.y}>
          <RawToken rawToken={synonyms[i]} onSelect={onSelect} />
        </NodeOverlay>
      ))}

      {/* antonym 노드들 */}
      {antPositions.map((pos, i) => (
        <NodeOverlay key={antonyms[i]} x={pos.x} y={pos.y}>
          <RawToken rawToken={antonyms[i]} onSelect={onSelect} />
        </NodeOverlay>
      ))}
    </div>
  );
}

// ── 노드 absolute 포지셔닝 래퍼 ──────────────────────────────────────────────
function NodeOverlay({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        pointerEvents: "auto",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}