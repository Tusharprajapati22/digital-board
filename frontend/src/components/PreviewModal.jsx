import { useState, useEffect } from 'react'

export default function PreviewModal({ notice, onClose }) {
  const [zoom, setZoom] = useState(100)
  const isPdf = notice.file_type?.includes('pdf') || /\.pdf($|\?)/i.test(notice.file_url)
  const isImage = notice.file_type?.startsWith('image') || /\.(png|jpe?g|gif|webp)($|\?)/i.test(notice.file_url)
  const step = (d) => setZoom((z) => Math.min(300, Math.max(50, z + d)))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const btn = 'h-9 min-w-9 px-3 rounded-md bg-slate-700 text-white font-bold hover:bg-slate-600'
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-800 text-white">
        <p className="font-semibold truncate">{notice.title}</p>
        <div className="flex items-center gap-2">
          <button className={btn} onClick={() => step(-25)} aria-label="Zoom out">−</button>
          <span className="w-14 text-center text-sm">{zoom}%</span>
          <button className={btn} onClick={() => step(25)} aria-label="Zoom in">+</button>
          <button className={btn} onClick={() => setZoom(100)}>Reset</button>
          <button className="h-9 px-4 rounded-md bg-red-600 font-semibold hover:bg-red-500" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-200">
        {isImage ? (
          <img src={notice.file_url} alt={notice.title}
            style={{ width: `${zoom}%`, maxWidth: 'none' }} className="mx-auto block" />
        ) : isPdf ? (
          <iframe key={zoom} title={notice.title} src={`${notice.file_url}#zoom=${zoom}`}
            className="w-full h-full border-0" />
        ) : (
          <div className="h-full grid place-items-center text-slate-600">
            Preview isn't available for this file type. Use Download instead.
          </div>
        )}
      </div>
    </div>
  )
}
