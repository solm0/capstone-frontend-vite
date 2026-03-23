import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HomeNoLogin() {
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
  console.log(apiEndpoint);
  const [hello, setHello] = useState({ message: "" })

  useEffect(() => {
    fetch(`${apiEndpoint}/hello`)
      .then(res => res.json())
      .then(data => setHello(data))
  }, [])

  return (
    <>
      <Link to={'/login'}>
        <div className="fixed top-4 left-4">login</div>
      </Link>
      <div className="font-xtypewriter">{`home no login, ${hello.message}`}</div>
    </>
  )
}