import { useState } from "react";
import CorpusFragment from "./CorpusFragment";
import type { LayoutData } from "../../types";

export default function Desk() {
  // 이게 단 하나의 대지고 그 위에 활성화된 레이아웃들이 있는거지..?
  // 레이아웃의 타입은?

  // 여러가지 레이아웃이 Desk에 올려놓아져있겠지. 하지만 한번에 하나의 레이아웃만 활성화될 수 있어.
  // 열려있는 레이아웃들은 어디다 저장하지? db?
  const exampleData: LayoutData = {
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
  const exampleLayouts:LayoutData[] = [exampleData]
  const [activeLayout, setActiveLayout] = useState(exampleLayouts[0])

  // x, y 위치
  // 드래그, 확대 인터랙션.
  // 레이어.


  // 로드할 내용물이 시/탐색/태스크 인지 분기처리
  switch (activeLayout.type) {
    case 'corpusFragment':
      return (
        <div
          className="relative font-xtypewriter rounded-3xl"
          style={{left: '100px', top: '100px'}}
        >
          <CorpusFragment corpusData={activeLayout.content} />
        </div>
      )
    case 'lemmaExpansion':
      return (
        <div>here comes the content of lemma expansion</div>
      )
    case 'clozeTask':
      return (
        <div>here comes the content of cloze task</div>
      )
  }
}