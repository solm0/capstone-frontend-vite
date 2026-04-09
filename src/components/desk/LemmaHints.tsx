import { useEffect, useState } from "react";

type Token =
  | { type: "text"; value: string }
  | { type: "highlight"; value: string }

function parseHighlight(text: string): Token[] {
  const result: Token[] = []
  const regex = /<([^>]+)>/g

  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    const end = regex.lastIndex

    // 일반 텍스트
    if (start > lastIndex) {
      result.push({
        type: "text",
        value: text.slice(lastIndex, start),
      })
    }

    // 하이라이트
    result.push({
      type: "highlight",
      value: match[1],
    })

    lastIndex = end
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    result.push({
      type: "text",
      value: text.slice(lastIndex),
    })
  }

  return result
}

function Sentence({ text }: { text: string }) {
  const tokens = parseHighlight(text)

  return (
    <div>
      {tokens.map((t, i) =>
        t.type === "highlight" ? (
          <span key={i} className="text-red-500 font-semibold">
            {t.value}
          </span>
        ) : (
          <span key={i}>{t.value}</span>
        )
      )}
    </div>
  )
}

type Response = {
  content: string[]
}

export default function LemmaHints({
  lemma
}: {
  lemma: string;
  // pos: string;
}) {
  // 나중에 삭제
  const lemma_tmp = 'бесконечный'
  const pos_tmp = 'ADJ'

  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(false)

    try {
      const res = await fetch(
        `http://localhost:8000/hint?lemma=${encodeURIComponent(lemma_tmp)}&pos=${pos_tmp}`
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
  }, [lemma_tmp, pos_tmp])

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
    <div className="pl-32 pt-32 flex flex-col gap-12 w-full items-start md:mx-20">
      <div className="flex flex-col gap-2">
        {data?.content.map((s, i) => (
          <div key={i} className={i < 2 ? "opacity-70" : i < 4 ? "" : "font-medium"}>
            <Sentence text={s} />
          </div>
        ))}
      </div>
    </div>
  )
}