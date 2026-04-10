import { useEffect, useState } from "react";
import { getHistory } from "../api";


export default function History() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then((data) => {
      setHistory(data.history);
      setLoading(false);
    });

  }, []);
    console.log(history)
  if (loading) return <div>loading...</div>;

  const today = new Date;

  const isRecent = (date: string) => {
    console.log(date)
    return (
      (today.getTime() - new Date(date).getTime()) /
        (1000 * 60 * 60 * 24) <=
      7
    );
  };

  return (
    <div className="absolute w-screen h-screen font-it p-3">

        <h1 className="p-4">history</h1>

        <button className="flex flex-wrap items-center gap-3">
          {history.map((poem) => (
            <div
              key={poem.poem_id}
              className={`
                ${isRecent(poem.lines[poem.lines.length-1].date) ? 'bg-yellow-300' : 'bg-neutral-300'}
                w-60 h-32 flex flex-col items-center justify-center hover:bg-neutral-400 transition-colors
              `}
            >
              <h2>{poem.title}</h2>
              <p>{poem.author}</p>

              <ul>
                {poem.lines.map((line: any, i: number) => (
                  <li key={i}>
                    start date: {line.date}
                  </li>
                ))}
                <li>
                  {`${poem.lines.length} ${poem.lines.length > 1 ? 'days' : 'day'}`}
                </li>
              </ul>
            </div>
          ))}
        </button>
    </div>
  )
}