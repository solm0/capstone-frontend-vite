import { Link } from "react-router-dom";

export default function Button({
  text, onClick, disabled = false
}: {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`
        hover:opacity-100 hover:font-tx
        ${disabled ? 'opacity-30' : 'opacity-80'}
      `}
      onClick={() => onClick()}
    >
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