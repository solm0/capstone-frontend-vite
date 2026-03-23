import { useCallback, useState } from "react";
import Breadcrumb, { type D3Node } from "./breadcrumb/Breadcrumb";
import Desk from "./desk/Desk";
import SystemMenu from "./SystemMenu";
import type { LayoutData } from "../types";


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
  const [activeNode, setActiveNode] = useState<D3Node | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [layouts, setLayouts] = useState<LayoutData[]>([exampleCFData]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragPosition = useCallback((x: number, y: number) => {
    const h = window.innerHeight;
    setIsOverTrash(x <= 200 && h - y <= 200);
  }, []);

  const handleDragStart = useCallback(() => setIsDragging(true), []);

  const handleDragEnd = useCallback((id: string) => {
    setIsDragging(false);
    if (isOverTrash) {
      setLayouts(prev => {
        const next = prev.filter(l => l.id !== id);
        console.log('삭제 후 layouts:', next); // 여기서 찍기
        return next;
      });
      setActiveNode(null);
      setActiveId(null);
    }
    setIsOverTrash(false);
  }, [isOverTrash]);

  const addLayout = useCallback((layout: LayoutData) => {
    setLayouts(prev => {
      if (prev.find(l => l.id === layout.id)) return prev;
      return [...prev, layout];
    });
    setActiveId(layout.id);
  }, []);

  return (
    <div className="absolute w-screen h-screen">
      <SystemMenu isOverTrash={isOverTrash} isDragging={isDragging} />
      <div className="font-xtypewriter">
        <Breadcrumb activeNode={activeNode} setActiveNode={setActiveNode} />
        <Desk
          activeNode={activeNode}
          layouts={layouts}
          activeId={activeId}
          setActiveId={setActiveId}
          addLayout={addLayout}
          onDragPosition={handleDragPosition}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>
    </div>
  )
}