import { useState } from "react"
import { login } from "../api"
import { useNavigate } from "react-router-dom"
import Button, { LinkButton } from "../components/Button"
import SystemMessage from "../components/SystemMessage"

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
      setMsg("enter your email and password.")
    }
  }

  return(
    <>
      <div className="flex gap-2 w-auto">
        <input
          type="text"
          placeholder="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          className="bg-transparent border-b border-gray-800 focus:outline-none w-72 opacity-30 focus:opacity-100"
          autoFocus
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          className="bg-transparent border-b border-gray-800 focus:outline-none opacity-30 focus:opacity-100"
        />
        <Button text="login" onClick={submit} />
      </div>

      <SystemMessage msg={msg} />

      <div className="flex flex-col">
        <LinkButton text="create an account" link="/signup" />
        <LinkButton text="forgot password?" link="/reset-request" />
      </div>

    </>
  )
}