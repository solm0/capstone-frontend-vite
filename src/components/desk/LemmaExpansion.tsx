import type { LemmaExpansion } from "../../types";
import Line from "./Line";

export default function LemmaExpansion({
  data, onSelect
}: {
  data: LemmaExpansion;
  onSelect: (rawToken: string) => void;
}) {
  return (
    <div
      className="flex flex-col gap-7 w-[800px] text-xl"
    >
      {data.kwic.map((k, i) => 
        <Line key={i} line={k.sentence.replace('_', data.lemma)} onSelect={onSelect} />
      )}
    </div>
  );
}