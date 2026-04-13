import { useState } from "react";
import RawToken from "./RawToken";

function highlightIntersect(surface: string, lemma: string) {
  let j = 0;
  const l = lemma.toLowerCase();

  return [...surface].map((ch, i) => {
    while (j < l.length && l[j] !== ch.toLowerCase()) j++;

    if (j < l.length) {
      j++;
      return <span key={i} className="overflow-visible bg-neutral-300 h-full flex items-center z-10">{ch}</span>;
    }

    return <span key={i} className="z-10">{ch}</span>;
  });
}

export default function LemmaKwic({
  data, onSelect, lemma
}: {
  data: { line_id:number, tokens:any[] }[];
  onSelect: (tokenKey: string) => void;
  lemma: string
}) {
  const [hovered, setHovered] = useState<{pos: string | null, dep: string | null}>({pos:null,dep:null})
  
  return (
    <div className="flex flex-col w-full h-auto items-center">

      {data.map((d, i) => {
        const tokens = d.tokens

        // lemma match (첫 번째만 사용)
        const targetIdx = tokens.findIndex(t => t.lemma === lemma.split('_')[0])

        if (targetIdx === -1) return null

        const left = tokens.slice(0, targetIdx)
        const target = tokens[targetIdx]
        const right = tokens.slice(targetIdx + 1)

        return (
          <div key={i} className={`
            grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center w-full h-10 border-b border-neutral-300
          `}>
            
            {/* LEFT */}
            <div
              className="flex h-full items-center justify-end"
              style={{
                WebkitMaskImage: "linear-gradient(to right, transparent, black 24px)",
                maskImage: "linear-gradient(to right, transparent, black 24px)",
              }}
            >
              {left.map((t, j) => (
                <div
                  key={j}
                  className="relative h-full flex items-center px-2"
                  onMouseEnter={() => setHovered({pos: t.pos, dep: t.dep})}
                  onMouseLeave={() => setHovered({pos: null, dep: null})}
                >
                  <div className={`transition-colors opacity-30 mix-blend-multiply absolute top-0 left-0 w-full h-full ${hovered.pos === t.pos ? 'bg-[#E5FF00]': 'bg-transparent'}`}/>
                  <div className={`transition-colors opacity-30 mix-blend-multiply absolute top-0 left-0 w-full h-full ${hovered.dep === t.dep ? 'bg-[#E5FF00]': 'bg-transparent'}`}/>
                  <RawToken token={{lemma: t.lemma, pos: t.pos, surface:t.surface}} onSelect={onSelect} />
                </div>
              ))}
            </div>

            {/* TARGET */}
            <div className="relative h-full flex items-center text-center px-2 text-xl">
              <div className="absolute top-0 left-0 w-full h-full bg-neutral-300 opacity-50" />
              {highlightIntersect(target.surface, lemma.split('_')[0])}
            </div>

            {/* RIGHT */}
            <div
              className="flex h-full items-center justify-start"
              style={{
                WebkitMaskImage: "linear-gradient(to left, transparent, black 24px)",
                maskImage: "linear-gradient(to left, transparent, black 24px)",
              }}
            >
              {right.map((t, j) => (
                <div
                  key={j}
                  className="relative h-full flex items-center px-2"
                  onMouseEnter={() => setHovered({pos: t.pos, dep: t.dep})}
                  onMouseLeave={() => setHovered({pos: null, dep: null})}
                >
                  <div className={`transition-colors opacity-30 mix-blend-multiply absolute top-0 left-0 w-full h-full ${hovered.pos === t.pos ? 'bg-[#E5FF00]': 'bg-transparent'}`}/>
                  <div className={`transition-colors opacity-30 mix-blend-multiply absolute top-0 left-0 w-full h-full ${hovered.dep === t.dep ? 'bg-[#E5FF00]': 'bg-transparent'}`}/>
                  <RawToken token={{lemma: t.lemma, pos: t.pos, surface:t.surface}} onSelect={onSelect} />
                </div>
              ))}
            </div>

          </div>
        )
      })}
    </div>
  );
}