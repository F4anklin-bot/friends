import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { Gender, GenderFilter } from '../../types/game'
import { initials } from '../../utils/helpers'

const INTERACT: { id: GenderFilter; label: string }[] = [
  { id: 'all', label: 'Les deux' },
  { id: 'female', label: 'Filles' },
  { id: 'male', label: 'Gars' },
]

interface PlayerSetupProps {
  min: number
  max?: number
  helper?: string
  optional?: boolean
  withGender?: boolean
  withInteract?: boolean
}

export function PlayerSetup({
  min,
  max = 20,
  helper,
  optional = false,
  withGender = false,
  withInteract = false,
}: PlayerSetupProps) {
  const players = useAppStore((state) => state.players)
  const addPlayer = useAppStore((state) => state.addPlayer)
  const removePlayer = useAppStore((state) => state.removePlayer)
  const setPlayerGender = useAppStore((state) => state.setPlayerGender)
  const setPlayerInteract = useAppStore((state) => state.setPlayerInteract)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('female')
  const [interact, setInteract] = useState<GenderFilter>('all')
  const [error, setError] = useState('')

  const submit = () => {
    if (players.length >= max) {
      setError(`Maximum ${max}.`)
      return
    }
    const ok = addPlayer(
      name,
      withGender || withInteract ? gender : undefined,
      withInteract ? interact : undefined,
    )
    if (!ok) {
      setError('Nom vide ou déjà pris.')
      return
    }
    setName('')
    setError('')
  }

  const interactLabel = (value?: GenderFilter) => {
    if (value === 'female') return 'Filles'
    if (value === 'male') return 'Gars'
    if (value === 'all') return 'Les deux'
    return '?'
  }

  return (
    <div className="space-y-4">
      {withGender || withInteract ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`rounded-2xl py-3 text-sm font-bold ${gender === 'female' ? 'bg-rose text-white' : 'glass'}`}
          >
            ♀ F
          </button>
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`rounded-2xl py-3 text-sm font-bold ${gender === 'male' ? 'bg-violet text-white' : 'glass'}`}
          >
            ♂ H
          </button>
        </div>
      ) : null}
      {withInteract ? (
        <div className="grid grid-cols-3 gap-2">
          {INTERACT.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setInteract(item.id)}
              className={`rounded-2xl py-3 text-xs font-bold ${interact === item.id ? 'bg-gold text-ink' : 'glass'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          value={name}
          placeholder="Prénom"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit()
          }}
          className="w-full border-0 border-b-2 border-violet/40 bg-transparent px-1 py-3 text-base outline-none transition focus:border-rose"
        />
        <button
          type="button"
          onClick={submit}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose text-white"
          aria-label="Ajouter"
        >
          <Plus size={20} />
        </button>
      </div>
      {error ? <p className="text-sm text-rose">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {players.map((player) => (
          <span
            key={player.id}
            className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm"
            style={{ background: `${player.color}22`, border: `1px solid ${player.color}55` }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: player.color }}
            >
              {initials(player.name)}
            </span>
            {player.name}
            {withGender || withInteract ? (
              <button
                type="button"
                className="rounded-full bg-white/10 px-2 text-[11px] font-bold"
                onClick={() => setPlayerGender(player.id, player.gender === 'male' ? 'female' : 'male')}
              >
                {player.gender === 'male' ? 'H' : player.gender === 'female' ? 'F' : '?'}
              </button>
            ) : null}
            {withInteract ? (
              <button
                type="button"
                className="rounded-full bg-white/10 px-2 text-[11px] font-bold"
                onClick={() => {
                  const order: GenderFilter[] = ['all', 'female', 'male']
                  const current = player.interact ?? 'all'
                  const next = order[(order.indexOf(current) + 1) % order.length] ?? 'all'
                  setPlayerInteract(player.id, next)
                }}
              >
                {interactLabel(player.interact)}
              </button>
            ) : null}
            <button type="button" onClick={() => removePlayer(player.id)} aria-label={`Retirer ${player.name}`}>
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      {helper || optional ? (
        <p className="text-xs text-ink/40 dark:text-white/40">
          {optional
            ? `${players.length} prénom${players.length > 1 ? 's' : ''} · optionnel`
            : `${players.length}/${max} · min. ${min}`}
          {helper ? ` · ${helper}` : ''}
        </p>
      ) : players.length > 0 && players.length < min ? (
        <p className="text-xs text-ink/40 dark:text-white/40">Encore {min - players.length}</p>
      ) : null}
    </div>
  )
}
