import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Nav } from '@/components/Nav'

interface PasswordGatePageProps {
  onAuth: () => void
  authed: boolean
}

const PASSWORD = 'cbsucks'

export function PasswordGatePage({ onAuth, authed }: PasswordGatePageProps) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  if (authed) return <Navigate to="/app" replace />

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value === PASSWORD) {
      onAuth()
      navigate('/app', { replace: true })
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Nav />
      <main className="flex-1 flex items-center justify-center pt-14">
        <div className="w-full max-w-sm mx-auto px-8 py-16">
          <img
            src="/logo.png"
            alt="Sweep"
            className="h-10 w-10 object-contain mb-8"
          />
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            Access Sweep
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Enter the password to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="password"
              value={value}
              onChange={e => { setValue(e.target.value); setError(false) }}
              placeholder="Password"
              autoFocus
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
            />
            {error && (
              <p className="text-xs text-red-500">Incorrect password.</p>
            )}
            <Button type="submit" size="lg" className="w-full">
              Continue
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
