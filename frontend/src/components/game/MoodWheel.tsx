import { useEffect, useRef, useState } from 'react'
import type { Player, TodLevel } from '../../types/game'
import { haptic } from '../../utils/helpers'
import { emptyWheelMemory, pickWeightedIndex, rememberPick, type WheelMemory } from '../../utils/wheelPick'

export const WHEEL_MOOD: Record<
  TodLevel,
  { colors: [string, string]; hub: string; pointer: string; particles: string[]; caption: string; friction: number }
> = {
  soft: { colors: ['#7dd3fc', '#38bdf8'], hub: 'bg-sky-300 text-ink', pointer: 'border-t-sky-400', particles: ['✨', '☁️'], caption: 'Douce petite roue…', friction: 0.988 },
  fun: { colors: ['#fde047', '#fbbf24'], hub: 'bg-gold text-ink', pointer: 'border-t-gold', particles: ['🎉', '🍭'], caption: 'Ça va tourner fort', friction: 0.985 },
  hot: { colors: ['#fb7185', '#f43f5e'], hub: 'bg-rose text-white', pointer: 'border-t-rose', particles: ['💕', '🔥'], caption: 'Le cœur s’emballe…', friction: 0.987 },
  hard: { colors: ['#a78bfa', '#7c3aed'], hub: 'bg-violet text-white', pointer: 'border-t-violet', particles: ['😈', '💜'], caption: 'Plus lent… plus osé', friction: 0.989 },
  extreme: { colors: ['#3f3f46', '#09090b'], hub: 'bg-ink text-white', pointer: 'border-t-ink dark:border-t-white', particles: ['🖤', '⚡'], caption: 'Sans filet', friction: 0.99 },
  spice: { colors: ['#be123c', '#450a0a'], hub: 'bg-rose-700 text-white', pointer: 'border-t-rose-700', particles: ['🌶️', '💋'], caption: 'Pour pimenter…', friction: 0.991 },
  custom: { colors: ['#ffe4e6', '#fda4af'], hub: 'bg-white text-ink', pointer: 'border-t-rose', particles: ['✍️', '⭐'], caption: 'Vos règles, votre roue', friction: 0.986 },
}

interface MoodWheelProps {
  players: Player[]
  level: TodLevel
  turn: number
  memory: WheelMemory
  onLand: (index: number, nextMemory: WheelMemory) => void
}

export function MoodWheel({ players, level, turn, memory, onLand }: MoodWheelProps) {
  const mood = WHEEL_MOOD[level] ?? WHEEL_MOOD.fun
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const velocityRef = useRef(0)
  const rafRef = useRef(0)
  const targetIndexRef = useRef(0)
  const memoryRef = useRef(memory)
  const [spinning, setSpinning] = useState(false)
  const [burst, setBurst] = useState(false)

  memoryRef.current = memory

  const draw = (highlightLabels: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 8
    const n = Math.max(players.length, 1)
    const slice = (Math.PI * 2) / n

    ctx.clearRect(0, 0, size, size)
    players.forEach((player, i) => {
      const start = i * slice - Math.PI / 2
      const end = start + slice
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = player.color || (i % 2 === 0 ? mood.colors[0] : mood.colors[1])
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 2
      ctx.stroke()

      if (highlightLabels) {
        const mid = start + slice / 2
        const tx = cx + Math.cos(mid) * radius * 0.62
        const ty = cy + Math.sin(mid) * radius * 0.62
        ctx.save()
        ctx.translate(tx, ty)
        ctx.rotate(mid + Math.PI / 2)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 15px Poppins, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(player.name.slice(0, 8), 0, 0)
        ctx.restore()
      }
    })

    ctx.beginPath()
    ctx.arc(cx, cy, 36, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.fill()
  }

  useEffect(() => {
    draw(!spinning)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, level, spinning])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const applyTransform = () => {
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rotationRef.current}deg)`
    }
  }

  const finish = () => {
    setBurst(true)
    haptic([18, 30, 18])
    setSpinning(false)
    draw(true)
    const player = players[targetIndexRef.current]
    const next = player ? rememberPick(memoryRef.current, player.id) : emptyWheelMemory()
    window.setTimeout(() => onLand(targetIndexRef.current, next), 420)
  }

  const animate = () => {
    velocityRef.current *= mood.friction
    rotationRef.current += velocityRef.current
    applyTransform()

    if (velocityRef.current > 0.35) {
      rafRef.current = requestAnimationFrame(animate)
      return
    }

    // Snap toward the intended winner slice center under the top pointer
    const n = Math.max(players.length, 1)
    const slice = 360 / n
    const targetRot = 360 - targetIndexRef.current * slice - slice / 2
    let current = ((rotationRef.current % 360) + 360) % 360
    let delta = targetRot - current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    rotationRef.current += delta
    applyTransform()
    finish()
  }

  const spin = () => {
    if (spinning || players.length === 0) return
    haptic([10, 40, 10, 20, 8])
    setBurst(false)
    setSpinning(true)
    draw(false)

    const index = pickWeightedIndex(players, memoryRef.current)
    targetIndexRef.current = index

    // Physics kick — enough energy to spin several turns
    velocityRef.current = 18 + Math.random() * 10
    rafRef.current = requestAnimationFrame(animate)
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/40 dark:text-white/40">
        Tour {turn}
      </p>
      <p className="mt-2 font-heading text-lg font-bold text-ink/70 dark:text-white/70">{mood.caption}</p>

      <div className="relative mt-6 h-72 w-72">
        {!spinning
          ? mood.particles.map((emoji, i) => (
              <span
                key={`${emoji}-${i}`}
                className="pointer-events-none absolute left-1/2 top-1/2 text-xl opacity-70"
                style={{
                  transform: `rotate(${i * (360 / mood.particles.length)}deg) translateY(-118px)`,
                }}
              >
                {emoji}
              </span>
            ))
          : null}

        <div className={`absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[20px] border-x-transparent ${mood.pointer}`} />

        <div
          ref={wheelRef}
          className={`wheel-gpu relative h-full w-full ${spinning ? 'wheel-spinning' : ''}`}
        >
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="h-full w-full rounded-full border-[6px] border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
          />
        </div>

        <button
          type="button"
          disabled={spinning}
          onClick={spin}
          className={`absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-heading text-sm font-extrabold shadow-lg ${mood.hub} disabled:opacity-80`}
        >
          {spinning ? '…' : 'Tourne'}
        </button>

        {burst ? (
          <div className="pointer-events-none absolute inset-0 flex animate-ping items-center justify-center text-4xl opacity-70">
            {mood.particles[0]}
          </div>
        ) : null}
      </div>
    </div>
  )
}
