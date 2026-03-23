import type { CorpusFragment } from "../../types";
import Line from "./Line";

export default function CorpusFragment({
  data, onSelect
}: {
  data: CorpusFragment;
  onSelect: (rawToken: string) => void;
}) {
  return (
    <div
      className="flex flex-col rounded-sm gap-10 w-[600px] drop-shadow-md"
    >
      {data.lines.map((l, i) => (
        <Line key={i} line={l} onSelect={onSelect} />
      ))}
    </div>
  );
}