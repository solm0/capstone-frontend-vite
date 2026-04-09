import { useState } from "react";
import { LinkButton } from "../components/Button";
import { songs } from "../assets/data/playground-songs";

export default function Playground(){
  const [idx, setIdx] = useState(songs.length-1);
  const [isCursive, setisCursive] = useState(false);

  return(
    <div className="font-tt text-neutral-500 w-screen h-screen absolute top-0 left-0 bg-neutral-900 flex gap-3 pt-20 px-3 overflow-hidden">
      
      <div className="w-full h-full flex flex-col items-center gap-6 pb-10">
        <iframe
          width="426"
          height="240"
          className="shrink-0"
          src={`${songs[idx].link}&showinfo=0&controls=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
        />
        <div
          className={`text-sm h-full w-full overflow-y-scroll flex flex-col gap-2 text-neutral-400 ${isCursive ? 'font-it text-[101%]' : 'font-tt'}`}
        >
          {songs[idx].lyrics.map((l, i) => 
            l === "" ? <br /> : 
            <p key={i}>{l}</p>
          )}
        </div>
      </div>

      <aside className="text-sm w-44 h-full flex flex-col items-start text-left shrink-0">
        <p className="text-neutral-400">Music Box</p>
        <LinkButton link="/" text="back to Lexiome" />
        <p className="text-xs mt-[1em]">Weekly dig through post-punk, synthpop, shoegaze, and darkwave in Russian (may include other languages)</p>
        <button className="text-xs mt-[1em] flex gap-2 group" onClick={() => setisCursive(!isCursive)}>
          <span>{`font:`}</span>
          <span className={`group-hover:text-neutral-300 transition-colors ${isCursive ? 'font-it' : 'font-tt'}`}>{isCursive ? 'cursive' : 'print'}</span>
        </button>

        <nav className="flex flex-col-reverse items-start text-left mt-[1em] w-full overflow-y-scroll">
          {songs.map((s,i) => 
            <button
              key={i}
              className="w-full hover:text-neutral-300 transition-colors flex justify-between"
              onClick={() => setIdx(i)}
            >
              <span>{s.date}</span>
              {i === songs.length-1 && <span className="text-neutral-300">new!</span>}
            </button>
          )}
        </nav>
      </aside>
    </div>
  )
}