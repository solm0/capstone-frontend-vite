export default function RawToken({
  rawToken
}: {
  rawToken: string
}) {

  const width = rawToken.length*10 + 15

  return (
    <div
      className="relative w-auto h-auto flex items-center justify-center transition-all duration-300 cursor-pointer rounded-full bg-stone-200 hover:bg-stone-300 active:bg-stone-300 backdrop-blur-sm"
    >
      <div
        style={{width: `${width}px`, height: `${width}px`}}
      />
      <span className="absolute">{rawToken}</span>
    </div>
  )
}