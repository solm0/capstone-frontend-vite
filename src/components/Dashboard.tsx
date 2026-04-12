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
  const [expanded, setExpanded] = useState(false);

  const [activeNode, setActiveNode] = useState<D3Node | null>(null);
  const [layouts, setLayouts] = useState<LayoutData[]>([]);
  const [activeId, setActiveId] = useState<string | null>('cf');
  const [lemmaStatus, setLemmaStatus] = useState<Record<string, "loading" | "ready">>({});
  const prevActiveLemmaRef = useRef<string | null>(null);

  useEffect(() => {
    if (user === null) return; 

    const run = async () => {
      let cfData:LayoutData;
  
      if (!user) {
        cfData = {
          id: 'cf',
          type: 'corpusFragment',
          author: '',
          title: '',
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
          author: data.history.length > 3 ? data.poem.author : '',
          title: data.history.length > 5 ? data.poem.title : '',
          content: lines,
        }
      }
      setLayouts([cfData]);
    }
    run();
  }, [user])

  const addLayout = useCallback((layout: LayoutData, autoActivate = true) => {
    setLayouts(prev => {
      if (layout.id === "cf") return prev;
      if (prev.find(l => l.id === layout.id)) return prev;
      return [...prev, layout];
    });
    if (autoActivate) setActiveId(layout.id);
  }, []);

  // breadcrumb 클릭
  useEffect(() => {
    const nextLemmaId = activeNode?.data.lemma ?? null;
    if (prevActiveLemmaRef.current === nextLemmaId) return;
    prevActiveLemmaRef.current = nextLemmaId;

    if (nextLemmaId === "base") {
      setActiveId('cf');
      return;
    }

    if (!nextLemmaId) return;
    const hasLayout = layouts.some(l => l.id === nextLemmaId);
    const isLoading = lemmaStatus[nextLemmaId] === "loading";
    if (hasLayout && !isLoading) setActiveId(nextLemmaId);
  }, [activeNode, layouts, lemmaStatus])

  useEffect(() => {
    if (!activeId) return;
    if (lemmaStatus[activeId] !== "ready") return;
    setLemmaStatus(prev => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
  }, [activeId, lemmaStatus]);

  const handleTokenSelect = (tokenKey: string) => {
    const parentLemma = activeNode?.data.lemma ?? "base";
    breadcrumbRef.current?.addNode(parentLemma, { lemma: tokenKey });
  };

  return (
    <>
      <div className="absolute w-screen h-screen font-it flex flex-col overflow-hidden">
        <Breadcrumb
          ref={breadcrumbRef}
          activeNode={activeNode}
          setActiveNode={setActiveNode}
          nodeStatusByLemma={lemmaStatus}
          expanded={expanded}
          setExpanded={setExpanded}
        />
        <Desk
          activeNode={activeNode}
          layouts={layouts}
          activeId={activeId}
          addLayout={addLayout}
          onLemmaFetchStart={(lemmaId) => {
            setLemmaStatus(prev => ({
              ...prev,
              [lemmaId]: "loading",
            }));
          }}
          onLemmaFetchSuccess={(lemmaId) => {
            setLemmaStatus(prev => ({
              ...prev,
              [lemmaId]: "ready",
            }));
          }}
          onLemmaFetchError={(lemmaId) => {
            setLemmaStatus(prev => {
              const next = { ...prev };
              delete next[lemmaId];
              return next;
            });
          }}
          onSelect={handleTokenSelect}
          isBCExpanded={expanded}
        />
      </div>
    </>
  )
}
