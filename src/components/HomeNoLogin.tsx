import { Link } from "react-router-dom";

export default function HomeNoLogin() {
  return (
    <>
      <Link to={'/login'}>
        <div className="fixed top-4 left-4 w-10 h-10 bg-black rounded-full active:scale-[80%] transition-all ease-in-out"></div>
      </Link>
      <div className="font-xtypewriter">home no login</div>
    </>
  )
}