import { useState } from "react"
import { resetPassword } from "../api"
import SystemMessage from "../components/SystemMessage"
import Button, { LinkButton } from "../components/Button"

export default function ResetPassword(){

  const url=new URL(window.location.href)
  const token=url.searchParams.get("token")||""

  const [pw,setPw]=useState("")
  const [msg,setMsg]=useState("")

  async function submit(){
    if (pw.trim()) {
      const res=await resetPassword(token,pw);

      if (res.detail) {
        const errMsg = Array.isArray(res.detail)
          ? res.detail[0].msg
          : res.detail || "error"
        setMsg(errMsg)
      } else setMsg("your password was reset.")
    } else {
      setMsg('enter your new password.')
    }
  }

  return(
    <>
      <div className="flex gap-2 w-auto">
        <input
          type="password"
          placeholder="password"
          value={pw}
          onChange={e=>setPw(e.target.value)}
          className="bg-transparent border-b border-gray-800 focus:outline-none opacity-30 focus:opacity-100"
        />
        <Button text="change password" onClick={submit} />
      </div>

      <SystemMessage msg={msg} />
      {msg === 'your password was reset.' && <LinkButton link="/login" text="login" />}
    </>
  )
}