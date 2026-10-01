import { useEffect, useState } from 'react'
import { api, supabase, BUCKET, fmtDate } from '../lib.js'

const ADMIN_PASSWORD = 'college@123'
const input = 'w-full border border-slate-300 rounded-lg px-3 py-2'

export default function Admin() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('admin') === '1')
  const [pass, setPass] = useState('')
  const [passErr, setPassErr] = useState(false)
  const [notices, setNotices] = useState([])
  const [form, setForm] = useState({ subject: '', title: '', view_password: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState(null)

  const load = () => api('/api/digitalboard').then(setNotices).catch(() => setMsg("Couldn't load documents."))
  useEffect(() => { if (authed) load() }, [authed])

  const login = (e) => {
    e.preventDefault()
    if (pass === ADMIN_PASSWORD) { sessionStorage.setItem('admin', '1'); setAuthed(true) }
    else setPassErr(true)
  }

  const upload = async (e) => {
    e.preventDefault()
    const formEl = e.target
    if (!file) return setMsg('Choose a file to upload.')
    setBusy(true); setMsg('')
    try {
      const path = `${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      await api('/api/digitalboard', {
        method: 'POST',
        body: JSON.stringify({ ...form, file_url: data.publicUrl, file_name: file.name, file_type: file.type }),
      })
      setForm({ subject: '', title: '', view_password: '' }); setFile(null)
      formEl.reset(); setMsg('Document published.'); load()
    } catch (err) { setMsg(`Upload failed: ${err.message}`) }
    setBusy(false)
  }

  const remove = async (n) => {
    if (!confirm(`Delete "${n.title}"?`)) return
    await api(`/api/Digitalboard/${n.id}`, { method: 'DELETE' }); load()
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    const { id, subject, title, view_password } = editing
    await api(`/api/Digitalboard/${id}`, { method: 'PUT', body: JSON.stringify({ subject, title, view_password }) })
    setEditing(null); load()
  }

  if (!authed) {
    return (
      <form onSubmit={login} className="max-w-sm mx-auto bg-white border border-slate-200 rounded-xl p-6 space-y-3 mt-10">
        <h2 className="text-xl font-bold">Admin login</h2>
        <input type="password" autoFocus className={input} placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {passErr && <p className="text-sm text-red-600">Incorrect password.</p>}
        <button className="w-full rounded-lg bg-blue-900 text-white font-semibold py-2">Log in</button>
      </form>
    )
  }

  return (
    <div className="space-y-8">
      <form onSubmit={upload} className="bg-white border border-slate-200 rounded-xl p-5 grid gap-3 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-xl font-bold">Upload document</h2>
        <input required className={input} placeholder="Subject name" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <input required className={input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className={input} placeholder="View password (optional)" value={form.view_password} onChange={(e) => setForm({ ...form, view_password: e.target.value })} />
        <input required type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" className={input} onChange={(e) => setFile(e.target.files[0])} />
        <div className="sm:col-span-2 flex items-center gap-4">
          <button disabled={busy} className="rounded-lg bg-blue-900 text-white font-semibold px-5 py-2 disabled:opacity-50">
            {busy ? 'Uploading…' : 'Publish document'}
          </button>
          {msg && <p className="text-sm text-slate-600">{msg}</p>}
        </div>
      </form>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">All documents ({notices.length})</h2>
          <button onClick={() => { sessionStorage.removeItem('admin'); setAuthed(false) }} className="text-sm underline text-slate-600">Log out</button>
        </div>
        {!notices.length && <p className="text-slate-500">No documents yet. Use the form above to publish one.</p>}
        <ul className="space-y-2">
          {notices.map((n) => (
            <li key={n.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{n.view_password && '🔒 '}{n.title}</p>
                <p className="text-sm text-slate-500">{n.subject} · {fmtDate(n.created_at)}</p>
              </div>
              <button onClick={() => setEditing({ ...n, view_password: n.view_password || '' })} className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100">Edit</button>
              <button onClick={() => remove(n)} className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500">Delete</button>
            </li>
          ))}
        </ul>
      </section>

      {editing && (
        <div className="fixed inset-0 z-40 bg-black/50 grid place-items-center p-4">
          <form onSubmit={saveEdit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold text-lg">Edit document</h3>
            <input required className={input} value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
            <input required className={input} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <input className={input} placeholder="View password (empty = none)" value={editing.view_password} onChange={(e) => setEditing({ ...editing, view_password: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-300">Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-blue-900 text-white font-semibold">Save changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}