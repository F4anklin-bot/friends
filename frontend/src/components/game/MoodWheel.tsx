import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Player, TodLevel } from '../../types/game'
import { haptic } from '../../utils/helpers'

/** Look & feel of the wheel — changes with difficulty (more erotic as it climbs). */
export const WHEEL_MOOD: Record<
  TodLevel,
  {
    ring: string
    hub: string
    pointer: string
    idle: 'bob' | 'wiggle' | 'heartbeat' | 'pulse' | 'glow' | 'breathe' | 'sketch'
    particles: string[]
    spinMs: number
    caption: string
  }
> = {
  soft: {
    ring: 'from-sky-200 to-sky-400',
    hub: 'bg-sky-300 text-ink',
    pointer: 'border-t-sky-400',
    idle: 'bob',
    particles: ['✨', '☁️', '💫'],
    spinMs: 3200,
    caption: 'Douce petite roue…',
  },
  fun: {
    ring: 'from-amber-200 to-yellow-400',
    hub: 'bg-gold text-ink',
    pointer: 'border-t-gold',
    idle: 'wiggle',
    particles: ['🎉', '🍭', '😄'],
    spinMs: 2800,
    caption: 'Ça va tourner fort',
  },
  hot: {
    ring: 'from-rose-300 to-rose-500',
    hub: 'bg-rose text-white',
    pointer: 'border-t-rose',
    idle: 'heartbeat',
    particles: ['💕', '🔥', '😘'],
    spinMs: 3400,
    caption: 'Le cœur s’emballe…',
  },
  hard: {
    ring: 'from-violet-400 to-violet-700',
    hub: 'bg-violet text-white',
    pointer: 'border-t-violet',
    idle: 'pulse',
    particles: ['😈', '💜', '🌙'],
    spinMs: 3600,
    caption: 'Plus lent… plus osé',
  },
  extreme: {
    ring: 'from-zinc-700 to-black',
    hub: 'bg-ink text-white',
    pointer: 'border-t-ink dark:border-t-white',
    idle: 'glow',
    particles: ['🖤', '⚡', '🩸'],
    spinMs: 3800,
    caption: 'Sans filet',
  },
  spice: {
    ring: 'from-rose-700 to-red-950',
    hub: 'bg-rose-700 text-white',
    pointer: 'border-t-rose-700',
    idle: 'breathe',
    particles: ['🌶️', '💋', '🔥'],
    spinMs: 4000,
    caption: 'Pour pimenter…',
  },
  custom: {
    ring: 'from-white to-rose-100',
    hub: 'bg-white text-ink',
    pointer: 'border-t-rose',
    idle: 'sketch',
    particles: ['✍️', '⭐', '💭'],
    spinMs: 3000,
    caption: 'Vos règles, votre roue',
  },
}

function pieSlice(index: number, total: number) {
  const start = (index / total) * Math.PI * 2 - Math.PI / 2
  const end = ((index + 1) / total) * Math.PI * 2 - Math.PI / 2
  const x1 = 100 + 98 * Math.cos(start)
  const y1 = 100 + 98 * Math.sin(start)
  const x2 = 100 + 98 * Math.cos(end)
  const y2 = 100 + 98 * Math.sin(end)
  const large = end - start > Math.PI ? 1 : 0
  return `M 100 100 L ${x1} ${y1} A 98 98 0 ${large} 1 ${x2} ${y2} Z`
}

function idleAnim(kind: (typeof WHEEL_MOOD)[TodLevel]['idle']) {
  switch (kind) {
    case 'bob':
      return { y: [0, -6, 0], transition: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' as const } }
    case 'wiggle':
      return { rotate: [0, -2.5, 2.5, 0], transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' as const } }
    case 'heartbeat':
      return { scale: [1, 1.04, 1, 1.06, 1], transition: { repeat: Infinity, duration: 1.35, ease: 'easeInOut' as const } }
    case 'pulse':
      return { scale: [1, 1.03, 1], transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' as const } }
    case 'glow':
      return { scale: [1, 1.02, 1], opacity: [1, 0.92, 1], transition: { repeat: Infinity, duration: 2.6 } }
    case 'breathe':
      return {
        scale: [1, 1.05, 1],
        rotate: [0, 1.2, -1.2, 0],
        transition: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' as const },
      }
    case 'sketch':
      return { rotate: [0, 1, -1, 0], transition: { repeat: Infinity, duration: 3 } }
  }
}

interface MoodWheelProps {
  players: Player[]
  level: TodLevel
  turn: number
  onLand: (index: number) => void
}

export function MoodWheel({ players, level, turn, onLand }: MoodWheelProps) {
  const mood = WHEEL_MOOD[level] ?? WHEEL_MOOD.fun
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [burst, setBurst] = useState(false)
  const slice = 360 / Math.max(players.length, 1)

  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        emoji: mood.particles[i % mood.particles.length] ?? '✨',
        angle: (i / 8) * 360,
        delay: i * 0.12,
      })),
    [mood.particles],
  )

  const spin = () => {
    if (spinning || players.length === 0) return
    haptic([10, 40, 10, 20, 8])
    setSpinning(true)
    setBurst(false)
    const index = Math.floor(Math.random() * players.length)
    const extra = 360 * (level === 'spice' || level === 'extreme' ? 6 : 5)
    setRotation((value) => {
      const normalized = ((value % 360) + 360) % 360
      const landing = 360 - index * slice - slice / 2
      return value + extra + (landing - normalized)
    })
    window.setTimeout(() => {
      setBurst(true)
      haptic([18, 30, 18])
      setSpinning(false)
      window.setTimeout(() => onLand(index), 520)
    }, mood.spinMs)
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/40 dark:text-white/40">
        Tour {turn}
      </p>
      <p className="mt-2 font-heading text-lg font-bold text-ink/70 dark:text-white/70">{mood.caption}</p>

      <div className="relative mt-6 h-72 w-72">
        {/* Floating particles */}
        {sparkles.map((item) => (
          <motion.span
            key={`${level}-${item.id}`}
            className="pointer-events-none absolute left-1/2 top-1/2 text-xl"
            style={{ originX: 0.5, originY: 0.5 }}
            animate={{
              x: Math.cos((item.angle * Math.PI) / 180) * (spinning ? 128 : 118),
              y: Math.sin((item.angle * Math.PI) / 180) * (spinning ? 128 : 118),
              opacity: spinning ? [0.4, 1, 0.4] : [0.55, 1, 0.55],
              scale: spinning ? [0.9, 1.25, 0.9] : [0.95, 1.1, 0.95],
            }}
            transition={{ repeat: Infinity, duration: 2.4 + item.delay, delay: item.delay }}
          >
            {item.emoji}
          </motion.span>
        ))}

        {/* Pointer */}
        <motion.div
          className={`absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[20px] border-x-transparent ${mood.pointer}`}
          animate={spinning ? { y: [0, -4, 0] } : { y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 0.45 }}
        />

        {/* Soft aura */}
        <motion.div
          className={`absolute inset-3 rounded-full bg-gradient-to-br ${mood.ring} opacity-30 blur-2xl`}
          animate={idleAnim(mood.idle)}
        />

        <motion.div
          className="relative h-full w-full"
          animate={spinning ? undefined : idleAnim(mood.idle)}
        >
          <motion.div
            className={`h-full w-full overflow-hidden rounded-full border-[6px] border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.25)] bg-gradient-to-br ${mood.ring}`}
            animate={{ rotate: rotation }}
            transition={{
              duration: mood.spinMs / 1000,
              ease: [0.12, 0.8, 0.08, 1],
            }}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full">
              {players.map((player, index) => (
                <path
                  key={player.id}
                  d={pieSlice(index, players.length)}
                  fill={player.color}
                  opacity={0.92}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1"
                />
              ))}
              {/* Decorative inner ring */}
              <circle cx="100" cy="100" r="34" fill="rgba(255,255,255,0.12)" />
              {level === 'spice' || level === 'hot' || level === 'hard' ? (
                <text x="100" y="106" textAnchor="middle" fontSize="22">
                  {level === 'spice' ? '💋' : level === 'hot' ? '❤️' : '😈'}
                </text>
              ) : null}
            </svg>
            {players.map((player, index) => (
              <span
                key={`${player.id}-label`}
                className="absolute left-1/2 top-1/2 origin-top text-[11px] font-bold text-white drop-shadow"
                style={{ transform: `rotate(${index * slice + slice / 2}deg) translateY(-112px)` }}
              >
                {player.name.slice(0, 8)}
              </span>
            ))}
          </motion.div>

          {/* Hub button */}
          <button
            type="button"
            disabled={spinning}
            onClick={spin}
            className={`absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-heading text-sm font-extrabold shadow-lg ${mood.hub} disabled:opacity-80`}
          >
            {spinning ? '…' : 'Tourne'}
          </button>
        </motion.div>

        {/* Landing burst */}
        {burst ? (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.6, 1.4, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.7 }}
          >
            {mood.particles[0]}
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
