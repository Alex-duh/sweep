import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'

export function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Nav />
      <main className="flex-1 pt-14 animate-fade-in-up">
        <div className="max-w-xl mx-auto px-8 py-20">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-6">
            About
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight leading-tight">
            What is Sweep?
          </h1>
          <div className="mt-8 space-y-5 text-base text-zinc-600 leading-relaxed">
            <p>
              You circled in the bubble on your first AP test, agreeing to
              College Board emails thinking: <em>"what if Harvard actually
              reaches out?"</em> What you got instead was tens of emails per
              day from schools you've never heard of, in states you've never
              visited, all insisting you're a "perfect fit." Every single day.
            </p>
            <p>
              Sweep fixes that. It scans your inbox, identifies college
              recruitment spam using a combination of rule-based pattern
              matching and AI, then archives it — quietly, automatically, and
              reversibly.
            </p>
            <p>
              Connect your Gmail, see exactly what will be archived, and confirm
              with one click. Nothing is deleted. Everything moves to your
              archive and stays searchable anytime.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
