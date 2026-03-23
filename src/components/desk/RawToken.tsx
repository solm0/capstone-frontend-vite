export default function RawToken({
  rawToken
}: {
  rawToken: string
}) {

  const width = rawToken.length*10

  return (
    <div
      style={{width: `${width}px`}}
      className="relative w-auto h-auto flex items-center justify-center cursor-pointer"
    >
      <span className="absolute bg-[#f2f2f2] px-1">{rawToken}</span>
    </div>
  )
}