import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'

export function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Nav />
      <main className="flex-1 pt-14 animate-fade-in-up">
        <div className="max-w-xl mx-auto px-8 py-20">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-6">
            Privacy
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight leading-tight">
            Your data stays yours.
          </h1>
          <div className="mt-8 space-y-5 text-base text-zinc-600 leading-relaxed">
            <p>
              Sweep connects to Gmail using Google OAuth 2.0. You authorize
              access; Google handles authentication. Sweep only reads your inbox
              to identify recruitment messages — it never stores your emails or
              shares anything.
            </p>
            <p>
              Your credentials stay on your device. When you close the session,
              access ends.
            </p>
            <p>
              Sweep does not collect analytics, run ads, or share data with
              third parties.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
