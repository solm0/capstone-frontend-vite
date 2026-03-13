import { useState } from "react"
import { requestReset } from "../api"

export default function ResetRequest(){

  const [email,setEmail]=useState("")
  const [msg,setMsg]=useState("")

  async function submit(){
    const res=await requestReset(email)
    setMsg(res.message)
  }

  return(
    <div>

      <h2>Password reset</h2>

      <input
        value={email}
        onChange={e=>setEmail(e.target.value)}
      />

      <button onClick={submit}>
        request reset
      </button>

      <div>{msg}</div>

    </div>
  )
}