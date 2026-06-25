import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DonePageProps {
  count: number
  onReset: () => void
}

export function DonePage({ count, onReset }: DonePageProps) {
  const [displayed, setDisplayed] = useState(0)

  // Count up from 0 to count over ~1.2 s
  useEffect(() => {
    const steps = 60
    const interval = 1200 / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = 1 - Math.pow(1 - step / steps, 3)
      setDisplayed(Math.round(progress * count))
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [count])

  return (
    <div className="pt-20 pb-16 px-4 animate-fade-in-up">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-sm px-8 py-10">

          <CheckCircle2
            className="w-14 h-14 text-amber-600 animate-pop-in"
            strokeWidth={1.5}
          />

          <div className="mt-8">
            <p className="text-8xl font-bold text-zinc-900 leading-none tabular-nums">
              {displayed}
            </p>
            <p className="text-lg text-zinc-400 font-normal mt-2">
              emails archived
            </p>
          </div>

          <p className="mt-8 text-sm text-zinc-500 leading-relaxed">
            Your inbox is cleaner. Nothing was deleted —
            everything is in your archive, searchable anytime.
          </p>

          <div className="mt-10">
            <Button variant="outline" size="lg" onClick={onReset} className="w-full">
              Run again
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
