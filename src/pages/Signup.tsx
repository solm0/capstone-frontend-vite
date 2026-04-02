import { useState } from "react"
import { signup } from "../api"
import Button, { LinkButton } from "../components/Button"
import SystemMessage from "../components/SystemMessage"

export default function Signup(){
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [msg,setMsg]=useState("")

  async function submit(){

    if (email.trim() && password.trim()) {
      const res=await signup(email,password);

      if (res.detail) {
        const errMsg = Array.isArray(res.detail)
          ? res.detail[0].msg
          : res.detail || "error"
        setMsg(errMsg)
      } else setMsg("email sent.")
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
        <Button text="sign up" onClick={submit} />
      </div>

      <SystemMessage msg={msg} />

      <div className="flex flex-col">
        <LinkButton text="already have an account?" link="/login" />
      </div>
    </>
  )
}