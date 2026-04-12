import { useEffect, useState } from "react";
import { getHistory } from "../api";
import Modal from "../components/Modal";
import Button, { LinkButton } from "../components/Button";


export default function History() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPoem, setSelectedPoem] = useState<{id:number,isCurrent:boolean,last_line:string}|null>(null);

  useEffect(() => {
    getHistory().then((data) => {
      setHistory(data.history);
      setLoading(false);
    });

  }, []);
    console.log(history)
  if (loading) return <div>loading...</div>;

  function handleSelectPoem (poemId?: number) {
    if (!poemId) return;
  }

  //await selectTodayPoem(poemId)

  return (
    <div className="absolute w-screen h-screen font-it p-3">

        <h1 className="p-4">history</h1>
        <LinkButton text="go to dashboard" link="/" />

        <div className="flex flex-wrap items-center gap-3">
          {history.map((poem) => (
            <button
              key={poem.poem_id}
              className={`
                ${poem.isCurrent ? 'bg-yellow-300' : 'bg-neutral-300'}
                w-60 h-auto flex flex-col items-center justify-center hover:bg-neutral-400 transition-colors
              `}
              onClick={() => {
                setModalOpen(true);
                setSelectedPoem({id:poem.poem_id, isCurrent: poem.isCurrent, last_line: poem.last_line.text});
              }}
            >
              <h2>title: {poem.lines.length > 5 ? poem.title : '??'}</h2>
              <p>author: {poem.lines.length > 3 ? poem.author : '??'}</p>

              <ul>
                <li>
                  {`spent ${poem.lines.length} ${poem.lines.length > 1 ? 'days' : 'day'} (since ${poem.lines[0].date})`}
                </li>
                <li>
                  progress: {poem.progress_percent}%
                </li>
                <li>
                  ...{poem.last_line.text}
                </li>
              </ul>
            </button>
          ))}
        </div>

        {/* 과거 시 선택 모달 */}
        <Modal
          isOpen={modalOpen}
          setIsOpen={setModalOpen}
          content={
            <>
              <p>{`make this poem current? you start from the last line '${selectedPoem?.last_line}'`}</p>
              <div className="flex flex-col items-start">
                <div className={` flex gap-2
                  ${selectedPoem?.isCurrent ? 'pointer-events-auto' : 'pointer-events-none'}
                `}>
                  <Button text="yes" onClick={() => handleSelectPoem(selectedPoem?.id)} disabled />
                  <p className="opacity-100">this poem is already current</p>
                </div>
                <Button text="cancel" onClick={() => setModalOpen(false)} />
              </div>
            </>
          }
        />
    </div>
  )
}