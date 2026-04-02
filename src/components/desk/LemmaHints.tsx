import RawToken from "./RawToken";

export function LemmaHints({
  data, onSelect
}: {
  data: string[];
  onSelect: (rawToken: string) => void;
}) {
  function parseToken(token: string) {
    const match = token.match(/^([(<"]*)<([^>]+)>([)>.,!?":;]*)$/);

    if (match) {
      return {
        prefix: match[1],   // 여는 괄호 등
        target: match[2],   // 핵심 lemma
        suffix: match[3],   // punctuation
      };
    }

    return {
      prefix: "",
      target: null,
      suffix: "",
      text: token,
    };
  }

  return (
    <div className="pl-32 pt-32 flex flex-col gap-12 w-full items-start md:mx-20">
      {data.map((d, i) => {
        const tokens = d.trim().split(/\s+/);

        return (
          <div key={i} className="flex gap-3 flex-wrap">
            {tokens.map((t, j) => {
              const parsed = parseToken(t);

              if (parsed.target) {
                return (
                  <span key={j} className="flex items-center gap-1">
                    {parsed.prefix && <span>{parsed.prefix}</span>}

                    <RawToken
                      rawToken={parsed.target}
                      onSelect={onSelect}
                      stress={true}
                    />

                    {parsed.suffix && <span>{parsed.suffix}</span>}
                  </span>
                );
              }

              return (
                <RawToken
                  key={j}
                  rawToken={t}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  )
}