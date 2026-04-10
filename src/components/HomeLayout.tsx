import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { verifyToken } from "../api";
import SystemMenu from "./SystemMenu";

export default function HomeLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    verifyToken().then(setUser);
  }, []);

  return (
    <>
      <SystemMenu user={user} />
      <Outlet context={user} />
    </>
  )
}