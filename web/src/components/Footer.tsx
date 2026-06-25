import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 py-6">
      <div className="max-w-5xl mx-auto px-8 flex items-center justify-between text-xs text-zinc-400">
        <span>© 2026 Sweep</span>
        <div className="flex items-center gap-5">
          <Link to="/about" className="hover:text-zinc-700 transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-zinc-700 transition-colors">Privacy</Link>
          <Link to="/contact" className="hover:text-zinc-700 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
