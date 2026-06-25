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
type Zone = 'top' | 'bottom' | 'left' | 'right'

interface Slot {
  top: number
  left: number
  phraseIdx: number
  display: string
  phase: Phase
}

// Place phrases in border zones, avoiding the center content area.
// top/bottom strips span full width; left/right strips stay in the margins.
function borderPos(zone: Zone | 'random', others: Slot[]): [number, number] {
  const zones: Zone[] = ['top', 'bottom', 'left', 'right']
  const z: Zone = zone === 'random' ? zones[Math.floor(Math.random() * 4)] : zone
  const occupied = others.filter(s => s.phase !== 'idle')

  for (let attempt = 0; attempt < 40; attempt++) {
    let t: number, l: number
    switch (z) {
      case 'top':
        t = 9 + Math.random() * 7    // 9–16% — just below nav
        l = 5 + Math.random() * 76   // 5–81%
        break
      case 'bottom':
        t = 81 + Math.random() * 9   // 81–90% — near footer
        l = 5 + Math.random() * 76
        break
      case 'left':
        t = 20 + Math.random() * 58  // 20–78% — avoid nav/footer
        l = 1 + Math.random() * 14   // 1–15%
        break
      default: // right
        t = 20 + Math.random() * 58
        l = 62 + Math.random() * 14  // 62–76% — phrases extend rightward
        break
    }
    const clash = occupied.some(o => Math.abs(o.top - t) < 7 && Math.abs(o.left - l) < 22)
    if (!clash) return [t, l]
  }
  // fallback
  return [9 + Math.random() * 7, 5 + Math.random() * 76]
}

// Init with one slot per zone so they're spread from the start
function initSlots(): Slot[] {
  const startZones: Zone[] = ['top', 'left', 'bottom', 'right', 'top']
  const result: Slot[] = []
  for (let i = 0; i < N; i++) {
    const [top, left] = borderPos(startZones[i], result)
    result.push({ top, left, phraseIdx: (i * 3) % PHRASES.length, display: '', phase: 'idle' })
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
        timers.current.push(setTimeout(() => eraseSlot(idx), 40))
      } else {
        // Teleport to a new border position before going idle
        const others = slotsRef.current.filter((_, i) => i !== idx)
        const [newTop, newLeft] = borderPos('random', others)
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
        timers.current.push(setTimeout(() => typeSlot(idx), 70 + Math.random() * 55))
      } else {
        slot.phase = 'paused'
        flush()
        scheduleNext(idx)
        timers.current.push(setTimeout(() => eraseSlot(idx), 2400))
      }
    }

    function scheduleNext(currentIdx: number) {
      const nextIdx = (currentIdx + 1) % N
      function tryActivate() {
        if (slotsRef.current[nextIdx].phase === 'idle') {
          typeSlot(nextIdx)
        } else {
          timers.current.push(setTimeout(tryActivate, 300))
        }
      }
      timers.current.push(setTimeout(tryActivate, 800))
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
          className="font-mono text-sm text-stone-600 opacity-[0.28] leading-none whitespace-nowrap"
        >
          {v.display}
        </span>
      ))}
    </div>
  )
}
