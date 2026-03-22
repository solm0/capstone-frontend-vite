import { useCallback, useState } from "react";
import Breadcrumb, { type D3Node } from "./breadcrumb/Breadcrumb";
import Desk from "./desk/Desk";
import SystemMenu from "./SystemMenu";

export default function HomeDashboard() {
  const [activeNode, setActiveNode] = useState<D3Node | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const handleDragPosition = useCallback((x: number, y: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setIsOverTrash(x <= 200 && h - y <= 200);
    console.log(isOverTrash, x, h - y)
  }, []);

  return (
    <div className="absolute w-screen h-screen">
      <SystemMenu isOverTrash={isOverTrash} />
      <div className="font-xtypewriter">
        <Breadcrumb activeNode={activeNode} setActiveNode={setActiveNode} />
        <Desk activeNode={activeNode} onDragPosition={handleDragPosition} />
      </div>
    </div>
  )
}