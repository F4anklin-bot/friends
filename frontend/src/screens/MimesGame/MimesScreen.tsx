import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SkipForward, Trophy } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Screen } from '../../components/layout/Screen'
import { Avatar } from '../../components/game/Avatar'
import { Confetti } from '../../components/game/Confetti'
import { PlayerSetup } from '../../components/game/PlayerSetup'
import { Timer } from '../../components/game/Timer'
import { MIME_CATEGORIES } from '../../data/mimesWords'
import { useAppStore } from '../../store/appStore'
import { useMimesStore } from '../../store/mimesStore'

export function MimesScreen() {
  const setScreen = useAppStore((state) => state.setScreen)
  const reset = useMimesStore((state) => state.reset)
  const phase = useMimesStore((state) => state.phase)

  return (
    <Screen
      title="Mimes"
      onBack={() => {
        reset()
        setScreen('home')
      }}
    >
      <AnimatePresence mode="wait">
        {phase === 'setup' ? <Setup key="setup" /> : null}
        {phase === 'ready' ? <Ready key="ready" /> : null}
        {phase === 'play' ? <Play key="play" /> : null}
        {phase === 'score' ? <TurnScore key="score" /> : null}
        {phase === 'end' ? <End key="end" /> : null}
      </AnimatePresence>
    </Screen>
  )
}

function Setup() {
  const lobby = useAppStore((state) => state.players)
  const config = useMimesStore((state) => state.config)
  const setConfig = useMimesStore((state) => state.setConfig)
  const startGame = useMimesStore((state) => state.startGame)
  const [error, setError] = useState('')

  const toggle = (id: string) => {
    const next = config.categoryIds.includes(id)
      ? config.categoryIds.filter((item) => item !== id)
      : [...config.categoryIds, id]
    setConfig({ categoryIds: next.length ? next : [id] })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <PlayerSetup
        min={0}
        optional
        helper="Pas obligatoire. Sans prénoms, on joue juste autour de la table."
      />
      <div className="flex flex-wrap gap-2">
        {MIME_CATEGORIES.map((category) => {
          const on = config.categoryIds.includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggle(category.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${on ? 'bg-gold text-ink' : 'glass'}`}
            >
              {category.icon} {category.name}
            </button>
          )
        })}
      </div>
      <Card>
        <label className="flex items-center justify-between text-sm">
          Timer
          <input
            type="range"
            min={30}
            max={120}
            step={15}
            value={config.roundTime}
            onChange={(event) => setConfig({ roundTime: Number(event.target.value) })}
          />
          <span className="w-10 text-right text-gold">{config.roundTime}s</span>
        </label>
        <label className="mt-3 flex items-center justify-between text-sm">
          Passes
          <input
            type="range"
            min={0}
            max={5}
            value={config.passAllowed}
            onChange={(event) => setConfig({ passAllowed: Number(event.target.value) })}
          />
          <span className="w-10 text-right text-gold">{config.passAllowed}</span>
        </label>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-between py-2"
          onClick={() => setConfig({ teamMode: !config.teamMode })}
        >
          <span className="text-sm font-semibold">Mode équipes</span>
          <span className={`h-7 w-12 rounded-full p-1 ${config.teamMode ? 'bg-gold' : 'bg-white/10'}`}>
            <span className={`block h-5 w-5 rounded-full bg-white transition ${config.teamMode ? 'translate-x-5' : ''}`} />
          </span>
        </button>
      </Card>
      {error ? <p className="text-sm text-rose">{error}</p> : null}
      <Button variant="gold" onClick={() => setError(startGame(lobby) ?? '')}>
        C’est parti
      </Button>
    </motion.div>
  )
}

function actorLabel(
  players: { name: string; color: string }[],
  actorIndex: number,
  teamMode: boolean,
) {
  const actor = players[actorIndex]
  if (actor) return { title: actor.name, color: actor.color, named: true }
  if (teamMode) {
    return {
      title: actorIndex % 2 === 0 ? 'Équipe A' : 'Équipe B',
      color: actorIndex % 2 === 0 ? '#FFD700' : '#8B5CF6',
      named: false,
    }
  }
  return { title: 'Le mime', color: '#FFD700', named: false }
}

function Ready() {
  const players = useMimesStore((state) => state.players)
  const actorIndex = useMimesStore((state) => state.actorIndex)
  const teamMode = useMimesStore((state) => state.config.teamMode)
  const beginTurn = useMimesStore((state) => state.beginTurn)
  const finish = useMimesStore((state) => state.finish)
  const actor = actorLabel(players, actorIndex, teamMode)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">{actor.named ? 'Au tour de' : 'À vous'}</p>
      {actor.named ? <Avatar name={actor.title} color={actor.color} size="h-24 w-24" /> : null}
      <h2 className="mt-4 font-display text-4xl italic">{actor.title}</h2>
      <p className="mt-2 max-w-xs text-sm text-ink/60 dark:text-white/60">
        Les autres regardent ailleurs. Le mime découvre le mot, puis c’est parti.
      </p>
      <div className="mt-8 w-full space-y-2">
        <Button variant="gold" onClick={beginTurn}>
          Montrer le mot
        </Button>
        <Button variant="ghost" onClick={finish}>
          Terminer la partie
        </Button>
      </div>
    </motion.div>
  )
}

function Play() {
  const currentWord = useMimesStore((state) => state.currentWord)
  const forbidden = useMimesStore((state) => state.forbidden)
  const hints = useMimesStore((state) => state.hints)
  const passesLeft = useMimesStore((state) => state.passesLeft)
  const foundThisTurn = useMimesStore((state) => state.foundThisTurn)
  const roundTime = useMimesStore((state) => state.config.roundTime)
  const foundWord = useMimesStore((state) => state.foundWord)
  const passWord = useMimesStore((state) => state.passWord)
  const endTurn = useMimesStore((state) => state.endTurn)

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center">
      <Timer seconds={roundTime} onEnd={endTurn} />
      <Card className="py-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Mime ceci</p>
        <p className="mt-2 font-display text-4xl italic">{currentWord}</p>
        <p className="mt-4 text-xs text-rose">Interdit : {forbidden.join(', ')}</p>
        <p className="mt-2 text-xs text-ink/50 dark:text-white/50">Geste : {hints.join(' · ')}</p>
      </Card>
      <p className="text-sm">
        Trouvés ce tour : <strong>{foundThisTurn}</strong>
      </p>
      <Button variant="gold" onClick={foundWord}>
        Trouvé !
      </Button>
      <Button variant="secondary" onClick={passWord} disabled={passesLeft <= 0}>
        <SkipForward size={16} /> Passer ({passesLeft})
      </Button>
      <Button variant="ghost" onClick={endTurn}>
        Fin du tour
      </Button>
    </motion.div>
  )
}

function TurnScore() {
  const foundThisTurn = useMimesStore((state) => state.foundThisTurn)
  const nextPlayer = useMimesStore((state) => state.nextPlayer)
  const scores = useMimesStore((state) => state.scores)
  const players = useMimesStore((state) => state.players)
  const teamMode = useMimesStore((state) => state.config.teamMode)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
      <h2 className="font-heading text-3xl font-extrabold">+{foundThisTurn} pt</h2>
      <ScoreBoard players={players} scores={scores} teamMode={teamMode} />
      <Button variant="gold" onClick={nextPlayer}>
        {players.length === 0 ? 'Mime suivant' : 'Joueur suivant'}
      </Button>
    </motion.div>
  )
}

function ScoreBoard({
  players,
  scores,
  teamMode,
  ranked = false,
}: {
  players: { id: string; name: string; color: string }[]
  scores: Record<string, number>
  teamMode: boolean
  ranked?: boolean
}) {
  if (players.length === 0) {
    if (teamMode) {
      return (
        <>
          <Card className="flex items-center justify-between py-3">
            <span className="font-semibold">Équipe A</span>
            <span className="font-heading text-gold">{scores['team-a'] ?? 0}</span>
          </Card>
          <Card className="flex items-center justify-between py-3">
            <span className="font-semibold">Équipe B</span>
            <span className="font-heading text-gold">{scores['team-b'] ?? 0}</span>
          </Card>
        </>
      )
    }
    return (
      <Card className="flex items-center justify-between py-3">
        <span className="font-semibold">Mots trouvés</span>
        <span className="font-heading text-gold">{scores.group ?? 0}</span>
      </Card>
    )
  }

  const rows = ranked
    ? [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
    : players

  return (
    <>
      {rows.map((player, index) => (
        <Card key={player.id} className="flex items-center gap-3 py-3">
          {ranked ? <span className="w-6 font-heading text-gold">{index + 1}</span> : null}
          <Avatar name={player.name} color={player.color} />
          <span className="font-semibold">{player.name}</span>
          <span className="ml-auto font-heading text-gold">{scores[player.id] ?? 0}</span>
        </Card>
      ))}
    </>
  )
}

function End() {
  const players = useMimesStore((state) => state.players)
  const scores = useMimesStore((state) => state.scores)
  const teamMode = useMimesStore((state) => state.config.teamMode)
  const reset = useMimesStore((state) => state.reset)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative space-y-4 text-center">
      <Confetti />
      <Trophy className="mx-auto text-gold" />
      <h2 className="font-display text-4xl italic">{players.length === 0 ? 'Fin de partie' : 'Classement'}</h2>
      <ScoreBoard players={players} scores={scores} teamMode={teamMode} ranked />
      <Button variant="gold" onClick={reset}>
        Rejouer
      </Button>
    </motion.div>
  )
}
