import { useCallback, useEffect, useRef, useState } from "react";
import Breadcrumb, { type D3Node } from "./breadcrumb/Breadcrumb";
import Desk from "./desk/Desk";
import SystemMenu from "./SystemMenu";
import type { LayoutData, TreeNode, User } from "../types";

// corpus fragment도 나중에 db에서가져와야함.
const exampleCFData: LayoutData = {
  id: 'cf',
  type: 'corpusFragment',
  content: {
    lines: [
      { date: '20260401', text:'Теперь не умирают от любви —' },
      { date: '20260401', text:'насмешливая трезвая эпоха.' },
      { date: '20260402', text:'Лишь падает гемоглобин в крови,' },
    ]
  }
}

export default function HomeDashboard({
  user
}: {
  user: User | null;
}) {
  const breadcrumbRef = useRef<{ addNode: (parentLemma: string, newNode: TreeNode) => void }>(null);

  const [activeNode, setActiveNode] = useState<D3Node | null>(null);
  const [layouts, setLayouts] = useState<LayoutData[]>([exampleCFData]);
  const [activeId, setActiveId] = useState<string | null>('cf');
  console.log(layouts)

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
  };

  return (
    <>
      <SystemMenu user={user} />
      <div className="absolute w-screen h-screen font-it flex flex-col gap-3">
        <Breadcrumb ref={breadcrumbRef} activeNode={activeNode} setActiveNode={setActiveNode} />
        <Desk
          activeNode={activeNode}
          layouts={layouts}
          activeId={activeId}
          addLayout={addLayout}
          onSelect={handleTokenSelect}
        />
      </div>
    </>
  )
}