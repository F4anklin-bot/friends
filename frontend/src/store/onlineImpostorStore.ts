import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ImpostorConfig, OnlineSnapshot } from '../types/game'
import { emitWhenConnected, getSocket } from '../services/socket'

type OnlineView = 'menu' | 'create' | 'join' | 'play'

interface OnlineState {
  view: OnlineView
  myName: string
  joinCode: string
  connected: boolean
  error: string | null
  warning: string | null
  snapshot: OnlineSnapshot | null
  playerId: string | null
  setView: (view: OnlineView) => void
  setMyName: (name: string) => void
  setJoinCode: (code: string) => void
  connect: () => void
  createRoom: () => void
  joinRoom: () => void
  leaveRoom: () => void
  kick: (playerId: string) => void
  setConfig: (partial: Partial<ImpostorConfig>) => void
  startMatch: () => void
  ready: () => void
  sendClue: (clue: string) => void
  skipClue: () => void
  sendChat: (text: string) => void
  startVote: () => void
  vote: (targetId: string) => void
  forceVote: () => void
  guess: (word: string) => void
  skipGuess: () => void
  nextRound: () => void
  replay: () => void
  tryRejoin: () => boolean
  reset: () => void
}

let listenersBound = false

function bindSocket(get: () => OnlineState, set: (partial: Partial<OnlineState>) => void) {
  if (listenersBound) return
  listenersBound = true
  const socket = getSocket()

  socket.on('connect', () => {
    set({ connected: true, error: null })
    const snap = get().snapshot
    const playerId = get().playerId
    if (snap?.code && playerId) {
      socket.emit('impostor:rejoin', { code: snap.code, playerId })
    }
  })

  socket.on('disconnect', () => set({ connected: false }))

  socket.on('impostor:state', (snapshot: OnlineSnapshot) => {
    set({ snapshot, error: null, view: 'play' })
    sessionStorage.setItem(
      'friends-impostor-session',
      JSON.stringify({ code: snapshot.code, playerId: snapshot.myId }),
    )
  })

  socket.on('impostor:joined', (payload: { code: string; playerId: string }) => {
    set({ playerId: payload.playerId })
  })

  socket.on('impostor:error', (payload: { message: string }) => {
    set({ error: payload.message })
  })

  socket.on('impostor:warning', (payload: { message: string }) => {
    set({ warning: payload.message })
    window.setTimeout(() => {
      if (get().warning === payload.message) set({ warning: null })
    }, 2800)
  })
}

export const useOnlineStore = create<OnlineState>()(
  persist(
    (set, get) => ({
      view: 'menu',
      myName: '',
      joinCode: '',
      connected: false,
      error: null,
      warning: null,
      snapshot: null,
      playerId: null,
      setView: (view) => set({ view, error: null }),
      setMyName: (myName) => set({ myName }),
      setJoinCode: (joinCode) => set({ joinCode: joinCode.toUpperCase() }),
      connect: () => {
        bindSocket(get, set)
        const socket = getSocket()
        if (!socket.connected) socket.connect()
      },
      createRoom: () => {
        get().connect()
        emitWhenConnected('impostor:create', { name: get().myName })
      },
      joinRoom: () => {
        get().connect()
        emitWhenConnected('impostor:join', { code: get().joinCode, name: get().myName })
      },
      leaveRoom: () => {
        getSocket().emit('impostor:leave')
        sessionStorage.removeItem('friends-impostor-session')
        set({ snapshot: null, playerId: null, view: 'menu', error: null, warning: null })
      },
      kick: (playerId) => getSocket().emit('impostor:kick', { playerId }),
      setConfig: (partial) => getSocket().emit('impostor:config', partial),
      startMatch: () => getSocket().emit('impostor:start'),
      ready: () => getSocket().emit('impostor:ready'),
      sendClue: (clue) => getSocket().emit('impostor:clue', { clue }),
      skipClue: () => getSocket().emit('impostor:skipClue'),
      sendChat: (text) => getSocket().emit('impostor:chat', { text }),
      startVote: () => getSocket().emit('impostor:startVote'),
      vote: (targetId) => getSocket().emit('impostor:vote', { targetId }),
      forceVote: () => getSocket().emit('impostor:forceVote'),
      guess: (word) => getSocket().emit('impostor:guess', { word }),
      skipGuess: () => getSocket().emit('impostor:skipGuess'),
      nextRound: () => getSocket().emit('impostor:nextRound'),
      replay: () => getSocket().emit('impostor:replay'),
      tryRejoin: () => {
        const raw = sessionStorage.getItem('friends-impostor-session')
        if (!raw) return false
        try {
          const parsed = JSON.parse(raw) as { code?: string; playerId?: string }
          if (!parsed.code || !parsed.playerId) return false
          set({ playerId: parsed.playerId })
          get().connect()
          emitWhenConnected('impostor:rejoin', parsed)
          return true
        } catch {
          return false
        }
      },
      reset: () => {
        if (get().snapshot) getSocket().emit('impostor:leave')
        sessionStorage.removeItem('friends-impostor-session')
        set({ snapshot: null, playerId: null, view: 'menu', error: null, warning: null })
      },
    }),
    {
      name: 'friends-online',
      partialize: (state) => ({ myName: state.myName }),
    },
  ),
)
