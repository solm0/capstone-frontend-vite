import { useEffect, useState } from "react"
import { verifyToken } from "../api"
import HomeDashboard from "../components/HomeDashboard"
import type { User } from "../types";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyToken().then((data) => {
      setUser(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>loading...</div>

  return <HomeDashboard user={user} />
}