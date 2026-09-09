import type { ImpostorConfig, ImpostorPlayer, ImpostorRole, Player } from '../types/game'
import { IMPOSTOR_CATEGORIES } from '../data/impostorWords'
import { pick, shuffle } from '../utils/helpers'

export const DEFAULT_IMPOSTOR_CONFIG: ImpostorConfig = {
  categoryIds: IMPOSTOR_CATEGORIES.map((category) => category.id),
  allowMrWhite: true,
  multipleImpostors: true,
  discussionTime: 180,
  descriptionTime: 30,
}

export type ImpostorWinner = 'CIVILS' | 'IMPOSTORS' | 'MR_WHITE' | null

export function makeRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)] ?? 'A').join('')
}

export function roleCounts(playerCount: number, config: ImpostorConfig) {
  let impostors = 1
  if (config.multipleImpostors && playerCount >= 7) {
    impostors = playerCount >= 12 ? 3 : 2
  }
  const mrWhite = config.allowMrWhite && playerCount >= 5 ? 1 : 0
  return { impostors, mrWhite }
}

export function livingPlayers<T extends { isEliminated: boolean }>(players: T[]): T[] {
  return players.filter((player) => !player.isEliminated)
}

export function resolveWinner(players: { role: ImpostorRole; isEliminated: boolean }[]): ImpostorWinner {
  const alive = livingPlayers(players)
  const impostors = alive.filter((player) => player.role === 'IMPOSTOR')
  const civils = alive.filter((player) => player.role === 'CIVIL')
  const whites = alive.filter((player) => player.role === 'MR_WHITE')
  if (impostors.length === 0 && whites.length === 0) return 'CIVILS'
  if (impostors.length >= civils.length && impostors.length > 0) return 'IMPOSTORS'
  return null
}

export function assignRoles(lobby: Player[], config: ImpostorConfig, usedPairIds: string[]) {
  const categories = IMPOSTOR_CATEGORIES.filter((category) => config.categoryIds.includes(category.id))
  const pool = (categories.length ? categories : IMPOSTOR_CATEGORIES).flatMap((category) => category.pairs)
  const fresh = pool.filter((pair) => !usedPairIds.includes(pair.id))
  const pair = pick(fresh.length ? fresh : pool)
  const { impostors, mrWhite } = roleCounts(lobby.length, config)
  const order = shuffle(lobby)
  const roles: ImpostorRole[] = [
    ...Array.from({ length: impostors }, () => 'IMPOSTOR' as const),
    ...Array.from({ length: mrWhite }, () => 'MR_WHITE' as const),
    ...Array.from({ length: Math.max(0, lobby.length - impostors - mrWhite) }, () => 'CIVIL' as const),
  ]

  const players: ImpostorPlayer[] = order.map((player, index) => {
    const role = roles[index] ?? 'CIVIL'
    const word = role === 'CIVIL' ? pair.good : role === 'IMPOSTOR' ? pair.fake : ''
    return {
      ...player,
      role,
      word,
      isEliminated: false,
      clue: '',
      voteFor: null,
      warnings: 0,
    }
  })

  return {
    players: shuffle(players),
    goodWord: pair.good,
    fakeWord: pair.fake,
    pairId: pair.id,
  }
}

export function tallyElimination(players: ImpostorPlayer[]): string | null {
  const alive = livingPlayers(players)
  const tally = new Map<string, number>()
  for (const player of alive) {
    if (!player.voteFor) continue
    tally.set(player.voteFor, (tally.get(player.voteFor) ?? 0) + 1)
  }
  let best = 0
  let tied: string[] = []
  for (const [id, count] of tally) {
    if (count > best) {
      best = count
      tied = [id]
    } else if (count === best) {
      tied.push(id)
    }
  }
  if (tied.length === 0) return null
  return pick(tied)
}
