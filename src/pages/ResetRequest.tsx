import { useState } from "react"
import { requestReset } from "../api"

export default function ResetRequest(){

  const [email,setEmail]=useState("")
  const [msg,setMsg]=useState("")

  async function submit(){
    if (email.trim()) {
      const res=await requestReset(email)
      setMsg(res.message)
    } else {
      setMsg('enter your email')
    }
  }

  return(
    <div>

      <h2>Password reset</h2>

      <input
        value={email}
        placeholder="your email"
        onChange={e=>setEmail(e.target.value)}
      />

      <button onClick={submit}>
        request reset
      </button>

      <div>{msg}</div>

    </div>
  )
}