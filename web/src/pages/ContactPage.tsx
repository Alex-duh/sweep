import { useState } from 'react'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { API_URL } from '@/lib/api'

export function ContactPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'slow' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setStatus('sending')
    const ctrl = new AbortController()
    const slowTimer = setTimeout(() => setStatus('slow'), 5000)
    const abortTimer = setTimeout(() => ctrl.abort(), 60000)
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
        signal: ctrl.signal,
      })
      clearTimeout(slowTimer)
      clearTimeout(abortTimer)
      if (!res.ok) throw new Error('server error')
      setStatus('sent')
    } catch {
      clearTimeout(slowTimer)
      clearTimeout(abortTimer)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Nav />
      <main className="flex-1 pt-14 animate-fade-in-up">
        <div className="max-w-xl mx-auto px-8 py-20">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-6">
            Contact
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight leading-tight">
            Get in touch.
          </h1>

          {status === 'sent' ? (
            <div className="mt-10 rounded-lg bg-amber-50 border border-amber-200 px-5 py-4">
              <p className="text-sm text-amber-800 font-medium">Message received.</p>
              <p className="text-sm text-amber-700 mt-1">Thanks for reaching out.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="What's this about?"
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Your message..."
                  rows={5}
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent resize-none"
                  required
                />
              </div>
              {status === 'error' && (
                <p className="text-xs text-red-500">Something went wrong — try again.</p>
              )}
              <Button type="submit" size="lg" disabled={status === 'sending' || status === 'slow'}>
                {status === 'slow' ? 'Waking up server…' : status === 'sending' ? 'Sending…' : 'Send message'}
              </Button>
              {status === 'slow' && (
                <p className="text-xs text-zinc-400">Server was asleep — this takes up to 30 seconds on first use.</p>
              )}
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
