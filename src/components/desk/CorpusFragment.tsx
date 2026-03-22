import type { CorpusFragment } from "../../types";
import Line from "./Line";

export default function CorpusFragment({
  corpusData,
}: {
  corpusData: CorpusFragment
}) {
  return (
    <div className="relative flex flex-col  rounded-3xl gap-10 w-[600px]">
      {corpusData.lines.map((l, i) => {
        return (
          <Line key={i} line={l} />
        )
      })}
    </div>
  )
}