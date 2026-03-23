import RawToken from "./RawToken";

export default function Line({
  line, onSelect
}: {
  line: string;
  onSelect: (rawToken: string) => void;
}) {
  const tokens = line.trim().split(/\s+/);

  return (
    <div className="relative flex gap-3 w-auto h-auto">
        {tokens.map((t, i) => (
          <RawToken key={i} rawToken={t} onSelect={onSelect} />
        ))}
    </div>
  );
}