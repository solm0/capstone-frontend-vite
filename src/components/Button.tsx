export default function Button({
  text, onClick
}: {text: string, onClick: () => void}) {
  return (
    <button className="w-8 h-8 bg-[#E5FF00] rounded-full" onClick={() => onClick()}>{text}</button>
  )
}