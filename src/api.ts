const API = import.meta.env.VITE_API_ENDPOINT

export async function signup(email:string,password:string){
  return fetch(API+"/signup",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({email,password})
  }).then(r=>r.json())
}

export async function login(email:string,password:string){
  return fetch(API+"/login",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({email,password})
  }).then(r=>r.json())
}

export async function requestReset(email:string){
  return fetch(API+"/request-password-reset",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({email})
  }).then(r=>r.json())
}

export async function resetPassword(token:string,new_password:string){
  return fetch(API+"/reset-password",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({token,new_password})
  }).then(r=>r.json())
}

export async function verifyToken() {
  const token = localStorage.getItem("token")
  if (!token) return false
  const res = await fetch(API+"/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.ok
}