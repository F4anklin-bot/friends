import { useEffect } from 'react'
import { motion } from 'framer-motion'

const LETTERS = ['F', 'r', 'i', 'e', 'n', 'd', 's']

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 2500)
    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
    >
      <motion.span
        className="pointer-events-none absolute h-[28rem] w-[28rem] rounded-full border border-rose/30"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.15, 1], opacity: [0, 0.7, 0.25] }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      <motion.span
        className="pointer-events-none absolute h-72 w-72 rounded-full border border-violet/40"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.08, 1], opacity: [0, 0.8, 0.35] }}
        transition={{ duration: 1.2, delay: 0.12, ease: 'easeOut' }}
      />
      <motion.span
        className="pointer-events-none absolute h-40 w-40 rounded-full bg-rose/20"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-gold"
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: Math.cos((i / 6) * Math.PI * 2) * 120,
            y: Math.sin((i / 6) * Math.PI * 2) * 120,
          }}
          transition={{ duration: 1.8, delay: 0.35 + i * 0.08, ease: 'easeOut' }}
        />
      ))}

      <div className="relative flex items-end">
        {LETTERS.map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            className="font-display text-7xl italic leading-none text-ink dark:text-white sm:text-8xl"
            initial={{ opacity: 0, y: 36, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.28 + index * 0.07, type: 'spring', stiffness: 380, damping: 18 }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      <motion.p
        className="relative mt-5 text-xs font-semibold uppercase tracking-[0.42em] text-rose"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.45 }}
      >
        Jeux de soirée
      </motion.p>

      <motion.span
        className="relative mt-8 h-1 w-16 rounded-full bg-violet"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      />
    </motion.div>
  )
}
