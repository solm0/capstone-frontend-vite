import RawToken from "./RawToken";

export default function LemmaKwic({
  data, onSelect, lemma
}: {
  data: { line_id:number, tokens:any[] }[];
  onSelect: (tokenKey: string) => void;
  lemma: string
}) {
  return (
    <div className="flex flex-col w-full h-auto items-center">

      {data.map((d, i) => {
        const tokens = d.tokens

        // lemma match (첫 번째만 사용)
        const targetIdx = tokens.findIndex(t => t.lemma === lemma.split('_')[0])

        if (targetIdx === -1) return null

        const left = tokens.slice(0, targetIdx)
        const target = tokens[targetIdx]
        const right = tokens.slice(targetIdx + 1)

        return (
          <div key={i} className={`
            grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 w-full z-10 h-10
          `}>
            
            {/* LEFT */}
            <div
              className="flex gap-3 overflow-hidden h-auto justify-end pr-1"
              style={{
                WebkitMaskImage: "linear-gradient(to right, transparent, black 24px)",
                maskImage: "linear-gradient(to right, transparent, black 24px)",
              }}
            >
              {left.map((t, j) => (
                <RawToken key={j} token={{lemma: t.lemma, pos: t.pos, surface:t.surface}} onSelect={onSelect} />
              ))}
            </div>

            {/* TARGET */}
            <div className="text-center bg-neutral-300 px-2 rounded-lg">
              <span className="z-80 text-xl">{target.surface}</span>
            </div>

            {/* RIGHT */}
            <div
              className="flex gap-3 overflow-hidden h-auto justify-start pl-1"
              style={{
                WebkitMaskImage: "linear-gradient(to left, transparent, black 24px)",
                maskImage: "linear-gradient(to left, transparent, black 24px)",
              }}
            >
              {right.map((t, j) => (
                <RawToken key={j} token={{lemma: t.lemma, pos: t.pos, surface:t.surface}} onSelect={onSelect} />
              ))}
            </div>

          </div>
        )
      })}
    </div>
  );
}