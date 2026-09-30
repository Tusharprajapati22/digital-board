import { createClient } from '@supabase/supabase-js'

export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const BUCKET = 'Digitalboard'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
  return res.json()
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export async function downloadFile(n) {
  try {
    const blob = await (await fetch(n.file_url)).blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = n.file_name || n.title
    a.click()
    URL.revokeObjectURL(a.href)
  } catch {
    window.open(n.file_url, '_blank')
  }
}
