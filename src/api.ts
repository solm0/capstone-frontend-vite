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

  if (!res.ok) return null

  const data = await res.json()
  return data   // { id, email }
}

export async function getToday() {
  const token = localStorage.getItem("token")

  const res = await fetch(API + "/today", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) throw new Error("failed to fetch today")

  return res.json()
}

export async function fetchLemma(lemma: string, pos: string) {
  const res = await fetch(
    `http://localhost:8000/lemma?lemma=${encodeURIComponent(lemma)}&pos=${pos}`
  );
  if (!res.ok) throw new Error();
  return res.json();
}