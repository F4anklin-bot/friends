import type { Player } from '../types/game'

const MAX_CONSECUTIVE = 2

export interface WheelMemory {
  lastId: string | null
  consecutive: number
  lastAt: Record<string, number>
}

export function emptyWheelMemory(): WheelMemory {
  return { lastId: null, consecutive: 0, lastAt: {} }
}

/** Weighted pick — avoids the same person too often (max 2 consecutive). */
export function pickWeightedIndex(players: Player[], memory: WheelMemory): number {
  if (players.length === 0) return 0
  if (players.length === 1) return 0

  const now = Date.now()
  const weights = players.map((player, index) => {
    const lastAt = memory.lastAt[player.id] ?? 0
    const timeWeight = Math.min((now - lastAt) / 30_000, 3)
    const isSame = memory.lastId === player.id
    const consecutive = isSame ? memory.consecutive : 0
    if (consecutive >= MAX_CONSECUTIVE) return { index, weight: 0.001 }
    const penalty = consecutive * 2.2
    return { index, weight: Math.max(0.15, 1 + timeWeight - penalty) }
  })

  const total = weights.reduce((sum, item) => sum + item.weight, 0)
  let cursor = Math.random() * total
  for (const item of weights) {
    cursor -= item.weight
    if (cursor <= 0) return item.index
  }
  return weights[weights.length - 1]?.index ?? 0
}

export function rememberPick(memory: WheelMemory, playerId: string): WheelMemory {
  const consecutive = memory.lastId === playerId ? memory.consecutive + 1 : 1
  return {
    lastId: playerId,
    consecutive,
    lastAt: { ...memory.lastAt, [playerId]: Date.now() },
  }
}
