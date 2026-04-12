import { useEffect, useRef, type ReactNode } from "react";
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
  onLemmaFetchStart,
  onLemmaFetchSuccess,
  onLemmaFetchError,
  onSelect,
}: {
  activeNode: D3Node | null;
  layouts: LayoutData[] ;
  activeId: string | null;
  addLayout: (layout: LayoutData, autoActivate?: boolean) => void;
  onLemmaFetchStart?: (lemmaId: string) => void;
  onLemmaFetchSuccess?: (lemmaId: string) => void;
  onLemmaFetchError?: (lemmaId: string) => void;
  onSelect: (tokenKey: string) => void;
}) {
  const inflightRef = useRef(new Set<string>());

  useEffect(() => {
    const lemmaId = activeNode?.data.lemma;
    const lemma = lemmaId?.split('_')[0];
    const pos = lemmaId?.split('_')[1];
    if (!lemma || !pos || lemma === "base") return;

    if (layouts.find(l => l.id === lemmaId)) return;
    if (inflightRef.current.has(lemmaId)) return;

    inflightRef.current.add(lemmaId);
    onLemmaFetchStart?.(lemmaId);
    const startedAt = performance.now();

    fetchLemma(lemma, pos).then(data => {
      const duration = performance.now() - startedAt;
      const autoActivate = duration <= 1000;
      addLayout({
        id: lemmaId,
        type: "lemmaExpansion",
        content: data
      }, autoActivate);
      onLemmaFetchSuccess?.(lemmaId);
    }).catch(() => {
      onLemmaFetchError?.(lemmaId);
    }).finally(() => {
      inflightRef.current.delete(lemmaId);
    });
  }, [activeNode, layouts, addLayout, onLemmaFetchStart, onLemmaFetchSuccess, onLemmaFetchError]);

  const layout = layouts.find(l => l.id === activeId)

  let component:ReactNode | null;
  if (layout?.type === 'corpusFragment') {
    const content = layout.content as CF[];
    component = <CorpusFragment data={content} onSelect={onSelect} metadata={{author:layout.author??null, title: layout.title??null}} />
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
