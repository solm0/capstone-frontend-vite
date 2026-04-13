import { useEffect, useMemo, useRef, useState } from "react";
import type { LemmaExpansion } from "../../types";
import LemmaRelationships from "./LemmaRelationships";
import LemmaKwic from "./LemmaKwic";
import LemmaHints from "./LemmaHints";
import { fetchCloze } from "../../api";

const SECTION_GAP = 160;
const PROGRESS_WIDTH = 5;
const PROGRESS_HEIGHT = "70vh";
const PROGRESS_SEG_GAP = 10;

const LEMMA_POSITIONS = [
  { x: 0.5, y: 0.58 },  // relationships: slightly left
  { x: 0.5, y: 0.26 },  // kwic: upper center
  { x: 0.5, y: 0.26 },  // hints: upper center (slightly lower)
];

export default function LemmaExpansion({
  data, onSelect, isBCExpaned, taskOpen, setTaskOpen
}: {
  data: LemmaExpansion;
  onSelect: (tokenKey: string) => void;
  isBCExpaned: boolean;
  taskOpen: boolean
  setTaskOpen: (arg: {taskOpen: boolean; lemma: string | null; pos: string | null}) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const sectionTopsRef = useRef<number[]>([0, 0, 0]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMetrics = () => {
      setContainerHeight(container.clientHeight);
      sectionTopsRef.current = sectionRefs.map((ref) => ref.current?.offsetTop ?? 0);
    };

    updateMetrics();
    const ro = new ResizeObserver(updateMetrics);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!data?.lemma || !data?.pos) return;
    fetchCloze(data.lemma, data.pos).catch(() => {});
  }, [data?.lemma, data?.pos]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const progressBySection = useMemo(() => {
    const tops = sectionTopsRef.current;
    const nextTops = [...tops.slice(1), (containerRef.current?.scrollHeight ?? 0)];
    const maxScroll = Math.max(0, (containerRef.current?.scrollHeight ?? 0) - containerHeight);
    return tops.map((top, i) => {
      const nextTop = nextTops[i] ?? top;
      const end = Math.max(top, nextTop - containerHeight);
      const range = Math.max(1, end - top);
      const raw = (scrollTop - top) / range;
      const clamped = Math.max(0, Math.min(1, raw));
      if (i === tops.length - 1 && scrollTop >= maxScroll - 1) return 1;
      return clamped;
    });
  }, [scrollTop, containerHeight]);

  const getSectionVisibility = (index: number) => {
    const top = sectionTopsRef.current[index] ?? 0;
    const sectionEl = sectionRefs[index].current;
    const height = sectionEl?.offsetHeight ?? 1;
    const viewTop = scrollTop;
    const viewBottom = scrollTop + containerHeight;
    const sectionBottom = top + height;
    const overlap = Math.max(0, Math.min(viewBottom, sectionBottom) - Math.max(viewTop, top));
    const ratio = overlap / height;
    return Math.max(0, Math.min(1, ratio / 0.5));
  };

  const lemmaPosition = useMemo(() => {
    const tops = sectionTopsRef.current;
    const seg1End = tops[1] ?? 0;
    const seg2End = tops[2] ?? seg1End;

    if (scrollTop <= seg1End) {
      const t = seg1End === 0 ? 0 : Math.max(0, Math.min(1, scrollTop / seg1End));
      return {
        x: LEMMA_POSITIONS[0].x + (LEMMA_POSITIONS[1].x - LEMMA_POSITIONS[0].x) * t,
        y: LEMMA_POSITIONS[0].y + (LEMMA_POSITIONS[1].y - LEMMA_POSITIONS[0].y) * t,
      };
    }

    const t = seg2End === seg1End ? 0 : Math.max(0, Math.min(1, (scrollTop - seg1End) / (seg2End - seg1End)));
    return {
      x: LEMMA_POSITIONS[1].x + (LEMMA_POSITIONS[2].x - LEMMA_POSITIONS[1].x) * t,
      y: LEMMA_POSITIONS[1].y + (LEMMA_POSITIONS[2].y - LEMMA_POSITIONS[1].y) * t,
    };
  }, [scrollTop]);

  const lemmaKey = `${data.lemma}_${data.pos}`;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-y-auto">
      {/* progress bar */}
      <div
        className="fixed left-5 top-0 flex flex-col items-center mt-6"
        style={{ height: PROGRESS_HEIGHT, gap: PROGRESS_SEG_GAP, top: isBCExpaned ? '600px' : '200px' }}
      >
        {progressBySection.map((p, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-full bg-neutral-300"
            style={{
              width: PROGRESS_WIDTH,
              height: `calc((100% - ${PROGRESS_SEG_GAP * 2}px - ${isBCExpaned ? '400px' : '0px'}) / 3)`,
            }}
          >
            <div
              className="absolute top-0 left-0 w-full bg-neutral-400"
              style={{ height: `${Math.round(p * 100)}%` }}
            />
          </div>
        ))}
      </div>

      {/* floating lemma */}
      <div
        className={`fixed font-tb z-20 text-2xl ${(isBCExpaned || taskOpen) ? 'hidden' : 'block'}`}
        style={{
          left: `${lemmaPosition.x * 100}%`,
          top: `${lemmaPosition.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {data.lemma}
      </div>

      <div className="flex flex-col" style={{ gap: SECTION_GAP, paddingBottom: SECTION_GAP }}>
        {data.expansions[0].content.related_words.length > 0 &&
          <section ref={sectionRefs[0]} className="min-h-[75vh] flex items-center border-b border-neutral-300">
            <LemmaRelationships
              data={data.expansions[0].content}
              onSelect={onSelect}
              lemma={lemmaKey}
              scrollOffset={scrollTop}
              lemmaAnchor={lemmaPosition}
              visibility={getSectionVisibility(0)}
            />
          </section>
        }

        {data.expansions[0].content.related_words.length > 0 ?
          <section ref={sectionRefs[1]} className="min-h-[75vh] flex items-start pt-20">
            <LemmaKwic data={data.expansions[1].content} onSelect={onSelect} lemma={lemmaKey} />
          </section>
          :
          <div className="h-40" />
        }

        <section ref={sectionRefs[2]} className="min-h-[75vh] flex items-start pt-20 pb-24">
          <LemmaHints data={data.expansions[2].content} lemma={lemmaKey} />
        </section>
      </div>

      {/* task open button */}
      <div className="fixed bottom-8 right-8">
        <button onClick={() => setTaskOpen({taskOpen: true, lemma: data.lemma, pos: data.pos})} className="font-tt hover:font-tb">
          I know what {data.lemma} means
        </button>
      </div>
    </div>
  );
}
