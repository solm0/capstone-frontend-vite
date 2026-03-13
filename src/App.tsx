import { useEffect, useState } from "react"

export default function App() {
  const [hello, setHello] = useState({ message: "" })

  useEffect(() => {
    fetch("http://localhost:8000/api/hello")
      .then(res => res.json())
      .then(data => setHello(data))
  }, [])

  return (
    <div>{hello.message}</div>
  )
}