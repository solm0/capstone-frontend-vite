import { useEffect, useMemo, useState } from "react";

const CARD_COUNT = 6;
const CARD_SIZE = { w: 420, h: 270 };
const SPREAD_RATIO = 0.52;
const ROTATE_RANGE = 18;
const TILT_RANGE = 14;

type CardPose = {
  x: number;
  y: number;
  rotZ: number;
  rotX: number;
  rotY: number;
};

export default function LemmaHints({
  data, lemma
}: {
  data: string[];
  lemma: string;
}) {
  const [poses, setPoses] = useState<CardPose[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const cards = useMemo(() => data.slice(0, CARD_COUNT), [data]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const spreadX = Math.max(120, width * SPREAD_RATIO);
    const spreadY = Math.max(100, height * (SPREAD_RATIO * 0.6));

    const next = cards.map((_, i) => {
      const seed = (i + 1) * 997;
      const rand = (n: number) => ((Math.sin(seed * n) + 1) / 2);
      return {
        x: (rand(1.3) - 0.5) * spreadX,
        y: (rand(2.1) - 0.5) * spreadY,
        rotZ: (rand(3.7) - 0.5) * ROTATE_RANGE,
        rotX: (rand(4.2) - 0.5) * TILT_RANGE,
        rotY: (rand(5.1) - 0.5) * TILT_RANGE,
      };
    });

    setPoses(next);
    setActiveIdx(null);
  }, [lemma, cards.length]);

  return (
    <div className="relative w-full h-[70vh] flex items-center justify-center">
      <style>
        {`
          .hint-card {
            position: absolute;
            width: ${CARD_SIZE.w}px;
            height: ${CARD_SIZE.h}px;
            transform-style: preserve-3d;
            transition: transform 420ms ease, box-shadow 320ms ease, filter 320ms ease;
            cursor: pointer;
          }
          .hint-card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            transition: transform 480ms ease;
          }
          .hint-card-face {
            position: absolute;
            inset: 0;
            border-radius: 12px;
            backface-visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .hint-card-back {
            transform: rotateY(180deg);
          }
        `}
      </style>

      {cards.map((hint, i) => {
        const pose = poses[i] ?? { x: 0, y: 0, rotZ: 0, rotX: 0, rotY: 0 };
        const isActive = activeIdx === i;
        const hoverTilt = isActive ? 0 : 12;

        return (
          <div
            key={i}
            className="hint-card"
            style={{
              transform: `translate(${pose.x}px, ${pose.y}px) rotateZ(${pose.rotZ}deg) rotateX(${pose.rotX}deg) rotateY(${pose.rotY}deg)`,
              zIndex: isActive ? 3 : 1,
            }}
            onClick={() => setActiveIdx(i)}
          >
            <div
              className="hint-card-inner"
              style={{
                transform: isActive ? "rotateY(180deg)" : `rotateY(0deg) rotateX(${hoverTilt}deg) rotateZ(${hoverTilt}deg)`,
              }}
            >
              <div className="relative hint-card-face hint-card-front bg-neutral-800 text-neutral-700">
                <span className="absolute top-4 left-4 text-5xl">{i+1}</span>              </div>
              <div className="hint-card-face hint-card-back text-xl bg-neutral-300 border border-neutral-300 p-12">
                <span className="absolute top-4 left-4 text-5xl text-neutral-400">{i+1}</span>
                {hint}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
