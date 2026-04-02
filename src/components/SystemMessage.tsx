export default function SystemMessage({msg}:{msg:string}){
  const successMsg=['email sent.', "your password was reset."]
  return <div className={`${successMsg.includes(msg) ? 'text-gray-800' : 'text-red-600'} text-sm w-72`}>{msg}</div>
}