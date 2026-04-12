import { useCallback, useEffect, useRef, useState } from "react";
import Breadcrumb, { type D3Node } from "./breadcrumb/Breadcrumb";
import Desk from "./desk/Desk";
import type { CorpusFragment, CorpusFragmentData, LayoutData, TreeNode } from "../types";
import { getToday, verifyToken } from "../api";
import { poemSample } from "../assets/data/nologin-poem";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    verifyToken().then(setUser);
  }, []);

  const breadcrumbRef = useRef<{ addNode: (parentLemma: string, newNode: TreeNode) => void }>(null);

  const [activeNode, setActiveNode] = useState<D3Node | null>(null);
  const [layouts, setLayouts] = useState<LayoutData[]>([]);
  const [activeId, setActiveId] = useState<string | null>('cf');

  useEffect(() => {
    const run = async () => {
      let cfData:LayoutData;
  
      if (!user) {
        cfData = {
          id: 'cf',
          type: 'corpusFragment',
          content: poemSample,
        }
      } else {
        const data = await getToday();

        const lines: CorpusFragment[] = [];
        (data as CorpusFragmentData).history.forEach(item => {
          item.lines.forEach(i => {
            lines.push({
              date: item.date,
              text: i.text,
              tokens: i.tokens
            })
          })
        })

        cfData = {
          id: 'cf',
          type: 'corpusFragment',
          content: lines,
          //author title
        }
      }
      setLayouts([cfData]);
    }
    run();
  }, [])

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

  const handleTokenSelect = (tokenKey: string) => {
    // const lemma = tokenKey.split('_')[0];
    const parentLemma = activeNode?.data.lemma ?? "base";
    breadcrumbRef.current?.addNode(parentLemma, { lemma: tokenKey });
  };

  return (
    <>
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