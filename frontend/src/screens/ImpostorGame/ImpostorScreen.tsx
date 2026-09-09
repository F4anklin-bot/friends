import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Trophy, Vote } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Input } from '../../components/common/Input'
import { ToggleRow } from '../../components/common/ToggleRow'
import { Screen } from '../../components/layout/Screen'
import { Avatar } from '../../components/game/Avatar'
import { RoleIcon } from '../../components/game/RoleIcon'
import { Confetti } from '../../components/game/Confetti'
import { PassPhone } from '../../components/game/PassPhone'
import { PlayerSetup } from '../../components/game/PlayerSetup'
import { Timer } from '../../components/game/Timer'
import { IMPOSTOR_CATEGORIES } from '../../data/impostorWords'
import { ROLE_COPY } from '../../game/impostorCopy'
import { useAppStore } from '../../store/appStore'
import { useImpostorStore } from '../../store/impostorStore'
import { useOnlineStore } from '../../store/onlineImpostorStore'
import { ModeSelect } from './ModeSelect'
import { OnlineImpostor } from './OnlineImpostor'

export function ImpostorScreen() {
  const setScreen = useAppStore((state) => state.setScreen)
  const phase = useImpostorStore((state) => state.phase)
  const playMode = useImpostorStore((state) => state.playMode)
  const reset = useImpostorStore((state) => state.reset)
  const setPlayMode = useImpostorStore((state) => state.setPlayMode)
  const snapshot = useOnlineStore((state) => state.snapshot)
  const onlineView = useOnlineStore((state) => state.view)
  const leaveRoom = useOnlineStore((state) => state.leaveRoom)
  const resetOnline = useOnlineStore((state) => state.reset)
  const tryRejoin = useOnlineStore((state) => state.tryRejoin)

  useEffect(() => {
    if (tryRejoin()) setPlayMode('online')
  }, [tryRejoin, setPlayMode])

  const goBack = () => {
    if (playMode === 'online') {
      if (snapshot || onlineView !== 'menu') {
        leaveRoom()
        resetOnline()
        setPlayMode(null)
        return
      }
      setPlayMode(null)
      return
    }
    if (phase === 'setup') {
      setPlayMode(null)
      return
    }
    if (phase !== 'mode') {
      reset()
      return
    }
    reset()
    setScreen('home')
  }

  const title =
    playMode === 'online' && snapshot?.code ? `Imposteur · ${snapshot.code}` : 'Imposteur'

  return (
    <Screen title={title} onBack={goBack}>
      <AnimatePresence mode="wait">
        {playMode === 'online' ? <OnlineImpostor key="online" /> : null}
        {playMode !== 'online' && phase === 'mode' ? <ModeSelect key="mode" /> : null}
        {playMode === 'offline' && phase === 'setup' ? <Setup key="setup" /> : null}
        {playMode === 'offline' &&
        (phase === 'handoff' || phase === 'description-handoff' || phase === 'vote-handoff') ? (
          <Handoff key="handoff" />
        ) : null}
        {playMode === 'offline' && phase === 'role' ? <RoleReveal key="role" /> : null}
        {playMode === 'offline' && phase === 'description' ? <Description key="desc" /> : null}
        {playMode === 'offline' && phase === 'discussion' ? <Discussion key="disc" /> : null}
        {playMode === 'offline' && phase === 'vote' ? <VotePhase key="vote" /> : null}
        {playMode === 'offline' && phase === 'guess' ? <Guess key="guess" /> : null}
        {playMode === 'offline' && phase === 'result' ? <RoundResult key="result" /> : null}
        {playMode === 'offline' && phase === 'gameover' ? <GameOver key="end" /> : null}
      </AnimatePresence>
    </Screen>
  )
}

function Setup() {
  const config = useImpostorStore((state) => state.config)
  const setConfig = useImpostorStore((state) => state.setConfig)
  const startGame = useImpostorStore((state) => state.startGame)
  const lobby = useAppStore((state) => state.players)
  const [error, setError] = useState('')

  const toggleCategory = (id: string) => {
    const selected = config.categoryIds.includes(id)
      ? config.categoryIds.filter((item) => item !== id)
      : [...config.categoryIds, id]
    setConfig({ categoryIds: selected.length ? selected : [id] })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <PlayerSetup min={4} helper="Un téléphone qui tourne. Personne ne spoile." />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet">Catégories</p>
        <div className="flex flex-wrap gap-2">
          {IMPOSTOR_CATEGORIES.map((category) => {
            const on = config.categoryIds.includes(category.id)
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${on ? 'bg-violet text-white' : 'glass'}`}
              >
                {category.icon} {category.name}
              </button>
            )
          })}
        </div>
      </div>
      <Card>
        <ToggleRow
          label="Mr White"
          hint="Sans mot. S’il est voté, lui seul a le droit de deviner."
          value={config.allowMrWhite}
          onChange={(allowMrWhite) => setConfig({ allowMrWhite })}
        />
        <ToggleRow
          label="Multi-imposteurs"
          hint="À partir de 7 joueurs"
          value={config.multipleImpostors}
          onChange={(multipleImpostors) => setConfig({ multipleImpostors })}
        />
        <label className="mt-3 flex items-center justify-between gap-3 text-sm">
          Discussion
          <input
            type="range"
            min={60}
            max={300}
            step={30}
            value={config.discussionTime}
            onChange={(event) => setConfig({ discussionTime: Number(event.target.value) })}
          />
          <span className="w-10 text-right text-violet">{Math.round(config.discussionTime / 60)}m</span>
        </label>
      </Card>
      {error ? <p className="text-sm text-rose">{error}</p> : null}
      <Button
        onClick={() => {
          const message = startGame(lobby)
          setError(message ?? '')
        }}
        disabled={lobby.length < 4}
      >
        Lancer la partie
      </Button>
    </motion.div>
  )
}

function Handoff() {
  const players = useImpostorStore((state) => state.players)
  const turnIndex = useImpostorStore((state) => state.turnIndex)
  const phase = useImpostorStore((state) => state.phase)
  const confirmHandoff = useImpostorStore((state) => state.confirmHandoff)
  const player = players[turnIndex]
  if (!player) return null
  const subtitle =
    phase === 'vote-handoff' ? 'Vote secret' : phase === 'description-handoff' ? 'Ton indice' : 'Révélation du rôle'
  return <PassPhone name={player.name} color={player.color} subtitle={subtitle} onConfirm={confirmHandoff} />
}

function RoleReveal() {
  const players = useImpostorStore((state) => state.players)
  const turnIndex = useImpostorStore((state) => state.turnIndex)
  const hideRole = useImpostorStore((state) => state.hideRole)
  const [flipped, setFlipped] = useState(false)
  const player = players[turnIndex]
  if (!player) return null
  const copy = ROLE_COPY[player.role]

  return (
    <div className="flex flex-1 flex-col items-center">
      <p className="text-sm text-ink/60 dark:text-white/60">
        {turnIndex + 1}/{players.length} · {player.name}
      </p>
      <button type="button" className="perspective-card relative mt-8 h-72 w-full max-w-sm" onClick={() => setFlipped(true)}>
        <motion.div className="preserve-3d relative h-full w-full" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6 }}>
          <div className="backface-hidden glass absolute inset-0 flex flex-col items-center justify-center rounded-3xl">
            <Eye className="mb-3 text-violet" />
            <p className="font-heading text-xl font-bold">Appuie pour révéler</p>
          </div>
          <div
            className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-6"
            style={{ transform: 'rotateY(180deg)', background: copy.bg, color: copy.fg }}
          >
            <RoleIcon role={player.role} size="xl" plain />
            <p className="mt-3 font-heading text-3xl font-extrabold">{copy.title}</p>
            {player.word ? (
              <p className="mt-4 font-display text-4xl italic">{player.word}</p>
            ) : (
              <p className="mt-4 text-lg opacity-80">Aucun mot</p>
            )}
            <p className="mt-4 text-center text-sm opacity-80">{copy.hint}</p>
          </div>
        </motion.div>
      </button>
      <div className="mt-8 w-full">
        <Button onClick={hideRole} disabled={!flipped}>
          Cacher et passer
        </Button>
      </div>
    </div>
  )
}

function Description() {
  const players = useImpostorStore((state) => state.players)
  const turnIndex = useImpostorStore((state) => state.turnIndex)
  const submitClue = useImpostorStore((state) => state.submitClue)
  const skipClue = useImpostorStore((state) => state.skipClue)
  const cheatWarning = useImpostorStore((state) => state.cheatWarning)
  const descriptionTime = useImpostorStore((state) => state.config.descriptionTime)
  const [clue, setClue] = useState('')
  const player = players[turnIndex]
  if (!player) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="text-center">
        <Avatar name={player.name} color={player.color} size="h-14 w-14" />
        <h2 className="mt-2 font-heading text-2xl font-bold">{player.name}</h2>
        <p className="text-sm text-ink/60 dark:text-white/60">Un indice. Pas le mot.</p>
      </div>
      <Timer seconds={descriptionTime} onEnd={skipClue} />
      <Input value={clue} placeholder="Ton indice..." onChange={(event) => setClue(event.target.value)} />
      {cheatWarning ? <p className="rounded-2xl bg-red-500/15 p-3 text-sm text-rose">{cheatWarning}</p> : null}
      <Button
        onClick={() => {
          submitClue(clue)
          setClue('')
        }}
        disabled={!clue.trim()}
      >
        Envoyer l’indice
      </Button>
      <Button variant="ghost" onClick={skipClue}>
        J’ai parlé, suivant
      </Button>
    </motion.div>
  )
}

function Discussion() {
  const players = useImpostorStore((state) => state.players)
  const notes = useImpostorStore((state) => state.notes)
  const setNotes = useImpostorStore((state) => state.setNotes)
  const cheatWarning = useImpostorStore((state) => state.cheatWarning)
  const discussionTime = useImpostorStore((state) => state.config.discussionTime)
  const startVote = useImpostorStore((state) => state.startVote)
  const round = useImpostorStore((state) => state.round)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-violet">Manche {round} · Discussion</p>
      <Timer seconds={discussionTime} onEnd={startVote} />
      <div className="space-y-2">
        {players
          .filter((player) => !player.isEliminated && player.clue)
          .map((player) => (
            <Card key={player.id} className="flex items-center gap-3 py-3">
              <Avatar name={player.name} color={player.color} />
              <span className="font-semibold">{player.name}</span>
              <span className="ml-auto text-violet">{player.clue}</span>
            </Card>
          ))}
      </div>
      <Input
        label="Notes (anti-triche)"
        value={notes}
        placeholder="Vos soupçons..."
        onChange={(event) => setNotes(event.target.value)}
      />
      {cheatWarning ? <p className="text-sm text-rose">{cheatWarning}</p> : null}
      <Button onClick={startVote}>
        <Vote size={18} /> Passer au vote
      </Button>
    </motion.div>
  )
}

function VotePhase() {
  const players = useImpostorStore((state) => state.players)
  const turnIndex = useImpostorStore((state) => state.turnIndex)
  const submitVote = useImpostorStore((state) => state.submitVote)
  const current = players[turnIndex]
  if (!current) return null
  const targets = players.filter((player) => !player.isEliminated && player.id !== current.id)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-violet">Vote de</p>
        <h2 className="font-heading text-2xl font-bold">{current.name}</h2>
      </div>
      {targets.map((player) => (
        <button
          key={player.id}
          type="button"
          onClick={() => submitVote(player.id)}
          className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left"
        >
          <Avatar name={player.name} color={player.color} />
          <span className="font-semibold">{player.name}</span>
        </button>
      ))}
    </motion.div>
  )
}

function Guess() {
  const guessInput = useImpostorStore((state) => state.guessInput)
  const setGuessInput = useImpostorStore((state) => state.setGuessInput)
  const submitGuess = useImpostorStore((state) => state.submitGuess)
  const skipGuess = useImpostorStore((state) => state.skipGuess)
  const eliminatedId = useImpostorStore((state) => state.eliminatedId)
  const players = useImpostorStore((state) => state.players)
  const player = players.find((item) => item.id === eliminatedId)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
      <p className="text-sm text-violet">{player?.name} est Mr White</p>
      <h2 className="font-heading text-2xl font-bold">Dernière chance : devine le mot des civils</h2>
      <p className="text-sm text-ink/60 dark:text-white/60">Seul Mr White a ce droit. Un imposteur éliminé est simplement sorti.</p>
      <Input value={guessInput} placeholder="Le mot..." onChange={(event) => setGuessInput(event.target.value)} />
      <Button onClick={submitGuess} disabled={!guessInput.trim()}>
        Valider
      </Button>
      <Button variant="ghost" onClick={skipGuess}>
        Passer
      </Button>
    </motion.div>
  )
}

function RoundResult() {
  const players = useImpostorStore((state) => state.players)
  const eliminatedId = useImpostorStore((state) => state.eliminatedId)
  const nextRound = useImpostorStore((state) => state.nextRound)
  const player = players.find((item) => item.id === eliminatedId)

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-rose">Éliminé</p>
      {player ? <RoleIcon role={player.role} size="lg" showLabel /> : null}
      <h2 className="font-heading text-3xl font-extrabold">{player?.name}</h2>
      <div className="flex flex-wrap justify-center gap-2">
        {players.map((item) => (
          <Avatar key={item.id} name={item.name} color={item.color} dim={item.isEliminated} />
        ))}
      </div>
      <Button onClick={nextRound}>Manche suivante</Button>
    </motion.div>
  )
}

function GameOver() {
  const winner = useImpostorStore((state) => state.winner)
  const players = useImpostorStore((state) => state.players)
  const goodWord = useImpostorStore((state) => state.goodWord)
  const fakeWord = useImpostorStore((state) => state.fakeWord)
  const setPlayMode = useImpostorStore((state) => state.setPlayMode)
  const title =
    winner === 'CIVILS' ? 'Les civils gagnent' : winner === 'MR_WHITE' ? 'Mr White gagne' : 'Les imposteurs gagnent'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative space-y-5 text-center">
      <Confetti />
      <Trophy className="mx-auto text-gold" size={42} />
      <h2 className="font-display text-4xl italic">{title}</h2>
      <Card>
        <p className="text-sm text-ink/50 dark:text-white/50">Mot civil</p>
        <p className="font-heading text-2xl font-bold">{goodWord}</p>
        <p className="mt-3 text-sm text-ink/50 dark:text-white/50">Mot imposteur</p>
        <p className="font-heading text-xl">{fakeWord}</p>
      </Card>
      <div className="space-y-2">
        {players.map((player) => (
          <Card key={player.id} className="flex items-center gap-3 py-3">
            <Avatar name={player.name} color={player.color} dim={player.isEliminated} />
            <span className="font-semibold">{player.name}</span>
            <span className="ml-auto">
              <RoleIcon role={player.role} size="sm" showLabel />
            </span>
          </Card>
        ))}
      </div>
      <Button onClick={() => setPlayMode('offline')}>Rejouer</Button>
    </motion.div>
  )
}
