import RawToken from "./RawToken";

export default function LemmaKwic({
  data, onSelect, lemma
}: {
  data: { line_id:number, tokens:any[] }[];
  onSelect: (tokenKey: string) => void;
  lemma: string
}) {
  return (
    <div className="flex flex-col gap-6 w-full items-center pt-32 md:mx-20">
      <div className="absolute -translate-y-4 h-[60%] w-28">
        <div className="-z-10 w-full h-full bg-gradient-to-b from-[#E5FF00] to-transparent rounded-lg blur-sm" />
        <span className="absolute top-4 -translate-x-1/2 -translate-y-14">{lemma.split('_')[0]}</span>
      </div>

      {data.map((d, i) => {
        const tokens = d.tokens

        // lemma match (첫 번째만 사용)
        const targetIdx = tokens.findIndex(t => t.lemma === lemma.split('_')[0])

        if (targetIdx === -1) return null

        const left = tokens.slice(0, targetIdx)
        const target = tokens[targetIdx]
        const right = tokens.slice(targetIdx + 1)

        return (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-10 w-full">
            
            {/* LEFT */}
            <div
              className="flex gap-3 overflow-hidden h-auto justify-end"
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
            <div className="text-center">
              <RawToken token={{lemma: target.lemma, pos: target.pos, surface:target.surface}} onSelect={onSelect} />
            </div>

            {/* RIGHT */}
            <div
              className="flex gap-3 overflow-hidden h-auto justify-start"
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