import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <>
      <Link to={'/'}>
        <div className="fixed top-4 left-4">home</div>
      </Link>
      <Outlet />
    </>
  )
}