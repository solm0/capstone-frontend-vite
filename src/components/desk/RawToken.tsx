import type { Token } from "../../types";

export default function RawToken({
  token,
  onSelect,
  stress = false
}: {
  token: Token;
  onSelect: (tokenKey: string) => void;
  stress?: boolean;
}) {
  const tokenKey = `${token.lemma}_${token.pos}`
  return (
    <span
      className={`cursor-pointer h-6 opacity-80 inline-flex items-center hover:opacity-100 transition-all duration-300 text-xl hover:drop-shadow-md ${stress ? 'font-tx' : 'font-it hover:font-tx'}`}
      onClick={() => onSelect(tokenKey)}
    >
      {token.surface}
    </span>
  );
}