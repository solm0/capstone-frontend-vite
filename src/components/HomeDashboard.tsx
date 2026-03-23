import { useCallback, useEffect, useRef, useState } from "react";
import Breadcrumb, { type D3Node } from "./breadcrumb/Breadcrumb";
import Desk from "./desk/Desk";
import SystemMenu from "./SystemMenu";
import type { LayoutData, TreeNode } from "../types";

// corpus fragment도 나중에 db에서가져와야함.
const exampleCFData: LayoutData = {
  id: 'cf',
  type: 'corpusFragment',
  content: {
    lines: [
      'Теперь не умирают от любви —',
      'насмешливая трезвая эпоха.',
      'Лишь падает гемоглобин в крови,',
    ]
  }
}

export default function HomeDashboard() {
  const breadcrumbRef = useRef<{ addNode: (parentLemma: string, newNode: TreeNode) => void }>(null);

  const [activeNode, setActiveNode] = useState<D3Node | null>(null);
  const [layouts, setLayouts] = useState<LayoutData[]>([exampleCFData]);
  const [activeId, setActiveId] = useState<string | null>('cf');

  const addLayout = useCallback((layout: LayoutData) => {
    setLayouts(prev => {
      if (layout.id === "cf") return prev;
      if (prev.find(l => l.id === layout.id)) return prev;
      return [...prev, layout];
    });
    setActiveId(layout.id);
  }, []);

  // breadcrumb 클릭
  useEffect(() => {
    if (activeNode?.data.lemma === "base") setActiveId('cf');
  }, [activeNode])

  const handleTokenSelect = (rawToken: string) => {
    const parentLemma = activeNode?.data.lemma ?? "base";
    breadcrumbRef.current?.addNode(parentLemma, { lemma: rawToken });
    console.log(parentLemma, rawToken, layouts)
  };

  return (
    <div >
      <SystemMenu />
      <div className="absolute w-screen h-screen font-xtypewriter flex flex-col p-6 gap-6">
        <Breadcrumb ref={breadcrumbRef} activeNode={activeNode} setActiveNode={setActiveNode} />
        <Desk
          activeNode={activeNode}
          layouts={layouts}
          activeId={activeId}
          setActiveId={setActiveId}
          addLayout={addLayout}
          onSelect={handleTokenSelect}
        />
      </div>
    </div>
  )
}