import { useState, useEffect, useRef } from 'react'
import * as pdfjs from 'pdfjs-dist/build/pdf'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url'
import { renderAsync } from 'docx-preview'
import { fileKind, downloadFile } from '../lib.js'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
const clamp = (v) => Math.min(300, Math.max(50, v))

/* Scroll area with two-finger pinch zoom. children(width) gets the usable width. */
function Zoomable({ zoom, setZoom, children }) {
  const wrap = useRef(null)
  const inner = useRef(null)
  const zoomRef = useRef(zoom)
  const [width, setWidth] = useState(0)
  zoomRef.current = zoom

  useEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    let d0 = 0, z0 = 100, live = 1
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const start = (e) => { if (e.touches.length === 2) { d0 = dist(e.touches); z0 = zoomRef.current; live = 1 } }
    const move = (e) => {
      if (e.touches.length !== 2 || !d0) return
      e.preventDefault()
      live = clamp((z0 * dist(e.touches)) / d0) / z0
      inner.current.style.transform = `scale(${live})`
    }
    const end = (e) => {
      if (!d0 || e.touches.length >= 2) return
      inner.current.style.transform = ''
      setZoom(Math.round(z0 * live))
      d0 = 0
    }
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', end)
    return () => {
      ro.disconnect()
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
      el.removeEventListener('touchcancel', end)
    }
  }, [setZoom])

  return (
    <div ref={wrap} className="h-full overflow-auto bg-slate-200 p-2" style={{ touchAction: 'pan-x pan-y' }}>
      <div ref={inner} style={{ transformOrigin: 'top center' }}>{children(Math.max(width - 16, 100))}</div>
    </div>
  )
}

function PdfPage({ pdf, num, width }) {
  const ref = useRef(null)
  useEffect(() => {
    let task, dead = false
    pdf.getPage(num).then((page) => {
      if (dead) return
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, 4096 / width))
      const vp = page.getViewport({ scale: (width / base.width) * dpr })
      const c = ref.current
      c.width = vp.width
      c.height = vp.height
      c.style.width = `${width}px`
      c.style.height = `${vp.height / dpr}px`
      task = page.render({ canvasContext: c.getContext('2d'), viewport: vp })
      task.promise.catch(() => {})
    })
    return () => { dead = true; task?.cancel() }
  }, [pdf, num, width])
  return <canvas ref={ref} className="mx-auto mb-3 block bg-white shadow" />
}

function PdfViewer({ url, zoom, setZoom, fail }) {
  const [pdf, setPdf] = useState(null)
  useEffect(() => {
    const task = pdfjs.getDocument(url)
    task.promise.then(setPdf).catch(fail)
    return () => task.destroy()
  }, [url])
  if (!pdf) return <p className="p-10 text-center text-slate-500">Loading document…</p>
  return (
    <Zoomable zoom={zoom} setZoom={setZoom}>
      {(w) => Array.from({ length: pdf.numPages }, (_, i) => (
        <PdfPage key={i} pdf={pdf} num={i + 1} width={(w * zoom) / 100} />
      ))}
    </Zoomable>
  )
}

function ImageViewer({ url, zoom, setZoom }) {
  return (
    <Zoomable zoom={zoom} setZoom={setZoom}>
      {(w) => <img src={url} alt="" className="mx-auto block" style={{ width: (w * zoom) / 100, maxWidth: 'none' }} />}
    </Zoomable>
  )
}

function DocxViewer({ url, zoom, setZoom, fail }) {
  const host = useRef(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(url).then((r) => r.blob())
      .then((b) => renderAsync(b, host.current, null, { inWrapper: true }))
      .catch(fail).finally(() => setLoading(false))
  }, [url])
  return (
    <>
      {loading && <p className="p-10 text-center text-slate-500">Loading document…</p>}
      <Zoomable zoom={zoom} setZoom={setZoom}>
        {(w) => <div ref={host} style={{ zoom: (Math.min(1, w / 800) * zoom) / 100 }} />}
      </Zoomable>
    </>
  )
}

export default function PreviewModal({ notice, onClose }) {
  const [zoom, setZoom] = useState(100)
  const [failed, setFailed] = useState(false)
  const kind = fileKind(notice)
  const canZoom = ['pdf', 'image', 'docx', 'office'].includes(kind) && !failed
  const step = (d) => setZoom((z) => clamp(z + d))
  const fail = () => setFailed(true)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const btn = 'h-9 min-w-9 px-3 rounded-md bg-slate-700 text-white font-bold hover:bg-slate-600 disabled:opacity-40'
  const v = { url: notice.file_url, zoom, setZoom, fail }

  let body
  if (failed || kind === 'other') {
    body = (
      <div className="h-full grid place-items-center p-6 text-center text-slate-600 bg-slate-200">
        <div className="space-y-3">
          <p>This file can't be previewed here.</p>
          <button onClick={() => downloadFile(notice)} className="rounded-lg bg-blue-900 text-white font-semibold px-5 py-2">Download file</button>
        </div>
      </div>
    )
  } else if (kind === 'pdf') body = <PdfViewer {...v} />
  else if (kind === 'image') body = <ImageViewer {...v} />
  else if (kind === 'docx') body = <DocxViewer {...v} />
  else body = (
    <div className="h-full overflow-auto bg-slate-200">
      <div style={{ width: `${zoom}%`, height: `${zoom}%`, overflow: 'hidden' }}>
        <iframe title={notice.title} className="border-0 bg-white"
          style={{ width: `${10000 / zoom}%`, height: `${10000 / zoom}%`, transform: `scale(${zoom / 100})`, transformOrigin: '0 0' }}
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(notice.file_url)}`} />
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white">
        <p className="min-w-0 flex-1 font-semibold truncate">{notice.title}</p>
        <button className={btn} disabled={!canZoom} onClick={() => step(-25)} aria-label="Zoom out">−</button>
        <span className="w-12 text-center text-sm">{canZoom ? `${zoom}%` : '—'}</span>
        <button className={btn} disabled={!canZoom} onClick={() => step(25)} aria-label="Zoom in">+</button>
        <button className={btn} disabled={!canZoom} onClick={() => setZoom(100)}>Reset</button>
        <button className="h-9 px-4 rounded-md bg-red-600 font-semibold hover:bg-red-500" onClick={onClose}>Close</button>
      </div>
      <div className="flex-1 min-h-0">{body}</div>
    </div>
  )
}