import { formatTime, haptic } from '../../utils/helpers'
import { useEffect, useRef, useState } from 'react'

interface TimerProps {
  seconds?: number
  endsAt?: number | null
  running?: boolean
  onEnd?: () => void
}

export function Timer({ seconds, endsAt, running = true, onEnd }: TimerProps) {
  const total =
    seconds ??
    (endsAt ? Math.max(1, Math.round((endsAt - Date.now()) / 1000)) : 0)
  const [left, setLeft] = useState(total)
  const ended = useRef(false)

  useEffect(() => {
    const next =
      endsAt != null
        ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
        : (seconds ?? 0)
    setLeft(next)
    ended.current = false
  }, [seconds, endsAt])

  useEffect(() => {
    if (!running || ended.current) return
    if (left <= 0) {
      ended.current = true
      haptic([40, 40, 80])
      onEnd?.()
      return
    }
    const id = window.setTimeout(() => setLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(id)
  }, [left, running, onEnd])

  const progress = total === 0 ? 0 : left / total
  const urgent = left <= 10

  return (
    <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={urgent ? '#FF69B4' : '#8B5CF6'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 52}`}
          strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
        />
      </svg>
      <span className={`font-heading text-3xl font-extrabold ${urgent ? 'text-rose' : ''}`}>{formatTime(left)}</span>
    </div>
  )
}
