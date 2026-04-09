import { useCallback, useEffect, useRef, useState } from "react";
import Breadcrumb, { type D3Node } from "./breadcrumb/Breadcrumb";
import Desk from "./desk/Desk";
import SystemMenu from "./SystemMenu";
import type { CorpusFragment, CorpusFragmentData, LayoutData, TreeNode, User } from "../types";
import { getToday } from "../api";

export default function HomeDashboard({
  user
}: {
  user: User | null;
}) {
  const [poem, setPoem] = useState<LayoutData | null>(null);
  const breadcrumbRef = useRef<{ addNode: (parentLemma: string, newNode: TreeNode) => void }>(null);

  const [activeNode, setActiveNode] = useState<D3Node | null>(null);
  const [layouts, setLayouts] = useState<LayoutData[]>(poem===null ? [] : [poem]);
  const [activeId, setActiveId] = useState<string | null>('cf');

  // 현재 시의 모든 행들 가져오기
  // 잠만,, 시의 일부만 오픈되었을 때 나머지 부분까지도 갖고 있기 좀 낭비같잖아. 그냥 첫 행부터 순서대로 가는 걸로 고칠까
  useEffect(() => {
    getToday().then(data => {

      const lines:CorpusFragment[] = [];
      (data as CorpusFragmentData).history.map(item => {
        
        item.lines.map(i => {
          lines.push({
            date: item.date,
            text: i.text,
            tokens: i.tokens
          }) 
        })
      })

      const cfData: LayoutData = {
        id: 'cf',
        type: 'corpusFragment',
        content: lines,
      }

      setLayouts([cfData]);
    })
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