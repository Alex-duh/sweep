import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConnectPageProps {
  onConnect: () => void
}

export function ConnectPage({ onConnect }: ConnectPageProps) {
  return (
    <div className="pt-20 pb-16 px-4 animate-fade-in-up">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-sm px-8 py-10">

          <h1 className="text-3xl font-semibold text-zinc-900 leading-tight tracking-tight">
            Clear the recruitment<br />spam from your inbox.
          </h1>

          <div className="flex items-center gap-2 mt-3">
            <ShieldCheck className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <p className="text-sm text-zinc-500">
              Archive only — nothing is ever deleted.
            </p>
          </div>

          <div className="mt-10">
            <Button size="lg" onClick={onConnect} className="w-full">
              Connect Gmail
            </Button>
          </div>

          <p className="mt-5 text-xs text-zinc-400 leading-relaxed">
            College recruitment spam only.<br />Nothing else in your inbox is touched.
          </p>

        </div>
      </div>
    </div>
  )
}
