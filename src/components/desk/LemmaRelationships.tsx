import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import RawToken from "./RawToken";

// ── 컨트롤 가능한 상수 ───────────────────────────────────────────────────────
const CANVAS_HEIGHT = 700;
const AXIS_LENGTH_X = 300;
const AXIS_LENGTH_Y = 600;
const AXIS_LENGTH_Z = 400;
const ORIGIN_OFFSET_Y = 80;
const AXIS_STROKE = "#a3a3a3";
const AXIS_WIDTH = 1;
const AXIS_OPACITY = 0.7;

const MOUSE_ROTATION = -0.3; // radians at edge
const PERSPECTIVE = 480;

const WORD_RADIUS_MIN = 150;
const WORD_RADIUS_MAX = 300;
const WORD_Z_RANGE = 60;
const ANTONYM_RADIUS_BOOST = 50;

const PARALLAX_AXIS = 0.05;
const PARALLAX_TEXT = 0.2;
const SMOOTHING = 0.03;

// ── 타입 ─────────────────────────────────────────────────────────────────────
type Pos = { x: number; y: number };
type Point3 = { x: number; y: number; z: number; word: string; isAntonym?: boolean };

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function project3D(point: Pos & { z: number }, rotX: number, rotY: number) {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  const x1 = point.x * cosY + point.z * sinY;
  const z1 = -point.x * sinY + point.z * cosY;
  const y2 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;

  const scale = PERSPECTIVE / (PERSPECTIVE + z2);
  return { x: x1 * scale, y: y2 * scale, scale };
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function LemmaRelationships({
  data,
  onSelect,
  lemma,
  scrollOffset = 0,
  lemmaAnchor,
}: {
  data: { related_words: string[]; antonyms: string[] };
  onSelect: (tokenKey: string) => void;
  lemma: string;
  scrollOffset?: number;
  lemmaAnchor?: { x: number; y: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerPos, setCenterPos] = useState<Pos>({ x: 0, y: 0 });
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0.5, y: 0.5 });
  const [smoothScroll, setSmoothScroll] = useState(0);
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetScrollRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const related_words = data.related_words ?? [];
  const antonyms = data.antonyms ?? [];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      const W = container.clientWidth || 600;
      const H = container.clientHeight || CANVAS_HEIGHT;
      if (!lemmaAnchor) {
        setCenterPos({ x: W / 2, y: H / 2 + ORIGIN_OFFSET_Y });
        return;
      }
      const rect = container.getBoundingClientRect();
      const targetX = lemmaAnchor.x * window.innerWidth;
      const targetY = lemmaAnchor.y * window.innerHeight;
      setCenterPos({
        x: targetX - rect.left,
        y: targetY - rect.top + ORIGIN_OFFSET_Y,
      });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [lemmaAnchor, scrollOffset]);

  const points = useMemo<Point3[]>(() => {
    const makePoint = (word: string, idx: number, isAntonym?: boolean) => {
      const seed = hashString(`${word}-${idx}`);
      const seed2 = hashString(`${word}-${idx}-z`);
      const seed3 = hashString(`${word}-${idx}-r`);
      const angle = (seed % 360) * (Math.PI / 180);
      const radius = lerp(WORD_RADIUS_MIN, WORD_RADIUS_MAX, (seed3 % 100) / 100);
      const z = lerp(-WORD_Z_RANGE, WORD_Z_RANGE, (seed2 % 100) / 100);
      const boosted = isAntonym ? radius + ANTONYM_RADIUS_BOOST : radius;
      return {
        word,
        x: Math.cos(angle) * boosted,
        y: Math.sin(angle) * boosted * 0.5,
        z,
        isAntonym,
      };
    };

    const syn = related_words.map((word, i) => makePoint(word, i));
    const ants = antonyms.map((word, i) => makePoint(word, i, true));
    return [...syn, ...ants];
  }, [related_words.join(","), antonyms.join(",")]);

  const projectedPoints = useMemo(() => {
    const rotY = (smoothMouse.x - 0.5) * MOUSE_ROTATION;
    const rotX = (0.5 - smoothMouse.y) * MOUSE_ROTATION;
    return points.map((p) => {
      const proj = project3D({ x: p.x, y: p.y, z: p.z }, rotX, rotY);
      return {
        ...p,
        x2d: proj.x + centerPos.x,
        y2d: proj.y + centerPos.y,
        scale: proj.scale,
      };
    });
  }, [points, smoothMouse, centerPos]);

  const axisLines = useMemo(() => {
    const rotY = (smoothMouse.x + 1.5) * MOUSE_ROTATION;
    const rotX = (-0.3 - smoothMouse.y) * MOUSE_ROTATION;
    const axes = [
      { x: AXIS_LENGTH_X * 500, y: 0, z: 0, label: "x+" },
      { x: -AXIS_LENGTH_X, y: 0, z: 0, label: "x-" },
      { x: 0, y: -AXIS_LENGTH_Y, z: 0, label: "y+" },
      { x: 0, y: AXIS_LENGTH_Y, z: 0, label: "y-" },
      { x: 0, y: 0, z: AXIS_LENGTH_Z * 10, label: "z+" },
      { x: 0, y: 0, z: -AXIS_LENGTH_Z, label: "z-" },
    ];
    return axes.map((axis) => {
      const proj = project3D({ x: axis.x, y: axis.y, z: axis.z }, rotX, rotY);
      return {
        label: axis.label,
        x1: centerPos.x,
        y1: centerPos.y,
        x2: proj.x + centerPos.x,
        y2: proj.y + centerPos.y,
      };
    });
  }, [smoothMouse, centerPos]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    const next = {
      x: Math.max(0, Math.min(1, nx)),
      y: Math.max(0, Math.min(1, ny)),
    };
    setMouse(next);
    targetMouseRef.current = next;
  };

  useEffect(() => {
    targetScrollRef.current = scrollOffset;
  }, [scrollOffset]);

  useEffect(() => {
    const tick = () => {
      setSmoothMouse((prev) => ({
        x: prev.x + (targetMouseRef.current.x - prev.x) * SMOOTHING,
        y: prev.y + (targetMouseRef.current.y - prev.y) * SMOOTHING,
      }));
      setSmoothScroll((prev) => prev + (targetScrollRef.current - prev) * SMOOTHING);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const axisParallax = -smoothScroll * PARALLAX_AXIS;
  const textParallax = -smoothScroll * PARALLAX_TEXT;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: "relative",
        width: "100%",
        height: innerHeight,
        overflow: "hidden",
      }}
    >
      {/* axis layer */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          transform: `translateY(${axisParallax}px) translateX(-130px)`,
        }}
      >
        {axisLines.map((axis) => (
          <line
            key={axis.label}
            x1={axis.x1}
            y1={axis.y1}
            x2={axis.x2}
            y2={axis.y2}
            stroke={AXIS_STROKE}
            strokeWidth={AXIS_WIDTH}
            strokeLinecap="round"
            opacity={AXIS_OPACITY}
          />
        ))}
      </svg>

      {/* text layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${textParallax - 90}px)`,
        }}
      >
        {!lemmaAnchor && (
          <NodeOverlay x={centerPos.x} y={centerPos.y}>
            <RawToken
              token={{ lemma: lemma.split("_")[0], pos: lemma.split("_")[1], surface: lemma.split("_")[0] }}
              onSelect={onSelect}
              stress
            />
          </NodeOverlay>
        )}

        {projectedPoints.map((pos) => (
          <NodeOverlay key={pos.word} x={pos.x2d} y={pos.y2d} scale={pos.scale}>
            <span className={pos.isAntonym ? "opacity-60" : ""}>
              <RawToken
                token={{
                  lemma: pos.word.split("_")[0],
                  pos: pos.word.split("_")[1],
                  surface: pos.word.split("_")[0],
                }}
                onSelect={onSelect}
              />
            </span>
          </NodeOverlay>
        ))}
      </div>
    </div>
  );
}

// ── 노드 absolute 포지셔닝 래퍼 ──────────────────────────────────────────────
function NodeOverlay({
  x,
  y,
  scale = 1,
  children,
}: {
  x: number;
  y: number;
  scale?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        pointerEvents: "auto",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}
