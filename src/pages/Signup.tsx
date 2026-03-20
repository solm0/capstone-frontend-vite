import { useState } from "react"
import { signup } from "../api"

export default function Signup(){

  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [msg,setMsg]=useState("")

  async function submit(){
    const res=await signup(email,password)
    setMsg(res.message)
  }

  return(
    <div>
      <h2>Create account</h2>

      <input
        placeholder="email"
        value={email}
        onChange={e=>setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={e=>setPassword(e.target.value)}
      />

      <button onClick={submit}>
        go!
      </button>

      <div>{msg}</div>
    </div>
  )
}