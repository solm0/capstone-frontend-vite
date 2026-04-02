export default function RawToken({
  rawToken,
  onSelect,
  stress = false
}: {
  rawToken: string;
  onSelect: (rawToken: string) => void;
  stress?: boolean;
}) {
  return (
    <span
      className={`cursor-pointer h-6 opacity-80 inline-flex items-center hover:opacity-100 transition-all duration-300 text-xl hover:drop-shadow-md ${stress ? 'font-tx' : 'font-it hover:font-tx'}`}
      onClick={() => onSelect(rawToken)}
    >
      {rawToken}
    </span>
  );
}