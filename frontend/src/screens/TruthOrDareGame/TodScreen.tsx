import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Plus, Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { Screen } from '../../components/layout/Screen'
import { ChallengeTimer } from '../../components/game/ChallengeTimer'
import { MoodWheel } from '../../components/game/MoodWheel'
import { PlayerSetup } from '../../components/game/PlayerSetup'
import { TOD_LEVELS, TOD_PARTIES } from '../../data/todCards'
import {
  ttsAnnounceTurn,
  ttsAskChoice,
  ttsReadChallenge,
  ttsStop,
  ttsSupported,
} from '../../services/tts'
import { useAppStore } from '../../store/appStore'
import { useTodStore } from '../../store/todStore'
import type { Gender, TodLevel, TodType } from '../../types/game'
import { haptic } from '../../utils/helpers'

const LEVEL_ORDER = TOD_LEVELS.map((item) => item.id)

const slide = {
  enter: (direction: number) => ({ x: direction * 72, opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: direction * -72, opacity: 0, scale: 0.96 }),
}

function genderWord(gender?: Gender) {
  return gender === 'male' ? 'lui' : 'elle'
}

export function TodScreen() {
  const setScreen = useAppStore((state) => state.setScreen)
  const lobby = useAppStore((state) => state.players)
  const reset = useTodStore((state) => state.reset)
  const phase = useTodStore((state) => state.phase)
  const goTo = useTodStore((state) => state.goTo)
  const playing =
    phase === 'wheel' || phase === 'choice' || phase === 'card' || phase === 'refuse'
  const needPlayers =
    lobby.length < 2 || lobby.some((player) => !player.gender || !player.interact)
  const view = !playing && needPlayers ? 'players' : phase

  const back = () => {
    if (view === 'players') {
      reset()
      setScreen('home')
      return
    }
    if (view === 'level') {
      goTo('players')
      return
    }
    if (view === 'party') {
      goTo('level')
      return
    }
    reset()
    setScreen('home')
  }

  return (
    <Screen onBack={back} title={playing ? undefined : 'Action ou Vérité'}>
      <AnimatePresence mode="wait">
        {view === 'players' ? <Players key="players" /> : null}
        {view === 'level' ? <LevelCarousel key="level" /> : null}
        {view === 'party' ? <PartyPick key="party" /> : null}
        {view === 'wheel' ? <WheelPhase key="wheel" /> : null}
        {view === 'choice' ? <Choice key="choice" /> : null}
        {view === 'card' ? <PlayCard key="card" /> : null}
        {view === 'refuse' ? <Refuse key="refuse" /> : null}
      </AnimatePresence>
    </Screen>
  )
}

function Players() {
  const lobby = useAppStore((state) => state.players)
  const goTo = useTodStore((state) => state.goTo)
  const ready = lobby.length >= 2 && lobby.every((player) => player.gender && player.interact)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-1 flex-col"
    >
      <p className="mt-6 font-heading text-3xl font-bold leading-tight">Qui joue ?</p>
      <p className="mt-2 text-sm text-ink/50 dark:text-white/50">Nom, sexe, et avec qui iel interagit.</p>
      <div className="mt-8">
        <PlayerSetup min={2} withGender withInteract />
      </div>
      <div className="mt-auto pt-8">
        <Button disabled={!ready} onClick={() => goTo('level')}>
          Continuer
        </Button>
      </div>
    </motion.div>
  )
}

function levelTitleClass(id: TodLevel) {
  if (id === 'soft') return 'text-sky-400'
  if (id === 'fun') return 'text-ink dark:text-gold'
  if (id === 'hot') return 'text-rose'
  if (id === 'hard') return 'text-violet'
  if (id === 'extreme') return 'text-ink dark:text-white'
  if (id === 'spice') return 'text-rose-700 dark:text-rose-400'
  return 'text-ink dark:text-white'
}

function LevelCarousel() {
  const level = useTodStore((state) => state.level)
  const setLevel = useTodStore((state) => state.setLevel)
  const adultOk = useTodStore((state) => state.adultOk)
  const setAdultOk = useTodStore((state) => state.setAdultOk)
  const customCards = useTodStore((state) => state.customCards)
  const addCustomCard = useTodStore((state) => state.addCustomCard)
  const removeCustomCard = useTodStore((state) => state.removeCustomCard)
  const goTo = useTodStore((state) => state.goTo)
  const [direction, setDirection] = useState(1)
  const [gate, setGate] = useState(false)
  const [customType, setCustomType] = useState<TodType>('dare')
  const [customText, setCustomText] = useState('')
  const index = Math.max(0, LEVEL_ORDER.indexOf(level))
  const current = TOD_LEVELS[index] ?? TOD_LEVELS[0]

  const go = (nextIndex: number, dir: number) => {
    const clamped = Math.max(0, Math.min(LEVEL_ORDER.length - 1, nextIndex))
    if (clamped === index) return
    haptic(10)
    setDirection(dir)
    setLevel(LEVEL_ORDER[clamped] ?? 'soft')
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -56) go(index + 1, 1)
    if (info.offset.x > 56) go(index - 1, -1)
  }

  const continuePlay = () => {
    if (current?.id === 'custom' && customCards.length === 0) return
    if (current?.adult && !adultOk) {
      setGate(true)
      return
    }
    goTo('party')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-ink/40 dark:text-white/40">
        Ambiance
      </p>
      <div className="relative mt-6 flex flex-1 items-center justify-center">
        <button
          type="button"
          aria-label="Niveau précédent"
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
              <h2 className={`mt-8 font-heading text-5xl font-extrabold tracking-tight ${levelTitleClass(current.id)}`}>
                {current.title}
              </h2>
              <p className="mt-3 text-sm text-ink/55 dark:text-white/55">{current.blurb}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <button
          type="button"
          aria-label="Niveau suivant"
          disabled={index === LEVEL_ORDER.length - 1}
          onClick={() => go(index + 1, 1)}
          className="absolute right-0 z-10 flex h-14 w-14 items-center justify-center rounded-full glass disabled:opacity-20"
        >
          <ChevronRight size={28} />
        </button>
      </div>
      <div className="flex justify-center gap-2 pb-6">
        {LEVEL_ORDER.map((id, dot) => (
          <span
            key={id}
            className={`h-1.5 rounded-full transition-all ${dot === index ? 'w-6 bg-ink/70 dark:bg-white/80' : 'w-1.5 bg-ink/20 dark:bg-white/25'}`}
          />
        ))}
      </div>
      {current?.id === 'custom' ? (
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCustomType('truth')}
              className={`rounded-2xl py-2 text-sm font-bold ${customType === 'truth' ? 'bg-violet text-white' : 'glass'}`}
            >
              Vérité
            </button>
            <button
              type="button"
              onClick={() => setCustomType('dare')}
              className={`rounded-2xl py-2 text-sm font-bold ${customType === 'dare' ? 'bg-rose text-white' : 'glass'}`}
            >
              Action
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={customText}
              placeholder="Ton défi. {other} pour viser quelqu’un."
              onChange={(event) => setCustomText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && customText.trim()) {
                  addCustomCard(customType, customText)
                  setCustomText('')
                }
              }}
              className="w-full border-0 border-b-2 border-violet/40 bg-transparent px-1 py-3 text-sm outline-none focus:border-rose"
            />
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose text-white"
              onClick={() => {
                addCustomCard(customType, customText)
                setCustomText('')
              }}
              aria-label="Ajouter le défi"
            >
              <Plus size={18} />
            </button>
          </div>
          {customCards.map((card) => (
            <div key={card.id} className="glass flex items-start gap-2 rounded-2xl px-3 py-2 text-sm">
              <span className="font-bold text-violet">{card.type === 'dare' ? 'A' : 'V'}</span>
              <span className="flex-1">{card.content}</span>
              <button type="button" onClick={() => removeCustomCard(card.id)} aria-label="Supprimer">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <Button onClick={continuePlay} disabled={current?.id === 'custom' && customCards.length === 0}>
        Choisir {current?.title}
      </Button>
      <Modal open={gate} title="18+" onClose={() => setGate(false)}>
        <p>{current?.title} est pour des adultes consentants. Tout le monde a 18 ans ou plus ?</p>
        <div className="mt-5 space-y-2">
          <Button
            onClick={() => {
              setAdultOk(true)
              setGate(false)
              goTo('party')
            }}
          >
            Oui
          </Button>
          <Button variant="ghost" onClick={() => setGate(false)}>
            Non
          </Button>
        </div>
      </Modal>
    </motion.div>
  )
}

function PartyPick() {
  const setParty = useTodStore((state) => state.setParty)
  const startGame = useTodStore((state) => state.startGame)
  const lobby = useAppStore((state) => state.players)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<string | null>(null)

  const select = (id: (typeof TOD_PARTIES)[number]['id']) => {
    haptic(16)
    setParty(id)
    setPicked(id)
    window.setTimeout(() => {
      const next = startGame(lobby)
      if (next) {
        setError(next)
        setPicked(null)
      }
    }, 280)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-1 flex-col"
    >
      <p className="mt-6 font-heading text-3xl font-bold leading-tight">Quelle table ?</p>
      <div className="mt-10 space-y-4">
        {TOD_PARTIES.map((item, index) => {
          const on = picked === item.id
          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, scale: on ? 1.02 : 1 }}
              transition={{ delay: 0.06 * index }}
              whileTap={{ scale: 0.98 }}
              onClick={() => select(item.id)}
              className={`flex w-full flex-col items-start rounded-[32px] px-6 py-8 text-left transition ${
                on ? 'bg-violet text-white shadow-[0_18px_44px_rgba(139,92,246,0.3)]' : 'glass'
              }`}
            >
              <span className="text-5xl">{item.emoji}</span>
              <span className="mt-4 font-heading text-2xl font-bold">{item.title}</span>
              <span className={`mt-1 text-sm ${on ? 'text-white/75' : 'text-ink/50 dark:text-white/50'}`}>
                {item.blurb}
              </span>
            </motion.button>
          )
        })}
      </div>
      {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
    </motion.div>
  )
}

function WheelPhase() {
  const players = useTodStore((state) => state.players)
  const level = useTodStore((state) => state.level)
  const turn = useTodStore((state) => state.turn)
  const wheelMemory = useTodStore((state) => state.wheelMemory)
  const landOn = useTodStore((state) => state.landOn)
  const ttsEnabled = useTodStore((state) => state.ttsEnabled)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[70vh] flex-col items-center justify-center"
    >
      <MoodWheel
        players={players}
        level={level}
        turn={turn}
        memory={wheelMemory}
        onLand={(index, memory) => {
          landOn(index, memory)
          const player = players[index]
          if (ttsEnabled && player && ttsSupported()) {
            void ttsAnnounceTurn(player.name).then(() => {
              if (ttsEnabled) void ttsAskChoice()
            })
          }
        }}
      />
    </motion.div>
  )
}

function Choice() {
  const players = useTodStore((state) => state.players)
  const currentIndex = useTodStore((state) => state.currentIndex)
  const choose = useTodStore((state) => state.choose)
  const ttsEnabled = useTodStore((state) => state.ttsEnabled)
  const setTtsEnabled = useTodStore((state) => state.setTtsEnabled)
  const player = players[currentIndex]
  if (!player) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[70vh] flex-col items-center justify-center text-center"
    >
      <p className="text-sm text-ink/45 dark:text-white/45">Passe le téléphone à {player.name}</p>
      <h2 className="mt-3 font-heading text-4xl font-bold">{player.name}</h2>
      <div className="mt-12 grid w-full grid-cols-2 gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => choose('truth')}
          className="rounded-[28px] glass px-4 py-10 font-heading text-xl font-bold"
        >
          Vérité
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => choose('dare')}
          className="rounded-[28px] bg-rose px-4 py-10 font-heading text-xl font-bold text-white shadow-[0_16px_40px_rgba(255,105,180,0.28)]"
        >
          Action
        </motion.button>
      </div>
      {ttsSupported() ? (
        <button
          type="button"
          className="mt-8 inline-flex items-center gap-2 text-sm text-ink/45 dark:text-white/45"
          onClick={() => {
            if (ttsEnabled) ttsStop()
            setTtsEnabled(!ttsEnabled)
          }}
        >
          {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          Voix {ttsEnabled ? 'on' : 'off'}
        </button>
      ) : null}
    </motion.div>
  )
}

function PlayCard() {
  const card = useTodStore((state) => state.card)
  const cardText = useTodStore((state) => state.cardText)
  const choice = useTodStore((state) => state.choice)
  const partnerName = useTodStore((state) => state.partnerName)
  const turn = useTodStore((state) => state.turn)
  const level = useTodStore((state) => state.level)
  const complete = useTodStore((state) => state.complete)
  const refuse = useTodStore((state) => state.refuse)
  const ttsEnabled = useTodStore((state) => state.ttsEnabled)
  const setTtsEnabled = useTodStore((state) => state.setTtsEnabled)
  const players = useTodStore((state) => state.players)
  const currentIndex = useTodStore((state) => state.currentIndex)
  const meta = TOD_LEVELS.find((item) => item.id === level)
  const player = players[currentIndex]
  const duration = card?.duration ?? 0
  const [timerOn, setTimerOn] = useState(duration > 0)

  useEffect(() => {
    setTimerOn(duration > 0)
    if (ttsEnabled && cardText && ttsSupported()) {
      void ttsReadChallenge(cardText, duration || undefined)
    }
    return () => ttsStop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex min-h-[70vh] flex-col"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink/40 dark:text-white/40">
        {turn} · {meta?.title} · {choice === 'dare' ? 'Action' : 'Vérité'}
        {partnerName ? ` · ${partnerName}` : ''}
      </p>

      {player ? (
        <p className="mt-3 text-center font-heading text-lg font-bold">✨ {player.name} ✨</p>
      ) : null}

      {duration > 0 && timerOn ? (
        <div className="mt-5 px-2">
          <ChallengeTimer
            key={card?.id}
            seconds={duration}
            tts={ttsEnabled}
            onEnd={() => setTimerOn(false)}
          />
        </div>
      ) : null}

      <div className="flex flex-1 items-center justify-center px-2 py-6">
        <p className="text-center font-heading text-3xl font-bold leading-snug">{cardText}</p>
      </div>

      {duration > 0 ? (
        <p className="mb-3 text-center text-xs text-ink/45 dark:text-white/45">
          {timerOn ? `${duration}s pour le défi` : 'Temps écoulé — valide ou refuse'}
        </p>
      ) : null}

      {card ? (
        <div className="space-y-3">
          {ttsSupported() ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (!ttsEnabled) setTtsEnabled(true)
                  void ttsReadChallenge(cardText, duration || undefined)
                }}
              >
                <Volume2 size={16} /> Écouter
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  ttsStop()
                  setTtsEnabled(false)
                }}
              >
                <VolumeX size={16} /> Couper
              </Button>
            </div>
          ) : null}
          <Button
            onClick={() => {
              ttsStop()
              complete()
            }}
          >
            <Check size={18} /> C’est fait
          </Button>
          <button
            type="button"
            onClick={() => {
              ttsStop()
              refuse()
            }}
            className="w-full py-3 text-sm text-ink/40 dark:text-white/40"
          >
            Je refuse
          </button>
        </div>
      ) : (
        <Button onClick={complete}>Suivant</Button>
      )}
    </motion.div>
  )
}

function Refuse() {
  const players = useTodStore((state) => state.players)
  const currentIndex = useTodStore((state) => state.currentIndex)
  const shownGage = useTodStore((state) => state.shownGage)
  const finishRefuse = useTodStore((state) => state.finishRefuse)
  const player = players[currentIndex]
  if (!player) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-[70vh] flex-col items-center justify-center text-center"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-rose">{player.name} passe</p>
      <h2 className="mt-3 font-display text-5xl italic">Gage</h2>
      <p className="mt-8 max-w-sm font-heading text-2xl font-bold leading-snug">{shownGage}</p>
      <p className="mt-3 text-sm text-ink/40 dark:text-white/40">Pour {genderWord(player.gender)}</p>
      <div className="mt-12 w-full">
        <Button variant="gold" onClick={finishRefuse}>
          Suivant
        </Button>
      </div>
    </motion.div>
  )
}
