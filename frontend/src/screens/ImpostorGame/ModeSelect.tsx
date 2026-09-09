import { motion } from 'framer-motion'
import { Smartphone, Wifi } from 'lucide-react'
import { useImpostorStore } from '../../store/impostorStore'
import { useOnlineStore } from '../../store/onlineImpostorStore'

export function ModeSelect() {
  const setPlayMode = useImpostorStore((state) => state.setPlayMode)
  const setView = useOnlineStore((state) => state.setView)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <p className="text-center text-sm text-ink/60 dark:text-white/60">
        Un mot secret, des civils, un imposteur. Mr White n’a rien — s’il est démasqué, lui seul peut tenter le mot.
      </p>
      <button
        type="button"
        onClick={() => setPlayMode('offline')}
        className="glass flex w-full items-start gap-4 rounded-3xl p-4 text-left"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose text-white">
          <Smartphone />
        </span>
        <span>
          <span className="font-heading text-lg font-bold">Un téléphone</span>
          <span className="mt-1 block text-sm text-ink/60 dark:text-white/65">
            Offline. On se passe le tel pour les rôles, les indices et le vote.
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          setPlayMode('online')
          setView('menu')
        }}
        className="glass flex w-full items-start gap-4 rounded-3xl p-4 text-left"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet text-white">
          <Wifi />
        </span>
        <span>
          <span className="font-heading text-lg font-bold">En ligne avec des amis</span>
          <span className="mt-1 block text-sm text-ink/60 dark:text-white/65">
            Crée une partie, partage le code. Chacun joue sur son téléphone.
          </span>
        </span>
      </button>
    </motion.div>
  )
}
