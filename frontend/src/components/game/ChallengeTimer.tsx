import { useEffect, useRef, useState } from 'react'
import { formatTime, haptic } from '../../utils/helpers'
import { ttsCountdown, ttsTimeUp } from '../../services/tts'

interface ChallengeTimerProps {
  seconds: number
  running?: boolean
  tts?: boolean
  onEnd?: () => void
}

export function ChallengeTimer({ seconds, running = true, tts = false, onEnd }: ChallengeTimerProps) {
  const [left, setLeft] = useState(seconds)
  const ended = useRef(false)
  const warned = useRef<Set<number>>(new Set())

  useEffect(() => {
    setLeft(seconds)
    ended.current = false
    warned.current = new Set()
  }, [seconds])

  useEffect(() => {
    if (!running || ended.current) return
    if (left <= 0) {
      ended.current = true
      haptic([40, 40, 80])
      if (tts) void ttsTimeUp()
      onEnd?.()
      return
    }
    if (tts && left <= 10 && !warned.current.has(left)) {
      warned.current.add(left)
      void ttsCountdown(left)
    }
    const id = window.setTimeout(() => setLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(id)
  }, [left, running, onEnd, tts])

  const progress = seconds === 0 ? 0 : left / seconds
  const urgent = left <= 10

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em]">
        <span className="text-ink/45 dark:text-white/45">Chrono</span>
        <span className={urgent ? 'text-rose' : 'text-violet'}>{formatTime(left)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 linear ${urgent ? 'bg-rose' : 'bg-violet'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
