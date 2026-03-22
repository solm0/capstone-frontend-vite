import { useNavigate } from "react-router-dom"
import Button from "./Button"

export default function SystemMenu({
  isOverTrash
}: {
  isOverTrash: boolean;
}) {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <div className="fixed bottom-5 left-5 w-8 h-8" style={{zIndex: 1000}}>
      <button className={`w-8 h-8 rounded-full ${isOverTrash ? 'bg-red-600' : 'bg-[#E5FF00]'} transition-all duration-300`} onClick={logout}>
        
      </button>
    </div>
  )
}