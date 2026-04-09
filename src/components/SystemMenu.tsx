import { useState } from "react";
import { useNavigate } from "react-router-dom"
import type { User } from "../types";
import Button, { LinkButton } from "./Button";

export default function SystemMenu({
  user
}: {
  user: User | null;
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <>
      <div className={`z-10 bg-gray-500 w-screen h-screen absolute top-0 left-0 ${hovered ? 'opacity-50' : 'opacity-0'} transition-opacity pointer-events-none`}></div>
      <div
        className={`fixed bottom-0 left-0 p-4 ${hovered ? 'w-96 h-56' : 'w-12 h-12'} transition-all duration-300 font-tt`}
        style={{ zIndex: 1000 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          className={`
            absolute top-4 left-4 w-4 h-4 ${hovered ? 'bg-transparent' : 'bg-gray-700'} transition-all duration-300
          `}
        >
        </button>
        {hovered &&
          <div className=" bg-gray-200 p-4 flex flex-col w-full h-full items-start gap-1 text-sm">
            
            <div className="w-full flex justify-between">
              <span>{user ? user.email : 'you are not logged in.'}</span>
              {user ? <Button text="logout" onClick={logout} /> : <LinkButton link="login" text="login" />}
            </div>

            {user &&
              <div className="w-full flex justify-between">
                <span>achievements</span>
                <Button onClick={() => console.log('achievements more clicked')} text="more" />
              </div>
            }

            <div className="w-full flex justify-end">
              <LinkButton link="/playground" text="playground" />
            </div>
          </div>
        }
      </div>
    </>
  )
}