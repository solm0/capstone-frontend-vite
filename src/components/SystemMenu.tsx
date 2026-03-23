import { useNavigate } from "react-router-dom"

export default function SystemMenu({ isOverTrash, isDragging }: {
  isOverTrash: boolean;
  isDragging: boolean;
}) {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const active = isDragging || isOverTrash;

  return (
    <div className="fixed bottom-5 left-5" style={{ zIndex: 1000 }}>
      <button
        className={`
          flex items-center justify-center rounded-full transition-all duration-300
          ${active ? 'bg-red-600' : 'bg-[#E5FF00]'}
          ${isOverTrash ? 'w-12 h-12' : 'w-8 h-8'}
        `}
        onClick={logout}
      >
        {active ? (
          // 휴지통 아이콘
          <svg
            viewBox="0 0 24 24"
            className={`transition-all duration-300 ${isOverTrash ? 'w-7 h-7' : 'w-5 h-5'}`}
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* 뚜껑 - isOverTrash일 때 왼쪽으로 살짝 회전 */}
            <g
              style={{
                transformOrigin: '3px 7px',
                transform: isOverTrash ? 'rotate(-25deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            >
              <line x1="3" y1="7" x2="21" y2="7" />
              <path d="M8 7V4h8v3" />
            </g>
            {/* 몸통 */}
            <rect x="5" y="9" width="14" height="13" rx="1" />
            {/* 안쪽 선 */}
            <line x1="9" y1="12" x2="9" y2="19" />
            <line x1="15" y1="12" x2="15" y2="19" />
          </svg>
        ) : (
          // 햄버거 아이콘
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        )}
      </button>
    </div>
  )
}