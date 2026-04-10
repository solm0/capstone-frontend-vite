import { useState, type ReactNode } from "react";
import type { LemmaExpansion } from "../../types";
import LemmaRelationships from "./LemmaRelationships";
import LemmaKwic from "./LemmaKwic";
import LemmaHints from "./LemmaHints";
import AudioCapture from "../AudioCapture";
import Cloze from "../Cloze";

export default function LemmaExpansion({
  data, onSelect
}: {
  data: LemmaExpansion;
  onSelect: (tokenKey: string) => void;
}) {
  // relationships -> kwic -> hints
  const [expansionIdx, setExpansionIdx] = useState<number>(0);

  let component:ReactNode | null;
  if (expansionIdx === 0) component = <LemmaRelationships data={data.expansions[0].content} onSelect={onSelect} lemma={`${data.lemma}_${data.pos}`} />
  else if (expansionIdx === 1) component = <LemmaKwic data={data.expansions[1].content} onSelect={onSelect} lemma={`${data.lemma}_${data.pos}`} />
  else if (expansionIdx === 2) component = <LemmaHints data={data.expansions[2].content} lemma={`${data.lemma}_${data.pos}`} />

  const [taskOpen, setTaskOpen] = useState(false);

  return (
    <>
      {component}

      {/* 태스크 모달 */}
      <div className={`absolute top-0 left-0 w-screen h-screen flex items-center justify-center p-20 pointer-events-none`}>
        <div onClick={() => setTaskOpen(false)} className={`absolute w-full h-full opacity-50 z-0 ${taskOpen ? 'bg-gray-500 pointer-events-auto' : 'bg-transparent pointer-events-none'} transition-colors duration-300`}></div>
        {taskOpen &&
          <div className="top-0 left-0 w-full h-full bg-gray-200 z-10 pointer-events-auto">
            {data.lemma}
            <AudioCapture />
            <Cloze lemma={data.lemma} pos={data.pos} />
          </div>
        }
      </div>
      
      {/* 넘어가기 버튼(임시) */}
      <div className="absolute bottom-20 right-20 flex gap-2">
        <button onClick={() => setTaskOpen(true)} className="font-tt hover:font-tb">I know what {data.lemma} means</button>
        <button className={expansionIdx<=0 ? 'hidden' : 'block'} onClick={() => setExpansionIdx(expansionIdx-1)}>&lt;</button>
        <span>{expansionIdx+1}/3</span>
        <button className={expansionIdx>=2 ? 'hidden' : 'block'} onClick={() => setExpansionIdx(expansionIdx+1)}>&gt;</button>
      </div>
    </>
  );
}