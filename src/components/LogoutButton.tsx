import { useNavigate } from "react-router-dom"

export default function LogoutButton() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <div>
      <button onClick={logout}>logout</button>
    </div>
  )
}