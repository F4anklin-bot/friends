import type { ImpostorConfig, ImpostorRole, OnlinePhase, OnlineSnapshot, Player } from '../../frontend/src/types/game.ts'
import {
  assignRoles,
  DEFAULT_IMPOSTOR_CONFIG,
  livingPlayers,
  makeRoomCode,
  resolveWinner,
  tallyElimination,
} from '../../frontend/src/game/impostorEngine.ts'
import { containsSecret, censorSecret } from '../../frontend/src/utils/antiCheat.ts'
import { PLAYER_COLORS, uid } from '../../frontend/src/utils/helpers.ts'
import type { Server } from 'socket.io'

export interface ServerPlayer {
  id: string
  socketId: string
  name: string
  color: string
  isHost: boolean
  role: ImpostorRole | null
  word: string
  isEliminated: boolean
  clue: string
  voteFor: string | null
  warnings: number
  ready: boolean
  connected: boolean
}

interface Room {
  code: string
  config: ImpostorConfig
  phase: OnlinePhase
  players: ServerPlayer[]
  turnIndex: number
  round: number
  goodWord: string
  fakeWord: string
  eliminatedId: string | null
  winner: OnlineSnapshot['winner']
  usedPairIds: string[]
  phaseEndsAt: number | null
  chat: OnlineSnapshot['chat']
  timer: ReturnType<typeof setTimeout> | null
}

const rooms = new Map<string, Room>()

function findRoomBySocket(socketId: string): { room: Room; player: ServerPlayer } | null {
  for (const room of rooms.values()) {
    const player = room.players.find((item) => item.socketId === socketId)
    if (player) return { room, player }
  }
  return null
}

function snapshot(room: Room, playerId: string): OnlineSnapshot {
  const me = room.players.find((player) => player.id === playerId)
  const revealAll = room.phase === 'gameover'
  const revealEliminated = revealAll || room.phase === 'result' || room.phase === 'guess'
  const turn = room.players[room.turnIndex]
  return {
    code: room.code,
    phase: room.phase,
    config: room.config,
    round: room.round,
    turnPlayerId: turn?.id ?? null,
    phaseEndsAt: room.phaseEndsAt,
    eliminatedId: room.eliminatedId,
    winner: room.winner,
    myId: playerId,
    myRole: me?.role ?? null,
    myWord: me?.word ?? '',
    goodWord: revealAll ? room.goodWord : null,
    fakeWord: revealAll ? room.fakeWord : null,
    chat: room.chat.slice(-40),
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      isHost: player.isHost,
      isEliminated: player.isEliminated,
      clue: player.clue,
      hasVoted: Boolean(player.voteFor),
      ready: player.ready,
      connected: player.connected,
      revealedRole:
        revealAll || (revealEliminated && player.id === room.eliminatedId) ? player.role : null,
    })),
  }
}

export function emitRoom(io: Server, room: Room) {
  for (const player of room.players) {
    if (!player.connected) continue
    io.to(player.socketId).emit('impostor:state', snapshot(room, player.id))
  }
}

function clearTimer(room: Room) {
  if (room.timer) {
    clearTimeout(room.timer)
    room.timer = null
  }
  room.phaseEndsAt = null
}

function secrets(room: Room, player: ServerPlayer) {
  return [player.word, room.goodWord, room.fakeWord].filter(Boolean)
}

function goDescription(io: Server, room: Room) {
  const alive = livingPlayers(room.players)
  const first = alive[0]
  room.turnIndex = Math.max(0, room.players.findIndex((player) => player.id === first?.id))
  room.phase = 'description'
  startTimer(io, room, room.config.descriptionTime, () => skipClue(io, room))
  emitRoom(io, room)
}

function startTimer(io: Server, room: Room, seconds: number, onEnd: () => void) {
  clearTimer(room)
  room.phaseEndsAt = Date.now() + seconds * 1000
  room.timer = setTimeout(onEnd, seconds * 1000)
}

function applyElimination(io: Server, room: Room, eliminatedId: string) {
  room.players = room.players.map((player) =>
    player.id === eliminatedId
      ? { ...player, isEliminated: true, voteFor: null, ready: false }
      : { ...player, voteFor: null },
  )
  room.eliminatedId = eliminatedId
  const eliminated = room.players.find((player) => player.id === eliminatedId)
  if (eliminated?.role === 'MR_WHITE') {
    room.winner = null
    room.phase = 'guess'
    clearTimer(room)
    emitRoom(io, room)
    return
  }
  room.winner = resolveWinner(
    room.players.map((player) => ({ role: player.role ?? 'CIVIL', isEliminated: player.isEliminated })),
  )
  room.phase = room.winner ? 'gameover' : 'result'
  clearTimer(room)
  emitRoom(io, room)
}

function skipClue(io: Server, room: Room) {
  if (room.phase !== 'description') return
  const alive = livingPlayers(room.players)
  const current = room.players[room.turnIndex]
  const pos = alive.findIndex((player) => player.id === current?.id)
  const nextAlive = alive[pos + 1]
  if (!nextAlive) {
    room.phase = 'discussion'
    startTimer(io, room, room.config.discussionTime, () => startVote(io, room))
    emitRoom(io, room)
    return
  }
  room.turnIndex = room.players.findIndex((player) => player.id === nextAlive.id)
  startTimer(io, room, room.config.descriptionTime, () => skipClue(io, room))
  emitRoom(io, room)
}

function resolveVotes(io: Server, room: Room) {
  const asImpostor = room.players.map((player) => ({
    id: player.id,
    voteFor: player.voteFor,
    isEliminated: player.isEliminated,
    role: player.role ?? 'CIVIL',
    word: player.word,
    name: player.name,
    color: player.color,
    score: 0,
    clue: player.clue,
    warnings: player.warnings,
  }))
  const eliminatedId = tallyElimination(asImpostor)
  if (!eliminatedId) {
    room.phase = 'result'
    clearTimer(room)
    emitRoom(io, room)
    return
  }
  applyElimination(io, room, eliminatedId)
}

function startVote(io: Server, room: Room) {
  if (room.phase !== 'discussion' && room.phase !== 'description') return
  room.phase = 'vote'
  room.players = room.players.map((player) => ({ ...player, voteFor: null }))
  clearTimer(room)
  emitRoom(io, room)
}

export function createRoom(io: Server, socketId: string, name: string) {
  const trimmed = name.trim().slice(0, 18)
  if (!trimmed) throw new Error('Choisis un prénom.')
  let code = makeRoomCode()
  while (rooms.has(code)) code = makeRoomCode()
  const player: ServerPlayer = {
    id: uid(),
    socketId,
    name: trimmed,
    color: PLAYER_COLORS[0] ?? '#FF69B4',
    isHost: true,
    role: null,
    word: '',
    isEliminated: false,
    clue: '',
    voteFor: null,
    warnings: 0,
    ready: false,
    connected: true,
  }
  const room: Room = {
    code,
    config: { ...DEFAULT_IMPOSTOR_CONFIG, categoryIds: [...DEFAULT_IMPOSTOR_CONFIG.categoryIds] },
    phase: 'lobby',
    players: [player],
    turnIndex: 0,
    round: 1,
    goodWord: '',
    fakeWord: '',
    eliminatedId: null,
    winner: null,
    usedPairIds: [],
    phaseEndsAt: null,
    chat: [],
    timer: null,
  }
  rooms.set(code, room)
  emitRoom(io, room)
  return { code, playerId: player.id }
}

export function joinRoom(io: Server, socketId: string, code: string, name: string) {
  const room = rooms.get(code.trim().toUpperCase())
  if (!room) throw new Error('Aucune partie avec ce code.')
  if (room.phase !== 'lobby') throw new Error('La partie a déjà commencé.')
  const trimmed = name.trim().slice(0, 18)
  if (!trimmed) throw new Error('Choisis un prénom.')
  if (room.players.some((player) => player.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Ce prénom est déjà pris.')
  }
  if (room.players.length >= 20) throw new Error('Salon complet (20).')
  const player: ServerPlayer = {
    id: uid(),
    socketId,
    name: trimmed,
    color: PLAYER_COLORS[room.players.length % PLAYER_COLORS.length] ?? '#8B5CF6',
    isHost: false,
    role: null,
    word: '',
    isEliminated: false,
    clue: '',
    voteFor: null,
    warnings: 0,
    ready: false,
    connected: true,
  }
  room.players.push(player)
  emitRoom(io, room)
  return { code: room.code, playerId: player.id }
}

export function rejoinRoom(io: Server, socketId: string, code: string, playerId: string) {
  const room = rooms.get(code.trim().toUpperCase())
  if (!room) throw new Error('Partie introuvable.')
  const player = room.players.find((item) => item.id === playerId)
  if (!player) throw new Error('Joueur introuvable.')
  player.socketId = socketId
  player.connected = true
  emitRoom(io, room)
  return { code: room.code, playerId: player.id }
}

export function leaveSocket(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found) return
  const { room, player } = found
  player.connected = false
  if (room.phase === 'lobby') {
    room.players = room.players.filter((item) => item.id !== player.id)
    if (room.players.length === 0) {
      clearTimer(room)
      rooms.delete(room.code)
      return
    }
    if (player.isHost) {
      const nextHost = room.players[0]
      if (nextHost) nextHost.isHost = true
    }
  }
  emitRoom(io, room)
}

export function kickPlayer(io: Server, socketId: string, targetId: string) {
  const found = findRoomBySocket(socketId)
  if (!found?.player.isHost) throw new Error('Seul l’hôte peut expulser.')
  if (found.room.phase !== 'lobby') throw new Error('Impossible en cours de partie.')
  found.room.players = found.room.players.filter((player) => player.id !== targetId)
  emitRoom(io, found.room)
}

export function updateConfig(io: Server, socketId: string, partial: Partial<ImpostorConfig>) {
  const found = findRoomBySocket(socketId)
  if (!found?.player.isHost) throw new Error('Seul l’hôte règle la partie.')
  if (found.room.phase !== 'lobby') throw new Error('La partie a commencé.')
  found.room.config = { ...found.room.config, ...partial }
  emitRoom(io, found.room)
}

export function startMatch(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found?.player.isHost) throw new Error('Seul l’hôte lance la partie.')
  const connected = found.room.players.filter((player) => player.connected)
  if (connected.length < 4) throw new Error('Il faut au moins 4 joueurs connectés.')
  const lobby: Player[] = connected.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    score: 0,
  }))
  const deal = assignRoles(lobby, found.room.config, found.room.usedPairIds)
  const byId = new Map(deal.players.map((player) => [player.id, player]))
  found.room.players = found.room.players.map((player) => {
    const dealt = byId.get(player.id)
    if (!dealt) {
      return { ...player, connected: false }
    }
    return {
      ...player,
      role: dealt.role,
      word: dealt.word,
      isEliminated: false,
      clue: '',
      voteFor: null,
      warnings: 0,
      ready: false,
    }
  })
  found.room.goodWord = deal.goodWord
  found.room.fakeWord = deal.fakeWord
  found.room.usedPairIds = [...found.room.usedPairIds, deal.pairId]
  found.room.round = 1
  found.room.winner = null
  found.room.eliminatedId = null
  found.room.chat = []
  found.room.phase = 'role'
  clearTimer(found.room)
  emitRoom(io, found.room)
}

export function markReady(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found || found.room.phase !== 'role') return
  found.player.ready = true
  const active = found.room.players.filter((player) => player.connected && !player.isEliminated)
  if (active.length > 0 && active.every((player) => player.ready)) {
    found.room.players = found.room.players.map((player) => ({ ...player, ready: false }))
    goDescription(io, found.room)
    return
  }
  emitRoom(io, found.room)
}

export function submitClue(io: Server, socketId: string, clue: string) {
  const found = findRoomBySocket(socketId)
  if (!found || found.room.phase !== 'description') return
  const current = found.room.players[found.room.turnIndex]
  if (current?.id !== found.player.id) throw new Error('Ce n’est pas ton tour.')
  const text = clue.trim().slice(0, 80)
  if (!text) throw new Error('Écris un indice.')
  if (secrets(found.room, found.player).some((secret) => containsSecret(text, secret))) {
    found.player.warnings += 1
    io.to(socketId).emit('impostor:warning', {
      message:
        found.player.warnings >= 3
          ? '3 avertissements : éliminé pour triche.'
          : 'Tu ne peux pas révéler le mot secret !',
    })
    if (found.player.warnings >= 3) {
      applyElimination(io, found.room, found.player.id)
      return
    }
    emitRoom(io, found.room)
    return
  }
  found.player.clue = text
  skipClue(io, found.room)
}

export function playerSkipClue(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found || found.room.phase !== 'description') return
  const current = found.room.players[found.room.turnIndex]
  if (current?.id !== found.player.id && !found.player.isHost) return
  skipClue(io, found.room)
}

export function sendChat(io: Server, socketId: string, text: string) {
  const found = findRoomBySocket(socketId)
  if (!found) return
  if (found.room.phase !== 'discussion') throw new Error('Le chat est ouvert en discussion.')
  const raw = text.trim().slice(0, 160)
  if (!raw) return
  if (secrets(found.room, found.player).some((secret) => containsSecret(raw, secret))) {
    io.to(socketId).emit('impostor:warning', { message: '⚠️ Tu ne peux pas révéler ton mot !' })
    return
  }
  const safe = censorSecret(raw, secrets(found.room, found.player))
  found.room.chat.push({
    id: uid(),
    playerId: found.player.id,
    name: found.player.name,
    text: safe,
    at: Date.now(),
  })
  emitRoom(io, found.room)
}

export function playerStartVote(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found) return
  if (found.room.phase !== 'discussion') return
  startVote(io, found.room)
}

export function submitVote(io: Server, socketId: string, targetId: string) {
  const found = findRoomBySocket(socketId)
  if (!found || found.room.phase !== 'vote') return
  if (found.player.isEliminated) throw new Error('Tu es éliminé.')
  if (found.player.id === targetId) throw new Error('Tu ne peux pas voter pour toi.')
  const target = found.room.players.find((player) => player.id === targetId && !player.isEliminated)
  if (!target) throw new Error('Vote invalide.')
  found.player.voteFor = targetId
  const alive = livingPlayers(found.room.players).filter((player) => player.connected)
  if (alive.every((player) => player.voteFor)) {
    resolveVotes(io, found.room)
    return
  }
  emitRoom(io, found.room)
}

export function forceVote(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found?.player.isHost || found.room.phase !== 'vote') return
  resolveVotes(io, found.room)
}

export function submitGuess(io: Server, socketId: string, word: string) {
  const found = findRoomBySocket(socketId)
  if (!found || found.room.phase !== 'guess') return
  if (found.player.id !== found.room.eliminatedId || found.player.role !== 'MR_WHITE') {
    throw new Error('Seul Mr White peut deviner.')
  }
  const ok = word.trim().toLowerCase() === found.room.goodWord.toLowerCase()
  if (ok) {
    found.room.winner = 'MR_WHITE'
    found.room.phase = 'gameover'
    emitRoom(io, found.room)
    return
  }
  found.room.winner = resolveWinner(
    found.room.players.map((player) => ({ role: player.role ?? 'CIVIL', isEliminated: player.isEliminated })),
  )
  found.room.phase = found.room.winner ? 'gameover' : 'result'
  emitRoom(io, found.room)
}

export function skipGuess(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found || found.room.phase !== 'guess') return
  if (found.player.id !== found.room.eliminatedId && !found.player.isHost) return
  found.room.winner = resolveWinner(
    found.room.players.map((player) => ({ role: player.role ?? 'CIVIL', isEliminated: player.isEliminated })),
  )
  found.room.phase = found.room.winner ? 'gameover' : 'result'
  emitRoom(io, found.room)
}

export function nextRound(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found?.player.isHost || found.room.phase !== 'result') return
  found.room.round += 1
  found.room.eliminatedId = null
  found.room.players = found.room.players.map((player) => ({
    ...player,
    clue: '',
    voteFor: null,
    ready: false,
  }))
  goDescription(io, found.room)
}

export function replay(io: Server, socketId: string) {
  const found = findRoomBySocket(socketId)
  if (!found?.player.isHost) return
  found.room.phase = 'lobby'
  found.room.players = found.room.players.map((player) => ({
    ...player,
    role: null,
    word: '',
    isEliminated: false,
    clue: '',
    voteFor: null,
    warnings: 0,
    ready: false,
  }))
  found.room.goodWord = ''
  found.room.fakeWord = ''
  found.room.winner = null
  found.room.eliminatedId = null
  found.room.chat = []
  found.room.round = 1
  clearTimer(found.room)
  emitRoom(io, found.room)
}
