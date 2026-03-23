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
  layouts: LayoutData[];
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
        kwic: [
          { rank: 1, sentence: 'Не мнит лишь смертный _ И быть себя он вечным чает' },
          { rank: 2, sentence: 'Раз десять на день _ И говорить с самим собою.' },
          { rank: 3, sentence: 'Окрест библейскую мораль изобразила, По коей мы должны учиться _.' },
          { rank: 4, sentence: 'Он шел _.' },
          { rank: 5, sentence: 'им дано понять, Какая иногда рутина Вела нас жить и _.' },
        ],
        relationships: {
          synonyms: ['погибать', 'умирать постепенно'],
          antonyms: ['жить', 'существовать'],
        },
        hints: [
          'Когда человек _, его тело становится слабым и холодным.',
          'Когда люди _, они больше не могут говорить или двигаться.',
          '_ — это процесс, который происходит в конце жизни.',
          'Ты чувствуешь страх, когда кто-то рядом начинает _.',
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
    <div className="w-full h-full flex items-center justify-center">
      {component}
    </div>
  );
}