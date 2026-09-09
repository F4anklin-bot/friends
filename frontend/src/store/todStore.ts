import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fillTemplate, REFUSE_GAGES_FEMALE, REFUSE_GAGES_MALE, TOD_CARDS } from '../data/todCards'
import type { GenderFilter, Player, TodCard, TodLevel, TodParty, TodPhase, TodType } from '../types/game'
import { pick, shuffle, uid } from '../utils/helpers'

interface TodState {
  phase: TodPhase
  players: Player[]
  level: TodLevel
  party: TodParty
  customCards: TodCard[]
  adultOk: boolean
  currentIndex: number
  turn: number
  spinning: boolean
  choice: TodType | null
  card: TodCard | null
  cardText: string
  partnerName: string | null
  shownGage: string
  history: string[]
  setLevel: (level: TodLevel) => void
  setParty: (party: TodParty) => void
  setAdultOk: (ok: boolean) => void
  addCustomCard: (type: TodType, content: string) => void
  removeCustomCard: (id: string) => void
  goTo: (phase: TodPhase) => void
  startGame: (lobby: Player[]) => string | null
  spin: () => void
  landOn: (index: number) => void
  choose: (choice: TodType) => void
  complete: () => void
  refuse: () => void
  finishRefuse: () => void
  reset: () => void
}

function playerInteract(player: Player): GenderFilter {
  return player.interact ?? 'all'
}

function eligibleOthers(player: Player, lobby: Player[]) {
  const interact = playerInteract(player)
  return lobby.filter((other) => {
    if (other.id === player.id) return false
    if (interact === 'all') return true
    return other.gender === interact
  })
}

function cardFits(card: TodCard, player: Player, others: Player[]) {
  const interact = playerInteract(player)
  if (card.forGender !== 'any' && card.forGender !== player.gender) return false
  if (card.withGender === 'male' && interact === 'female') return false
  if (card.withGender === 'female' && interact === 'male') return false
  if (card.playerCount === 'couple') {
    const pool =
      card.withGender === 'any' ? others : others.filter((other) => other.gender === card.withGender)
    if (pool.length === 0) return false
  }
  return true
}

function drawCard(
  level: TodLevel,
  party: TodParty,
  type: TodType,
  player: Player,
  lobby: Player[],
  usedIds: string[],
  customCards: TodCard[],
): { card: TodCard; other?: Player } | null {
  const deck = level === 'custom' ? customCards : TOD_CARDS
  const pool = deck.filter((card) => {
    if (card.type !== type) return false
    if (level !== 'custom' && (card.level !== level || card.party !== party)) return false
    return cardFits(card, player, eligibleOthers(player, lobby))
  })
  const fresh = pool.filter((card) => !usedIds.includes(card.id))
  const source = fresh.length ? fresh : pool
  if (source.length === 0) return null
  const card = pick(source)
  const others = eligibleOthers(player, lobby)
  const partners =
    card.withGender === 'any' ? others : others.filter((other) => other.gender === card.withGender)
  const other = card.playerCount === 'couple' || card.content.includes('{other}') ? pick(partners) : undefined
  return { card, other }
}

function gageFor(player?: Player) {
  if (player?.gender === 'male') return pick(REFUSE_GAGES_MALE)
  return pick(REFUSE_GAGES_FEMALE)
}

function needsAdult(level: TodLevel) {
  return level === 'hard' || level === 'extreme' || level === 'spice'
}

export const useTodStore = create<TodState>()(
  persist(
    (set, get) => ({
      phase: 'players',
      players: [],
      level: 'soft',
      party: 'friends',
      customCards: [],
      adultOk: false,
      currentIndex: 0,
      turn: 0,
      spinning: false,
      choice: null,
      card: null,
      cardText: '',
      partnerName: null,
      shownGage: '',
      history: [],
      setLevel: (level) => set({ level }),
      setParty: (party) => set({ party }),
      setAdultOk: (adultOk) => set({ adultOk }),
      addCustomCard: (type, content) => {
        const text = content.trim()
        if (!text) return
        set({
          customCards: [
            ...get().customCards,
            {
              id: `custom-${uid()}`,
              level: 'custom',
              party: 'friends',
              type,
              content: text,
              intensity: 5,
              forGender: 'any',
              withGender: 'any',
              playerCount: text.includes('{other}') ? 'couple' : 'solo',
            },
          ],
        })
      },
      removeCustomCard: (id) =>
        set({ customCards: get().customCards.filter((card) => card.id !== id) }),
      goTo: (phase) => set({ phase }),
      startGame: (lobby) => {
        if (lobby.length < 2) return 'Ajoute au moins 2 joueurs.'
        if (lobby.some((player) => !player.gender)) return 'Chaque joueur choisit F ou H.'
        if (lobby.some((player) => !player.interact)) return 'Chaque joueur choisit avec qui interagir.'
        const { level, adultOk, customCards } = get()
        if (needsAdult(level) && !adultOk) return 'Ce mode est réservé aux 18+.'
        if (level === 'custom' && customCards.length === 0) return 'Ajoute au moins un défi.'
        set({
          phase: 'wheel',
          players: shuffle(lobby),
          currentIndex: 0,
          turn: 1,
          spinning: false,
          choice: null,
          card: null,
          cardText: '',
          partnerName: null,
          shownGage: '',
          history: [],
        })
        return null
      },
      spin: () => set({ spinning: true }),
      landOn: (index) =>
        set({
          spinning: false,
          currentIndex: index,
          phase: 'choice',
          choice: null,
          card: null,
          cardText: '',
          partnerName: null,
        }),
      choose: (choice) => {
        const { players, currentIndex, level, party, customCards } = get()
        const player = players[currentIndex]
        if (!player) return
        const used = get().history
        const drawn = drawCard(level, party, choice, player, players, used, customCards)
        if (!drawn) {
          set({
            choice,
            card: null,
            cardText: 'Plus de cartes pour ce mix.',
            phase: 'card',
            partnerName: null,
          })
          return
        }
        set({
          choice,
          card: drawn.card,
          cardText: fillTemplate(drawn.card.content, player.name, drawn.other?.name),
          partnerName: drawn.other?.name ?? null,
          phase: 'card',
          history: [drawn.card.id, ...used].slice(0, 80),
        })
      },
      complete: () => {
        const { turn } = get()
        set({
          phase: 'wheel',
          turn: turn + 1,
          spinning: false,
          choice: null,
          card: null,
          cardText: '',
          partnerName: null,
          shownGage: '',
        })
      },
      refuse: () => {
        const player = get().players[get().currentIndex]
        set({ phase: 'refuse', shownGage: gageFor(player) })
      },
      finishRefuse: () => get().complete(),
      reset: () =>
        set({
          phase: 'players',
          players: [],
          currentIndex: 0,
          turn: 0,
          spinning: false,
          choice: null,
          card: null,
          cardText: '',
          partnerName: null,
          shownGage: '',
        }),
    }),
    {
      name: 'friends-tod',
      version: 5,
      migrate: () => ({
        level: 'soft' as const,
        party: 'friends' as const,
        customCards: [],
        adultOk: false,
      }),
      partialize: (state) => ({
        level: state.level,
        party: state.party,
        customCards: state.customCards,
        adultOk: state.adultOk,
      }),
    },
  ),
)
