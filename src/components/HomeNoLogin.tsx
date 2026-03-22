import { Link } from "react-router-dom";

export default function HomeNoLogin() {
  return (
    <>
      <Link to={'/login'}>
        <div className="fixed top-4 left-4">login</div>
      </Link>
      <div className="font-xtypewriter">home no login</div>
    </>
  )
}