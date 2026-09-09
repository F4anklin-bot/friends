import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Crown, Eye, Share2, Trophy, Vote, WifiOff } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Input } from '../../components/common/Input'
import { ToggleRow } from '../../components/common/ToggleRow'
import { Avatar } from '../../components/game/Avatar'
import { RoleIcon } from '../../components/game/RoleIcon'
import { Confetti } from '../../components/game/Confetti'
import { Timer } from '../../components/game/Timer'
import { IMPOSTOR_CATEGORIES } from '../../data/impostorWords'
import { ROLE_COPY } from '../../game/impostorCopy'
import { useOnlineStore } from '../../store/onlineImpostorStore'
import { haptic } from '../../utils/helpers'

export function OnlineImpostor() {
  const view = useOnlineStore((state) => state.view)
  const snapshot = useOnlineStore((state) => state.snapshot)
  if (view === 'play' && snapshot) return <OnlinePlay />
  if (view === 'create') return <CreateForm />
  if (view === 'join') return <JoinForm />
  return <OnlineMenu />
}

function OnlineMenu() {
  const setView = useOnlineStore((state) => state.setView)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <Button onClick={() => setView('create')}>Créer une partie</Button>
      <Button variant="secondary" onClick={() => setView('join')}>
        Rejoindre avec un code
      </Button>
    </motion.div>
  )
}

function CreateForm() {
  const myName = useOnlineStore((state) => state.myName)
  const setMyName = useOnlineStore((state) => state.setMyName)
  const createRoom = useOnlineStore((state) => state.createRoom)
  const error = useOnlineStore((state) => state.error)
  const setView = useOnlineStore((state) => state.setView)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <Input
        label="Ton prénom"
        value={myName}
        placeholder="Ex. Lina"
        onChange={(event) => setMyName(event.target.value)}
      />
      {error ? <p className="text-sm text-rose">{error}</p> : null}
      <Button disabled={myName.trim().length < 2} onClick={createRoom}>
        Générer un code
      </Button>
      <Button variant="ghost" onClick={() => setView('menu')}>
        Retour
      </Button>
    </motion.div>
  )
}

function JoinForm() {
  const myName = useOnlineStore((state) => state.myName)
  const joinCode = useOnlineStore((state) => state.joinCode)
  const setMyName = useOnlineStore((state) => state.setMyName)
  const setJoinCode = useOnlineStore((state) => state.setJoinCode)
  const joinRoom = useOnlineStore((state) => state.joinRoom)
  const error = useOnlineStore((state) => state.error)
  const setView = useOnlineStore((state) => state.setView)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <Input
        label="Ton prénom"
        value={myName}
        placeholder="Ex. Noah"
        onChange={(event) => setMyName(event.target.value)}
      />
      <Input
        label="Code de la partie"
        value={joinCode}
        placeholder="ABC123"
        maxLength={6}
        className="text-center font-heading text-2xl tracking-[0.35em]"
        onChange={(event) => setJoinCode(event.target.value.replace(/[^a-z0-9]/gi, ''))}
      />
      {error ? <p className="text-sm text-rose">{error}</p> : null}
      <Button disabled={myName.trim().length < 2 || joinCode.trim().length < 4} onClick={joinRoom}>
        Rejoindre
      </Button>
      <Button variant="ghost" onClick={() => setView('menu')}>
        Retour
      </Button>
    </motion.div>
  )
}

function OnlinePlay() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  if (!snapshot) return null
  return (
    <AnimatePresence mode="wait">
      {snapshot.phase === 'lobby' ? <Lobby key="lobby" /> : null}
      {snapshot.phase === 'role' ? <Role key="role" /> : null}
      {snapshot.phase === 'description' ? <Description key="desc" /> : null}
      {snapshot.phase === 'discussion' ? <Discussion key="disc" /> : null}
      {snapshot.phase === 'vote' ? <VotePhase key="vote" /> : null}
      {snapshot.phase === 'guess' ? <Guess key="guess" /> : null}
      {snapshot.phase === 'result' ? <Result key="result" /> : null}
      {snapshot.phase === 'gameover' ? <GameOver key="end" /> : null}
    </AnimatePresence>
  )
}

function ConnectionBadge() {
  const connected = useOnlineStore((state) => state.connected)
  if (connected) return null
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-rose">
      <WifiOff size={14} /> Reconnexion…
    </p>
  )
}

function Lobby() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  const setConfig = useOnlineStore((state) => state.setConfig)
  const startMatch = useOnlineStore((state) => state.startMatch)
  const kick = useOnlineStore((state) => state.kick)
  const error = useOnlineStore((state) => state.error)
  const [copied, setCopied] = useState(false)
  if (!snapshot) return null
  const me = snapshot.players.find((player) => player.id === snapshot.myId)
  const isHost = Boolean(me?.isHost)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(snapshot.code)
      setCopied(true)
      haptic(12)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const share = async () => {
    const text = `Rejoins ma partie Imposteur sur Friends. Code : ${snapshot.code}`
    if (navigator.share) {
      await navigator.share({ title: 'Friends — Imposteur', text })
      return
    }
    await copyCode()
  }

  const toggleCategory = (id: string) => {
    const selected = snapshot.config.categoryIds.includes(id)
      ? snapshot.config.categoryIds.filter((item) => item !== id)
      : [...snapshot.config.categoryIds, id]
    setConfig({ categoryIds: selected.length ? selected : [id] })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <ConnectionBadge />
      <Card className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-violet">Code à partager</p>
        <p className="mt-2 font-heading text-4xl font-extrabold tracking-[0.28em]">{snapshot.code}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={copyCode}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button variant="secondary" onClick={() => void share()}>
            <Share2 size={16} /> Partager
          </Button>
        </div>
      </Card>
      <div className="space-y-2">
        {snapshot.players.map((player) => (
          <Card key={player.id} className="flex items-center gap-3 py-3">
            <Avatar name={player.name} color={player.color} dim={!player.connected} />
            <span className="font-semibold">{player.name}</span>
            {player.isHost ? <Crown size={14} className="text-gold" /> : null}
            {player.id === snapshot.myId ? <span className="text-xs text-violet">toi</span> : null}
            {isHost && !player.isHost ? (
              <button type="button" className="ml-auto text-xs text-rose" onClick={() => kick(player.id)}>
                Expulser
              </button>
            ) : (
              <span className="ml-auto text-xs text-ink/40">{player.connected ? 'en ligne' : 'absent'}</span>
            )}
          </Card>
        ))}
      </div>
      <p className="text-xs text-ink/50 dark:text-white/50">{snapshot.players.length}/20 · 4 minimum pour lancer</p>
      {isHost ? (
        <>
          <div className="flex flex-wrap gap-2">
            {IMPOSTOR_CATEGORIES.map((category) => {
              const on = snapshot.config.categoryIds.includes(category.id)
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
          <Card>
            <ToggleRow
              label="Mr White"
              hint="Un joueur sans mot — lui seul peut deviner s’il est voté"
              value={snapshot.config.allowMrWhite}
              onChange={(allowMrWhite) => setConfig({ allowMrWhite })}
            />
            <ToggleRow
              label="Multi-imposteurs"
              hint="À partir de 7 joueurs"
              value={snapshot.config.multipleImpostors}
              onChange={(multipleImpostors) => setConfig({ multipleImpostors })}
            />
            <label className="mt-3 flex items-center justify-between gap-3 text-sm">
              Discussion
              <input
                type="range"
                min={60}
                max={300}
                step={30}
                value={snapshot.config.discussionTime}
                onChange={(event) => setConfig({ discussionTime: Number(event.target.value) })}
              />
              <span className="w-10 text-right text-violet">{Math.round(snapshot.config.discussionTime / 60)}m</span>
            </label>
          </Card>
          {error ? <p className="text-sm text-rose">{error}</p> : null}
          <Button disabled={snapshot.players.length < 4} onClick={startMatch}>
            Lancer la partie
          </Button>
        </>
      ) : (
        <p className="text-center text-sm text-ink/60 dark:text-white/60">En attente de l’hôte…</p>
      )}
    </motion.div>
  )
}

function Role() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  const ready = useOnlineStore((state) => state.ready)
  const [flipped, setFlipped] = useState(false)
  if (!snapshot?.myRole) return null
  const copy = ROLE_COPY[snapshot.myRole]
  const me = snapshot.players.find((player) => player.id === snapshot.myId)
  const readyCount = snapshot.players.filter((player) => player.ready).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
      <p className="text-sm text-ink/60 dark:text-white/60">
        {readyCount}/{snapshot.players.length} prêts
      </p>
      <button type="button" className="perspective-card relative mt-6 h-72 w-full" onClick={() => setFlipped(true)}>
        <motion.div className="preserve-3d relative h-full w-full" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6 }}>
          <div className="backface-hidden glass absolute inset-0 flex flex-col items-center justify-center rounded-3xl">
            <Eye className="mb-3 text-violet" />
            <p className="font-heading text-xl font-bold">Appuie pour révéler</p>
            <p className="mt-1 text-sm opacity-60">Personne autour de toi ne doit voir.</p>
          </div>
          <div
            className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-6"
            style={{ transform: 'rotateY(180deg)', background: copy.bg, color: copy.fg }}
          >
            <RoleIcon role={snapshot.myRole} size="xl" plain />
            <p className="mt-3 font-heading text-3xl font-extrabold">{copy.title}</p>
            {snapshot.myWord ? (
              <p className="mt-4 font-display text-4xl italic">{snapshot.myWord}</p>
            ) : (
              <p className="mt-4 text-lg opacity-80">Aucun mot</p>
            )}
            <p className="mt-4 text-center text-sm opacity-80">{copy.hint}</p>
          </div>
        </motion.div>
      </button>
      <div className="mt-8 w-full">
        <Button onClick={ready} disabled={!flipped || me?.ready}>
          {me?.ready ? 'En attente des autres…' : 'C’est vu, je suis prêt'}
        </Button>
      </div>
    </motion.div>
  )
}

function Description() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  const sendClue = useOnlineStore((state) => state.sendClue)
  const skipClue = useOnlineStore((state) => state.skipClue)
  const warning = useOnlineStore((state) => state.warning)
  const [clue, setClue] = useState('')
  if (!snapshot) return null
  const current = snapshot.players.find((player) => player.id === snapshot.turnPlayerId)
  const myTurn = snapshot.turnPlayerId === snapshot.myId

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 text-center">
      {snapshot.phaseEndsAt ? <Timer endsAt={snapshot.phaseEndsAt} /> : null}
      <Avatar name={current?.name ?? '?'} color={current?.color ?? '#8B5CF6'} size="h-16 w-16" />
      <h2 className="font-heading text-2xl font-bold">{current?.name}</h2>
      {myTurn ? (
        <>
          <p className="text-sm text-ink/60 dark:text-white/60">À toi. Un indice, pas le mot.</p>
          <Input value={clue} placeholder="Ton indice..." onChange={(event) => setClue(event.target.value)} />
          {warning ? <p className="rounded-2xl bg-red-500/15 p-3 text-sm text-rose">{warning}</p> : null}
          <Button
            onClick={() => {
              sendClue(clue)
              setClue('')
            }}
            disabled={!clue.trim()}
          >
            Envoyer
          </Button>
          <Button variant="ghost" onClick={skipClue}>
            J’ai parlé à l’oral
          </Button>
        </>
      ) : (
        <p className="text-sm text-ink/60 dark:text-white/60">Écoute l’indice. Ce n’est pas ton tour.</p>
      )}
      <ClueList />
    </motion.div>
  )
}

function ClueList() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  if (!snapshot) return null
  const clues = snapshot.players.filter((player) => player.clue)
  if (clues.length === 0) return null
  return (
    <div className="space-y-2 text-left">
      {clues.map((player) => (
        <Card key={player.id} className="flex items-center gap-3 py-3">
          <Avatar name={player.name} color={player.color} />
          <span className="font-semibold">{player.name}</span>
          <span className="ml-auto text-violet">{player.clue}</span>
        </Card>
      ))}
    </div>
  )
}

function Discussion() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  const sendChat = useOnlineStore((state) => state.sendChat)
  const startVote = useOnlineStore((state) => state.startVote)
  const warning = useOnlineStore((state) => state.warning)
  const [text, setText] = useState('')
  if (!snapshot) return null
  const me = snapshot.players.find((player) => player.id === snapshot.myId)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-violet">Manche {snapshot.round} · Discussion</p>
      {snapshot.phaseEndsAt ? <Timer endsAt={snapshot.phaseEndsAt} /> : null}
      <ClueList />
      <div className="max-h-40 space-y-2 overflow-y-auto no-scrollbar">
        {snapshot.chat.map((line) => (
          <p key={line.id} className="text-sm">
            <span className="font-semibold text-violet">{line.name}</span> {line.text}
          </p>
        ))}
      </div>
      <Input
        value={text}
        placeholder="Discuter (sans le mot)…"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && text.trim()) {
            sendChat(text)
            setText('')
          }
        }}
      />
      {warning ? <p className="text-sm text-rose">{warning}</p> : null}
      <Button onClick={startVote}>
        <Vote size={16} /> Passer au vote
      </Button>
      {me?.isHost ? <p className="text-center text-xs text-ink/40">Le timer lance le vote tout seul.</p> : null}
    </motion.div>
  )
}

function VotePhase() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  const vote = useOnlineStore((state) => state.vote)
  const forceVote = useOnlineStore((state) => state.forceVote)
  if (!snapshot) return null
  const me = snapshot.players.find((player) => player.id === snapshot.myId)
  const alive = snapshot.players.filter((player) => !player.isEliminated)
  const voted = alive.filter((player) => player.hasVoted).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-violet">
        Vote secret · {voted}/{alive.length}
      </p>
      {me?.isEliminated ? (
        <p className="text-center text-sm">Tu observes. Les autres votent.</p>
      ) : (
        alive
          .filter((player) => player.id !== snapshot.myId)
          .map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => vote(player.id)}
              disabled={Boolean(me?.hasVoted)}
              className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left disabled:opacity-50"
            >
              <Avatar name={player.name} color={player.color} />
              <span className="font-semibold">{player.name}</span>
              {player.hasVoted ? <Check size={16} className="ml-auto text-violet" /> : null}
            </button>
          ))
      )}
      {me?.isHost ? (
        <Button variant="ghost" onClick={forceVote}>
          Dépouiller maintenant
        </Button>
      ) : null}
    </motion.div>
  )
}

function Guess() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  const guess = useOnlineStore((state) => state.guess)
  const skipGuess = useOnlineStore((state) => state.skipGuess)
  const [word, setWord] = useState('')
  if (!snapshot) return null
  const accused = snapshot.players.find((player) => player.id === snapshot.eliminatedId)
  const isWhite = snapshot.myId === snapshot.eliminatedId && snapshot.myRole === 'MR_WHITE'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-rose">Mr White a été démasqué</p>
      {accused ? <Avatar name={accused.name} color={accused.color} size="h-16 w-16" /> : null}
      <h2 className="font-heading text-2xl font-bold">{accused?.name}</h2>
      {isWhite ? (
        <>
          <p className="text-sm text-ink/60 dark:text-white/60">Dernière chance : le mot des civils.</p>
          <Input value={word} placeholder="Le mot…" onChange={(event) => setWord(event.target.value)} />
          <Button disabled={!word.trim()} onClick={() => guess(word)}>
            Deviner
          </Button>
          <Button variant="ghost" onClick={skipGuess}>
            Je passe
          </Button>
        </>
      ) : (
        <p className="text-sm text-ink/60 dark:text-white/60">Mr White tente de deviner le mot. Attends.</p>
      )}
    </motion.div>
  )
}

function Result() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  const nextRound = useOnlineStore((state) => state.nextRound)
  if (!snapshot) return null
  const player = snapshot.players.find((item) => item.id === snapshot.eliminatedId)
  const me = snapshot.players.find((item) => item.id === snapshot.myId)
  const role = player?.revealedRole

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-rose">Éliminé</p>
      {player && role ? <RoleIcon role={role} size="lg" showLabel /> : null}
      <h2 className="font-heading text-3xl font-extrabold">{player?.name}</h2>
      <div className="flex flex-wrap justify-center gap-2">
        {snapshot.players.map((item) => (
          <Avatar key={item.id} name={item.name} color={item.color} dim={item.isEliminated} />
        ))}
      </div>
      {me?.isHost ? <Button onClick={nextRound}>Manche suivante</Button> : <p className="text-sm">L’hôte lance la manche suivante.</p>}
    </motion.div>
  )
}

function GameOver() {
  const snapshot = useOnlineStore((state) => state.snapshot)
  const replay = useOnlineStore((state) => state.replay)
  if (!snapshot) return null
  const me = snapshot.players.find((player) => player.id === snapshot.myId)
  const title =
    snapshot.winner === 'CIVILS'
      ? 'Les civils gagnent'
      : snapshot.winner === 'MR_WHITE'
        ? 'Mr White gagne'
        : 'Les imposteurs gagnent'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative space-y-5 text-center">
      <Confetti />
      <Trophy className="mx-auto text-gold" size={42} />
      <h2 className="font-display text-4xl italic">{title}</h2>
      <Card>
        <p className="text-sm text-ink/50 dark:text-white/50">Mot civil</p>
        <p className="font-heading text-2xl font-bold">{snapshot.goodWord}</p>
        <p className="mt-3 text-sm text-ink/50 dark:text-white/50">Mot imposteur</p>
        <p className="font-heading text-xl">{snapshot.fakeWord}</p>
      </Card>
      {snapshot.players.map((player) => (
        <Card key={player.id} className="flex items-center gap-3 py-3">
          <Avatar name={player.name} color={player.color} dim={player.isEliminated} />
          <span className="font-semibold">{player.name}</span>
          <span className="ml-auto">
            {player.revealedRole ? <RoleIcon role={player.revealedRole} size="sm" showLabel /> : null}
          </span>
        </Card>
      ))}
      {me?.isHost ? <Button onClick={replay}>Retour au salon</Button> : <p className="text-sm">En attente de l’hôte.</p>}
    </motion.div>
  )
}
