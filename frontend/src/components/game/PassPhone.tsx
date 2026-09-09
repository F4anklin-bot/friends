import { motion } from 'framer-motion'
import { Button } from '../common/Button'
import { initials } from '../../utils/helpers'

interface PassPhoneProps {
  name: string
  color: string
  subtitle?: string
  cta?: string
  onConfirm: () => void
}

export function PassPhone({ name, color, subtitle = 'Passe le téléphone', cta = "C'est moi", onConfirm }: PassPhoneProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="mb-6 flex h-28 w-28 items-center justify-center rounded-full text-3xl font-heading font-extrabold text-white shadow-2xl"
        style={{ background: color }}
      >
        {initials(name)}
      </motion.div>
      <p className="text-sm uppercase tracking-[0.2em] text-violet">{subtitle}</p>
      <h2 className="mt-2 font-display text-4xl italic">{name}</h2>
      <p className="mt-3 max-w-xs text-sm text-ink/60 dark:text-white/60">
        Personne d’autre ne doit regarder l’écran.
      </p>
      <div className="mt-10 w-full">
        <Button onClick={onConfirm}>{cta}</Button>
      </div>
    </div>
  )
}
