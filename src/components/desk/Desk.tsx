import { useEffect, type ReactNode } from "react";
import CorpusFragment from "./CorpusFragment";
import LemmaExpansion from "./LemmaExpansion";
import type { CorpusFragment as CF, LayoutData, LemmaExpansion as LE } from "../../types";
import type { D3Node } from "../breadcrumb/Breadcrumb";

export default function Desk({
  activeNode,
  layouts,
  activeId,
  addLayout,
  onSelect,
}: {
  activeNode: D3Node | null;
  layouts: LayoutData[] ;
  activeId: string | null;
  addLayout: (layout: LayoutData) => void;
  onSelect: (rawToken: string) => void;
}) {
  useEffect(() => {
    if (!activeNode?.data.lemma || activeNode.data.lemma === "base") return;
    
    const exampleLEData: LayoutData = {
      id: activeNode.data.lemma,
      type: 'lemmaExpansion',
      content: {
        lemma: activeNode.data.lemma,
        expansions: [
          {
            // 1. relationships: syn 5개, antonym 1-2개
            type: 'relationships',
            content: {
              synonyms: ['погибать', 'скончаться', 'умереть', 'дохнуть', 'гибнуть'],
              antonyms: ['жить', 'рождаться'],
            }
          },
          {
            // 2. kwic: rank, sentense
            type: 'kwic',
            content: [
              { rank: 1, sentence: 'Не мнит лишь смертный <умирать> И быть себя он вечным чает' },
              { rank: 2, sentence: 'Раз десять на день <умирать> И говорить с самим собою.' },
              { rank: 3, sentence: 'Окрест библейскую мораль изобразила, По коей мы должны учиться <умирать>.' },
              { rank: 4, sentence: 'Он шел <умирать>.' },
              { rank: 5, sentence: 'им дано понять, Какая иногда рутина Вела нас жить и <умирать>.' },
            ]
          },
        ]
      }
    }

    addLayout(exampleLEData);
  }, [activeNode]);

  const layout = layouts.find(l => l.id === activeId)

  let component:ReactNode | null;
  if (layout?.type === 'corpusFragment') {
    const content = layout.content as CF;
    component = <CorpusFragment data={content} onSelect={onSelect} />
  } else if (layout?.type === 'lemmaExpansion') {
    const content = layout.content as LE;
    component = <LemmaExpansion data={content} onSelect={onSelect} />
  } else component = <div>wrong layout type</div>

  return (
    <div className="w-full h-full flex">
      {component}
    </div>
  );
}