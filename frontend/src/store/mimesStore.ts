import { create } from 'zustand'
import type { MimesConfig, MimesPhase, Player } from '../types/game'
import { MIME_WORDS } from '../data/mimesWords'
import { pick, shuffle } from '../utils/helpers'

const DEFAULT_CONFIG: MimesConfig = {
  roundTime: 60,
  passAllowed: 3,
  categoryIds: ['actions', 'animaux', 'cinema', 'objets', 'metiers', 'quotidien', 'sports', 'emotions'],
  teamMode: false,
}

interface MimesState {
  phase: MimesPhase
  config: MimesConfig
  players: Player[]
  actorIndex: number
  currentWord: string
  forbidden: string[]
  hints: string[]
  passesLeft: number
  foundThisTurn: number
  teamA: string[]
  teamB: string[]
  scores: Record<string, number>
  usedWordIds: string[]
  setConfig: (partial: Partial<MimesConfig>) => void
  startGame: (lobby: Player[]) => string | null
  beginTurn: () => void
  foundWord: () => void
  passWord: () => void
  endTurn: () => void
  nextPlayer: () => void
  finish: () => void
  reset: () => void
}

function nextWord(usedWordIds: string[], categoryIds: string[]) {
  const pool = MIME_WORDS.filter((word) => categoryIds.includes(word.category))
  const source = pool.length ? pool : MIME_WORDS
  const fresh = source.filter((word) => !usedWordIds.includes(word.id))
  return pick(fresh.length ? fresh : source)
}

export const useMimesStore = create<MimesState>((set, get) => ({
  phase: 'setup',
  config: DEFAULT_CONFIG,
  players: [],
  actorIndex: 0,
  currentWord: '',
  forbidden: [],
  hints: [],
  passesLeft: 3,
  foundThisTurn: 0,
  teamA: [],
  teamB: [],
  scores: {},
  usedWordIds: [],
  setConfig: (partial) => set({ config: { ...get().config, ...partial } }),
  startGame: (lobby) => {
    const config = get().config
    if (lobby.length === 0) {
      const scores: Record<string, number> = config.teamMode
        ? { 'team-a': 0, 'team-b': 0 }
        : { group: 0 }
      set({
        phase: 'ready',
        players: [],
        actorIndex: 0,
        teamA: config.teamMode ? ['team-a'] : [],
        teamB: config.teamMode ? ['team-b'] : [],
        scores,
        passesLeft: config.passAllowed,
        foundThisTurn: 0,
        usedWordIds: [],
      })
      return null
    }
    const shuffled = shuffle(lobby)
    const mid = Math.ceil(shuffled.length / 2)
    const scores: Record<string, number> = {}
    for (const player of shuffled) scores[player.id] = 0
    set({
      phase: 'ready',
      players: shuffled,
      actorIndex: 0,
      teamA: shuffled.slice(0, mid).map((player) => player.id),
      teamB: shuffled.slice(mid).map((player) => player.id),
      scores,
      passesLeft: config.passAllowed,
      foundThisTurn: 0,
      usedWordIds: [],
    })
    return null
  },
  beginTurn: () => {
    const word = nextWord(get().usedWordIds, get().config.categoryIds)
    set({
      phase: 'play',
      currentWord: word.word,
      forbidden: word.forbidden,
      hints: word.hints,
      foundThisTurn: 0,
      passesLeft: get().config.passAllowed,
      usedWordIds: [...get().usedWordIds, word.id],
    })
  },
  foundWord: () => {
    const { players, actorIndex, scores, config, teamA, teamB, foundThisTurn, usedWordIds } = get()
    const nextScores = { ...scores }
    if (players.length === 0) {
      if (config.teamMode) {
        const teamId = actorIndex % 2 === 0 ? 'team-a' : 'team-b'
        nextScores[teamId] = (nextScores[teamId] ?? 0) + 1
      } else {
        nextScores.group = (nextScores.group ?? 0) + 1
      }
    } else {
      const actor = players[actorIndex]
      if (!actor) return
      if (config.teamMode) {
        const team = teamA.includes(actor.id) ? teamA : teamB
        for (const id of team) nextScores[id] = (nextScores[id] ?? 0) + 1
      } else {
        nextScores[actor.id] = (nextScores[actor.id] ?? 0) + 1
      }
    }
    const word = nextWord(usedWordIds, config.categoryIds)
    set({
      scores: nextScores,
      foundThisTurn: foundThisTurn + 1,
      currentWord: word.word,
      forbidden: word.forbidden,
      hints: word.hints,
      usedWordIds: [...usedWordIds, word.id],
    })
  },
  passWord: () => {
    const { passesLeft, usedWordIds, config } = get()
    if (passesLeft <= 0) return
    const word = nextWord(usedWordIds, config.categoryIds)
    set({
      passesLeft: passesLeft - 1,
      currentWord: word.word,
      forbidden: word.forbidden,
      hints: word.hints,
      usedWordIds: [...usedWordIds, word.id],
    })
  },
  endTurn: () => set({ phase: 'score' }),
  nextPlayer: () => {
    const { actorIndex, players, config } = get()
    const next =
      players.length === 0
        ? config.teamMode
          ? (actorIndex + 1) % 2
          : actorIndex
        : (actorIndex + 1) % players.length
    set({ actorIndex: next, phase: 'ready', currentWord: '', foundThisTurn: 0 })
  },
  finish: () => set({ phase: 'end' }),
  reset: () =>
    set({
      phase: 'setup',
      players: [],
      actorIndex: 0,
      currentWord: '',
      forbidden: [],
      hints: [],
      foundThisTurn: 0,
      scores: {},
      usedWordIds: [],
    }),
}))
