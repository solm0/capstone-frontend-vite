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

export default function LemmaHints({
  data, lemma
}: {
  data: string[];
  lemma: string;
}) {
  return (
    <div>
      <p>{lemma}</p>
      {data.map((s, i) => (
        <Sentence key={i} text={s} />
      ))}
    </div>
  );
}