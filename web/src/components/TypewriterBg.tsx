import { useEffect, useRef, useState } from 'react'

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

const N = 5

type Phase = 'idle' | 'typing' | 'paused' | 'erasing'

interface Slot {
  top: number
  left: number
  phraseIdx: number
  display: string
  phase: Phase
}

function randomPos(others: Slot[]): [number, number] {
  const occupied = others.filter(s => s.phase !== 'idle')
  for (let attempt = 0; attempt < 30; attempt++) {
    const t = 10 + Math.random() * 72
    const l = 5 + Math.random() * 68
    const clash = occupied.some(
      o => Math.abs(o.top - t) < 8 && Math.abs(o.left - l) < 22
    )
    if (!clash) return [t, l]
  }
  return [10 + Math.random() * 72, 5 + Math.random() * 68]
}

function initSlots(): Slot[] {
  const result: Slot[] = []
  for (let i = 0; i < N; i++) {
    const [top, left] = randomPos(result)
    result.push({
      top, left,
      phraseIdx: (i * 3) % PHRASES.length,
      display: '',
      phase: 'idle',
    })
  }
  return result
}

export function TypewriterBg() {
  const slotsRef = useRef<Slot[]>(initSlots())
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const [visuals, setVisuals] = useState(() =>
    slotsRef.current.map(s => ({ top: `${s.top}%`, left: `${s.left}%`, display: '' }))
  )

  useEffect(() => {
    function flush() {
      setVisuals(slotsRef.current.map(s => ({
        top: `${s.top}%`,
        left: `${s.left}%`,
        display: s.display,
      })))
    }

    function eraseSlot(idx: number) {
      const slot = slotsRef.current[idx]
      if (slot.display.length > 0) {
        slot.display = slot.display.slice(0, -1)
        slot.phase = 'erasing'
        flush()
        const t = setTimeout(() => eraseSlot(idx), 40)
        timers.current.push(t)
      } else {
        // Teleport to a new non-overlapping position before going idle
        const [newTop, newLeft] = randomPos(slotsRef.current.filter((_, i) => i !== idx))
        slot.top = newTop
        slot.left = newLeft
        slot.phraseIdx = (slot.phraseIdx + 1) % PHRASES.length
        slot.phase = 'idle'
        flush()
      }
    }

    function typeSlot(idx: number) {
      const slot = slotsRef.current[idx]
      const phrase = PHRASES[slot.phraseIdx]

      if (slot.display.length < phrase.length) {
        slot.display = phrase.slice(0, slot.display.length + 1)
        slot.phase = 'typing'
        flush()
        const t = setTimeout(() => typeSlot(idx), 70 + Math.random() * 55)
        timers.current.push(t)
      } else {
        // Finished typing — pause, activate next slot, then erase
        slot.phase = 'paused'
        flush()
        scheduleNext(idx)
        const t = setTimeout(() => eraseSlot(idx), 2400)
        timers.current.push(t)
      }
    }

    function scheduleNext(currentIdx: number) {
      const nextIdx = (currentIdx + 1) % N
      function tryActivate() {
        if (slotsRef.current[nextIdx].phase === 'idle') {
          typeSlot(nextIdx)
        } else {
          const t = setTimeout(tryActivate, 300)
          timers.current.push(t)
        }
      }
      const t = setTimeout(tryActivate, 800)
      timers.current.push(t)
    }

    typeSlot(0)
    return () => { timers.current.forEach(clearTimeout) }
  }, [])

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {visuals.map((v, i) => (
        <span
          key={i}
          style={{ position: 'absolute', top: v.top, left: v.left }}
          className="font-mono text-sm text-stone-500 opacity-[0.15] leading-none whitespace-nowrap"
        >
          {v.display}
        </span>
      ))}
    </div>
  )
}
