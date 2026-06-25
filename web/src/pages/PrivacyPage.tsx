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
              Sweep is in early access. Here's exactly what we collect
              and what we don't.
            </p>
            <p>
              When you join the waitlist, we store your name and email
              address so we can reach you when access opens. Contact form
              messages are stored to allow us to respond. That's the full
              extent of it — no tracking, no ads, no third parties.
            </p>
            <p>
              Sweep does not have access to your Gmail inbox in the current
              version. When Gmail access launches, your emails will be read
              only to identify recruitment messages and immediately
              discarded. No email content, subject lines, or sender
              information will ever be stored on our servers.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
