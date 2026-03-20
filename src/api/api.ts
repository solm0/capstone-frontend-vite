export async function verifyToken() {
  const token = localStorage.getItem("token")
  if (!token) return false
  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.ok
}