import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="glass w-full max-w-md rounded-3xl p-5"
          >
            <h2 className="font-heading text-xl font-bold">{title}</h2>
            <div className="mt-3 text-sm leading-relaxed text-ink/70 dark:text-white/70">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
