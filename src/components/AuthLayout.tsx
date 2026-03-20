import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <>
      <Link to={'/'}>
        <div className="fixed top-4 left-4 w-10 h-10 bg-black rounded-full active:scale-[80%] transition-all ease-in-out"></div>
      </Link>
      <Outlet />
    </>
  )
}