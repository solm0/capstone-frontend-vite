import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="font-tt flex flex-col h-screen justify-center items-center gap-7 w-auto">
      <div className="flex flex-col items-center">
        <h1 className="">lexiome</h1>
        <Link to={'/'}>
          <div className="w-4 h-4 bg-gray-700 hover:rounded-full"></div>
        </Link>
      </div>
      <Outlet />
    </div>
  )
}