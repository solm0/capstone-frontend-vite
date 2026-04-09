import type { CorpusFragment } from "../../types";
import LineCF from "./LineCF";

export default function CorpusFragment({
  data, onSelect
}: {
  data: CorpusFragment[];
  onSelect: (tokenKey: string) => void;
}) {
  return (
    <div
      className="pl-32 pt-32 flex flex-col rounded-sm gap-6 w-[600px]"
    >
      {data.map((l, i) => (
        <LineCF key={i} idx={i} line={l} onSelect={onSelect} />
      ))}
    </div>
  );
}