import type { ReactNode } from "react";

export default function Modal({
  isOpen, setIsOpen, content, size = 'l'
}: {
  isOpen: boolean; setIsOpen: (open: boolean) => void; content: ReactNode;
  size?: string;
}) {
  return (
    <div className={`absolute top-0 left-0 w-screen h-screen flex items-center justify-center p-20 pointer-events-none`}>
      <div onClick={() => setIsOpen(false)} className={`absolute w-full h-full opacity-50 z-0 ${isOpen ? 'bg-gray-500 pointer-events-auto' : 'bg-transparent pointer-events-none'} transition-colors duration-300`}></div>
      {isOpen && 
        <div className="top-0 left-0 w-full h-full bg-gray-200 z-10 pointer-events-auto">
          {content}
        </div>
      }
    </div>
  )
}