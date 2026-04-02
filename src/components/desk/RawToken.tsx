export default function RawToken({
  rawToken,
  onSelect,
}: {
  rawToken: string;
  onSelect: (rawToken: string) => void;
}) {
  return (
    <div className="px-1 cursor-pointer h-7 opacity-80 hover:opacity-100 hover:drop-shadow-sm transition-all duration-300 hover:font-tx" onClick={() => onSelect(rawToken)}>
      {rawToken}
    </div>
  );
}