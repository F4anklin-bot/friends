import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

interface ScreenProps {
  children: ReactNode
  title?: string
  onBack?: () => void
  right?: ReactNode
}

export function Screen({ children, title, onBack, right }: ScreenProps) {
  return (
    <motion.main
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      {(title || onBack || right) && (
        <header className="mb-4 flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="glass flex h-11 w-11 items-center justify-center rounded-2xl"
              aria-label="Retour"
            >
              <ChevronLeft size={22} />
            </button>
          ) : (
            <span className="w-11" />
          )}
          <h1 className="flex-1 text-center font-heading text-lg font-bold">{title ?? ''}</h1>
          <div className="flex w-11 justify-end">{right}</div>
        </header>
      )}
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </motion.main>
  )
}
