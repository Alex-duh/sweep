import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { TypewriterBg } from '@/components/TypewriterBg'
import { API_URL } from '@/lib/api'

export function HomePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'slow' | 'done' | 'error'>('idle')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setStatus('sending')
    const ctrl = new AbortController()
    // Render free tier cold-starts take up to 60s — show a "slow" message at 5s
    const slowTimer = setTimeout(() => setStatus('slow'), 5000)
    const abortTimer = setTimeout(() => ctrl.abort(), 60000)
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
        signal: ctrl.signal,
      })
      clearTimeout(slowTimer)
      clearTimeout(abortTimer)
      if (!res.ok) throw new Error('server error')
      setStatus('done')
    } catch {
      clearTimeout(slowTimer)
      clearTimeout(abortTimer)
      setStatus('error')
    }
  }

  return (
    <>
      <TypewriterBg />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center pt-14">
          <div className="max-w-md mx-auto px-8 text-center py-24">
            <img
              src="/logo.png"
              alt="Sweep"
              className="h-16 w-16 object-contain mx-auto mb-8"
            />
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-600 mb-4">
              Early access
            </p>
            <h1 className="text-4xl font-semibold text-zinc-900 leading-tight tracking-tight">
              Your inbox, minus<br />the recruitment spam.
            </h1>
            <p className="mt-5 text-base text-zinc-500 leading-relaxed max-w-sm mx-auto">
              Sweep finds college recruitment emails in your Gmail and archives
              them in one click. Nothing is deleted — everything stays
              recoverable.
            </p>

            {status === 'done' ? (
              <div className="mt-10">
                <p className="text-amber-700 font-semibold text-lg">You're on the list.</p>
                <p className="mt-1 text-sm text-zinc-500">
                  We'll reach out when access opens up.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="mt-10 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your Gmail address"
                  required
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                />
                {status === 'error' && (
                  <p className="text-xs text-red-500 text-left">Something went wrong — try again.</p>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={status === 'sending' || status === 'slow'}>
                  {status === 'slow' ? 'Waking up server…' : status === 'sending' ? 'Joining…' : 'Join the waitlist →'}
                </Button>
                {status === 'slow' && (
                  <p className="text-xs text-zinc-400 text-left">Server was asleep — this takes up to 30 seconds on first use.</p>
                )}
                <p className="text-xs text-zinc-400">
                  Archive only — nothing is ever deleted.
                </p>
              </form>
            )}

            <div className="mt-8">
              <Link to="/gate" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                Have early access? Launch →
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
