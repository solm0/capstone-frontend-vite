import { useState } from "react"
import { login } from "../api"
import { Link, useNavigate } from "react-router-dom"
import Button from "../components/Button"

export default function Login(){

  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [msg,setMsg]=useState("")

  const navigate = useNavigate();

  async function submit(){

    if (email.trim() && password.trim()) {
      const res=await login(email,password)
  
      if (res.access_token) {
        localStorage.setItem("token",res.access_token)
        navigate('/')
      } else {
        // detail이 배열이면 첫번째 msg만 꺼내고, 문자열이면 그대로
        const errMsg = Array.isArray(res.detail)
          ? res.detail[0].msg
          : res.detail || "error"
        setMsg(errMsg)
      }
    } else {
      setMsg("enter email and password")
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

      <Button text="login" onClick={submit} />

      <div className="text-red-600">{msg}</div>

      <div className="flex flex-col">
        <Link to={'/signup'}>create account</Link>
        <Link to={'/reset-request'}>forgot password?</Link>
      </div>

    </div>
  )
}