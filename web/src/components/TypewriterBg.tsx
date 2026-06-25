import { useEffect, useMemo, useState } from 'react'

const PHRASES = [
  '"Explore your future at Northeastern!"',
  '"Students like you belong here."',
  '"Visit our campus this fall — RSVP now"',
  '"We noticed your PSAT scores."',
  '"Your profile caught our attention."',
  '"Apply now — rolling admissions open"',
  '"You\'ve been selected for early review."',
  '"Discover your potential with us."',
  '"Open house this November — register free"',
  '"We think you\'d thrive here."',
  '"Schedule a campus tour today!"',
  '"A place where you truly belong."',
]

// 3 columns × 2 rows — one phrase guaranteed per zone, jitter keeps it random-feeling
const GRID = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 },
  { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 },
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
    const phrase = PHRASES[wIdx % PHRASES.length]
    let t: ReturnType<typeof setTimeout>

    if (typing) {
      if (display.length < phrase.length) {
        t = setTimeout(() => setDisplay(phrase.slice(0, display.length + 1)), 75 + Math.random() * 50)
      } else {
        t = setTimeout(() => setTyping(false), 2400)
      }
    } else {
      if (display.length > 0) {
        t = setTimeout(() => setDisplay(d => d.slice(0, -1)), 40)
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
      className="font-mono text-sm text-stone-500 opacity-[0.15] leading-none whitespace-nowrap"
    >
      {display}
    </span>
  )
}

export function TypewriterBg() {
  const positions = useMemo(() =>
    GRID.map(({ col, row }, i) => ({
      top: `${18 + row * 44 + (Math.random() - 0.5) * 18}%`,
      left: `${6 + col * 30 + (Math.random() - 0.5) * 14}%`,
      startIdx: (i * 2) % PHRASES.length,
      initialDelay: i * 600,
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
