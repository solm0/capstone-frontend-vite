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
const AXIS_OPACITY = 0.5;

const MOUSE_ROTATION = -0.4; // radians at edge
const PERSPECTIVE = 480;

const WORD_RADIUS_MIN = 150;
const WORD_RADIUS_MAX = 300;
const WORD_Z_RANGE = 80;
const ANTONYM_RADIUS_BOOST = 50;

const PARALLAX_AXIS = 0.05;
const PARALLAX_TEXT = 0.1;
const SMOOTHING = 0.01;
const HULL_PADDING = 50;
const HULL_ROUND = 0;
const BOB_AMP = 8;
const BOB_SPEED = 0.0005;

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
  visibility = 1,
}: {
  data: { related_words: string[]; antonyms: string[] };
  onSelect: (tokenKey: string) => void;
  lemma: string;
  scrollOffset?: number;
  lemmaAnchor?: { x: number; y: number };
  visibility?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerPos, setCenterPos] = useState<Pos>({ x: 0, y: 0 });
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0.5, y: 0.5 });
  const [smoothScroll, setSmoothScroll] = useState(0);
  const [time, setTime] = useState(0);
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
      const phase = (hashString(p.word) % 360) * (Math.PI / 180);
      const bob = Math.sin(time * BOB_SPEED + phase) * BOB_AMP;
      const proj = project3D({ x: p.x, y: p.y, z: p.z }, rotX, rotY);
      return {
        ...p,
        x2d: proj.x + centerPos.x,
        y2d: proj.y + centerPos.y + bob,
        scale: proj.scale,
      };
    });
  }, [points, smoothMouse, centerPos, time]);

  const axisLines = useMemo(() => {
    const rotY = (smoothMouse.x + 1.5) * MOUSE_ROTATION;
    const rotX = (-0.3 - smoothMouse.y) * MOUSE_ROTATION;

    const axes = [
      { x: AXIS_LENGTH_X, y: 0, z: 0, label: "x+" },
      { x: -AXIS_LENGTH_X, y: 0, z: 0, label: "x-" },
      { x: 0, y: -AXIS_LENGTH_Y, z: 0, label: "y+" },
      { x: 0, y: AXIS_LENGTH_Y, z: 0, label: "y-" },
      { x: 0, y: 0, z: AXIS_LENGTH_Z, label: "z+" },
      { x: 0, y: 0, z: -AXIS_LENGTH_Z, label: "z-" },
    ];

    const FAR = 1000; // 화면 밖까지 쏘는 길이

    return axes.map((axis) => {
      const proj = project3D({ x: axis.x, y: axis.y, z: axis.z }, rotX, rotY);

      const x1 = centerPos.x;
      const y1 = centerPos.y;

      const x2 = proj.x + centerPos.x;
      const y2 = proj.y + centerPos.y;

      // 🔥 여기 핵심
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;

      const nx = dx / len;
      const ny = dy / len;

      return {
        label: axis.label,
        x1,
        y1,
        x2: x1 + nx * FAR,
        y2: y1 + ny * FAR,
      };
    });
  }, [smoothMouse, centerPos]);

  const convexHull = (pts: { x: number; y: number }[]) => {
    if (pts.length < 3) return [];
    const sorted = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
    const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: { x: number; y: number }[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }
    const upper: { x: number; y: number }[] = [];
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
  };

  const hullPath = useMemo(() => {
    const synPoints = projectedPoints.filter((p) => !p.isAntonym);
    const pts = synPoints.map((p) => ({ x: p.x2d, y: p.y2d }));
    const hull = convexHull(pts);
    if (hull.length < 3) return "";

    const padded = hull.map((p) => {
      const dx = p.x - centerPos.x;
      const dy = p.y - centerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return { x: p.x + (dx / dist) * HULL_PADDING, y: p.y + (dy / dist) * HULL_PADDING };
    });

    const n = padded.length;
    const withCtrl = padded.map((p, i) => {
      const prev = padded[(i - 1 + n) % n];
      const next = padded[(i + 1) % n];
      const cp1x = p.x + (next.x - prev.x) * HULL_ROUND;
      const cp1y = p.y + (next.y - prev.y) * HULL_ROUND;
      return { p, cp1: { x: cp1x, y: cp1y } };
    });

    const path = withCtrl.map(({ p }, i) => {
      const prev = withCtrl[(i - 1 + n) % n];
      const next = withCtrl[(i + 1) % n];
      const cp2x = p.x - (next.p.x - prev.p.x) * HULL_ROUND;
      const cp2y = p.y - (next.p.y - prev.p.y) * HULL_ROUND;
      return `${i === 0 ? "M" : "C"} ${prev.cp1.x},${prev.cp1.y} ${cp2x},${cp2y} ${p.x},${p.y}`;
    });

    return `${path.join(" ")} Z`;
  }, [projectedPoints, centerPos]);

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
      setTime((prev) => prev + 16);
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
        opacity: visibility,
        transition: "opacity 200ms ease",
      }}
    >
      <style>
        {`
          @keyframes floaty {
            0% { transform: translate(-50%, -50%) translateY(0px); }
            50% { transform: translate(-50%, -50%) translateY(-6px); }
            100% { transform: translate(-50%, -50%) translateY(0px); }
          }
          @keyframes cloudPulse {
            0% { opacity: 0.7; }
            50% { opacity: 0.9; }
            100% { opacity: 0.7; }
          }
        `}
      </style>
      {/* axis layer */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
          transform: `translateY(${axisParallax}px)`,
        }}
      >
        <defs>
          <radialGradient id="axisFade" cx="50%" cy="50%" r="200%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="axisMask">
            <rect width="100%" height="100%" fill="url(#axisFade)" />
          </mask>
          <radialGradient id="hullGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#a3a3a3" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#a3a3a3" stopOpacity="0.35" />
          </radialGradient>
          <filter id="hullBlur">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        <g style={{transform: 'translateX(-200px)'}}>
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
        </g>

        {hullPath && (
          <g style={{ animation: "cloudPulse 6s ease-in-out infinite", transform: " translateY(-100px)" }}>
            <path d={hullPath} fill="url(#hullGlow)" filter="url(#hullBlur)" />
          </g>
        )}
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
          <NodeOverlay
            key={pos.word}
            x={pos.x2d}
            y={pos.y2d}
            scale={pos.scale}
            floatDelay={(hashString(pos.word) % 1000) / 1000}
          >
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
  floatDelay = 0,
  children,
}: {
  x: number;
  y: number;
  scale?: number;
  floatDelay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        animation: "floaty 5.5s ease-in-out infinite",
        animationDelay: `${floatDelay * 2.5}s`,
        pointerEvents: "auto",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}
