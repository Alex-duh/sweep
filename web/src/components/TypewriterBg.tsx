import { useEffect, useMemo, useState } from 'react'

const WORDS = [
  'archive', 'sweep', 'recruitment', 'spam', 'inbox',
  'admissions', 'outreach', 'enrollment', 'unsubscribe', 'college',
  'clean', 'filter', 'organize', 'declutter', 'remove',
]

function TypewriterWord({ top, left, startIdx = 0, initialDelay = 0 }: {
  top: string
  left: string
  startIdx?: number
  initialDelay?: number
}) {
  const [ready, setReady] = useState(initialDelay === 0)
  const [display, setDisplay] = useState('')
  const [wIdx, setWIdx] = useState(startIdx)
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    if (initialDelay === 0) return
    const t = setTimeout(() => setReady(true), initialDelay)
    return () => clearTimeout(t)
  }, [initialDelay])

  useEffect(() => {
    if (!ready) return
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
  }, [display, typing, wIdx, ready])

  return (
    <span
      style={{ position: 'absolute', top, left }}
      className="font-mono text-[11px] text-stone-500 opacity-[0.18] leading-none whitespace-nowrap"
    >
      {display}
    </span>
  )
}

export function TypewriterBg() {
  const positions = useMemo(() =>
    Array.from({ length: 11 }, (_, i) => ({
      top: `${8 + Math.random() * 78}%`,
      left: `${3 + Math.random() * 85}%`,
      startIdx: (i * 3) % WORDS.length,
      initialDelay: i * 300,
    })),
  [])

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {positions.map((p, i) => (
        <TypewriterWord key={i} {...p} />
      ))}
    </div>
  )
}
