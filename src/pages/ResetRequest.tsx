import { useState } from "react"
import { requestReset } from "../api"
import Button from "../components/Button"
import SystemMessage from "../components/SystemMessage"

export default function ResetRequest(){

  const [email,setEmail]=useState("")
  const [msg,setMsg]=useState("")

  async function submit(){
    if (email.trim()) {
      const res=await requestReset(email);

      if (res.detail) {
        const errMsg = Array.isArray(res.detail)
          ? res.detail[0].msg
          : res.detail || "error"
        setMsg(errMsg)
      } else setMsg("email sent.")
    } else {
      setMsg("enter your email.")
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
        <Button text="request reset" onClick={submit} />
      </div>

      <SystemMessage msg={msg} />
    </>
  )
}