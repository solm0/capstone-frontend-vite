export default function RawToken({
  rawToken,
  onSelect,
}: {
  rawToken: string;
  onSelect: (rawToken: string) => void;
}) {
  return (
    <div className="bg-[#f2f2f2] px-1 cursor-pointer" onClick={() => onSelect(rawToken)}>
      {rawToken}
    </div>
  );
}