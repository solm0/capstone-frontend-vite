import { useState } from "react"
import { resetPassword } from "../api"

export default function ResetPassword(){

  const url=new URL(window.location.href)
  const token=url.searchParams.get("token")||""

  const [pw,setPw]=useState("")
  const [msg,setMsg]=useState("")

  async function submit(){
    if (pw.trim()) {
      const res=await resetPassword(token,pw)
      setMsg(res.message)
    } else {
      setMsg('enter the new password')
    }
    
  }

  return(
    <div>

      <h2>New password</h2>

      <input
        type="password"
        placeholder="enter new password"
        value={pw}
        onChange={e=>setPw(e.target.value)}
      />

      <button onClick={submit}>
        change password
      </button>

      <div>{msg}</div>

    </div>
  )
}