import RawToken from "./RawToken";

export default function LemmaKwic({
  data, onSelect, lemma
}: {
  data: {rank:number, sentence:string}[];
  onSelect: (rawToken: string) => void;
  lemma: string
}) {
  function parseLine(line: string) {
    const match = line.match(/^(.*)<(.*)>(.*)$/);
    if (!match) return null;

    return {
      left: match[1].trim(),
      target: match[2].trim(),
      right: match[3].trim(),
    };
  }

  return (
    <div className="flex flex-col gap-6 w-full items-center pt-32 md:mx-20">
      <div className="absolute -translate-y-4 h-[60%] w-28">
        <div className="-z-10 w-full h-full bg-gradient-to-b from-[#E5FF00] to-transparent rounded-lg blur-sm" />
        <span className="absolute top-4 -translate-x-1/2 -translate-y-14">{lemma}</span>
      </div>
      {data.map((d, i) => {
        const parsed = parseLine(d.sentence);
        if (!parsed) return null;
        const { left, target, right } = parsed;

        return (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-10 w-full">
            <div
              className="flex gap-3 overflow-hidden h-auto justify-end"
              style={{
                WebkitMaskImage: "linear-gradient(to right, transparent, black 24px)",
                maskImage: "linear-gradient(to right, transparent, black 24px)",
              }}
            >
              {left.split(/\s+/).map((t, j) => (
                <RawToken key={j} rawToken={t} onSelect={onSelect} />
              ))}
            </div>

            <div className="text-center">
              <RawToken rawToken={target} onSelect={onSelect} />
            </div>

            <div
              className="flex gap-3 overflow-hidden h-auto justify-start"
              style={{
                WebkitMaskImage: "linear-gradient(to left, transparent, black 24px)",
                maskImage: "linear-gradient(to left, transparent, black 24px)",
              }}
            >
              {right.split(/\s+/).map((t, j) => (
                <RawToken key={j} rawToken={t} onSelect={onSelect} />
              ))}
            </div>
          </div>
        )
      })}
  </div>
  );
}