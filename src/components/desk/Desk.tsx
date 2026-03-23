import { useEffect } from "react";
import CorpusFragment from "./CorpusFragment";
import LemmaExpansion from "./LemmaExpansion";
import type { LayoutData } from "../../types";
import type { D3Node } from "../breadcrumb/Breadcrumb";

export default function Desk({
  activeNode,
  layouts,
  activeId,
  setActiveId,
  addLayout,
  onDragPosition,
  onDragStart,
  onDragEnd,
}: {
  activeNode: D3Node | null;
  layouts: LayoutData[];
  activeId: string | null;
  setActiveId: (id: string) => void;
  addLayout: (layout: LayoutData) => void;
  onDragPosition: (x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: (id: string) => void;
}) {
  useEffect(() => {
    if (!activeNode?.data.lemma) return;

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

  return (
    <>
      {layouts.map((l, i) => {
        const isActive = l.id === activeId;
        const sharedProps = {
          setActiveId,
          onDragPosition,
          onDragStart,
          onDragEnd,
        };

        switch (l.type) {
          case 'corpusFragment':
            return (
              <div key={l.id} style={{ position: 'absolute', zIndex: isActive ? 999 : i }}>
                <CorpusFragment data={l.content} {...sharedProps} />
              </div>
            );
          case 'lemmaExpansion':
            return (
              <div key={l.id} style={{ position: 'absolute', zIndex: isActive ? 999 : i }}>
                <LemmaExpansion data={l.content} {...sharedProps} />
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}