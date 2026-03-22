import { useEffect, useState } from "react";
import CorpusFragment from "./CorpusFragment";
import LemmaExpansion from "./LemmaExpansion";
import type { LayoutData } from "../../types";
import type { D3Node } from "../breadcrumb/Breadcrumb";

export default function Desk({
  activeNode, onDragPosition,
}: {
  activeNode: D3Node | null;
  onDragPosition: (x: number, y: number) => void;
}) {
  // 여러가지 레이아웃이 Desk에 올려놓아져있겠지. 하지만 한번에 하나의 레이아웃만 활성화될 수 있어.
  // 열려있는 레이아웃들은 어디다 저장하지? db?
  const exampleCFData: LayoutData = {
    id: 'cf',
    type: 'corpusFragment',
    content: {
      lines: [
        'Теперь не умирают от любви —',
        'насмешливая трезвая эпоха.',
        'Лишь падает гемоглобин в крови,',
        // 'лишь без причины человеку плохо.',
        // 'Теперь не умирают от любви —',
        // 'лишь сердце что-то барахлит ночами.',
        // 'Но «неотложку», мама, не зови,',
        // 'врачи пожмут беспомощно плечами:',
        // '«Теперь не умирают от любви...»',
      ]
    }
  }

  const [layouts, setLayouts] = useState<LayoutData[]>([exampleCFData]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // breadcrumb에서 activeNode가 바뀌면(lemmaExpansion) activeLayout도 바뀐다.
  useEffect(() => {
    if (!activeNode?.data.lemma) return;
    // 나중에는 breadcrumb에서 받아오는게 아니라 api레이어에서 가져오는걸로 바꿔야됨.
    const exampleLEData: LayoutData = {
      id: activeNode?.data.lemma ?? 'undefined',
      type: 'lemmaExpansion',
      content: {
        lemma: activeNode?.data.lemma ?? 'undefined',
        kwic: [
          {
            rank: 1,
            sentence: 'Не мнит лишь смертный _ И быть себя он вечным чает',
          },
          {
            rank: 2,
            sentence: 'Раз десять на день _ И говорить с самим собою.',
          },
          {
            rank: 3,
            sentence: 'Окрест библейскую мораль изобразила, По коей мы должны учиться _.',
          },
          {
            rank: 4,
            sentence: 'Он шел _.',
          },
          {
            rank: 5,
            sentence: 'им дано понять, Какая иногда рутина Вела нас жить и _.',
          },
        ],
        relationships: {
          synonyms: ['погибать', 'умирать постепенно'],
          antonyms: ['жить', 'существовать'],
        },
        hints: [
          'Когда человек _, его тело становится слабым и холодным.',
          'Когда люди _, они больше не могут говорить или двигаться.',
          '_ — это процесс, который происходит в конце жизни.',
          'Ты чувствуешь страх, когда кто-то рядом начинает _.'
        ]
      }
    }

    // 이미 layout에 있는 activeNode면 추가 x.
    setLayouts(prev => {
      const exists = prev.find(l => l.id === exampleLEData.id);
      if (exists) return prev;

      return [...prev, exampleLEData];
    });

    setActiveId(exampleLEData.id);
    console.log(layouts, activeId)
  }, [activeNode])

  return (
    <>
      {layouts.map((l, i) => {
        const isActive = l.id === activeId;

        switch (l.type) {
          case 'corpusFragment':
            return (
              <div key={l.id} style={{ position: 'absolute', zIndex: isActive ? 999 : i }}>
                <CorpusFragment
                  data={l.content}
                  setActiveId={setActiveId}
                  onDragPosition={onDragPosition}
                />
              </div>
            );
          case 'lemmaExpansion':
            return (
              <div key={l.id} style={{ position: 'absolute', zIndex: isActive ? 999 : i }}>
                <LemmaExpansion
                  data={l.content}
                  setActiveId={setActiveId}
                  onDragPosition={onDragPosition}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}