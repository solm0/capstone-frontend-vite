import { useRef, useState, useCallback } from "react";
import type { CorpusFragment } from "../../types";
import Line from "./Line";

export default function CorpusFragment({
  data, setActiveId
}: {
  data: CorpusFragment;
  setActiveId: (id: string) => void;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setActiveId('cf')

      e.currentTarget.setPointerCapture(e.pointerId);
      dragging.current = true;
      origin.current = {
        mx: e.clientX,
        my: e.clientY,
        px: pos.x,
        py: pos.y,
      };
    },
    [pos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const nextX = origin.current.px + (e.clientX - origin.current.mx);
      const nextY = origin.current.py + (e.clientY - origin.current.my);
      // 위쪽 경계: y=0 미만으로 못 나가게
      setPos({ x: nextX, y: Math.max(0, nextY) });
    },
    []
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        willChange: "transform",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {/* 본문 */}
      <div
        className="flex flex-col rounded-sm gap-10 w-[600px] bg-[#ffffffde] backdrop-blur-lg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: dragging.current ? "grabbing" : "grab" }}
      >
        {data.lines.map((l, i) => (
          <Line key={i} line={l} />
        ))}
      </div>
    </div>
  );
}