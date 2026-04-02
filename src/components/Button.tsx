import { Link } from "react-router-dom";

export default function Button({
  text, onClick
}: {
  text: string;
  onClick: () => void
}) {
  return (
    <button className="opacity-80 hover:opacity-100 hover:font-tx" onClick={() => onClick()}>
      <span>&gt; {text}</span>
    </button>
  )
}

export function LinkButton({
  text, link
}: {
  text: string;
  link: string;
}) {
  return (
    <Link to={link} className="opacity-80 hover:opacity-100 hover:font-tx">
      <span>&gt; {text}</span>
    </Link>
  )
}