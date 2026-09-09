export const PLAYER_COLORS = [
  '#FF69B4',
  '#8B5CF6',
  '#FFD700',
  '#22D3EE',
  '#FB7185',
  '#A3E635',
  '#F97316',
  '#38BDF8',
  '#E879F9',
  '#4ADE80',
  '#F472B6',
  '#818CF8',
] as const

export function uid(): string {
  return crypto.randomUUID()
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = next[i]
    next[i] = next[j] as T
    next[j] = current as T
  }
  return next
}

export function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

export function haptic(pattern: number | number[] = 12): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
}
