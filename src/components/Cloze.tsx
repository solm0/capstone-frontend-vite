import { useEffect, useMemo, useRef, useState } from "react"
import AudioCapture, { type AudioCaptureHandle } from "./AudioCapture"

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

function ClozeCard({
  item,
  selected,
  onSelect,
}: {
  item: ClozeItem
  selected: string | null
  onSelect: (choice: string) => void
}) {
  const answer = extractAnswer(item.sentence)

  const choices = useMemo(() => {
    const shuffled = shuffle(item.distractors)
    const picked = shuffled.slice(0, 2)
    return shuffle([answer, ...picked])
  }, [item])

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
              onClick={() => !selected && onSelect(c)}
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
  lemma: string | null
  pos: string | null
}) {
  const [data, setData] = useState<ClozeItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([])
  const [results, setResults] = useState<(boolean | null)[]>([])
  const [liveText, setLiveText] = useState("")
  const [resetAudioKey, setResetAudioKey] = useState(0)
  const audioRef = useRef<AudioCaptureHandle | null>(null)

  const total = data?.length ?? 0
  const currentItem = data?.[currentIndex] ?? null
  const currentAnswer = currentItem ? extractAnswer(currentItem.sentence) : ""
  const currentSelected = selectedAnswers[currentIndex] ?? null
  const currentResult = results[currentIndex] ?? null
  const score = results.filter(Boolean).length

  const normalize = (value: string) =>
    value.toLowerCase().replace(/\s+/g, " ").trim()

  const fetchData = async () => {
    setLoading(true)
    setError(false)

    if (!lemma || !pos) return;
    
    try {
      const res = await fetch(
        `http://localhost:8000/cloze?lemma=${encodeURIComponent(lemma)}&pos=${pos}`
      )

      if (!res.ok) throw new Error()

      const json = await res.json()
      setData(json)
      setCurrentIndex(0)
      setSelectedAnswers(Array.isArray(json) ? json.map(() => null) : [])
      setResults(Array.isArray(json) ? json.map(() => null) : [])
      setLiveText("")
      setResetAudioKey((v) => v + 1)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [lemma, pos])

  useEffect(() => {
    if (!currentItem) return
    setLiveText("")
    setResetAudioKey((v) => v + 1)
  }, [currentIndex, currentItem])

  const handleSelect = (choice: string) => {
    if (!currentItem) return
    if (currentResult !== null) return
    const correct = choice === currentAnswer
    setSelectedAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = choice
      return next
    })
    setResults((prev) => {
      const next = [...prev]
      next[currentIndex] = correct
      return next
    })
    audioRef.current?.stop()
  }

  const handleFinalText = (text: string) => {
    if (!currentItem) return
    if (currentResult !== null) return
    const normalizedFinal = normalize(text)
    const normalizedAnswer = normalize(currentAnswer)
    if (!normalizedAnswer) return
    if (normalizedFinal.includes(normalizedAnswer)) {
      setSelectedAnswers((prev) => {
        const next = [...prev]
        next[currentIndex] = currentAnswer
        return next
      })
      setResults((prev) => {
        const next = [...prev]
        next[currentIndex] = true
        return next
      })
      audioRef.current?.stop()
    }
  }

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
      <div className="flex items-center justify-between text-sm">
        <div>문제 {total === 0 ? 0 : currentIndex + 1}/{total}</div>
        <div>정답 {score}/{total}</div>
      </div>

      <AudioCapture
        ref={audioRef}
        onFinalText={(text) => {
          setLiveText(text)
          handleFinalText(text)
        }}
        onPartialText={(text) => {
          setLiveText(text)
        }}
        showTranscripts={false}
        resetKey={resetAudioKey}
      />

      {currentItem && (
        <ClozeCard
          item={currentItem}
          selected={currentSelected}
          onSelect={handleSelect}
        />
      )}

      {currentResult !== null && currentIndex < total - 1 && (
        <button
          className="px-3 py-1 border rounded w-fit"
          onClick={() => setCurrentIndex((i) => i + 1)}
        >
          다음
        </button>
      )}

      {currentResult !== null && currentIndex === total - 1 && (
        <div className="text-sm">끝! 총 {score}/{total}</div>
      )}

      {liveText && (
        <div className="text-xs text-gray-600">현재 인식: {liveText}</div>
      )}
    </div>
  )
}
