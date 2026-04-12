import type { CorpusFragment } from "../../types";
import LineCF from "./LineCF";

export default function CorpusFragment({
  data, onSelect, metadata
}: {
  data: CorpusFragment[];
  onSelect: (tokenKey: string) => void;
  metadata: {author: string | null, title: string | null}
}) {
  // console.log(data)
  return (
    <div
      className="pl-32 pt-32 flex flex-col gap-6 w-[600px]"
    >
      {data.map((l, i) => (
        <LineCF key={i} idx={i} line={l} onSelect={onSelect} />
      ))}
      <div className="self-end flex flex-col">
        <p>author: {metadata.author}</p>
        <p>title: {metadata.title}</p>
      </div>
    </div>
  );
}