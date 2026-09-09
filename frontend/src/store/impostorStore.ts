import { create } from 'zustand'
import type { ImpostorConfig, ImpostorPhase, ImpostorPlayer, PlayMode, Player } from '../types/game'
import { containsSecret } from '../utils/antiCheat'
import {
  assignRoles,
  DEFAULT_IMPOSTOR_CONFIG,
  livingPlayers,
  resolveWinner,
  tallyElimination,
  type ImpostorWinner,
} from '../game/impostorEngine'

interface ImpostorState {
  playMode: PlayMode | null
  phase: ImpostorPhase
  config: ImpostorConfig
  players: ImpostorPlayer[]
  turnIndex: number
  round: number
  goodWord: string
  fakeWord: string
  notes: string
  cheatWarning: string | null
  guessInput: string
  eliminatedId: string | null
  winner: ImpostorWinner
  usedPairIds: string[]
  setPlayMode: (mode: PlayMode | null) => void
  setConfig: (partial: Partial<ImpostorConfig>) => void
  startGame: (lobby: Player[]) => string | null
  confirmHandoff: () => void
  hideRole: () => void
  submitClue: (clue: string) => boolean
  skipClue: () => void
  setNotes: (notes: string) => void
  startVote: () => void
  submitVote: (targetId: string) => void
  eliminatePlayer: (playerId: string) => void
  setGuessInput: (value: string) => void
  submitGuess: () => void
  skipGuess: () => void
  nextRound: () => void
  reset: () => void
}

function afterElimination(
  nextPlayers: ImpostorPlayer[],
  eliminatedId: string,
): Pick<ImpostorState, 'players' | 'eliminatedId' | 'winner' | 'phase' | 'cheatWarning'> {
  const eliminated = nextPlayers.find((player) => player.id === eliminatedId)
  const winner = resolveWinner(nextPlayers)
  const mrWhiteGuess = eliminated?.role === 'MR_WHITE'
  return {
    players: nextPlayers.map((player) => ({ ...player, voteFor: null })),
    eliminatedId,
    winner: mrWhiteGuess ? null : winner,
    cheatWarning: null,
    phase: mrWhiteGuess ? 'guess' : winner ? 'gameover' : 'result',
  }
}

export const useImpostorStore = create<ImpostorState>((set, get) => ({
  playMode: null,
  phase: 'mode',
  config: DEFAULT_IMPOSTOR_CONFIG,
  players: [],
  turnIndex: 0,
  round: 1,
  goodWord: '',
  fakeWord: '',
  notes: '',
  cheatWarning: null,
  guessInput: '',
  eliminatedId: null,
  winner: null,
  usedPairIds: [],
  setPlayMode: (playMode) => set({ playMode, phase: playMode === 'offline' ? 'setup' : 'mode' }),
  setConfig: (partial) => set({ config: { ...get().config, ...partial } }),
  startGame: (lobby) => {
    if (lobby.length < 4) return 'Il faut au moins 4 joueurs.'
    const deal = assignRoles(lobby, get().config, get().usedPairIds)
    set({
      phase: 'handoff',
      playMode: 'offline',
      players: deal.players,
      turnIndex: 0,
      round: 1,
      goodWord: deal.goodWord,
      fakeWord: deal.fakeWord,
      notes: '',
      cheatWarning: null,
      guessInput: '',
      eliminatedId: null,
      winner: null,
      usedPairIds: [...get().usedPairIds, deal.pairId],
    })
    return null
  },
  confirmHandoff: () => {
    const { phase } = get()
    if (phase === 'handoff') set({ phase: 'role' })
    if (phase === 'description-handoff') set({ phase: 'description', cheatWarning: null })
    if (phase === 'vote-handoff') set({ phase: 'vote' })
  },
  hideRole: () => {
    const { players, turnIndex } = get()
    if (turnIndex + 1 < players.length) {
      set({ turnIndex: turnIndex + 1, phase: 'handoff' })
      return
    }
    const firstAlive = livingPlayers(players)[0]
    const index = players.findIndex((player) => player.id === firstAlive?.id)
    set({ turnIndex: Math.max(0, index), phase: 'description-handoff' })
  },
  submitClue: (clue) => {
    const { players, turnIndex, goodWord, fakeWord } = get()
    const current = players[turnIndex]
    if (!current) return false
    const secrets = [current.word, goodWord, fakeWord].filter(Boolean)
    if (secrets.some((secret) => containsSecret(clue, secret))) {
      const warnings = current.warnings + 1
      const nextPlayers = players.map((player) =>
        player.id === current.id ? { ...player, warnings } : player,
      )
      set({
        players: nextPlayers,
        cheatWarning:
          warnings >= 3
            ? '3 avertissements : tu es éliminé pour triche.'
            : 'Tu ne peux pas révéler le mot secret !',
      })
      if (warnings >= 3) get().eliminatePlayer(current.id)
      return false
    }
    set({
      players: players.map((player, index) =>
        index === turnIndex ? { ...player, clue: clue.trim() } : player,
      ),
      cheatWarning: null,
    })
    get().skipClue()
    return true
  },
  skipClue: () => {
    const { players, turnIndex } = get()
    const alive = livingPlayers(players)
    const current = players[turnIndex]
    const pos = alive.findIndex((player) => player.id === current?.id)
    const nextAlive = alive[pos + 1]
    if (!nextAlive) {
      set({ phase: 'discussion', notes: '', cheatWarning: null })
      return
    }
    const nextIndex = players.findIndex((player) => player.id === nextAlive.id)
    set({ turnIndex: nextIndex, phase: 'description-handoff', cheatWarning: null })
  },
  setNotes: (notes) => {
    const { goodWord, fakeWord, players } = get()
    const secrets = [goodWord, fakeWord, ...players.map((player) => player.word)].filter(Boolean)
    if (secrets.some((secret) => containsSecret(notes, secret))) {
      set({ cheatWarning: '⚠️ Tu ne peux pas révéler ton mot !' })
      return
    }
    set({ notes, cheatWarning: null })
  },
  startVote: () => {
    const alive = livingPlayers(get().players)
    const first = get().players.findIndex((player) => player.id === alive[0]?.id)
    set({
      phase: 'vote-handoff',
      turnIndex: Math.max(0, first),
      cheatWarning: null,
    })
  },
  eliminatePlayer: (playerId) => {
    const nextPlayers = get().players.map((player) =>
      player.id === playerId ? { ...player, isEliminated: true } : player,
    )
    set(afterElimination(nextPlayers, playerId))
  },
  submitVote: (targetId) => {
    const { players, turnIndex } = get()
    const current = players[turnIndex]
    if (!current) return
    let nextPlayers = players.map((player, index) =>
      index === turnIndex ? { ...player, voteFor: targetId } : player,
    )
    const alive = livingPlayers(nextPlayers)
    const voters = alive.filter((player) => player.voteFor)
    if (voters.length < alive.length) {
      const currentAlive = alive.findIndex((player) => player.id === current.id)
      const nextAlive = alive[currentAlive + 1] ?? alive.find((player) => !player.voteFor)
      if (nextAlive && nextAlive.id !== current.id) {
        const nextIndex = nextPlayers.findIndex((player) => player.id === nextAlive.id)
        set({ players: nextPlayers, turnIndex: nextIndex, phase: 'vote-handoff' })
        return
      }
    }

    const eliminatedId = tallyElimination(nextPlayers)
    if (!eliminatedId) {
      set({ players: nextPlayers, phase: 'result' })
      return
    }
    nextPlayers = nextPlayers.map((player) =>
      player.id === eliminatedId ? { ...player, isEliminated: true } : player,
    )
    set(afterElimination(nextPlayers, eliminatedId))
  },
  setGuessInput: (guessInput) => set({ guessInput }),
  submitGuess: () => {
    const { guessInput, goodWord, players } = get()
    const ok =
      guessInput.trim().toLowerCase() === goodWord.toLowerCase() && Boolean(goodWord)
    if (ok) {
      set({ winner: 'MR_WHITE', phase: 'gameover' })
      return
    }
    set({ guessInput: '', phase: resolveWinner(players) ? 'gameover' : 'result', winner: resolveWinner(players) })
  },
  skipGuess: () => {
    const winner = resolveWinner(get().players)
    set({ guessInput: '', phase: winner ? 'gameover' : 'result', winner })
  },
  nextRound: () => {
    const alive = livingPlayers(get().players)
    const first = get().players.findIndex((player) => player.id === alive[0]?.id)
    set({
      phase: 'description-handoff',
      turnIndex: Math.max(0, first),
      round: get().round + 1,
      notes: '',
      cheatWarning: null,
      eliminatedId: null,
      players: get().players.map((player) => ({ ...player, clue: '', voteFor: null })),
    })
  },
  reset: () =>
    set({
      playMode: null,
      phase: 'mode',
      players: [],
      turnIndex: 0,
      round: 1,
      goodWord: '',
      fakeWord: '',
      notes: '',
      cheatWarning: null,
      guessInput: '',
      eliminatedId: null,
      winner: null,
    }),
}))
