import { useEffect, useState } from 'react'

const WORDS = [
  'archive', 'sweep', 'recruitment', 'spam', 'inbox',
  'admissions', 'outreach', 'enrollment', 'unsubscribe', 'college',
  'clean', 'filter', 'organize', 'declutter', 'remove',
]

function TypewriterWord({ startIdx = 0 }: { startIdx?: number }) {
  const [display, setDisplay] = useState('')
  const [wIdx, setWIdx] = useState(startIdx)
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    const word = WORDS[wIdx % WORDS.length]
    let t: ReturnType<typeof setTimeout>

    if (typing) {
      if (display.length < word.length) {
        t = setTimeout(() => setDisplay(word.slice(0, display.length + 1)), 110 + Math.random() * 70)
      } else {
        t = setTimeout(() => setTyping(false), 1800)
      }
    } else {
      if (display.length > 0) {
        t = setTimeout(() => setDisplay(d => d.slice(0, -1)), 65)
      } else {
        setWIdx(w => w + 1)
        setTyping(true)
      }
    }

    return () => clearTimeout(t)
  }, [display, typing, wIdx])

  return (
    <span className="text-stone-500 font-mono text-xs leading-7">
      {display}<span className="opacity-50">_</span>
    </span>
  )
}

export function TypewriterBg() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Top-right corner */}
      <div className="absolute top-20 right-6 flex flex-col gap-1 items-end opacity-25">
        <TypewriterWord startIdx={0} />
        <TypewriterWord startIdx={3} />
        <TypewriterWord startIdx={6} />
      </div>

      {/* Bottom-left corner */}
      <div className="absolute bottom-20 left-6 flex flex-col gap-1 opacity-25">
        <TypewriterWord startIdx={1} />
        <TypewriterWord startIdx={4} />
        <TypewriterWord startIdx={8} />
      </div>

      {/* Bottom-right corner */}
      <div className="absolute bottom-20 right-6 flex flex-col gap-1 items-end opacity-20">
        <TypewriterWord startIdx={2} />
        <TypewriterWord startIdx={9} />
      </div>

      {/* Top-left corner */}
      <div className="absolute top-20 left-6 flex flex-col gap-1 opacity-20">
        <TypewriterWord startIdx={5} />
        <TypewriterWord startIdx={12} />
      </div>
    </div>
  )
}
