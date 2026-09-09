import { useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { useAppStore } from '../../store/appStore'
import { useImpostorStore } from '../../store/impostorStore'
import { useMimesStore } from '../../store/mimesStore'
import { useThemeStore } from '../../store/themeStore'
import { useTodStore } from '../../store/todStore'
import type { GameId } from '../../types/game'
import { haptic } from '../../utils/helpers'

const games: { id: GameId; emoji: string; title: string; blurb: string; tone: string }[] = [
  { id: 'tod', emoji: '🔥', title: 'Action ou Vérité', blurb: 'Défis, secrets, gages.', tone: 'text-rose' },
  { id: 'impostor', emoji: '👁️', title: 'Imposteur', blurb: 'Un mot. Un menteur.', tone: 'text-violet' },
  { id: 'mimes', emoji: '🎭', title: 'Mimes', blurb: 'Fais deviner. Sans parler.', tone: 'text-gold' },
]

const slide = {
  enter: (direction: number) => ({ x: direction * 72, opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: direction * -72, opacity: 0, scale: 0.96 }),
}

export function HomeScreen() {
  const setScreen = useAppStore((state) => state.setScreen)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const resetImpostor = useImpostorStore((state) => state.reset)
  const resetMimes = useMimesStore((state) => state.reset)
  const resetTod = useTodStore((state) => state.reset)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const current = games[index] ?? games[0]

  const go = (nextIndex: number, dir: number) => {
    const clamped = Math.max(0, Math.min(games.length - 1, nextIndex))
    if (clamped === index) return
    haptic(10)
    setDirection(dir)
    setIndex(clamped)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -56) go(index + 1, 1)
    if (info.offset.x > 56) go(index - 1, -1)
  }

  const play = () => {
    if (!current) return
    haptic(16)
    if (current.id === 'impostor') resetImpostor()
    if (current.id === 'mimes') resetMimes()
    if (current.id === 'tod') resetTod()
    setScreen(current.id)
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10 pt-[max(1.2rem,env(safe-area-inset-top))]"
    >
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl italic leading-none">Friends</h1>
        <button
          type="button"
          onClick={() => {
            haptic()
            toggleTheme()
          }}
          className="glass flex h-11 w-11 items-center justify-center rounded-2xl"
          aria-label="Changer le thème"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <p className="mt-8 text-center text-xs font-semibold uppercase tracking-[0.22em] text-ink/40 dark:text-white/40">
        Choisir un jeu
      </p>

      <div className="relative mt-4 flex flex-1 items-center justify-center">
        <button
          type="button"
          aria-label="Jeu précédent"
          disabled={index === 0}
          onClick={() => go(index - 1, -1)}
          className="absolute left-0 z-10 flex h-14 w-14 items-center justify-center rounded-full glass disabled:opacity-20"
        >
          <ChevronLeft size={28} />
        </button>
        <AnimatePresence mode="wait" custom={direction}>
          {current ? (
            <motion.div
              key={current.id}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              onDragEnd={onDragEnd}
              className="mx-16 flex w-full max-w-xs cursor-grab flex-col items-center text-center active:cursor-grabbing"
            >
              <motion.span
                initial={{ scale: 0.86, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                className="text-8xl leading-none"
              >
                {current.emoji}
              </motion.span>
              <h2 className={`mt-8 font-heading text-4xl font-extrabold tracking-tight ${current.tone}`}>
                {current.title}
              </h2>
              <p className="mt-3 text-sm text-ink/55 dark:text-white/55">{current.blurb}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <button
          type="button"
          aria-label="Jeu suivant"
          disabled={index === games.length - 1}
          onClick={() => go(index + 1, 1)}
          className="absolute right-0 z-10 flex h-14 w-14 items-center justify-center rounded-full glass disabled:opacity-20"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <div className="flex justify-center gap-2 pb-6">
        {games.map((game, dot) => (
          <span
            key={game.id}
            className={`h-1.5 rounded-full transition-all ${dot === index ? 'w-6 bg-ink/70 dark:bg-white/80' : 'w-1.5 bg-ink/20 dark:bg-white/25'}`}
          />
        ))}
      </div>
      <Button onClick={play}>Jouer</Button>
    </motion.main>
  )
}
