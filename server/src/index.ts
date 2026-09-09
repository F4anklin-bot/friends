import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import {
  createRoom,
  forceVote,
  joinRoom,
  kickPlayer,
  leaveSocket,
  markReady,
  nextRound,
  playerSkipClue,
  playerStartVote,
  rejoinRoom,
  replay,
  sendChat,
  skipGuess,
  startMatch,
  submitClue,
  submitGuess,
  submitVote,
  updateConfig,
} from './rooms.ts'

const PORT = Number(process.env.PORT) || 3001
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || true

const app = express()
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))
app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_ORIGIN, methods: ['GET', 'POST'], credentials: true },
})

function safe(socket: { emit: (event: string, payload: unknown) => void }, fn: () => void) {
  try {
    fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur.'
    socket.emit('impostor:error', { message })
  }
}

io.on('connection', (socket) => {
  socket.on('impostor:create', (payload: { name?: string } = {}) => {
    safe(socket, () => {
      const result = createRoom(io, socket.id, payload.name ?? '')
      void socket.join(result.code)
      socket.emit('impostor:joined', result)
    })
  })

  socket.on('impostor:join', (payload: { code?: string; name?: string } = {}) => {
    safe(socket, () => {
      const result = joinRoom(io, socket.id, payload.code ?? '', payload.name ?? '')
      void socket.join(result.code)
      socket.emit('impostor:joined', result)
    })
  })

  socket.on('impostor:rejoin', (payload: { code?: string; playerId?: string } = {}) => {
    safe(socket, () => {
      const result = rejoinRoom(io, socket.id, payload.code ?? '', payload.playerId ?? '')
      void socket.join(result.code)
      socket.emit('impostor:joined', result)
    })
  })

  socket.on('impostor:leave', () => {
    leaveSocket(io, socket.id)
  })

  socket.on('impostor:kick', (payload: { playerId?: string } = {}) => {
    safe(socket, () => kickPlayer(io, socket.id, payload.playerId ?? ''))
  })

  socket.on('impostor:config', (payload: Record<string, unknown> = {}) => {
    safe(socket, () => updateConfig(io, socket.id, payload))
  })

  socket.on('impostor:start', () => {
    safe(socket, () => startMatch(io, socket.id))
  })

  socket.on('impostor:ready', () => {
    safe(socket, () => markReady(io, socket.id))
  })

  socket.on('impostor:clue', (payload: { clue?: string } = {}) => {
    safe(socket, () => submitClue(io, socket.id, payload.clue ?? ''))
  })

  socket.on('impostor:skipClue', () => {
    safe(socket, () => playerSkipClue(io, socket.id))
  })

  socket.on('impostor:chat', (payload: { text?: string } = {}) => {
    safe(socket, () => sendChat(io, socket.id, payload.text ?? ''))
  })

  socket.on('impostor:startVote', () => {
    safe(socket, () => playerStartVote(io, socket.id))
  })

  socket.on('impostor:vote', (payload: { targetId?: string } = {}) => {
    safe(socket, () => submitVote(io, socket.id, payload.targetId ?? ''))
  })

  socket.on('impostor:forceVote', () => {
    safe(socket, () => forceVote(io, socket.id))
  })

  socket.on('impostor:guess', (payload: { word?: string } = {}) => {
    safe(socket, () => submitGuess(io, socket.id, payload.word ?? ''))
  })

  socket.on('impostor:skipGuess', () => {
    safe(socket, () => skipGuess(io, socket.id))
  })

  socket.on('impostor:nextRound', () => {
    safe(socket, () => nextRound(io, socket.id))
  })

  socket.on('impostor:replay', () => {
    safe(socket, () => replay(io, socket.id))
  })

  socket.on('disconnect', () => {
    leaveSocket(io, socket.id)
  })
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Friends server on http://localhost:${PORT}`)
})
