import RawToken from "./RawToken";

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export default function LineCF({
  idx, line, onSelect
}: {
  idx: number;
  line: { date: string; text: string; };
  onSelect: (rawToken: string) => void;
}) {
  const today = formatDate(new Date())
  const tokens = line.text.trim().split(/\s+/);

  return (
    <div className="relative flex gap-x-2 w-auto h-auto">
      <div className="text-xs -translate-y-3 flex items-center justify-center w-4 h-4 group text-gray-500">
        <span className="absolute top-0 right-7 hidden group-hover:block">{line.date}</span>
        {today === String(line.date) && <span className="absolute top-0 -z-10 w-3 h-3 bg-[#E5FF00] rounded-full"></span>}
        {idx}
      </div>
      <div className="flex gap-x-4 gap-y-0 w-auto h-auto flex-wrap">
        {tokens.map((t, i) => (
          <RawToken key={i} rawToken={t} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}