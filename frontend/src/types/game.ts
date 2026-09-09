export type GameId = 'impostor' | 'mimes' | 'tod'

export type Screen = 'home' | 'impostor' | 'mimes' | 'tod'

export type Gender = 'male' | 'female'
export type GenderFilter = 'all' | 'male' | 'female'

export interface Player {
  id: string
  name: string
  color: string
  score: number
  gender?: Gender
  interact?: GenderFilter
}

export type ImpostorRole = 'CIVIL' | 'IMPOSTOR' | 'MR_WHITE'

export type PlayMode = 'offline' | 'online'

export type ImpostorPhase =
  | 'mode'
  | 'setup'
  | 'handoff'
  | 'role'
  | 'description-handoff'
  | 'description'
  | 'discussion'
  | 'vote-handoff'
  | 'vote'
  | 'guess'
  | 'result'
  | 'gameover'

export type OnlinePhase =
  | 'lobby'
  | 'role'
  | 'description'
  | 'discussion'
  | 'vote'
  | 'guess'
  | 'result'
  | 'gameover'

export interface ImpostorConfig {
  categoryIds: string[]
  allowMrWhite: boolean
  multipleImpostors: boolean
  discussionTime: number
  descriptionTime: number
}

export interface PublicImpostorPlayer {
  id: string
  name: string
  color: string
  isHost: boolean
  isEliminated: boolean
  clue: string
  hasVoted: boolean
  ready: boolean
  connected: boolean
  revealedRole: ImpostorRole | null
}

export interface OnlineSnapshot {
  code: string
  phase: OnlinePhase
  config: ImpostorConfig
  round: number
  turnPlayerId: string | null
  phaseEndsAt: number | null
  eliminatedId: string | null
  winner: 'CIVILS' | 'IMPOSTORS' | 'MR_WHITE' | null
  myId: string
  myRole: ImpostorRole | null
  myWord: string
  goodWord: string | null
  fakeWord: string | null
  chat: { id: string; playerId: string; name: string; text: string; at: number }[]
  players: PublicImpostorPlayer[]
}

export interface ImpostorPlayer extends Player {
  role: ImpostorRole
  word: string
  isEliminated: boolean
  clue: string
  voteFor: string | null
  warnings: number
}

export type MimesPhase = 'setup' | 'ready' | 'play' | 'score' | 'end'

export interface MimesConfig {
  roundTime: number
  passAllowed: number
  categoryIds: string[]
  teamMode: boolean
}

export type TodType = 'truth' | 'dare'

export type TodLevel = 'soft' | 'fun' | 'hot' | 'hard' | 'extreme' | 'spice' | 'custom'
export type TodParty = 'friends' | 'couples'

export type TodPhase = 'players' | 'level' | 'party' | 'wheel' | 'choice' | 'card' | 'refuse'

export interface TodCard {
  id: string
  level: TodLevel
  party: TodParty
  type: TodType
  content: string
  intensity: number
  forGender: Gender | 'any'
  withGender: Gender | 'any'
  playerCount: 'solo' | 'couple' | 'group'
  adult?: boolean
}
