import { useEffect, useState } from "react"
import { verifyToken } from "../api/api"
import HomeNoLogin from "../components/HomeNoLogin"
import HomeDashboard from "../components/HomeDashboard"

export default function Home() {
  const [auth, setAuth] = useState<boolean | null>(null)

  useEffect(() => {
    verifyToken().then(setAuth)
  }, [])

  if (auth === null) return <div>loading...</div>
  return auth ? <HomeDashboard /> : <HomeNoLogin />
}