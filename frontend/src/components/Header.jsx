import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" alt="College logo" className="h-12 w-12 shrink-0" />
          <h1 className="text-lg sm:text-2xl font-extrabold leading-tight text-blue-900">
            Navjeevan Education's Society College of Engineering
          </h1>
        </Link>
        <Link
          to="/admin"
          className="shrink-0 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Admin Login
        </Link>
      </div>
    </header>
  )
}
