import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Gender, GenderFilter, Player, Screen } from '../types/game'
import { PLAYER_COLORS, uid } from '../utils/helpers'

interface AppState {
  screen: Screen
  players: Player[]
  setScreen: (screen: Screen) => void
  addPlayer: (name: string, gender?: Gender, interact?: GenderFilter) => boolean
  removePlayer: (id: string) => void
  renamePlayer: (id: string, name: string) => void
  setPlayerGender: (id: string, gender: Gender) => void
  setPlayerInteract: (id: string, interact: GenderFilter) => void
  resetScores: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'home',
      players: [],
      setScreen: (screen) => set({ screen }),
      addPlayer: (name, gender, interact) => {
        const trimmed = name.trim()
        if (!trimmed) return false
        const { players } = get()
        if (players.some((player) => player.name.toLowerCase() === trimmed.toLowerCase())) {
          return false
        }
        if (players.length >= 20) return false
        set({
          players: [
            ...players,
            {
              id: uid(),
              name: trimmed,
              color: PLAYER_COLORS[players.length % PLAYER_COLORS.length] ?? '#FF69B4',
              score: 0,
              gender,
              interact,
            },
          ],
        })
        return true
      },
      removePlayer: (id) => set({ players: get().players.filter((player) => player.id !== id) }),
      renamePlayer: (id, name) =>
        set({
          players: get().players.map((player) =>
            player.id === id ? { ...player, name } : player,
          ),
        }),
      setPlayerGender: (id, gender) =>
        set({
          players: get().players.map((player) =>
            player.id === id ? { ...player, gender } : player,
          ),
        }),
      setPlayerInteract: (id, interact) =>
        set({
          players: get().players.map((player) =>
            player.id === id ? { ...player, interact } : player,
          ),
        }),
      resetScores: () =>
        set({
          players: get().players.map((player) => ({ ...player, score: 0 })),
        }),
    }),
    {
      name: 'friends-app',
      partialize: (state) => ({ players: state.players }),
    },
  ),
)
