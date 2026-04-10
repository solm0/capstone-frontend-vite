import { useEffect, useMemo, useState } from "react"

type ClozeItem = {
  sentence: string
  distractors: string[]
}

function extractAnswer(sentence: string) {
  return sentence.match(/<(.*?)>/)?.[1] || ""
}

function renderSentence(sentence: string, filled?: string) {
  const parts = sentence.split(/<(.*?)>/)

  return (
    <div>
      {parts.map((p, i) => {
        if (i % 2 === 1) {
          // 빈칸 위치
          return (
            <span key={i} className="px-2 border-b border-black min-w-[40px] inline-block text-center">
              {filled ?? ""}
            </span>
          )
        }
        return <span key={i}>{p}</span>
      })}
    </div>
  )
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function ClozeCard({ item }: { item: ClozeItem }) {
  const answer = extractAnswer(item.sentence)

  const choices = useMemo(() => {
    const shuffled = shuffle(item.distractors)
    const picked = shuffled.slice(0, 2)
    return shuffle([answer, ...picked])
  }, [item])

  const [selected, setSelected] = useState<string | null>(null)

  const isCorrect = selected === answer

  return (
    <div className="flex flex-col gap-4">
      {/* 문장 */}
      <div className="text-lg">
        {renderSentence(item.sentence, selected ?? undefined)}
      </div>

      {/* 선택지 */}
      <div className="flex gap-2">
        {choices.map((c, i) => {
          let style = "px-3 py-1 border rounded"

          if (selected) {
            if (c === answer) style += " bg-green-200"
            else if (c === selected) style += " bg-red-200"
            else style += " opacity-50"
          }

          return (
            <button
              key={i}
              className={style}
              onClick={() => !selected && setSelected(c)}
            >
              {c}
            </button>
          )
        })}
      </div>

      {/* 결과 */}
      {selected && (
        <div className="text-sm">
          {isCorrect ? "맞았다" : "틀렸다"}
        </div>
      )}
    </div>
  )
}

export default function Cloze({
  lemma,
  pos
}: {
  lemma: string
  pos: string
}) {
  const [data, setData] = useState<ClozeItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(false)

    try {
      const res = await fetch(
        `http://localhost:8000/cloze?lemma=${encodeURIComponent(lemma)}&pos=${pos}`
      )

      if (!res.ok) throw new Error()

      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [lemma, pos])

  if (loading) return <div>...</div>

  if (error) {
    return (
      <div>
        <div>앗! 오류가 났다</div>
        <button onClick={fetchData}>retry</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      {data?.map((item, i) => (
        <ClozeCard key={i} item={item} />
      ))}
    </div>
  )
}