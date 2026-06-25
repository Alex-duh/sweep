import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Sweep" className="h-6 w-6 object-contain" />
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">Sweep</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/about" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">About</Link>
          <Link to="/privacy" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Privacy</Link>
          <Link to="/contact" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Contact</Link>
          <Button asChild size="sm">
            <Link to="/gate">Launch</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
