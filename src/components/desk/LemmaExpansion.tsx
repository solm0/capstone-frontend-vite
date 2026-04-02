import { useState, type ReactNode } from "react";
import type { LemmaExpansion } from "../../types";
import { LemmaRelationships } from "./LemmaRelationships";
import LemmaKwic from "./LemmaKwic";
import { LemmaHints } from "./LemmaHints";

export default function LemmaExpansion({
  data, onSelect
}: {
  data: LemmaExpansion;
  onSelect: (rawToken: string) => void;
}) {
  // relationships -> kwic -> hints
  const [expansionIdx, setExpansionIdx] = useState<number>(0);

  let component:ReactNode | null;
  if (expansionIdx === 0) component = <LemmaRelationships data={data.expansions[0].content} onSelect={onSelect} lemma={data.lemma} />
  else if (expansionIdx === 1) component = <LemmaKwic data={data.expansions[1].content} onSelect={onSelect} lemma={data.lemma} />
  else if (expansionIdx === 2) component = <LemmaHints data={data.expansions[2].content} onSelect={onSelect} />

  return (
    <>
      {component}

      {/* 넘어가기 버튼(임시) */}
      <div className="absolute bottom-20 right-20 flex gap-2">
        <button className={expansionIdx<=0 ? 'hidden' : 'block'} onClick={() => setExpansionIdx(expansionIdx-1)}>&lt;</button>
        <span>{data.expansions[expansionIdx].type}</span>
        <span>{expansionIdx+1}/3</span>
        <button className={expansionIdx>=2 ? 'hidden' : 'block'} onClick={() => setExpansionIdx(expansionIdx+1)}>&gt;</button>
      </div>
    </>
  );
}