import { normalize } from './helpers'

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) => {
    const row = Array.from({ length: a.length + 1 }, (__, j) => (i === 0 ? j : 0))
    row[0] = i
    return row
  })

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      const prevRow = matrix[i - 1] ?? []
      const currRow = matrix[i] ?? []
      currRow[j] = Math.min(
        (currRow[j - 1] ?? 0) + 1,
        (prevRow[j] ?? 0) + 1,
        (prevRow[j - 1] ?? 0) + cost,
      )
    }
  }

  return matrix[b.length]?.[a.length] ?? 99
}

export function containsSecret(message: string, secretWord: string): boolean {
  const text = normalize(message)
  const secret = normalize(secretWord)
  if (!text || !secret) return false
  if (text.includes(secret)) return true

  const tokens = text.split(' ')
  return tokens.some((token) => {
    if (token.length < 3) return false
    const maxDistance = secret.length <= 4 ? 1 : 2
    return levenshtein(token, secret) <= maxDistance
  })
}

export function censorSecret(message: string, words: string[]): string {
  let next = message
  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    next = next.replace(new RegExp(escaped, 'gi'), '••••')
  }
  return next
}
