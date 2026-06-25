import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface PreviewPageProps {
  onArchive: () => void
  onCancel: () => void
}

const MOCK_EMAILS = [
  { sender: 'University of Michigan Admissions', from: 'admissions@emsihe.com',       subject: 'Students like you are discovering Michigan' },
  { sender: 'Stanford University',               from: 'outreach@stanford.edu',        subject: 'Visit Stanford this fall — open house' },
  { sender: 'Bucknell University',               from: 'visit@bucknell.edu',           subject: 'Schedule a campus tour — Fall 2026' },
  { sender: 'NYU Admissions',                    from: 'nyu@pardot.com',               subject: 'Explore your future at New York University' },
  { sender: 'Northeastern University',           from: 'enrollment@northeastern.edu',  subject: 'Start your application today, Alex' },
  { sender: 'UC Berkeley',                       from: 'admissions@berkeley.edu',      subject: 'Visit UC Berkeley — information session Nov 12' },
  { sender: 'Tulane University',                 from: 'recruitment@marketo.com',      subject: 'Students like you are finding their home at Tulane' },
  { sender: 'Bowdoin College',                   from: 'info@salesforceemail.com',     subject: 'Open House Invitation — Bowdoin College' },
  { sender: 'Vanderbilt Admissions',             from: 'outreach@vanderbilt.edu',      subject: 'Discover your potential at Vanderbilt' },
  { sender: 'Tufts University',                  from: 'admissions@tufts.edu',         subject: 'Campus tour sign-up — Tufts University' },
  { sender: 'Emory University',                  from: 'visit@emory.edu',              subject: 'I encourage you to apply — Emory University' },
  { sender: 'Georgetown University',             from: 'info@exacttarget.com',         subject: 'Explore Georgetown this fall' },
]

const COUNT = 247

export function PreviewPage({ onArchive, onCancel }: PreviewPageProps) {
  return (
    <div className="pt-20 pb-16 px-6 animate-fade-in-up">
      <div className="w-full max-w-2xl mx-auto">

        {/* Count hero */}
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-3">
            Sweep · Dry run
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-zinc-900 leading-none tabular-nums">
              {COUNT}
            </span>
            <span className="text-xl text-zinc-400 font-normal">
              recruitment emails found
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            Review the list below. Nothing is changed until you confirm.
          </p>
        </div>

        {/* Email list */}
        <Card className="mt-8 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-100">
            {MOCK_EMAILS.map((email, i) => (
              <div key={i} className="flex flex-col gap-0.5 px-5 py-3.5 bg-white">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-800 truncate">
                    {email.sender}
                  </span>
                  <span className="text-xs text-zinc-400 flex-shrink-0 font-mono">
                    {email.from}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 truncate">{email.subject}</p>
              </div>
            ))}
            <div className="px-5 py-3 bg-stone-50">
              <p className="text-xs text-zinc-400">
                + {COUNT - MOCK_EMAILS.length} more · scroll to see all
              </p>
            </div>
          </div>
        </Card>

        {/* Safety banner */}
        <div className="mt-5 flex items-center gap-2.5 bg-white rounded-lg px-4 py-3 border border-stone-200">
          <ShieldCheck className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <p className="text-sm text-zinc-500">
            Nothing is archived yet.{' '}
            <span className="font-medium text-zinc-700">Nothing is ever deleted</span>{' '}
            — archived emails stay in your Gmail, searchable anytime.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <Button size="lg" onClick={onArchive}>
            Archive {COUNT} emails
          </Button>
          <Button variant="ghost" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        </div>

      </div>
    </div>
  )
}
