import { useEffect, type ReactNode } from "react";
import CorpusFragment from "./CorpusFragment";
import LemmaExpansion from "./LemmaExpansion";
import type { CorpusFragment as CF, LayoutData, LemmaExpansion as LE } from "../../types";
import type { D3Node } from "../breadcrumb/Breadcrumb";
import { fetchLemma } from "../../api";

export default function Desk({
  activeNode,
  layouts,
  activeId,
  addLayout,
  onSelect,
}: {
  activeNode: D3Node | null;
  layouts: LayoutData[] ;
  activeId: string | null;
  addLayout: (layout: LayoutData) => void;
  onSelect: (tokenKey: string) => void;
}) {
  useEffect(() => {
    const lemma = activeNode?.data.lemma.split('_')[0];
    const pos = activeNode?.data.lemma.split('_')[1];
    if (!lemma || !pos || lemma === "base") return;

    fetchLemma(lemma, pos).then(data => {
      addLayout({
        id: activeNode?.data.lemma,
        type: "lemmaExpansion",
        content: data
      });
    });
  }, [activeNode, layouts]);

  const layout = layouts.find(l => l.id === activeId)

  let component:ReactNode | null;
  if (layout?.type === 'corpusFragment') {
    const content = layout.content as CF[];
    component = <CorpusFragment data={content} onSelect={onSelect} />
  } else if (layout?.type === 'lemmaExpansion') {
    const content = layout.content as LE;
    component = <LemmaExpansion data={content} onSelect={onSelect} />
  } else component = <div>wrong layout type</div>

  return (
    <div className="w-full h-full flex">
      {component}
    </div>
  );
}