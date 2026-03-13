import { useState } from "react"
import { login } from "../api"

export default function Login(){

  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [msg,setMsg]=useState("")

  async function submit(){

    const res=await login(email,password)

    if(res.access_token){
      localStorage.setItem("token",res.access_token)
      setMsg("login success")
    }else{
      setMsg(res.detail || "error")
    }
  }

  return(
    <div>

      <h2>Login</h2>

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
        login
      </button>

      <div>{msg}</div>

    </div>
  )
}