import { useNavigate } from "react-router-dom"

export default function SystemMenu() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <div className="fixed bottom-5 left-5" style={{ zIndex: 1000 }}>
      <button
        className={`
          flex items-center justify-center rounded-full transition-all duration-300 bg-[#E5FF00] w-8 h-8
        `}
        onClick={logout}
      >
      </button>
    </div>
  )
}