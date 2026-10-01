import { useEffect, useState } from 'react'
import { api, fmtDate, downloadFile } from '../lib.js'
import PreviewModal from '../components/PreviewModal.jsx'

export default function Home() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [locked, setLocked] = useState(null)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  useEffect(() => {
    api('/api/digitalboard')
      .then(setNotices)
      .catch(() => setError("Couldn't load documents. Check that the server is running."))
      .finally(() => setLoading(false))
  }, [])

  const open = (n) => {
    if (n.view_password) { setLocked(n); setPw(''); setPwError(false) }
    else setPreview(n)
  }
  const unlock = (e) => {
    e.preventDefault()
    if (pw === locked.view_password) { setPreview(locked); setLocked(null) }
    else setPwError(true)
  }

  if (loading) return <p className="text-center text-slate-500 py-20">Loading documents…</p>
  if (error) return <p className="text-center text-red-600 py-20">{error}</p>
  if (!notices.length) return <p className="text-center text-slate-500 py-20">No documents have been posted yet.</p>

  return (
    <>
      <ul className="space-y-3">
        {notices.map((n) => (
          <li key={n.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <span className="inline-block rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1">
                {n.subject}
              </span>
              <h2 className="mt-2 text-lg font-bold truncate">
                {n.view_password && <span title="Password protected">🔒 </span>}{n.title}
              </h2>
              <p className="text-sm text-slate-500">{fmtDate(n.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => open(n)} className="rounded-lg bg-blue-900 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-800">View</button>
              <button onClick={() => downloadFile(n)} className="rounded-lg border border-slate-300 text-sm font-semibold px-4 py-2 hover:bg-slate-100">Download</button>
            </div>
          </li>
        ))}
      </ul>

      {locked && (
        <div className="fixed inset-0 z-40 bg-black/50 grid place-items-center p-4">
          <form onSubmit={unlock} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
            <h3 className="font-bold text-lg">Enter view password</h3>
            <input autoFocus type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Password" />
            {pwError && <p className="text-sm text-red-600">Incorrect password. Try again.</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setLocked(null)} className="px-4 py-2 rounded-lg border border-slate-300">Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-blue-900 text-white font-semibold">Open document</button>
            </div>
          </form>
        </div>
      )}
      {preview && <PreviewModal notice={preview} onClose={() => setPreview(null)} />}
    </>
  )
}